function Start-PodeWebServer
{
    param (
        [switch]
        $Browse
    )

    # setup any inbuilt middleware
    $inbuilt_middleware = @(
        (Get-PodeAccessMiddleware),
        (Get-PodeLimitMiddleware),
        (Get-PodePublicMiddleware),
        (Get-PodeRouteValidateMiddleware),
        (Get-PodeBodyMiddleware),
        (Get-PodeQueryMiddleware)
    )

    $PodeContext.Server.Middleware = ($inbuilt_middleware + $PodeContext.Server.Middleware)

    # work out which endpoints to listen on
    $endpoints = @()
    $PodeContext.Server.Endpoints | ForEach-Object {
        # get the protocol
        $_protocol = (Resolve-PodeValue -Check $_.Ssl -TrueValue 'https' -FalseValue 'http')

        # get the ip address
        $_ip = "$($_.Address)"
        if ($_ip -ieq '0.0.0.0') {
            $_ip = '*'
        }

        # get the port
        $_port = [int]($_.Port)
        if ($_port -eq 0) {
            $_port = (Resolve-PodeValue $_.Ssl -TrueValue 8443 -FalseValue 8080)
        }

        # if this endpoint is https, generate a self-signed cert or bind an existing one
        if ($_.Ssl) {
            $addr = (Resolve-PodeValue -Check $_.IsIPAddress -TrueValue $_.Address -FalseValue $_.HostName)
            $selfSigned = $_.Certificate.SelfSigned
            Set-PodeCertificate -Address $addr -Port $_port -Certificate $_.Certificate.Name -Thumbprint $_.Certificate.Thumbprint -SelfSigned:$selfSigned
        }

        # add endpoint to list
        $endpoints += @{
            Prefix = "$($_protocol)://$($_ip):$($_port)/"
            HostName = "$($_protocol)://$($_.HostName):$($_port)/"
        }
    }

    # create the listener on http and/or https
    $listener = New-Object System.Net.HttpListener

    try
    {
        # start listening on defined endpoints
        $endpoints | ForEach-Object {
            $listener.Prefixes.Add($_.Prefix)
        }

        $listener.Start()
    }
    catch {
        $_ | Write-PodeErrorLog

        if ($null -ne $Listener) {
            if ($Listener.IsListening) {
                $Listener.Stop()
            }

            Close-PodeDisposable -Disposable $Listener -Close
        }

        throw $_.Exception
    }

    # script for listening out for incoming requests
    $listenScript = {
        param (
            [Parameter(Mandatory=$true)]
            [ValidateNotNull()]
            $Listener,

            [Parameter(Mandatory=$true)]
            [int]
            $ThreadId
        )

        try
        {
            while ($Listener.IsListening -and !$PodeContext.Tokens.Cancellation.IsCancellationRequested)
            {
                # get request and response
                $context = (Wait-PodeTask -Task $Listener.GetContextAsync())

                try
                {
                    $request = $context.Request
                    $response = $context.Response

                    # reset event data
                    $WebEvent = @{
                        OnEnd = @()
                        Auth = @{}
                        Response = $response
                        Request = $request
                        Lockable = $PodeContext.Lockable
                        Path = ($request.RawUrl -isplit "\?")[0]
                        Method = $request.HttpMethod.ToLowerInvariant()
                        Protocol = $request.Url.Scheme
                        Endpoint = $request.Url.Authority
                        ContentType = $request.ContentType
                        ErrorType = $null
                        Cookies = $request.Cookies
                        PendingCookies = @{}
                    }

                    # set pode in server response header
                    Set-PodeServerHeader

                    # add logging endware for post-request
                    Add-PodeRequestLogEndware -WebEvent $WebEvent

                    # invoke middleware
                    if ((Invoke-PodeMiddleware -WebEvent $WebEvent -Middleware $PodeContext.Server.Middleware -Route $WebEvent.Path)) {
                        # get the route logic
                        $route = Get-PodeRoute -Method $WebEvent.Method -Route $WebEvent.Path -Protocol $WebEvent.Protocol `
                            -Endpoint $WebEvent.Endpoint -CheckWildMethod

                        # invoke route and custom middleware
                        if ((Invoke-PodeMiddleware -WebEvent $WebEvent -Middleware $route.Middleware)) {
                            if ($null -ne $route.Logic) {
                                Invoke-PodeScriptBlock -ScriptBlock $route.Logic -Arguments (@($WebEvent) + @($route.Arguments)) -Scoped -Splat
                            }
                        }
                    }
                }
                catch {
                    Set-PodeResponseStatus -Code 500 -Exception $_
                    $_ | Write-PodeErrorLog
                }

                # invoke endware specifc to the current web event
                $_endware = ($WebEvent.OnEnd + @($PodeContext.Server.Endware))
                Invoke-PodeEndware -WebEvent $WebEvent -Endware $_endware

                # close response stream (check if exists, as closing the writer closes this stream on unix)
                if ($response.OutputStream) {
                    Close-PodeDisposable -Disposable $response.OutputStream -Close -CheckNetwork
                }
            }
        }
        catch [System.OperationCanceledException] {}
        catch {
            $_ | Write-PodeErrorLog
            throw $_.Exception
        }
    }

    # start the runspace for listening on x-number of threads
    1..$PodeContext.Threads | ForEach-Object {
        Add-PodeRunspace -Type 'Main' -ScriptBlock $listenScript `
            -Parameters @{ 'Listener' = $listener; 'ThreadId' = $_ }
    }

    # script to keep web server listening until cancelled
    $waitScript = {
        param (
            [Parameter(Mandatory=$true)]
            [ValidateNotNull()]
            $Listener
        )

        try
        {
            while ($Listener.IsListening -and !$PodeContext.Tokens.Cancellation.IsCancellationRequested)
            {
                Start-Sleep -Seconds 1
            }
        }
        catch [System.OperationCanceledException] {}
        catch {
            $_ | Write-PodeErrorLog
            throw $_.Exception
        }
        finally {
            if ($null -ne $Listener) {
                if ($Listener.IsListening) {
                    $Listener.Stop()
                }

                Close-PodeDisposable -Disposable $Listener -Close
            }
        }
    }

    Add-PodeRunspace -Type 'Main' -ScriptBlock $waitScript -Parameters @{ 'Listener' = $listener }

    # state where we're running
    Write-Host "Listening on the following $($endpoints.Length) endpoint(s) [$($PodeContext.Threads) thread(s)]:" -ForegroundColor Yellow

    $endpoints | ForEach-Object {
        Write-Host "`t- $($_.HostName)" -ForegroundColor Yellow
    }

    # browse to the first endpoint, if flagged
    if ($Browse) {
        Start-Process $endpoints[0].HostName
    }
}
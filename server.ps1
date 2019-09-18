#===========================================================================
#
# File: server.ps1
# Description: Testing viability of local site tool/api using Pode powershell module
#
#===========================================================================

Remove-Variable * -ErrorAction SilentlyContinue
[String]$scriptPath = $MyInvocation.MyCommand.Path
[String]$scriptDir = Split-Path -parent $scriptPath

Import-Module -Name ".\PodeSDTool\Pode\Pode.psm1"

add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

Start-PodeServer -Threads 4 -ScriptBlock {
	Add-PodeEndpoint -Address localhost -Port 8080 -Protocol Http
	Add-PodeAccessRule -Access Allow -Type IP -Values @('127.0.0.1', '[::1]')
	Set-PodeViewEngine -Type Pode
	Import-PodeModule -Name ActiveDirectory
	New-PodeLoggingMethod -Terminal | Enable-PodeErrorLogging

	Add-PodeRoute -Method Get -Path '/' -ScriptBlock {Write-PodeViewResponse -Path 'index'}

	#Main SDP api caller
	Add-PodeRoute -Method Post -Path '/api/v3/requests' -ScriptBlock {
		param($s)
		try {
			$apiURL = "$((Get-PodeConfig).MESDP)/requests"
			Write-PodeJsonResponse -Value (Invoke-RestMethod -Uri $apiURL -Method GET -Body @{"input_data"=($s.Data | ConvertTo-Json -Depth 8)} -Headers @{"TECHNICIAN_KEY" = (Get-PodeConfig).TechnicianKey;})
        }catch {
            Set-PodeResponseStatus -Code 500 -Description 'Oh no, something went wrong! Verify API paramaters are correct.' -Exception $_.Exception
        }
	}

	Add-PodeRoute -Method Post -Path '/api/v3/requests/:ID' -ScriptBlock {
		param($s)
		try {
			$requestID = $s.Parameters['ID']
			$apiURL = "$((Get-PodeConfig).MESDP)/requests/$requestID"
			Write-PodeJsonResponse -Value (Invoke-RestMethod -Uri $apiURL -Method GET -Body @{"input_data"=($s.Data | ConvertTo-Json -Depth 8)} -Headers @{"TECHNICIAN_KEY" = (Get-PodeConfig).TechnicianKey;})
        }catch {
            Set-PodeResponseStatus -Code 500 -Description 'Oh no, something went wrong! Verify API paramaters are correct.' -Exception $_.Exception
        }
	}

	Add-PodeRoute -Method Post -Path '/api/v3/requests/:ID/notes' -ScriptBlock {
		param($s)
		try {
			$requestID = $s.Parameters['ID']
			$apiURL = "$((Get-PodeConfig).MESDP)/requests/$requestID/notes"
			Write-PodeJsonResponse -Value (Invoke-RestMethod -Uri $apiURL -Method GET -Body @{"input_data"=($s.Data | ConvertTo-Json -Depth 8)} -Headers @{"TECHNICIAN_KEY" = (Get-PodeConfig).TechnicianKey;})
        }catch {
            Set-PodeResponseStatus -Code 500 -Description 'Oh no, something went wrong! Verify API paramaters are correct.' -Exception $_.Exception
        }
	}

	Add-PodeRoute -Method Post -Path '/api/v3/requests/:ID/conversations' -ScriptBlock {
		param($s)
		try {
			$requestID = $s.Parameters['ID']
			$apiURL = "$((Get-PodeConfig).MESDP)/requests/$requestID/conversations"
			Write-PodeJsonResponse -Value (Invoke-RestMethod -Uri $apiURL -Method GET -Body @{"input_data"=($s.Data | ConvertTo-Json -Depth 8)} -Headers @{"TECHNICIAN_KEY" = (Get-PodeConfig).TechnicianKey;})
        }catch {
            Set-PodeResponseStatus -Code 500 -Description 'Oh no, something went wrong! Verify API paramaters are correct.' -Exception $_.Exception
        }
	}

	Add-PodeRoute -Method Post -Path '/api/v3/requests/:ID/notifications' -ScriptBlock {
		param($s)
		try {
			$requestID = $s.Parameters['ID']
			$apiURL = "$((Get-PodeConfig).MESDP)/requests/$requestID/notifications"
			Write-PodeJsonResponse -Value (Invoke-RestMethod -Uri $apiURL -Method GET -Body @{"input_data"=($s.Data | ConvertTo-Json -Depth 8)} -Headers @{"TECHNICIAN_KEY" = (Get-PodeConfig).TechnicianKey;})
        }catch {
            Set-PodeResponseStatus -Code 500 -Description 'Oh no, something went wrong! Verify API paramaters are correct.' -Exception $_.Exception
        }
	}

	Add-PodeRoute -Method Get -Path '/api/v3/requests/:ID/notifications/:convID' -ScriptBlock {
		param($s)
		try {
			$requestID = $s.Parameters['ID']
			$convID = $s.Parameters['convID']
			$inputData = $s.Query["INPUT_DATA"]
			$apiURL = "$((Get-PodeConfig).MESDP)/requests/$requestID/notifications/$convID"
			Write-PodeJsonResponse -Value (Invoke-RestMethod -Uri $apiURL -Method GET -Body @{"input_data"=$inputData} -Headers @{"TECHNICIAN_KEY" = (Get-PodeConfig).TechnicianKey;})
        }catch {
            Set-PodeResponseStatus -Code 500 -Description 'Oh no, something went wrong! Verify API paramaters are correct.' -Exception $_.Exception
        }
	}

	Add-PodeRoute -Method Post -Path '/api/v3/requests/:ID/summary' -ScriptBlock {
		param($s)
		try {
			$requestID = $s.Parameters['ID']
			$apiURL = "$((Get-PodeConfig).MESDP)/requests/$requestID/summary"
			Write-PodeJsonResponse -Value (Invoke-RestMethod -Uri $apiURL -Method GET -Body @{"input_data"=($s.Data | ConvertTo-Json -Depth 8)} -Headers @{"TECHNICIAN_KEY" = (Get-PodeConfig).TechnicianKey;})
        }catch {
            Set-PodeResponseStatus -Code 500 -Description 'Oh no, something went wrong! Verify API paramaters are correct.' -Exception $_.Exception
        }
	}

	Add-PodeRoute -Method Post -Path '/api/ping' -ScriptBlock {
		param($s)

		try {
			$targetComputer = $s.Data.target

			if(Test-Connection $targetComputer -Quiet -Count 1){
				Set-PodeResponseStatus -Code 200 -ContentType 'application/json' 'Online'
			}else{
				Set-PodeResponseStatus -Code 408 -ContentType 'application/json' 'Offline'
			}
        }catch {
			Set-PodeResponseStatus -Code 500 -ContentType 'application/json' 'Error'
        }
	}

	Add-PodeRoute -Method Post -Path '/api/adp/user' -ScriptBlock {
		param($s)

		try {
			$userData = $s.Data.user
			$searchMode = $s.Data.mode
			$queryString = ""

			if($searchMode -eq "DisplayName") {
				$queryString = "displayname -like '$($userData)'"
			}else{
				$queryString = "sAMAccountName -like '$($userData)'"
			}

			$adResult = @(Get-ADuser -filter $queryString -Server:(Get-PodeConfig).Domain -SearchBase:"OU=UsersAndComputers,DC=domain,DC=org" -Properties telephoneNumber,otherTelephone,mobile,otherMobile,homephone,OfficePhone,PostalCode,Office,st,l,StreetAddress,physicalDeliveryOfficeName,displayName,name,givenName,sn,initials,employeeID,sAMAccountName,Title,department,company,description,info,manager,userAccountControl,homeDrive,objectClass,profilePath,whenChanged,whenCreated,pwdLastSet,sAMAccountType,primaryGroupID,PrincipalsAllowedToDelegateToAccount,PasswordExpired,PasswordLastSet,PasswordNeverExpires,PasswordNotRequired,AccountExpirationDate,LockedOut,LastLogonDate,ObjectGUID,ObjectCategory,mailNickname,mail,showInAddressBook,msExchHideFromAddressLists,extensionAttribute1,extensionAttribute2,extensionAttribute3,extensionAttribute4,extensionAttribute5,extensionAttribute6,extensionAttribute7,extensionAttribute8,extensionAttribute9,extensionAttribute10 | select telephoneNumber,otherTelephone,mobile,otherMobile,homephone,OfficePhone,PostalCode,Office,st,l,StreetAddress,physicalDeliveryOfficeName,displayName,name,givenName,sn,initials,employeeID,sAMAccountName,Title,department,company,description,info,manager,userAccountControl,homeDrive,objectClass,profilePath,whenChanged,whenCreated,pwdLastSet,sAMAccountType,primaryGroupID,PrincipalsAllowedToDelegateToAccount,PasswordExpired,PasswordLastSet,PasswordNeverExpires,PasswordNotRequired,AccountExpirationDate,LockedOut,LastLogonDate,ObjectGUID,ObjectCategory,mailNickname,mail,showInAddressBook,msExchHideFromAddressLists,extensionAttribute1,extensionAttribute2,extensionAttribute3,extensionAttribute4,extensionAttribute5,extensionAttribute6,extensionAttribute7,extensionAttribute8,extensionAttribute9,extensionAttribute10)

			Write-PodeJsonResponse -Value ($adResult | ConvertTo-Json -Depth 10 -Compress)
        }catch {
            Set-PodeResponseStatus -Code 500 -Description 'Oh no, something went wrong! Please verify that the Active Directory query paramaters are correct.' -Exception $_.Exception
        }
	}

	Add-PodeRoute -Method Post -Path '/api/adp/userGroupsRecursive' -ScriptBlock {
		param($s)

		try {
			$userData = $s.Data.user
			$queryString = "sAMAccountName -like '$($userData)'"

			function Get-UserMembership(){
				$userGroups = (Get-ADUser -filter $queryString -Server:(Get-PodeConfig).Domain -SearchBase:"OU=UsersAndComputers,DC=domain,DC=org" -Property MemberOf).MemberOf | ForEach-Object {Get-GroupMembers $_ 1}
				$formattedGroups = @{}

				foreach ($p in $userGroups) {
					$formattedGroups += $p
				}

				$formattedGroups
			}

			function Get-GroupMembers($group,$depth) {
				$group = Get-ADGroup -Identity $group -Property MemberOf
				$groups = @{[string]$group.Name=@{}}
				if(($group.MemberOf).Count -gt 0) {
					$depth = ($depth+1)
					foreach ($p in ($group.MemberOf)) {
						try {#Try block to catch/skip errors in finding child groups
							if($depth -lt 8){
								$groups[[string]$group.Name] += (Get-GroupMembers $p $depth)
							}
						}catch {}
					}
				}
				$groups
			}

			Write-PodeJsonResponse -Value ((Get-UserMembership) | ConvertTo-Json -Depth 8 -Compress)
        }catch {
            Set-PodeResponseStatus -Code 500 -Description 'Oh no, something went wrong! Please verify that the Active Directory query paramaters are correct.' -Exception $_.Exception
        }
	}

	Add-PodeRoute -Method Get -Path '/api/adp/refreshCache' -ScriptBlock {
		try {
			$reportdate = (Get-Date -Format u);
			$reportdate | Out-File -FilePath ".\PodeSDTool\public\api\mainCacheLastUpdate.json";

			#Write-Host "$(Get-Date -Format u) Starting user export.";
			$jsonFilePath = ".\PodeSDTool\public\api\Cached_ADUsers.json";
			Get-ADUser -Filter * -Server:(Get-PodeConfig).Domain -Properties DisplayName,sAMAccountName,GivenName,Surname,Mail,Enabled,Name,EmployeeID | % {
				New-Object PSObject -Property @{
					LogonName      = $_.sAMAccountName;
					Displayname    = $_.DisplayName;
					Name           = $_.Name;
					FirstName      = $_.GivenName;
					LastName       = $_.Surname;
					Email          = $_.Mail;
					EmployeeID     = $_.EmployeeID;
					AccountEnabled = if (($_.Enabled -eq 'TRUE')  ) {'Enabled'} Else {'Disabled'};
				}
			} | Select LogonName, Displayname, Name, FirstName, LastName, Email, EmployeeID, AccountEnabled | ConvertTo-Json -Compress | Out-File -FilePath $jsonFilePath;
			#Write-Host "$(Get-Date -Format u) ADUser query complete and file saved, now re-formatting JSON.";
			$jsonFile = Get-Content -Path $jsonFilePath;
			$jsonFile = $jsonFile -replace ':null',':""'

			$jsonFile | Out-File $jsonFilePath;
			#Write-Host "$(Get-Date -Format u) User JSON modifications complete.";

			#Write-Host "$(Get-Date -Format u) Starting groups export.";
			$jsonFilePath = ".\PodeSDTool\public\api\Cached_ADGroups.json";
			Get-ADGroup -Filter * -Server:(Get-PodeConfig).Domain -Properties GroupCategory,Name,SamAccountName,Created,Description | % {
				New-Object PSObject -Property @{
					Name              = $_.Name;
					SamAccountName    = $_.SamAccountName;
					GroupCategory     = $_.GroupCategory;
					CreatedDate       = $_.Created;
					Description       = $_.Description;
				}
			} | Select Name, SamAccountName, GroupCategory, CreatedDate, Description | ConvertTo-Json -Compress | Out-File -FilePath $jsonFilePath;
			#Write-Host "$(Get-Date -Format u) ADGroup query complete and file saved, now re-formatting JSON.";
			$jsonFile = Get-Content -Path $jsonFilePath;
			$jsonFile = $jsonFile -replace ':null',':""'

			$jsonFile | Out-File $jsonFilePath;
			#Write-Host "$(Get-Date -Format u) Group JSON modifications complete.";

			#Write-Host "$(Get-Date -Format u) Starting groups export.";
			$jsonFilePath = ".\PodeSDTool\public\api\Cached_ADComputers.json";
			Get-ADComputer -Filter * -Server:(Get-PodeConfig).Domain -Properties LastBadPasswordAttempt,Description,Enabled,IPv4Address,LastLogonDate,DNSHostName,Location,Name | % {
				New-Object PSObject -Property @{
					LastBadPasswordAttempt	= $_.LastBadPasswordAttempt;
					Description				= $_.Description;
					Enabled					= $_.Enabled;
					IPv4Address				= $_.IPv4Address;
					LastLogonDate			= $_.LastLogonDate;
					DNSHostName				= $_.DNSHostName;
					Location				= $_.Location;
					Name					= $_.Name;
				}
			} | Select LastBadPasswordAttempt,Description,Enabled,IPv4Address,LastLogonDate,DNSHostName,Location,Name | ConvertTo-Json -Compress | Out-File -FilePath $jsonFilePath;
			#Write-Host "$(Get-Date -Format u) ADGroup query complete and file saved, now re-formatting JSON.";
			$jsonFile = Get-Content -Path $jsonFilePath;
			$jsonFile = $jsonFile -replace ':null',':""'

			$jsonFile | Out-File $jsonFilePath;
			#Write-Host "$(Get-Date -Format u) Group JSON modifications complete.";

			Write-PodeTextResponse -Value "$(Get-Date -Format u) AD Cache refresh finished."
        }catch {
            Set-PodeResponseStatus -Code 500 -Description 'Oh no, something went wrong! Failed to refresh AD cache.' -Exception $_.Exception
        }
	}
}

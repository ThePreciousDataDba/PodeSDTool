@{
	Domain = ""
	MESDP = "https://******/api/v3"
	TechnicianKey = ""
    Web = @{
        Static = @{
            Defaults = @(
                'index.html',
                'default.html',
				'blank.html'
            )
            Cache = @{
                Enable = $true
                MaxAge = 15
                Include = @(
                    '*.jpg',
					'*.png'
                )
            }
        }
        ErrorPages = @{
            ShowExceptions = $true
            StrictContentTyping = $true
        }
    }
    Server = @{
        Logging = @{
            Masking = @{
                Patterns = @(
                    '(?<keep_before>Password=)\w+',
                    '(?<keep_before>AppleWebKit\/)\d+\.\d+(?(<keep_after)\s+\(KHTML)'
                )
                Mask = '--MASKED--'
            }
        }
    }
}

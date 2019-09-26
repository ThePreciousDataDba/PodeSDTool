@{
	DomainController = "123.domain.org"
	SDPLink = "https://sdp.website.org"
	SDPDomain = "domain"
	SDPTechnicianKey = "1-1-11-1-1"
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
					'*.png',
					'*.css',
					'*.js'
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

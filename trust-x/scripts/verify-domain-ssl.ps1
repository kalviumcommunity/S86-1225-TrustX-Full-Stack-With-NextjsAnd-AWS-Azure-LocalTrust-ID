# PowerShell Domain & SSL Verification Script
# Windows equivalent of verify-domain-ssl.sh

param(
    [Parameter(Mandatory=$false)]
    [string]$Domain = "yourdomain.com",
    
    [Parameter(Mandatory=$false)]
    [string]$Subdomain = "www"
)

$PassCount = 0
$FailCount = 0
$WarnCount = 0

function Pass-Test {
    param([string]$Message)
    Write-Host "✓ PASS: $Message" -ForegroundColor Green
    $script:PassCount++
}

function Fail-Test {
    param([string]$Message)
    Write-Host "✗ FAIL: $Message" -ForegroundColor Red
    $script:FailCount++
}

function Warn-Test {
    param([string]$Message)
    Write-Host "⚠ WARN: $Message" -ForegroundColor Yellow
    $script:WarnCount++
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Domain & SSL Verification" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Domain: $Domain" -ForegroundColor Green
Write-Host "Subdomain: $Subdomain.$Domain" -ForegroundColor Green
Write-Host ""

# ============================================
# Test 1: DNS Resolution
# ============================================
Write-Host "Test 1: DNS Resolution" -ForegroundColor Cyan
Write-Host "---"

try {
    $DnsResult = Resolve-DnsName -Name $Domain -ErrorAction Stop
    Pass-Test "Root domain resolves: $Domain"
    $IP = $DnsResult | Where-Object { $_.Type -eq 'A' } | Select-Object -First 1 -ExpandProperty IPAddress
    if ($IP) {
        Write-Host "   IP: $IP"
    }
} catch {
    Fail-Test "Root domain does not resolve: $Domain"
}

try {
    $WwwResult = Resolve-DnsName -Name "$Subdomain.$Domain" -ErrorAction Stop
    Pass-Test "Subdomain resolves: $Subdomain.$Domain"
} catch {
    Fail-Test "Subdomain does not resolve: $Subdomain.$Domain"
}

Write-Host ""

# ============================================
# Test 2: HTTPS Connectivity
# ============================================
Write-Host "Test 2: HTTPS Connectivity" -ForegroundColor Cyan
Write-Host "---"

try {
    $Response = Invoke-WebRequest -Uri "https://$Domain" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($Response.StatusCode -in @(200, 301, 302)) {
        Pass-Test "HTTPS accessible: https://$Domain"
    } else {
        Fail-Test "HTTPS returned status code: $($Response.StatusCode)"
    }
} catch {
    Fail-Test "HTTPS not accessible: https://$Domain - $($_.Exception.Message)"
}

try {
    $WwwResponse = Invoke-WebRequest -Uri "https://$Subdomain.$Domain" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($WwwResponse.StatusCode -in @(200, 301, 302)) {
        Pass-Test "HTTPS accessible: https://$Subdomain.$Domain"
    }
} catch {
    Warn-Test "HTTPS not accessible: https://$Subdomain.$Domain"
}

Write-Host ""

# ============================================
# Test 3: HTTP to HTTPS Redirect
# ============================================
Write-Host "Test 3: HTTP → HTTPS Redirect" -ForegroundColor Cyan
Write-Host "---"

try {
    $HttpResponse = Invoke-WebRequest -Uri "http://$Domain" -MaximumRedirection 0 -UseBasicParsing -ErrorAction Stop
    Warn-Test "HTTP did not redirect (or test failed)"
} catch {
    if ($_.Exception.Response.StatusCode -in @(301, 302, 307, 308)) {
        $Location = $_.Exception.Response.Headers['Location']
        if ($Location -like "https://*") {
            Pass-Test "HTTP redirects to HTTPS"
        } else {
            Warn-Test "HTTP redirects but not to HTTPS: $Location"
        }
    } else {
        Fail-Test "HTTP does not redirect to HTTPS"
    }
}

Write-Host ""

# ============================================
# Test 4: SSL Certificate Validation
# ============================================
Write-Host "Test 4: SSL Certificate" -ForegroundColor Cyan
Write-Host "---"

try {
    $TcpClient = New-Object System.Net.Sockets.TcpClient($Domain, 443)
    $SslStream = New-Object System.Net.Security.SslStream($TcpClient.GetStream(), $false)
    $SslStream.AuthenticateAsClient($Domain)
    $Certificate = $SslStream.RemoteCertificate
    
    Pass-Test "SSL certificate valid"
    
    $Cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($Certificate)
    Write-Host "   Issuer: $($Cert.Issuer)"
    Write-Host "   Subject: $($Cert.Subject)"
    Write-Host "   Expires: $($Cert.NotAfter)"
    
    # Check issuer
    if ($Cert.Issuer -match "Amazon|DigiCert|Microsoft") {
        Pass-Test "Certificate from trusted CA"
    } else {
        Warn-Test "Certificate issuer not recognized: $($Cert.Issuer)"
    }
    
    # Check expiration
    $DaysUntilExpiry = ($Cert.NotAfter - (Get-Date)).Days
    if ($DaysUntilExpiry -gt 30) {
        Pass-Test "Certificate valid for $DaysUntilExpiry days"
    } elseif ($DaysUntilExpiry -gt 0) {
        Warn-Test "Certificate expires in $DaysUntilExpiry days (renewal needed soon)"
    } else {
        Fail-Test "Certificate expired!"
    }
    
    $SslStream.Close()
    $TcpClient.Close()
} catch {
    Fail-Test "Could not retrieve SSL certificate: $($_.Exception.Message)"
}

Write-Host ""

# ============================================
# Test 5: Security Headers
# ============================================
Write-Host "Test 5: Security Headers" -ForegroundColor Cyan
Write-Host "---"

try {
    $Response = Invoke-WebRequest -Uri "https://$Domain" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $Headers = $Response.Headers
    
    # Check HSTS
    if ($Headers['Strict-Transport-Security']) {
        Pass-Test "HSTS header present"
        Write-Host "   Value: $($Headers['Strict-Transport-Security'])"
    } else {
        Fail-Test "HSTS header missing"
    }
    
    # Check X-Content-Type-Options
    if ($Headers['X-Content-Type-Options'] -eq 'nosniff') {
        Pass-Test "X-Content-Type-Options: nosniff"
    } else {
        Warn-Test "X-Content-Type-Options header missing"
    }
    
    # Check X-Frame-Options
    if ($Headers['X-Frame-Options']) {
        Pass-Test "X-Frame-Options present"
    } else {
        Warn-Test "X-Frame-Options header missing"
    }
    
    # Check Content-Security-Policy
    if ($Headers['Content-Security-Policy']) {
        Pass-Test "Content-Security-Policy present"
    } else {
        Warn-Test "Content-Security-Policy header missing"
    }
    
    # Check X-XSS-Protection
    if ($Headers['X-XSS-Protection']) {
        Pass-Test "X-XSS-Protection present"
    } else {
        Warn-Test "X-XSS-Protection header missing"
    }
} catch {
    Warn-Test "Cannot check security headers: $($_.Exception.Message)"
}

Write-Host ""

# ============================================
# Test 6: Application Health
# ============================================
Write-Host "Test 6: Application Health" -ForegroundColor Cyan
Write-Host "---"

try {
    $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $Response = Invoke-WebRequest -Uri "https://$Domain" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $Stopwatch.Stop()
    
    if ($Response.StatusCode -eq 200) {
        Pass-Test "Homepage loads (HTTP 200)"
    } else {
        Fail-Test "Homepage returns HTTP $($Response.StatusCode)"
    }
    
    $ResponseTime = $Stopwatch.Elapsed.TotalSeconds
    Write-Host "   Response time: $([math]::Round($ResponseTime, 2))s"
    
    if ($ResponseTime -lt 2) {
        Pass-Test "Fast response time (< 2s)"
    } elseif ($ResponseTime -lt 5) {
        Warn-Test "Moderate response time (< 5s)"
    } else {
        Fail-Test "Slow response time (> 5s)"
    }
} catch {
    Fail-Test "Cannot test application: $($_.Exception.Message)"
}

# Check API health
try {
    $ApiResponse = Invoke-WebRequest -Uri "https://$Domain/api/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($ApiResponse.StatusCode -eq 200) {
        Pass-Test "API health endpoint responds"
    }
} catch {
    Warn-Test "API health endpoint not accessible"
}

Write-Host ""

# ============================================
# Test 7: Mixed Content Check
# ============================================
Write-Host "Test 7: Mixed Content" -ForegroundColor Cyan
Write-Host "---"

try {
    $Response = Invoke-WebRequest -Uri "https://$Domain" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $Content = $Response.Content
    
    $HttpLinks = ([regex]::Matches($Content, 'http://[^"]*')).Count
    
    if ($HttpLinks -eq 0) {
        Pass-Test "No mixed content detected"
    } else {
        Warn-Test "Possible mixed content: $HttpLinks HTTP links found"
        Write-Host "   Check browser console for mixed content warnings"
    }
} catch {
    Warn-Test "Cannot check mixed content"
}

Write-Host ""

# ============================================
# Summary
# ============================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$TotalTests = $PassCount + $FailCount + $WarnCount

Write-Host "Passed:  $PassCount / $TotalTests" -ForegroundColor Green
Write-Host "Failed:  $FailCount / $TotalTests" -ForegroundColor Red
Write-Host "Warnings: $WarnCount / $TotalTests" -ForegroundColor Yellow
Write-Host ""

if ($FailCount -eq 0) {
    Write-Host "✓ All critical tests passed!" -ForegroundColor Green
    Write-Host "✓ Your domain and SSL setup is production-ready!" -ForegroundColor Green
    $ExitCode = 0
} elseif ($FailCount -le 2) {
    Write-Host "⚠ Some tests failed. Review the failures above." -ForegroundColor Yellow
    Write-Host "⚠ Your setup may still work, but improvements are recommended." -ForegroundColor Yellow
    $ExitCode = 1
} else {
    Write-Host "✗ Multiple tests failed. Your setup needs attention." -ForegroundColor Red
    Write-Host "✗ Review the failures above and fix issues before going live." -ForegroundColor Red
    $ExitCode = 2
}

Write-Host ""
Write-Host "Additional Checks:" -ForegroundColor Cyan
Write-Host "  - SSL Labs Test: https://www.ssllabs.com/ssltest/analyze.html?d=$Domain"
Write-Host "  - Security Headers: https://securityheaders.com/?q=$Domain"
Write-Host "  - DNS Checker: https://dnschecker.org/#A/$Domain"
Write-Host ""

exit $ExitCode

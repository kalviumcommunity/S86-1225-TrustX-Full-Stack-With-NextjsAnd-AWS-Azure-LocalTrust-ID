# ============================================
# Domain & SSL Verification Script
# ============================================
# Comprehensive verification of domain and SSL setup
# Tests: DNS resolution, SSL certificates, HTTPS redirect,
# security headers, and overall site health
# ============================================

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${1:-yourdomain.com}"
SUBDOMAIN="${2:-www}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Domain & SSL Verification${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Domain: ${GREEN}${DOMAIN}${NC}"
echo -e "Subdomain: ${GREEN}${SUBDOMAIN}.${DOMAIN}${NC}"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass_test() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    PASS_COUNT=$((PASS_COUNT + 1))
}

fail_test() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

warn_test() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
    WARN_COUNT=$((WARN_COUNT + 1))
}

# ============================================
# Test 1: DNS Resolution
# ============================================
echo -e "${BLUE}Test 1: DNS Resolution${NC}"
echo "---"

# Check if nslookup is available
if command -v nslookup >/dev/null 2>&1; then
    DNS_RESULT=$(nslookup "${DOMAIN}" 2>&1)
    if echo "$DNS_RESULT" | grep -q "Address:"; then
        pass_test "Root domain resolves: ${DOMAIN}"
        IP=$(echo "$DNS_RESULT" | grep "Address:" | tail -1 | awk '{print $2}')
        echo "   IP: $IP"
    else
        fail_test "Root domain does not resolve: ${DOMAIN}"
    fi
    
    WWW_RESULT=$(nslookup "${SUBDOMAIN}.${DOMAIN}" 2>&1)
    if echo "$WWW_RESULT" | grep -q "Address:\|canonical name"; then
        pass_test "Subdomain resolves: ${SUBDOMAIN}.${DOMAIN}"
    else
        fail_test "Subdomain does not resolve: ${SUBDOMAIN}.${DOMAIN}"
    fi
else
    warn_test "nslookup not available, skipping DNS check"
fi

echo ""

# ============================================
# Test 2: HTTPS Connectivity
# ============================================
echo -e "${BLUE}Test 2: HTTPS Connectivity${NC}"
echo "---"

if command -v curl >/dev/null 2>&1; then
    # Test root domain HTTPS
    if curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}" | grep -q "200\|301\|302"; then
        pass_test "HTTPS accessible: https://${DOMAIN}"
    else
        fail_test "HTTPS not accessible: https://${DOMAIN}"
    fi
    
    # Test subdomain HTTPS
    if curl -s -o /dev/null -w "%{http_code}" "https://${SUBDOMAIN}.${DOMAIN}" | grep -q "200\|301\|302"; then
        pass_test "HTTPS accessible: https://${SUBDOMAIN}.${DOMAIN}"
    else
        warn_test "HTTPS not accessible: https://${SUBDOMAIN}.${DOMAIN}"
    fi
else
    fail_test "curl not available, cannot test HTTPS"
fi

echo ""

# ============================================
# Test 3: HTTP to HTTPS Redirect
# ============================================
echo -e "${BLUE}Test 3: HTTP → HTTPS Redirect${NC}"
echo "---"

if command -v curl >/dev/null 2>&1; then
    HTTP_RESPONSE=$(curl -s -I -L -w "%{http_code}" "http://${DOMAIN}" 2>&1)
    if echo "$HTTP_RESPONSE" | grep -q "301\|302"; then
        if echo "$HTTP_RESPONSE" | grep -q "Location: https"; then
            pass_test "HTTP redirects to HTTPS"
        else
            warn_test "HTTP redirects but not to HTTPS"
        fi
    else
        fail_test "HTTP does not redirect to HTTPS"
    fi
else
    warn_test "curl not available, cannot test redirect"
fi

echo ""

# ============================================
# Test 4: SSL Certificate Validation
# ============================================
echo -e "${BLUE}Test 4: SSL Certificate${NC}"
echo "---"

if command -v openssl >/dev/null 2>&1; then
    CERT_INFO=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null | openssl x509 -noout -dates -subject -issuer 2>/dev/null)
    
    if [ -n "$CERT_INFO" ]; then
        pass_test "SSL certificate valid"
        
        # Extract certificate details
        ISSUER=$(echo "$CERT_INFO" | grep "issuer=" | cut -d'=' -f2-)
        NOT_AFTER=$(echo "$CERT_INFO" | grep "notAfter=" | cut -d'=' -f2-)
        SUBJECT=$(echo "$CERT_INFO" | grep "subject=" | cut -d'=' -f2-)
        
        echo "   Issuer: $ISSUER"
        echo "   Subject: $SUBJECT"
        echo "   Expires: $NOT_AFTER"
        
        # Check if certificate is from trusted CA (AWS or Azure)
        if echo "$ISSUER" | grep -qi "amazon\|digicert\|microsoft"; then
            pass_test "Certificate from trusted CA"
        else
            warn_test "Certificate issuer not recognized: $ISSUER"
        fi
        
        # Check expiration date
        if command -v date >/dev/null 2>&1; then
            EXPIRY_EPOCH=$(date -d "$NOT_AFTER" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$NOT_AFTER" +%s 2>/dev/null)
            CURRENT_EPOCH=$(date +%s)
            DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
            
            if [ $DAYS_UNTIL_EXPIRY -gt 30 ]; then
                pass_test "Certificate valid for $DAYS_UNTIL_EXPIRY days"
            elif [ $DAYS_UNTIL_EXPIRY -gt 0 ]; then
                warn_test "Certificate expires in $DAYS_UNTIL_EXPIRY days (renewal needed soon)"
            else
                fail_test "Certificate expired!"
            fi
        fi
    else
        fail_test "Could not retrieve SSL certificate"
    fi
else
    warn_test "openssl not available, cannot verify certificate"
fi

echo ""

# ============================================
# Test 5: Security Headers
# ============================================
echo -e "${BLUE}Test 5: Security Headers${NC}"
echo "---"

if command -v curl >/dev/null 2>&1; then
    HEADERS=$(curl -s -I "https://${DOMAIN}" 2>&1)
    
    # Check HSTS
    if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
        pass_test "HSTS header present"
        HSTS_VALUE=$(echo "$HEADERS" | grep -i "Strict-Transport-Security" | cut -d':' -f2-)
        echo "   Value: $HSTS_VALUE"
    else
        fail_test "HSTS header missing"
    fi
    
    # Check X-Content-Type-Options
    if echo "$HEADERS" | grep -qi "X-Content-Type-Options.*nosniff"; then
        pass_test "X-Content-Type-Options: nosniff"
    else
        warn_test "X-Content-Type-Options header missing"
    fi
    
    # Check X-Frame-Options
    if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
        pass_test "X-Frame-Options present"
    else
        warn_test "X-Frame-Options header missing"
    fi
    
    # Check Content-Security-Policy
    if echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
        pass_test "Content-Security-Policy present"
    else
        warn_test "Content-Security-Policy header missing"
    fi
    
    # Check X-XSS-Protection
    if echo "$HEADERS" | grep -qi "X-XSS-Protection"; then
        pass_test "X-XSS-Protection present"
    else
        warn_test "X-XSS-Protection header missing"
    fi
else
    warn_test "curl not available, cannot check security headers"
fi

echo ""

# ============================================
# Test 6: TLS Protocol Version
# ============================================
echo -e "${BLUE}Test 6: TLS Protocol${NC}"
echo "---"

if command -v openssl >/dev/null 2>&1; then
    # Check TLS 1.2 support
    if echo | openssl s_client -connect "${DOMAIN}:443" -tls1_2 2>&1 | grep -q "Protocol.*TLSv1.2"; then
        pass_test "TLS 1.2 supported"
    else
        warn_test "TLS 1.2 not confirmed"
    fi
    
    # Check TLS 1.3 support
    if echo | openssl s_client -connect "${DOMAIN}:443" -tls1_3 2>&1 | grep -q "Protocol.*TLSv1.3"; then
        pass_test "TLS 1.3 supported"
    else
        warn_test "TLS 1.3 not available (not critical)"
    fi
    
    # Check for weak protocols (should fail)
    if echo | openssl s_client -connect "${DOMAIN}:443" -ssl3 2>&1 | grep -q "Protocol.*SSLv3"; then
        fail_test "SSLv3 enabled (INSECURE)"
    else
        pass_test "SSLv3 disabled (good)"
    fi
    
    if echo | openssl s_client -connect "${DOMAIN}:443" -tls1 2>&1 | grep -q "Protocol.*TLSv1"; then
        warn_test "TLS 1.0 enabled (deprecated)"
    else
        pass_test "TLS 1.0 disabled (good)"
    fi
else
    warn_test "openssl not available, cannot check TLS versions"
fi

echo ""

# ============================================
# Test 7: Certificate Chain
# ============================================
echo -e "${BLUE}Test 7: Certificate Chain${NC}"
echo "---"

if command -v openssl >/dev/null 2>&1; then
    CHAIN_OUTPUT=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>&1)
    
    if echo "$CHAIN_OUTPUT" | grep -q "Verify return code: 0"; then
        pass_test "Certificate chain valid"
    else
        VERIFY_ERROR=$(echo "$CHAIN_OUTPUT" | grep "Verify return code:" | cut -d':' -f2-)
        fail_test "Certificate chain issue: $VERIFY_ERROR"
    fi
    
    # Count certificates in chain
    CERT_COUNT=$(echo "$CHAIN_OUTPUT" | grep -c "BEGIN CERTIFICATE")
    if [ $CERT_COUNT -ge 2 ]; then
        pass_test "Certificate chain complete ($CERT_COUNT certificates)"
    else
        warn_test "Certificate chain may be incomplete ($CERT_COUNT certificates)"
    fi
else
    warn_test "openssl not available, cannot verify certificate chain"
fi

echo ""

# ============================================
# Test 8: Application Health
# ============================================
echo -e "${BLUE}Test 8: Application Health${NC}"
echo "---"

if command -v curl >/dev/null 2>&1; then
    # Check homepage
    HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}" 2>&1)
    if [ "$HOME_STATUS" = "200" ]; then
        pass_test "Homepage loads (HTTP 200)"
    else
        fail_test "Homepage returns HTTP $HOME_STATUS"
    fi
    
    # Check API health endpoint
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/health" 2>&1)
    if [ "$API_STATUS" = "200" ]; then
        pass_test "API health endpoint responds"
    else
        warn_test "API health endpoint returns HTTP $API_STATUS"
    fi
    
    # Check response time
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "https://${DOMAIN}" 2>&1)
    echo "   Response time: ${RESPONSE_TIME}s"
    
    if command -v bc >/dev/null 2>&1; then
        if [ $(echo "$RESPONSE_TIME < 2" | bc) -eq 1 ]; then
            pass_test "Fast response time (< 2s)"
        elif [ $(echo "$RESPONSE_TIME < 5" | bc) -eq 1 ]; then
            warn_test "Moderate response time (< 5s)"
        else
            fail_test "Slow response time (> 5s)"
        fi
    fi
else
    warn_test "curl not available, cannot test application"
fi

echo ""

# ============================================
# Test 9: Mixed Content Check
# ============================================
echo -e "${BLUE}Test 9: Mixed Content${NC}"
echo "---"

if command -v curl >/dev/null 2>&1; then
    PAGE_CONTENT=$(curl -s "https://${DOMAIN}" 2>&1)
    
    # Check for http:// links in HTML
    HTTP_LINKS=$(echo "$PAGE_CONTENT" | grep -o 'http://[^"]*' | wc -l)
    
    if [ $HTTP_LINKS -eq 0 ]; then
        pass_test "No mixed content detected"
    else
        warn_test "Possible mixed content: $HTTP_LINKS HTTP links found"
        echo "   Check browser console for mixed content warnings"
    fi
else
    warn_test "curl not available, cannot check mixed content"
fi

echo ""

# ============================================
# Summary
# ============================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))

echo -e "${GREEN}Passed:  $PASS_COUNT / $TOTAL_TESTS${NC}"
echo -e "${RED}Failed:  $FAIL_COUNT / $TOTAL_TESTS${NC}"
echo -e "${YELLOW}Warnings: $WARN_COUNT / $TOTAL_TESTS${NC}"

echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All critical tests passed!${NC}"
    echo -e "${GREEN}✓ Your domain and SSL setup is production-ready!${NC}"
    EXIT_CODE=0
elif [ $FAIL_COUNT -le 2 ]; then
    echo -e "${YELLOW}⚠ Some tests failed. Review the failures above.${NC}"
    echo -e "${YELLOW}⚠ Your setup may still work, but improvements are recommended.${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}✗ Multiple tests failed. Your setup needs attention.${NC}"
    echo -e "${RED}✗ Review the failures above and fix issues before going live.${NC}"
    EXIT_CODE=2
fi

echo ""
echo -e "${BLUE}Additional Checks:${NC}"
echo "  - SSL Labs Test: https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}"
echo "  - Security Headers: https://securityheaders.com/?q=${DOMAIN}"
echo "  - DNS Checker: https://dnschecker.org/#A/${DOMAIN}"
echo ""

exit $EXIT_CODE

# Domain & SSL Setup Guide

Complete guide for configuring custom domains and SSL certificates for the TrustX application on AWS or Azure.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [AWS Setup (Route 53 + ACM)](#aws-setup-route-53--acm)
- [Azure Setup (Azure DNS + App Service Certificate)](#azure-setup-azure-dns--app-service-certificate)
- [DNS Configuration Details](#dns-configuration-details)
- [SSL Certificate Management](#ssl-certificate-management)
- [Verification Steps](#verification-steps)
- [Troubleshooting](#troubleshooting)
- [Cost Analysis](#cost-analysis)
- [Reflection](#reflection)

---

## Overview

This setup enables:

- ✅ **Custom Domain**: Access your app via `yourdomain.com` instead of cloud provider URLs
- ✅ **SSL/TLS Encryption**: Secure HTTPS connections with valid certificates
- ✅ **Automatic Renewal**: No manual certificate management required
- ✅ **SEO Benefits**: HTTPS is a ranking factor for search engines
- ✅ **User Trust**: Padlock icon (🔒) builds confidence

### Architecture

```
User Request (http://yourdomain.com)
         ↓
    DNS Resolution (Route 53 / Azure DNS)
         ↓
    Load Balancer / App Service
         ↓
    SSL Termination (ACM / App Service Certificate)
         ↓
    HTTPS Redirect (HTTP → HTTPS)
         ↓
    Application Container (Next.js)
```

---

## Prerequisites

### Required

- ✅ **Domain Name**: Registered with any registrar (Namecheap, GoDaddy, Google Domains, etc.)
- ✅ **Cloud Account**: AWS or Azure account with active subscription
- ✅ **Deployed Application**: ECS service (AWS) or App Service (Azure) must be running
- ✅ **CLI Tools**: AWS CLI or Azure CLI installed and configured

### Optional

- DNS management access to your domain registrar
- Understanding of DNS record types (A, CNAME, TXT)
- Basic knowledge of SSL/TLS certificates

---

## AWS Setup (Route 53 + ACM)

### Quick Start (Automated)

```bash
# Make script executable
chmod +x scripts/setup-aws-domain-ssl.sh

# Run setup script
./scripts/setup-aws-domain-ssl.sh yourdomain.com trustx-app

# Script will:
# 1. Create Route 53 hosted zone
# 2. Display nameservers to update at registrar
# 3. Create DNS records (A, CNAME)
# 4. Request ACM certificate
# 5. Add DNS validation records automatically
# 6. Wait for certificate validation
# 7. Configure HTTPS listener on load balancer
# 8. Enable HTTP → HTTPS redirect
```

### Manual Setup Steps

#### 1. Create Route 53 Hosted Zone

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s) \
  --hosted-zone-config Comment="Production domain"

# Get nameservers
aws route53 get-hosted-zone --id ZONE_ID --query 'DelegationSet.NameServers'
```

**Output example:**
```json
[
  "ns-123.awsdns-12.com",
  "ns-456.awsdns-45.net",
  "ns-789.awsdns-78.org",
  "ns-012.awsdns-01.co.uk"
]
```

#### 2. Update Nameservers at Domain Registrar

Go to your domain registrar (Namecheap, GoDaddy, etc.) and update nameservers to the ones provided by Route 53.

**Propagation time:** 1-48 hours (typically 1-2 hours)

#### 3. Create DNS Records

**A Record (Root Domain):**
```bash
# Get load balancer DNS name
LB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns YOUR_LB_ARN \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

# Create A record (alias to load balancer)
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "LB_HOSTED_ZONE_ID",
          "DNSName": "'$LB_DNS'",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

**CNAME Record (www subdomain):**
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.yourdomain.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "yourdomain.com"}]
      }
    }]
  }'
```

#### 4. Request ACM Certificate

```bash
# Request certificate for domain and wildcard subdomain
CERT_ARN=$(aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names "*.yourdomain.com" \
  --validation-method DNS \
  --query 'CertificateArn' \
  --output text)

echo "Certificate ARN: $CERT_ARN"

# Get DNS validation records
aws acm describe-certificate \
  --certificate-arn $CERT_ARN \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
```

#### 5. Add DNS Validation Record

```bash
# Add CNAME validation record to Route 53
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_validation.yourdomain.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "validation-value.acm-validations.aws"}]
      }
    }]
  }'

# Wait for validation (5-30 minutes)
aws acm wait certificate-validated --certificate-arn $CERT_ARN
```

#### 6. Configure HTTPS Listener

```bash
# Create HTTPS listener on load balancer
aws elbv2 create-listener \
  --load-balancer-arn YOUR_LB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=YOUR_TG_ARN

# Modify HTTP listener to redirect to HTTPS
aws elbv2 modify-listener \
  --listener-arn YOUR_HTTP_LISTENER_ARN \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"
```

---

## Azure Setup (Azure DNS + App Service Certificate)

### Quick Start (Automated)

```bash
# Make script executable
chmod +x scripts/setup-azure-domain-ssl.sh

# Run setup script
./scripts/setup-azure-domain-ssl.sh yourdomain.com trustx-app trustx-app-rg

# Script will:
# 1. Create Azure DNS zone
# 2. Display nameservers to update at registrar
# 3. Create DNS records (A, CNAME, TXT)
# 4. Add custom domains to App Service
# 5. Create managed SSL certificates
# 6. Bind certificates to domains
# 7. Enable HTTPS-only mode
```

### Manual Setup Steps

#### 1. Create Azure DNS Zone

```bash
# Create DNS zone
az network dns zone create \
  --resource-group trustx-app-rg \
  --name yourdomain.com

# Get nameservers
az network dns zone show \
  --resource-group trustx-app-rg \
  --name yourdomain.com \
  --query "nameServers"
```

#### 2. Update Nameservers at Domain Registrar

Update nameservers at your domain registrar to Azure's nameservers.

#### 3. Create DNS Records

**A Record (Root Domain):**
```bash
# Get App Service IP
APP_IP=$(az webapp show \
  --name trustx-app-webapp \
  --resource-group trustx-app-rg \
  --query "outboundIpAddresses" \
  --output tsv | cut -d',' -f1)

# Create A record
az network dns record-set a add-record \
  --resource-group trustx-app-rg \
  --zone-name yourdomain.com \
  --record-set-name "@" \
  --ipv4-address $APP_IP
```

**CNAME Record (www):**
```bash
# Get App Service hostname
APP_HOST=$(az webapp show \
  --name trustx-app-webapp \
  --resource-group trustx-app-rg \
  --query "defaultHostName" \
  --output tsv)

# Create CNAME record
az network dns record-set cname set-record \
  --resource-group trustx-app-rg \
  --zone-name yourdomain.com \
  --record-set-name "www" \
  --cname $APP_HOST
```

**TXT Record (Verification):**
```bash
# Get verification ID
VERIFICATION_ID=$(az webapp show \
  --name trustx-app-webapp \
  --resource-group trustx-app-rg \
  --query "customDomainVerificationId" \
  --output tsv)

# Create TXT record for root domain
az network dns record-set txt add-record \
  --resource-group trustx-app-rg \
  --zone-name yourdomain.com \
  --record-set-name "asuid" \
  --value $VERIFICATION_ID

# Create TXT record for www
az network dns record-set txt add-record \
  --resource-group trustx-app-rg \
  --zone-name yourdomain.com \
  --record-set-name "asuid.www" \
  --value $VERIFICATION_ID
```

#### 4. Add Custom Domains to App Service

```bash
# Add root domain
az webapp config hostname add \
  --webapp-name trustx-app-webapp \
  --resource-group trustx-app-rg \
  --hostname yourdomain.com

# Add www subdomain
az webapp config hostname add \
  --webapp-name trustx-app-webapp \
  --resource-group trustx-app-rg \
  --hostname www.yourdomain.com
```

#### 5. Create and Bind SSL Certificates

```bash
# Create managed certificate for root domain
az webapp config ssl create \
  --resource-group trustx-app-rg \
  --name trustx-app-webapp \
  --hostname yourdomain.com

# Create managed certificate for www
az webapp config ssl create \
  --resource-group trustx-app-rg \
  --name trustx-app-webapp \
  --hostname www.yourdomain.com

# Certificates are automatically bound (SNI SSL)
```

#### 6. Enable HTTPS-Only Mode

```bash
az webapp update \
  --name trustx-app-webapp \
  --resource-group trustx-app-rg \
  --https-only true
```

---

## DNS Configuration Details

### Record Types Explained

| Record Type | Purpose | Example |
|-------------|---------|---------|
| **A** | Maps domain to IPv4 address | `yourdomain.com → 52.12.34.56` |
| **CNAME** | Creates alias for another domain | `www.yourdomain.com → yourdomain.com` |
| **TXT** | Stores text data (verification, SPF) | `asuid.yourdomain.com → verification-id` |
| **NS** | Delegates DNS to nameservers | `yourdomain.com → ns-123.awsdns-12.com` |

### DNS Records Summary

**AWS Route 53:**
```
Type    Name                    Value
----    ----                    -----
NS      yourdomain.com          ns-123.awsdns-12.com
                                ns-456.awsdns-45.net
                                ns-789.awsdns-78.org
                                ns-012.awsdns-01.co.uk

A       yourdomain.com          Alias → ELB-123.us-east-1.elb.amazonaws.com
CNAME   www.yourdomain.com      yourdomain.com
CNAME   _validation             validation-value.acm-validations.aws
```

**Azure DNS:**
```
Type    Name                    Value
----    ----                    -----
NS      yourdomain.com          ns1-01.azure-dns.com
                                ns2-01.azure-dns.net
                                ns3-01.azure-dns.org
                                ns4-01.azure-dns.info

A       @                       52.12.34.56 (App Service IP)
CNAME   www                     trustx-app-webapp.azurewebsites.net
TXT     asuid                   verification-id-123
TXT     asuid.www               verification-id-123
```

---

## SSL Certificate Management

### AWS Certificate Manager (ACM)

**Features:**
- ✅ Free SSL certificates
- ✅ Automatic renewal (no action required)
- ✅ Wildcard certificates supported (`*.yourdomain.com`)
- ✅ Integrated with ELB, CloudFront, API Gateway
- ✅ DNS validation (automatic via Route 53)

**Certificate Lifecycle:**
1. **Requested** → Certificate created but not validated
2. **Pending Validation** → DNS record must be added
3. **Issued** → Certificate active and ready to use
4. **Renewal** → Automatic 60 days before expiration

**Renewal Process:**
- ACM automatically renews certificates 60 days before expiration
- If using DNS validation with Route 53, renewal is fully automatic
- No manual intervention required

### Azure App Service Managed Certificate

**Features:**
- ✅ Free SSL certificates for custom domains
- ✅ Automatic renewal every 6 months
- ✅ SNI SSL binding (supports multiple domains on one IP)
- ✅ Integrated with App Service
- ⚠️ No wildcard certificate support (individual per subdomain)

**Certificate Lifecycle:**
1. **Created** → Certificate provisioned for domain
2. **Bound** → Certificate attached to custom domain
3. **Active** → HTTPS enabled
4. **Auto-Renewed** → Happens automatically every 6 months

**Limitations:**
- Cannot export managed certificates
- Only works with App Service (can't use with VM, Function App)
- Requires domain to be added to App Service first

---

## Verification Steps

### 1. DNS Propagation Check

**Check nameservers:**
```bash
# Using nslookup
nslookup -type=NS yourdomain.com

# Using dig (Linux/Mac)
dig NS yourdomain.com +short

# Online tools
https://dnschecker.org
https://whatsmydns.net
```

**Check A record:**
```bash
nslookup yourdomain.com
dig A yourdomain.com
```

**Check CNAME record:**
```bash
nslookup www.yourdomain.com
dig CNAME www.yourdomain.com
```

### 2. SSL Certificate Verification

**Browser Check:**
1. Visit `https://yourdomain.com`
2. Look for 🔒 padlock icon in address bar
3. Click padlock → Certificate details
4. Verify:
   - Issued by: Amazon or Microsoft
   - Valid dates (not expired)
   - Domain name matches

**SSL Labs Test:**
```
https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

**Expected Grade:** A or A+

**OpenSSL Command Line:**
```bash
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

**Check certificate details:**
```bash
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null | openssl x509 -noout -dates -subject -issuer
```

### 3. HTTPS Redirect Test

**Test HTTP → HTTPS redirect:**
```bash
curl -I http://yourdomain.com

# Expected response:
HTTP/1.1 301 Moved Permanently
Location: https://yourdomain.com/
```

**Browser test:**
1. Type `http://yourdomain.com` (without https://)
2. Browser should redirect to `https://yourdomain.com`
3. URL bar should show https:// with padlock

### 4. Security Headers Check

```bash
curl -I https://yourdomain.com
```

**Expected headers:**
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

**Online tool:**
```
https://securityheaders.com/?q=yourdomain.com
```

### 5. Full Application Test

✅ **Homepage:** `https://yourdomain.com` loads correctly  
✅ **WWW Subdomain:** `https://www.yourdomain.com` works  
✅ **API Endpoints:** `https://yourdomain.com/api/health` responds  
✅ **Static Assets:** Images, CSS, JS load over HTTPS  
✅ **Mixed Content:** No HTTP resources on HTTPS pages (check DevTools Console)

---

## Troubleshooting

### DNS Issues

**Problem:** Domain doesn't resolve

**Solutions:**
1. Check nameserver configuration at registrar
2. Wait for DNS propagation (up to 48 hours)
3. Clear DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

4. Test with different DNS servers:
   ```bash
   nslookup yourdomain.com 8.8.8.8  # Google DNS
   nslookup yourdomain.com 1.1.1.1  # Cloudflare DNS
   ```

**Problem:** CNAME record creates redirect loop

**Solution:** Don't create CNAME for root domain; use A record instead.

### SSL Certificate Issues

**Problem:** Certificate validation pending

**AWS Solutions:**
- Verify DNS validation CNAME record was added correctly
- Check Route 53 hosted zone has correct records
- Wait up to 30 minutes for validation

**Azure Solutions:**
- Verify TXT records (asuid) were added
- Ensure custom domain was added to App Service first
- Wait up to 10 minutes for validation

**Problem:** Certificate shows "Not Secure" warning

**Solutions:**
1. Certificate expired → Check renewal status
2. Domain mismatch → Certificate doesn't cover subdomain
3. Mixed content → Page loads HTTP resources on HTTPS page
4. Certificate not bound → Check load balancer/App Service configuration

### HTTPS Redirect Issues

**Problem:** HTTP doesn't redirect to HTTPS

**AWS Solutions:**
- Check load balancer listener rules
- Verify HTTP listener has redirect action
- Test directly with load balancer URL

**Azure Solutions:**
- Verify HTTPS-only mode is enabled
- Check Application Gateway rules (if used)
- Review App Service configuration

**Problem:** Redirect loop

**Solutions:**
1. Check `x-forwarded-proto` header is being passed
2. Verify Next.js redirect configuration
3. Disable application-level redirect if platform handles it

---

## Cost Analysis

### AWS Costs

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **Route 53 Hosted Zone** | $0.50 | Per hosted zone |
| **Route 53 Queries** | $0.40 per million | First 1B queries/month |
| **ACM Certificate** | **FREE** | Unlimited certificates |
| **Load Balancer** | ~$16-30 | Already included in ECS setup |

**Total Additional:** ~$1-2/month (just for DNS)

### Azure Costs

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **Azure DNS Zone** | $0.50 | Per zone (first 25) |
| **DNS Queries** | $0.40 per million | First 1B queries/month |
| **App Service Certificate** | **FREE** | Managed certificates |
| **App Service** | ~$13-55 | Already included in deployment |

**Total Additional:** ~$1-2/month (just for DNS)

### Domain Registration Costs

| Registrar | .com Domain | .net Domain | Notes |
|-----------|-------------|-------------|-------|
| **Namecheap** | $9-13/year | $11-14/year | Privacy protection included |
| **GoDaddy** | $12-20/year | $13-22/year | First year discounted |
| **Google Domains** | $12/year | $12/year | Simple pricing |
| **AWS Route 53** | $12/year | $12/year | Integrated with AWS |

**Recommendation:** Namecheap or Google Domains for best value.

### Cost Optimization Tips

1. **Use DNS Alias Records:** Free for AWS load balancers (instead of A records)
2. **Minimize DNS Queries:** Use longer TTL values where appropriate
3. **Wildcard Certificates:** One cert for multiple subdomains (AWS ACM only)
4. **Free Alternatives:** Use Cloudflare (free tier) for DNS + SSL proxy

---

## Reflection

### Key Learnings

#### 1. **DNS is Critical Infrastructure**

DNS is often overlooked but is the foundation of web accessibility. Understanding DNS record types, propagation, and nameserver delegation is essential for any production deployment.

**Lessons:**
- DNS propagation can take hours; plan accordingly
- Always test with multiple DNS resolvers
- Keep DNS TTL values reasonable (300-3600 seconds)
- Document your DNS configuration for disaster recovery

#### 2. **Automation Prevents Human Error**

Manual SSL setup is error-prone. Automating certificate issuance, validation, and renewal through ACM or App Service Certificates eliminates:
- Expired certificates causing outages
- Incorrect validation records
- Forgotten renewal dates
- Manual certificate installation steps

**Key Insight:** Let the platform manage certificates; focus on application logic.

#### 3. **HTTPS is Non-Negotiable**

HTTPS is now a baseline requirement, not a luxury:
- **Security:** Prevents MITM attacks, data theft
- **SEO:** Google ranks HTTPS sites higher
- **Browser:** Modern browsers warn users about HTTP sites
- **Compliance:** PCI DSS, HIPAA require encryption in transit

**Modern Standard:** 100% of production traffic should be HTTPS.

#### 4. **Layer Security with HSTS**

Setting `Strict-Transport-Security` header prevents protocol downgrade attacks:
- Browser remembers to always use HTTPS
- Prevents SSL stripping attacks
- Include `preload` for Chrome's HSTS list

**Implementation:** Already configured in `next.config.ts` security headers.

#### 5. **Multi-Environment Strategy**

Professional cloud architecture uses subdomains for different environments:
- `api.yourdomain.com` → API server
- `dev.yourdomain.com` → Development environment
- `staging.yourdomain.com` → QA/Staging
- `yourdomain.com` → Production

**Benefits:**
- Isolates environments
- Enables A/B testing
- Simplifies CI/CD workflows
- Better security boundaries

### Challenges Faced

#### 1. **DNS Propagation Delays**

**Challenge:** DNS changes can take 1-48 hours to propagate globally.

**Solution:**
- Use low TTL values (300 seconds) before making changes
- Test with multiple DNS resolvers (8.8.8.8, 1.1.1.1)
- Use `dig` or `nslookup` to verify specific nameservers
- Don't panic; propagation is eventual consistency

#### 2. **Certificate Validation Timing**

**Challenge:** ACM certificate validation can take 5-30 minutes.

**Solution:**
- Use DNS validation (faster than email)
- Automate validation record creation
- Use `aws acm wait certificate-validated` to block until ready
- Monitor certificate status with CloudWatch

#### 3. **Platform Differences**

**Challenge:** AWS and Azure handle SSL differently:
- AWS: Certificate attached to load balancer
- Azure: Certificate bound to App Service domain

**Solution:**
- Document platform-specific steps
- Create separate automation scripts
- Test on both platforms
- Use platform-native certificate managers

### Best Practices

1. **Document Everything**
   - Record nameservers, DNS records, certificate ARNs
   - Screenshot working configuration
   - Keep runbooks for disaster recovery

2. **Test Before Production**
   - Use staging domain first (`staging.yourdomain.com`)
   - Test certificate renewal process
   - Verify redirect behavior

3. **Monitor Certificate Expiration**
   - Set up alerts for certificate expiration (even if auto-renewing)
   - Monitor with CloudWatch (AWS) or Application Insights (Azure)
   - Test renewal process annually

4. **Security Hardening**
   - Enable HSTS with `preload`
   - Disable TLS 1.0 and 1.1 (use 1.2+ only)
   - Configure strong cipher suites
   - Monitor with SSL Labs monthly

5. **Backup DNS Configuration**
   - Export Route 53 zone file regularly
   - Keep DNS records in version control (Infrastructure as Code)
   - Test disaster recovery process

### Production Readiness Checklist

Before going live with your custom domain:

- [ ] Domain registered and nameservers updated
- [ ] DNS records created and propagated
- [ ] SSL certificate issued and validated
- [ ] HTTPS listener/binding configured
- [ ] HTTP → HTTPS redirect working
- [ ] Padlock icon (🔒) shows in browser
- [ ] SSL Labs test shows A or A+ grade
- [ ] No mixed content warnings
- [ ] Security headers configured (HSTS, CSP)
- [ ] Certificate auto-renewal confirmed
- [ ] Monitoring and alerts set up
- [ ] Documentation updated with domain details
- [ ] Disaster recovery plan documented

---

## Next Steps

1. **Set up subdomain strategy:**
   ```bash
   api.yourdomain.com → API server
   admin.yourdomain.com → Admin panel
   cdn.yourdomain.com → Static assets (via CloudFront/Azure CDN)
   ```

2. **Implement CDN:**
   - CloudFront (AWS) or Azure CDN for static assets
   - Reduces latency globally
   - SSL termination at edge locations

3. **Add monitoring:**
   - CloudWatch (AWS) or Application Insights (Azure)
   - Monitor certificate expiration
   - Track DNS query patterns
   - Alert on SSL errors

4. **Consider Cloudflare:**
   - Free SSL proxy
   - DDoS protection
   - Global CDN
   - Can sit in front of AWS/Azure

5. **Infrastructure as Code:**
   - Terraform or Pulumi for DNS configuration
   - Version control your infrastructure
   - Automate disaster recovery

---

## Additional Resources

### Documentation

- **AWS Route 53:** https://docs.aws.amazon.com/route53/
- **AWS ACM:** https://docs.aws.amazon.com/acm/
- **Azure DNS:** https://docs.microsoft.com/en-us/azure/dns/
- **Azure App Service SSL:** https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-certificate

### Tools

- **DNS Checker:** https://dnschecker.org
- **SSL Labs:** https://www.ssllabs.com/ssltest/
- **Security Headers:** https://securityheaders.com
- **Certificate Transparency:** https://crt.sh

### Learning

- **How DNS Works:** https://howdns.works/
- **SSL/TLS Explained:** https://howhttps.works/
- **OWASP Security Headers:** https://owasp.org/www-project-secure-headers/

---

## Summary

You've successfully configured:

✅ Custom domain with professional DNS setup  
✅ SSL/TLS certificates with automatic renewal  
✅ HTTPS-only access with automatic redirects  
✅ Security headers for enhanced protection  
✅ Platform-specific optimization (AWS or Azure)

Your application is now production-ready with enterprise-grade security and accessibility! 🔒✨


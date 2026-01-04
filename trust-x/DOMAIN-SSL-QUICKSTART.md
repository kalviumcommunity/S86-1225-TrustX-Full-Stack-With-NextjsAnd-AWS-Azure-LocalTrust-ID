# Domain & SSL Setup - Quick Start

Fast-track guide for setting up custom domain and SSL certificate.

## Prerequisites

- Domain registered (e.g., from Namecheap, GoDaddy)
- Application deployed on AWS ECS or Azure App Service
- AWS CLI or Azure CLI installed and configured

---

## AWS Setup (5 Steps)

### 1. Run Automated Script

```bash
chmod +x scripts/setup-aws-domain-ssl.sh
./scripts/setup-aws-domain-ssl.sh yourdomain.com trustx-app
```

### 2. Update Nameservers

Script will display nameservers. Update them at your domain registrar:

```
ns-123.awsdns-12.com
ns-456.awsdns-45.net
ns-789.awsdns-78.org
ns-012.awsdns-01.co.uk
```

### 3. Wait for Validation

Script automatically:
- Creates DNS records
- Requests ACM certificate
- Adds validation records
- Configures HTTPS listener

**Time:** 10-30 minutes for certificate validation

### 4. Verify

```bash
# Check DNS
nslookup yourdomain.com

# Test HTTPS
curl -I https://yourdomain.com

# Visit in browser
https://yourdomain.com
```

### 5. Confirm SSL

✅ Padlock icon (🔒) in browser address bar  
✅ Certificate details show "Issued by: Amazon"  
✅ HTTP redirects to HTTPS automatically

---

## Azure Setup (5 Steps)

### 1. Run Automated Script

```bash
chmod +x scripts/setup-azure-domain-ssl.sh
./scripts/setup-azure-domain-ssl.sh yourdomain.com trustx-app trustx-app-rg
```

### 2. Update Nameservers

Script will display nameservers. Update them at your domain registrar:

```
ns1-01.azure-dns.com
ns2-01.azure-dns.net
ns3-01.azure-dns.org
ns4-01.azure-dns.info
```

### 3. Wait for Setup

Script automatically:
- Creates DNS zone and records
- Adds custom domains to App Service
- Creates managed SSL certificates
- Enables HTTPS-only mode

**Time:** 5-15 minutes total

### 4. Verify

```bash
# Check DNS
nslookup yourdomain.com

# Test HTTPS
curl -I https://yourdomain.com

# Visit in browser
https://yourdomain.com
```

### 5. Confirm SSL

✅ Padlock icon (🔒) in browser address bar  
✅ Certificate details show "Issued by: Microsoft"  
✅ HTTP redirects to HTTPS automatically

---

## DNS Record Summary

### AWS Route 53

```
Type    Name                Value
A       yourdomain.com      → Load Balancer (alias)
CNAME   www                 → yourdomain.com
CNAME   _validation         → ACM validation record
```

### Azure DNS

```
Type    Name                Value
A       @                   → App Service IP
CNAME   www                 → App Service URL
TXT     asuid               → Verification ID
TXT     asuid.www           → Verification ID
```

---

## Verification Checklist

- [ ] DNS resolves to correct IP/hostname
- [ ] `https://yourdomain.com` loads successfully
- [ ] `https://www.yourdomain.com` works
- [ ] Padlock icon (🔒) shows in browser
- [ ] HTTP → HTTPS redirect works
- [ ] No mixed content warnings
- [ ] SSL Labs test: https://www.ssllabs.com/ssltest/

---

## Troubleshooting

### DNS not resolving

```bash
# Wait for propagation (up to 48 hours)
# Check with Google DNS
nslookup yourdomain.com 8.8.8.8

# Clear local DNS cache
ipconfig /flushdns  # Windows
sudo dscacheutil -flushcache  # Mac
```

### Certificate validation pending

**AWS:**
- Check validation CNAME record is correct
- Wait up to 30 minutes

**Azure:**
- Verify TXT records were added
- Ensure custom domain added to App Service first

### HTTPS not working

```bash
# Check certificate status
aws acm describe-certificate --certificate-arn YOUR_CERT_ARN  # AWS
az webapp config ssl list --resource-group YOUR_RG  # Azure

# Verify listener/binding configured
aws elbv2 describe-listeners --load-balancer-arn YOUR_LB_ARN  # AWS
az webapp show --name YOUR_APP --resource-group YOUR_RG --query "httpsOnly"  # Azure
```

---

## What Happens Behind the Scenes

1. **DNS Resolution**
   - User enters `yourdomain.com`
   - DNS query → Route 53/Azure DNS
   - Returns IP of Load Balancer/App Service

2. **SSL Handshake**
   - Browser connects to server
   - Server presents SSL certificate
   - Browser verifies certificate validity
   - Encrypted connection established

3. **HTTPS Redirect**
   - If HTTP request received
   - Load Balancer/App Service redirects to HTTPS
   - Next.js app serves content over HTTPS

4. **Content Delivery**
   - Encrypted data transfer
   - Security headers applied
   - Browser shows padlock icon (🔒)

---

## Cost Breakdown

### AWS
- Route 53 Hosted Zone: **$0.50/month**
- ACM Certificate: **FREE**
- DNS Queries: **$0.40** per million
- **Total: ~$1/month**

### Azure
- Azure DNS Zone: **$0.50/month**
- App Service Certificate: **FREE**
- DNS Queries: **$0.40** per million
- **Total: ~$1/month**

**Plus domain registration:** ~$10-15/year

---

## Next Steps

1. **Test thoroughly:**
   ```bash
   # SSL Labs test
   https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
   
   # Security headers check
   https://securityheaders.com/?q=yourdomain.com
   ```

2. **Set up monitoring:**
   - CloudWatch (AWS) or Application Insights (Azure)
   - Alert on certificate expiration
   - Monitor DNS query patterns

3. **Add more subdomains:**
   ```bash
   api.yourdomain.com → API server
   admin.yourdomain.com → Admin panel
   ```

4. **Consider CDN:**
   - CloudFront (AWS) or Azure CDN
   - Improves global performance

5. **Document your setup:**
   - Record nameservers, certificate ARNs
   - Update README.md with domain info
   - Screenshot working configuration

---

## Support & Resources

- **Full Guide:** See `DOMAIN-SSL-SETUP-GUIDE.md`
- **AWS Docs:** https://docs.aws.amazon.com/route53/
- **Azure Docs:** https://docs.microsoft.com/en-us/azure/dns/
- **DNS Tools:** https://dnschecker.org
- **SSL Test:** https://www.ssllabs.com/ssltest/

---

## Summary

✅ Custom domain configured  
✅ SSL certificate issued and active  
✅ HTTPS-only access enabled  
✅ Automatic certificate renewal  
✅ Production-ready security

**Your app is now accessible at `https://yourdomain.com` with full SSL encryption! 🔒**


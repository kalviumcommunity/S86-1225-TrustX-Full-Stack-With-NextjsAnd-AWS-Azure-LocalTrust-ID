# Logging and Monitoring - Documentation Index

## 📚 Quick Navigation

Choose the document that best fits your needs:

### 🚀 Getting Started
- **[LOGGING-QUICKSTART.md](LOGGING-QUICKSTART.md)** - Start here! Quick setup in 5 minutes
  - Choose your cloud platform
  - Run setup script
  - View your logs
  - Sample queries to get started

### 📖 Complete Guide
- **[LOGGING-MONITORING.md](LOGGING-MONITORING.md)** - Comprehensive documentation
  - Architecture overview
  - Detailed setup instructions
  - Usage examples
  - Best practices
  - Troubleshooting guide
  - 200+ lines of detailed information

### 🖼️ Visual Guide
- **[LOGGING-SCREENSHOTS.md](LOGGING-SCREENSHOTS.md)** - Screenshots and examples
  - Dashboard layouts
  - Sample log entries
  - Query results
  - Alert configurations
  - Expected outcomes

### ✅ Implementation Summary
- **[LOGGING-IMPLEMENTATION-SUMMARY.md](LOGGING-IMPLEMENTATION-SUMMARY.md)** - What was implemented
  - Completed tasks checklist
  - File structure overview
  - Performance impact
  - Next steps

---

## 🎯 Use Case Guide

### I want to... 

**...quickly set up logging**
→ Read [LOGGING-QUICKSTART.md](LOGGING-QUICKSTART.md)

**...understand the architecture**
→ Read "Architecture Overview" in [LOGGING-MONITORING.md](LOGGING-MONITORING.md)

**...see examples of logs and queries**
→ Read [LOGGING-SCREENSHOTS.md](LOGGING-SCREENSHOTS.md)

**...configure AWS CloudWatch**
→ Read "AWS CloudWatch Setup" in [LOGGING-MONITORING.md](LOGGING-MONITORING.md)

**...configure Azure Monitor**
→ Read "Azure Monitor Setup" in [LOGGING-MONITORING.md](LOGGING-MONITORING.md)

**...add logging to my API routes**
→ Read "Usage in Code" in [LOGGING-QUICKSTART.md](LOGGING-QUICKSTART.md)

**...find specific errors**
→ Use queries from [scripts/cloudwatch-queries.txt](scripts/cloudwatch-queries.txt) or [scripts/azure-monitor-queries.txt](scripts/azure-monitor-queries.txt)

**...set up alerts**
→ Read "Alerts and Notifications" in [LOGGING-MONITORING.md](LOGGING-MONITORING.md)

**...troubleshoot issues**
→ Read "Troubleshooting" in [LOGGING-MONITORING.md](LOGGING-MONITORING.md)

**...see what was implemented**
→ Read [LOGGING-IMPLEMENTATION-SUMMARY.md](LOGGING-IMPLEMENTATION-SUMMARY.md)

---

## 📁 Files Overview

### Documentation Files

| File | Purpose | Size | When to Read |
|------|---------|------|--------------|
| [LOGGING-QUICKSTART.md](LOGGING-QUICKSTART.md) | Quick start guide | ~150 lines | First |
| [LOGGING-MONITORING.md](LOGGING-MONITORING.md) | Complete documentation | ~800 lines | Reference |
| [LOGGING-SCREENSHOTS.md](LOGGING-SCREENSHOTS.md) | Visual guide | ~400 lines | Examples |
| [LOGGING-IMPLEMENTATION-SUMMARY.md](LOGGING-IMPLEMENTATION-SUMMARY.md) | Implementation summary | ~300 lines | Overview |
| [README.md](README.md#logging-and-monitoring) | Main README section | ~200 lines | Introduction |

### Code Files

| File | Purpose |
|------|---------|
| [src/lib/logger.ts](src/lib/logger.ts) | Core logging utility |
| [src/lib/requestLogger.ts](src/lib/requestLogger.ts) | Request correlation middleware |
| [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts) | Example: Authentication logging |
| [src/app/api/users/route.ts](src/app/api/users/route.ts) | Example: API route logging |

### Setup Scripts

| Script | Platform | OS |
|--------|----------|-----|
| [scripts/setup-cloudwatch.sh](scripts/setup-cloudwatch.sh) | AWS | Linux/Mac |
| [scripts/setup-cloudwatch.ps1](scripts/setup-cloudwatch.ps1) | AWS | Windows |
| [scripts/setup-azure-monitor.sh](scripts/setup-azure-monitor.sh) | Azure | Linux/Mac |

### Query References

| File | Platform | Queries |
|------|----------|---------|
| [scripts/cloudwatch-queries.txt](scripts/cloudwatch-queries.txt) | AWS | 15+ examples |
| [scripts/azure-monitor-queries.txt](scripts/azure-monitor-queries.txt) | Azure | 18+ examples |

### Testing Scripts

| Script | Purpose | OS |
|--------|---------|-----|
| [scripts/test-logging.sh](scripts/test-logging.sh) | Validate logging setup | Linux/Mac |
| [scripts/test-logging.ps1](scripts/test-logging.ps1) | Validate logging setup | Windows |

---

## 🎓 Learning Path

### Beginner (1-2 hours)
1. Read [LOGGING-QUICKSTART.md](LOGGING-QUICKSTART.md)
2. Run setup script for your platform
3. Test with [scripts/test-logging.sh](scripts/test-logging.sh)
4. View logs in cloud console
5. Try 2-3 sample queries

### Intermediate (3-4 hours)
1. Read "Usage in Code" section in [LOGGING-QUICKSTART.md](LOGGING-QUICKSTART.md)
2. Add logging to one of your API routes
3. Configure alerts with custom thresholds
4. Create a custom dashboard
5. Review [LOGGING-SCREENSHOTS.md](LOGGING-SCREENSHOTS.md)

### Advanced (1 day)
1. Read complete [LOGGING-MONITORING.md](LOGGING-MONITORING.md)
2. Implement logging in all API routes
3. Set up retention and archival policies
4. Create runbooks for alerts
5. Integrate with incident management
6. Optimize for cost and performance

---

## 🔑 Key Concepts

### Request Correlation
Every request gets a unique ID that flows through all logs.
→ Read "Request Correlation" in [LOGGING-MONITORING.md](LOGGING-MONITORING.md)

### Structured Logging
All logs are in JSON format for easy parsing and querying.
→ Read "Structured Logging" in [LOGGING-MONITORING.md](LOGGING-MONITORING.md)

### Log Levels
Different severity levels: debug, info, warn, error.
→ See examples in [LOGGING-SCREENSHOTS.md](LOGGING-SCREENSHOTS.md)

### Metric Filters
Convert log patterns into numeric metrics for alerting.
→ Read "Metric Filters" in [LOGGING-MONITORING.md](LOGGING-MONITORING.md)

### Dashboards
Visual representation of metrics and trends.
→ See screenshots in [LOGGING-SCREENSHOTS.md](LOGGING-SCREENSHOTS.md)

### Alerts
Automated notifications when thresholds are exceeded.
→ Read "Alerts and Notifications" in [LOGGING-MONITORING.md](LOGGING-MONITORING.md)

---

## 🚀 Quick Commands

### Setup
```bash
# AWS (Linux/Mac)
./scripts/setup-cloudwatch.sh

# AWS (Windows)
.\scripts\setup-cloudwatch.ps1

# Azure
./scripts/setup-azure-monitor.sh
```

### Testing
```bash
# Test logging
./scripts/test-logging.sh

# View logs (AWS)
aws logs tail /ecs/trustx-task --follow

# View logs (Azure)
az webapp log tail --name trustx-app --resource-group trustx-rg
```

### Common Queries

**Find errors (AWS):**
```
fields @timestamp, message | filter level = "error" | sort @timestamp desc
```

**Find errors (Azure):**
```kusto
AppServiceConsoleLogs | where Level == "Error" | order by TimeGenerated desc
```

---

## 📞 Support

### Issues or Questions?
1. Check [LOGGING-MONITORING.md](LOGGING-MONITORING.md) "Troubleshooting" section
2. Review [LOGGING-SCREENSHOTS.md](LOGGING-SCREENSHOTS.md) for expected outcomes
3. Verify setup with [scripts/test-logging.sh](scripts/test-logging.sh)

### External Resources
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [Azure Monitor Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/)

---

## ✅ Checklist

Before going to production:

- [ ] Read [LOGGING-QUICKSTART.md](LOGGING-QUICKSTART.md)
- [ ] Run setup script for your cloud platform
- [ ] Test logging with [scripts/test-logging.sh](scripts/test-logging.sh)
- [ ] Configure alert notification emails
- [ ] Create at least one custom dashboard
- [ ] Test alerts by generating errors
- [ ] Document your log retention policy
- [ ] Create runbooks for common alerts
- [ ] Train team on querying logs
- [ ] Set up on-call rotation (if applicable)

---

## 📊 Assignment Requirements Met

### ✅ Concept 2.43 - Logging and Monitoring

**Required:**
- [x] Understand importance of logging and monitoring
- [x] Set up application logging (structured JSON)
- [x] Configure cloud logging (CloudWatch/Azure Monitor)
- [x] Set log retention and storage
- [x] Create dashboards and alerts
- [x] Document in README with screenshots and reflections

**Deliverables:**
- [x] Configured structured logging with correlation IDs
- [x] Logs visible in CloudWatch or Azure Monitor
- [x] Dashboard showing error trends or performance metrics
- [x] Updated README.md with documentation, screenshots, and reflections

**Status:** ✅ **COMPLETE**

---

**Start Here:** [LOGGING-QUICKSTART.md](LOGGING-QUICKSTART.md) 🚀

**Last Updated:** January 5, 2026

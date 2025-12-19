# Redis Setup Guide for TrustX

## Quick Start with Redis

### 1. Install Redis

#### Windows (using Chocolatey)
```bash
choco install redis-64
```

#### macOS (using Homebrew)
```bash
brew install redis
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install redis-server
```

### 2. Start Redis Server

#### Windows
```bash
redis-server
```

#### macOS/Linux
```bash
redis-server
# Or as a service:
sudo systemctl start redis
```

### 3. Verify Redis is Running

Open a new terminal and run:
```bash
redis-cli ping
```

You should see: `PONG`

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and ensure Redis URL is set:
```env
REDIS_URL=redis://localhost:6379
```

### 5. Test the Cache Implementation

```bash
# Run cache tests
npm run test:cache

# Start the Next.js server
npm run dev
```

### 6. Test API Endpoints

```bash
# First request (cache miss)
curl "http://localhost:3000/api/users?page=1&limit=10"

# Second request (cache hit - should be faster)
curl "http://localhost:3000/api/users?page=1&limit=10"
```

Watch the console logs for "Cache Hit" vs "Cache Miss" messages.

### 7. Monitor Redis

```bash
# Connect to Redis CLI
redis-cli

# View all keys
keys *

# Check memory usage
info memory

# Monitor commands in real-time
monitor
```

### Troubleshooting

**Redis connection error:**
- Ensure Redis server is running: `redis-cli ping`
- Check REDIS_URL in .env file
- Verify firewall allows port 6379

**Cache not working:**
- Check console logs for Redis connection messages
- Verify cache keys are being set: `redis-cli keys "*"`
- Test cache service directly: `npm run test:cache`

**Permission issues:**
- On Windows, ensure Redis is run as Administrator
- On Linux/macOS, check file permissions

### Production Deployment

For production, consider:
- **Redis Cloud** or **AWS ElastiCache** for managed Redis
- **Connection pooling** for high-traffic applications
- **Redis Cluster** for horizontal scaling
- **Persistence** configuration for data durability

### Useful Redis Commands

```bash
# View all cache keys
redis-cli keys "*"

# Check TTL for a key
redis-cli ttl "users:list:page=1:limit=10:search="

# View cached data
redis-cli get "users:list:page=1:limit=10:search="

# Clear all cache
redis-cli flushall

# Monitor real-time commands
redis-cli monitor
```
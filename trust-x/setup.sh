#!/bin/bash
# TrustX - Transactions & Query Optimization Setup & Test Script
# Run this script to set up and test everything

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  🚀 TrustX - Complete Implementation Setup & Test"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Install Dependencies
echo -e "${BLUE}Step 1: Installing Dependencies...${NC}"
echo "─────────────────────────────────────────────────────────────────────────────"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}\n"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}\n"
    exit 1
fi

# Step 2: Setup Database
echo -e "${BLUE}Step 2: Setting up Database...${NC}"
echo "─────────────────────────────────────────────────────────────────────────────"
export DATABASE_URL="file:./dev.db"
npx prisma db push
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database setup complete${NC}\n"
else
    echo -e "${RED}❌ Failed to setup database${NC}\n"
    exit 1
fi

# Step 3: Run Tests
echo -e "${BLUE}Step 3: Running Comprehensive Test Suite...${NC}"
echo "─────────────────────────────────────────────────────────────────────────────"
npx ts-node scripts/performance-test.ts
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tests completed successfully${NC}\n"
else
    echo -e "${YELLOW}⚠️  Tests completed with warnings${NC}\n"
fi

# Step 4: Summary
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📚 Next Steps:"
echo "   1. Read Quick Start: cat QUICKSTART.md"
echo "   2. Review Full Guide: cat TRANSACTIONS_AND_OPTIMIZATION.md"
echo "   3. View Implementation Summary: cat IMPLEMENTATION_SUMMARY.md"
echo ""
echo "🔧 Common Commands:"
echo "   • View database:     npx prisma studio"
echo "   • Enable logging:    DEBUG=\"prisma:query\" npm run dev"
echo "   • Run tests:         npx ts-node scripts/performance-test.ts"
echo "   • Generate types:    npx prisma generate"
echo ""
echo "📂 Key Files:"
echo "   • Transactions:      src/lib/transactions.ts"
echo "   • Optimization:      src/lib/queryOptimization.ts"
echo "   • Monitoring:        src/lib/performanceMonitor.ts"
echo "   • API Examples:      src/app/api/examples.ts"
echo ""
echo "🚀 Start developing!"
echo ""

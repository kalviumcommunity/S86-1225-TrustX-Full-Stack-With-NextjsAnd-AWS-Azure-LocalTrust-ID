# 🚀 QUICK START GUIDE - LocalTrust-ID

## 5-Minute Setup

### Step 1: Install & Run (2 minutes)
```bash
cd trust-x
npm install
npm run dev
```
✅ Server runs on `http://localhost:3000`

---

### Step 2: Create Account (1 minute)
1. Go to: `http://localhost:3000/signup`
2. Fill in:
   - Name: **Test User**
   - Email: **test@example.com**
   - Password: **password123**
3. Click "Sign Up"
4. ✅ You're logged in!

---

### Step 3: Register Business (2 minutes)
1. Go to: `http://localhost:3000/businesses/register`
2. Fill in:
   - **Name**: My Coffee Shop
   - **Category**: Restaurant
   - **Description**: Best coffee in town!
   - **City**: New York
   - **Email**: coffee@example.com
3. Click "Register Business"
4. ✅ Business created! Redirects to profile

---

### Step 4: Get Verified (1 minute)
1. Go to: `http://localhost:3000/businesses/dashboard`
2. Click "Add Verification"
3. Verify Email:
   - Type: Email
   - Value: coffee@example.com
   - Submit
4. Verify Phone:
   - Type: Phone
   - Value: +1 555-123-4567
   - Submit
5. Verify Address:
   - Type: Address
   - Value: 123 Main St, New York
   - Submit
6. ✅ You're verified! Trust score increases

---

## 🎉 YOU'RE DONE!

### What You Can Do Now:

#### View Your Profile
`http://localhost:3000/businesses/YOUR_ID`
- See your trust score
- See verification badges

#### Browse All Businesses
`http://localhost:3000/businesses`
- Search businesses
- Filter by category/location
- See trust scores

#### Create More Businesses (Optional)
```bash
# Run this to get a script
node scripts/create-businesses-via-api.js

# Copy output and paste in browser console
# Creates 5 sample businesses
```

---

## 🔑 Key URLs

| Page | URL |
|------|-----|
| Home | `http://localhost:3000` |
| Sign Up | `http://localhost:3000/signup` |
| Login | `http://localhost:3000/login` |
| Discover Businesses | `http://localhost:3000/businesses` |
| Register Business | `http://localhost:3000/businesses/register` |
| Business Dashboard | `http://localhost:3000/businesses/dashboard` |

---

## 💡 Tips

### Increase Your Trust Score:
1. ✅ Get all 3 verification badges (+30 points)
2. ⭐ Get customer reviews (+40 points max)
3. 👀 Get profile views (+15 points max)
4. ⏰ Wait 30 days for age bonus (+15 points)

### Test Reviews:
1. Create a second account (different email)
2. Visit a business profile
3. Click "Write Review"
4. Rate and comment
5. Watch trust score update!

---

## 🐛 Troubleshooting

**Can't connect to MongoDB?**
- Check `.env.local` has `DATABASE_URL`
- Use MongoDB Atlas (free tier)
- Connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/...`

**Login not working?**
- Make sure you signed up first
- Check email/password are correct
- JWT tokens stored in localStorage

**Business not showing?**
- Check status is 'active' in database
- Refresh the page
- Clear browser cache

---

## ✅ Success Checklist

- [ ] Server running on http://localhost:3000
- [ ] Created user account
- [ ] Registered a business
- [ ] Completed at least one verification
- [ ] Can view business on /businesses page
- [ ] Can access business dashboard
- [ ] Trust score showing on profile

---

## 🎯 Next Steps

1. **Customize Your Business**
   - Add logo/cover image (future feature)
   - Fill in business hours
   - Add social media links

2. **Get Reviews**
   - Share your profile link
   - Ask customers to review
   - Respond to reviews

3. **Build Trust**
   - Complete all verifications
   - Stay active
   - Keep profile updated

---

**Need Help?** Check `README.md` for full documentation

**Ready to go live?** See deployment section in README

---

🎉 **Happy Building!** 🎉

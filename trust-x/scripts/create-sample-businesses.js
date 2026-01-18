/**
 * Script to create sample businesses in MongoDB
 * Run: node scripts/create-sample-businesses.js
 */

const { MongoClient, ObjectId } = require('mongodb');

// Use hardcoded MongoDB URI since .env might not be loaded
const MONGODB_URI = 'mongodb+srv://gembalidinesh7_db_user:gembalidinesh6_db_user_password@cluster0.ywdcrjp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const sampleBusinesses = [
  {
    name: "Joe's Pizza & Pasta",
    category: "Restaurant",
    description: "Family-owned Italian restaurant serving authentic pizza and pasta since 2015. We use fresh, locally sourced ingredients and traditional recipes passed down through generations.",
    location: {
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      country: "United States",
      zipCode: "10001"
    },
    contactInfo: {
      email: "contact@joespizza.com",
      phone: "+1 (555) 123-4567",
      website: "https://joespizza.example.com"
    },
    verificationBadges: ["email_verified", "phone_verified", "address_verified"],
    isVerified: true,
    trustScore: 85,
    reviewCount: 24,
    averageRating: 4.6,
    totalViews: 342
  },
  {
    name: "Fresh & Green Market",
    category: "Retail",
    description: "Your neighborhood organic grocery store. We offer fresh fruits, vegetables, and organic products from local farms.",
    location: {
      address: "456 Oak Avenue",
      city: "San Francisco",
      state: "CA",
      country: "United States",
      zipCode: "94102"
    },
    contactInfo: {
      email: "hello@freshgreen.com",
      phone: "+1 (555) 234-5678",
      website: "https://freshgreen.example.com"
    },
    verificationBadges: ["email_verified", "phone_verified"],
    isVerified: false,
    trustScore: 72,
    reviewCount: 18,
    averageRating: 4.4,
    totalViews: 256
  },
  {
    name: "TechFix Computer Repair",
    category: "Services",
    description: "Professional computer and laptop repair services. Same-day repairs available. We fix hardware issues, remove viruses, and upgrade systems.",
    location: {
      address: "789 Tech Boulevard",
      city: "Austin",
      state: "TX",
      country: "United States",
      zipCode: "78701"
    },
    contactInfo: {
      email: "support@techfix.com",
      phone: "+1 (555) 345-6789"
    },
    verificationBadges: ["email_verified"],
    isVerified: false,
    trustScore: 68,
    reviewCount: 12,
    averageRating: 4.7,
    totalViews: 189
  },
  {
    name: "Bright Smiles Dental",
    category: "Healthcare",
    description: "Modern dental clinic offering general dentistry, cosmetic procedures, and emergency care. We accept most insurance plans.",
    location: {
      address: "321 Healthcare Drive",
      city: "Chicago",
      state: "IL",
      country: "United States",
      zipCode: "60601"
    },
    contactInfo: {
      email: "appointments@brightsmiles.com",
      phone: "+1 (555) 456-7890",
      website: "https://brightsmiles.example.com"
    },
    verificationBadges: ["email_verified", "phone_verified", "address_verified"],
    isVerified: true,
    trustScore: 92,
    reviewCount: 45,
    averageRating: 4.8,
    totalViews: 567
  },
  {
    name: "Creative Minds Tutoring",
    category: "Education",
    description: "After-school tutoring for K-12 students. Math, science, English, and test prep. Experienced teachers with proven results.",
    location: {
      address: "555 Education Lane",
      city: "Boston",
      state: "MA",
      country: "United States",
      zipCode: "02101"
    },
    contactInfo: {
      email: "info@creativeminds.com",
      phone: "+1 (555) 567-8901",
      website: "https://creativeminds.example.com"
    },
    verificationBadges: ["email_verified", "phone_verified"],
    isVerified: false,
    trustScore: 78,
    reviewCount: 32,
    averageRating: 4.9,
    totalViews: 412
  },
  {
    name: "CodeCraft Solutions",
    category: "Technology",
    description: "Web and mobile app development for small businesses. Custom solutions, affordable prices, and dedicated support.",
    location: {
      address: "888 Innovation Park",
      city: "Seattle",
      state: "WA",
      country: "United States",
      zipCode: "98101"
    },
    contactInfo: {
      email: "hello@codecraft.com",
      phone: "+1 (555) 678-9012",
      website: "https://codecraft.example.com"
    },
    verificationBadges: ["email_verified"],
    isVerified: false,
    trustScore: 65,
    reviewCount: 8,
    averageRating: 4.5,
    totalViews: 143
  },
  {
    name: "BuildRight Construction",
    category: "Construction",
    description: "Licensed and insured construction company. Home renovations, additions, and remodeling. 20+ years of experience.",
    location: {
      address: "999 Builder Street",
      city: "Denver",
      state: "CO",
      country: "United States",
      zipCode: "80201"
    },
    contactInfo: {
      email: "projects@buildright.com",
      phone: "+1 (555) 789-0123",
      website: "https://buildright.example.com"
    },
    verificationBadges: ["email_verified", "phone_verified", "address_verified"],
    isVerified: true,
    trustScore: 88,
    reviewCount: 37,
    averageRating: 4.7,
    totalViews: 498
  },
  {
    name: "QuickRide Transportation",
    category: "Transportation",
    description: "Reliable local transportation service. Airport transfers, corporate events, and daily commutes. Clean vehicles and professional drivers.",
    location: {
      address: "222 Transit Avenue",
      city: "Miami",
      state: "FL",
      country: "United States",
      zipCode: "33101"
    },
    contactInfo: {
      email: "book@quickride.com",
      phone: "+1 (555) 890-1234"
    },
    verificationBadges: ["email_verified", "phone_verified"],
    isVerified: false,
    trustScore: 74,
    reviewCount: 28,
    averageRating: 4.3,
    totalViews: 321
  }
];

async function createSampleBusinesses() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const businessesCollection = db.collection('businesses');

    // Get a test user to be the owner
    const usersCollection = db.collection('users');
    let testUser = await usersCollection.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('⚠️  Test user not found. Creating one...');
      const insertResult = await usersCollection.insertOne({
        name: 'Test User',
        email: 'test@example.com',
        password: '$2a$10$YourHashedPasswordHere', // placeholder
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      testUser = { _id: insertResult.insertedId };
    }

    console.log(`\n📝 Creating ${sampleBusinesses.length} sample businesses...\n`);

    for (const businessData of sampleBusinesses) {
      // Check if business already exists
      const existing = await businessesCollection.findOne({ name: businessData.name });
      
      if (existing) {
        console.log(`⏭️  Skipping "${businessData.name}" - already exists`);
        continue;
      }

      const now = new Date();
      // Randomize creation date to simulate age
      const daysOld = Math.floor(Math.random() * 365) + 30; // 30-395 days old
      const createdAt = new Date(now.getTime() - (daysOld * 24 * 60 * 60 * 1000));

      const business = {
        ...businessData,
        ownerId: new ObjectId(testUser._id),
        status: 'active',
        verificationHistory: [],
        logo: null,
        coverImage: null,
        gallery: [],
        businessHours: {},
        socialLinks: {},
        createdAt,
        updatedAt: now
      };

      const result = await businessesCollection.insertOne(business);
      console.log(`✅ Created "${businessData.name}" (ID: ${result.insertedId})`);
    }

    console.log(`\n🎉 Sample businesses created successfully!`);
    console.log(`\n📊 Summary:`);
    const total = await businessesCollection.countDocuments();
    const verified = await businessesCollection.countDocuments({ isVerified: true });
    console.log(`   Total businesses: ${total}`);
    console.log(`   Verified businesses: ${verified}`);
    console.log(`\n🌐 View them at: http://localhost:3000/businesses\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

createSampleBusinesses();

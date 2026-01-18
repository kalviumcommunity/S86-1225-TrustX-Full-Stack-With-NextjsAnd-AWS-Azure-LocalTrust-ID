/**
 * Script to create sample businesses via API
 * Run: node scripts/create-businesses-via-api.js
 */

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
    }
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
    }
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
    }
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
    }
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
    }
  }
];

async function createBusinesses() {
  console.log('\n📝 Creating sample businesses via API...\n');
  console.log('⚠️  Make sure the server is running on http://localhost:3000\n');
  console.log('💡 You need to be logged in as test@example.com\n');
  console.log('📋 Copy and paste this data into the browser console:\n');
  console.log('-----------------------------------------------------------\n');

  const script = `
// Run this in browser console while logged in to http://localhost:3000

const businesses = ${JSON.stringify(sampleBusinesses, null, 2)};

async function createAll() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ Not logged in! Please login first.');
    return;
  }

  console.log('📝 Creating businesses...');
  
  for (const business of businesses) {
    try {
      const response = await fetch('http://localhost:3000/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify(business)
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(\`✅ Created: \${business.name}\`);
      } else {
        console.log(\`⏭️  Skipped: \${business.name} - \${data.error?.message || 'Error'}\`);
      }
    } catch (err) {
      console.error(\`❌ Error creating \${business.name}:\`, err);
    }
  }
  
  console.log('\\n🎉 Done! Visit http://localhost:3000/businesses to see them.');
}

createAll();
`;

  console.log(script);
  console.log('\n-----------------------------------------------------------\n');
  console.log('✅ Copy the code above and paste it into your browser console');
  console.log('🌐 Make sure you\'re on http://localhost:3000 and logged in\n');
}

createBusinesses();

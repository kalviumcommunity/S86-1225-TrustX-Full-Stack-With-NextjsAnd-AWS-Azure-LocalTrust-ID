const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.DATABASE_URL;

async function fixUserData() {
  const client = await MongoClient.connect(uri);
  
  // List all databases
  const adminDb = client.db().admin();
  const { databases } = await adminDb.listDatabases();
  console.log('Available databases:', databases.map(d => d.name));
  
  const db = client.db(); // Use default database from connection string
  
  // List collections
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  // CORRECT user ID from console logs
  const correctUserId = '696ce314e4804d2bdaff39f8';
  
  console.log('🔧 Fixing data for user:', correctUserId);
  
  // 1. Fix business ownership for "Gembali dinesh"
  const businessResult = await db.collection('businesses').updateOne(
    { name: 'Gembali dinesh' },
    { 
      $set: { 
        ownerId: new ObjectId(correctUserId),
        updatedAt: new Date()
      }
    }
  );
  console.log('✅ Updated business:', businessResult.modifiedCount, 'document(s)');
  
  // 2. Get the business to update its reviews
  const business = await db.collection('businesses').findOne({ name: 'Gembali dinesh' });
  
  if (business) {
    // 3. Update ALL reviews for this business to belong to the correct user
    const reviewsResult = await db.collection('reviews').updateMany(
      { businessId: business._id },
      { 
        $set: { 
          userId: new ObjectId(correctUserId),
          updatedAt: new Date()
        }
      }
    );
    console.log('✅ Updated reviews for business:', reviewsResult.modifiedCount, 'document(s)');
  }
  
  // 4. Verify results
  const userReviews = await db.collection('reviews').countDocuments({
    userId: new ObjectId(correctUserId)
  });
  const userBusinesses = await db.collection('businesses').countDocuments({
    ownerId: new ObjectId(correctUserId)
  });
  
  console.log('\n📊 Final Summary:');
  console.log('   User Reviews:', userReviews);
  console.log('   User Businesses:', userBusinesses);
  console.log('\n✅ DONE! Refresh your dashboard now.');
  
  await client.close();
}

fixUserData().catch(console.error);

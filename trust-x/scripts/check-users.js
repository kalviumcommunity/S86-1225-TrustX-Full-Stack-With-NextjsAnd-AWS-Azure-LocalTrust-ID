const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking users in database...\n');
  
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
    console.log('❌ No users found in database!\n');
    console.log('Creating a test user...\n');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const newUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'USER'
      }
    });
    
    console.log('✅ Test user created successfully!');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');
    console.log('   Role: USER\n');
    
    // Create an admin user too
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedAdminPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   Role: ADMIN\n');
    
  } else {
    console.log(`✅ Found ${users.length} user(s) in database:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}\n`);
    });
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

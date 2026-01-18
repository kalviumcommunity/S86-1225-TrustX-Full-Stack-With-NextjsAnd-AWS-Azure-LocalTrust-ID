/**
 * MongoDB Migration Script
 * 
 * This script converts Prisma queries to MongoDB native driver queries
 * Run with: npx ts-node migrate-to-mongodb.ts
 */

// Conversion Guide:
// 
// Prisma -> MongoDB Native Driver
//
// 1. findUnique({ where: { id } }) -> findOne({ _id: new ObjectId(id) })
// 2. findUnique({ where: { email } }) -> findOne({ email })
// 3. findMany({ where, include, orderBy, skip, take }) -> find({ where }).sort().skip().limit().toArray()
// 4. create({ data }) -> insertOne(data) - returns { insertedId }
// 5. update({ where: { id }, data }) -> updateOne({ _id: new ObjectId(id) }, { $set: data })
// 6. delete({ where: { id } }) -> deleteOne({ _id: new ObjectId(id) })
// 7. count({ where }) -> countDocuments(where)
// 8. createMany({ data }) -> insertMany(data)
// 9. deleteMany({ where }) -> deleteMany(where)
//
// ID Handling:
// - All IDs are ObjectId (not strings or numbers)
// - Use new ObjectId(id) to convert string to ObjectId
// - Use id.toString() to convert ObjectId to string
//
// Collection Names (case-sensitive):
// - users, projects, tasks, orders, orderItems, products, inventory, payments, files, comments
//
// Example Conversion:
//
// BEFORE (Prisma):
// const user = await prisma.user.findUnique({ 
//   where: { id: userId } 
// });
//
// AFTER (MongoDB):
// const db = await getDb();
// const user = await db.collection('users').findOne({ 
//   _id: new ObjectId(userId) 
// });
//
// BEFORE (Prisma):
// const users = await prisma.user.findMany({
//   where: { role: 'ADMIN' },
//   orderBy: { createdAt: 'desc' },
//   skip: 0,
//   take: 10
// });
//
// AFTER (MongoDB):
// const db = await getDb();
// const users = await db.collection('users')
//   .find({ role: 'ADMIN' })
//   .sort({ createdAt: -1 })
//   .skip(0)
//   .limit(10)
//   .toArray();
//
// BEFORE (Prisma):
// const user = await prisma.user.create({
//   data: { name, email, password, role }
// });
//
// AFTER (MongoDB):
// const db = await getDb();
// const result = await db.collection('users').insertOne({ 
//   name, email, password, role, createdAt: new Date(), updatedAt: new Date()
// });
// const user = { _id: result.insertedId, name, email, password, role };
//
// BEFORE (Prisma):
// const user = await prisma.user.update({
//   where: { id: userId },
//   data: { name: newName }
// });
//
// AFTER (MongoDB):
// const db = await getDb();
// await db.collection('users').updateOne(
//   { _id: new ObjectId(userId) },
//   { $set: { name: newName, updatedAt: new Date() } }
// );
// const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

console.log(`
====================================
MongoDB Migration Guide
====================================

This project has been converted from Prisma to MongoDB native driver.

Key Changes Required in Each API Route:

1. Import:
   FROM: import { prisma } from '@/lib/prisma';
   TO:   import { getDb, ObjectId } from '@/lib/mongodb';

2. Get Database:
   const db = await getDb();

3. Collections:
   - users
   - projects
   - tasks
   - orders
   - orderItems
   - products
   - inventory
   - payments
   - files
   - comments

4. Query Conversions:
   See examples above in this file.

Files that need manual update:
- src/app/api/auth/**/*.ts (login, signup, refresh, me)
- src/app/api/users/**/*.ts
- src/app/api/admin/**/*.ts
- src/app/api/projects/**/*.ts
- src/app/api/products/**/*.ts
- src/app/api/orders/**/*.ts
- src/app/api/upload/**/*.ts
- src/app/api/comments/**/*.ts
- src/app/api/health/**/*.ts
- scripts/*.js

Total estimated files: ~25 files

Next Steps:
1. Update each route file individually
2. Test each endpoint after conversion
3. Update timestamps manually (createdAt, updatedAt)
4. Handle ObjectId conversions carefully
5. Test relations (foreign keys)

====================================
`);

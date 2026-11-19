import { MongoMemoryServer } from 'mongodb-memory-server';

console.log('🚀 Starting MongoDB instance for testing...');
const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();
console.log(`✅ MongoDB running at: ${uri}`);

process.env.MONGO_URL = process.env.MONGO_URL || uri;
process.env.PORT = process.env.PORT || '5001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_assignment_123';

console.log(`🚀 Starting College Appointment System API on http://localhost:${process.env.PORT}...`);
await import('../index.js');
console.log(`\n============================================================`);
console.log(`🌟 Server is LIVE and ready for your testing!`);
console.log(`📍 Base URL: http://localhost:${process.env.PORT}`);
console.log(`🏥 Health Check: http://localhost:${process.env.PORT}/health`);
console.log(`============================================================\n`);


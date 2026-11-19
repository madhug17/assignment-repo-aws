/**
 * Test cases for the PUT /professor/update-slot/:slotId API
 * 
 * These tests document the expected behavior of the update-slot API.
 * Run with: node tests/updateSlot.test.js
 * 
 * Prerequisites:
 * - Server running with a connected database
 * - BASE_URL environment variable set (defaults to http://localhost:5001)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

let professorToken = '';
let professorId = '';
let studentToken = '';
let studentId = '';
let freeSlotId = '';
let bookedSlotId = '';
let testsPassed = 0;
let testsFailed = 0;

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(testName, condition) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

async function setup() {
  console.log('\n📋 Setting up test data...\n');
  
  // Register professor
  const profReg = await request('POST', '/users/register', {
    name: 'Test Prof', email: `testprof_${Date.now()}@test.com`,
    password: 'Test@123', confirmPassword: 'Test@123', role: 'professor'
  });
  
  // Login professor
  const profLogin = await request('POST', '/users/login', {
    email: profReg.data.newUser.email, password: 'Test@123'
  });
  professorToken = profLogin.data.token;
  professorId = profLogin.data.id;
  
  // Register student
  const stuReg = await request('POST', '/users/register', {
    name: 'Test Student', email: `teststu_${Date.now()}@test.com`,
    password: 'Test@123', confirmPassword: 'Test@123', role: 'student'
  });
  
  // Login student
  const stuLogin = await request('POST', '/users/login', {
    email: stuReg.data.newUser.email, password: 'Test@123'
  });
  studentToken = stuLogin.data.token;
  studentId = stuLogin.data.id;
  
  // Create free slot
  const freeSlot = await request('POST', '/professor/availability', {
    startTime: '2026-12-25T10:00:00Z', endTime: '2026-12-25T10:30:00Z'
  }, professorToken);
  freeSlotId = freeSlot.data.availability._id;
  
  // Create slot that will be booked
  const bookSlot = await request('POST', '/professor/availability', {
    startTime: '2026-12-25T14:00:00Z', endTime: '2026-12-25T14:30:00Z'
  }, professorToken);
  bookedSlotId = bookSlot.data.availability._id;
  
  // Book the second slot
  await request('POST', '/general/book', {
    professorId, time: '2026-12-25T14:00:00Z'
  }, studentToken);
  
  console.log(`  Professor ID: ${professorId}`);
  console.log(`  Free Slot ID: ${freeSlotId}`);
  console.log(`  Booked Slot ID: ${bookedSlotId}\n`);
}

async function runTests() {
  console.log('🧪 Running Update Slot API Tests\n');
  console.log('='.repeat(60));
  
  // Test 1: Successfully update a free slot
  console.log('\nTest 1: Update a free slot successfully');
  const res1 = await request('PUT', `/professor/update-slot/${freeSlotId}`, {
    date: '2026-12-25', startTime: '11:00', endTime: '11:30'
  }, professorToken);
  assert('Status 200', res1.status === 200);
  assert('Success message', res1.data.message && res1.data.message.includes('updated'));
  assert('Document ID preserved', res1.data.availability && res1.data.availability._id === freeSlotId);
  
  // Test 2: Cannot update a booked slot
  console.log('\nTest 2: Cannot update a booked slot');
  const res2 = await request('PUT', `/professor/update-slot/${bookedSlotId}`, {
    date: '2026-12-25', startTime: '16:00', endTime: '16:30'
  }, professorToken);
  assert('Status 400', res2.status === 400);
  assert('Error mentions booked', res2.data.message && res2.data.message.includes('booked'));
  
  // Test 3: Invalid slot ID
  console.log('\nTest 3: Invalid slot ID');
  const res3 = await request('PUT', '/professor/update-slot/invalidid', {
    date: '2026-12-25', startTime: '11:00', endTime: '11:30'
  }, professorToken);
  assert('Status 400', res3.status === 400);
  assert('Error mentions invalid', res3.data.message && res3.data.message.toLowerCase().includes('invalid'));
  
  // Test 4: Non-existent slot ID
  console.log('\nTest 4: Non-existent slot ID');
  const res4 = await request('PUT', '/professor/update-slot/507f1f77bcf86cd799439011', {
    date: '2026-12-25', startTime: '11:00', endTime: '11:30'
  }, professorToken);
  assert('Status 404', res4.status === 404);
  
  // Test 5: Missing required fields
  console.log('\nTest 5: Missing required fields');
  const res5 = await request('PUT', `/professor/update-slot/${freeSlotId}`, {
    date: '2026-12-25'
  }, professorToken);
  assert('Status 400', res5.status === 400);
  
  // Test 6: Start time after end time
  console.log('\nTest 6: Start time after end time');
  const res6 = await request('PUT', `/professor/update-slot/${freeSlotId}`, {
    date: '2026-12-25', startTime: '15:00', endTime: '14:00'
  }, professorToken);
  assert('Status 400', res6.status === 400);
  
  // Test 7: No authentication
  console.log('\nTest 7: No authentication');
  const res7 = await request('PUT', `/professor/update-slot/${freeSlotId}`, {
    date: '2026-12-25', startTime: '11:00', endTime: '11:30'
  });
  assert('Status 402 (Unauthorized)', res7.status === 402);
  
  // Test 8: Student cannot update slot
  console.log('\nTest 8: Student cannot update slot');
  const res8 = await request('PUT', `/professor/update-slot/${freeSlotId}`, {
    date: '2026-12-25', startTime: '11:00', endTime: '11:30'
  }, studentToken);
  assert('Status 403', res8.status === 403);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${testsPassed} passed, ${testsFailed} failed, ${testsPassed + testsFailed} total\n`);
  
  if (testsFailed > 0) process.exit(1);
}

try {
  await setup();
  await runTests();
} catch (error) {
  console.error('Test suite failed:', error.message);
  process.exit(1);
}

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

console.log('🚀 Starting in-memory MongoDB server...');
const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();
console.log(`✅ MongoDB running at: ${uri}`);

process.env.MONGO_URL = uri;
process.env.PORT = process.env.TEST_PORT || '5002';
process.env.JWT_SECRET = 'test_jwt_secret_assignment_123';

// Start the Express server
console.log('🚀 Starting Express application...');
await import('../index.js');

// Give the server 1.5 seconds to establish DB connection and start listening
await new Promise((resolve) => setTimeout(resolve, 1500));

const BASE_URL = `http://localhost:${process.env.PORT}`;
console.log(`\n=============================================================`);
console.log(`🎯 EXECUTING COLLEGE APPOINTMENT SYSTEM FULL TEST SUITE`);
console.log(`Target: ${BASE_URL}`);
console.log(`=============================================================\n`);

let passedCount = 0;
let failedCount = 0;

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passedCount++;
  } else {
    console.log(`  ❌ FAIL: ${description} ${details ? `(${details})` : ''}`);
    failedCount++;
  }
}

async function api(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

try {
  // -------------------------------------------------------------
  // PART 1: HEALTH CHECK
  // -------------------------------------------------------------
  console.log('\n--- 1. Health Check Endpoint ---');
  const healthRes = await api('GET', '/health');
  assert('GET /health returns 200 OK', healthRes.status === 200 && healthRes.data.status === 'ok');

  // -------------------------------------------------------------
  // PART 2: ASSIGNMENT WORKFLOW (PHASE 6)
  // -------------------------------------------------------------
  console.log('\n--- 2. Assignment Workflow Execution ---');

  // Step 1: Student A1 Registration & Authentication
  console.log('\n[Step 1] Registering & Authenticating Student A1 (student1@example.com)...');
  const regA1 = await api('POST', '/users/register', {
    name: 'Student A1',
    email: 'student1@example.com',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    role: 'student'
  });
  assert('Student A1 registered (201)', regA1.status === 201);

  const loginA1 = await api('POST', '/users/login', {
    email: 'student1@example.com',
    password: 'Password@123'
  });
  assert('Student A1 logged in (200)', loginA1.status === 200 && !!loginA1.data.token);
  const student1Token = loginA1.data.token;
  const student1Id = loginA1.data.id;

  // Step 2: Professor P1 Registration & Authentication
  console.log('\n[Step 2] Registering & Authenticating Professor P1 (professor1@example.com)...');
  const regP1 = await api('POST', '/users/register', {
    name: 'Professor P1',
    email: 'professor1@example.com',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    role: 'professor'
  });
  assert('Professor P1 registered (201)', regP1.status === 201);

  const loginP1 = await api('POST', '/users/login', {
    email: 'professor1@example.com',
    password: 'Password@123'
  });
  assert('Professor P1 logged in (200)', loginP1.status === 200 && !!loginP1.data.token);
  const professorToken = loginP1.data.token;
  const professorId = loginP1.data.id;

  // Step 3: Student A2 Registration & Authentication
  console.log('\n[Step 3] Registering & Authenticating Student A2 (student2@example.com)...');
  const regA2 = await api('POST', '/users/register', {
    name: 'Student A2',
    email: 'student2@example.com',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    role: 'student'
  });
  assert('Student A2 registered (201)', regA2.status === 201);

  const loginA2 = await api('POST', '/users/login', {
    email: 'student2@example.com',
    password: 'Password@123'
  });
  assert('Student A2 logged in (200)', loginA2.status === 200 && !!loginA2.data.token);
  const student2Token = loginA2.data.token;
  const student2Id = loginA2.data.id;

  // Step 4: Professor P1 creates available appointment slots
  console.log('\n[Step 4] Professor P1 creates 3 availability slots (T1, T2, and Free Slot)...');
  const slot1Res = await api('POST', '/professor/availability', {
    startTime: '2026-11-20T10:00:00Z',
    endTime: '2026-11-20T10:30:00Z'
  }, professorToken);
  assert('Created Slot 1 (T1: 10:00-10:30) (201)', slot1Res.status === 201);
  const slot1Id = slot1Res.data.availability?._id;

  const slot2Res = await api('POST', '/professor/availability', {
    startTime: '2026-11-20T11:00:00Z',
    endTime: '2026-11-20T11:30:00Z'
  }, professorToken);
  assert('Created Slot 2 (T2: 11:00-11:30) (201)', slot2Res.status === 201);
  const slot2Id = slot2Res.data.availability?._id;

  const slot3Res = await api('POST', '/professor/availability', {
    startTime: '2026-11-20T14:00:00Z',
    endTime: '2026-11-20T14:30:00Z'
  }, professorToken);
  assert('Created Slot 3 (Free Slot: 14:00-14:30) (201)', slot3Res.status === 201);
  const slot3Id = slot3Res.data.availability?._id;

  // Step 5: Student A1 views available slots for Professor P1
  console.log('\n[Step 5] Student A1 views available slots for Professor P1...');
  const viewSlotsRes = await api('GET', `/general/professor/${professorId}/availability`, null, student1Token);
  assert('Student A1 retrieved professor availability slots (200)', viewSlotsRes.status === 200 && Array.isArray(viewSlotsRes.data.availableSlots));
  assert('At least 3 slots visible', viewSlotsRes.data.availableSlots?.length >= 3);

  // Step 6: Student A1 books appointment at time T1
  console.log('\n[Step 6] Student A1 books appointment at time T1 (10:00)...');
  const bookT1Res = await api('POST', '/general/book', {
    professorId: professorId,
    time: '2026-11-20T10:00:00Z'
  }, student1Token);
  assert('Student A1 booked T1 successfully (201)', bookT1Res.status === 201 && bookT1Res.data.appointment?.status === 'booked');

  // Step 7: Student A2 books appointment at time T2
  console.log('\n[Step 7] Student A2 books appointment at time T2 (11:00)...');
  const bookT2Res = await api('POST', '/general/book', {
    professorId: professorId,
    time: '2026-11-20T11:00:00Z'
  }, student2Token);
  assert('Student A2 booked T2 successfully (201)', bookT2Res.status === 201 && bookT2Res.data.appointment?.status === 'booked');

  // Step 8: Professor P1 updates a different FREE appointment slot (Slot 3) using the new API
  console.log('\n[Step 8] Testing NEW API: Professor P1 updates FREE Slot 3 via PUT /professor/update-slot/:slotId...');
  const updateRes = await api('PUT', `/professor/update-slot/${slot3Id}`, {
    date: '2026-11-20',
    startTime: '15:00',
    endTime: '15:30'
  }, professorToken);
  assert('New API PUT /professor/update-slot/:slotId returned 200 OK', updateRes.status === 200);
  assert('Document _id is strictly preserved (no delete & recreate)', updateRes.data.availability?._id === slot3Id);
  assert('Slot updated with new time (15:00-15:30)', updateRes.data.availability?.startTime?.includes('3:00:00 pm'));

  // Step 9: Professor P1 cancels Student A1's appointment
  console.log('\n[Step 9] Professor P1 cancels Student A1\'s appointments...');
  const cancelRes = await api('PATCH', `/professor/cancel-appointments/${student1Id}`, null, professorToken);
  assert('Appointments cancelled successfully (200)', cancelRes.status === 200);

  // Step 10: Student A1 checks their appointments and sees no pending appointments
  console.log('\n[Step 10] Student A1 checks appointments (must see no pending)...');
  const checkApptsRes = await api('GET', '/general/appointments', null, student1Token);
  assert('Student A1 returns 404 (no pending appointments)', checkApptsRes.status === 404);
  assert('Message confirms no pending appointments', checkApptsRes.data.message?.toLowerCase().includes('no pending'));

  // -------------------------------------------------------------
  // PART 3: EDGE CASES & VALIDATION FOR NEW API
  // -------------------------------------------------------------
  console.log('\n--- 3. Validation & Edge Cases for NEW Update-Slot API ---');

  // Edge 1: Cannot update a booked slot (Slot 1 was booked by Student A1)
  console.log('\n[Edge Case 1] Attempting to update a slot with active bookings...');
  // Note: Student A2's booking at T2 is still 'booked' in Slot 2!
  const updateBookedRes = await api('PUT', `/professor/update-slot/${slot2Id}`, {
    date: '2026-11-20',
    startTime: '16:00',
    endTime: '16:30'
  }, professorToken);
  assert('Cannot update booked slot (returns 400)', updateBookedRes.status === 400);

  // Edge 2: Student cannot call professor update-slot API
  console.log('\n[Edge Case 2] Student attempts to access professor update-slot API...');
  const studentForbiddenRes = await api('PUT', `/professor/update-slot/${slot3Id}`, {
    date: '2026-11-20',
    startTime: '16:00',
    endTime: '16:30'
  }, student1Token);
  assert('Forbidden for non-professors (returns 403)', studentForbiddenRes.status === 403);

  // Edge 3: Unauthenticated request rejected
  console.log('\n[Edge Case 3] Request without JWT token...');
  const noAuthRes = await api('PUT', `/professor/update-slot/${slot3Id}`, {
    date: '2026-11-20',
    startTime: '16:00',
    endTime: '16:30'
  });
  assert('Unauthorized without token (returns 402)', noAuthRes.status === 402);

  // Edge 4: Invalid slotId format rejected
  console.log('\n[Edge Case 4] Request with invalid MongoDB ObjectId...');
  const invalidIdRes = await api('PUT', '/professor/update-slot/invalid-id-123', {
    date: '2026-11-20',
    startTime: '16:00',
    endTime: '16:30'
  }, professorToken);
  assert('Invalid ObjectId rejected (returns 400)', invalidIdRes.status === 400);

  // Edge 5: Overlapping slot rejected
  console.log('\n[Edge Case 5] Overlapping time with another existing slot...');
  const overlapRes = await api('PUT', `/professor/update-slot/${slot3Id}`, {
    date: '2026-11-20',
    startTime: '11:15', // Overlaps with Slot 2 (11:00-11:30)
    endTime: '11:45'
  }, professorToken);
  assert('Overlapping time rejected (returns 400)', overlapRes.status === 400);

  // -------------------------------------------------------------
  // PART 4: DATABASE VERIFICATION (PHASE 7)
  // -------------------------------------------------------------
  console.log('\n--- 4. Live Database State Verification ---');
  const userCount = await mongoose.connection.collection('users').countDocuments();
  const availabilityCount = await mongoose.connection.collection('availabilities').countDocuments();
  const appointmentCount = await mongoose.connection.collection('appointments').countDocuments();
  const cancelledCount = await mongoose.connection.collection('appointments').countDocuments({ status: 'cancelled' });
  const bookedCount = await mongoose.connection.collection('appointments').countDocuments({ status: 'booked' });

  assert('Users collection populated (3 users: P1, A1, A2)', userCount === 3, `Count: ${userCount}`);
  assert('Availabilities count matches (3 slots)', availabilityCount === 3, `Count: ${availabilityCount}`);
  assert('Appointments exist in database', appointmentCount === 2, `Count: ${appointmentCount}`);
  assert('Student A1 appointment transitioned to "cancelled"', cancelledCount === 1, `Count: ${cancelledCount}`);
  assert('Student A2 appointment remains "booked"', bookedCount === 1, `Count: ${bookedCount}`);

  // -------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------
  console.log('\n=============================================================');
  console.log(`📊 FINAL TEST REPORT SUMMARY`);
  console.log(`Total Assertions Checked: ${passedCount + failedCount}`);
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`Success Rate: ${Math.round((passedCount / (passedCount + failedCount)) * 100)}%`);
  console.log('=============================================================\n');

} catch (err) {
  console.error('Unexpected error during test execution:', err);
} finally {
  console.log('Cleaning up in-memory MongoDB and closing connections...');
  await mongoose.disconnect();
  await mongod.stop();
  console.log('Done! Exiting.');
  process.exit(failedCount === 0 ? 0 : 1);
}


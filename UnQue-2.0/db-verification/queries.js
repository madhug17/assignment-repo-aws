/**
 * Database Verification Queries
 * 
 * These queries can be run in mongosh connected to DocumentDB
 * to verify the database state at each step of the workflow.
 * 
 * Connection command:
 * mongosh --tls --tlsCAFile certs/global-bundle.pem \
 *   "mongodb://user:pass@docdb-endpoint:27017/unque?retryWrites=false"
 * 
 * For local MongoDB:
 * mongosh mongodb://localhost:27017/unque
 */

// ============================================
// 1. VERIFY PROFESSOR RECORDS EXIST
// ============================================
// After registration, check professors in the database
db.users.find({ role: "professor" }, { password: 0 });

// Expected: At least one professor document
// {
//   "_id": ObjectId("..."),
//   "name": "Professor P1",
//   "email": "professor1@example.com",
//   "role": "professor"
// }


// ============================================
// 2. VERIFY STUDENT RECORDS EXIST
// ============================================
db.users.find({ role: "student" }, { password: 0 });

// Expected: Student A1 and Student A2
// {
//   "_id": ObjectId("..."),
//   "name": "Student A1",
//   "email": "student1@example.com",
//   "role": "student"
// }
// {
//   "_id": ObjectId("..."),
//   "name": "Student A2",
//   "email": "student2@example.com",
//   "role": "student"
// }


// ============================================
// 3. VERIFY FREE APPOINTMENT SLOTS EXIST
// ============================================
// After professor creates slots, verify they exist
db.availabilities.find({});

// Expected: 3 availability documents
// Slot 1 (T1): 10:00 - 10:30
// Slot 2 (T2): 11:00 - 11:30  
// Slot 3 (Free): 14:00 - 14:30


// ============================================
// 4. VERIFY BOOKING CREATES CORRECT APPOINTMENT
// ============================================
// After Student A1 books T1
db.appointments.find({ status: "booked" });

// Expected: At least one appointment document
// {
//   "_id": ObjectId("..."),
//   "studentId": ObjectId("student-a1-id"),
//   "professorId": ObjectId("professor-p1-id"),
//   "time": ISODate("2026-11-20T10:00:00.000Z"),
//   "status": "booked"
// }


// ============================================
// 5. VERIFY BOOKED SLOTS - Check appointment exists
// ============================================
// A booked time should have a corresponding appointment
// Get professor ID first
var prof = db.users.findOne({ email: "professor1@example.com" });
db.appointments.find({ 
  professorId: prof._id, 
  status: "booked" 
});


// ============================================
// 6. VERIFY UPDATING A FREE SLOT CHANGES THE ORIGINAL DOCUMENT
// ============================================
// After the update-slot API is called on Slot 3
// The _id should remain the same, but startTime and endTime should change

// Before update: Slot 3 was 14:00 - 14:30
// After update: Slot 3 should be 15:00 - 15:30 (same _id!)

// Find the slot and verify times changed
db.availabilities.find({}).forEach(function(slot) {
  print("Slot ID: " + slot._id);
  print("  Start: " + slot.startTime);
  print("  End: " + slot.endTime);
  print("---");
});

// Verify count hasn't changed (still 3 slots, not 4)
print("Total slots: " + db.availabilities.countDocuments({}));


// ============================================
// 7. VERIFY CANCELLATION UPDATES APPOINTMENT STATE
// ============================================
// After professor cancels Student A1's appointment
db.appointments.find({ status: "cancelled" });

// Expected: Student A1's appointment now has status "cancelled"
// {
//   "_id": ObjectId("..."),
//   "studentId": ObjectId("student-a1-id"),
//   "professorId": ObjectId("professor-p1-id"),
//   "time": ISODate("2026-11-20T10:00:00.000Z"),
//   "status": "cancelled"
// }


// ============================================
// 8. VERIFY STUDENT A1 HAS NO PENDING APPOINTMENTS
// ============================================
var studentA1 = db.users.findOne({ email: "student1@example.com" });
var pendingCount = db.appointments.countDocuments({ 
  studentId: studentA1._id, 
  status: "booked" 
});
print("Student A1 pending appointments: " + pendingCount);
// Expected: 0


// ============================================
// FULL STATE VERIFICATION (run at the end)
// ============================================
print("\n========== FINAL DATABASE STATE ==========\n");

print("--- USERS ---");
db.users.find({}, { password: 0 }).forEach(function(u) {
  print(u.name + " (" + u.role + ") - " + u.email);
});

print("\n--- AVAILABILITY SLOTS ---");
db.availabilities.find({}).forEach(function(s) {
  var prof = db.users.findOne({ _id: s.professorId });
  print("Slot " + s._id + ": " + s.startTime + " to " + s.endTime + " (Prof: " + (prof ? prof.name : "unknown") + ")");
});

print("\n--- APPOINTMENTS ---");
db.appointments.find({}).forEach(function(a) {
  var stu = db.users.findOne({ _id: a.studentId });
  var prof = db.users.findOne({ _id: a.professorId });
  print("Appt " + a._id + ": " + (stu ? stu.name : "unknown") + " with " + (prof ? prof.name : "unknown") + " at " + a.time + " - STATUS: " + a.status);
});

print("\n========== END ==========");


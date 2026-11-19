# Video 1 — Postman API Demonstration Script

**Title:** College Appointment System — AWS EC2 API Demonstration  
**Target URL:** `http://<EC2-PUBLIC-IP>:5001`  
**Duration:** ~6–8 Minutes  

---

## 🎬 Pre-Recording Checklist
- [ ] Postman open with `College-Appointment-System` collection and environment loaded.
- [ ] `baseUrl` set to `<EC2-PUBLIC-IP>:5001`.
- [ ] Terminal window open connected to EC2 or running `mongosh` to show live database state.
- [ ] Clean database state or note current count.

---

## 🗣️ Step-by-Step Narration Script

### Scene 1: Introduction & System Verification
- **Screen:** Show Postman environment selected with `baseUrl: <EC2-PUBLIC-IP>:5001`.
- **Narration:**
  > *"Hello, this is the demonstration of the College Appointment System backend API deployed on an AWS EC2 Ubuntu instance connected to an AWS DocumentDB cluster. We will execute the complete 10-step assignment workflow using Postman, including our newly implemented free-slot update API and live database verification."*
- **Action:** Send `GET http://{{baseUrl}}/health`.
- **Show Response:** `200 OK`, `{"status": "ok", "timestamp": "..."}`.

---

### Scene 2: User Registration & Authentication (Steps 1, 2, 3)
- **Narration:**
  > *"First, we register and authenticate our users: Student A1, Professor P1, and Student A2."*
- **Action 1:** Send `01. Register Student A1` (`student1@example.com`, role: `student`).
  - Response: `201 Created`. Test passes: `student1Id` auto-saved.
- **Action 2:** Send `02. Login Student A1`.
  - Response: `200 OK`. Test passes: `student1Token` auto-saved.
- **Action 3:** Send `03. Register Professor P1` (`professor1@example.com`, role: `professor`).
  - Response: `201 Created`. Test passes: `professorId` auto-saved.
- **Action 4:** Send `04. Login Professor P1`.
  - Response: `200 OK`. Test passes: `professorToken` auto-saved.
- **Action 5:** Send `05. Register Student A2` (`student2@example.com`, role: `student`).
  - Response: `201 Created`. Test passes: `student2Id` auto-saved.
- **Action 6:** Send `06. Login Student A2`.
  - Response: `200 OK`. Test passes: `student2Token` auto-saved.

---

### Scene 3: Professor Creates Available Slots (Step 4)
- **Narration:**
  > *"Now, Professor P1 creates three availability slots: Slot 1 at time T1, Slot 2 at time T2, and Slot 3, which will remain free for updating."*
- **Action 1:** Send `07. Professor P1 Creates Slot 1 (T1)` (10:00 to 10:30 UTC).
  - Response: `201 Created`. `slotId1` saved.
- **Action 2:** Send `08. Professor P1 Creates Slot 2 (T2)` (11:00 to 11:30 UTC).
  - Response: `201 Created`. `slotId2` saved.
- **Action 3:** Send `09. Professor P1 Creates Slot 3 (Free)` (14:00 to 14:30 UTC).
  - Response: `201 Created`. `slotId3` saved.

---

### Scene 4: Student A1 Views Slots & Books T1 (Steps 5, 6)
- **Narration:**
  > *"Student A1 inspects Professor P1's schedule and books an appointment at time T1."*
- **Action 1:** Send `10. Student A1 Views Available Slots`.
  - Response: `200 OK`. Shows 3 available slots formatted with Moment.js.
- **Action 2:** Send `11. Student A1 Books Appointment at T1` (10:00 UTC).
  - Response: `201 Created`. Appointment status is `booked`.

---

### Scene 5: Student A2 Books T2 (Step 7)
- **Narration:**
  > *"Next, Student A2 logs in and books the second slot at time T2."*
- **Action:** Send `12. Student A2 Books Appointment at T2` (11:00 UTC).
  - Response: `201 Created`. Appointment status is `booked`.

---

### Scene 6: Professor P1 Updates FREE Slot 3 — NEW API (Step 8)
- **Narration:**
  > *"Here is the newly implemented API: PUT /professor/update-slot/:slotId. Professor P1 updates their remaining free slot (Slot 3) to a new time window (15:00 to 15:30) without deleting and recreating the document."*
- **Action:** Send `13. Professor P1 Updates FREE Slot 3 (New API)`.
- **Show Response:** `200 OK`.
  - Message: `"Availability slot updated successfully"`
  - Point out that the returned `_id` matches `slotId3` exactly! Document ID was strictly preserved.
- **Bonus Edge Case:** Send `EDGE: Update Booked Slot (Should Fail)`.
  - Response: `400 Bad Request` (`"Cannot update a slot that has booked appointments"`).

---

### Scene 7: Appointment Cancellation & Status Check (Steps 9, 10)
- **Narration:**
  > *"Now Professor P1 cancels all appointments with Student A1."*
- **Action 1:** Send `14. Professor P1 Cancels Student A1 Appointments`.
  - Response: `200 OK`. Message confirms appointments cancelled.
- **Action 2:** Send `15. Student A1 Checks Appointments (No Pending)`.
  - Response: `404 Not Found`.
  - Message: `"You have no pending appointments"`.
- **Narration:**
  > *"As required, Student A1 has zero pending appointments remaining."*

---

### Scene 8: Live DocumentDB State Verification
- **Screen:** Switch to DocumentDB `mongosh` terminal.
- **Action:** Run queries from `db-verification/queries.js`:
  ```javascript
  db.users.find({}, { password: 0 });
  db.availabilities.find({});
  db.appointments.find({});
  ```
- **Highlight:**
  - Users: Professor P1, Student A1, Student A2 present.
  - Availabilities: Slot 3 has updated time `15:00-15:30` with original ID.
  - Appointments: Student A1 appointment has status `"cancelled"`, Student A2 appointment has status `"booked"`.

---

### Scene 9: Conclusion
- **Narration:**
  > *"All 10 assignment workflow steps and automated test assertions have successfully passed on our AWS cloud deployment. Thank you!"*


# Postman Testing Guide — College Appointment System

This guide explains how to test the deployed College Appointment System backend using Postman to verify the complete 10-step assignment workflow.

---

## 📂 Required Postman Files

Located in the repository `postman/` directory:
1. `College-Appointment-System.postman_collection.json` — The test collection with 19 requests and pre-script/assertion logic.
2. `College-Appointment-System.postman_environment.json` — The environment variables template.

---

## 🚀 Setup Instructions

### 1. Import Files into Postman
1. Open Postman.
2. Click **Import** (top left).
3. Drag & drop or select:
   - `postman/College-Appointment-System.postman_collection.json`
   - `postman/College-Appointment-System.postman_environment.json`

### 2. Configure Environment Variables
1. Select the environment: **College Appointment System - Environment** (from the top right environment dropdown).
2. Click the eye icon or edit environment:
   - Update `baseUrl`: Set to `<EC2-PUBLIC-IP>:5001` (e.g. `13.232.100.50:5001`).
   - Leave token, user ID, slot ID, and appointment ID variables empty — the collection's test scripts will automatically populate them during execution!

---

## 📋 The 10-Step Assignment Workflow

Run the requests in sequential order from top to bottom:

| Step # | Request Name | Method | Endpoint | Expected Status | Key Automated Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0** | `16. Health Check` | `GET` | `/health` | `200 OK` | Confirms server is online (`status: "ok"`) |
| **1** | `01. Register Student A1` | `POST` | `/users/register` | `201 Created` | Creates student with email `student1@example.com` |
| **1b** | `02. Login Student A1` | `POST` | `/users/login` | `200 OK` | Saves `student1Token` & `student1Id` |
| **2** | `03. Register Professor P1` | `POST` | `/users/register` | `201 Created` | Creates professor with email `professor1@example.com` |
| **2b** | `04. Login Professor P1` | `POST` | `/users/login` | `200 OK` | Saves `professorToken` & `professorId` |
| **3** | `05. Register Student A2` | `POST` | `/users/register` | `201 Created` | Creates student with email `student2@example.com` |
| **3b** | `06. Login Student A2` | `POST` | `/users/login` | `200 OK` | Saves `student2Token` & `student2Id` |
| **4** | `07. Professor Creates Slot 1 (T1)` | `POST` | `/professor/availability` | `201 Created` | Creates Slot 1 (10:00-10:30) → sets `slotId1` |
| **4b** | `08. Professor Creates Slot 2 (T2)` | `POST` | `/professor/availability` | `201 Created` | Creates Slot 2 (11:00-11:30) → sets `slotId2` |
| **4c** | `09. Professor Creates Slot 3 (Free)` | `POST` | `/professor/availability` | `201 Created` | Creates Slot 3 (14:00-14:30) → sets `slotId3` |
| **5** | `10. Student A1 Views Slots` | `GET` | `/general/professor/{{professorId}}/availability` | `200 OK` | Asserts array length >= 3 available slots |
| **6** | `11. Student A1 Books T1` | `POST` | `/general/book` | `201 Created` | Books slot T1 (10:00) → status `booked` |
| **7** | `12. Student A2 Books T2` | `POST` | `/general/book` | `201 Created` | Books slot T2 (11:00) → status `booked` |
| **8** | `13. Professor Updates FREE Slot 3` | `PUT` | `/professor/update-slot/{{slotId3}}` | `200 OK` | **NEW API**: Updates time to 15:00-15:30, preserves `_id` |
| **9** | `14. Professor Cancels A1 Appointment` | `PATCH` | `/professor/cancel-appointments/{{student1Id}}` | `200 OK` | Changes status from `booked` to `cancelled` |
| **10** | `15. Student A1 Checks Appointments` | `GET` | `/general/appointments` | `404 Not Found` | Verifies `no pending appointments` for A1 |

---

## 🛡️ Edge Cases & Negative Tests

The collection also includes explicit negative tests to prove API robustness:

1. **`EDGE: Update Booked Slot (Should Fail)`**
   - Attempting to update `slotId1` or `slotId2` (which have active bookings).
   - Expected response: `400 Bad Request` (`"Cannot update a slot that has booked appointments"`).
2. **`EDGE: Update Slot with Invalid ID`**
   - Passing `invalidid123`.
   - Expected response: `400 Bad Request` (`"Invalid or missing slot ID"`).
3. **`EDGE: Student Tries to Update Slot (Should Fail)`**
   - Attempting update using `student1Token`.
   - Expected response: `403 Forbidden` (`"Access denied, only professors..."`).

---

## 🏃 Running Collection Runner

1. Click on the collection name: **College Appointment System**.
2. Click **Run**.
3. Ensure all requests are checked and execution order matches 1 through 15.
4. Select the environment: **College Appointment System - Environment**.
5. Click **Run College Appointment System**.
6. All automated assertions should be green (`PASS`).


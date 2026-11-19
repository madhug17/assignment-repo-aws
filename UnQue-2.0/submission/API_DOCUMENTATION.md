# API Documentation — College Appointment System

## Base URL

```
http://<EC2-PUBLIC-IP>:5001
```

For local development:
```
http://localhost:5001
```

---

## Authentication

The API uses **JWT (JSON Web Tokens)** for authentication. After logging in, include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens expire after **2 days**.

---

## Endpoints

### 1. Health Check

**`GET /health`**

No authentication required.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-11-20T10:00:00.000Z"
}
```

---

### 2. Register User

**`POST /users/register`**

Creates a new user account (student or professor).

**Request Body:**
```json
{
  "name": "Professor P1",
  "email": "professor1@example.com",
  "password": "Test@123",
  "confirmPassword": "Test@123",
  "role": "professor"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | User's full name |
| email | string | Yes | Unique email address |
| password | string | Yes | Minimum 3 characters |
| confirmPassword | string | Yes | Must match password |
| role | string | Yes | `"professor"` or `"student"` |

**Success Response (201):**
```json
{
  "newUser": {
    "_id": "64abc...",
    "name": "Professor P1",
    "email": "professor1@example.com",
    "role": "professor"
  }
}
```

**Error Responses:**
- `422` — Missing fields, email already exists, password too short, passwords don't match

---

### 3. Login

**`POST /users/login`**

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "professor1@example.com",
  "password": "Test@123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUz...",
  "id": "64abc...",
  "name": "Professor P1",
  "role": "professor"
}
```

**Error Responses:**
- `422` — Missing fields, invalid credentials, wrong password

---

### 4. Get User Profile

**`GET /users/profile/:id`**

Returns user profile without password.

**Success Response (200):**
```json
{
  "_id": "64abc...",
  "name": "Professor P1",
  "email": "professor1@example.com",
  "role": "professor"
}
```

---

### 5. Create Availability Slot

**`POST /professor/availability`**

Creates a new availability slot for the authenticated professor.

**Auth Required:** JWT + Professor role

**Request Body:**
```json
{
  "startTime": "2026-11-20T10:00:00Z",
  "endTime": "2026-11-20T10:30:00Z"
}
```

**Success Response (201):**
```json
{
  "message": "Availability added successfully",
  "availability": {
    "_id": "64def...",
    "professorId": "64abc...",
    "startTime": "November 20th 2026, 10:00:00 am",
    "endTime": "November 20th 2026, 10:30:00 am"
  }
}
```

**Error Responses:**
- `400` — Start time >= end time, overlapping slot, no professor ID
- `402` — Not authenticated
- `403` — Not a professor

---

### 6. Update Free Slot ⭐ NEW

**`PUT /professor/update-slot/:slotId`**

Updates an existing FREE appointment slot. The original document `_id` is preserved (no delete/recreate).

**Auth Required:** JWT + Professor role

**URL Parameter:** `slotId` — The `_id` of the availability slot to update

**Request Body:**
```json
{
  "date": "2026-11-20",
  "startTime": "11:00",
  "endTime": "11:30"
}
```

| Field | Type | Required | Format | Description |
|-------|------|----------|--------|-------------|
| date | string | Yes | YYYY-MM-DD | The date for the slot |
| startTime | string | Yes | HH:mm | Start time (24-hour) |
| endTime | string | Yes | HH:mm | End time (24-hour) |

**Success Response (200):**
```json
{
  "message": "Availability slot updated successfully",
  "availability": {
    "_id": "64def...",
    "professorId": "64abc...",
    "startTime": "November 20th 2026, 11:00:00 am",
    "endTime": "November 20th 2026, 11:30:00 am"
  }
}
```

**Error Responses:**
- `400` — Invalid/missing slot ID, missing fields, invalid date/time format, start >= end, past date, overlapping slot, slot has booked appointments
- `402` — Not authenticated
- `403` — Not a professor / not the slot owner
- `404` — Slot not found
- `500` — Server error

**Key Behaviors:**
- Uses `findByIdAndUpdate` — updates in place, preserves `_id`
- Checks for booked appointments within the slot's time range before allowing update
- Validates against overlapping slots for the same professor (excluding the current slot)
- Only the professor who created the slot can update it

---

### 7. Cancel Appointments

**`PATCH /professor/cancel-appointments/:studentId`**

Cancels all booked appointments between the authenticated professor and the specified student.

**Auth Required:** JWT + Professor role

**URL Parameter:** `studentId` — The student's user `_id`

**Success Response (200):**
```json
{
  "message": "All appointments between professor <profId> and student <studentId> have been cancelled."
}
```

**Error Responses:**
- `400` — Invalid student ID
- `402` — Not authenticated
- `403` — Not a professor
- `404` — No booked appointments found

---

### 8. View Professor's Available Slots

**`GET /general/professor/:professorId/availability`**

Returns all availability slots for a professor.

**Auth Required:** JWT (any role)

**Success Response (200):**
```json
{
  "availableSlots": [
    {
      "StartTime": "November 20th 2026, 10:00:00 am",
      "EndTime": "November 20th 2026, 10:30:00 am"
    }
  ]
}
```

---

### 9. Book Appointment

**`POST /general/book`**

Books an appointment with a professor during an available slot.

**Auth Required:** JWT (any role)

**Request Body:**
```json
{
  "professorId": "64abc...",
  "time": "2026-11-20T10:00:00Z"
}
```

**Success Response (201):**
```json
{
  "message": "Appointment booked successfully",
  "appointment": {
    "studentId": "64xyz...",
    "professorId": "64abc...",
    "time": "November 20th 2026, 10:00:00 am",
    "status": "booked"
  }
}
```

---

### 10. Get Student's Appointments

**`GET /general/appointments`**

Returns all booked appointments for the authenticated student.

**Auth Required:** JWT (any role)

**Success Response (200):**
```json
{
  "message": "Your upcoming appointments:",
  "appointments": [
    {
      "professor": "Professor P1",
      "appointmentTime": "November 20th 2026, 10:00:00 am",
      "status": "booked"
    }
  ]
}
```

**When no appointments (404):**
```json
{
  "message": "You have no pending appointments"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 402 | Unauthorized (no/invalid token) |
| 403 | Forbidden (wrong role / not owner) |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |


# College Appointment System — Backend API

A Node.js/Express backend for managing college appointments between professors and students, deployed on AWS EC2 with AWS DocumentDB.

## 🏗️ Architecture

```
[Client / Postman] → [AWS EC2 (Node.js + PM2)] → [AWS DocumentDB]
                          Port 5001                  Port 27017
                      Public Subnet               Private Subnet
                      ──────────── Same VPC ────────────
```

## 🛠️ Technologies Used

- **Runtime**: Node.js 20.x (ESM modules)
- **Framework**: Express.js 4.x
- **Database**: MongoDB / AWS DocumentDB (Mongoose 8.x ODM)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Process Manager**: PM2
- **Cloud**: AWS EC2 (Ubuntu 22.04), AWS DocumentDB
- **Other**: Helmet, CORS, Morgan, Moment.js

## 📁 Project Structure

```
UnQue-2.0/
├── index.js                    # Main entry point
├── package.json                # Dependencies & scripts
├── .env.example                # Environment variable template
├── config/
│   └── database.js             # Database connection (MongoDB / DocumentDB)
├── controllers/
│   ├── user.js                 # Register, Login, Profile
│   ├── proff.js                # Set availability, Cancel, Update slot (NEW)
│   └── general.js              # View slots, Book, Student appointments
├── middleware/
│   ├── auth.js                 # JWT auth + Professor role check
│   └── error.js                # Error handling middleware
├── models/
│   ├── user.js                 # User schema (professor | student)
│   ├── availability.js         # Professor availability slots
│   ├── appointment.js          # Booked appointments
│   └── error.js                # HttpError class
├── routes/
│   ├── user.js                 # /users/* routes
│   ├── proff.js                # /professor/* routes
│   └── general.js              # /general/* routes
├── certs/                      # AWS DocumentDB CA certificate
├── deployment/
│   ├── ec2-setup.sh            # EC2 instance setup script
│   ├── deploy.sh               # Application deployment script
│   └── README.md               # Deployment guide
├── postman/
│   └── College-Appointment-System.postman_collection.json
├── tests/
│   └── updateSlot.test.js      # Tests for the new update-slot API
├── submission/
│   ├── README.md               # Submission overview
│   ├── API_DOCUMENTATION.md    # Complete API documentation
│   ├── DEPLOYMENT_GUIDE.md     # AWS deployment guide
│   ├── VIDEO_DEMO_SCRIPT.md    # API demo video script
│   └── DEVOPS_DEMO_SCRIPT.md   # DevOps demo video script
└── db-verification/
    └── queries.js              # DocumentDB verification queries
```

## 🚀 Local Setup

### Prerequisites
- Node.js 20.x or later
- MongoDB running locally (or a connection URI)

### Installation

```bash
git clone <repo-url>
cd UnQue-2.0
npm install
```

### Environment Configuration

```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=5001
JWT_SECRET=your_jwt_secret_here
MONGO_URL=mongodb://localhost:27017/unque
```

### Run the Server

```bash
node index.js
```

The server starts on `http://localhost:5001`. Verify with:
```bash
curl http://localhost:5001/health
```

## 📡 API Documentation

### Authentication
All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Endpoints

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/users/register` | — | — | Register a user |
| POST | `/users/login` | — | — | Login and get JWT token |
| GET | `/users/profile/:id` | — | — | Get user profile |
| POST | `/professor/availability` | JWT | Professor | Create availability slot |
| PUT | `/professor/update-slot/:slotId` | JWT | Professor | **NEW** — Update a free slot |
| PATCH | `/professor/cancel-appointments/:studentId` | JWT | Professor | Cancel appointments |
| GET | `/general/professor/:professorId/availability` | JWT | Any | View professor's slots |
| POST | `/general/book` | JWT | Any | Book an appointment |
| GET | `/general/appointments` | JWT | Any | Get student's appointments |
| GET | `/health` | — | — | Health check |

### New API: Update Free Slot

**`PUT /professor/update-slot/:slotId`**

Updates an existing FREE appointment slot without deleting and recreating it. Preserves the original document `_id`.

**Request:**
```json
{
  "date": "2026-11-20",
  "startTime": "11:00",
  "endTime": "11:30"
}
```

**Validations:**
- Only authenticated professors
- Professor can only update their own slots
- Cannot update booked slots
- Date/time format validation
- Cannot set past dates
- Prevents overlapping with other slots

**Success Response (200):**
```json
{
  "message": "Availability slot updated successfully",
  "availability": {
    "_id": "original-document-id",
    "professorId": "...",
    "startTime": "November 20th 2026, 11:00:00 am",
    "endTime": "November 20th 2026, 11:30:00 am"
  }
}
```

## ☁️ AWS DocumentDB Integration

The application supports both local MongoDB and AWS DocumentDB via environment variables (`MONGODB_URI` or `MONGO_URL`).

For DocumentDB in production, set in `.env`:
```
NODE_ENV=production
PORT=5001
USE_DOCUMENTDB=true
MONGODB_URI=mongodb://<docdbadmin>:<password>@<docdb-cluster-endpoint>:27017/unque?tls=true&retryWrites=false
MONGO_URL=mongodb://<docdbadmin>:<password>@<docdb-cluster-endpoint>:27017/unque?tls=true&retryWrites=false
DOCUMENTDB_CA_PATH=./certs/global-bundle.pem
```

The AWS Global Truststore CA certificate bundle (`global-bundle.pem`) is automatically retrieved during EC2 setup. See [submission/AWS_DEPLOYMENT_GUIDE.md](submission/AWS_DEPLOYMENT_GUIDE.md).

## 🖥️ EC2 Deployment

See [deployment/README.md](deployment/README.md) for full instructions.

Quick start:
```bash
# On EC2
bash deployment/ec2-setup.sh
cp .env.example .env
nano .env  # configure credentials
bash deployment/deploy.sh
```

## 🔐 Security Group Configuration

**EC2 Security Group:**
| Port | Source | Purpose |
|------|--------|---------|
| 22 | Your IP | SSH |
| 5001 | 0.0.0.0/0 | API access |

**DocumentDB Security Group:**
| Port | Source | Purpose |
|------|--------|---------|
| 27017 | EC2 SG ID | MongoDB protocol |

## 📬 Postman Testing

Import `postman/College-Appointment-System.postman_collection.json` into Postman.

Update the `baseUrl` collection variable to your EC2 public IP (e.g., `<EC2-IP>:5001`).

Run the collection in order — test scripts auto-capture tokens and IDs.

## ⚠️ Known Limitations

- DocumentDB does not support `retryWrites` — disabled in config
- The `getAvailableSlots` endpoint returns all availability slots including those already booked — filtering against appointments is not implemented in the original codebase
- JWT tokens expire after 2 days
- No rate limiting implemented
- No email validation beyond format


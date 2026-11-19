# College Appointment System — AWS Cloud Deployment Submission Package

## 📌 Project Overview
This repository contains the complete, production-grade cloud deployment of the **College Appointment System** Node.js backend. The application runs on **AWS EC2 (Ubuntu 22.04 LTS)** managed with **PM2** and connects securely to **AWS DocumentDB (MongoDB-compatible)** over an encrypted TLS channel inside a shared Amazon VPC.

---

## 📁 Submission Directory Structure

```
submission/
├── README.md                  # This submission package summary
├── API_DOCUMENTATION.md       # Complete endpoint definitions, request/response models & status codes
├── AWS_DEPLOYMENT_GUIDE.md    # End-to-end AWS EC2 & DocumentDB setup, VPC & Security Group guides
├── POSTMAN_TESTING_GUIDE.md   # Step-by-step Postman guide with environment & test assertions
├── VIDEO_1_DEMO_SCRIPT.md     # Postman API demonstration screen recording narration script
├── VIDEO_2_DEVOPS_SCRIPT.md   # AWS DevOps & Cloud Infrastructure screen recording narration script
└── FINAL_TEST_REPORT.md       # Detailed test execution report (100% pass rate, 30 assertions)
```

---

## 🌟 Key Accomplishments

### 1. New Feature Implementation
- **New API:** `PUT /professor/update-slot/:slotId`
  - Allows professors to update their existing free availability slot in place without deleting and recreating documents.
  - Strictly preserves document `_id`.
  - Enforces role validation (professors only, slot ownership check).
  - Protects booked slots (cannot modify slot if booked appointments exist).
  - Validates time format, prevents past slots, and prevents overlapping time windows.

### 2. Cloud Database Migration (AWS DocumentDB)
- Implemented environment-based connection in `config/database.js`.
- Configured TLS with the AWS Global Truststore CA bundle (`certs/global-bundle.pem`).
- Enforced `retryWrites=false` for DocumentDB engine compatibility.
- Maintained seamless fallback for local MongoDB development.

### 3. Production Deployment & Process Management
- Created automated EC2 initialization script (`deployment/ec2-setup.sh`).
- Created zero-downtime deployment script with PM2 (`deployment/deploy.sh`).
- Added PM2 process configuration (`deployment/ecosystem.config.js`).
- Bound server to `0.0.0.0:5001` with `/health` monitoring endpoint.

### 4. Quality Assurance & Bug Fixes
- Fixed status spelling mismatch (`"canceled"` vs schema enum `"cancelled"`).
- Fixed error middleware to properly deliver HTTP error status codes.
- Fixed stray character syntax error in user model.
- 100% test pass rate across 30 automated assertions.

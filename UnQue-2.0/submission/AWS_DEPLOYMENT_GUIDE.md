# AWS Deployment Guide — College Appointment System

This guide covers complete deployment of the College Appointment System backend on **AWS EC2** (Ubuntu 22.04 LTS) connected securely to **AWS DocumentDB** (MongoDB-compatible) within the same Amazon VPC.

---

## 🏛️ Architecture Overview

```
                      INTERNET / CLIENTS
                              │
                    Port 5001 (Public HTTP)
                              ▼
  ┌─────────────────────────────────────────────────────────┐
  │                 AWS VPC (10.0.0.0/16)                   │
  │                                                         │
  │   ┌─────────────────────────────────────────────────┐   │
  │   │ Public Subnet (10.0.1.0/24)                     │   │
  │   │                                                 │   │
  │   │   [AWS EC2 Instance: Ubuntu 22.04 LTS]          │   │
  │   │   • Node.js 20.x + PM2 (unque-api)              │   │
  │   │   • Listens on 0.0.0.0:5001                     │   │
  │   │   • Security Group: sg-ec2                      │   │
  │   │     - Inbound 22 (SSH from Admin IP)            │   │
  │   │     - Inbound 5001 (HTTP from 0.0.0.0/0)        │   │
  │   │     - Outbound 27017 (to sg-docdb)              │   │
  │   └───────────────────────┬─────────────────────────┘   │
  │                           │                             │
  │                   Port 27017 (TLS Encrypted)            │
  │                           │                             │
  │   ┌───────────────────────▼─────────────────────────┐   │
  │   │ Private Subnet (10.0.2.0/24)                    │   │
  │   │                                                 │   │
  │   │   [AWS DocumentDB Cluster]                      │   │
  │   │   • Engine: 5.0 (MongoDB 5.0 compatible)        │   │
  │   │   • TLS: Enabled (global-bundle.pem)            │   │
  │   │   • Security Group: sg-docdb                    │   │
  │   │     - Inbound 27017 ONLY from sg-ec2            │   │
  │   │     - NOT publicly accessible                   │   │
  │   └─────────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

1. **AWS Account** with permissions for EC2 and DocumentDB.
2. **SSH Key Pair** (`.pem` format) generated in your target AWS region (e.g. `ap-south-1` or `us-east-1`).
3. An existing **Amazon VPC** with at least two subnets in different Availability Zones (DocumentDB requirement).

---

## 🛠️ Step 1: Create DocumentDB Subnet Group & Cluster

### 1.1 DocumentDB Subnet Group
1. Go to **AWS Console** → **Amazon DocumentDB** → **Subnet groups** → **Create**.
2. **Name**: `docdb-subnet-group`
3. **VPC**: Select your target VPC.
4. Add at least two subnets in distinct Availability Zones.
5. Click **Create**.

### 1.2 DocumentDB Security Group (`sg-docdb`)
1. Go to **EC2 Console** → **Security Groups** → **Create security group**.
2. **Security group name**: `docdb-sg`
3. **VPC**: Select your target VPC.
4. **Inbound rules**:
   - Leave empty for now, or add **Custom TCP** Port `27017` with source set to your `ec2-sg` ID (created in Step 2).
5. Click **Create security group**.

### 1.3 Create DocumentDB Cluster
1. In **Amazon DocumentDB Console** → **Clusters** → **Create**.
2. **Cluster type**: Instance-based cluster.
3. **Cluster identifier**: `college-appointment-db`
4. **Engine version**: `5.0.0`
5. **Configuration**: `db.t3.medium` (or smallest available instance).
6. **Number of instances**: 1 (cost-effective for testing).
7. **Authentication**:
   - **Master username**: `docdbadmin`
   - **Master password**: `<Choose-A-Secure-Password>`
8. **Network settings**:
   - Select your VPC.
   - **Subnet group**: `docdb-subnet-group`
   - **VPC security groups**: Select `docdb-sg`.
9. **Cluster options**:
   - Port: `27017`
10. Click **Create cluster** (takes 5-10 minutes to become `Available`).
11. Copy the **Cluster Endpoint** (e.g., `college-appointment-db.cluster-xxxxxx.ap-south-1.docdb.amazonaws.com`).

---

## 💻 Step 2: Launch and Configure EC2 Instance

### 2.1 EC2 Security Group (`sg-ec2`)
1. Go to **EC2 Console** → **Security Groups** → **Create security group**.
2. **Name**: `ec2-api-sg`
3. **VPC**: Same VPC as DocumentDB.
4. **Inbound rules**:
   | Type | Port | Source | Description |
   | :--- | :--- | :--- | :--- |
   | **SSH** | `22` | `My IP` (`x.x.x.x/32`) | Admin terminal access |
   | **Custom TCP** | `5001` | `0.0.0.0/0` | Public API HTTP access |
5. Click **Create security group**.

> **Crucial Rule**: Now go back to `docdb-sg` and ensure inbound port `27017` is authorized from `ec2-api-sg` (`sg-xxxx`).

### 2.2 Launch EC2 Instance
1. Go to **EC2** → **Launch Instances**.
2. **Name**: `college-appointment-backend`
3. **AMI**: `Ubuntu Server 22.04 LTS` (64-bit x86).
4. **Instance type**: `t2.micro` (or `t3.micro`).
5. **Key pair**: Select your SSH key pair (e.g. `college-key.pem`).
6. **Network Settings**:
   - VPC: Same VPC.
   - Subnet: Public subnet.
   - **Auto-assign public IP**: **Enable**.
   - Select existing security group: `ec2-api-sg`.
7. Click **Launch Instance**.
8. Note down the **Public IPv4 address** (e.g., `13.232.xxx.xxx`).

---

## 🚀 Step 3: Setup Application on EC2

### 3.1 Connect via SSH
```bash
chmod 400 college-key.pem
ssh -i college-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### 3.2 Clone Project Repository
```bash
# Clone the repository
git clone <YOUR-GITHUB-REPO-URL> ~/UnQue-2.0
cd ~/UnQue-2.0
```

### 3.3 Run Automated EC2 Setup Script
```bash
# Installs Node.js 20.x, PM2, and downloads the AWS DocumentDB global CA bundle
bash deployment/ec2-setup.sh
```

### 3.4 Configure Production Environment Variables
```bash
cp .env.example .env
nano .env
```
Fill in the configuration:
```env
PORT=5001
NODE_ENV=production
JWT_SECRET=super_secure_production_secret_key_2026

# AWS DocumentDB Connection
USE_DOCUMENTDB=true
MONGODB_URI=mongodb://docdbadmin:<YOUR_DOCDB_PASSWORD>@<DOCDB_CLUSTER_ENDPOINT>:27017/unque?tls=true&retryWrites=false
MONGO_URL=mongodb://docdbadmin:<YOUR_DOCDB_PASSWORD>@<DOCDB_CLUSTER_ENDPOINT>:27017/unque?tls=true&retryWrites=false
DOCUMENTDB_CA_PATH=./certs/global-bundle.pem
```

---

## ⚡ Step 4: Deploy and Verify

### 4.1 Deploy with PM2
```bash
bash deployment/deploy.sh
```

### 4.2 Verify Local & Remote Health
```bash
# Test from EC2 terminal
curl http://localhost:5001/health

# Test from your local machine
curl http://<EC2-PUBLIC-IP>:5001/health
```
Expected output:
```json
{"status":"ok","timestamp":"2026-11-14T..."}
```

### 4.3 Check PM2 Process & Logs
```bash
pm2 status
pm2 logs unque-api --lines 30
```

---

## 🔒 Security Best Practices Checklist

- [x] DocumentDB is isolated in private subnets with NO public IP.
- [x] DocumentDB port `27017` is restricted strictly to EC2 Security Group ID.
- [x] TLS encryption in-transit is enforced using `global-bundle.pem`.
- [x] `.env` is ignored by git and never committed.
- [x] Server runs unprivileged under `ubuntu` user managed by PM2.


# Video 2 — DevOps and AWS Infrastructure Demonstration Script

**Title:** College Appointment System — AWS DevOps and Cloud Deployment  
**Scope:** AWS Management Console, VPC, EC2, DocumentDB, Security Groups, PM2, and Code Walkthrough  
**Duration:** ~5–7 Minutes  

---

## 🎬 Pre-Recording Checklist
- [ ] AWS Management Console open (EC2, DocumentDB, VPC, Security Groups).
- [ ] SSH terminal connected to the Ubuntu EC2 instance.
- [ ] Local editor / IDE showing modified project files.
- [ ] Ensure no secret keys, passwords, or tokens are exposed on screen.

---

## 🗣️ Step-by-Step Narration Script

### Scene 1: Introduction & Architecture Overview
- **Screen:** Show AWS Management Console dashboard.
- **Narration:**
  > *"Welcome to the DevOps and Cloud Infrastructure demonstration for the College Appointment System. In this video, we will review the AWS architecture, security group isolation, DocumentDB cluster configuration, EC2 instance setup with PM2, and our production source code."*

---

### Scene 2: Amazon VPC & Network Architecture
- **Screen:** Navigate to **VPC Console** → **Your VPCs**.
- **Show:** The shared VPC ID, IPv4 CIDR block (`10.0.0.0/16`), and subnets.
- **Narration:**
  > *"Both our EC2 instance and our DocumentDB cluster reside within the exact same Virtual Private Cloud (VPC). The EC2 instance is deployed in a public subnet with an Internet Gateway, while DocumentDB is isolated in private subnets across multiple availability zones."*

---

### Scene 3: AWS DocumentDB Cluster & Security Isolation
- **Screen:** Navigate to **Amazon DocumentDB** → **Clusters**.
- **Show:**
  - Cluster identifier: `college-appointment-db`
  - Status: `Available`
  - Engine version: `5.0.0`
  - Instance class: `db.t3.medium`
  - Cluster endpoint (without showing credentials)
- **Screen:** Click on the cluster's Security Group (`docdb-sg`).
- **Show Inbound Rules:**
  - Port `27017` allowed **ONLY** from the EC2 Security Group ID (`sg-xxxx`).
- **Narration:**
  > *"Notice that DocumentDB has no public IP address and cannot be accessed from the public internet. Port 27017 is strictly restricted to incoming traffic from our EC2 security group, ensuring private, zero-trust network isolation."*

---

### Scene 4: AWS EC2 Instance & Process Manager (PM2)
- **Screen:** Navigate to **EC2 Console** → **Instances**.
- **Show:**
  - Instance Name: `college-appointment-backend`
  - State: `Running`
  - AMI: `Ubuntu 22.04 LTS`
  - Public IPv4 Address
- **Screen:** Show EC2 Security Group (`ec2-api-sg`):
  - Inbound rule: Port `22` (SSH from administrator IP)
  - Inbound rule: Port `5001` (Custom TCP from `0.0.0.0/0` for API access)
- **Screen:** Switch to SSH terminal on the EC2 instance.
- **Run Commands:**
  ```bash
  # Check PM2 process status
  pm2 status

  # View application listening port and process
  sudo netstat -tlpn | grep 5001

  # Check startup configuration
  pm2 startup
  ```
- **Narration:**
  > *"On our EC2 instance, the Node.js application is managed by PM2 as a system service. PM2 guarantees continuous uptime, automatic restarts if an exception occurs, and automatic recovery on EC2 system reboots."*

---

### Scene 5: Code Walkthrough & DocumentDB TLS Integration
- **Screen:** Show project source code in editor / terminal.
- **File 1:** `config/database.js`
  - Point out: TLS CA bundle loading (`certs/global-bundle.pem`), `retryWrites=false`, and support for `MONGODB_URI` / `MONGO_URL`.
- **File 2:** `controllers/proff.js` (`updateSlot` controller)
  - Point out: `findByIdAndUpdate` document in-place modification, date validation, booked slot conflict checks, and overlap prevention.
- **File 3:** `deployment/ecosystem.config.js` & `deploy.sh`
  - Point out: Idempotent deployment automation and process management.
- **Narration:**
  > *"Our database configuration dynamically handles AWS DocumentDB requirements: it loads Amazon's global CA certificate bundle, sets retryWrites to false for DocumentDB compatibility, and strictly avoids hardcoding any credentials."*

---

### Scene 6: Live Health Check & Connectivity Verification
- **Screen:** Terminal / Browser.
- **Run:**
  ```bash
  curl http://<EC2-PUBLIC-IP>:5001/health
  ```
- **Show:** `{"status":"ok","timestamp":"2026-..."}`
- **Narration:**
  > *"We execute a health check against the live EC2 public endpoint. The response returns HTTP 200 OK, confirming the entire chain—from client to EC2 and EC2 to DocumentDB—is functioning smoothly."*

---

### Scene 7: Conclusion
- **Narration:**
  > *"This concludes the DevOps and Cloud Infrastructure demonstration. The architecture is fully secure, automated, and ready for production."*


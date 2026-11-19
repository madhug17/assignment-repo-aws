# Deployment Guide — College Appointment System

## Prerequisites

- AWS Account with EC2 and DocumentDB access
- Ubuntu 22.04 LTS EC2 instance (t2.micro or t3.micro for testing)
- Security groups configured (see below)
- SSH key pair for EC2 access

## Architecture

```
[Client/Postman] → [EC2 Instance (Node.js/PM2)] → [AWS DocumentDB]
                         Port 5001                    Port 27017
                     Public Subnet                 Private Subnet
                     ─────────── Same VPC ───────────
```

## Step-by-Step Deployment

### 1. Launch EC2 Instance

1. Launch an Ubuntu 22.04 LTS instance (t2.micro for free tier)
2. Select or create a key pair for SSH
3. Place the instance in a VPC that has (or will have) a DocumentDB cluster
4. Assign a public IP for external access
5. Configure the security group:

   **EC2 Security Group (Inbound Rules):**
   | Type | Port | Source | Purpose |
   |------|------|--------|---------|
   | SSH | 22 | Your IP | SSH access |
   | Custom TCP | 5001 | 0.0.0.0/0 | API access |

### 2. Launch DocumentDB Cluster

1. Create a DocumentDB cluster in the **same VPC** as the EC2 instance
2. Choose a subnet group within the VPC
3. Set master username and password
4. Configure the security group:

   **DocumentDB Security Group (Inbound Rules):**
   | Type | Port | Source | Purpose |
   |------|------|--------|---------|
   | Custom TCP | 27017 | EC2 Security Group ID | MongoDB protocol |

### 3. SSH into EC2 and Run Setup

```bash
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# Upload or clone the project
git clone <your-repo-url> ~/UnQue-2.0

# Run setup script
cd ~/UnQue-2.0
bash deployment/ec2-setup.sh
```

### 4. Configure Environment

```bash
cp .env.example .env
nano .env
```

Set the following values:
```
PORT=5001
JWT_SECRET=<your-secure-jwt-secret>
USE_DOCUMENTDB=true
MONGO_URL=mongodb://<username>:<password>@<docdb-cluster-endpoint>:27017/unque?tls=true&retryWrites=false
DOCUMENTDB_CA_PATH=./certs/global-bundle.pem
```

### 5. Deploy

```bash
bash deployment/deploy.sh
```

### 6. Verify

```bash
# From EC2
curl http://localhost:5001/health

# From your local machine
curl http://<EC2-PUBLIC-IP>:5001/health
```

## Troubleshooting

### Cannot connect to DocumentDB
- Verify EC2 and DocumentDB are in the same VPC
- Check DocumentDB security group allows port 27017 from EC2 security group
- Verify the CA certificate is downloaded: `ls certs/global-bundle.pem`
- Test connectivity: `mongo --tls --tlsCAFile certs/global-bundle.pem --host <docdb-endpoint>:27017`

### Application won't start
- Check logs: `pm2 logs unque-api`
- Verify .env exists and has all required variables
- Verify npm packages: `npm install`

### Health check fails
- Check PM2 status: `pm2 status`
- Check if port 5001 is open: `sudo netstat -tlnp | grep 5001`
- Check EC2 security group allows inbound on port 5001

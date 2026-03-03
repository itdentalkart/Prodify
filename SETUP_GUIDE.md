# DK Productivity Suite — Local Ubuntu Server Setup Guide

## Overview
Yeh guide aapko Supabase se local Ubuntu server par migrate karne mein help karega.

---

## STEP 1: Ubuntu Server — Node.js Install

```bash
# Node.js 18+ install karein
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version   # should be v18+
npm --version
```

---

## STEP 2: MongoDB Already Installed Check

```bash
# MongoDB service check
sudo systemctl status mongod

# Agar nahi chal raha toh start karein:
sudo systemctl start mongod
sudo systemctl enable mongod

# Test connection
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

---

## STEP 3: Backend Server Setup

```bash
# Project copy karein (ya git clone)
cd /home/your-user

# Server folder mein jayein
cd dk-local/server

# .env file banayein
cp .env.example .env
nano .env
```

### .env mein apna IP set karein:
```
MONGODB_URI=mongodb://localhost:27017/dk_productivity
JWT_SECRET=koi_bhi_lamba_random_string_yahan_daalein_2024
PORT=3000
FRONTEND_URL=http://192.168.1.100:5173
SERVER_PUBLIC_URL=http://192.168.1.100:3000
```

```bash
# Dependencies install
npm install

# First time: seed database (admin user banao)
npm run seed

# Server start
npm start
```

**Test karein:**
```bash
curl http://localhost:3000/health
# Response: {"status":"ok","time":"..."}
```

---

## STEP 4: PM2 se Server Background mein Chalao (Recommended)

```bash
# PM2 install
sudo npm install -g pm2

# Server start with PM2
pm2 start index.js --name "dk-server"

# Auto-restart on reboot
pm2 startup
pm2 save
```

---

## STEP 5: Firewall Port Open Karein

```bash
# Ubuntu UFW
sudo ufw allow 3000/tcp   # backend
sudo ufw allow 5173/tcp   # frontend dev server
sudo ufw status
```

---

## STEP 6: Frontend Config Update

### `src/integrations/api/client.ts` file add karein:
- Provided `frontend-patch/client.ts` ko copy karein: `src/integrations/api/client.ts`

### `src/hooks/useAuth.tsx` replace karein:
- Provided `frontend-patch/useAuth.tsx` se replace karein

### `.env` ya `vite.config` mein add karein:
```
VITE_API_URL=http://192.168.1.100:3000
```

### Frontend run karein:
```bash
npm install
npm run dev -- --host 0.0.0.0
```

---

## STEP 7: Windows Agent Fix

### Agent Service Start Nahi Hoti — Main Reasons & Fixes:

**Problem 1: Supabase URL hardcoded hai**
- `AgentConfig.cs` mein `ServerUrl` change karein:
  ```
  http://192.168.1.100:3000
  ```
  (Provided `agent-fix/AgentConfig.cs` use karein)

**Problem 2: Enrollment nahi hua service start se pehle**
- Provided `agent-fix/Program.cs` aur `agent-fix/EnrollmentHelper.cs` add karein
- Yeh service start hone par automatically enroll karega

**Problem 3: .NET 7 Runtime missing**
- Windows machine par install karein:
  https://dotnet.microsoft.com/download/dotnet/7.0
  (.NET 7 Desktop Runtime x64)

**Problem 4: Admin privileges nahi**
- Services mein run hone ke liye admin rights chahiye
- PowerShell **as Administrator** mein install.ps1 chalayein

### Agent Build & Install Steps:

```powershell
# 1. Visual Studio / VS Code mein project open karein

# 2. Provided files replace karein:
#    - AgentConfig.cs
#    - Program.cs
#    - Add: EnrollmentHelper.cs

# 3. Build karein
dotnet publish -c Release -r win-x64 --self-contained -o ./publish

# 4. Dashboard se enrollment token generate karein
#    Dashboard > Devices > Generate Token

# 5. Install karein (PowerShell as Admin)
.\install.ps1 -ServerUrl "http://192.168.1.100:3000" -EnrollToken "AAPKA_TOKEN_YAHAN"
```

### Debug mode (service start na ho toh):
```powershell
# Directly exe chalao console mode mein
C:\Program Files\DKAgent\DKAgent.exe --console
```
Yeh Windows Event Log ki jagah console mein error dikhayega.

---

## STEP 8: Verify Everything Works

```bash
# 1. Server health check
curl http://192.168.1.100:3000/health

# 2. Login test
curl -X POST http://192.168.1.100:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"Demo@123"}'

# 3. Devices list (with token)
curl http://192.168.1.100:3000/api/devices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Default Login Credentials (after seed)

| Role        | Email                    | Password   |
|-------------|--------------------------|------------|
| super_admin | superadmin@dk.local      | Admin@123  |
| admin       | admin@demo.local         | Demo@123   |

**IMPORTANT: Production mein ye passwords zaroor change karein!**

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB connect nahi ho raha | `sudo systemctl start mongod` |
| Port 3000 busy | `.env` mein PORT change karein |
| Agent enroll fail | Dashboard se naya token banao, check karein token expire toh nahi |
| Frontend API error | `VITE_API_URL` check karein, CORS allow hai? |
| Windows Service start nahi | Event Viewer check karein, ya `--console` mode mein run karein |

---

## Architecture (After Migration)

```
Windows Agent (C#)
      │
      │ HTTP REST
      ▼
Ubuntu Server (Node.js + Express) :3000
      │
      ├── MongoDB :27017
      │    └── dk_productivity database
      │
      └── /uploads/screenshots/
           └── (local file storage)

Browser (React) :5173
      │
      │ HTTP API calls
      ▼
Ubuntu Server :3000
```

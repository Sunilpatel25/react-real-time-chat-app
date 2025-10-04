# 🚀 How to Run Admin Dashboard - Quick Start

## Step 1: Start Backend Server

Open a terminal and navigate to the backend folder:

```bash
cd backend
npm install  # If you haven't installed dependencies yet
npm start    # Or: node server.js
```

✅ Backend should be running on **http://localhost:5001**

---

## Step 2: Start Frontend Server

Open a **NEW** terminal and navigate to the project root:

```bash
cd ..        # Go back to project root if you're in backend folder
npm install  # If you haven't installed dependencies yet
npm run dev  # Start Vite dev server
```

✅ Frontend should be running on **http://localhost:5173** (or the port shown in terminal)

---

## Step 3: Create an Admin User

### Option A: Register as First User (Automatic Admin)
1. Open your browser to **http://localhost:5173**
2. Click "Register" or "Sign Up"
3. Enter your details:
   - Name: Your Name
   - Email: admin@example.com
   - (Password is auto-filled in this app)
4. Click Register
5. **You're now an admin!** (First user = automatic admin)

### Option B: Make Existing User an Admin (Manual)

Open a **NEW** terminal and connect to MongoDB:

```bash
# Connect to MongoDB
mongosh

# Use your database
use chat-app

# Find your user
db.users.find().pretty()

# Make a specific user admin by email
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)

# Verify it worked
db.users.findOne({ email: "your-email@example.com" })
# Should show: role: "admin"

# Exit MongoDB
exit
```

---

## Step 4: Login as Admin

1. Go to **http://localhost:5173**
2. If not already logged in, enter your admin credentials
3. Click "Login"
4. You should see the chat interface

---

## Step 5: Access Admin Dashboard

Look for the **"Admin"** button in the **top-right corner** of the screen:

```
┌────────────────────────────────────────┐
│  Chat App              [🏠 Admin]      │  ← Click this button!
└────────────────────────────────────────┘
```

**Click the "Admin" button** and the admin dashboard will open!

---

## 🎉 You're In!

You should now see the admin dashboard with 4 tabs:

```
┌─────────────────────────────────────────────────────┐
│  🏠 Admin Dashboard                          Logout  │
├─────────────────────────────────────────────────────┤
│  📊 Overview  │  👥 Users  │  💬 Chats  │  📋 Activity  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Stats Cards]    [Online Users]                    │
│                   [Recent Activity]                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### ❌ "Admin button not showing"
**Fix:** User doesn't have admin role
```bash
# Connect to MongoDB and run:
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
# Then refresh the browser
```

### ❌ "Dashboard is empty"
**Fix:** Backend not running
```bash
# Make sure backend is running on port 5001
cd backend
npm start
```

### ❌ "Cannot connect to database"
**Fix:** MongoDB not running
```bash
# Windows:
# Open Services → Start MongoDB

# Mac:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

### ❌ "Port already in use"
**Fix:** Kill the process using the port
```bash
# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process

# Mac/Linux:
lsof -ti:5173 | xargs kill -9
```

---

## Quick Commands Cheat Sheet

```bash
# Start everything (run in separate terminals):

# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
npm run dev

# Terminal 3 - MongoDB (if not auto-starting)
mongosh
```

---

## Switch Between Chat and Admin

- **To Admin**: Click "Admin" button (top-right)
- **To Chat**: Click "Admin" button again (toggles)
- **Or**: Click "Logout" and login again

---

## Default Port Configuration

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **Socket.io**: http://localhost:5001
- **MongoDB**: mongodb://localhost:27017

If these ports are different in your setup, check:
- `config.ts` for frontend ports
- `backend/server.js` for backend port

---

## 🎊 That's It!

You should now have:
✅ Backend running
✅ Frontend running
✅ Admin user created
✅ Admin dashboard accessible

**Enjoy your admin dashboard!** 🚀

---

## Need More Help?

- Check **ADMIN_TESTING.md** for detailed testing guide
- Check **ADMIN_DASHBOARD.md** for feature documentation
- Check **ADMIN_GUIDE.ts** for code examples
- Look at browser console for error messages
- Check network tab for failed API requests

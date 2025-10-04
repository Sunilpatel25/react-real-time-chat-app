# 🔐 Admin Setup Guide

## How to Create an Admin User

### Method 1: Using the Frontend (Recommended)

1. **Navigate to Login Screen**
   - Open your browser and go to: `http://localhost:3001/`

2. **Click "Setup Admin Account"**
   - On the login screen, you'll see a button at the bottom: **"Setup Admin Account"**
   - Click this button

3. **Enter User Email**
   - The default email is already filled in: `savaliyasunil25@gmail.com`
   - You can change this to any registered user's email
   - **Important**: The user must already be registered in the system

4. **Click "Make Admin"**
   - Click the "🔐 Make Admin" button
   - Wait for the success message: "✅ [Name] is now an admin!"
   - The page will automatically reload

5. **Login as Admin**
   - Login with the email you just made admin
   - You'll now see the "Admin Dashboard" button in the sidebar

---

### Method 2: Using MongoDB Directly

If you have access to MongoDB Atlas or your database:

1. **Open MongoDB Atlas**
   - Go to: https://cloud.mongodb.com/
   - Login with your credentials
   - Navigate to your cluster

2. **Find the Users Collection**
   - Click "Browse Collections"
   - Select your database
   - Click on the `users` collection

3. **Update User Role**
   - Find the user with email: `savaliyasunil25@gmail.com`
   - Click "Edit Document"
   - Add or modify the `role` field:
     ```json
     {
       "role": "admin"
     }
     ```
   - Save the document

4. **Login**
   - Logout if already logged in
   - Login again with the admin email
   - The admin dashboard button will now appear

---

### Method 3: Using API Directly (For Developers)

If you want to use the API endpoint directly:

```bash
# Using curl
curl -X POST http://localhost:8900/api/users/make-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "savaliyasunil25@gmail.com"}'

# Using PowerShell
Invoke-RestMethod -Method POST -Uri "http://localhost:8900/api/users/make-admin" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"savaliyasunil25@gmail.com"}'
```

---

## Default Admin Details

- **Email**: `savaliyasunil25@gmail.com`
- **Name**: `Sunil`

## Important Notes

⚠️ **Prerequisites**:
- The user must already be registered in the system
- The backend server must be running on port 8900
- The frontend server must be running on port 3001

✅ **After Making Admin**:
- The user can access the Admin Dashboard
- Admin button appears in the sidebar
- Access to: User Management, Chat Monitoring, Activity Logs

🔒 **Security**:
- In production, add proper authentication middleware to the `/make-admin` endpoint
- Restrict this endpoint to existing admins only
- Add rate limiting to prevent abuse

---

## Troubleshooting

### "User not found" Error
- Make sure the user is registered first
- Check the email is spelled correctly (case-insensitive)
- Verify the user exists in MongoDB

### Admin Button Not Showing
- Clear your browser cache
- Logout and login again
- Check that `user.role === 'admin'` in the database

### Cannot Access Setup Page
- Make sure both servers are running
- Check that you're on the login screen
- Look for the "Setup Admin Account" button at the bottom

---

## Testing Admin Access

1. **Register/Login** with `savaliyasunil25@gmail.com`
2. **Click "Setup Admin Account"** on login screen
3. **Make the user admin** using the form
4. **Refresh the page** and login again
5. **Click the Admin Dashboard button** in the sidebar
6. **Explore the 4 admin tabs**:
   - Overview (Statistics and activity)
   - Users (User management)
   - Chats (Conversation monitoring)
   - Activity (Activity logs)

---

## API Endpoint Details

### Make User Admin

**Endpoint**: `POST /api/users/make-admin`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "message": "User successfully promoted to admin",
  "user": {
    "_id": "...",
    "name": "User Name",
    "email": "user@example.com",
    "role": "admin",
    ...
  }
}
```

**Error Responses**:
- `400`: Email is required
- `404`: User not found with this email
- `500`: Server error

---

## Quick Start Commands

```powershell
# Start Backend (Terminal 1)
cd backend
node server.js

# Start Frontend (Terminal 2)
npm run dev

# Access Application
# Frontend: http://localhost:3001
# Backend: http://localhost:8900
```

---

Made with ❤️ by Sunil

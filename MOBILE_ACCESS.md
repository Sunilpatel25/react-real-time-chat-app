# 📱 Mobile Access Guide

## How to Access Your Chat App on Your Phone

### 🔧 Prerequisites
1. Your phone and computer must be on the **same WiFi network**
2. Backend server must be running
3. Frontend dev server must be running

---

## 🚀 Quick Setup Steps

### Step 1: Start the Backend Server
Open a terminal in the `backend` folder:
```powershell
cd backend
npm run dev
```
The backend will run on port **8900**

### Step 2: Enable Network Access
Open `config.ts` in the root folder and change:
```typescript
const USE_NETWORK_IP = true; // Change from false to true
```

### Step 3: Start the Frontend Server
Open another terminal in the root folder:
```powershell
npm run dev
```
The frontend will run on port **3000**

### Step 4: Access from Your Phone
Open your phone's browser and go to:
```
http://10.99.20.153:3000
```

---

## 📝 Important Notes

### Your Computer's IP Address
- Current IP: **10.99.20.153**
- This may change if you restart your router or computer
- To find your IP again, run: `ipconfig | findstr /i "IPv4"`

### Firewall Settings
If you can't access the app from your phone:

1. **Allow through Windows Firewall:**
   - Open Windows Firewall settings
   - Click "Allow an app through firewall"
   - Find Node.js and check both Private and Public boxes

2. **Or create a new rule:**
   - Open Windows Firewall → Advanced Settings
   - Inbound Rules → New Rule
   - Port → TCP → Specific ports: 3000, 8900
   - Allow the connection

### Testing Checklist
- ✅ Both servers are running
- ✅ `USE_NETWORK_IP = true` in config.ts
- ✅ Phone and computer on same WiFi
- ✅ Firewall allows ports 3000 and 8900
- ✅ Using correct IP address

---

## 🔄 Switch Back to Localhost

When testing on your computer only, change back:
```typescript
const USE_NETWORK_IP = false; // in config.ts
```

---

## 🌐 Production Deployment (Optional)

For permanent mobile access, consider deploying to:

### Frontend Options:
- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**

### Backend Options:
- **Render** (has free tier)
- **Railway**
- **Heroku**
- **DigitalOcean**

### Database:
- Your MongoDB Atlas is already cloud-based ✅

---

## 🐛 Troubleshooting

### Can't connect from phone?
1. Check if both devices show the same WiFi name
2. Verify your IP hasn't changed: `ipconfig`
3. Try accessing `http://10.99.20.153:3000` from your computer's browser first
4. Check Windows Firewall settings
5. Temporarily disable antivirus to test

### Backend connection fails?
- Ensure backend is running on port 8900
- Check MongoDB connection in backend/.env
- Look at backend terminal for errors

### Still not working?
1. Restart both servers
2. Clear browser cache on phone
3. Try incognito/private mode on phone
4. Check backend logs for CORS errors

---

## 🎉 Success!
Once connected, you should see the beautiful gradient login screen on your phone!

Happy chatting! 💬

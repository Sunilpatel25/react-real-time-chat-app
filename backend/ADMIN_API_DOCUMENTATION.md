# 🔌 Admin API Documentation

## 📋 Overview

Complete backend API endpoints for admin message controls with real-time Socket.IO support.

---

## 🔐 Authentication

All admin endpoints require authentication via the `verifyAdmin` middleware.

### **Admin ID Header/Body:**
Include the admin's user ID in one of these locations:
- **Header:** `x-admin-id: <userId>`
- **Body:** `adminId: <userId>`
- **Query:** `?adminId=<userId>`

### **Middleware Check:**
```javascript
// Verifies:
1. User exists
2. User role === 'admin'
3. Returns 403 if not admin
```

---

## 📡 REST API Endpoints

Base URL: `http://localhost:8900/api/admin`

### 1. **Edit Message** ✏️

**Endpoint:** `PUT /messages/:messageId`

**Description:** Edit any message (admin only)

**Request:**
```json
PUT /api/admin/messages/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "text": "Edited message content",
  "adminId": "507f191e810c19729de860ea"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "507f1f77bcf86cd799439011",
    "text": "Edited message content",
    "isEdited": true,
    "lastEditedBy": "507f191e810c19729de860ea",
    "lastEditedAt": "2025-10-06T10:30:00.000Z",
    "editHistory": [
      {
        "editedBy": "507f191e810c19729de860ea",
        "editedAt": "2025-10-06T10:30:00.000Z",
        "originalText": "Original message",
        "editType": "admin"
      }
    ],
    // ... other message fields
  },
  "action": "edit",
  "performedBy": "Admin Name"
}
```

**Console Log:**
```
[ADMIN ACTION] User Admin Name (507f191e810c19729de860ea) edited message 507f1f77bcf86cd799439011
Original: "Original message" → New: "Edited message content"
```

---

### 2. **Delete Message** 🗑️

**Endpoint:** `DELETE /messages/:messageId`

**Description:** Delete any message (admin only)

**Request:**
```json
DELETE /api/admin/messages/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "adminId": "507f191e810c19729de860ea"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "507f1f77bcf86cd799439011",
  "action": "delete",
  "performedBy": "Admin Name",
  "deletionRecord": {
    "messageId": "507f1f77bcf86cd799439011",
    "conversationId": "507f1f77bcf86cd799439012",
    "senderId": "507f1f77bcf86cd799439013",
    "text": "Deleted message text",
    "deletedBy": "507f191e810c19729de860ea",
    "deletedAt": "2025-10-06T10:30:00.000Z",
    "originalTimestamp": "2025-10-05T15:20:00.000Z"
  }
}
```

---

### 3. **Bulk Delete Messages** 🗑️🔢

**Endpoint:** `POST /messages/bulk-delete`

**Description:** Delete multiple messages at once

**Request:**
```json
POST /api/admin/messages/bulk-delete
Content-Type: application/json

{
  "messageIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "adminId": "507f191e810c19729de860ea"
}
```

**Response:**
```json
{
  "success": true,
  "deletedCount": 3,
  "action": "bulk_delete",
  "performedBy": "Admin Name",
  "deletionRecords": [
    {
      "messageId": "507f1f77bcf86cd799439011",
      "conversationId": "507f1f77bcf86cd799439012",
      "senderId": "507f1f77bcf86cd799439013",
      "text": "Message 1",
      "deletedBy": "507f191e810c19729de860ea",
      "deletedAt": "2025-10-06T10:30:00.000Z"
    },
    // ... more records
  ]
}
```

---

### 4. **Flag Message** 🚩

**Endpoint:** `POST /messages/:messageId/flag`

**Description:** Flag a message for review

**Request:**
```json
POST /api/admin/messages/507f1f77bcf86cd799439011/flag
Content-Type: application/json

{
  "adminId": "507f191e810c19729de860ea",
  "reason": "Inappropriate content"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "507f1f77bcf86cd799439011",
    "isFlagged": true,
    "flaggedBy": "507f191e810c19729de860ea",
    "flaggedAt": "2025-10-06T10:30:00.000Z",
    "flagReason": "Inappropriate content",
    "flagStatus": "pending",
    // ... other message fields
  },
  "action": "flag",
  "performedBy": "Admin Name",
  "flagReason": "Inappropriate content"
}
```

---

### 5. **Unflag Message** ✅

**Endpoint:** `POST /messages/:messageId/unflag`

**Description:** Resolve/unflag a flagged message

**Request:**
```json
POST /api/admin/messages/507f1f77bcf86cd799439011/unflag
Content-Type: application/json

{
  "adminId": "507f191e810c19729de860ea",
  "resolution": "Reviewed and approved"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "507f1f77bcf86cd799439011",
    "isFlagged": false,
    "flagStatus": "resolved",
    "resolvedBy": "507f191e810c19729de860ea",
    "resolvedAt": "2025-10-06T10:35:00.000Z",
    "resolution": "Reviewed and approved",
    // ... other message fields
  },
  "action": "unflag",
  "performedBy": "Admin Name"
}
```

---

### 6. **Get Message Details** ℹ️

**Endpoint:** `GET /messages/:messageId/details`

**Description:** Get full message metadata including populated fields

**Request:**
```
GET /api/admin/messages/507f1f77bcf86cd799439011/details?adminId=507f191e810c19729de860ea
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "507f1f77bcf86cd799439011",
    "text": "Message content",
    "senderId": {
      "id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "...",
      "role": "user"
    },
    "conversationId": {
      "id": "507f1f77bcf86cd799439012",
      "members": ["...", "..."],
      // ... conversation details
    },
    "status": "read",
    "timestamp": "2025-10-05T15:20:00.000Z",
    "isEdited": true,
    "lastEditedBy": "507f191e810c19729de860ea",
    "lastEditedAt": "2025-10-06T10:30:00.000Z",
    "editHistory": [...],
    "isFlagged": false,
    // ... all fields
  },
  "action": "view_details",
  "performedBy": "Admin Name"
}
```

---

### 7. **Get Flagged Messages** 🚩📋

**Endpoint:** `GET /messages/flagged`

**Description:** Get all flagged messages with optional status filter

**Request:**
```
GET /api/admin/messages/flagged?status=pending&adminId=507f191e810c19729de860ea
```

**Query Parameters:**
- `status` (optional): `pending`, `reviewed`, `resolved`
- `adminId` (required): Admin user ID

**Response:**
```json
{
  "success": true,
  "count": 5,
  "messages": [
    {
      "id": "507f1f77bcf86cd799439011",
      "text": "Flagged message content",
      "senderId": {
        "name": "User Name",
        "email": "user@example.com",
        "avatar": "..."
      },
      "flaggedBy": {
        "name": "Admin Name",
        "email": "admin@example.com"
      },
      "flaggedAt": "2025-10-06T10:00:00.000Z",
      "flagReason": "Inappropriate content",
      "flagStatus": "pending",
      // ... other fields
    },
    // ... more messages
  ]
}
```

---

### 8. **Get Activity Log** 📊

**Endpoint:** `GET /activity-log`

**Description:** Get admin activity history (edits and flags)

**Request:**
```
GET /api/admin/activity-log?limit=50&skip=0&adminId=507f191e810c19729de860ea
```

**Query Parameters:**
- `limit` (optional, default: 50): Number of results
- `skip` (optional, default: 0): Number to skip (pagination)
- `adminId` (required): Admin user ID

**Response:**
```json
{
  "success": true,
  "activityLog": {
    "edits": [
      {
        "action": "edit",
        "messageId": "507f1f77bcf86cd799439011",
        "performedBy": {
          "name": "Admin Name",
          "email": "admin@example.com"
        },
        "performedAt": "2025-10-06T10:30:00.000Z",
        "originalSender": {
          "name": "User Name",
          "email": "user@example.com"
        },
        "editHistory": [...]
      },
      // ... more edits
    ],
    "flags": [
      {
        "action": "flag",
        "messageId": "507f1f77bcf86cd799439012",
        "performedBy": {
          "name": "Admin Name",
          "email": "admin@example.com"
        },
        "performedAt": "2025-10-06T10:00:00.000Z",
        "reason": "Spam",
        "status": "pending",
        "originalSender": {
          "name": "Spammer",
          "email": "spam@example.com"
        }
      },
      // ... more flags
    ]
  }
}
```

---

### 9. **Get Admin Statistics** 📈

**Endpoint:** `GET /stats`

**Description:** Get message statistics and percentages

**Request:**
```
GET /api/admin/stats?adminId=507f191e810c19729de860ea
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalMessages": 1000,
    "editedMessages": 50,
    "flaggedMessages": 25,
    "pendingFlags": 10,
    "editPercentage": "5.00",
    "flagPercentage": "2.50"
  }
}
```

---

## 🔌 Socket.IO Events

### **Namespace:** Default (`/`)

### 1. **Admin Edit Message** (Emit)

**Event:** `adminEditMessage`

**Payload:**
```javascript
socket.emit('adminEditMessage', {
  messageId: '507f1f77bcf86cd799439011',
  newText: 'Edited content',
  adminId: '507f191e810c19729de860ea',
  conversationId: '507f1f77bcf86cd799439012'
});
```

**Server Response (Broadcast):**
```javascript
socket.on('messageEdited', (data) => {
  // data = {
  //   messageId: '507f1f77bcf86cd799439011',
  //   newText: 'Edited content',
  //   conversationId: '507f1f77bcf86cd799439012',
  //   editedBy: '507f191e810c19729de860ea',
  //   isAdminEdit: true
  // }
});
```

---

### 2. **Admin Delete Message** (Emit)

**Event:** `adminDeleteMessage`

**Payload:**
```javascript
socket.emit('adminDeleteMessage', {
  messageId: '507f1f77bcf86cd799439011',
  adminId: '507f191e810c19729de860ea',
  conversationId: '507f1f77bcf86cd799439012'
});
```

**Server Response (Broadcast):**
```javascript
socket.on('messageDeleted', (data) => {
  // data = {
  //   messageId: '507f1f77bcf86cd799439011',
  //   conversationId: '507f1f77bcf86cd799439012',
  //   deletedBy: '507f191e810c19729de860ea',
  //   isAdminDelete: true
  // }
});
```

---

### 3. **Admin Flag Message** (Emit)

**Event:** `adminFlagMessage`

**Payload:**
```javascript
socket.emit('adminFlagMessage', {
  messageId: '507f1f77bcf86cd799439011',
  adminId: '507f191e810c19729de860ea',
  reason: 'Inappropriate content',
  conversationId: '507f1f77bcf86cd799439012'
});
```

**Server Response (Broadcast):**
```javascript
socket.on('messageFlagged', (data) => {
  // data = {
  //   messageId: '507f1f77bcf86cd799439011',
  //   conversationId: '507f1f77bcf86cd799439012',
  //   flaggedBy: '507f191e810c19729de860ea',
  //   reason: 'Inappropriate content'
  // }
});
```

---

## 📦 Message Schema Updates

### **New Fields Added:**

```javascript
{
  // Edit tracking
  isEdited: Boolean,
  lastEditedBy: ObjectId (ref: User),
  lastEditedAt: Date,
  editHistory: [{
    editedBy: ObjectId (ref: User),
    editedAt: Date,
    originalText: String,
    editType: String (enum: 'user', 'admin')
  }],
  
  // Flag tracking
  isFlagged: Boolean,
  flaggedBy: ObjectId (ref: User),
  flaggedAt: Date,
  flagReason: String,
  flagStatus: String (enum: 'pending', 'reviewed', 'resolved'),
  resolvedBy: ObjectId (ref: User),
  resolvedAt: Date,
  resolution: String
}
```

---

## 🔒 Error Responses

### **401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Admin ID is required"
}
```

### **403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "Admin privileges required"
}
```

### **404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Message not found"
}
```

### **400 Bad Request:**
```json
{
  "error": "Bad Request",
  "message": "Message text is required"
}
```

### **500 Server Error:**
```json
{
  "error": "Server Error",
  "message": "Detailed error message"
}
```

---

## 🧪 Testing with Postman/cURL

### **Edit Message:**
```bash
curl -X PUT http://localhost:8900/api/admin/messages/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "text": "New edited content",
    "adminId": "507f191e810c19729de860ea"
  }'
```

### **Delete Message:**
```bash
curl -X DELETE http://localhost:8900/api/admin/messages/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "507f191e810c19729de860ea"
  }'
```

### **Flag Message:**
```bash
curl -X POST http://localhost:8900/api/admin/messages/507f1f77bcf86cd799439011/flag \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "507f191e810c19729de860ea",
    "reason": "Spam content"
  }'
```

### **Get Flagged Messages:**
```bash
curl -X GET "http://localhost:8900/api/admin/messages/flagged?status=pending&adminId=507f191e810c19729de860ea"
```

---

## 📊 Audit Logging

All admin actions are logged to console:

```
[ADMIN ACTION] User Admin Name (507f191e810c19729de860ea) edited message 507f1f77bcf86cd799439011
[ADMIN ACTION] User Admin Name (507f191e810c19729de860ea) deleted message 507f1f77bcf86cd799439011
[ADMIN ACTION] User Admin Name (507f191e810c19729de860ea) flagged message 507f1f77bcf86cd799439011
[SOCKET] Admin 507f191e810c19729de860ea edited message 507f1f77bcf86cd799439011
[SOCKET] Admin 507f191e810c19729de860ea deleted message 507f1f77bcf86cd799439011
[SOCKET] Admin 507f191e810c19729de860ea flagged message 507f1f77bcf86cd799439011
```

---

## 🚀 Integration Example (Frontend)

### **REST API Call:**
```typescript
// Edit message
async function adminEditMessage(messageId: string, newText: string, adminId: string) {
  const response = await fetch(`http://localhost:8900/api/admin/messages/${messageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: newText, adminId }),
  });
  
  return await response.json();
}
```

### **Socket.IO Integration:**
```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:8900');

// Emit admin edit
socket.emit('adminEditMessage', {
  messageId: msg.id,
  newText: editedText,
  adminId: currentUser.id,
  conversationId: activeConversation.id,
});

// Listen for edit confirmations
socket.on('messageEdited', (data) => {
  if (data.isAdminEdit) {
    // Update UI to show edited message
    updateMessageInUI(data.messageId, data.newText);
  }
});

// Listen for deletions
socket.on('messageDeleted', (data) => {
  if (data.isAdminDelete) {
    // Remove message from UI
    removeMessageFromUI(data.messageId);
  }
});
```

---

## 📝 Summary

✅ **9 REST API Endpoints** - Full CRUD for admin actions
✅ **3 Socket.IO Events** - Real-time admin edits, deletes, flags
✅ **Admin Middleware** - Automatic role verification
✅ **Audit Logging** - All actions logged to console
✅ **Edit History** - Complete tracking of message modifications
✅ **Flag System** - Mark, review, and resolve inappropriate content
✅ **Bulk Operations** - Delete multiple messages at once
✅ **Statistics** - Admin dashboard metrics
✅ **Activity Log** - Complete admin action history

**Your backend is now fully equipped with enterprise-grade admin controls!** 🎉

# Real-Time Admin Synchronization

## Overview
This document explains the real-time synchronization system for admin actions using Socket.IO. When an admin edits, deletes, or flags a message, all connected clients receive the update immediately.

## Architecture

### Frontend Components
- **App.tsx**: Socket.IO event listeners for real-time updates
- **ChatWindow.tsx**: Socket.IO event emitters for admin actions
- **MessageBubble.tsx**: Visual indicators for edited/flagged messages

### Backend Components
- **server.js**: Socket.IO event handlers and broadcasting
- **routes/admin.js**: REST API endpoints for admin operations
- **models/Message.js**: Enhanced schema with admin tracking fields

## Socket.IO Events

### 1. Admin Edit Message

**Emitted by:** Frontend (ChatWindow.tsx)
```javascript
socket.emit('adminEditMessage', {
    messageId: string,
    text: string,
    editedBy: string,
    conversationId: string,
    isAdmin: boolean
});
```

**Broadcast by:** Backend (server.js)
```javascript
io.emit('messageEdited', {
    messageId: string,
    text: string,
    editedBy: string,
    isAdmin: boolean,
    timestamp: number
});
```

**Handled by:** Frontend (App.tsx)
- Updates message text in current conversation
- Sets `isEdited`, `lastEditedAt`, `lastEditedBy` fields
- Updates last message in conversations list

### 2. Admin Delete Message

**Emitted by:** Frontend (ChatWindow.tsx)
```javascript
socket.emit('adminDeleteMessage', {
    messageId: string,
    deletedBy: string,
    conversationId: string,
    isAdmin: boolean
});
```

**Broadcast by:** Backend (server.js)
```javascript
io.emit('messageDeleted', {
    messageId: string,
    conversationId: string,
    deletedBy: string,
    isAdmin: boolean
});
```

**Handled by:** Frontend (App.tsx)
- Removes message from current conversation
- Updates conversations list if deleted message was last message

### 3. Admin Flag Message

**Emitted by:** Frontend (ChatWindow.tsx)
```javascript
socket.emit('adminFlagMessage', {
    messageId: string,
    flaggedBy: string,
    flagReason: string,
    conversationId: string,
    isAdmin: boolean
});
```

**Broadcast by:** Backend (server.js)
```javascript
io.emit('messageFlagged', {
    messageId: string,
    isFlagged: boolean,
    flaggedBy: string,
    flagReason: string,
    timestamp: number
});
```

**Handled by:** Frontend (App.tsx)
- Updates message flag status in current conversation
- Sets `isFlagged`, `flaggedBy`, `flagReason`, `flaggedAt` fields

## Visual Indicators

### Edited by Admin Badge
When a message is edited by an admin, it displays an amber badge:
```
📝 Edited by Admin
```
- Background: `bg-amber-100/80`
- Text: `text-amber-800`
- Icon: Pencil icon

### Flagged Badge
When a message is flagged, it displays a red badge:
```
🚩 Flagged
```
- Background: `bg-red-100/80`
- Text: `text-red-800`
- Icon: Flag icon

## Flow Diagrams

### Admin Edit Flow
```
1. Admin clicks "Edit" in context menu
2. ChatWindow displays edit input with message text
3. Admin modifies text and clicks save
4. ChatWindow emits 'adminEditMessage' via Socket.IO
5. Backend receives event, updates database
6. Backend broadcasts 'messageEdited' to ALL clients
7. All clients receive event and update their UI
8. Message shows "Edited by Admin" badge
```

### Admin Delete Flow
```
1. Admin clicks "Delete (Admin)" in context menu
2. ChatWindow emits 'adminDeleteMessage' via Socket.IO
3. Backend receives event, deletes from database
4. Backend broadcasts 'messageDeleted' to ALL clients
5. All clients receive event and remove message from UI
6. Conversations list updates if it was last message
```

### Admin Flag Flow
```
1. Admin clicks "Flag Message" in context menu
2. ChatWindow prompts for flag reason
3. ChatWindow emits 'adminFlagMessage' via Socket.IO
4. Backend receives event, updates database
5. Backend broadcasts 'messageFlagged' to ALL clients
6. All clients receive event and update message status
7. Message shows "Flagged" badge
```

## Database Schema Updates

### Message Model (backend/models/Message.js)
```javascript
{
    // ... existing fields ...
    
    // Admin Edit Tracking
    isEdited: { type: Boolean, default: false },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastEditedAt: { type: Date },
    editHistory: [{
        editedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        editedByType: { type: String, enum: ['user', 'admin'] },
        oldText: String,
        newText: String,
        timestamp: { type: Date, default: Date.now }
    }],
    
    // Admin Flag Tracking
    isFlagged: { type: Boolean, default: false },
    flaggedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    flaggedAt: { type: Date },
    flagReason: String,
    flagStatus: { 
        type: String, 
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolution: String
}
```

## Frontend State Management

### Message Type (types.ts)
```typescript
export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    image?: string;
    timestamp: number;
    status: 'sent' | 'delivered' | 'read';
    
    // Admin tracking fields
    isEdited?: boolean;
    lastEditedBy?: string;
    lastEditedAt?: number;
    isFlagged?: boolean;
    flaggedBy?: string;
    flaggedAt?: number;
    flagReason?: string;
}
```

## Testing Real-Time Sync

### Test Scenario 1: Edit Message
1. Open app in two browser tabs (one as admin, one as regular user)
2. Admin edits a message in Tab 1
3. Verify message updates immediately in Tab 2
4. Verify "Edited by Admin" badge appears in both tabs

### Test Scenario 2: Delete Message
1. Open app in two browser tabs
2. Admin deletes a message in Tab 1
3. Verify message disappears immediately in Tab 2
4. Verify conversation list updates in both tabs

### Test Scenario 3: Flag Message
1. Open app in two browser tabs
2. Admin flags a message in Tab 1 with reason
3. Verify "Flagged" badge appears immediately in Tab 2
4. Verify flag status persists after page reload

### Test Scenario 4: Multiple Admins
1. Open app with two admin accounts
2. Admin 1 edits a message
3. Admin 2 sees the edit immediately
4. Admin 2 flags the same message
5. Admin 1 sees the flag immediately

## Troubleshooting

### Messages Not Updating
1. Check Socket.IO connection status
2. Verify backend Socket.IO events are emitting
3. Check browser console for Socket.IO errors
4. Verify user has admin role (`user.role === 'admin'`)

### Edit Badge Not Showing
1. Check Message type includes admin fields
2. Verify `isEdited` and `lastEditedBy` are set
3. Check MessageBubble component rendering logic

### Backend Not Broadcasting
1. Verify admin routes are integrated in server.js
2. Check Socket.IO event handlers (lines 110-185)
3. Verify `io.emit()` is being called
4. Check backend console logs

## Performance Considerations

### Optimization Strategies
1. **Event Batching**: For bulk operations, send single event with array
2. **Selective Broadcasting**: Only emit to users in affected conversation
3. **Debouncing**: Prevent rapid-fire edit events
4. **Message Limit**: Paginate messages to avoid large state updates

### Scaling Considerations
1. Use Redis adapter for Socket.IO in multi-server setup
2. Implement room-based messaging (per conversation)
3. Add rate limiting for admin actions
4. Consider WebSocket connection pooling

## Security

### Admin Authentication
- Verify admin role on both frontend and backend
- Backend middleware checks JWT token + role
- Frontend checks `currentUser.role === 'admin'`

### Event Validation
- Backend validates all Socket.IO events
- Verify user ID matches authenticated user
- Sanitize message text to prevent XSS
- Rate limit admin actions per user

## Future Enhancements

### Planned Features
1. **Admin Notifications**: Toast notifications for admin actions
2. **Audit Trail**: Complete history of all admin actions
3. **Bulk Operations**: Edit/delete/flag multiple messages
4. **Undo Functionality**: Revert admin actions within time window
5. **Admin Analytics**: Dashboard showing admin action statistics
6. **Flag Management**: Review and resolve flagged messages
7. **Edit History Viewer**: See all edits made to a message
8. **Admin Permissions**: Granular permissions (edit-only, delete-only, etc.)

## API Reference

See [ADMIN_API_DOCUMENTATION.md](backend/ADMIN_API_DOCUMENTATION.md) for complete REST API documentation.

## Related Documentation
- [ADMIN_MESSAGE_CONTROLS.md](ADMIN_MESSAGE_CONTROLS.md) - Frontend admin controls
- [backend/ADMIN_API_DOCUMENTATION.md](backend/ADMIN_API_DOCUMENTATION.md) - Backend API reference
- [ADMIN_GUIDE.ts](ADMIN_GUIDE.ts) - Admin usage guide

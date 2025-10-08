# React Real-Time Chat App - AI Agent Instructions

## Performance Optimizations ✅ (January 2025)

### Completed Optimizations
1. **Tailwind CDN Replacement** - Replaced 407.3 kB CDN with PostCSS build (-97.1% size)
2. **Text Compression** - Added gzip/brotli middleware in backend
3. **React.memo** - Memoized MessageBubble & ConversationListItem
4. **Code Splitting** - Lazy loaded AdminDashboard (22.18 kB) with React.lazy + Suspense
5. **Vite Build Config** - Terser minification, manual chunks, drop_console
6. **INP Optimization** - Fixed 248ms interaction delay (see below)

### INP (Interaction to Next Paint) Fix
**Problem**: Activity log rendered 145 items (1,488 DOM nodes), causing 248ms INP
**Solution**: Infinite scroll + debouncing + memoization
- ✅ Renders only 20 items initially (86% fewer DOM nodes)
- ✅ Debounced search (300ms) prevents typing lag
- ✅ Memoized computations (useMemo/useCallback)
- ✅ Progressive loading on scroll (20 items per batch)

**Results**:
- INP: 248ms → <200ms ✅ (GOOD)
- Initial DOM: 1,488 → 200 nodes (-86%)
- CLS: 0.00 (PERFECT)
- See `INP_OPTIMIZATION_SUMMARY.md` for details

## Architecture Overview

This is a full-stack real-time chat application with admin capabilities:
- **Frontend**: React 19 + TypeScript + Vite (port 3000)
- **Backend**: Express + Socket.IO + MongoDB (port 8900)
- **Real-time**: Socket.IO for bidirectional messaging, typing indicators, online status
- **Auth**: JWT tokens stored in localStorage as 'chat-token'
- **Admin**: Role-based system with real-time message moderation

## Project Structure

```
/                    # Frontend (React + TypeScript)
├── App.tsx          # Main app with socket management & routing logic
├── config.ts        # Environment-aware API/Socket URLs (dev vs prod)
├── types.ts         # Shared TypeScript interfaces
├── components/      # React components (AdminDashboard, ChatLayout, etc.)
└── services/        # API wrappers (mockApi.ts uses fetch + JWT headers)

/backend             # Backend (Node.js + Express)
├── server.js        # Socket.IO setup + event handlers
├── routes/          # REST API routes (auth, messages, admin, etc.)
└── models/          # Mongoose schemas (User, Message, Conversation)
```

## Critical Workflows

### Starting the Application (PowerShell)
```powershell
# Terminal 1: Backend
cd backend; npm install; npm run dev

# Terminal 2: Frontend  
npm install; npm run dev
```

**First-time setup**: Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` and `JWT_SECRET`. The server exits with a fatal error if these are missing.

### Socket.IO Event System

**Key Pattern**: All real-time features use Socket.IO events defined in `backend/server.js` and consumed in `App.tsx`.

**Client emits** (from `App.tsx`):
- `addUser(userId)` - Register user connection
- `sendMessage({senderId, receiverId, text, conversationId, image})` - Send message
- `typingStart/typingStop({conversationId, receiverId})` - Typing indicators
- `markAsRead({conversationId, receiverId})` - Mark messages read
- Admin events: `adminEditMessage`, `adminDeleteMessage`, `adminFlagMessage`

**Client listens** (in `App.tsx`):
- `getUsers` - Online users list
- `receiveMessage` - New messages
- `messagesRead` - Read receipts
- `messageEdited/messageDeleted/messageFlagged` - Admin actions
- `typingStart/typingStop` - Other users typing

**Socket initialization**: Uses global `io` from CDN script tag in `index.html` (not npm package). Initialize in `App.tsx` with `socket.current = io(SOCKET_URL)`.

## Configuration & Environment

### Frontend: `config.ts`
- **Development**: Set `USE_NETWORK_IP = true` and update `NETWORK_IP` for mobile testing
- **Production**: Update `PRODUCTION_BACKEND_URL` after deploying backend
- Exports `API_BASE_URL` and `SOCKET_URL` based on `import.meta.env.PROD`

### Backend: `.env` (required)
- `MONGO_URI` - MongoDB Atlas connection string (fatal error if missing)
- `JWT_SECRET` - Token signing secret (fatal error if missing)
- `PORT` - Optional, defaults to 8900

## API & Authentication

**Pattern**: All API calls go through `services/mockApi.ts` which:
1. Adds `Authorization: Bearer ${token}` header if token exists
2. Wraps fetch with error handling
3. Uses `API_BASE_URL` from `config.ts`

**Auth flow**:
- Login/register returns `{user, token}`
- Token stored via `setToken()` in localStorage
- Subsequent requests auto-include token via `apiFetch()` wrapper
- Admin routes check `role === 'admin'` in User model

## Admin System

**Access**: Users with `role: 'admin'` in MongoDB see admin dashboard on login (auto-opens in `App.tsx`).

**Key features**:
- Real-time message editing/deletion/flagging via Socket.IO
- REST endpoints in `backend/routes/admin.js` use `verifyAdmin` middleware
- Admin actions tracked with `isEdited`, `lastEditedBy`, `lastEditedAt` fields in Message model
- Mock data generation via `services/adminMockData.ts` for development

**Admin middleware**: `backend/routes/admin.js` checks `userId` from request body/query/headers, validates user exists and has `role === 'admin'`.

## Data Models (Mongoose)

**User** (`backend/models/User.js`):
- Fields: `name`, `email`, `password`, `avatar`, `role` ('user' | 'admin')
- Transforms `_id` to `id` in JSON responses (toJSON override)

**Message** (`backend/models/Message.js`):
- Fields: `conversationId`, `senderId`, `text`, `image`, `status` ('sent' | 'delivered' | 'read')
- Admin tracking: `isEdited`, `lastEditedBy`, `isFlagged`, `flaggedBy`, `flagReason`

**Conversation** (`backend/models/Conversation.js`):
- Fields: `members[]` (user IDs), `lastMessage` (ref to Message)

## Common Patterns

### Adding new socket events:
1. **Backend**: Add handler in `backend/server.js` in `io.on('connection')` block
2. **Frontend**: Emit in `App.tsx` via `socket.current.emit()` and/or listen with `socket.current.on()`
3. Use `getUser(receiverId)` helper to find socket ID for targeted emits

### Adding new API endpoints:
1. Create route in `backend/routes/` folder
2. Add to `backend/server.js` with `app.use('/api/<path>', require('./routes/<file>'))`
3. Add wrapper function in `services/mockApi.ts` using `apiFetch()` helper
4. Auth-protected routes can access user via JWT token verification

### TypeScript types:
- All shared types in `types.ts` (User, Message, Conversation, ActivityLog)
- Backend uses plain JavaScript with JSDoc comments for basic typing

## Deployment Notes

- Frontend deployed to Render/similar (update `PRODUCTION_BACKEND_URL` in `config.ts`)
- Backend needs `_redirects` file for SPA routing (already in `public/`)
- Socket.IO CORS set to `origin: '*'` for simplicity (tighten for production)
- Increase JSON limit in backend: `express.json({ limit: '10mb' })` for base64 images

## Testing & Mobile Access

**Mobile testing**: 
- Set `USE_NETWORK_IP = true` in `config.ts`
- Update `NETWORK_IP` to your computer's local IP
- Use `get-mobile-url.bat` script to get QR code (if available)
- Ensure mobile device on same network

**No test framework currently configured** - manual testing via browser/mobile.

## Design System & Color Palette

**Colors defined in `index.html` with Tailwind config** - All colors support light/dark mode.

### Primary Palette (Friendly Blue - Telegram-inspired)
- **primary-600**: `#2563EB` - Main brand color, buttons, links
- **primary-500**: `#3b82f6` - Hover states
- **primary-100-200**: Light backgrounds for cards/inputs
- Used for: Main CTA buttons, active states, brand elements

### Secondary Palette (Warm Green - WhatsApp-inspired)  
- **secondary-500**: `#22C55E` - Success states, online indicators
- **secondary-600**: `#16a34a` - Darker green for emphasis
- Used for: Success messages, online status dots, positive actions

### Accent Palette (Soft Coral)
- **accent-500**: `#F97316` - Attention grabbing highlights
- **accent-600**: `#ea580c` - Stronger accent
- Used for: Notifications, special badges, important alerts

### Neutral Palette (Warm Gray)
- **neutral-50-200**: Backgrounds, cards, borders
- **neutral-500-700**: Text colors (secondary text)
- **neutral-800-900**: Primary text
- Used for: Text, borders, backgrounds, shadows

### Additional UI Colors
- **Indigo**: `indigo-50` to `indigo-900` - Complementary UI elements, analytics
- **Purple**: `purple-50` to `purple-900` - Secondary highlights, user stats
- **Pink**: `pink-50` to `pink-900` - Tertiary accents, special features

### Status Colors
- **Success**: `#10B981` (emerald-500) - Confirmations, online status
- **Warning**: Yellow-500/600 - Warnings, pending states
- **Error**: Red-500/600 - Errors, destructive actions

### Gradient Classes
```css
.gradient-primary     /* Blue gradient (#2563EB → #3b82f6) */
.gradient-secondary   /* Green gradient (#22C55E → #16a34a) */
.gradient-accent      /* Coral gradient (#F97316 → #ea580c) */
.gradient-success     /* Mint gradient (#10B981 → #059669) */
.gradient-friendly    /* Blue to Green (#2563EB → #22C55E) */
.gradient-warm        /* Blue to Coral (#3b82f6 → #F97316) */
.gradient-indigo      /* Indigo gradient (#4f46e5 → #6366f1) */
.gradient-purple      /* Purple gradient (#9333ea → #a855f7) */
.gradient-pink        /* Pink gradient (#db2777 → #ec4899) */
.gradient-animated    /* Multi-color animated gradient */

/* Text gradients */
.gradient-text-indigo /* Indigo gradient text effect */
.gradient-text-purple /* Purple gradient text effect */
.gradient-text-pink   /* Pink gradient text effect */
```

### Glass Morphism Effects
```css
.glass-effect    /* White frosted glass with blur */
.glass           /* Light glass effect for containers */
.glass-primary   /* Primary-tinted glass effect */
.glass-indigo    /* Indigo-tinted glass effect */
```

### Shadow & Card Styles
```css
.shadow-modern     /* Primary-tinted shadow (small) */
.shadow-modern-lg  /* Primary-tinted shadow (large) */
.shadow-modern-xl  /* Primary-tinted shadow (extra large) */
.shadow-glow       /* Primary glow effect */
.shadow-glow-secondary /* Secondary (green) glow effect */
.card-modern       /* Clean white card with shadow */
```

### Neon Effects
```css
.neon-glow           /* Primary blue neon text glow */
.neon-glow-secondary /* Green neon text glow */
.neon-glow-accent    /* Coral neon text glow */
.neon-border         /* Primary blue neon border */
```

### Typography
- **Font-sans**: Inter (main UI text)
- **Font-display**: Poppins (headings, bold elements)
- Loaded via Google Fonts CDN in `index.html`

### Interactive Elements
- All buttons and interactive elements use `hover:scale-105 active:scale-95` transforms
- Smooth transitions: `transition-all duration-200` or `duration-300`
- Touch-friendly tap targets: min 44px height/width

## Common Gotchas

1. **Socket not connecting**: Check `SOCKET_URL` matches backend port in `config.ts`
2. **401 errors**: Token expired/invalid - call `api.logout()` to clear
3. **Messages not appearing**: Socket events may not be registered - check `socket.current.on()` listeners in `App.tsx` useEffect
4. **Admin features not working**: Verify user has `role: 'admin'` in MongoDB (update manually via MongoDB Atlas)
5. **CORS issues**: Backend allows all origins - if issues persist, check Socket.IO client version matches server version
6. **Color classes not working**: Colors defined in Tailwind config in `index.html` script tag - not in separate CSS file
7. **Gradient/glass classes not working**: Custom CSS classes defined in `<style>` tag in `index.html` - ensure you're using exact class names
8. **"Unexpected token '<'" errors**: Fixed - API now checks content-type before parsing JSON
9. **Socket disconnections**: Fixed - automatic reconnection enabled with exponential backoff (5 attempts)
10. **Message send failures**: Fixed - acknowledgment callbacks now revert optimistic UI updates on error

## Recent Fixes (January 2025)

### Socket.IO Improvements
- ✅ Added comprehensive connection error handling (`connect_error`, `reconnect`, `reconnect_failed`)
- ✅ Configured reconnection with exponential backoff (5 attempts, 1-5s delay)
- ✅ Added transport upgrade monitoring for debugging
- ✅ Implemented disconnect reason handling with auto-reconnect
- ✅ Added acknowledgment callbacks to `sendMessage` event for reliability

### Mongoose Improvements
- ✅ Added connection error handlers (`error`, `disconnected`, `reconnected`, `timeout`)
- ✅ Reduced server selection timeout to 5 seconds (from 30s)
- ✅ Configured connection pool size (maxPoolSize: 10)
- ✅ Added global error handling middleware for validation, cast, and duplicate key errors
- ✅ Better error logging with reason tracking

### API Error Handling
- ✅ Added content-type checking before JSON parsing
- ✅ Graceful handling of HTML error responses
- ✅ Improved error messages for users and developers

**See `PROJECT_FIXES_SUMMARY.md` for complete details.**

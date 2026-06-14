# TaskFlow — AI-Powered Task Management App

A full-stack task management application built with the MERN stack. Manage personal tasks, collaborate with a team, get AI-powered assistance via Google Gemini, and receive email notifications — all in one clean, animated interface.

---

## Features

### Authentication & Security
- **Register / Login** with JWT tokens (7-day expiry) stored in localStorage
- **Email verification** — new accounts must verify email before logging in (24-hour token expiry)
- **Resend verification** — re-send the verification link if it expires
- **Forgot password / Reset password** via secure tokenized email link (expires in 15 minutes)
- **Strong password validation** — 8+ chars, uppercase, lowercase, number, and special character required
- **Protected routes** — all task and team endpoints require a valid JWT
- **Axios request interceptor** — token is automatically attached to every API request from localStorage so Vite HMR never breaks authentication
- **401-only token clearing** — token is only removed on explicit 401 responses, not network errors (prevents logout during backend restarts)

### Task Management
- **Create, edit, delete tasks** with full server-side validation
- **Task fields:**
  - Title (3–100 chars)
  - Description (0–500 chars, rich-text)
  - Status: Todo / Pending / Completed
  - Priority: Low / Medium / High
  - Due date (optional)
  - Assigned team members (multiple)
  - File attachments (multiple)
- **Quick Add bar** on the dashboard — type a task title, pick priority, status, due date, and assign members without opening a modal
- **Rich text editor** (TipTap) for task descriptions and comments — Bold, Italic, Underline, Strikethrough, Headings (H2), Bullet lists, Ordered lists, Blockquotes, Inline code, Code blocks, Undo/Redo, and Clear formatting
- **Toggle status** — click the checkmark on any task row to cycle its status instantly
- **Priority-colored left border** on each task row (red = high, amber = medium, green = low)

### Filtering, Search & Pagination
- **Search** tasks by title or description with 350 ms debounce
- **Filter by status** — All / Todo / Pending / Completed
- **Filter by priority** — All / High / Medium / Low
- **Sort** — Newest first / Oldest first / Due date ascending
- **Sidebar views** — Dashboard, My Tasks, Due Today, Completed
- **Due Today view** — dedicated view showing only tasks due today
- **Pagination** — 8 tasks per page with page controls

### Stats Dashboard
- Four animated stat cards — Total Tasks, Pending, Completed, Overdue
- **Count-up animation** on numbers using `requestAnimationFrame` with ease-out cubic easing
- **Skeleton loaders** for stats and task list while data loads
- Stats refresh automatically after every create, update, or delete action

### File Attachments
- Upload images, PDFs, Word, Excel, and text files (max 10 MB per file)
- Allowed types: JPEG, PNG, GIF, WebP, PDF, .docx, .xlsx, .txt, .csv
- Files stored on the server under `/backend/uploads/`
- File icons in the UI based on MIME type
- Download or delete attachments from the task modal

### Comments & Activity
- Add rich-text comments on any existing task
- Comments show author avatar (initials + color), name, and relative time ("2h ago", "just now")
- Delete your own comments only (auth-checked on the server)
- Comment editor uses TipTap (same toolbar as description)
- Comments displayed in chronological order (oldest first)

### Team Collaboration & Invitations
- **Invite team members** by email directly from the sidebar
- **Invitation flow:**
  1. Inviter sends an invite email from the sidebar
  2. Recipient clicks the link → public preview page shows inviter name and invited email (no login required)
  3. Recipient clicks **Accept** → prompted to Sign In or Register (email pre-filled)
  4. New users: create account, verify email
  5. After login/register + email verification → invitation is auto-accepted
  6. Both users appear under **TEAM** in the sidebar and can assign tasks to each other
- Invitation tokens expire after 7 days
- **Bidirectional membership** — both users can assign tasks to each other after acceptance
- **Transitive workspace relationships** — if A invites B and B invites C, A can see C in their team
- Pending invite token stored in localStorage so the flow works even if email verification opens in a new tab
- View sent invitations and their status (pending / accepted)

### AI Assistant (Google Gemini)
- **Floating AI chat button** (bottom-right) + **sidebar AI button** + **dismissable top hint banner**
- Powered by **Google Gemini 2.5 Flash** (free tier — 1,500 requests/day, no credit card needed)
- **Suggestion chips** shown on first open for quick discovery
- **What you can ask:**
  - **Create tasks:** *"Create a high priority task to fix the login bug due Friday"*
  - **Complete tasks:** *"Mark the login bug task as complete"*
  - **Delete tasks:** *"Delete the test task"*
  - **Update tasks:** *"Change 'add on credits' to low priority"* / *"Mark X as pending"*
  - **Assign tasks:** *"Assign 'add on credits' to Priya"*
  - **Query tasks:** *"How many tasks do I have?"*, *"Which tasks are overdue?"*
- **JSON action parsing** — AI response is parsed for structured actions (`create`, `complete`, `delete`, `update`, `assign`); falls back to plain conversational text for questions
- **Team member resolution** — matches assignee names or emails to actual team members
- **Email notifications** sent to newly assigned members when AI assigns tasks
- AI hint banner dismisses permanently (saved to localStorage)

### Email Notifications
All emails sent via Gmail SMTP (Nodemailer). Plain-text format used for better inbox delivery from personal Gmail accounts.

| Trigger | Email sent |
|---|---|
| Registration | Email verification link (24-hour expiry) |
| Forgot password | Password reset link (15-minute expiry) |
| Task assigned to team member | Task details + link to dashboard |
| Task status changed | New status + who changed it (sent to all involved except the changer) |
| Task deleted | Notification of deletion (sent to all involved except the deleter) |
| Team invitation | Accept link (7-day expiry) |

### UI & Animations
- **Animated stat cards** slide up on load with staggered CSS animation delays
- **Gradient animated name** in the dashboard header (cycles through blue → cyan → purple)
- **Skeleton loaders** for stats and task list while data loads
- **Toast notifications** for all success/error actions
- **Sidebar resizable** by dragging the right edge (width saved to localStorage)
- **Count-up numbers** animate from 0 to actual value on each load using `requestAnimationFrame`
- Responsive layout — sidebar collapses on mobile
- Zero external CSS framework — ~2,355 lines of hand-written CSS

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | 4.19.2 | REST API server |
| MongoDB + Mongoose | 8.4.1 | Database and ODM |
| JWT (jsonwebtoken) | 9.0.2 | Authentication tokens (7-day expiry) |
| bcryptjs | 2.4.3 | Password hashing (12 salt rounds) |
| Nodemailer | 8.0.11 | Email sending via Gmail SMTP |
| Multer | 1.4.5-lts.1 | File upload handling (10 MB limit) |
| @google/generative-ai | 0.24.1 | Gemini 2.5 Flash AI integration |
| express-validator | 7.2.0 | Input validation and sanitization |
| dotenv | 16.4.5 | Environment variable management |
| nodemon | 3.1.4 | Dev auto-restart |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 5.3.1 | Build tool and dev server |
| React Router v6 | 6.24.0 | Client-side routing |
| Axios | 1.7.2 | HTTP client with request interceptor |
| TipTap | 3.26.1 | Rich text editor (ProseMirror-based) |
| Custom CSS | — | All styling, animations, and layout (no framework) |

### Infrastructure
- **Database:** MongoDB Atlas (cloud-hosted)
- **SMTP:** Gmail SMTP via Nodemailer
- **AI:** Google Gemini API (free tier)
- **Package manager:** pnpm (monorepo workspace)
- **Dev server proxy:** Vite `/api` proxy → `http://localhost:5000`

---

## Project Structure

```
Task Management/
├── pnpm-workspace.yaml               # Monorepo configuration
├── package.json                      # Root workspace scripts (dev, install:all)
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js         # Register, login, verify email, reset password
│   │   ├── taskController.js         # CRUD, stats, status toggle, search/filter/sort
│   │   ├── commentController.js      # Add/delete comments on tasks
│   │   ├── attachmentController.js   # Upload/delete file attachments
│   │   ├── inviteController.js       # Send/preview/accept invitations, team list
│   │   ├── userController.js         # Search users by name/email
│   │   └── aiController.js           # Gemini AI chat — parse intent, perform actions
│   ├── middleware/
│   │   ├── auth.js                   # JWT protect middleware
│   │   └── upload.js                 # Multer config (10 MB, allowed MIME types)
│   ├── models/
│   │   ├── User.js                   # name, email, password, isVerified, token fields
│   │   ├── Task.js                   # title, description, status, priority, dueDate, members, attachments
│   │   ├── Comment.js                # text, author ref, task ref
│   │   ├── Invitation.js             # email, invitedBy, hashed token, status, expiry
│   │   └── TeamMember.js             # owner-member bidirectional pairs (unique index)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── inviteRoutes.js           # GET /preview is public; all others protected
│   │   ├── userRoutes.js
│   │   └── aiRoutes.js
│   ├── utils/
│   │   ├── email.js                  # All email templates (verification, reset, invite, task notifications)
│   │   └── team.js                   # Team member resolution (direct + accepted invites + transitive)
│   ├── uploads/                      # File storage directory
│   ├── server.js                     # Express entry — CORS, middleware, route mounting, health check
│   ├── package.json
│   └── .env
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Sidebar.jsx            # Nav, team list, invite modal, AI button, resizable drag handle
        │   ├── TaskModal.jsx          # Create/edit task — rich editor, comments, attachments
        │   ├── StatsCards.jsx         # Animated stat cards with count-up numbers
        │   ├── RichEditor.jsx         # TipTap wrapper with full toolbar, focus-aware sync
        │   ├── ChatBot.jsx            # Floating AI chat window with suggestion chips
        │   ├── DeleteConfirmDialog.jsx # Confirmation modal for destructive actions
        │   ├── Pagination.jsx
        │   ├── Toast.jsx              # Non-blocking success/error notifications
        │   ├── SkeletonLoader.jsx     # Animated placeholders while data loads
        │   ├── Navbar.jsx
        │   └── AuthLeft.jsx
        ├── context/
        │   └── AuthContext.jsx        # User state, login/logout, 401-only token clearing
        ├── hooks/
        │   ├── useDebounce.js         # 350 ms debounce for search input
        │   └── useCountUp.js          # requestAnimationFrame count-up animation hook
        ├── pages/
        │   ├── Dashboard.jsx          # Stats, quick add, task list, AI hint banner, chatbot
        │   ├── Login.jsx              # Login + pending invite token redirect
        │   ├── Register.jsx
        │   ├── ForgotPassword.jsx
        │   ├── ResetPassword.jsx
        │   ├── VerifyEmail.jsx        # Email verification with auto-login on success
        │   ├── AcceptInvite.jsx       # Multi-step: preview → accept/decline → auth → success
        │   └── Settings.jsx
        ├── utils/
        │   └── api.js                 # Axios instance + localStorage interceptor + all API helpers
        ├── App.jsx                    # Routes with PrivateRoute / PublicRoute guards
        ├── main.jsx
        └── index.css                  # All styles (~2,355 lines, zero external CSS framework)
```

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- pnpm (`npm install -g pnpm`)
- MongoDB Atlas free account
- Gmail account with an App Password enabled
- Google AI Studio account (free) for a Gemini API key

### 1. Clone and install dependencies

```bash
# Install all workspace dependencies
pnpm install:all

# Or install separately
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=any_long_random_secret_string

NODE_ENV=development

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=TaskFlow <your_gmail@gmail.com>
SMTP_REPLY_TO=optional_reply_to_address

CLIENT_URL=http://localhost:5173

GEMINI_API_KEY=AIzaSy_your_gemini_key_here
```

**Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords → generate one for "Mail"

**Gemini API Key:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) → Create API key → free, no credit card needed

### 3. Run

```bash
# Run both backend and frontend together (from project root)
pnpm dev

# Or run separately
# Terminal 1 — Backend (port 5000)
cd backend && nodemon server.js

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Build for production

```bash
cd frontend && npm run build
```

---

## API Reference

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register, send verification email |
| POST | `/login` | No | Login, returns JWT |
| GET | `/me` | JWT | Get logged-in user profile |
| POST | `/verify-email` | No | Verify email with token |
| POST | `/resend-verification` | No | Resend email verification link |
| POST | `/forgot-password` | No | Send password reset email |
| POST | `/reset-password` | No | Reset password with token |

### Tasks — `/api/tasks` (all protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List tasks — query params: `search`, `status`, `priority`, `sortBy`, `page`, `limit`, `dueToday` |
| POST | `/` | Create task |
| GET | `/:id` | Get single task |
| PUT | `/:id` | Update task |
| DELETE | `/:id` | Delete task |
| PATCH | `/:id/status` | Update status only |
| GET | `/stats` | Return total, pending, completed, overdue counts |
| GET | `/:id/comments` | List comments (oldest first) |
| POST | `/:id/comments` | Add comment |
| DELETE | `/:id/comments/:cid` | Delete own comment |
| POST | `/:id/attachments` | Upload file (multipart/form-data) |
| DELETE | `/:id/attachments/:aid` | Delete attachment |

### Invitations — `/api/invite`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/preview?token=` | Public | Preview invite (inviter name + invited email) — no login required |
| POST | `/send` | JWT | Send invitation email |
| POST | `/accept` | JWT | Accept invitation, create bidirectional TeamMember records |
| GET | `/team` | JWT | List accepted team members |
| GET | `/sent` | JWT | List sent invitations and their status |

### Users — `/api/users` (all protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/search?q=` | Search users by name or email (min 2 chars) |

### AI — `/api/ai` (protected)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/chat` | Send `{ message, tasks }` → Gemini responds with text or performs task action |

### Server
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check endpoint |
| GET | `/uploads/:filename` | Serve uploaded files |

---

## Database Models

### User
```js
{
  name: String,                      // 3–50 chars
  email: String,                     // unique, lowercase
  password: String,                  // bcrypt hashed
  isVerified: Boolean,               // false until email confirmed
  emailVerificationToken: String,    // hashed, hidden from queries
  emailVerificationExpire: Date,     // 24-hour expiry
  resetPasswordToken: String,        // hashed, hidden from queries
  resetPasswordExpire: Date          // 15-minute expiry
}
```

### Task
```js
{
  title: String,                     // 3–100 chars
  description: String,               // 0–500 chars, HTML from TipTap
  status: 'todo' | 'pending' | 'completed',
  priority: 'low' | 'medium' | 'high',
  dueDate: Date,                     // optional
  user: ObjectId,                    // task creator/owner
  members: [ObjectId],               // assigned team members
  attachments: [{
    filename: String,                // randomized filename on disk
    originalname: String,
    mimetype: String,
    size: Number,
    uploadedBy: ObjectId,
    uploadedAt: Date
  }]
}
```

### Comment
```js
{
  task: ObjectId,                    // indexed
  author: ObjectId,
  text: String                       // 1–1000 chars, HTML
}
```

### Invitation
```js
{
  email: String,                     // invited email (unique per inviter)
  invitedBy: ObjectId,
  token: String,                     // hashed
  tokenExpire: Date,                 // 7-day expiry
  status: 'pending' | 'accepted',
  acceptedBy: ObjectId               // null until accepted
}
```

### TeamMember
```js
{
  owner: ObjectId,
  member: ObjectId,
  // unique index on [owner, member] — bidirectional pairs created on acceptance
}
```

---

## Key Design Decisions

**Why plain-text invite emails?**
HTML emails from personal Gmail accounts frequently land in spam. Plain-text emails with a personal-style subject line have significantly better inbox delivery for Gmail-to-Gmail.

**Why localStorage for the pending invite token (not sessionStorage)?**
Email verification links open in a new browser tab. `sessionStorage` is tab-scoped, so the invite token would be lost. `localStorage` persists across tabs, ensuring the Register → verify email → login flow auto-accepts the invitation reliably.

**Why an Axios request interceptor for the auth token?**
Vite HMR can replace the Axios module instance during development and create a new one without the token set on `defaults.headers`. Reading directly from `localStorage` on every request in an interceptor means authentication never breaks during hot reloads.

**Why only clear the token on 401 responses?**
If the backend is temporarily down (e.g., nodemon restart), the `/auth/me` call fails with a network error. Previously this deleted the token and logged the user out. Now only explicit 401 responses clear the token.

**Why TipTap for the editor?**
TipTap is headless, stores content as HTML, and integrates cleanly with React state. The `focusedRef` pattern (a `useRef` alongside `focused` state) prevents the cursor-reset bug that occurs when the parent component syncs the `content` prop into the editor while the user is actively typing.

**Why Gemini 2.5 Flash?**
Gemini 2.5 Flash is optimized for speed and low latency. The free tier (1,500 requests/day) is sufficient for personal or small-team use. The AI controller parses JSON action blocks from the response (`create`, `complete`, `delete`, `update`, `assign`) and falls back to plain conversational text for questions.

**Why bidirectional TeamMember records?**
When invitation is accepted, two `TeamMember` documents are created (`A→B` and `B→A`). This makes team queries simple: any user can look up their team members without needing to join across two different owner fields.

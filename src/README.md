# QuizGen AI - Frontend Source Code Overview (`frontend/src`)

Welcome to the `src` directory of **QuizGen AI**, a modern, full-stack, gamified AI-powered online quiz and adaptive learning application built using **React 19**, **Vite**, **Tailwind CSS v4**, and **Framer Motion**.

---

## 📁 Directory Structure Overview

```
frontend/src/
├── assets/          # Static media assets, SVGs, and brand images
├── components/      # Modular React components organized by feature domain
│   ├── Landing/     # Landing page sections (Hero, Features, Pricing, CTA)
│   ├── achievements/# Badge cards, achievement progress indicators, claim buttons
│   ├── admin/       # Custom admin panel tables, KPI metrics, modal dialogs
│   ├── auth/        # Auth modal, login forms, registration, OTP input fields
│   ├── common/      # Shared components (Toasts, Loaders, Error Boundaries)
│   ├── dashboard/   # Analytics widgets, streak counters, goal trackers
│   ├── forms/       # Standardized input fields, select dropdowns, toggles
│   ├── layout/      # Navbar, Sidebar, Footer, Header components
│   ├── library/     # Quiz cards, search filters, category tags
│   ├── pages/       # Reusable page sub-components
│   └── ui/          # Core design tokens & reusable primitives (Buttons, Cards)
├── constants/       # Global constants, configuration defaults, options arrays
├── context/         # React Context API state providers
│   ├── AdminAuthContext.jsx # Isolated state provider for Admin authentication
│   ├── AuthContext.jsx      # Global user authentication session provider
│   ├── AuthModalContext.jsx # State controller for Auth modal popups
│   ├── DashboardContext.jsx # Cached platform statistics & analytics state
│   └── ThemeContext.jsx     # Dark/Light mode theme state manager
├── data/            # Mock dataset fallbacks and static schemas
├── hooks/           # Custom React hooks (useAuth, useTheme, useDashboard)
├── layouts/         # High-level route wrapper layouts
│   ├── AdminLayout.jsx      # Admin panel layout with admin navigation
│   └── DashboardLayout.jsx  # Main user dashboard layout with responsive sidebar
├── pages/           # Application views and page components
│   ├── Achievements/        # Gamification hub & user badge gallery
│   ├── admin/               # Admin portal pages (Users, Quizzes, Penalties, Support)
│   ├── auth/                # Dedicated authentication view fallbacks
│   ├── contact/             # Support & Contact request form page
│   ├── dashboard/           # Student dashboard & attempt history views
│   ├── feedback/            # User feedback submission page
│   ├── generate/            # AI Quiz generator page
│   ├── leaderboard/         # Global leaderboard & top 3 podium standings
│   ├── legal/               # Terms of Service & Privacy Policy pages
│   ├── library/             # Quiz discovery library & filter page
│   ├── pricing/             # Subscription tiers & Razorpay payment page
│   ├── profile/             # User profile editor & password management
│   ├── quiz/                # Live quiz attempt engine, results & itemized review
│   └── settings/            # User preferences & system settings
├── routes/          # Centralized route definitions
│   └── AppRoutes.jsx        # Lazy-loaded route table & route security guards
├── services/        # Decoupled API service layer with Axios adapters
│   ├── achievementService.js # Gamification badges & XP endpoints
│   ├── adminService.js       # Core admin platform API integration
│   ├── aiQuizService.js      # AI Quiz generation API handler
│   ├── api.js                # Core Axios instance, JWT refresh & interceptors
│   ├── attemptsService.js    # Quiz attempt engine & anti-cheating loggers
│   ├── authService.js        # Authentication & profile management APIs
│   ├── customAdminService.js # Extended admin operations & sub management
│   ├── dashboardService.js   # Analytics adapter & response normalizer
│   ├── leaderboardService.js # Global rankings adapter
│   └── subscriptionService.js# Tier plans & Razorpay payment integration
├── styles/          # Supplementary CSS stylesheets
├── utils/           # Helper utility functions, formatters, and auth storage
├── App.css          # Core application styling rules
├── App.jsx          # Root application component wrapping providers & routes
├── index.css        # Tailwind v4 import declarations & design system tokens
└── main.jsx         # Application entrypoint with React DOM root rendering
```

---

## 🔑 Key Engineering Concepts & Architecture

### 1. Robust API Layer & Axios Interceptors (`services/api.js`)
- **JWT Authorization:** Automatically injects `Bearer <token>` into outgoing HTTP request headers.
- **Silent Auto-Refresh:** Catches `401 Unauthorized` responses, queues concurrent pending requests, and requests a new token via `/token/refresh/`. Once acquired, queued requests retry transparently.
- **Premium Feature Interception:** Intercepts `403 PREMIUM_REQUIRED` errors and fires custom window events (`subscription:premium-required`) to prompt users to upgrade without breaking the UI flow.

### 2. Data Normalization & Service Adapters (`services/dashboardService.js`, `services/leaderboardService.js`)
- Protects UI components from backend schema variations (e.g., `snake_case` vs `camelCase`).
- Provides safe fallbacks for missing data fields, ensuring the frontend never crashes due to unexpected `undefined` properties.

### 3. Route-Level Code Splitting & Performance Optimization (`routes/AppRoutes.jsx`)
- All major page routes are lazy-loaded via `React.lazy` and wrapped in `Suspense` with a custom spinning indicator fallback.
- Minimizes initial bundle size and accelerates initial load time.

### 4. Dual-Context Isolation for Security
- User sessions (`AuthContext.jsx`) and Admin sessions (`AdminAuthContext.jsx`) are maintained separately.
- Admin APIs send explicit headers (`X-Admin-Request: true`) and access separate token stores (`admin_token`).

### 5. Anti-Cheating & Violation Logging (`services/attemptsService.js`)
- Tracks tab switching or window blur events during active quiz attempts.
- Sends violation reports to `/api/attempts/:id/log-violation/` to enforce academic integrity during timed quizzes.

---

## 🛠️ Development & Script Commands

Run these commands from the `frontend` root folder:

```bash
# Install dependencies
npm install

# Run Vite local development server
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview

# Lint code using ESLint
npm run lint
```

---

## 🎨 Design System & Technologies Used

- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS v4 + Vanilla CSS Variables
- **Icons:** Lucide React (`lucide-react`) & React Icons (`react-icons`)
- **Typography:** Inter (`@fontsource/inter`) & Space Grotesk (`@fontsource/space-grotesk`)
- **Animations:** Framer Motion (`framer-motion`)
- **HTTP Client:** Axios (`axios`) with custom interceptors
- **Payments:** Razorpay Web Checkout Integration

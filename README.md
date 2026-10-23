# SpendWise — Personal Expense Tracker (MERN Application)

SpendWise is a full-stack, secure, production-minded personal finance management application built on the MERN stack (MongoDB, Express, React, Node.js). It faithfully implements and extends the clean, minimalist Notion-inspired design from Google Stitch (Project ID: `5013121070207257318`).

![SpendWise Aesthetic](https://raw.githubusercontent.com/lucide-react/lucide/main/icons/wallet.svg)

---

## 1. Architectural Highlights

- **Visual Design Identity**: Built strictly according to the Google Stitch design reference:
  - Clean white background (`#ffffff` / `#fcf9f8`), dark charcoal headings (`#1c1b1b`), neutral gray borders (`#ECECEC`).
  - Notion-style metric cards, compact category badges, restrained emerald/charcoal accents.
  - Native typography (Inter) paired with Material Symbols Outlined icons.
  - Responsive desktop sidebar collapsing into an accessible slide-over mobile drawer navigation.
- **Strict Multi-Tenant Isolation**: Every financial transaction, category, and monthly budget is strictly partitioned by the authenticated user's ID (`req.user._id`). Users cannot access, modify, or leak each other's data.
- **Resilient MongoDB Layer**:
  - Connects to your **MongoDB Atlas** cluster via `MONGODB_URI`.
  - Automatically falls back to an embedded in-memory MongoDB engine (`mongodb-memory-server`) if your IP is not whitelisted or when running offline, ensuring zero downtime or startup failure.
- **Enterprise Security**:
  - Passwords hashed with `bcryptjs` (salt rounds: 10).
  - JWT session issuance stored securely in **HTTP-only, SameSite cookies** to prevent XSS credential theft.
  - Passwords and sensitive fields sanitized via Mongoose `select: false`.
- **Real-Time Financial Analytics**:
  - Multi-month trend tracking with Recharts.
  - Live category distribution breakdowns and savings velocity calculations.
  - Dynamic monthly budget envelopes with live overspending threshold warnings.
  - Default Indian Rupee (`₹`, `en-IN`) currency formatting.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, React Router v6, Tailwind CSS, Lucide React, Material Symbols, Recharts, Axios |
| **Backend** | Node.js, Express.js, Mongoose, JSON Web Tokens (JWT), Cookie-Parser, BcryptJS, Dotenv, CORS |
| **Database** | MongoDB Atlas (with local in-memory fallback) |

---

## 3. Directory Structure

```text
Expense Tracker/
├── package.json               # Root scripts for starting frontend and backend
├── README.md                  # Complete documentation and setup guide
├── client/                    # Vite + React Frontend
│   ├── .env.example           # Frontend environment template
│   ├── index.html             # Google Fonts (Inter) & Material Symbols Outlined
│   ├── tailwind.config.js     # Stitch design tokens (Notion palette & font sizes)
│   └── src/
│       ├── components/        # Sidebar, Header, Modals, TransactionDrawer, ProtectedRoute
│       ├── context/           # AuthContext (session state & login/register/logout)
│       ├── pages/             # Dashboard, Transactions, Budgets, Analytics, Categories, Settings, Auth
│       ├── services/          # Centralized Axios client (`withCredentials: true`)
│       └── index.css          # Core design tokens, clean scrollbars, card utilities
└── server/                    # Node.js + Express Backend
    ├── .env.example           # Backend environment template
    ├── server.js              # Express app entrypoint & healthcheck route
    ├── config/db.js           # Resilient MongoDB connector (Atlas + memory fallback)
    ├── models/                # User, Transaction, Category, Budget
    ├── controllers/           # Auth, Transactions, Categories, Budgets, Analytics
    ├── routes/                # Express API routes
    ├── middleware/            # Auth JWT verification & Centralized Error Handler
    └── utils/                 # Automatic 16-category initial seeder
```

---

## 4. Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### Installation

Clone the repository and install dependencies for both the client and server:

```bash
# Option 1: Install all dependencies with root script
npm run install:all

# Option 2: Install manually
cd server && npm install
cd ../client && npm install
```

---

## 5. Environment Configuration

### Backend Setup (`server/.env`)
Copy the example file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/spendwise?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend Setup (`client/.env`)
Copy the example file in the `client` directory:

```bash
cd client
cp .env.example .env
```

Contents of `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 6. Configuring MongoDB Atlas (Step-by-Step)

If you wish to use a live MongoDB Atlas cloud database:

1. **Create an Atlas Account & Cluster**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in or sign up.
   - Click **Create a Deployment** and select the free **M0 Sandbox** cluster.
   - Choose your preferred cloud provider and region, then click **Create**.
2. **Create a Database User**:
   - Under **Security** in the left sidebar, click **Database Access**.
   - Click **Add New Database User**.
   - Choose **Password** authentication. Enter a username (e.g., `spendwise_user`) and a secure password.
   - Set Built-in Role to **Read and write to any database**.
   - Click **Add User**.
3. **Configure Network Access (IP Whitelist)**:
   - Under **Security** in the left sidebar, click **Network Access**.
   - Click **Add IP Address**.
   - To allow access from any development location, select **Allow Access From Anywhere** (`0.0.0.0/0`) or enter your current public IP.
   - Confirm and save.
4. **Obtain Connection String**:
   - Under **Deployments**, click **Database** and locate your cluster.
   - Click **Connect** -> **Drivers** -> **Node.js**.
   - Copy the connection URI string.
   - Replace `<password>` with the password created in Step 2.
   - Paste the result into `server/.env` as the `MONGODB_URI`.

> **Note**: If your Atlas connection fails due to firewall or un-whitelisted IP addresses, SpendWise will **automatically switch to local in-memory persistence**, logging a clean warning so you can continue testing without interruption!

---

## 7. Running the Application

### Development Mode

Run the backend and frontend simultaneously:

```bash
# Terminal 1: Start Express Backend (Port 5000)
npm run server
# or: cd server && npm run dev

# Terminal 2: Start Vite Client (Port 5173)
npm run client
# or: cd client && npm run dev
```

Visit the application in your browser:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 8. Demo Credentials & Test Data

The application includes a pre-seeded demonstration account with realistic transactions, categories, and active monthly budget envelopes:

- **Email**: `alex@spendwise.dev`
- **Password**: `password123`

### Pre-Seeded Default Categories (16 Total)
- **Expense (11)**: Food & Dining, Transportation, Shopping, Education, Bills & Utilities, Healthcare, Entertainment, Rent & Housing, Insurance, Gym & Fitness, Other.
- **Income (5)**: Salary, Freelance, Investment, Business, Other Income.

---

## 9. API Reference

All protected endpoints require an authenticated session cookie or `Authorization: Bearer <token>` header.

### Health
- `GET /api/health` — Server health, uptime, and database connection status.

### Authentication (`/api/auth`)
- `POST /register` — Register a new user, hashes password, seeds 16 categories, issues HTTP-only cookie.
- `POST /login` — Authenticate user and issue JWT cookie.
- `POST /logout` — Invalidate user session cookie.
- `GET /me` — Retrieve current authenticated user profile.
- `PUT /profile` — Update user name or preferred currency.
- `PUT /change-password` — Change password with current password verification.
- `POST /forgot-password` — Generate single-use password reset token.
- `POST /reset-password` — Reset password using token.

### Transactions (`/api/transactions`)
- `GET /` — List transactions with pagination (`page`, `limit`), search (`search`), type (`type`), category (`category`), payment method (`paymentMethod`), and date range (`startDate`, `endDate`).
- `GET /:id` — Get detailed transaction record.
- `POST /` — Create transaction (validates amount, category, date).
- `PUT /:id` — Update existing transaction.
- `DELETE /:id` — Delete transaction.

### Categories (`/api/categories`)
- `GET /` — List categories with current month spending totals and transaction counts.
- `POST /` — Create custom user category.
- `PUT /:id` — Rename or update category icon.
- `DELETE /:id` — Delete category with safe transaction fallback to "Other".

### Monthly Budgets (`/api/budgets`)
- `GET /` — List budgets for specified `month` and `year` with live spending calculation and overspending indicator.
- `POST /` — Create or update budget limit for category/month.
- `PUT /:id` — Update budget limit.
- `DELETE /:id` — Delete budget envelope.

### Analytics (`/api/analytics`)
- `GET /summary` — KPI totals: Total Balance, Monthly Income, Monthly Expenses, Monthly Savings, Savings Rate %.
- `GET /monthly` — 6-month historical income vs expense comparison for bar/line charts.
- `GET /categories` — Category-wise expense breakdown with percentages.

---

## 10. Verification & Quality Assurance

- **Build Check**: `npm run build:client` executes Vite bundling without errors or warnings.
- **Security Check**: Tested unauthorized requests (`401 Unauthorized`), validated multi-user data isolation.
- **Mobile Responsiveness**: Verified on mobile, tablet, and desktop viewport sizes.

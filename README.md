# Diamond Pappadam — Production Management System

Full-stack production and payroll management for a family-owned pappadam business.

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React (Vite), React Router, Tailwind CSS, Axios |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt |

## Architecture

```
backend/src/
├── config/       # env, constants
├── controllers/  # HTTP handlers
├── middleware/   # auth, errors
├── models/       # Mongoose schemas
├── routes/
├── services/     # business logic
├── utils/
└── scripts/seed.js
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

API: **http://localhost:5001** (use 5001 on macOS — port 5000 is often taken by AirPlay)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: **http://localhost:5173**

## Business Rules

### Admin (owner only)

- Single admin account created via **seed only** — no admin management UI
- First login: change password (from `ADMIN_PASSWORD` in `.env`)

### Employees

- Admin adds employees with **name** and **phone** only
- Default password: **`123456`** — must change on first login
- Admin can reset password when editing an employee

### Production

- Two categories: **Dry Machine** and **Non-Machine** (kg entry)
- **Rate snapshot**: each record stores `dryMachineRate`, `nonMachineRate`, and calculated amounts at creation time
- Changing settings later does **not** alter old records
- Edits recalculate amounts using **stored rates** on that record, never current rates
- Optional **notes** per entry (overtime, correction, etc.)
- **Employees**: create entries; edit only entries **created today**
- **Admin**: edit or delete any entry

### Salary Ledger

- **Total Earned** = sum of approved production **net** amounts (lifetime)
- **Total Paid** = sum of all salary payments recorded by admin
- **Balance** = Total Earned − Total Paid
- Admin records payments (weekly, advance, partial, etc.); payments never change production earnings

### Dashboards

**Admin:** production stats, outstanding salary liability (sum of positive balances), active employees

**Employee:** production stats, current salary balance, recent entries

## Login

| Role | First login |
|------|-------------|
| Admin | `ADMIN_PHONE` / `ADMIN_PASSWORD` from `.env` → change password |
| Employee | phone / `123456` → change password |

## API (key routes)

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/auth/admin/login` | Public (admin only) |
| POST | `/api/auth/employee/login` | Public (employee only) |
| POST | `/api/auth/change-password` | Admin + Employee |
| GET | `/api/dashboard/admin` | Admin |
| GET | `/api/dashboard/employee` | Employee |
| CRUD | `/api/employees` | Admin |
| POST/PATCH/DELETE | `/api/productions` | Employee create (pending); PATCH with status rules; DELETE admin |
| GET | `/api/productions/pending` | Admin — pending approvals |
| PATCH | `/api/productions/:id/approve` | Admin |
| PATCH | `/api/productions/:id/reject` | Admin |
| GET/POST | `/api/salary-ledger` | Admin summaries / employee payments |
| GET | `/api/salary-ledger/me` | Employee read-only ledger |

## Environment Variables

**Backend:** `MONGODB_URI`, `JWT_SECRET`, `PORT`, `ADMIN_PHONE`, `ADMIN_PASSWORD`, `CLIENT_URL`

**Frontend:** `VITE_API_URL` (e.g. `http://localhost:5001/api`)

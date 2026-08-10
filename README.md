# Game Hub - Web Game Platform

Game Hub is a fully-featured, Steam-like web game distribution platform. It allows users to upload HTML5 web games (via `.zip` files), automatically extracts and hosts them on Cloudflare R2, and provides a modern storefront to play games directly in the browser via sandboxed Iframes.

## Features
- **Frontend**: Next.js 15, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js, Prisma ORM.
- **Storage**: Cloudflare R2 object storage.
- **Database**: PostgreSQL (e.g. Neon, Supabase).
- **Authentication**: JWT-based auth with secure HttpOnly cookies, bcrypt password hashing.
- **Authorization**: Role-based access control (Admin / User).
- **Email Verification**: Nodemailer integration for verifying new user accounts.

## Project Structure
- `/frontend`: Next.js App Router project containing the Storefront, Admin Dashboard, and Authentication UIs.
- `/backend`: Node.js Express server handling API requests, file uploads, Cloudflare R2 integrations, and Auth logic.

## Setup Instructions

### 1. Database & Environment Setup
Ensure you have a PostgreSQL database.
Copy `.env.example` to `.env` in the `/backend` folder (if provided) or configure your `/backend/.env` with:
```env
PORT=4000
DATABASE_URL="your-postgresql-url"
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="your-bucket-name"
JWT_SECRET="your-secret-key"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

### 2. Backend Initialization
```bash
cd backend
npm install
npx prisma db push
npm start
```
*Note: Starting the backend for the first time will automatically seed an admin account:*
- **Admin Email**: `admin@gamehub.com`
- **Admin Password**: `admin123`

### 3. Frontend Initialization
```bash
cd frontend
npm install
npm run dev
```
The storefront will be available at `http://localhost:3000`.

## Uploading Games
Games must be uploaded as a `.zip` file containing an `index.html` file at the root level.
When uploaded, the game enters a `pending` state and must be approved by an Admin via the Admin Dashboard before it appears on the Storefront.
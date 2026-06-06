# SecondMuma — Node.js Backend

REST API backend for the **Second Muma** React Native mobile app.

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 22 (LTS) |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 8 |
| Auth | JWT (Bearer) |
| Validation | express-validator |
| Rate-limiting | express-rate-limit |
| Logging | Morgan |

---

## Quick Start

### 1. Prerequisites
- **Node.js ≥ 18** (via nvm recommended)
- **MongoDB** running locally on port `27017`
  ```bash
  brew services start mongodb-community
  ```

### 2. Install
```bash
cd sm-backend
npm install
```

### 3. Configure environment
`.env` is pre-filled with development defaults — no changes needed to run locally.

### 4. Run in development
```bash
npm run dev        # nodemon auto-restarts on changes
# or
npm start          # plain node
```

Server starts at **http://localhost:5000**

---

## Project Structure

```
sm-backend/
├── src/
│   ├── app.js                   ← Express entry point
│   ├── config/
│   │   └── db.js                ← MongoDB connection
│   ├── data/
│   │   └── packages.js          ← Shared package catalogue
│   ├── middleware/
│   │   ├── auth.js              ← JWT protect middleware
│   │   └── errorHandler.js      ← Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── OTP.js               ← TTL index auto-deletes expired OTPs
│   │   ├── Address.js
│   │   ├── Order.js
│   │   └── Payment.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── packageController.js
│   │   ├── addressController.js
│   │   ├── orderController.js
│   │   └── paymentController.js
│   └── routes/
│       ├── auth.js
│       ├── users.js
│       ├── packages.js
│       ├── addresses.js
│       ├── orders.js
│       └── payments.js
├── .env                         ← Dev environment (gitignored)
├── .env.example
└── package.json
```

---

## API Reference

**Base URL (dev):** `http://localhost:5000/api`

> In dev mode the OTP is always **`123456`** — no SMS gateway required.

---

### 🔐 Auth  `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/send-otp` | Public | Send OTP to mobile (login flow) |
| POST | `/register` | Public | Create account + send OTP |
| POST | `/verify-otp` | Public | Verify OTP → returns JWT + user |
| POST | `/resend-otp` | Public | Resend a fresh OTP |
| POST | `/logout` | 🔒 Bearer | Logout (semantic — client drops JWT) |

#### `POST /api/auth/send-otp`
```json
// Request
{ "mobile": "9876543210" }

// Response 200
{
  "success": true,
  "message": "OTP sent to +91 9876543210",
  "otp": "123456"          // only in dev mode
}
```

#### `POST /api/auth/register`
```json
// Request
{ "name": "Priya Sharma", "email": "priya@example.com", "mobile": "9876543210" }

// Response 200 — same as send-otp (OTP sent to mobile)
```

#### `POST /api/auth/verify-otp`
```json
// Request
{ "mobile": "9876543210", "otp": "123456" }

// Response 200
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "id": "664abc...",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "mobile": "9876543210",
    "token": "eyJhbGci..."
  }
}
```

---

### 👤 Users  `/api/users`  🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get authenticated user's profile |
| PUT | `/profile` | Update name / email / avatar |

---

### 📦 Packages  `/api/packages`  (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | All packages (Home screen list) |
| GET | `/:type` | Full package with all plans |
| GET | `/:type/plans/:planKey` | Single plan detail |

- `type` = `mother` \| `baby` \| `muma`
- `planKey` = `1month` \| `3month` \| `6month`

---

### 🏠 Addresses  `/api/addresses`  🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Save new address |
| GET | `/` | List all addresses |
| GET | `/:id` | Get single address |
| PUT | `/:id` | Update address |
| DELETE | `/:id` | Delete address |

#### Address body fields (from Checkout screen)
```json
{
  "fullName": "Priya Sharma",
  "mobile": "9876543210",
  "flatNo": "42B",
  "street": "MG Road",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pincode": "560001",
  "isDefault": true
}
```

---

### 🛒 Orders  `/api/orders`  🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create order (from Checkout screen) |
| GET | `/` | List all user orders |
| GET | `/:id` | Get single order |
| PATCH | `/:id/cancel` | Cancel an order |

#### Create order body
```json
{
  "packageType": "mother",
  "planKey": "3month",
  "address": {
    "fullName": "Priya Sharma",
    "mobile": "9876543210",
    "flatNo": "42B",
    "street": "MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "Order created. Proceed to payment.",
  "data": {
    "_id": "664abc...",
    "packageType": "mother",
    "packageTitle": "Mother Care",
    "planKey": "3month",
    "planLabel": "3 Months",
    "price": 2499,
    "paymentStatus": "pending",
    "status": "created",
    ...
  }
}
```

---

### 💳 Payments  `/api/payments`  🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/initiate` | Initiate UPI payment → returns `upiUri` |
| POST | `/verify` | Verify payment (webhook / simulation) |
| GET | `/` | List all user payments |
| GET | `/:transactionId` | Get payment status |

#### Flow in the mobile app

```
1. POST /api/orders  →  { orderId }
2. POST /api/payments/initiate  →  { upiUri, transactionId }
3. Linking.openURL(upiUri)   ← opens GPay/PhonePe/Paytm
4. POST /api/payments/verify  →  { transactionId, status: 'success' | 'failed' }
5. Subscription activated / order status updated
```

#### `POST /api/payments/initiate`
```json
// Request
{ "orderId": "664abc..." }

// Response 200
{
  "success": true,
  "data": {
    "transactionId": "TXN-A1B2C3-1714000000000",
    "upiUri": "upi://pay?pa=secondmuma@upi&pn=SecondMuma&tr=TXN-...&am=2499.00&cu=INR",
    "amount": 2499,
    "orderId": "664abc..."
  }
}
```

#### `POST /api/payments/verify`
```json
// Request
{ "transactionId": "TXN-A1B2C3-...", "upiRef": "123456789012", "status": "success" }

// Response 200
{
  "success": true,
  "message": "Payment verified – subscription activated!",
  "data": {
    "transactionId": "TXN-A1B2C3-...",
    "orderId": "664abc...",
    "activatedAt": "2026-04-22T10:00:00.000Z",
    "expiresAt": "2026-07-22T10:00:00.000Z"
  }
}
```

---

## Authentication Header

All 🔒 protected routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Health Check

```
GET http://localhost:5000/health
```

---

## Rate Limits

| Scope | Limit |
|-------|-------|
| All `/api` routes | 200 req / 15 min per IP |
| `/api/auth/send-otp` | 5 req / 10 min per IP |
| `/api/auth/resend-otp` | 5 req / 10 min per IP |

---

## Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use a strong random `JWT_SECRET` (32+ chars)
- [ ] Set `SEND_REAL_OTP=true` and integrate MSG91 / Fast2SMS
- [ ] Replace `MONGODB_URI` with your Atlas connection string  
- [ ] Restrict `CORS origin` to your production domain
- [ ] Integrate a real UPI payment gateway (Razorpay / PayU / Cashfree)
- [ ] Add Helmet.js for security headers

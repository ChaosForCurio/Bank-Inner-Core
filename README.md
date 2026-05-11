# Xieriee Bank | The Future of Banking 🏦

Xieriee Bank is a high-performance, executive-tier banking platform designed for reliability, security, and advanced financial management. Built with a robust Node.js backend and a modern React frontend, it features high-end security measures and innovative financial tools.

## 🚀 Key Features

### 🔐 Advanced Security
- **End-to-End Encryption (E2EE)**: Sensitive transaction memos are encrypted in the browser using AES-256-GCM (Web Crypto API) before transmission. Keys are derived locally via PBKDF2.
- **Autonomous Behavioral Risk Engine**: Real-time transaction risk scoring (0-100) based on velocity, impossible travel geolocation checks, and spending outliers.
- **Multi-Sig Threshold Approval**: Dynamic approval workflows (1, 2, or 3 signatures) that adjust based on transaction magnitude and calculated risk scores.
- **Multi-Factor Authentication (MFA)**: Secure account access using industry-standard TOTP.
- **Passkey Support**: Passwordless authentication using WebAuthn for biometric security.
- **Proof of Wealth**: Cryptographic verification of account balances without disclosing full assets.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for users and administrators.

### 💳 Modern Banking
- **Virtual Cards & Burner Identities**: Create disposable virtual cards linked to masked identities for secure online shopping.
- **Vaults & Savings**: Isolated account structures for specialized saving goals with custom interest logic.
- **Currency Support**: Multicurrency accounts with real-time exchange rate integration.

### 👥 Collaborative Finance
- **Swarm Payments**: Crowdfunding and automated group escrow for business growth and collaborative ventures.
- **Beneficiary Management**: Securely manage trusted recipients for instant transfers.

### 📊 Intelligence & Automation
- **Spending Analysis**: AI-driven analytics to track and categorize financial behavior.
- **Scheduled Transfers**: Automate recurring payments and future-dated transactions.
- **Real-time Notifications**: Instant alerts via Email (Mailgun), SMS (Twilio), and Web Push.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | Neon PostgreSQL (Serverless) |
| **Authentication** | Firebase Auth (Client), Firebase Admin (Server), WebAuthn |
| **Communications** | Mailgun (Email), Twilio (SMS), Web-Push |
| **Monitoring** | Sentry (Error Tracking & Profiling) |
| **Testing** | Vitest, Supertest |

---

## 🏗️ Architecture Overview

The project follows a modular **Controller-Service-Model** pattern:

- **Controllers**: Handle HTTP request/response logic.
- **Services**: Contain business logic and third-party integrations.
- **Models**: Database interactions using raw SQL for maximum performance.
- **Middleware**: Handles authentication, logging (Morgan), security (Helmet), and rate limiting.

### Project Structure
```text
├── frontend/             # React Application
├── src/
│   ├── controllers/      # Request Handlers
│   ├── services/         # Business Logic
│   ├── models/           # Data Access Objects
│   ├── routes/           # API Endpoints
│   ├── middleware/       # Express Middlewares
│   └── utils/            # Shared Utilities
├── scripts/              # DB Migrations & Maintenance
└── config/               # Configuration Files
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Neon recommended)
- Firebase Account

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   ```

### Environment Configuration
Create a `.env` file in the root directory with the following keys:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: Secret for signing tokens.
- `FIREBASE_SERVICE_ACCOUNT_PATH`: Path to your Firebase credentials.
- `MAILGUN_API_KEY`: For email notifications.
- `VAPID_KEYS`: For web push notifications.

### Running the App
Start both frontend and backend in development mode:
```bash
npm run dev
```

### Running Tests
```bash
npm run test
```

---

## 📄 API Documentation
A Swagger UI is integrated for interactive API exploration. Once running, visit:
`http://localhost:3000/api-docs`

---

## 📈 Roadmap
- [x] Core Transaction Engine
- [x] Virtual Card System
- [x] Swarm Payment Logic
- [x] Proof of Wealth Implementation
- [x] End-to-End Encrypted Memos
- [x] Behavioral Risk Analysis Engine
- [ ] Mobile Application (React Native)
- [ ] Automated Reconciliation Engine
- [ ] Advanced AI Wealth Management

---

© 2026 Xieriee Bank. All Rights Reserved.
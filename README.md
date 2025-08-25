# HSA Web Application

A full-stack Health Savings Account (HSA) web application that demonstrates the core lifecycle of an HSA: account creation, funding, card issuance, and transaction processing with IRS-qualified medical expense validation.

## 🚀 Features

- **Account Creation**: Simple user registration and HSA account setup
- **Fund Deposits**: Add virtual funds to HSA accounts
- **Virtual Card Issuance**: Emulate debit cards linked to HSA balances
- **Transaction Validation**: Validate purchases against IRS-qualified medical expenses
- **Transaction History**: View all account transactions and withdrawals
- **HSA Contribution Limits**: Automatic calculation of 2025 HSA limits with catch-up contributions

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19.1.1 with modern hooks and components
- **Backend**: Node.js with Express 5.1.0
- **Database**: SQLite3 for local data persistence
- **Web Scraping**: Selenium WebDriver for HealthEquity expense validation
- **Styling**: CSS with responsive design

### Project Structure
```
health-savings-account-webapp/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API service layer
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── backend/                 # Express server
│   ├── scrapers/            # Web scraping modules
│   ├── scripts/             # Database utilities
│   └── server.js            # Main server file
└── README.md               # This file
```

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Chrome browser** (required for Selenium WebDriver)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd health-savings-account-webapp
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Database Setup
The SQLite database will be automatically created when you first run the backend server. Sample data can be populated using the provided script:

```bash
cd ../backend
node scripts/populate-sample-expenses.js
```

## 🚀 Running the Application

### Method 1: Run Both Services Simultaneously (Recommended)

1. **Start the Backend Server** (Terminal 1):
```bash
cd backend
node server.js
```
The backend will start on `http://localhost:3001`

2. **Start the Frontend Development Server** (Terminal 2):
```bash
cd frontend
npm start
```
The frontend will start on `http://localhost:3000` and automatically open in your browser.

### Method 2: Manual Startup

If you prefer to start services individually:

**Backend Only:**
```bash
cd backend
node server.js
```

**Frontend Only:**
```bash
cd frontend
npm start
```

## 🌐 Using the Application

1. **Access the Application**: Open your browser to `http://localhost:3000`

2. **Create an Account**: 
   - Click "Create Account" 
   - Fill in your personal information including date of birth (for catch-up contribution eligibility)
   - Select your coverage type (Individual or Family)

3. **Deposit Funds**:
   - Use the "Deposit" button to add virtual funds to your HSA
   - The system enforces 2025 HSA contribution limits

4. **Make Transactions**:
   - Use the "Withdraw" feature to simulate purchases
   - Enter merchant name and amount
   - The system validates against IRS-qualified medical expenses using HealthEquity's database

5. **View Transaction History**:
   - All approved and declined transactions are logged
   - View your current balance and transaction details

## 🔧 API Endpoints

The backend provides the following REST API endpoints:

### User Management
- `POST /api/users` - Create new user account
- `GET /api/users/:id` - Get user details

### HSA Operations
- `POST /api/hsa/deposit` - Deposit funds to HSA
- `POST /api/hsa/withdraw` - Process withdrawal/purchase
- `GET /api/hsa/balance/:userId` - Get current HSA balance
- `GET /api/hsa/transactions/:userId` - Get transaction history

### HSA Limits & Eligibility
- `GET /api/hsa/contribution-limits/:userId` - Get contribution limits
- `GET /api/hsa/catch-up-eligible/:userId` - Check catch-up eligibility
- `GET /api/hsa/base-limit/:userId` - Get base annual limit

### Expense Validation
- `POST /api/expenses/validate` - Validate if expense is IRS-qualified

## 💰 2025 HSA Contribution Limits

The application automatically calculates HSA contribution limits based on current IRS guidelines:

- **Individual Coverage**: $4,300 (base limit)
- **Family Coverage**: $8,550 (base limit)
- **Catch-up Contribution**: $1,000 (for individuals 55+ by end of year)

**Total Limits with Catch-up:**
- Individual: $5,300 ($4,300 + $1,000)
- Family: $9,550 ($8,550 + $1,000)

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
The backend includes expense validation testing through the scraper modules.

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   - Backend (3001): Kill any process using port 3001
   - Frontend (3000): The React dev server will automatically find an available port

2. **Chrome/Selenium Issues**:
   - Ensure Chrome browser is installed
   - ChromeDriver is automatically managed by the chromedriver package

3. **Database Issues**:
   - Delete `backend/hsa_database.db` and restart the backend to recreate the database
   - Run the sample data script if you need test data

4. **CORS Issues**:
   - The backend is configured with CORS enabled for localhost:3000
   - Ensure both frontend and backend are running on their default ports

### Debug Mode

To run the backend with additional logging:
```bash
cd backend
DEBUG=* node server.js
```

## 📁 Key Files

- `backend/server.js` - Main Express server with all API routes
- `backend/scrapers/healthequity-scraper.js` - Expense validation logic
- `frontend/src/App.js` - Main React application component
- `frontend/src/components/dashboard/Dashboard.js` - Main dashboard interface
- `backend/expenses-simplified.json` - Local expense validation database

## 📝 Notes

- This application uses virtual money only - no real financial transactions occur
- The expense validation uses web scraping of HealthEquity's public database
- All data is stored locally in SQLite for easy setup and testing
- The application is designed to run completely offline after initial setup

## 🤝 Support

If you encounter any issues running the application, please check:
1. All prerequisites are installed
2. Both backend and frontend servers are running
3. No port conflicts exist
4. Chrome browser is available for Selenium operations

---

**Built for Human Interest Technical Assessment**  
*Demonstrating product-minded engineering with modern web technologies*
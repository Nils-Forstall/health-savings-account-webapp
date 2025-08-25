const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create/connect to database
const db = new sqlite3.Database('./hsa.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    coverage_type TEXT CHECK(coverage_type IN ('individual', 'family')),
    insurance_provider TEXT,
    has_hdhp BOOLEAN,
    no_government_insurance BOOLEAN,
    no_healthcare_fsa BOOLEAN,
    not_dependent BOOLEAN,
    insurance_card_front TEXT,
    insurance_card_back TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS hsa_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    balance REAL DEFAULT 0,
    account_number TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS virtual_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hsa_account_id INTEGER,
    card_number TEXT UNIQUE,
    expiry_month INTEGER,
    expiry_year INTEGER,
    cvv TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(hsa_account_id) REFERENCES hsa_accounts(id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER,
    hsa_account_id INTEGER,
    amount REAL,
    merchant TEXT,
    description TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(card_id) REFERENCES virtual_cards(id),
    FOREIGN KEY(hsa_account_id) REFERENCES hsa_accounts(id)
  )`);

  // Expense categories table for HSA validation
  db.run(`CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Expenses table for HSA validation
  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    is_qualified BOOLEAN NOT NULL,
    keywords TEXT,
    source_url TEXT,
    raw_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES expense_categories(id)
  )`);

  // Create indexes for efficient querying
  db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_name ON expenses(name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_qualified ON expenses(is_qualified)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_keywords ON expenses(keywords)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id)`);

  // Add hsa_account_id column to existing transactions table if it doesn't exist
  db.run(`ALTER TABLE transactions ADD COLUMN hsa_account_id INTEGER REFERENCES hsa_accounts(id)`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('Note: hsa_account_id column may already exist or there was an error:', err.message);
    }
  });

  // Add last_login column to existing users table if it doesn't exist
  db.run(`ALTER TABLE users ADD COLUMN last_login DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('Note: last_login column may already exist or there was an error:', err.message);
    }
  });

  db.run(`INSERT OR IGNORE INTO expense_categories (name, description) VALUES 
    ('HSA', 'Health Savings Account qualified expenses'),
    ('FSA', 'Flexible Spending Account qualified expenses'),
    ('DCFSA', 'Dependent Care Flexible Spending Account qualified expenses'),
    ('LPFSA', 'Limited Purpose Flexible Spending Account qualified expenses'),
    ('HRA', 'Health Reimbursement Account qualified expenses')`);

  db.run(`CREATE TABLE IF NOT EXISTS annual_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    year INTEGER,
    total_contributed REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, year)
  )`);
});

// Helper functions
function generateCardNumber() {
  return '4000' + Math.random().toString().slice(2, 14);
}

function generateAccountNumber() {
  return 'HSA' + Math.random().toString().slice(2, 11);
}

function generateCVV() {
  return Math.floor(Math.random() * 900 + 100).toString();
}

// Helper function to determine if someone is catch-up eligible
function isCatchUpEligible(dateOfBirth, year = new Date().getFullYear()) {
  const birthDate = new Date(dateOfBirth);
  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();
  
  const ageByEndOfYear = year - birthYear;
  const birthdayThisYear = new Date(year, birthMonth, birthDay);
  const endOfYear = new Date(year, 11, 31); // December 31st
  
  return ageByEndOfYear >= 55 || (ageByEndOfYear === 54 && birthdayThisYear <= endOfYear);
}

// Helper function to get base annual HSA contribution limit
function getBaseAnnualLimit(coverageType, year = new Date().getFullYear()) {
  if (year === 2025) {
    return coverageType === 'family' ? 8550 : 4300;
  } else if (year === 2026) {
    return coverageType === 'family' ? 8750 : 4400;
  } else {
    return coverageType === 'family' ? 8750 : 4400;
  }
}

// Updated function that uses the separate helper functions
function calculateContributionLimit(dateOfBirth, coverageType, year = new Date().getFullYear()) {
  const baseLimit = getBaseAnnualLimit(coverageType, year);
  const catchUpLimit = isCatchUpEligible(dateOfBirth, year) ? 1000 : 0;
  
  console.log('Contribution limit calculation:', {
    dateOfBirth,
    coverageType,
    year,
    baseLimit,
    catchUpLimit,
    totalLimit: baseLimit + catchUpLimit
  });
  
  return baseLimit + catchUpLimit;
}

// API Endpoints

// 1. Create User Account
app.post('/api/users/create', (req, res) => {
  console.log('Creating user:', req.body);
  const { 
    firstName, 
    lastName, 
    email, 
    password, 
    dateOfBirth, 
    coverageType,
    insuranceProvider,
    insuranceCardFront,
    insuranceCardBack,
    hasHDHP,
    noGovernmentInsurance,
    noHealthcareFSA,
    notDependent
  } = req.body;
  
  if (!firstName || !lastName || !email || !password || !dateOfBirth || !coverageType || !insuranceProvider) {
    return res.status(400).json({ error: 'All basic fields are required' });
  }
  
  if (!['individual', 'family'].includes(coverageType)) {
    return res.status(400).json({ error: 'Coverage type must be individual or family' });
  }
  
  if (!hasHDHP || !noGovernmentInsurance || !noHealthcareFSA || !notDependent) {
    return res.status(400).json({ error: 'All HSA eligibility requirements must be confirmed' });
  }
  
  const fullName = `${firstName} ${lastName}`;
  
  db.run(`INSERT INTO users (
    first_name, 
    last_name, 
    email, 
    password, 
    date_of_birth, 
    coverage_type,
    insurance_provider,
    has_hdhp,
    no_government_insurance,
    no_healthcare_fsa,
    not_dependent,
    insurance_card_front,
    insurance_card_back
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [
      firstName, 
      lastName, 
      email, 
      password, 
      dateOfBirth, 
      coverageType,
      insuranceProvider,
      hasHDHP,
      noGovernmentInsurance,
      noHealthcareFSA,
      notDependent,
      insuranceCardFront,
      insuranceCardBack
    ], 
    function(err) {
      if (err) {
        console.log('User creation error:', err);
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Failed to create user' });
      }
      
      console.log('User created with ID:', this.lastID);
      res.json({ 
        userId: this.lastID, 
        name: fullName, 
        email,
        message: 'User created successfully' 
      });
    }
  );
});

app.post('/api/users/login', (req, res) => {
  console.log('User login attempt:', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  db.get(`SELECT id, first_name, last_name, email, last_login FROM users WHERE email = ? AND password = ?`, 
    [email, password], 
    (err, user) => {
      if (err) {
        console.log('Login error:', err);
        return res.status(500).json({ error: 'Login failed' });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      const isFirstLogin = !user.last_login;
      const fullName = `${user.first_name} ${user.last_name}`;
      
      // Update last_login timestamp
      db.run(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [user.id], (updateErr) => {
        if (updateErr) {
          console.log('Error updating last_login:', updateErr);
        }
      });
      
      console.log('User logged in:', user.id, 'First login:', isFirstLogin);
      res.json({ 
        userId: user.id, 
        name: fullName, 
        email: user.email,
        isFirstLogin,
        message: 'Login successful' 
      });
    }
  );
});

// 2. Create HSA Account
app.post('/api/hsa/create', (req, res) => {
  console.log('Creating HSA for user:', req.body);
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const accountNumber = generateAccountNumber();
  
  db.run(`INSERT INTO hsa_accounts (user_id, account_number) VALUES (?, ?)`,
    [userId, accountNumber],
    function(err) {
      if (err) {
        console.log('HSA creation error:', err);
        return res.status(500).json({ error: 'Failed to create HSA account' });
      }
      
      const hsaAccountId = this.lastID;
      console.log('HSA created with ID:', hsaAccountId);
      
      // Automatically issue a virtual card for the new HSA account
      const cardNumber = generateCardNumber();
      const cvv = generateCVV();
      const currentYear = new Date().getFullYear();
      
      db.run(`INSERT INTO virtual_cards (hsa_account_id, card_number, expiry_month, expiry_year, cvv) 
              VALUES (?, ?, ?, ?, ?)`,
        [hsaAccountId, cardNumber, 12, currentYear + 3, cvv],
        function(cardErr) {
          if (cardErr) {
            console.log('Card creation error:', cardErr);
            // Still return success for HSA creation even if card fails
            return res.json({
              hsaId: hsaAccountId,
              accountNumber,
              balance: 0,
              message: 'HSA account created successfully, but card issuance failed'
            });
          }
          
          console.log('Virtual card issued with ID:', this.lastID);
          res.json({
            hsaId: hsaAccountId,
            accountNumber,
            balance: 0,
            cardId: this.lastID,
            cardNumber,
            message: 'HSA account and virtual card created successfully'
          });
        }
      );
    }
  );
});

// 3. Get HSA Account Info
app.get('/api/hsa/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.get(`SELECT * FROM hsa_accounts WHERE user_id = ?`, [userId], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'HSA account not found' });
    }
    res.json(row);
  });
});

// 3.1. Get HSA Contribution Limits
app.get('/api/hsa/contribution-limits/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.get(`SELECT u.date_of_birth, u.coverage_type FROM users u WHERE u.id = ?`, [userId], (err, userData) => {
    if (err || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentYear = new Date().getFullYear();
    const baseLimit = getBaseAnnualLimit(userData.coverage_type, currentYear);
    const catchUpEligible = isCatchUpEligible(userData.date_of_birth, currentYear);
    const annualLimit = calculateContributionLimit(userData.date_of_birth, userData.coverage_type, currentYear);
    
    db.get(`SELECT total_contributed FROM annual_contributions WHERE user_id = ? AND year = ?`, 
      [userId, currentYear], (err, contributionData) => {
        const currentContributions = contributionData ? contributionData.total_contributed : 0;
        const remainingLimit = annualLimit - currentContributions;
        
        res.json({
          annualLimit,
          baseLimit,
          catchUpEligible,
          catchUpAmount: catchUpEligible ? 1000 : 0,
          currentContributions,
          remainingLimit,
          year: currentYear,
          coverageType: userData.coverage_type
        });
      });
  });
});

// 3.2. Check catch-up eligibility
app.get('/api/hsa/catch-up-eligible/:userId', (req, res) => {
  const userId = req.params.userId;
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
  
  db.get(`SELECT date_of_birth FROM users WHERE id = ?`, [userId], (err, userData) => {
    if (err || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const eligible = isCatchUpEligible(userData.date_of_birth, year);
    
    res.json({
      catchUpEligible: eligible,
      catchUpAmount: eligible ? 1000 : 0,
      year
    });
  });
});

// 3.3. Get base annual limit
app.get('/api/hsa/base-limit/:userId', (req, res) => {
  const userId = req.params.userId;
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
  
  db.get(`SELECT coverage_type FROM users WHERE id = ?`, [userId], (err, userData) => {
    if (err || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const baseLimit = getBaseAnnualLimit(userData.coverage_type, year);
    
    res.json({
      baseLimit,
      coverageType: userData.coverage_type,
      year
    });
  });
});

// 3.5. Deposit to HSA Account
app.post('/api/hsa/deposit', (req, res) => {
  console.log('HSA deposit:', req.body);
  const { userId, amount } = req.body;
  
  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid user ID and positive amount are required' });
  }
  
  db.get(`SELECT u.date_of_birth, u.coverage_type, ha.* FROM hsa_accounts ha 
          JOIN users u ON ha.user_id = u.id 
          WHERE ha.user_id = ?`, [userId], (err, accountData) => {
    if (err || !accountData) {
      return res.status(404).json({ error: 'HSA account not found' });
    }
    
    const currentYear = new Date().getFullYear();
    const annualLimit = calculateContributionLimit(accountData.date_of_birth, accountData.coverage_type, currentYear);
    console.log('Contribution limit calculation:', {
      dateOfBirth: accountData.date_of_birth,
      coverageType: accountData.coverage_type,
      currentYear,
      annualLimit
    });
    
    db.get(`SELECT total_contributed FROM annual_contributions WHERE user_id = ? AND year = ?`, 
      [userId, currentYear], (err, contributionData) => {
        const currentContributions = contributionData ? contributionData.total_contributed : 0;
        const remainingLimit = annualLimit - currentContributions;
        console.log('Contribution validation:', {
          currentContributions,
          remainingLimit,
          depositAmount: parseFloat(amount),
          wouldExceed: parseFloat(amount) > remainingLimit
        });
        
        if (parseFloat(amount) > remainingLimit) {
          return res.status(400).json({ 
            error: `Contribution exceeds annual limit. Remaining limit: $${remainingLimit.toFixed(2)}`,
            annualLimit,
            currentContributions,
            remainingLimit
          });
        }
        
        const newBalance = accountData.balance + parseFloat(amount);
        
        db.run(`UPDATE hsa_accounts SET balance = ? WHERE user_id = ?`, 
          [newBalance, userId], 
          function(err) {
            if (err) {
              console.log('Deposit error:', err);
              return res.status(500).json({ error: 'Failed to process deposit' });
            }
            
            db.run(`INSERT OR REPLACE INTO annual_contributions (user_id, year, total_contributed, updated_at) 
                    VALUES (?, ?, COALESCE((SELECT total_contributed FROM annual_contributions WHERE user_id = ? AND year = ?), 0) + ?, CURRENT_TIMESTAMP)`,
              [userId, currentYear, userId, currentYear, parseFloat(amount)]);
            
            db.run(`INSERT INTO transactions (card_id, amount, merchant, description, status, hsa_account_id) 
                    VALUES (NULL, ?, 'HSA Deposit', 'Deposit', 'APPROVED', ?)`,
              [amount, accountData.id]);
            
            console.log('Deposit successful:', amount);
            res.json({
              message: 'Deposit successful',
              amount: parseFloat(amount),
              newBalance,
              hsaId: accountData.id,
              annualLimit,
              currentContributions: currentContributions + parseFloat(amount),
              remainingLimit: remainingLimit - parseFloat(amount)
            });
          }
        );
      });
  });
});

// 3.6. Withdraw from HSA Account (with card validation) - for card simulator
app.post('/api/hsa/withdraw', (req, res) => {
  console.log('HSA withdrawal:', req.body);
  const { userId, amount, reason, cardNumber, expiryMonth, expiryYear, cvv } = req.body;
  
  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid user ID and positive amount are required' });
  }

  // Validate card information is provided
  if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
    return res.status(400).json({ error: 'Card information is required for withdrawals' });
  }

  // Validate card number format
  if (!/^\d{16}$/.test(cardNumber)) {
    return res.status(400).json({ error: 'Invalid card number format' });
  }

  // Validate expiry date
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  if (expiryMonth < 1 || expiryMonth > 12) {
    return res.status(400).json({ error: 'Invalid expiry month' });
  }
  if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
    return res.status(400).json({ error: 'Card expired' });
  }

  // Validate CVV
  if (!/^\d{3,4}$/.test(cvv)) {
    return res.status(400).json({ error: 'Invalid CVV format' });
  }
  
  // First get HSA account
  db.get(`SELECT * FROM hsa_accounts WHERE user_id = ?`, [userId], (err, hsaAccount) => {
    if (err || !hsaAccount) {
      return res.status(404).json({ error: 'HSA account not found' });
    }
    
    // Validate card belongs to this HSA account
    db.get(`SELECT * FROM virtual_cards WHERE hsa_account_id = ? AND card_number = ? AND expiry_month = ? AND expiry_year = ? AND cvv = ? AND is_active = 1`, 
      [hsaAccount.id, cardNumber, expiryMonth, expiryYear, cvv], (cardErr, card) => {
      
      if (cardErr) {
        console.log('Card validation error:', cardErr);
        return res.status(500).json({ error: 'Failed to validate card' });
      }
      
      if (!card) {
        return res.status(400).json({ error: 'Invalid card information. Please check your card number, expiry date, and CVV.' });
      }
    
      if (hsaAccount.balance < amount) {
        return res.status(400).json({ 
          error: 'Insufficient funds',
          availableBalance: hsaAccount.balance 
        });
      }
      
      const newBalance = hsaAccount.balance - parseFloat(amount);
      
      db.run(`UPDATE hsa_accounts SET balance = ? WHERE user_id = ?`, 
        [newBalance, userId], 
        function(err) {
          if (err) {
            console.log('Withdrawal error:', err);
            return res.status(500).json({ error: 'Failed to process withdrawal' });
          }
          
          db.run(`INSERT INTO transactions (card_id, amount, merchant, description, status, hsa_account_id) 
                  VALUES (?, ?, 'HSA Withdrawal', ?, 'APPROVED', ?)`,
            [card.id, -amount, reason || 'Account withdrawal', hsaAccount.id]);
          
          console.log('Withdrawal successful:', amount);
          res.json({
            message: 'Withdrawal successful',
            amount: parseFloat(amount),
            newBalance,
            hsaId: hsaAccount.id
          });
        }
      );
    });
  });
});

// 3.7. Direct HSA Reimbursement (without card validation) - for withdraw modal
app.post('/api/hsa/reimburse', (req, res) => {
  console.log('HSA reimbursement:', req.body);
  const { userId, amount, reason } = req.body;
  
  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid user ID and positive amount are required' });
  }

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Expense reason is required for reimbursements' });
  }
  
  // Get HSA account
  db.get(`SELECT * FROM hsa_accounts WHERE user_id = ?`, [userId], (err, hsaAccount) => {
    if (err || !hsaAccount) {
      return res.status(404).json({ error: 'HSA account not found' });
    }
    
    if (hsaAccount.balance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient funds',
        availableBalance: hsaAccount.balance 
      });
    }
    
    const newBalance = hsaAccount.balance - parseFloat(amount);
    
    db.run(`UPDATE hsa_accounts SET balance = ? WHERE user_id = ?`, 
      [newBalance, userId], 
      function(err) {
        if (err) {
          console.log('Reimbursement error:', err);
          return res.status(500).json({ error: 'Failed to process reimbursement' });
        }
        
        db.run(`INSERT INTO transactions (card_id, amount, merchant, description, status, hsa_account_id) 
                VALUES (NULL, ?, 'HSA Reimbursement', ?, 'APPROVED', ?)`,
          [-amount, reason, hsaAccount.id]);
        
        console.log('Reimbursement successful:', amount);
        res.json({
          message: 'Reimbursement successful',
          amount: parseFloat(amount),
          newBalance,
          hsaId: hsaAccount.id
        });
      }
    );
  });
});

app.get('/api/hsa/transactions/:userId', (req, res) => {
  const userId = req.params.userId;
  
  // First get current balance
  db.get(`SELECT balance FROM hsa_accounts WHERE user_id = ?`, [userId], (err, account) => {
    if (err || !account) {
      return res.status(404).json({ error: 'HSA account not found' });
    }
    
    // Get transactions ordered by date (newest first)
    db.all(`
      SELECT t.*, vc.card_number
      FROM transactions t
      LEFT JOIN virtual_cards vc ON t.card_id = vc.id
      LEFT JOIN hsa_accounts ha ON (vc.hsa_account_id = ha.id OR t.hsa_account_id = ha.id)
      WHERE ha.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT 50
    `, [userId], (err, transactions) => {
      if (err) {
        console.log('Transaction history error:', err);
        return res.status(500).json({ error: 'Failed to fetch transaction history' });
      }
      
      // Calculate balance at time of each transaction (working backwards from current balance)
      let runningBalance = account.balance;
      const transactionsWithBalance = transactions.map(transaction => {
        const balanceAtTime = runningBalance;
        runningBalance -= transaction.amount; // Subtract to get previous balance
        return {
          ...transaction,
          balance_at_time: balanceAtTime
        };
      });
      
      console.log(`Found ${transactions ? transactions.length : 0} transactions for user ${userId}`);
      res.json({ 
        transactions: transactionsWithBalance || [],
        count: transactionsWithBalance ? transactionsWithBalance.length : 0
      });
    });
  });
});

// 4. Issue Virtual Card
app.post('/api/card/issue', (req, res) => {
  console.log('Issuing card for HSA:', req.body);
  const { hsaAccountId } = req.body;
  
  if (!hsaAccountId) {
    return res.status(400).json({ error: 'HSA Account ID is required' });
  }
  
  const cardNumber = generateCardNumber();
  const cvv = generateCVV();
  const currentYear = new Date().getFullYear();
  
  db.run(`INSERT INTO virtual_cards (hsa_account_id, card_number, expiry_month, expiry_year, cvv) 
          VALUES (?, ?, ?, ?, ?)`,
    [hsaAccountId, cardNumber, 12, currentYear + 3, cvv],
    function(err) {
      if (err) {
        console.log('Card creation error:', err);
        return res.status(500).json({ error: 'Failed to issue card' });
      }
      
      console.log('Card issued with ID:', this.lastID);
      res.json({
        cardId: this.lastID,
        cardNumber,
        expiryMonth: 12,
        expiryYear: currentYear + 3,
        cvv: cvv,
        message: 'Virtual card issued successfully'
      });
    }
  );
});

// 4.1. Issue Virtual Card for User (by User ID)
app.post('/api/card/issue-for-user', (req, res) => {
  console.log('Issuing card for user:', req.body);
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  // First, get the HSA account for this user
  db.get(`SELECT id FROM hsa_accounts WHERE user_id = ?`, [userId], (err, hsaAccount) => {
    if (err || !hsaAccount) {
      return res.status(404).json({ error: 'HSA account not found for user' });
    }
    
    // Check if user already has an active card
    db.get(`SELECT id FROM virtual_cards WHERE hsa_account_id = ? AND is_active = 1`, [hsaAccount.id], (err, existingCard) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check existing cards' });
      }
      
      if (existingCard) {
        return res.status(400).json({ error: 'User already has an active card' });
      }
      
      // Issue new card
      const cardNumber = generateCardNumber();
      const cvv = generateCVV();
      const currentYear = new Date().getFullYear();
      
      db.run(`INSERT INTO virtual_cards (hsa_account_id, card_number, expiry_month, expiry_year, cvv) 
              VALUES (?, ?, ?, ?, ?)`,
        [hsaAccount.id, cardNumber, 12, currentYear + 3, cvv],
        function(err) {
          if (err) {
            console.log('Card creation error:', err);
            return res.status(500).json({ error: 'Failed to issue card' });
          }
          
          console.log('Card issued with ID:', this.lastID, 'for user:', userId);
          res.json({
            cardId: this.lastID,
            cardNumber,
            expiryMonth: 12,
            expiryYear: currentYear + 3,
            cvv: cvv,
            hsaAccountId: hsaAccount.id,
            message: 'Virtual card issued successfully'
          });
        }
      );
    });
  });
});

// Load scraped expenses data for enhanced validation
let scrapedExpenses = { qualified: [], non_qualified: [] };
try {
  const fs = require('fs');
  const expenseData = JSON.parse(fs.readFileSync('./scraped-expenses-final.json', 'utf8'));
  scrapedExpenses.qualified = expenseData.qualified || [];
  scrapedExpenses.non_qualified = expenseData.non_qualified || [];
  console.log(`Loaded ${scrapedExpenses.qualified.length} qualified and ${scrapedExpenses.non_qualified.length} non-qualified expenses`);
} catch (err) {
  console.error('Failed to load scraped expenses:', err);
}

// Helper function to calculate string similarity (Levenshtein distance based)
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  // Check for exact substring matches
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    return shorter.length / longer.length;
  }
  
  // Simple word overlap scoring
  const words1 = s1.split(/\s+/).filter(w => w.length > 2);
  const words2 = s2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w1 => words2.some(w2 => w1.includes(w2) || w2.includes(w1)));
  return commonWords.length / Math.max(words1.length, words2.length);
};

const validateExpense = (merchant, description, callback) => {
  const searchTerms = `${merchant} ${description || ''}`.toLowerCase();
  const descriptionOnly = (description || '').toLowerCase().trim();
  const merchantOnly = merchant.toLowerCase().trim();
  
  // Priority 1: Exact description match in scraped qualified expenses
  const exactDescriptionMatch = scrapedExpenses.qualified.find(expense => 
    expense.name.toLowerCase() === descriptionOnly && descriptionOnly.length > 0
  );
  
  if (exactDescriptionMatch) {
    return callback(null, {
      isQualified: true,
      matchType: 'exact-description',
      matchedExpense: exactDescriptionMatch.name,
      category: exactDescriptionMatch.category,
      confidence: 1.0,
      source: 'scraped-data'
    });
  }
  
  // Priority 2: High similarity description match (>0.8 similarity)
  let bestDescriptionMatch = null;
  let bestDescriptionScore = 0;
  
  if (descriptionOnly.length > 2) {
    scrapedExpenses.qualified.forEach(expense => {
      const similarity = calculateSimilarity(descriptionOnly, expense.name);
      if (similarity > bestDescriptionScore && similarity > 0.8) {
        bestDescriptionScore = similarity;
        bestDescriptionMatch = expense;
      }
    });
  }
  
  if (bestDescriptionMatch) {
    return callback(null, {
      isQualified: true,
      matchType: 'high-similarity-description',
      matchedExpense: bestDescriptionMatch.name,
      category: bestDescriptionMatch.category,
      confidence: bestDescriptionScore,
      source: 'scraped-data'
    });
  }
  
  // Priority 3: Merchant + description combined matching in scraped data
  let bestCombinedMatch = null;
  let bestCombinedScore = 0;
  
  scrapedExpenses.qualified.forEach(expense => {
    const similarity = calculateSimilarity(searchTerms, expense.name);
    if (similarity > bestCombinedScore && similarity > 0.7) {
      bestCombinedScore = similarity;
      bestCombinedMatch = expense;
    }
  });
  
  if (bestCombinedMatch) {
    return callback(null, {
      isQualified: true,
      matchType: 'combined-similarity',
      matchedExpense: bestCombinedMatch.name,
      category: bestCombinedMatch.category,
      confidence: bestCombinedScore,
      source: 'scraped-data'
    });
  }
  
  // Priority 4: Database exact match (existing logic)
  db.get(
    `SELECT e.*, ec.name as category_name 
     FROM expenses e 
     JOIN expense_categories ec ON e.category_id = ec.id 
     WHERE LOWER(e.name) = LOWER(?) AND e.is_qualified = 1`,
    [merchant],
    (err, exactMatch) => {
      if (err) {
        return callback(err, null);
      }
      
      if (exactMatch) {
        return callback(null, {
          isQualified: true,
          matchType: 'exact-db',
          matchedExpense: exactMatch.name,
          category: exactMatch.category_name,
          confidence: 1.0,
          source: 'database'
        });
      }
      
      // Priority 5: Database keyword matching
      db.all(
        `SELECT e.*, ec.name as category_name 
         FROM expenses e 
         JOIN expense_categories ec ON e.category_id = ec.id 
         WHERE e.is_qualified = 1 AND (
           LOWER(e.name) LIKE '%' || LOWER(?) || '%' OR
           LOWER(e.keywords) LIKE '%' || LOWER(?) || '%' OR
           LOWER(?) LIKE '%' || LOWER(e.name) || '%'
         )
         ORDER BY LENGTH(e.name) ASC
         LIMIT 5`,
        [searchTerms, searchTerms, searchTerms],
        (err, keywordMatches) => {
          if (err) {
            return callback(err, null);
          }
          
          if (keywordMatches.length > 0) {
            const bestMatch = keywordMatches[0];
            return callback(null, {
              isQualified: true,
              matchType: 'keyword-db',
              matchedExpense: bestMatch.name,
              category: bestMatch.category_name,
              confidence: 0.8,
              source: 'database',
              alternativeMatches: keywordMatches.slice(1).map(m => m.name)
            });
          }
          
          // Priority 6: Check for non-qualified matches in scraped data
          const nonQualifiedMatch = scrapedExpenses.non_qualified.find(expense => {
            const similarity = calculateSimilarity(searchTerms, expense.name);
            return similarity > 0.8;
          });
          
          if (nonQualifiedMatch) {
            return callback(null, {
              isQualified: false,
              matchType: 'non-qualified-scraped',
              matchedExpense: nonQualifiedMatch.name,
              category: nonQualifiedMatch.category,
              confidence: 0.8,
              source: 'scraped-data'
            });
          }
          
          // Priority 7: Database non-qualified check
          db.get(
            `SELECT e.*, ec.name as category_name 
             FROM expenses e 
             JOIN expense_categories ec ON e.category_id = ec.id 
             WHERE e.is_qualified = 0 AND (
               LOWER(e.name) LIKE '%' || LOWER(?) || '%' OR
               LOWER(?) LIKE '%' || LOWER(e.name) || '%'
             )
             ORDER BY LENGTH(e.name) ASC
             LIMIT 1`,
            [searchTerms, searchTerms],
            (err, nonQualifiedMatch) => {
              if (err) {
                return callback(err, null);
              }
              
              if (nonQualifiedMatch) {
                return callback(null, {
                  isQualified: false,
                  matchType: 'non-qualified-db',
                  matchedExpense: nonQualifiedMatch.name,
                  category: nonQualifiedMatch.category_name,
                  confidence: 0.7,
                  source: 'database'
                });
              }
              
              // Priority 8: Fallback keyword logic
              const qualifiedKeywords = ['pharmacy', 'medical', 'doctor', 'hospital', 'clinic', 'prescription', 'rx', 'cvs', 'walgreens', 'medicine', 'medication', 'drug'];
              const hasQualifiedKeyword = qualifiedKeywords.some(keyword => searchTerms.includes(keyword));
              
              callback(null, {
                isQualified: hasQualifiedKeyword,
                matchType: 'fallback',
                matchedExpense: null,
                category: null,
                confidence: hasQualifiedKeyword ? 0.3 : 0.1,
                source: 'fallback',
                reason: hasQualifiedKeyword ? 'Contains medical-related keywords' : 'No medical keywords found'
              });
            }
          );
        }
      );
    }
  );
};

// 5. Process Transaction (Enhanced with database validation)
app.post('/api/transaction/process', (req, res) => {
  console.log('Processing transaction:', req.body);
  const { cardNumber, amount, merchant, description, expiryMonth, expiryYear, cvv } = req.body;
  
  // Validate required card information
  if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
    return res.json({
      status: 'DECLINED',
      reason: 'Missing card information',
      amount,
      merchant
    });
  }
  
  // Validate card number format
  if (!/^\d{16}$/.test(cardNumber)) {
    return res.json({
      status: 'DECLINED',
      reason: 'Invalid card number format',
      amount,
      merchant
    });
  }
  
  // Validate expiry date
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  if (expiryMonth < 1 || expiryMonth > 12) {
    return res.json({
      status: 'DECLINED',
      reason: 'Invalid expiry month',
      amount,
      merchant
    });
  }
  if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
    return res.json({
      status: 'DECLINED',
      reason: 'Card expired',
      amount,
      merchant
    });
  }
  
  // Validate CVV
  if (!/^\d{3,4}$/.test(cvv)) {
    return res.json({
      status: 'DECLINED',
      reason: 'Invalid CVV format',
      amount,
      merchant
    });
  }
  
  validateExpense(merchant, description, (err, validation) => {
    if (err) {
      console.error('Validation error:', err);
      // Fall back to simple validation
      const qualifiedMerchants = ['pharmacy', 'cvs', 'walgreens', 'hospital', 'clinic', 'doctor'];
      const qualifiedKeywords = ['prescription', 'medical', 'dental', 'vision', 'doctor', 'hospital'];
      
      const isQualified = qualifiedMerchants.some(m => 
        merchant.toLowerCase().includes(m)
      ) || qualifiedKeywords.some(k => 
        description.toLowerCase().includes(k)
      );
      
      validation = {
        isQualified,
        matchType: 'fallback',
        confidence: 0.5,
        reason: 'Database validation failed, used fallback logic'
      };
    }
    
    if (!validation.isQualified) {
      return res.json({
        status: 'DECLINED',
        reason: 'Not a qualified medical expense',
        amount,
        merchant,
        validation
      });
    }
    
    // Check card exists with full validation and get HSA balance
    db.get(`
      SELECT vc.id as card_id, ha.balance 
      FROM virtual_cards vc 
      JOIN hsa_accounts ha ON vc.hsa_account_id = ha.id 
      WHERE vc.card_number = ? AND vc.expiry_month = ? AND vc.expiry_year = ? AND vc.cvv = ? AND vc.is_active = 1
    `, [cardNumber, expiryMonth, expiryYear, cvv], (err, row) => {
      
      if (err || !row) {
        return res.json({
          status: 'DECLINED',
          reason: 'Invalid card',
          amount,
          merchant,
          validation
        });
      }
      
      if (row.balance < amount) {
        return res.json({
          status: 'DECLINED',
          reason: 'Insufficient funds',
          amount,
          merchant,
          availableBalance: row.balance,
          validation
        });
      }
      
      // Approve transaction and deduct from balance
      const newBalance = row.balance - amount;
      
      db.run(`UPDATE hsa_accounts SET balance = ? WHERE id = (
        SELECT hsa_account_id FROM virtual_cards WHERE card_number = ?
      )`, [newBalance, cardNumber]);
      
      db.run(`INSERT INTO transactions (card_id, amount, merchant, description, status, hsa_account_id) 
              VALUES (?, ?, ?, ?, 'APPROVED', (SELECT hsa_account_id FROM virtual_cards WHERE id = ?))`,
        [row.card_id, -amount, merchant, description, row.card_id]);
      
      res.json({
        status: 'APPROVED',
        amount,
        merchant,
        newBalance,
        message: 'Transaction approved',
        validation
      });
    });
  });
});

// Expense validation API endpoints
app.post('/api/expenses/validate', (req, res) => {
  const { merchant, description } = req.body;

  if (!merchant) {
    return res.status(400).json({ error: 'Merchant name is required' });
  }

  validateExpense(merchant, description, (err, validation) => {
    if (err) {
      return res.status(500).json({ error: 'Validation failed' });
    }

    res.json(validation);
  });
});

let simplifiedExpenses = [];
try {
  const fs = require('fs');
  const expenseData = JSON.parse(fs.readFileSync('./expenses-simplified.json', 'utf8'));
  simplifiedExpenses = expenseData.expenses;
  console.log(`Loaded ${simplifiedExpenses.length} simplified expenses for dropdown search`);
} catch (err) {
  console.error('Failed to load simplified expenses:', err);
}

app.get('/api/expenses/dropdown-search', (req, res) => {
  const { q, limit = 20 } = req.query;

  if (!q || q.length < 3) {
    return res.status(400).json({ error: 'Search query must be at least 3 characters' });
  }

  const searchTerm = q.toLowerCase();
  
  const matches = simplifiedExpenses
    .filter(expense => expense.name.toLowerCase().includes(searchTerm))
    .sort((a, b) => {
      const aStartsWith = a.name.toLowerCase().startsWith(searchTerm);
      const bStartsWith = b.name.toLowerCase().startsWith(searchTerm);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      if (a.name.length !== b.name.length) return a.name.length - b.name.length;
      return a.name.localeCompare(b.name);
    })
    .slice(0, parseInt(limit));

  res.json({
    suggestions: matches,
    count: matches.length,
    total_available: simplifiedExpenses.length
  });
});

app.get('/api/expenses/search', (req, res) => {
  const { q, qualified, category, limit = 50 } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  let query = `
    SELECT e.*, ec.name as category_name 
    FROM expenses e 
    JOIN expense_categories ec ON e.category_id = ec.id 
    WHERE (LOWER(e.name) LIKE '%' || LOWER(?) || '%' OR LOWER(e.keywords) LIKE '%' || LOWER(?) || '%')
  `;
  let params = [q, q];

  if (qualified !== undefined) {
    query += ' AND e.is_qualified = ?';
    params.push(qualified === 'true' ? 1 : 0);
  }

  if (category) {
    query += ' AND ec.name = ?';
    params.push(category);
  }

  query += ' ORDER BY LENGTH(e.name) ASC LIMIT ?';
  params.push(parseInt(limit));

  db.all(query, params, (err, expenses) => {
    if (err) {
      return res.status(500).json({ error: 'Search failed' });
    }

    res.json({
      expenses: expenses,
      count: expenses.length
    });
  });
});

app.get('/api/expenses/categories', (req, res) => {
  db.all('SELECT * FROM expense_categories ORDER BY name', (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    res.json(categories);
  });
});

app.post('/api/expenses/populate', (req, res) => {
  const { expenses } = req.body;

  if (!expenses || !Array.isArray(expenses)) {
    return res.status(400).json({ error: 'Expenses array is required' });
  }

  db.run('DELETE FROM expenses', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to clear existing expenses' });
    }

    const stmt = db.prepare(`
      INSERT INTO expenses (name, category_id, is_qualified, keywords, source_url, raw_text)
      SELECT ?, ec.id, ?, ?, ?, ?
      FROM expense_categories ec
      WHERE ec.name = ?
    `);

    let insertCount = 0;
    let errorCount = 0;

    expenses.forEach(expense => {
      const keywords = expense.name.toLowerCase().split(/\s+/).join(' ');
      
      stmt.run([
        expense.name,
        expense.is_qualified ? 1 : 0,
        keywords,
        expense.source_url || '',
        expense.raw_text || expense.name,
        expense.category || 'HSA'
      ], (err) => {
        if (err) {
          errorCount++;
        } else {
          insertCount++;
        }
      });
    });

    stmt.finalize((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to populate expenses' });
      }

      res.json({
        message: 'Expenses populated successfully',
        inserted: insertCount,
        errors: errorCount,
        total: expenses.length
      });
    });
  });
});

// 6. Get Card Details for User
app.get('/api/card/details/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.get(`
    SELECT 
      vc.card_number,
      vc.expiry_month,
      vc.expiry_year,
      vc.cvv,
      vc.is_active,
      ha.account_number,
      ha.balance,
      u.first_name,
      u.last_name
    FROM virtual_cards vc
    JOIN hsa_accounts ha ON vc.hsa_account_id = ha.id
    JOIN users u ON ha.user_id = u.id
    WHERE u.id = ? AND vc.is_active = 1
    ORDER BY vc.created_at DESC
    LIMIT 1
  `, [userId], (err, cardDetails) => {
    if (err) {
      console.log('Card details error:', err);
      return res.status(500).json({ error: 'Failed to fetch card details' });
    }
    
    if (!cardDetails) {
      return res.status(404).json({ error: 'No active card found for user' });
    }
    
    res.json({
      cardNumber: cardDetails.card_number,
      expiryDate: `${cardDetails.expiry_month.toString().padStart(2, '0')}/${cardDetails.expiry_year.toString().slice(-2)}`,
      cvv: cardDetails.cvv,
      accountNumber: cardDetails.account_number,
      balance: cardDetails.balance,
      cardholderName: `${cardDetails.first_name} ${cardDetails.last_name}`,
      isActive: cardDetails.is_active
    });
  });
});

// Debug endpoints
app.get('/api/debug/users', (req, res) => {
  db.all(`SELECT id, name, email FROM users`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ users: rows });
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'HSA Backend API is running!' });
});

app.listen(PORT, () => {
  console.log(`HSA Backend running on http://localhost:${PORT}`);
});

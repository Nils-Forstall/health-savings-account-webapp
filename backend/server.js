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
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    amount REAL,
    merchant TEXT,
    description TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(card_id) REFERENCES virtual_cards(id)
  )`);
});

// Helper functions
function generateCardNumber() {
  return '4000' + Math.random().toString().slice(2, 14);
}

function generateAccountNumber() {
  return 'HSA' + Math.random().toString().slice(2, 11);
}

// API Endpoints

// 1. Create User Account
app.post('/api/users/create', (req, res) => {
  console.log('Creating user:', req.body);
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, 
    [name, email, password], 
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
        name, 
        email,
        message: 'User created successfully' 
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
      
      console.log('HSA created with ID:', this.lastID);
      res.json({
        hsaId: this.lastID,
        accountNumber,
        balance: 0,
        message: 'HSA account created successfully'
      });
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

// 4. Issue Virtual Card
app.post('/api/card/issue', (req, res) => {
  console.log('Issuing card for HSA:', req.body);
  const { hsaAccountId } = req.body;
  
  if (!hsaAccountId) {
    return res.status(400).json({ error: 'HSA Account ID is required' });
  }
  
  const cardNumber = generateCardNumber();
  const currentYear = new Date().getFullYear();
  
  db.run(`INSERT INTO virtual_cards (hsa_account_id, card_number, expiry_month, expiry_year, cvv) 
          VALUES (?, ?, ?, ?, ?)`,
    [hsaAccountId, cardNumber, 12, currentYear + 3, '123'],
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
        cvv: '123',
        message: 'Virtual card issued successfully'
      });
    }
  );
});

// 5. Process Transaction
app.post('/api/transaction/process', (req, res) => {
  console.log('Processing transaction:', req.body);
  const { cardNumber, amount, merchant, description } = req.body;
  
  // Simple medical expense validation
  const qualifiedMerchants = ['pharmacy', 'cvs', 'walgreens', 'hospital', 'clinic', 'doctor'];
  const qualifiedKeywords = ['prescription', 'medical', 'dental', 'vision', 'doctor', 'hospital'];
  
  const isQualified = qualifiedMerchants.some(m => 
    merchant.toLowerCase().includes(m)
  ) || qualifiedKeywords.some(k => 
    description.toLowerCase().includes(k)
  );
  
  if (!isQualified) {
    return res.json({
      status: 'DECLINED',
      reason: 'Not a qualified medical expense',
      amount,
      merchant
    });
  }
  
  // Check card exists and get HSA balance
  db.get(`
    SELECT vc.id as card_id, ha.balance 
    FROM virtual_cards vc 
    JOIN hsa_accounts ha ON vc.hsa_account_id = ha.id 
    WHERE vc.card_number = ? AND vc.is_active = 1
  `, [cardNumber], (err, row) => {
    
    if (err || !row) {
      return res.json({
        status: 'DECLINED',
        reason: 'Invalid card',
        amount,
        merchant
      });
    }
    
    if (row.balance < amount) {
      return res.json({
        status: 'DECLINED',
        reason: 'Insufficient funds',
        amount,
        merchant,
        availableBalance: row.balance
      });
    }
    
    // Approve transaction and deduct from balance
    const newBalance = row.balance - amount;
    
    db.run(`UPDATE hsa_accounts SET balance = ? WHERE id = (
      SELECT hsa_account_id FROM virtual_cards WHERE card_number = ?
    )`, [newBalance, cardNumber]);
    
    db.run(`INSERT INTO transactions (card_id, amount, merchant, description, status) 
            VALUES (?, ?, ?, ?, 'APPROVED')`,
      [row.card_id, amount, merchant, description]);
    
    res.json({
      status: 'APPROVED',
      amount,
      merchant,
      newBalance,
      message: 'Transaction approved'
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
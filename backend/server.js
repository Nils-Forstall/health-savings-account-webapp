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

  db.run(`INSERT OR IGNORE INTO expense_categories (name, description) VALUES 
    ('HSA', 'Health Savings Account qualified expenses'),
    ('FSA', 'Flexible Spending Account qualified expenses'),
    ('DCFSA', 'Dependent Care Flexible Spending Account qualified expenses'),
    ('LPFSA', 'Limited Purpose Flexible Spending Account qualified expenses'),
    ('HRA', 'Health Reimbursement Account qualified expenses')`);
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

const validateExpense = (merchant, description, callback) => {
  const searchTerms = `${merchant} ${description || ''}`.toLowerCase();
  
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
          matchType: 'exact',
          matchedExpense: exactMatch.name,
          category: exactMatch.category_name,
          confidence: 1.0
        });
      }
      
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
              matchType: 'keyword',
              matchedExpense: bestMatch.name,
              category: bestMatch.category_name,
              confidence: 0.8,
              alternativeMatches: keywordMatches.slice(1).map(m => m.name)
            });
          }
          
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
                  matchType: 'non-qualified',
                  matchedExpense: nonQualifiedMatch.name,
                  category: nonQualifiedMatch.category_name,
                  confidence: 0.7
                });
              }
              
              const qualifiedKeywords = ['pharmacy', 'medical', 'doctor', 'hospital', 'clinic', 'prescription', 'rx', 'cvs', 'walgreens'];
              const hasQualifiedKeyword = qualifiedKeywords.some(keyword => searchTerms.includes(keyword));
              
              callback(null, {
                isQualified: hasQualifiedKeyword,
                matchType: 'fallback',
                matchedExpense: null,
                category: null,
                confidence: hasQualifiedKeyword ? 0.3 : 0.1,
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
  const { cardNumber, amount, merchant, description } = req.body;
  
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
      
      db.run(`INSERT INTO transactions (card_id, amount, merchant, description, status) 
              VALUES (?, ?, ?, ?, 'APPROVED')`,
        [row.card_id, amount, merchant, description]);
      
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

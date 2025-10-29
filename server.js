const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Secret key for JWT
const SECRET_KEY = process.env.SECRET_KEY || 'mysecretkey';

// Simulated user and bank data
let user = { username: 'user1', password: 'password123' };
let balance = 1000;

// Login Route — Generate Token
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === user.username && password === user.password) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return res.status(200).json({ token });
  }

  res.status(401).json({ message: 'Invalid username or password' });
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'Token missing' });

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(403).json({ message: 'Token not provided' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
}

// Protected Route: Get Balance
app.get('/balance', verifyToken, (req, res) => {
  res.status(200).json({ balance });
});

// Protected Route: Deposit
app.post('/deposit', verifyToken, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  balance += amount;
  res.status(200).json({ message: `Deposited $${amount}`, newBalance: balance });
});

// Protected Route: Withdraw
app.post('/withdraw', verifyToken, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
  if (amount > balance) return res.status(400).json({ message: 'Insufficient funds' });

  balance -= amount;
  res.status(200).json({ message: `Withdrew $${amount}`, newBalance: balance });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

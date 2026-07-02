const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_openshift_key';

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'postgresql', // Matches your service name
  database: process.env.DB_NAME || 'edb',
  user: process.env.DB_USER || 'euser',
  password: process.env.DB_PASSWORD || 'admin123',
  port: 5432,
});

// --- AUTOMATIC DATABASE MIGRATION FUNCTION ---
const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    
    // 1. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price NUMERIC NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed sample data if empty
    const res = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(res.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, price, description) VALUES
        ('OpenShift Premium Cap', 19.99, 'Keep cool while your pods auto-scale.'),
        ('Kubernetes Mug', 12.50, 'Holds coffee, deploys microservices.'),
        ('Cloud Engineering Hoodie', 49.99, 'Perfect for cold server rooms.');
      `);
      console.log('Database successfully migrated and seeded.');
    } else {
      console.log('Database tables exist. Migration skipped.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
};
runMigrations();

// --- AUTHENTICATION ROUTES ---

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid email or password' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// --- ECOMMERCE PRODUCTS ROUTE ---
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(port, () => console.log(`Backend spinning on port ${port}`));

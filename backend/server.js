const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database Configuration using environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'edb',
  user: process.env.DB_USER || 'euser',
  password: process.env.DB_PASSWORD || 'admin123',
  port: 5432,
});

// Initialize Database Table
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price NUMERIC NOT NULL,
        description TEXT
      );
    `);
    
    // Insert mock data if table is empty
    const res = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(res.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, price, description) VALUES
        ('OpenShift T-Shirt', 25.99, 'Comfortable enterprise-grade cotton shirt.'),
        ('Kubernetes Mug', 12.50, 'Holds coffee, deploys microservices.'),
        ('Cloud Engineering Hoodie', 49.99, 'Perfect for cold server rooms.');
      `);
      console.log('Mock products inserted.');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};
initDb();

// API Endpoint to fetch products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.get('/health', (req, res) => res.status(200).send('OK'));

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

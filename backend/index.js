require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// --- DB INIT ---
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS participants (
        cnic VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        region VARCHAR(100),
        dealership VARCHAR(255),
        age VARCHAR(10),
        gender VARCHAR(20),
        degree VARCHAR(255),
        experience VARCHAR(50),
        raw_data JSONB
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        participant_cnic VARCHAR(50) REFERENCES participants(cnic),
        scores JSONB NOT NULL,
        assessor_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Database Tables Ready");
  } catch (err) {
    console.error("❌ DB Init Error:", err);
  }
};
initDB();

app.get('/', (req, res) => res.send('Backend Running'));

// 1. SEED
app.post('/api/seed-participants', async (req, res) => {
  const participants = req.body;
  if (!Array.isArray(participants)) return res.status(400).json({ error: "Invalid array" });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const p of participants) {
      const query = `
        INSERT INTO participants (cnic, name, region, dealership, age, gender, degree, experience, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (cnic) DO UPDATE SET 
          name = EXCLUDED.name, region = EXCLUDED.region, dealership = EXCLUDED.dealership;
      `;
      const values = [
        p.cnic, p.name, p.region, p.dealership, p.age, p.gender, p.degree, 
        p['Years of Experience at Pak Suzuki'], JSON.stringify(p)
      ];
      await client.query(query, values);
    }
    await client.query('COMMIT');
    res.json({ message: "Seeded successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Seeding failed" });
  } finally {
    client.release();
  }
});

// 2. SUBMIT
app.post('/api/submit-assessment', async (req, res) => {
  const { cnic, scores, assessorName } = req.body;
  try {
    // Ensure participant exists first (optional safety check)
    const check = await pool.query('SELECT * FROM participants WHERE cnic = $1', [cnic]);
    if (check.rows.length === 0) {
      // Auto-create dummy participant if missing (prevents FK error)
      await pool.query('INSERT INTO participants (cnic, name) VALUES ($1, $2)', [cnic, 'Unknown']);
    }

    const query = `INSERT INTO assessments (participant_cnic, scores, assessor_name) VALUES ($1, $2, $3)`;
    await pool.query(query, [cnic, JSON.stringify(scores), assessorName || 'Assessor']);
    res.json({ message: "Saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Save failed" });
  }
});

// 3. DASHBOARD DATA (FIXED QUERY)
app.get('/api/dashboard-data', async (req, res) => {
  try {
    // Simplified Query to avoid DISTINCT ON complexity issues
    const query = `
      SELECT 
        p.cnic, p.name, p.region, p.dealership, p.age, p.gender, p.degree, p.experience,
        a.scores, a.created_at
      FROM participants p
      JOIN assessments a ON p.cnic = a.participant_cnic
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query);
    
    // Filter unique by CNIC in JS (safer than complex SQL for now)
    const uniqueResults = [];
    const seen = new Set();
    for (const row of result.rows) {
      if (!seen.has(row.cnic)) {
        seen.add(row.cnic);
        uniqueResults.push(row);
      }
    }

    res.json(uniqueResults);
  } catch (err) {
    console.error("Dashboard Data Error:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
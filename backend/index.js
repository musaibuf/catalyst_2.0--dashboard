const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend is working');
});

app.post('/api/submit', (req, res) => {
    console.log('Form Data:', req.body);
    res.json({ message: 'Data received successfully' });
});

// 3. GET DASHBOARD DATA (Used by dataProcessing.js)
app.get('/api/dashboard-data', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.cnic, p.name, p.region, p.dealership, p.age, p.gender, p.degree, p.experience,
        a.scores, a.created_at
      FROM participants p
      LEFT JOIN (
        SELECT DISTINCT ON (participant_cnic) *
        FROM assessments
        ORDER BY participant_cnic, created_at DESC
      ) a ON p.cnic = a.participant_cnic
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

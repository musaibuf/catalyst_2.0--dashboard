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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const donorRoutes = require('./routes/donors');
const inventoryRoutes = require('./routes/inventory');
const requestRoutes = require('./routes/requests');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Blood Bank API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

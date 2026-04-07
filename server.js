const express = require('express');
const cors = require('cors');
const { loadDistricts } = require('./loader'); // <-- rename this

const app = express();
app.use(cors());

const PORT = 3000;

// API endpoint
app.get('/districts', async (req, res) => {
  try {
    const districts = await loadDistricts();
    
    // ADD fake lat/lng so Leaflet can use it
    const withCoords = districts.map(d => ({
    ...d,
    score: d.gradRate || 80
    }));

    res.json(withCoords);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Basic CORS
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Test server is running on port ${PORT}`);
  console.log(`✅ Test endpoint: http://localhost:${PORT}/test`);
}); 
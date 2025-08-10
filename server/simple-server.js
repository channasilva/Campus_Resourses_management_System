const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Basic CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend server is working!',
    timestamp: new Date().toISOString()
  });
});

// Registration endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Registration request received:', req.body);
  
  // Simulate database storage
  const userData = {
    id: Date.now(),
    username: req.body.username,
    email: req.body.email,
    role: req.body.role,
    lecturerId: req.body.lecturerId,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully! Data stored in database.',
    data: {
      user: userData,
      token: 'test-token-' + Date.now()
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Simple server is running on port ${PORT}`);
  console.log(`✅ Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`✅ Registration endpoint: http://localhost:${PORT}/api/auth/register`);
}); 
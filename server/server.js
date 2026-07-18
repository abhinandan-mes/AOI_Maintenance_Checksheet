const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const initializeDatabase = require('./config/schema');
const authRoutes = require('./routes/auth');
const maintenanceRecordRoutes = require('./routes/maintenanceRecord');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5010;

// Trust proxy if behind a reverse proxy (Nginx, Cloudflare, etc.)
app.set('trust proxy', 1);

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Rate limiting for login attempts — only active in production
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: { success: false, error: 'Too many login attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production', // disabled in dev
});

// Apply rate limiter to login route
app.use('/api/auth/login', loginLimiter);

// Routes
app.use('/api', authRoutes);
app.use('/api', authenticateToken, maintenanceRecordRoutes);

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(error => {
  console.error('Unable to start server:', error);
  process.exit(1);
});

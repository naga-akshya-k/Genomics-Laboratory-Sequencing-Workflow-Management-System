require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');

const { connectDB } = require('./config/db');
const User = require('./models/User');
const { seedData } = require('./seed/seed');
const errorHandler = require('./middleware/errorHandler');

// Ensure necessary upload directories exist
const uploadsReportsDir = path.join(__dirname, 'uploads', 'reports');
const uploadsAnalysisDir = path.join(__dirname, 'uploads', 'analysis');
if (!fs.existsSync(uploadsReportsDir)) fs.mkdirSync(uploadsReportsDir, { recursive: true });
if (!fs.existsSync(uploadsAnalysisDir)) fs.mkdirSync(uploadsAnalysisDir, { recursive: true });

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const sampleRoutes = require('./routes/sampleRoutes');
const qcRoutes = require('./routes/qcRoutes');
const sequencingRoutes = require('./routes/sequencingRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const interoperabilityRoutes = require('./routes/interoperabilityRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database and start listening only when ready
const startServer = async () => {
  try {
    await connectDB();
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Auto-seeding initial demo data...');
      await seedData(false);
      console.log('[Server] Auto-seeding complete.');
    }

    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`[Server] Genomics Lab Server running on port ${PORT}`);
        console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`[Server] Client Origin allowed: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173 (or dynamic reflection)'}`);
      });
    }
  } catch (err) {
    console.error('[Server Startup Error]', err);
  }
};

// CORS configuration supporting single-domain or multi-domain deployment
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim().replace(/\/+$/, ''))
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(morgan('dev'));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        allowedOrigins.includes('*') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, origin);
      }
      // In production, dynamically reflect origin to guarantee cross-domain connectivity
      return callback(null, origin);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads (for reports and analysis artifacts)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Genomics Laboratory Workflow System API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/samples', sampleRoutes);
app.use('/api/v1/qc', qcRoutes);
app.use('/api/v1/sequencing-runs', sequencingRoutes);
app.use('/api/v1/analysis', analysisRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/interop', interoperabilityRoutes);

// In production, serve React frontend static assets if built
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Server] Serving production frontend build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

// Start server
startServer();

module.exports = app;

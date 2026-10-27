require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const { connectDB } = require('./config/db');
const User = require('./models/User');
const { seedData } = require('./seed/seed');
const errorHandler = require('./middleware/errorHandler');

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
        console.log(`[Server] Client Origin allowed: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}`);
      });
    }
  } catch (err) {
    console.error('[Server Startup Error]', err);
  }
};

// Middleware
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
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

// Serve frontend static build in production
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

// Start server
startServer();

module.exports = app;

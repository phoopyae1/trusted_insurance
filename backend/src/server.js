const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

let connectMongoDB;
try {
  const mongoConfig = require('./config/mongodb');
  connectMongoDB = mongoConfig.connectMongoDB;
} catch (error) {
  console.warn('⚠️ MongoDB configuration not available');
  connectMongoDB = async () => {};
}

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const quoteRoutes = require('./routes/quotes');
const policyRoutes = require('./routes/policies');
const claimRoutes = require('./routes/claims');
const paymentRoutes = require('./routes/payments');
const invoiceRoutes = require('./routes/invoices');
const auditLogRoutes = require('./routes/auditLogs');
const integrationRoutes = require('./routes/integrations');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trusted Insurance API',
      version: '1.0.0'
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: []
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/integrations', integrationRoutes);

// Error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND'
    }
  });
});

// Initialize MongoDB connection (optional)
if (connectMongoDB) {
  connectMongoDB().catch((error) => {
    console.warn('⚠️ MongoDB connection failed:', error.message);
    console.warn('   Integration features will be unavailable until MongoDB is configured.');
  });
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 API running on port ${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`🏥 Health check: http://localhost:${port}/api/health`);
});

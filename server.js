// server.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const mongoSanitize = require('express-mongo-sanitize'); // optional
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');


dotenv.config({ path: './config/config.env' });

// Connect DB
connectDB();

const app = express();

function parseTrustProxyHops(rawValue) {
  const normalizedValue = String(rawValue ?? '').trim();

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error('Invalid TRUST_PROXY_HOPS. Expected a non-negative integer.');
  }

  return parsedValue;
}

function resolveTrustProxySetting() {
  const configuredHops = parseTrustProxyHops(process.env.TRUST_PROXY_HOPS);

  if (configuredHops !== null) {
    return configuredHops;
  }

  return process.env.VERCEL ? 1 : false;
}

const trustProxySetting = resolveTrustProxySetting();
app.set('trust proxy', trustProxySetting);
console.log(
  `[config] trust proxy = ${trustProxySetting === false ? 'false' : trustProxySetting}`
);

// Swagger setup (scan routes folder)
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel Booking API',
      version: '1.0.0',
      description: 'Simple Hotel Booking REST API'
    },
    servers: [
      {
        url: `${process.env.HOST}:${process.env.PORT || 5003}/api/v1`
      }
    ]
  },
  apis: ['./routes/*.js']
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Body parser
app.use(express.json());
// Cookie parser
app.use(cookieParser());

// Security middlewares
app.use(mongoSanitize()); // enable if package installed
app.use(helmet());
app.use(xss());

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10000
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Routes (updated names)
const authRoutes = require('./routes/auth');
const hotelsRoutes = require('./routes/Hotel');
const bookingRoutes = require('./routes/bookings'); // routes/booking.js (uses mergeParams)

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/hotels', hotelsRoutes);      // includes nested /:hotelId/bookings
app.use('/api/v1/bookings', bookingRoutes);   // optional direct bookings endpoint

// Health check (optional)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

const PORT = process.env.PORT || 5003;

// Listen locally unless the app is running in Vercel's serverless environment.
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  // Graceful shutdown on unhandled rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`UnhandledRejection: ${err && err.message}`);
    server.close(() => process.exit(1));
  });
}

// Export the Express API for Vercel
module.exports = app;

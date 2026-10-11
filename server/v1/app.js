const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', env.TRUST_PROXY ? 1 : false);
app.use(helmet());
app.use(
  cors({ origin: env.CORS_ORIGIN.split(',').map((item) => item.trim()), credentials: false }),
);
app.use(express.json({ limit: '100kb' }));
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;

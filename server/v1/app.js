const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');

const app = express();
const openApiPath = path.join(__dirname, 'docs', 'openapi.yaml');
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));
app.disable('x-powered-by');
app.set('trust proxy', env.TRUST_PROXY ? 1 : false);
app.use(helmet());
app.use(
  cors({ origin: env.CORS_ORIGIN.split(',').map((item) => item.trim()), credentials: false }),
);
app.use(express.json({ limit: '100kb' }));
app.get('/openapi.yaml', (_req, res) => res.type('application/yaml').sendFile(openApiPath));
app.use(
  '/api-docs',
  (_req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'LeadFlow CRM API Documentation',
    swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
  }),
);
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;

const router = require('express').Router();
const controller = require('../controller/dashboard.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { dashboardSchema } = require('../validators/dashboard.validation');

router.get('/', authenticate, validate(dashboardSchema), controller.get);

module.exports = router;

const router = require('express').Router();
const controller = require('../controller/auth.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { loginSchema } = require('../validators/auth.validation');
const rateLimit = require('../middleware/rate-limit');
const env = require('../config/env');

router.post(
  '/login',
  rateLimit({
    prefix: 'login',
    max: env.LOGIN_RATE_LIMIT_MAX,
    windowSeconds: env.LOGIN_RATE_LIMIT_WINDOW_SECONDS,
  }),
  validate(loginSchema),
  controller.login,
);
router.get('/me', authenticate, controller.me);

module.exports = router;

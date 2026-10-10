const router = require('express').Router();
router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/leads', require('./lead.routes'));
module.exports = router;

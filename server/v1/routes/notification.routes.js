const router = require('express').Router();
const controller = require('../controller/notification.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/', controller.list);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);
module.exports = router;

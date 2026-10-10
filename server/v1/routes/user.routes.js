const router = require('express').Router();
const controller = require('../controller/user.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants/roles');
const schemas = require('../validators/user.validation');

router.use(authenticate, authorize(ROLES.ADMIN));
router.post('/', validate(schemas.createUserSchema), controller.create);
router.get('/', validate(schemas.listUsersSchema), controller.list);
router.get('/:id', validate(schemas.userIdSchema), controller.get);
router.patch('/:id/status', validate(schemas.updateUserStatusSchema), controller.updateStatus);

module.exports = router;

const router = require('express').Router();
const controller = require('../controller/lead.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants/roles');
const schemas = require('../validators/lead.validation');

router.use(authenticate);
router.post('/', authorize(ROLES.ADMIN), validate(schemas.createLeadSchema), controller.create);
router.get('/', validate(schemas.listLeadsSchema), controller.list);
router.get('/:id', validate(schemas.leadIdSchema), controller.get);
router.patch('/:id/status', validate(schemas.changeStatusSchema), controller.changeStatus);
router.patch('/:id', validate(schemas.updateLeadSchema), controller.update);

module.exports = router;

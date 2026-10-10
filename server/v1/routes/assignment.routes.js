const router = require('express').Router();
const controller = require('../controller/assignment.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants/roles');
const schemas = require('../validators/assignment.validation');

router.use(authenticate);
router.post(
  '/leads/:leadId/assignment',
  authorize(ROLES.ADMIN),
  validate(schemas.assignLeadSchema),
  controller.assignLead,
);
router.post(
  '/leads/:leadId/reassignment-requests',
  authorize(ROLES.SALES),
  validate(schemas.createRequestSchema),
  controller.createRequest,
);
router.get(
  '/reassignment-requests',
  authorize(ROLES.ADMIN),
  validate(schemas.listRequestsSchema),
  controller.listRequests,
);
router.patch(
  '/reassignment-requests/:id',
  authorize(ROLES.ADMIN),
  validate(schemas.reviewRequestSchema),
  controller.reviewRequest,
);

module.exports = router;

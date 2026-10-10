const router = require('express').Router();
const controller = require('../controller/activity.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const schemas = require('../validators/activity.validation');

router.use(authenticate);
router.post('/leads/:leadId/activities/notes', validate(schemas.addNoteSchema), controller.addNote);
router.get(
  '/leads/:leadId/activities',
  validate(schemas.listActivitiesSchema),
  controller.listHistory,
);

module.exports = router;

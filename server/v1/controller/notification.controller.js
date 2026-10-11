const service = require('../services/notification.service');

async function list(req, res, next) {
  try {
    return res.json({ data: { notifications: await service.list(req.user.id) } });
  } catch (error) {
    return next(error);
  }
}
async function markRead(req, res, next) {
  try {
    await service.markRead(req.params.id, req.user.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
async function markAllRead(req, res, next) {
  try {
    await service.markAllRead(req.user.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
module.exports = { list, markRead, markAllRead };

const service = require('../services/dashboard.service');

async function get(req, res, next) {
  try {
    return res.json({ data: await service.getDashboard(req.query, req.user) });
  } catch (error) {
    return next(error);
  }
}

module.exports = { get };

const authService = require('../services/auth.service');

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({ data: result });
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.status(200).json({ data: { user: req.user } });
}

module.exports = { login, me };

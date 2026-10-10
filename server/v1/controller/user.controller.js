const service = require('../services/user.service');

async function create(req, res, next) {
  try {
    return res.status(201).json({ data: { user: await service.createSalesUser(req.body) } });
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const result = await service.listUsers(req.query);
    return res.json({
      data: {
        users: result.items,
      },

      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function get(req, res, next) {
  try {
    return res.json({
      data: {
        user: await service.getUser(req.params.id),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const user = await service.updateStatus(req.params.id, req.body.isActive, req.user.id);
    return res.json({
      data: {
        user,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { create, list, get, updateStatus };

const service = require('../services/lead.service');

async function create(req, res, next) {
  try {
    const result = await service.createLead(req.body, req.user, req.get('Idempotency-Key'));
    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const result = await service.listLeads(req.query, req.user);
    return res.json({ data: { leads: result.items }, pagination: result.pagination });
  } catch (error) {
    return next(error);
  }
}

async function get(req, res, next) {
  try {
    return res.json({ data: { lead: await service.getLead(req.params.id, req.user) } });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    return res.json({
      data: { lead: await service.updateLead(req.params.id, req.body, req.user) },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { create, list, get, update };

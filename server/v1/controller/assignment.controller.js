const service = require('../services/assignment.service');

async function assignLead(req, res, next) {
  try {
    const lead = await service.assignLead(req.params.leadId, req.body, req.user);
    return res.json({ data: { lead } });
  } catch (error) {
    return next(error);
  }
}

async function createRequest(req, res, next) {
  try {
    const request = await service.createRequest(req.params.leadId, req.body, req.user);
    return res.status(201).json({ data: { request } });
  } catch (error) {
    return next(error);
  }
}

async function reviewRequest(req, res, next) {
  try {
    const request = await service.reviewRequest(req.params.id, req.body, req.user);
    return res.json({ data: { request } });
  } catch (error) {
    return next(error);
  }
}

async function listRequests(req, res, next) {
  try {
    const result = await service.listRequests(req.query);
    return res.json({ data: { requests: result.items }, pagination: result.pagination });
  } catch (error) {
    return next(error);
  }
}

module.exports = { assignLead, createRequest, reviewRequest, listRequests };

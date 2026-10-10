const service = require('../services/activity.service');

async function addNote(req, res, next) {
  try {
    const activity = await service.addNote(req.params.leadId, req.body.note, req.user);
    return res.status(201).json({
       data: { activity }
       });
  } catch (error) {
    return next(error);
  }
}

async function listHistory(req, res, next) {
  try {
    const result = await service.listHistory(req.params.leadId, req.query, req.user);
    return res.json({ 
      data: { activities: result.items }, 
      pagination: result.pagination
     });
  } catch (error) {
    return next(error);
  }
}

module.exports = { addNote, listHistory };

const { ROLES } = require('../constants/roles');

function accessScope(user) {
  return user.role === ROLES.ADMIN ? {} : { assignedUserId: user.id };
}

function canUpdateLead(user, lead) {
  return user.role === ROLES.ADMIN || Number(lead.assigned_user_id) === Number(user.id);
}

module.exports = { accessScope, canUpdateLead };

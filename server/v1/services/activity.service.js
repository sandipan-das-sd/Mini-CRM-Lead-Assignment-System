const activityRepository = require('../repositories/activity.repository');
const leadRepository = require('../repositories/lead.repository');
const { accessScope } = require('../policies/lead-access.policy');
const { buildPage } = require('../utils/pagination');
const AppError = require('../utils/app-error');

function present(activity) {
  return {
    id: activity.id,
    leadId: activity.lead_id,
    type: activity.type,
    message: activity.message,
    changes: activity.changes,
    actor: activity.actor_user_id
      ? { id: activity.actor_user_id, name: activity.actor_name, email: activity.actor_email }
      : null,
    createdAt: activity.created_at,
  };
}

async function ensureLeadAccess(leadId, actor, db) {
  const lead = await leadRepository.findById(leadId, accessScope(actor), db);
  if (!lead) 
    throw new AppError(
  );
  return lead;
}

async function addNote(leadId, note, actor) {
  await ensureLeadAccess(leadId, actor);
  const id = await activityRepository.create({
    leadId,
    actorId: actor.id,
    type: 'note_added',
    message: note,
  });
  return {
     id,
      leadId,
       type: 'note_added',
        message: note 
    };
}

async function listHistory(leadId, filters, actor) {
  await ensureLeadAccess(leadId, actor);
  const page = buildPage(
    await activityRepository.listByLead(leadId, filters), 
    filters.limit
  );
  return {
     ...page,
      items: page.items.map(present)
     };
}

module.exports = { addNote, listHistory };

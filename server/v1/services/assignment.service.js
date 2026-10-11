const repository = require('../repositories/assignment.repository');
const leadRepository = require('../repositories/lead.repository');
const userRepository = require('../repositories/user.repository');
const activityRepository = require('../repositories/activity.repository');
const { withTransaction } = require('../db/transaction');
const { buildPage } = require('../utils/pagination');
const { ROLES } = require('../constants/roles');
const AppError = require('../utils/app-error');
const { present: presentLead } = require('./lead.service');
const { invalidateDashboardCache } = require('./dashboard-cache.service');
const { enqueueAssignmentNotification, enqueueEmail } = require('./job-queue.service');

async function requireActiveSalesUser(id, db) {
  const user = await userRepository.findActiveById(id, db);
  if (!user || user.role !== ROLES.SALES) {
    throw new AppError(422, 'INVALID_ASSIGNEE', 'The assignee must be an active sales user');
  }
  return user;
}

async function applyAssignment(lead, toUserId, actorId, reason, db) {
  if (Number(lead.assigned_user_id) === Number(toUserId)) {
    throw new AppError(409, 'ALREADY_ASSIGNED', 'The lead is already assigned to this user');
  }
  const targetUser = await requireActiveSalesUser(toUserId, db);
  const updated = await leadRepository.assign(lead.id, lead.version, toUserId, actorId, db);
  if (!updated) {
    throw new AppError(409, 'STALE_LEAD_VERSION', 'The lead was changed; reload and retry');
  }
  await repository.closeCurrent(lead.id, db);
  await repository.createAssignment(
    {
      leadId: lead.id,
      fromUserId: lead.assigned_user_id,
      toUserId,
      actorId,
      reason,
    },
    db,
  );
  const type = lead.assigned_user_id ? 'reassigned' : 'assigned';
  await activityRepository.create(
    {
      leadId: lead.id,
      actorId,
      type,
      message: reason || null,
      changes: {
        assignment: {
          fromUserId: lead.assigned_user_id || null,
          fromUserName: lead.assigned_user_name || 'Unassigned',
          toUserId,
          toUserName: targetUser.name,
        },
      },
    },
    db,
  );
  return {
    leadId: lead.id,
    fromUserId: lead.assigned_user_id || null,
    toUserId,
    assignedBy: actorId,
    reason: reason || null,
    leadName: lead.name,
    recipientName: targetUser.name,
    recipientEmail: targetUser.email,
  };
}

async function assignLead(leadId, input, actor) {
  const result = await withTransaction(async (db) => {
    const lead = await leadRepository.findById(
      leadId,
      {},
      db,
      //Lock this lead until the current transaction commits or rolls back.
      {
        forUpdate: true,
      },
    );
    if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead was not found');
    if (Number(lead.version) !== input.version) {
      throw new AppError(409, 'STALE_LEAD_VERSION', 'The lead was changed; reload and retry');
    }
    const notification = await applyAssignment(
      lead,
      input.assignedUserId,
      actor.id,
      input.reason,
      db,
    );
    return {
      lead: presentLead(await leadRepository.findById(leadId, {}, db)),
      notification,
    };
  });
  await invalidateDashboardCache();
  await enqueueAssignmentNotification(result.notification);
  return result.lead;
}

async function createRequest(leadId, input, actor) {
  const result = await withTransaction(async (db) => {
    const lead = await leadRepository.findById(leadId, { assignedUserId: actor.id }, db);
    if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead was not found');
    if (input.requestedToUserId) {
      if (Number(input.requestedToUserId) === Number(actor.id)) {
        throw new AppError(422, 'INVALID_ASSIGNEE', 'Choose a different sales user');
      }
      await requireActiveSalesUser(input.requestedToUserId, db);
    }
    if (await repository.findPendingRequest(leadId, actor.id, db)) {
      throw new AppError(
        409,
        'REQUEST_ALREADY_PENDING',
        'A reassignment request is already pending',
      );
    }
    const request = await repository.createRequest(
      {
        leadId,
        requestedBy: actor.id,
        requestedTo: input.requestedToUserId,
        reason: input.reason,
      },
      db,
    );
    const adminEmails = await userRepository.listActiveAdminEmails(db);
    return { request, adminEmails, leadName: lead.name };
  });
  await enqueueEmail({
    to: result.adminEmails,
    template: 'reassignmentRequested',
    data: {
      requesterName: actor.name,
      leadName: result.leadName,
      reason: input.reason,
    },
  });
  return result.request;
}

async function reviewRequest(id, input, actor) {
  const result = await withTransaction(async (db) => {
    const request = await repository.findRequestById(id, db, { forUpdate: true });
    if (!request)
      throw new AppError(404, 'REQUEST_NOT_FOUND', 'Reassignment request was not found');
    if (request.status !== 'pending') {
      throw new AppError(409, 'REQUEST_ALREADY_REVIEWED', 'This request has already been reviewed');
    }

    let notification = null;
    let leadName;
    if (input.decision === 'approved') {
      const lead = await leadRepository.findById(request.lead_id, {}, db, { forUpdate: true });
      if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead was not found');
      leadName = lead.name;
      if (Number(lead.assigned_user_id) !== Number(request.requested_by)) {
        throw new AppError(
          409,
          'STALE_REQUEST',
          'Lead ownership changed after this request was created',
        );
      }
      const targetId = input.assignedUserId || request.requested_to;
      if (!targetId) {
        throw new AppError(
          422,
          'ASSIGNEE_REQUIRED',
          'An assignee is required to approve this request',
        );
      }
      notification = await applyAssignment(lead, targetId, actor.id, request.reason, db);
    }

    const reviewed = await repository.reviewRequest(id, input.decision, actor.id, db);
    if (!reviewed) throw new AppError(409, 'REQUEST_ALREADY_REVIEWED', 'Request state changed');
    const requester = await userRepository.findById(request.requested_by, db);
    if (!leadName) {
      const relatedLead = await leadRepository.findById(request.lead_id, {}, db);
      leadName = relatedLead?.name;
    }
    return {
      request: await repository.findRequestById(id, db),
      notification,
      requester,
      leadName: leadName || `Lead #${request.lead_id}`,
    };
  });
  if (result.notification) {
    await invalidateDashboardCache();
    await enqueueAssignmentNotification(result.notification);
  }
  await enqueueEmail({
    to: result.requester?.email,
    template: 'reassignmentReviewed',
    data: {
      requesterName: result.requester?.name || 'Sales user',
      leadName: result.leadName,
      decision: input.decision,
    },
  });
  return result.request;
}

async function listRequests(filters) {
  const page = buildPage(await repository.listRequests(filters), filters.limit);
  return { ...page, items: page.items.map(presentRequest) };
}

function presentRequest(request) {
  return {
    id: request.id,
    lead: { id: request.lead_id, name: request.lead_name },
    requestedBy: { id: request.requested_by, name: request.requester_name },
    requestedTo: request.requested_to
      ? { id: request.requested_to, name: request.requested_to_name }
      : null,
    reason: request.reason,
    status: request.status,
    reviewedBy: request.reviewed_by
      ? { id: request.reviewed_by, name: request.reviewer_name }
      : null,
    reviewedAt: request.reviewed_at,
    createdAt: request.created_at,
  };
}

module.exports = { assignLead, createRequest, reviewRequest, listRequests };

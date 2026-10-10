const leadRepository = require('../repositories/lead.repository');
const activityRepository = require('../repositories/activity.repository');
const idempotency = require('./idempotency.service');
const { withTransaction } = require('../db/transaction');
const { normalizeEmail, normalizePhone } = require('../utils/normalize-contact');
const { buildPage } = require('../utils/pagination');
const { accessScope, canUpdateLead } = require('../policies/lead-access.policy');
const AppError = require('../utils/app-error');

function present(lead) {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
    status: lead.status,
    assignedUser: lead.assigned_user_id
      ? {
          id: lead.assigned_user_id,
          name: lead.assigned_user_name,
          email: lead.assigned_user_email,
        }
      : null,
    version: lead.version,
    createdBy: lead.created_by,
    updatedBy: lead.updated_by,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  };
}

function normalizeInput(input) {
  const normalized = { ...input };
  if ('phone' in input) {
    normalized.phone = normalizePhone(input.phone);
    if (input.phone && !normalized.phone) {
      throw new AppError(422, 'INVALID_PHONE', 'Phone must contain between 7 and 15 digits');
    }
  }
  if ('email' in input) normalized.email = normalizeEmail(input.email);
  return normalized;
}

function duplicateError(matches, phone, email) {
  if (!matches.length) return null;
  const ids = [...new Set(matches.map((lead) => String(lead.id)))];
  const code = ids.length > 1 ? 'CONTACT_CONFLICT' : 'DUPLICATE_LEAD';
  const message =
    ids.length > 1
      ? 'Phone and email belong to different leads; manual resolution is required'
      : 'A lead with this phone or email already exists';
  return new AppError(409, code, message, {
    conflictingLeadIds: ids,
    phoneMatched: Boolean(phone && matches.some((lead) => lead.phone === phone)),
    emailMatched: Boolean(email && matches.some((lead) => lead.email === email)),
  });
}

async function createLead(input, actor, idempotencyKey) {
  const normalized = normalizeInput(input);
  try {
    return await withTransaction(async (db) => {
      const state = await idempotency.reserve(
        {
          userId: actor.id,
          operation: 'create-lead',
          key: idempotencyKey,
          payload: normalized,
        },
        db,
      );
      if (state.replay) return { statusCode: state.statusCode, body: state.body };

      const matches = await leadRepository.findDuplicates(normalized, db);
      const conflict = duplicateError(matches, normalized.phone, normalized.email);
      if (conflict) throw conflict;

      const lead = await leadRepository.create({ ...normalized, actorId: actor.id }, db);
      await activityRepository.create(
        { leadId: lead.id, actorId: actor.id, type: 'created', changes: { after: normalized } },
        db,
      );
      const body = { data: { lead: present(lead) } };
      await idempotency.complete(
        {
          userId: actor.id,
          operation: 'create-lead',
          key: idempotencyKey,
          statusCode: 201,
          responseBody: body,
        },
        db,
      );
      return { statusCode: 201, body };
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError(
        409,
        'DUPLICATE_LEAD',
        'A lead with this phone, email, or request key already exists',
      );
    }
    throw error;
  }
}

async function listLeads(filters, actor) {
  const page = buildPage(await leadRepository.list(filters, accessScope(actor)), filters.limit);
  return { ...page, items: page.items.map(present) };
}

async function getLead(id, actor) {
  const lead = await leadRepository.findById(id, accessScope(actor));
  if (!lead) throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead was not found');
  return present(lead);
}

async function updateLead(id, input, actor) {
  const { version, ...requestedChanges } = input;
  const normalizedChanges = normalizeInput(requestedChanges);
  try {
    return await withTransaction(async (db) => {
      const lead = await leadRepository.findById(id, accessScope(actor), db);
      if (!lead || !canUpdateLead(actor, lead)) {
        throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead was not found');
      }
      if (Number(lead.version) !== version) {
        throw new AppError(
          409,
          'STALE_LEAD_VERSION',
          'The lead was changed by another request; reload and retry',
        );
      }

      const resultingPhone = 'phone' in normalizedChanges ? normalizedChanges.phone : lead.phone;
      const resultingEmail = 'email' in normalizedChanges ? normalizedChanges.email : lead.email;
      if (!resultingPhone && !resultingEmail) {
        throw new AppError(422, 'CONTACT_REQUIRED', 'A lead must retain a phone or email');
      }
      const matches = await leadRepository.findDuplicates(
        { phone: resultingPhone, email: resultingEmail, excludeId: id },
        db,
      );
      const conflict = duplicateError(matches, resultingPhone, resultingEmail);
      if (conflict) throw conflict;

      const actualChanges = {};
      for (const [field, value] of Object.entries(normalizedChanges)) {
        if ((lead[field] ?? null) !== (value ?? null)) {
          actualChanges[field] = { from: lead[field] ?? null, to: value ?? null };
        }
      }
      if (!Object.keys(actualChanges).length) return present(lead);

      const updated = await leadRepository.update(id, version, normalizedChanges, actor.id, db);
      if (!updated) {
        throw new AppError(
          409,
          'STALE_LEAD_VERSION',
          'The lead was changed by another request; reload and retry',
        );
      }
      await activityRepository.create(
        { leadId: id, actorId: actor.id, type: 'updated', changes: actualChanges },
        db,
      );
      return present(await leadRepository.findById(id, accessScope(actor), db));
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'DUPLICATE_LEAD', 'A lead with this phone or email already exists');
    }
    throw error;
  }
}

module.exports = { createLead, listLeads, getLead, updateLead };

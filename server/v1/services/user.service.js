const repository = require('../repositories/user.repository');
const { hashPassword } = require('../utils/password');
const { buildPage } = require('../utils/pagination');
const { withTransaction } = require('../db/transaction');
const { ROLES } = require('../constants/roles');
const AppError = require('../utils/app-error');

function present(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.is_active),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

async function createSalesUser(input) {
  try {
    const user = await repository.create({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: ROLES.SALES,
    });
    return present(user);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'A user with this email already exists');
    }
    throw error;
  }
}

async function listUsers(filters) {
  const page = buildPage(await repository.list(filters), filters.limit);
  return {
    ...page,
    items: page.items.map(present),
  };
}

async function getUser(id) {
  const user = await repository.findById(id);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User was not found');
  return present(user);
}

async function updateStatus(id, isActive, actorId) {
  if (id === actorId && !isActive) {
    throw new AppError(409, 'CANNOT_DEACTIVATE_SELF', 'You cannot deactivate your own account');
  }
  return withTransaction(async (db) => {
    const user = await repository.findById(id, db, { forUpdate: true });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User was not found');
    if (Boolean(user.is_active) === isActive) return present(user);

    if (!isActive) {
      const assignedLeadCount = await repository.countAssignedLeads(id, db);
      if (assignedLeadCount > 0) {
        throw new AppError(
          409,
          'USER_HAS_ASSIGNED_LEADS',
          'Reassign this user’s active leads before deactivation',
          { assignedLeadCount },
        );
      }
    }
    return present(await repository.setActive(id, isActive, db));
  });
}

module.exports = { createSalesUser, listUsers, getUser, updateStatus };

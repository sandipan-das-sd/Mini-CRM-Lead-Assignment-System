const repository = require('../repositories/notification.repository');
const { emitToUser } = require('../realtime/socket');
const AppError = require('../utils/app-error');

function present(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    leadId: row.lead_id,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

async function createAndSend(input) {
  const notification = present(await repository.create(input));
  emitToUser(input.userId, notification);
  return notification;
}

async function createForUsers(userIds, input) {
  return Promise.all(
    [...new Set(userIds.map(Number))].map((userId) => createAndSend({ ...input, userId })),
  );
}

async function list(userId) {
  return (await repository.list(userId, 50)).map(present);
}
async function markRead(id, userId) {
  if (!(await repository.markRead(id, userId)))
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification was not found');
}
async function markAllRead(userId) {
  await repository.markAllRead(userId);
}

module.exports = { createAndSend, createForUsers, list, markRead, markAllRead };

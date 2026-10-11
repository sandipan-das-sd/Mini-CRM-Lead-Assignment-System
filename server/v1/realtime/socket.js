const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/token');
const userRepository = require('../repositories/user.repository');
const env = require('../config/env');

let io;

function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = verifyAccessToken(token);
      const user = await userRepository.findActiveById(payload.sub);
      if (!user || Number(user.token_version) !== Number(payload.tokenVersion)) {
        return next(new Error('Authentication failed'));
      }
      socket.userId = String(user.id);
      return next();
    } catch {
      return next(new Error('Authentication failed'));
    }
  });
  io.on('connection', (socket) => socket.join(`user:${socket.userId}`));
  return io;
}

function emitToUser(userId, notification) {
  if (io) io.to(`user:${userId}`).emit('notification:new', notification);
}

module.exports = { initializeSocket, emitToUser };

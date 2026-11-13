const { verifyToken } = require('../utils/jwtHelper');
const userRepository = require('../repositories/userRepository');
const logger = require('../utils/logger');

const socketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization &&
        socket.handshake.headers.authorization.split(' ')[1]);

    if (!token) {
      logger.warn(`Socket connection rejected: No authentication token provided. Socket ID: ${socket.id}`);
      return next(new Error('Authentication error: Token required'));
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      logger.warn(`Socket connection rejected: Invalid or expired token. Socket ID: ${socket.id}`);
      return next(new Error('Authentication error: Invalid or expired token'));
    }

    const user = await userRepository.findById(decoded.id);

    if (!user || !user.is_active) {
      logger.warn(`Socket connection rejected: User ${decoded.id} not found or inactive`);
      return next(new Error('Authentication error: User inactive or not found'));
    }

    // Attach user information to socket
    socket.user = {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role ? (user.role.name || user.role) : 'student',
      college_id: user.college_id,
      department_id:
        user.student_profile?.department_id || user.faculty_profile?.department_id || null,
      batch_id: user.student_profile?.batch_id || null,
      avatar_url: user.avatar_url
    };

    next();
  } catch (error) {
    logger.error('Socket authentication exception:', error);
    next(new Error('Internal server error during socket authentication'));
  }
};

module.exports = socketAuth;

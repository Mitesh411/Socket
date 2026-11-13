const { verifyToken } = require('../utils/jwtHelper');
const ApiResponse = require('../utils/apiResponse');
const userRepository = require('../repositories/userRepository');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Authorization token missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return ApiResponse.unauthorized(res, 'Invalid or expired token');
    }

    const user = await userRepository.findById(decoded.id);

    if (!user || !user.is_active) {
      return ApiResponse.unauthorized(res, 'User not found or account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
};

module.exports = authenticate;

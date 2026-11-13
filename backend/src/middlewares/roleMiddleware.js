const ApiResponse = require('../utils/apiResponse');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    const userRole = req.user.role.name;
    if (!allowedRoles.includes(userRole)) {
      return ApiResponse.forbidden(
        res,
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`
      );
    }

    next();
  };
};

module.exports = authorize;

const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // ✅ Get the user's role from the database
      const User = require('../models/User');
      const user = await User.findOne({ firebaseUid: req.user.uid });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // ✅ Check if the user's role is allowed
      if (!allowedRoles.includes(user.role)) {
        console.log(`❌ User role "${user.role}" not in allowed roles:`, allowedRoles);
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action',
        });
      }

      // ✅ Attach the user document to the request for later use
      req.userDoc = user;
      next();
    } catch (error) {
      console.error('❌ [checkRole] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying permissions',
      });
    }
  };
};

module.exports = { checkRole };
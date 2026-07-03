// backend/controllers/authController.js
exports.register = async (req, res) => {
  try {
    console.log('📝 ===== REGISTER REQUEST =====');
    console.log('📝 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📝 Body:', JSON.stringify(req.body, null, 2));
    console.log('📝 User object:', req.user);
    console.log('📝 User UID:', req.user?.uid);

    const { email, name, role = USER_ROLES.VIEWER, phone, location } = req.body;
    const firebaseUid = req.user?.uid;

    // Log what we're about to do
    console.log('📝 Creating user with:', {
      firebaseUid,
      email,
      name,
      role,
      phone,
      location
    });

    if (!firebaseUid) {
      console.error('❌ No Firebase UID found in request');
      return sendError(res, 401, 'Unauthorized - Invalid Firebase Token');
    }

    // Check if user already exists
    console.log('🔍 Checking if user exists with firebaseUid:', firebaseUid);
    let user = await User.findOne({ firebaseUid });
    console.log('🔍 User found:', user ? 'YES' : 'NO');

    if (user) {
      console.log('✅ User already exists:', user._id);
      return sendResponse(res, 200, true, 'User already registered', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Create new user
    console.log('📝 Creating new user in MongoDB...');
    user = await User.create({
      firebaseUid,
      email,
      name,
      role,
      phone: phone || '',
      location: location || {},
      isVerified: req.user.email_verified || false,
    });
    console.log('✅ User created successfully:', user._id);
    console.log('✅ User data:', JSON.stringify(user, null, 2));

    return sendResponse(res, 201, true, 'User registered successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });

  } catch (error) {
    console.error('❌ ===== REGISTER ERROR =====');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    
    // Check for specific MongoDB errors
    if (error.code === 11000) {
      console.error('❌ Duplicate key error! User might already exist.');
    }
    
    return sendError(res, 500, error.message || 'Registration failed');
  }
};
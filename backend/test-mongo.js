// backend/test-mongo.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const testMongoDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('📁 URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get database info
    const db = mongoose.connection.db;
    console.log('📁 Database name:', db.databaseName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📊 Collections:', collections.map(c => c.name));
    
    // Check if users collection exists
    const usersCollection = collections.find(c => c.name === 'users');
    if (usersCollection) {
      console.log('✅ "users" collection exists');
      const count = await User.countDocuments();
      console.log('👤 Users in database:', count);
      
      if (count > 0) {
        const users = await User.find().limit(3);
        console.log('📝 Sample users:', users.map(u => ({
          id: u._id,
          email: u.email,
          name: u.name,
          role: u.role
        })));
      }
    } else {
      console.log('⚠️ "users" collection does NOT exist yet');
      console.log('📝 It will be created when you save the first user');
    }
    
    // Try to create a test user
    console.log('\n🧪 Creating test user...');
    const testUser = new User({
      firebaseUid: 'test_uid_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      name: 'Test User',
      role: 'viewer',
      phone: '1234567890',
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('📝 User ID:', testUser._id);
    console.log('📝 User email:', testUser.email);
    
    // Verify it was saved
    const newCount = await User.countDocuments();
    console.log('👤 Total users after test:', newCount);
    
    // Clean up - delete the test user
    await User.deleteOne({ _id: testUser._id });
    console.log('🧹 Test user deleted');
    
    console.log('\n✅ Test completed successfully!');
    console.log('📌 Users collection is working properly.');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ ===== ERROR =====');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Full error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('📌 Tip: Make sure your IP is whitelisted in MongoDB Atlas');
      console.log('📌 Go to: MongoDB Atlas → Network Access → Add IP Address');
    }
    
    if (error.code === 11000) {
      console.log('📌 Tip: Duplicate key error - user already exists');
    }
  }
};

testMongoDB();
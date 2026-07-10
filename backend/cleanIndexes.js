// cleanIndexes.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const cleanIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('✅ Connected to MongoDB');
    
    // Get all indexes
    const indexes = await mongoose.connection.db.collection('likes').indexes();
    console.log('📊 Current indexes:', indexes.map(i => i.name));
    
    // Drop all indexes except _id_
    for (const idx of indexes) {
      if (idx.name !== '_id_') {
        try {
          await mongoose.connection.db.collection('likes').dropIndex(idx.name);
          console.log(`✅ Dropped index: ${idx.name}`);
        } catch (err) {
          console.log(`⚠️ Could not drop ${idx.name}:`, err.message);
        }
      }
    }
    
    // Verify
    const remaining = await mongoose.connection.db.collection('likes').getIndexes();
    console.log('📊 Remaining indexes:', remaining.map(i => i.name));
    
    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

cleanIndexes();
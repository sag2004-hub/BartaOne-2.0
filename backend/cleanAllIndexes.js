// cleanAllIndexes.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const cleanAllIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('✅ Connected to MongoDB');
    
    const collection = mongoose.connection.db.collection('likes');
    
    // Get all indexes
    const indexes = await collection.listIndexes().toArray();
    console.log('📊 Current indexes:', indexes.map(i => i.name));
    
    // Keep only _id_ and compound unique indexes
    const keepIndexes = ['_id_', 'userId_1_articleId_1', 'userId_1_videoId_1', 'userId_1_commentId_1'];
    
    // Drop all indexes except the ones we want to keep
    for (const idx of indexes) {
      if (!keepIndexes.includes(idx.name)) {
        try {
          await collection.dropIndex(idx.name);
          console.log(`✅ Dropped index: ${idx.name}`);
        } catch (err) {
          console.log(`⚠️ Could not drop ${idx.name}:`, err.message);
        }
      }
    }
    
    // Verify remaining indexes
    const remaining = await collection.listIndexes().toArray();
    console.log('📊 Remaining indexes:', remaining.map(i => i.name));
    
    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

cleanAllIndexes();
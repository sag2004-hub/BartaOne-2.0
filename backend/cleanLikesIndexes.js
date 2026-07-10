const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const cleanIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('✅ Connected to MongoDB');
    
    const collection = mongoose.connection.db.collection('likes');
    
    // Get all indexes
    const indexes = await collection.listIndexes().toArray();
    console.log('📊 Current indexes:', indexes.map(i => i.name));
    
    // Drop problematic indexes
    const indexesToDrop = [
      'userId_1_commentId_1',
      'userId_1_articleId_1', 
      'userId_1_videoId_1',
      'userId_1',
      'articleId_1',
      'videoId_1',
      'commentId_1',
      'userId_1_liveId_1',
      'liveId_1'
    ];
    
    for (const idxName of indexesToDrop) {
      try {
        await collection.dropIndex(idxName);
        console.log(`✅ Dropped index: ${idxName}`);
      } catch (err) {
        if (err.code === 27) {
          console.log(`ℹ️ Index ${idxName} does not exist`);
        } else {
          console.log(`⚠️ Error dropping ${idxName}:`, err.message);
        }
      }
    }
    
    // Verify remaining indexes
    const remaining = await collection.listIndexes().toArray();
    console.log('📊 Remaining indexes:', remaining.map(i => i.name));
    
    // Only _id_ should remain
    if (remaining.length === 1 && remaining[0].name === '_id_') {
      console.log('✅ All indexes cleaned successfully!');
    } else {
      console.log('⚠️ Some indexes still remain. Please check manually.');
    }
    
    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

cleanIndexes();

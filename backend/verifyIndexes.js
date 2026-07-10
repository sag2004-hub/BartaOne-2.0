// verifyIndexes.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const verifyIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('✅ Connected to MongoDB');
    
    // Get all indexes using listIndexes
    const indexes = await mongoose.connection.db.collection('likes').listIndexes().toArray();
    console.log('📊 Current indexes:', indexes.map(i => i.name));
    
    if (indexes.length === 1 && indexes[0].name === '_id_') {
      console.log('✅ All indexes cleaned successfully! Only _id_ remains.');
    } else {
      console.log('⚠️ Some indexes still remain:', indexes.map(i => i.name));
    }
    
    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

verifyIndexes();
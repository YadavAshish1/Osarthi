import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/osarthi';

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected');

    try {
      const Content = (await import('../models/Content.js')).default;
      await Content.collection.dropIndex('topicRef_1');
      console.log('Dropped legacy unique index on content.topicRef (multiple posts per topic enabled)');
    } catch {
      /* index may not exist */
    }
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    console.error('Check MONGODB_URI in backend/.env (encode @ in password as %40)');
    process.exit(1);
  }
}

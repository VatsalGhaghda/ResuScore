import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI || '';

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('🔗 Connecting to MongoDB...');
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        console.log('📊 Database:', mongoose.connection.db?.databaseName);
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error details:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.message.includes('authentication')) {
          console.error('💡 Tip: Check your username and password in the connection string');
        }
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
          console.error('💡 Tip: Check your cluster URL in the connection string');
        }
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

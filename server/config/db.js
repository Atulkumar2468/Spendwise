import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let isConnected = false;
let dbType = 'none';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log('Attempting connection to MongoDB Atlas...');
      // Set short server selection timeout so fallback triggers promptly if Atlas IP is blocked
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      dbType = 'MongoDB Atlas';
      console.log(`Connected to MongoDB Atlas: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`MongoDB Atlas connection error: ${err.message}`);
      console.log('Falling back to in-memory MongoDB instance for seamless local persistence...');
    }
  }

  try {
    const mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    const conn = await mongoose.connect(memUri);
    isConnected = true;
    dbType = 'In-Memory MongoDB (Resilient Dev)';
    console.log(`Connected to In-Memory MongoDB: ${conn.connection.host}`);
  } catch (memErr) {
    isConnected = false;
    dbType = 'failed';
    console.error(`Database connection failed: ${memErr.message}`);
  }
};

export const getDBStatus = () => ({
  connected: isConnected && mongoose.connection.readyState === 1,
  dbType,
  host: mongoose.connection.host || 'none',
  readyState: mongoose.connection.readyState
});

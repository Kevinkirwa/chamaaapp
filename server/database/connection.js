import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    // Check if MONGODB_URI is configured
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not configured');
    }

    // Validate the connection string format
    if (!process.env.MONGODB_URI.includes('mongodb+srv://') && !process.env.MONGODB_URI.includes('mongodb://')) {
      throw new Error('Invalid MongoDB connection string format');
    }

    console.log('🔗 Connection string configured, attempting connection...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Use only supported options for current MongoDB driver
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      // Remove bufferMaxEntries - not supported in current driver
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`📊 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Listen for connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📴 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed!');
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('MONGODB_URI')) {
      console.error('💡 Please configure your MongoDB Atlas connection string in the .env file');
      console.error('💡 Format: mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database');
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Check your MongoDB Atlas username and password');
    } else if (error.message.includes('network')) {
      console.error('💡 Check your internet connection and MongoDB Atlas network access');
    } else if (error.message.includes('buffermaxentries')) {
      console.error('💡 MongoDB driver configuration issue - this has been fixed');
    }
    
    console.error('💡 Full error details:', error);
    process.exit(1);
  }
};

export default connectDB;
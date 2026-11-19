import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGODB_URI || process.env.MONGO_URL;
    
    if (!mongoURL) {
      throw new Error('Neither MONGODB_URI nor MONGO_URL environment variable is set');
    }

    const options = {};

    if (process.env.DB_NAME) {
      options.dbName = process.env.DB_NAME;
    }

    // AWS DocumentDB configuration
    const isDocDB = process.env.USE_DOCUMENTDB === 'true' || 
                    mongoURL.includes('docdb.amazonaws.com') ||
                    mongoURL.includes('tls=true');

    if (isDocDB) {
      // AWS DocumentDB requires TLS with AWS CA Bundle
      const caFilePath = process.env.DOCUMENTDB_CA_PATH || 
        path.resolve(__dirname, '..', 'certs', 'global-bundle.pem');
      
      if (fs.existsSync(caFilePath)) {
        options.tls = true;
        options.tlsCAFile = caFilePath;
      } else {
        console.warn(`Warning: CA certificate not found at ${caFilePath}. TLS may fail.`);
        options.tls = true;
      }

      // DocumentDB compatibility requirements
      options.retryWrites = false;
      
      if (process.env.DOCUMENTDB_DIRECT_CONNECTION === 'true') {
        options.directConnection = true;
      }
    }

    await mongoose.connect(mongoURL, options);
    console.log('Database connected successfully');
    
    // Log connection type safely without exposing credentials
    if (isDocDB) {
      console.log('Connected to AWS DocumentDB (TLS enabled, retryWrites=false)');
    } else {
      console.log('Connected to MongoDB');
    }
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;

import mongoose from 'mongoose';
import { env } from './env';

/**
 * Connect to MongoDB. Single responsibility — no schema/model logic here.
 */
export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  // eslint-disable-next-line no-console
  console.log(`[db] connected to ${env.mongoUri}`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

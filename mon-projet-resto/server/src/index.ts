import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[boot] MongoDB connection failed — starting API in degraded mode:', err);
  }

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

void bootstrap();

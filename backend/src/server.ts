import { createApp } from './app';
import { env } from './config/env';
import { logDebug } from './common/utils/logger';

const app = createApp();

app.listen(env.port, () => {
  logDebug(`Backend running on port ${env.port}`);
});

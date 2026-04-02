import morgan from 'morgan';
import { env } from '../../config/env';

export const requestLogger = morgan(env.nodeEnv === 'production' ? 'combined' : 'dev');

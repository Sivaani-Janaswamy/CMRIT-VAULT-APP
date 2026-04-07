import { setTimeout as delay } from 'node:timers/promises';

import { env } from '../../config/env';

interface RetryOptions {
  retries?: number;
  timeoutMs?: number;
  baseDelayMs?: number;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function withRetryAndTimeout<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = options.retries ?? env.retryCount;
  const timeoutMs = options.timeoutMs ?? env.requestTimeoutMs;
  const baseDelayMs = options.baseDelayMs ?? env.retryBaseDelayMs;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await withTimeout(operation(), timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      const backoff = baseDelayMs * Math.pow(2, attempt);
      await delay(backoff);
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Operation failed');
}

import assert from 'node:assert/strict';
import express from 'express';
import { afterEach, beforeEach, test } from 'node:test';

import { errorHandler } from '../src/common/middleware/errorHandler';
import { supabaseServiceClient } from '../src/integrations/supabase/client';
import { authRepository } from '../src/modules/auth/auth.repository';
import { authRouter } from '../src/modules/auth/auth.routes';

type AuthStubs = {
  getUser: typeof supabaseServiceClient.auth.getUser;
  upsertFromAuthUser: typeof authRepository.upsertFromAuthUser;
};

const originalAuthMethods: AuthStubs = {
  getUser: supabaseServiceClient.auth.getUser.bind(supabaseServiceClient.auth),
  upsertFromAuthUser: authRepository.upsertFromAuthUser.bind(authRepository)
};

function restoreAuthMocks() {
  supabaseServiceClient.auth.getUser = originalAuthMethods.getUser;
  authRepository.upsertFromAuthUser = originalAuthMethods.upsertFromAuthUser;
}

beforeEach(() => {
  restoreAuthMocks();
});

afterEach(() => {
  restoreAuthMocks();
});

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/v1/auth', authRouter);
  app.use(errorHandler);
  return app;
}

async function request(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return { response, json };
}

async function withServer<T>(app: express.Express, handler: (baseUrl: string) => Promise<T>) {
  const server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once('listening', () => resolve());
  });

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to start test server');
    }

    return await handler(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
}

test('POST /v1/auth/sync returns 200 for valid bearer token', async () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  supabaseServiceClient.auth.getUser = async () => ({
    data: {
      user: {
        id: userId,
        email: 'faculty@example.com',
        user_metadata: {
          full_name: 'Faculty User',
          role: 'faculty'
        }
      }
    },
    error: null
  }) as never;

  authRepository.upsertFromAuthUser = async (user) => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: 'faculty'
  });

  await withServer(createApp(), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/auth/sync', {
      method: 'POST',
      body: {},
      headers: {
        authorization: 'Bearer valid-token'
      }
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.user.id, userId);
    assert.equal(json.data.user.role, 'faculty');
  });
});

test('POST /v1/auth/sync returns 401 for invalid bearer token', async () => {
  supabaseServiceClient.auth.getUser = async () => ({
    data: {
      user: null
    },
    error: {
      message: 'Invalid JWT'
    }
  }) as never;

  await withServer(createApp(), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/auth/sync', {
      method: 'POST',
      body: {},
      headers: {
        authorization: 'Bearer invalid-token'
      }
    });

    assert.equal(response.status, 401);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'UNAUTHORIZED');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { truncateForTests } from './helpers/db';
import { requestApp } from './helpers/request';
import { createTestUser, TEST_USER_PASSWORD } from './helpers/auth';

beforeEach(async () => {
  await truncateForTests();
});

describe('Auth - Register', () => {
  it('registers a user successfully', async () => {
    const res = await requestApp()
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: TEST_USER_PASSWORD,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('returns 409 when email already exists', async () => {
    await createTestUser({ email: 'duplicate@example.com' });

    const res = await requestApp()
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'duplicate@example.com',
        password: TEST_USER_PASSWORD,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid payload', async () => {
    const res = await requestApp()
      .post('/auth/register')
      .send({
        name: '',
        email: 'invalid',
        password: '123',
      });

    expect(res.status).toBe(400);
  });
});

describe('Auth - Login', () => {
  it('logs in successfully with correct credentials', async () => {
    const { user, plainPassword } = await createTestUser();

    const res = await requestApp()
      .post('/auth/login')
      .send({
        email: user.email,
        password: plainPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('returns 401 when password is incorrect', async () => {
    const { user } = await createTestUser();

    const res = await requestApp()
      .post('/auth/login')
      .send({
        email: user.email,
        password: 'wrong-password',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when user does not exist', async () => {
    const res = await requestApp()
      .post('/auth/login')
      .send({
        email: 'notfound@example.com',
        password: 'password',
      });

    expect(res.status).toBe(401);
  });

  it('rate limit retorna 429', async () => {
    const payload = {
      email: 'rate@test.com',
      password: 'wrongpassword',
    };

    for (let i = 0; i < 20; i++) {
      await requestApp().post('/auth/login').send(payload);
    }

    const res = await requestApp().post('/auth/login').send(payload);

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });
});

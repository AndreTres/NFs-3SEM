import { describe, it, expect, beforeEach } from 'vitest';
import { truncateForTests } from './helpers/db';
import { createTestUser, signToken, getAuthHeader } from './helpers/auth';
import { createTestInvoice } from './helpers/invoices';
import { requestApp } from './helpers/request';

beforeEach(async () => {
  await truncateForTests();
});

describe('Security - Authentication', () => {
  it('should return 401 when accessing protected route without token', async () => {
    const res = await requestApp().get('/invoices');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when token is invalid', async () => {
    const res = await requestApp()
      .get('/invoices')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should allow access with valid token', async () => {
    const { user } = await createTestUser();
    const token = signToken(user.id, user.email);

    const res = await requestApp()
      .get('/invoices')
      .set(getAuthHeader(token));

    expect(res.status).toBe(200);
  });

  it('user should only see their own invoices', async () => {
    const { user: userA } = await createTestUser({ email: 'userA@test.com' });
    const { user: userB } = await createTestUser({ email: 'userB@test.com' });

    await createTestInvoice(userA.id, { number: 'INV-A-1' });
    await createTestInvoice(userA.id, { number: 'INV-A-2' });
    await createTestInvoice(userB.id, { number: 'INV-B-1' });

    const token = signToken(userA.id, userA.email);

    const res = await requestApp()
      .get('/invoices')
      .set(getAuthHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((inv: { userId: string }) => inv.userId === userA.id)).toBe(true);
  });

  it('user should not access invoice from another user', async () => {
    const { user: userA } = await createTestUser({ email: 'user-a@example.com' });
    const { user: userB } = await createTestUser({ email: 'user-b@example.com' });

    const invoiceB = await createTestInvoice(userB.id);

    const tokenA = signToken(userA.id, userA.email);

    const res = await requestApp()
      .get(`/invoices/${invoiceB.id}`)
      .set(getAuthHeader(tokenA));

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

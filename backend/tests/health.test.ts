import { describe, it, expect } from 'vitest';
import { requestApp } from './helpers/request';

describe('Health endpoint', () => {
  it('returns 200 when API is healthy', async () => {
    const res = await requestApp().get('/health');

    expect(res.status).toBe(200);
  });

  it('returns body with status ok', async () => {
    const res = await requestApp().get('/health');

    expect(res.body).toEqual({ status: 'ok' });
  });
});

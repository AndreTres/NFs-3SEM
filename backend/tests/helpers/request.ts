import request from 'supertest';
import app from '../../src/app';

/**
 * Retorna o cliente Supertest apontando para o app Express.
 * Uso: requestApp().get('/health').expect(200)
 */
export function requestApp(): ReturnType<typeof request> {
  return request(app);
}

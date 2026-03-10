import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { prisma } from './db';
import type { User } from '@prisma/client';

/** Senha padrão usada em createTestUser. Use para login nos testes. */
export const TEST_USER_PASSWORD = 'password123';

export type CreateTestUserOverrides = {
  name?: string;
  email?: string;
  password?: string;
};

/**
 * Cria um usuário de teste no banco com senha hasheada (bcrypt).
 * Retorna o usuário criado. A senha em texto é TEST_USER_PASSWORD ou a passada em overrides.
 *
 * @param overrides - Campos opcionais para sobrescrever (name, email, password em texto)
 * @returns Usuário criado e senha em texto (para uso em login)
 */
export async function createTestUser(
  overrides: CreateTestUserOverrides = {}
): Promise<{ user: User; plainPassword: string }> {
  const plainPassword = overrides.password ?? TEST_USER_PASSWORD;
  const hashedPassword = await bcrypt.hash(plainPassword, env.bcryptRounds);

  const user = await prisma.user.create({
    data: {
      name: overrides.name ?? 'Test User',
      email: overrides.email ?? `test-${Date.now()}@example.com`,
      password: hashedPassword,
    },
  });

  return { user, plainPassword };
}

/**
 * Gera um token JWT com o mesmo secret e expiração da aplicação.
 * Útil para testes que precisam de usuário autenticado sem chamar POST /auth/login.
 */
export function signToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

/**
 * Retorna o header Authorization no formato esperado pelo authMiddleware.
 */
export function getAuthHeader(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Cria um usuário de teste e retorna usuário, token e headers de autenticação.
 * Reduz boilerplate em testes que precisam de um usuário autenticado.
 */
export async function createAuthenticatedUser(): Promise<{
  user: User;
  token: string;
  headers: { Authorization: string };
}> {
  const { user } = await createTestUser();
  const token = signToken(user.id, user.email);
  const headers = getAuthHeader(token);
  return { user, token, headers };
}

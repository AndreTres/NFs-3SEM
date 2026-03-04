import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import type { RegisterInput } from '../schemas/auth.schema';
import type { LoginInput } from '../schemas/login.schema';

export type UserWithoutPassword = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function register(
  input: RegisterInput
): Promise<UserWithoutPassword> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    const err = new Error('Email already registered') as Error & {
      statusCode?: number;
    };
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(
    input.password,
    env.bcryptRounds
  );

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
    },
  });

  const { password: _password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function login(input: LoginInput): Promise<{ token: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    const err = new Error('Invalid credentials') as Error & {
      statusCode?: number;
    };
    err.statusCode = 401;
    throw err;
  }

  const match = await bcrypt.compare(input.password, user.password);

  if (!match) {
    const err = new Error('Invalid credentials') as Error & {
      statusCode?: number;
    };
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return { token };
}

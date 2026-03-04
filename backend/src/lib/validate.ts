import { ZodSchema } from 'zod';

export function validateSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ');

    const error = new Error(message) as Error & { statusCode?: number };
    error.statusCode = 400;

    throw error;
  }

  return result.data;
}

const { z } = require('zod');

const idParams = z.object({ id: z.coerce.number().int().positive() });

const createUserSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(120),
      email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),
      password: z
        .string()
        .min(12)
        .max(128)
        .regex(/[a-z]/, 'Password must include a lowercase letter')
        .regex(/[A-Z]/, 'Password must include an uppercase letter')
        .regex(/[0-9]/, 'Password must include a number'),
    })
    .strict(),
});

const listUsersSchema = z.object({
  query: z
    .object({
      role: z.enum(['admin', 'sales']).optional(),
      isActive: z
        .enum(['true', 'false'])
        .transform((value) => value === 'true')
        .optional(),
      cursor: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    })
    .strict(),
});

const userIdSchema = z.object({ params: idParams });

const updateUserStatusSchema = z.object({
  params: idParams,
  body: z.object({ isActive: z.boolean() }).strict(),
});

module.exports = { createUserSchema, listUsersSchema, userIdSchema, updateUserStatusSchema };

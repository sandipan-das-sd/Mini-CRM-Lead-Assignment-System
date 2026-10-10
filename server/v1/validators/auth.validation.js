const { z } = require('zod');

const loginSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),
      password: z.string().min(8).max(128),
    })
    .strict(),
});

module.exports = { loginSchema };

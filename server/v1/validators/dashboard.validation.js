const { z } = require('zod');

const dashboardSchema = z.object({
  query: z
    .object({
      createdFrom: z.coerce.date().optional(),
      createdTo: z.coerce.date().optional(),
    })
    .strict()
    .refine((data) => !data.createdFrom || !data.createdTo || data.createdFrom <= data.createdTo, {
      message: 'createdFrom must be before createdTo',
      path: ['createdFrom'],
    }),
});

module.exports = { dashboardSchema };

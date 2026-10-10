const { z } = require('zod');

const leadParams = z.object({ leadId: z.coerce.number().int().positive() });

const addNoteSchema = z.object({
  params: leadParams,
  body: z.object({ note: z.string().trim().min(1).max(5000) }).strict(),
});

const listActivitiesSchema = z.object({
  params: leadParams,
  query: z
    .object({
      cursor: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    })
    .strict(),
});

module.exports = { addNoteSchema, listActivitiesSchema };

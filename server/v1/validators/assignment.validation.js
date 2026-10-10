const { z } = require('zod');

const leadParams = z.object({ leadId: z.coerce.number().int().positive() });
const requestParams = z.object({ id: z.coerce.number().int().positive() });

const assignLeadSchema = z.object({
  params: leadParams,
  body: z
    .object({
      assignedUserId: z.number().int().positive(),
      version: z.number().int().positive(),
      reason: z.string().trim().min(1).max(500).optional(),
    })
    .strict(),
});

const createRequestSchema = z.object({
  params: leadParams,
  body: z
    .object({
      requestedToUserId: z.number().int().positive().optional(),
      reason: z.string().trim().min(3).max(500),
    })
    .strict(),
});

const reviewRequestSchema = z.object({
  params: requestParams,
  body: z
    .object({
      decision: z.enum(['approved', 'rejected']),
      assignedUserId: z.number().int().positive().optional(),
    })
    .strict(),
});

const listRequestsSchema = z.object({
  query: z
    .object({
      status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
      cursor: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    })
    .strict(),
});

module.exports = {
  assignLeadSchema,
  createRequestSchema,
  reviewRequestSchema,
  listRequestsSchema,
};

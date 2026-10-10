const { z } = require('zod');
const { LEAD_STATUS_VALUES } = require('../constants/lead-statuses');

const nullableEmail = z.union([z.string().trim().email().max(254), z.null()]).optional();
const nullablePhone = z
  .union([
    z.string().trim().min(7).max(30),
    z.number().int().nonnegative().transform(String),
    z.null(),
  ])
  .optional();
const idParams = z.object({ id: z.coerce.number().int().positive() });

const createLeadSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(150),
      phone: nullablePhone,
      email: nullableEmail,
      source: z.string().trim().min(1).max(80),
    })
    .strict()
    .refine((data) => data.phone || data.email, {
      message: 'At least one of phone or email is required',
      path: ['phone'],
    }),
});

const listLeadsSchema = z.object({
  query: z
    .object({
      search: z.string().trim().min(1).max(150).optional(),
      status: z.enum(LEAD_STATUS_VALUES).optional(),
      source: z.string().trim().min(1).max(80).optional(),
      assignedUserId: z.coerce.number().int().positive().optional(),
      createdFrom: z.coerce.date().optional(),
      createdTo: z.coerce.date().optional(),
      cursor: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    })
    .strict()
    .refine((data) => !data.createdFrom || !data.createdTo || data.createdFrom <= data.createdTo, {
      message: 'createdFrom must be before createdTo',
      path: ['createdFrom'],
    }),
});

const leadIdSchema = z.object({ params: idParams });

const updateLeadSchema = z.object({
  params: idParams,
  body: z
    .object({
      name: z.string().trim().min(2).max(150).optional(),
      phone: nullablePhone,
      email: nullableEmail,
      source: z.string().trim().min(1).max(80).optional(),
      version: z.number().int().positive(),
    })
    .strict()
    .refine((data) => ['name', 'phone', 'email', 'source'].some((key) => key in data), {
      message: 'At least one editable field is required',
    }),
});

module.exports = { createLeadSchema, listLeadsSchema, leadIdSchema, updateLeadSchema };

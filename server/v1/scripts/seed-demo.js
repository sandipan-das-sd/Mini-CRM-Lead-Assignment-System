const pool = require('../db/connection/pool');
const userRepository = require('../repositories/user.repository');
const leadService = require('../services/lead.service');
const assignmentService = require('../services/assignment.service');
const { hashPassword } = require('../utils/password');
const { closeRedis } = require('../config/redis');
const { closeJobQueue } = require('../services/job-queue.service');

const salespeople = [
  { name: 'Asha Sharma', email: 'asha.sales@example.com' },
  { name: 'Rahul Verma', email: 'rahul.sales@example.com' },
  { name: 'Priya Das', email: 'priya.sales@example.com' },
];

const demoLeads = [
  {
    name: 'Ananya Roy',
    phone: '+919876500101',
    email: 'ananya.demo@example.com',
    source: 'website',
    owner: 0,
    statuses: ['contacted'],
  },
  {
    name: 'Vikram Singh',
    phone: '+919876500102',
    email: 'vikram.demo@example.com',
    source: 'referral',
    owner: 1,
    statuses: ['contacted', 'interested'],
  },
  {
    name: 'Meera Patel',
    phone: '+919876500103',
    email: 'meera.demo@example.com',
    source: 'campaign',
    owner: 2,
    statuses: [],
  },
];

async function getAdmin() {
  const [rows] = await pool.query(
    `SELECT id, name, email, role FROM users
     WHERE role = 'admin' AND is_active = TRUE AND deleted_at IS NULL ORDER BY id LIMIT 1`,
  );
  if (!rows[0]) throw new Error('Create the admin account before running the demo seed');
  return rows[0];
}

async function ensureSalesperson(input, passwordHash) {
  const existing = await userRepository.findAuthUserByEmail(input.email);
  if (existing) return existing;
  return userRepository.create({ ...input, passwordHash, role: 'sales' });
}

async function ensureLead(input, admin) {
  const [rows] = await pool.execute(
    'SELECT id FROM leads WHERE email = ? AND deleted_at IS NULL LIMIT 1',
    [input.email],
  );
  if (rows[0]) return leadService.getLead(rows[0].id, admin);
  const created = await leadService.createLead(
    { name: input.name, phone: input.phone, email: input.email, source: input.source },
    admin,
    `demo-lead-${input.email}`,
  );
  return created.body.data.lead;
}

async function seedDemo() {
  const password = process.env.DEMO_SALES_PASSWORD;
  if (
    !password ||
    password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    throw new Error(
      'DEMO_SALES_PASSWORD must be 12+ characters with uppercase, lowercase, and a number',
    );
  }
  const admin = await getAdmin();
  const passwordHash = await hashPassword(password);
  const users = [];
  for (const salesperson of salespeople)
    users.push(await ensureSalesperson(salesperson, passwordHash));

  for (const input of demoLeads) {
    let lead = await ensureLead(input, admin);
    const owner = users[input.owner];
    if (Number(lead.assignedUser?.id) !== Number(owner.id)) {
      lead = await assignmentService.assignLead(
        lead.id,
        {
          assignedUserId: Number(owner.id),
          version: Number(lead.version),
          reason: 'Demo assignment',
        },
        admin,
      );
    }
    if (lead.status === 'new') {
      for (const status of input.statuses) {
        lead = await leadService.changeStatus(
          lead.id,
          { status, version: Number(lead.version) },
          admin,
        );
      }
    }
  }

  console.log('Demo data is ready');
  for (const user of users) console.log(`Sales user ${user.id}: ${user.email}`);
  console.log('Created/verified 3 assigned demo leads');
}

seedDemo()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeJobQueue();
    await closeRedis();
    await pool.end();
  });

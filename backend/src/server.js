import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import pg from 'pg';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(cors({ origin: '*', exposedHeaders: ['Authorization'] }));
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

const { Pool } = pg;

const REQUIRED_PG_VARS = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
const missingPgVars = REQUIRED_PG_VARS.filter((v) => !process.env[v]);
if (missingPgVars.length > 0) {
  throw new Error(
    `Missing required database environment variable(s): ${missingPgVars.join(', ')}. ` +
    'Ensure the PostgreSQL service is linked and all PG* variables are injected into this service.'
  );
}

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  connectionTimeoutMillis: 5000
});

const dbQuery = (text, params = []) => pool.query(text, params);
const EMAIL_FROM = process.env.EMAIL_FROM || 'MindConnect <no-reply@mindconnect.local>';
const EMAIL_VERIFICATION_ENABLED = String(process.env.ENABLE_EMAIL_VERIFICATION || 'false') === 'true';
const PASSWORD_RESET_ENABLED = String(process.env.ENABLE_PASSWORD_RESET || 'false') === 'true';
const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS
);
const mailTransport = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : nodemailer.createTransport({ jsonTransport: true });

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await mailTransport.sendMail({ from: EMAIL_FROM, to, subject, text, html });
    if (!smtpConfigured) {
      console.log('[email-preview]', typeof info.message === 'string' ? info.message : JSON.stringify(info.message));
    }
    return true;
  } catch (err) {
    console.error('Email sending failed', err);
    return false;
  }
};

const issueEmailVerification = async ({ userId, email, name }) => {
  const token = crypto.randomBytes(32).toString('hex');
  await dbQuery(
    `
      INSERT INTO email_verification_tokens (id, user_id, token, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')
    `,
    [uuid(), userId, token]
  );
  const backendBaseUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${PORT}`;
  const verificationLink = `${backendBaseUrl}/api/auth/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your MindConnect account',
    text: `Hello ${name}, verify your account by opening: ${verificationLink}`,
    html: `<p>Hello ${name},</p><p>Please verify your account by clicking this link:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`
  });
  return verificationLink;
};

const issuePasswordReset = async ({ userId, email, name }) => {
  const token = crypto.randomBytes(32).toString('hex');
  await dbQuery(
    `
      INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')
    `,
    [uuid(), userId, token]
  );

  const appBase = process.env.APP_BASE_URL || 'http://localhost:5173';
  const resetLink = `${appBase.replace(/\/$/, '')}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your MindConnect password',
    text: `Hello ${name}, reset your password using this link: ${resetLink}`,
    html: `<p>Hello ${name},</p><p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 1 hour.</p>`
  });
  return resetLink;
};

const resources = [
  { id: 'res-1', title: 'Coping with exam stress', type: 'article', language: 'English', url: 'https://example.com/stress', tag: 'students' },
  { id: 'res-2', title: 'Tech burnout checklist', type: 'checklist', language: 'English', url: 'https://example.com/burnout', tag: 'young-professionals' },
  { id: 'res-3', title: 'Respiration guidee', type: 'audio', language: 'French', url: 'https://example.com/respirer', tag: 'anxiety' }
];

const professionals = [
  { id: 'pro-1', name: 'Dr. Amina K.', specialty: 'Clinical Psychologist', country: 'Kenya', languages: ['English', 'Swahili'], availability: 'Mon-Fri 9am-5pm EAT' },
  { id: 'pro-2', name: 'Samuel T.', specialty: 'Counselor', country: 'Nigeria', languages: ['English', 'Yoruba'], availability: 'Tue-Sat 10am-6pm WAT' },
  { id: 'pro-3', name: 'Nadia M.', specialty: 'Therapist', country: 'Rwanda', languages: ['English', 'Kinyarwanda', 'French'], availability: 'Evenings & Weekends CAT' }
];

const createToken = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (_err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const toIsoOrNull = (value) => (value ? new Date(value).toISOString() : null);

const mapTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  dueDate: toIsoOrNull(row.due_date),
  completed: row.completed,
  progress: Number(row.progress),
  createdAt: toIsoOrNull(row.created_at)
});

const mapGoal = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  targetDate: toIsoOrNull(row.target_date),
  progress: Number(row.progress),
  completed: row.completed,
  createdAt: toIsoOrNull(row.created_at)
});

const mapBooking = (row) => ({
  id: row.id,
  professionalId: row.professional_id,
  requestedAt: toIsoOrNull(row.requested_at),
  status: row.status,
  note: row.note
});

const mapNotification = (row) => ({
  id: row.id,
  type: row.type,
  body: row.body,
  createdAt: toIsoOrNull(row.created_at),
  read: row.read
});

const mapWellnessCheck = (row) => ({
  id: row.id,
  userId: row.user_id,
  mood: row.mood,
  stressLevel: row.stress_level === null ? undefined : Number(row.stress_level),
  sleepHours: row.sleep_hours === null ? undefined : Number(row.sleep_hours),
  energyLevel: row.energy_level === null ? undefined : Number(row.energy_level),
  note: row.note || undefined,
  grateful: row.grateful || undefined,
  createdAt: toIsoOrNull(row.created_at)
});

const mapChatMessage = (row) => ({
  id: row.id,
  sender: row.sender,
  body: row.body,
  sentAt: toIsoOrNull(row.sent_at)
});

const ensureDatabase = async () => {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      recovery_email TEXT UNIQUE NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      email_verified BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbQuery(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;
  `);
  await dbQuery(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS recovery_email TEXT UNIQUE;
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      due_date TIMESTAMPTZ NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      progress INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS goals (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      target_date TIMESTAMPTZ NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      professional_id TEXT NOT NULL,
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'pending',
      note TEXT NOT NULL DEFAULT ''
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS chats (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      professional_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY,
      chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS wellness_checks (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mood TEXT NOT NULL,
      stress_level INTEGER NULL,
      sleep_hours NUMERIC NULL,
      energy_level INTEGER NULL,
      note TEXT NOT NULL DEFAULT '',
      grateful TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbQuery('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_wellness_user_id ON wellness_checks(user_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_evt_user_id ON email_verification_tokens(user_id)');
  await dbQuery('CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id)');

  const seeds = [
    { name: 'Demo User', email: 'demo@mindconnect.africa', password: 'demo1234', role: 'user' },
    { name: 'Admin User', email: 'admin@mindconnect.africa', password: 'admin1234', role: 'admin' }
  ];

  for (const seed of seeds) {
    const existing = await dbQuery('SELECT id FROM users WHERE email = $1 LIMIT 1', [seed.email]);
    if (existing.rowCount === 0) {
      const hashed = await bcrypt.hash(seed.password, 10);
      await dbQuery(
        'INSERT INTO users (id, email, password, name, role, email_verified) VALUES ($1, $2, $3, $4, $5, TRUE)',
        [uuid(), seed.email, hashed, seed.name, seed.role]
      );
    }
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'MindConnect API running' });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role = 'user', recoveryEmail } = req.body;
  if (!email || !password || !name) return res.status(400).json({ message: 'name, email, and password are required' });
  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedRecoveryEmail = String(recoveryEmail || '').toLowerCase().trim() || null;
  const existing = await dbQuery(
    'SELECT id FROM users WHERE email = $1 OR recovery_email = $1 LIMIT 1',
    [normalizedEmail]
  );
  if (existing.rowCount > 0) return res.status(409).json({ message: 'Email already registered' });
  if (normalizedRecoveryEmail) {
    if (normalizedRecoveryEmail === normalizedEmail) {
      return res.status(400).json({ message: 'Recovery email must be different from account email' });
    }
    const existingRecovery = await dbQuery(
      'SELECT id FROM users WHERE email = $1 OR recovery_email = $1 LIMIT 1',
      [normalizedRecoveryEmail]
    );
    if (existingRecovery.rowCount > 0) {
      return res.status(409).json({ message: 'Recovery email is already in use' });
    }
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: uuid(),
    email: normalizedEmail,
    recoveryEmail: normalizedRecoveryEmail,
    password: hashed,
    name: String(name).trim(),
    role
  };
  await dbQuery(
    `
      INSERT INTO users (id, email, recovery_email, password, name, role, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [user.id, user.email, user.recoveryEmail, user.password, user.name, user.role, !EMAIL_VERIFICATION_ENABLED]
  );
  if (EMAIL_VERIFICATION_ENABLED) {
    const verificationLink = await issueEmailVerification({ userId: user.id, email: user.email, name: user.name });
    return res.status(201).json({
      requiresVerification: true,
      message: 'Registration successful. Please verify your email before logging in.',
      verificationLink: smtpConfigured ? undefined : verificationLink
    });
  }

  const token = createToken(user);
  res.setHeader('Authorization', `Bearer ${token}`);
  return res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      recoveryEmail: user.recoveryEmail,
      name: user.name,
      role: user.role,
      emailVerified: true
    }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const result = await dbQuery(
    'SELECT id, email, recovery_email, password, name, role, email_verified FROM users WHERE email = $1 LIMIT 1',
    [normalizedEmail]
  );
  if (result.rowCount === 0) return res.status(401).json({ message: 'Invalid credentials' });
  const user = result.rows[0];
  if (EMAIL_VERIFICATION_ENABLED && !user.email_verified) {
    return res.status(403).json({ message: 'Please verify your email before logging in.' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = createToken(user);
  res.setHeader('Authorization', `Bearer ${token}`);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      recoveryEmail: user.recovery_email,
      name: user.name,
      role: user.role,
      emailVerified: user.email_verified
    }
  });
});

app.get('/api/auth/verify-email', async (req, res) => {
  if (!EMAIL_VERIFICATION_ENABLED) {
    return res.status(400).json({ message: 'Email verification is temporarily disabled.' });
  }
  const token = String(req.query.token || '');
  if (!token) return res.status(400).json({ message: 'Verification token is required' });

  const result = await dbQuery(
    `
      SELECT evt.id, evt.user_id, evt.token, u.email, u.name
      FROM email_verification_tokens evt
      JOIN users u ON u.id = evt.user_id
      WHERE evt.token = $1
        AND evt.used_at IS NULL
        AND evt.expires_at > NOW()
      LIMIT 1
    `,
    [token]
  );
  if (result.rowCount === 0) return res.status(400).json({ message: 'Verification link is invalid or expired' });

  const row = result.rows[0];
  await dbQuery('UPDATE users SET email_verified = TRUE WHERE id = $1', [row.user_id]);
  await dbQuery('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1', [row.id]);
  await dbQuery('UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [row.user_id]);

  const appBase = process.env.APP_BASE_URL;
  if (appBase) {
    return res.redirect(`${appBase.replace(/\/$/, '')}/login?verified=1`);
  }
  return res.json({ ok: true, message: 'Email verified successfully. You can now log in.' });
});

app.post('/api/auth/resend-verification', async (req, res) => {
  if (!EMAIL_VERIFICATION_ENABLED) {
    return res.status(400).json({ message: 'Email verification is temporarily disabled.' });
  }
  const normalizedEmail = String(req.body?.email || '').toLowerCase().trim();
  if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });
  const result = await dbQuery('SELECT id, email, name, email_verified FROM users WHERE email = $1 LIMIT 1', [normalizedEmail]);
  if (result.rowCount === 0) {
    return res.json({ ok: true, message: 'If that email exists, a verification email has been sent.' });
  }
  const user = result.rows[0];
  if (user.email_verified) {
    return res.json({ ok: true, message: 'Email already verified. You can log in.' });
  }
  const verificationLink = await issueEmailVerification({ userId: user.id, email: user.email, name: user.name });
  return res.json({
    ok: true,
    message: 'Verification email sent.',
    verificationLink: smtpConfigured ? undefined : verificationLink
  });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  if (!PASSWORD_RESET_ENABLED) {
    return res.status(400).json({ message: 'Password reset is temporarily disabled.' });
  }
  const normalizedEmail = String(req.body?.email || '').toLowerCase().trim();
  if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });

  const result = await dbQuery(
    `
      SELECT id, email, recovery_email, name
      FROM users
      WHERE email = $1 OR recovery_email = $1
      ORDER BY CASE WHEN email = $1 THEN 0 ELSE 1 END
      LIMIT 1
    `,
    [normalizedEmail]
  );
  if (result.rowCount === 0) {
    return res.json({ ok: true, message: 'If that email is registered, a reset link has been sent.' });
  }

  const user = result.rows[0];
  const targetEmail = normalizedEmail === String(user.recovery_email || '').toLowerCase().trim()
    ? user.recovery_email
    : user.email;
  const resetLink = await issuePasswordReset({ userId: user.id, email: targetEmail, name: user.name });
  return res.json({
    ok: true,
    message: 'If that email is registered, a reset link has been sent.',
    resetLink: smtpConfigured ? undefined : resetLink
  });
});

app.post('/api/auth/reset-password', async (req, res) => {
  if (!PASSWORD_RESET_ENABLED) {
    return res.status(400).json({ message: 'Password reset is temporarily disabled.' });
  }
  const token = String(req.body?.token || '');
  const newPassword = String(req.body?.newPassword || '');
  if (!token || !newPassword) return res.status(400).json({ message: 'token and newPassword are required' });
  if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });

  const tokenResult = await dbQuery(
    `
      SELECT id, user_id
      FROM password_reset_tokens
      WHERE token = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `,
    [token]
  );
  if (tokenResult.rowCount === 0) return res.status(400).json({ message: 'Reset link is invalid or expired' });

  const resetRow = tokenResult.rows[0];
  const hashed = await bcrypt.hash(newPassword, 10);
  await dbQuery('UPDATE users SET password = $1 WHERE id = $2', [hashed, resetRow.user_id]);
  await dbQuery('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [resetRow.user_id]);

  return res.json({ ok: true, message: 'Password reset successful. You can now log in.' });
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const result = await dbQuery(
    'SELECT id, email, recovery_email, name, role, email_verified FROM users WHERE id = $1 LIMIT 1',
    [req.user.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
  const row = result.rows[0];
  res.json({
    id: row.id,
    email: row.email,
    recoveryEmail: row.recovery_email,
    name: row.name,
    role: row.role,
    emailVerified: row.email_verified
  });
});

app.patch('/api/me', authMiddleware, async (req, res) => {
  const currentResult = await dbQuery(
    'SELECT id, email, recovery_email, name, role, email_verified FROM users WHERE id = $1 LIMIT 1',
    [req.user.id]
  );
  if (currentResult.rowCount === 0) return res.status(404).json({ message: 'User not found' });
  const current = currentResult.rows[0];

  const { name, email, recoveryEmail } = req.body;
  let nextName = current.name;
  let nextEmail = current.email;
  let nextRecoveryEmail = current.recovery_email;

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) return res.status(400).json({ message: 'Name cannot be empty' });
    nextName = trimmed;
  }
  if (email !== undefined) {
    const normalized = String(email).toLowerCase().trim();
    if (!normalized) return res.status(400).json({ message: 'Email cannot be empty' });
    const duplicate = await dbQuery(
      'SELECT id FROM users WHERE (email = $1 OR recovery_email = $1) AND id <> $2 LIMIT 1',
      [normalized, current.id]
    );
    if (duplicate.rowCount > 0) return res.status(409).json({ message: 'Email already in use' });
    nextEmail = normalized;
  }
  if (recoveryEmail !== undefined) {
    const normalizedRecovery = String(recoveryEmail || '').toLowerCase().trim() || null;
    if (normalizedRecovery && normalizedRecovery === nextEmail) {
      return res.status(400).json({ message: 'Recovery email must be different from account email' });
    }
    if (normalizedRecovery) {
      const duplicateRecovery = await dbQuery(
        'SELECT id FROM users WHERE (email = $1 OR recovery_email = $1) AND id <> $2 LIMIT 1',
        [normalizedRecovery, current.id]
      );
      if (duplicateRecovery.rowCount > 0) {
        return res.status(409).json({ message: 'Recovery email already in use' });
      }
    }
    nextRecoveryEmail = normalizedRecovery;
  }
  if (nextRecoveryEmail && nextRecoveryEmail === nextEmail) {
    return res.status(400).json({ message: 'Recovery email must be different from account email' });
  }

  await dbQuery(
    'UPDATE users SET name = $1, email = $2, recovery_email = $3 WHERE id = $4',
    [nextName, nextEmail, nextRecoveryEmail, current.id]
  );
  res.json({
    id: current.id,
    email: nextEmail,
    recoveryEmail: nextRecoveryEmail,
    name: nextName,
    role: current.role,
    emailVerified: current.email_verified
  });
});

app.patch('/api/me/password', authMiddleware, async (req, res) => {
  const result = await dbQuery('SELECT id, password FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
  if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
  const user = result.rows[0];

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'currentPassword and newPassword are required' });
  if (String(newPassword).length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

  const hashed = await bcrypt.hash(newPassword, 10);
  await dbQuery('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
  res.json({ ok: true, message: 'Password updated' });
});

app.delete('/api/me', authMiddleware, async (req, res) => {
  const result = await dbQuery('SELECT id, password FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
  if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
  const user = result.rows[0];

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ message: 'Password is required to delete account' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Password is incorrect' });

  await dbQuery('DELETE FROM users WHERE id = $1', [user.id]);
  res.json({ ok: true, deleted: user.id });
});

app.get('/api/admin/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const result = await dbQuery('SELECT id, email, name, role FROM users ORDER BY created_at DESC');
  res.json(result.rows);
});

app.patch('/api/admin/users/:id/role', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const { role } = req.body;
  if (!role) return res.status(400).json({ message: 'role required' });
  const result = await dbQuery(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
    [role, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
  res.json(result.rows[0]);
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
  const result = await dbQuery(
    'SELECT id, title, description, due_date, completed, progress, created_at FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(result.rows.map(mapTask));
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  const { title, description = '', dueDate = null } = req.body;
  if (!title) return res.status(400).json({ message: 'Task title is required' });
  const result = await dbQuery(
    `
      INSERT INTO tasks (id, user_id, title, description, due_date, completed, progress)
      VALUES ($1, $2, $3, $4, $5, FALSE, 0)
      RETURNING id, title, description, due_date, completed, progress, created_at
    `,
    [uuid(), req.user.id, title, description, dueDate]
  );
  res.status(201).json(mapTask(result.rows[0]));
});

app.get('/api/reminders', authMiddleware, async (req, res) => {
  const result = await dbQuery(
    `
      SELECT id, title, description, due_date, completed, progress, created_at
      FROM tasks
      WHERE user_id = $1
        AND due_date IS NOT NULL
        AND completed = FALSE
        AND due_date BETWEEN NOW() AND NOW() + INTERVAL '2 days'
      ORDER BY due_date ASC
    `,
    [req.user.id]
  );
  res.json({ dueSoon: result.rows.map(mapTask) });
});

app.patch('/api/tasks/:id/complete', authMiddleware, async (req, res) => {
  const result = await dbQuery(
    `
      UPDATE tasks
      SET completed = TRUE, progress = 100
      WHERE id = $1 AND user_id = $2
      RETURNING id, title, description, due_date, completed, progress, created_at
    `,
    [req.params.id, req.user.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ message: 'Task not found' });
  const task = mapTask(result.rows[0]);

  await dbQuery(
    'INSERT INTO notifications (id, user_id, type, body, read) VALUES ($1, $2, $3, $4, FALSE)',
    [uuid(), req.user.id, 'task', `Task "${task.title}" marked complete`]
  );
  res.json(task);
});

app.patch('/api/tasks/:id', authMiddleware, async (req, res) => {
  const currentResult = await dbQuery(
    'SELECT id, title, description, due_date, completed, progress, created_at FROM tasks WHERE id = $1 AND user_id = $2 LIMIT 1',
    [req.params.id, req.user.id]
  );
  if (currentResult.rowCount === 0) return res.status(404).json({ message: 'Task not found' });
  const current = currentResult.rows[0];

  const { title, description, dueDate, progress, completed } = req.body;
  const next = {
    title: title !== undefined ? title : current.title,
    description: description !== undefined ? description : current.description,
    dueDate: dueDate !== undefined ? dueDate : current.due_date,
    progress: progress !== undefined ? progress : current.progress,
    completed: completed !== undefined ? completed : current.completed
  };

  const result = await dbQuery(
    `
      UPDATE tasks
      SET title = $1, description = $2, due_date = $3, progress = $4, completed = $5
      WHERE id = $6 AND user_id = $7
      RETURNING id, title, description, due_date, completed, progress, created_at
    `,
    [next.title, next.description, next.dueDate, next.progress, next.completed, req.params.id, req.user.id]
  );
  res.json(mapTask(result.rows[0]));
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  const result = await dbQuery('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (result.rowCount === 0) return res.status(404).json({ message: 'Task not found' });
  res.json({ deleted: result.rows[0].id });
});

app.get('/api/goals', authMiddleware, async (req, res) => {
  const result = await dbQuery(
    'SELECT id, title, description, target_date, progress, completed, created_at FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(result.rows.map(mapGoal));
});

app.post('/api/goals', authMiddleware, async (req, res) => {
  const { title, description = '', targetDate = null } = req.body;
  if (!title) return res.status(400).json({ message: 'Goal title is required' });
  const result = await dbQuery(
    `
      INSERT INTO goals (id, user_id, title, description, target_date, progress, completed)
      VALUES ($1, $2, $3, $4, $5, 0, FALSE)
      RETURNING id, title, description, target_date, progress, completed, created_at
    `,
    [uuid(), req.user.id, title, description, targetDate]
  );
  res.status(201).json(mapGoal(result.rows[0]));
});

app.patch('/api/goals/:id', authMiddleware, async (req, res) => {
  const currentResult = await dbQuery(
    'SELECT id, title, description, target_date, progress, completed, created_at FROM goals WHERE id = $1 AND user_id = $2 LIMIT 1',
    [req.params.id, req.user.id]
  );
  if (currentResult.rowCount === 0) return res.status(404).json({ message: 'Goal not found' });
  const current = currentResult.rows[0];

  const { title, description, targetDate, progress, completed } = req.body;
  const next = {
    title: title !== undefined ? title : current.title,
    description: description !== undefined ? description : current.description,
    targetDate: targetDate !== undefined ? targetDate : current.target_date,
    progress: progress !== undefined ? progress : current.progress,
    completed: completed !== undefined ? completed : current.completed
  };

  const result = await dbQuery(
    `
      UPDATE goals
      SET title = $1, description = $2, target_date = $3, progress = $4, completed = $5
      WHERE id = $6 AND user_id = $7
      RETURNING id, title, description, target_date, progress, completed, created_at
    `,
    [next.title, next.description, next.targetDate, next.progress, next.completed, req.params.id, req.user.id]
  );
  res.json(mapGoal(result.rows[0]));
});

app.delete('/api/goals/:id', authMiddleware, async (req, res) => {
  const result = await dbQuery('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (result.rowCount === 0) return res.status(404).json({ message: 'Goal not found' });
  res.json({ deleted: result.rows[0].id });
});

app.get('/api/professionals', (_req, res) => {
  res.json(professionals);
});

app.post('/api/bookings', authMiddleware, async (req, res) => {
  const { professionalId, requestedAt = null, note = '' } = req.body;
  const professional = professionals.find((p) => p.id === professionalId);
  if (!professional) return res.status(404).json({ message: 'Professional not found' });

  const result = await dbQuery(
    `
      INSERT INTO bookings (id, user_id, professional_id, requested_at, status, note)
      VALUES ($1, $2, $3, COALESCE($4, NOW()), 'pending', $5)
      RETURNING id, professional_id, requested_at, status, note, user_id
    `,
    [uuid(), req.user.id, professionalId, requestedAt, note]
  );

  await dbQuery(
    'INSERT INTO notifications (id, user_id, type, body, read) VALUES ($1, $2, $3, $4, FALSE)',
    [uuid(), req.user.id, 'booking', `Booking requested with ${professional.name}`]
  );
  const userRes = await dbQuery('SELECT email, name FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
  if (userRes.rowCount > 0) {
    const user = userRes.rows[0];
    await sendEmail({
      to: user.email,
      subject: 'Booking request received',
      text: `Hi ${user.name}, your booking request with ${professional.name} was received.`,
      html: `<p>Hi ${user.name},</p><p>Your booking request with <strong>${professional.name}</strong> was received.</p>`
    });
  }

  res.status(201).json({ booking: mapBooking(result.rows[0]), message: 'Booking request submitted' });
});

app.get('/api/bookings', authMiddleware, async (req, res) => {
  const result = req.user.role === 'admin'
    ? await dbQuery('SELECT id, professional_id, requested_at, status, note FROM bookings ORDER BY requested_at DESC')
    : await dbQuery('SELECT id, professional_id, requested_at, status, note FROM bookings WHERE user_id = $1 ORDER BY requested_at DESC', [req.user.id]);
  res.json(result.rows.map(mapBooking));
});

app.patch('/api/bookings/:id/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const { status } = req.body;
  const result = await dbQuery(
    `
      UPDATE bookings
      SET status = COALESCE($1, status)
      WHERE id = $2
      RETURNING id, professional_id, requested_at, status, note, user_id
    `,
    [status, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ message: 'Booking not found' });
  const booking = result.rows[0];

  await dbQuery(
    'INSERT INTO notifications (id, user_id, type, body, read) VALUES ($1, $2, $3, $4, FALSE)',
    [uuid(), booking.user_id, 'booking-status', `Booking ${booking.id} status: ${booking.status}`]
  );
  const userRes = await dbQuery('SELECT email, name FROM users WHERE id = $1 LIMIT 1', [booking.user_id]);
  const pro = professionals.find((p) => p.id === booking.professional_id);
  if (userRes.rowCount > 0) {
    const user = userRes.rows[0];
    await sendEmail({
      to: user.email,
      subject: 'Booking status updated',
      text: `Hi ${user.name}, your booking ${booking.id} with ${pro?.name || 'your professional'} is now ${booking.status}.`,
      html: `<p>Hi ${user.name},</p><p>Your booking with <strong>${pro?.name || 'your professional'}</strong> is now <strong>${booking.status}</strong>.</p>`
    });
  }

  res.json(mapBooking(booking));
});

app.post('/api/video-sessions', authMiddleware, (req, res) => {
  const { professionalId, bookingId } = req.body;
  const professional = professionals.find((p) => p.id === professionalId);
  if (!professional) return res.status(404).json({ message: 'Professional not found' });
  const meetingUrl = `https://meet.mindconnect.africa/${uuid()}`;
  res.status(201).json({ meetingUrl, professional, bookingId: bookingId || null });
});

app.post('/api/chats', authMiddleware, async (req, res) => {
  const { professionalId } = req.body;
  const professional = professionals.find((p) => p.id === professionalId);
  if (!professional) return res.status(404).json({ message: 'Professional not found' });

  const chatId = uuid();
  await dbQuery(
    'INSERT INTO chats (id, user_id, professional_id) VALUES ($1, $2, $3)',
    [chatId, req.user.id, professionalId]
  );
  res.status(201).json({ id: chatId, userId: req.user.id, professionalId, messages: [] });
});

app.get('/api/chats', authMiddleware, async (req, res) => {
  const chatsResult = req.user.role === 'admin'
    ? await dbQuery('SELECT id, user_id, professional_id FROM chats ORDER BY created_at DESC')
    : await dbQuery('SELECT id, user_id, professional_id FROM chats WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);

  if (chatsResult.rowCount === 0) return res.json([]);

  const chatIds = chatsResult.rows.map((c) => c.id);
  const messagesResult = await dbQuery(
    'SELECT id, chat_id, sender, body, sent_at FROM chat_messages WHERE chat_id = ANY($1::uuid[]) ORDER BY sent_at ASC',
    [chatIds]
  );

  const messagesByChat = {};
  for (const row of messagesResult.rows) {
    if (!messagesByChat[row.chat_id]) messagesByChat[row.chat_id] = [];
    messagesByChat[row.chat_id].push(mapChatMessage(row));
  }

  const payload = chatsResult.rows.map((chat) => ({
    id: chat.id,
    userId: chat.user_id,
    professionalId: chat.professional_id,
    messages: messagesByChat[chat.id] || []
  }));
  res.json(payload);
});

app.post('/api/chats/:id/messages', authMiddleware, async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ message: 'Message body required' });

  const chatResult = await dbQuery('SELECT id, user_id FROM chats WHERE id = $1 LIMIT 1', [req.params.id]);
  if (chatResult.rowCount === 0) return res.status(404).json({ message: 'Chat not found' });
  const chat = chatResult.rows[0];

  if (req.user.role !== 'admin' && chat.user_id !== req.user.id) {
    return res.status(404).json({ message: 'Chat not found' });
  }

  const messageResult = await dbQuery(
    `
      INSERT INTO chat_messages (id, chat_id, sender, body, sent_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, sender, body, sent_at
    `,
    [uuid(), chat.id, req.user.id, body]
  );

  await dbQuery(
    'INSERT INTO notifications (id, user_id, type, body, read) VALUES ($1, $2, $3, $4, FALSE)',
    [uuid(), chat.user_id, 'chat', 'New chat message']
  );

  res.status(201).json(mapChatMessage(messageResult.rows[0]));
});

app.get('/api/resources', (_req, res) => {
  res.json(resources);
});

app.get('/api/notifications', authMiddleware, async (req, res) => {
  const result = await dbQuery(
    'SELECT id, type, body, created_at, read FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(result.rows.map(mapNotification));
});

app.get('/api/wellness-checks', authMiddleware, async (req, res) => {
  const result = await dbQuery(
    `
      SELECT id, user_id, mood, stress_level, sleep_hours, energy_level, note, grateful, created_at
      FROM wellness_checks
      WHERE user_id = $1
      ORDER BY created_at ASC
    `,
    [req.user.id]
  );
  res.json(result.rows.map(mapWellnessCheck));
});

app.post('/api/wellness-checks', authMiddleware, async (req, res) => {
  const { mood, stressLevel = null, sleepHours = null, energyLevel = 3, note = '', grateful = '' } = req.body;
  if (!mood) return res.status(400).json({ message: 'mood required' });

  const result = await dbQuery(
    `
      INSERT INTO wellness_checks (id, user_id, mood, stress_level, sleep_hours, energy_level, note, grateful, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, user_id, mood, stress_level, sleep_hours, energy_level, note, grateful, created_at
    `,
    [uuid(), req.user.id, mood, stressLevel, sleepHours, energyLevel, note, grateful]
  );
  res.status(201).json(mapWellnessCheck(result.rows[0]));
});

app.patch('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  const result = await dbQuery(
    `
      UPDATE notifications
      SET read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING id, type, body, created_at, read
    `,
    [req.params.id, req.user.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ message: 'Not found' });
  res.json(mapNotification(result.rows[0]));
});

app.get('/api/admin/reports', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const [usersCount, tasksCount, goalsCount, bookingsCount, chatsCount] = await Promise.all([
    dbQuery('SELECT COUNT(*)::int AS count FROM users'),
    dbQuery('SELECT COUNT(*)::int AS count FROM tasks'),
    dbQuery('SELECT COUNT(*)::int AS count FROM goals'),
    dbQuery('SELECT COUNT(*)::int AS count FROM bookings'),
    dbQuery('SELECT COUNT(*)::int AS count FROM chats')
  ]);

  res.json({
    totals: {
      users: usersCount.rows[0].count,
      tasks: tasksCount.rows[0].count,
      goals: goalsCount.rows[0].count,
      bookings: bookingsCount.rows[0].count,
      chats: chatsCount.rows[0].count
    }
  });
});

app.get('/api/reports/me', authMiddleware, async (req, res) => {
  const [tasksTotal, tasksCompleted, goalsTotal, goalsCompleted] = await Promise.all([
    dbQuery('SELECT COUNT(*)::int AS count FROM tasks WHERE user_id = $1', [req.user.id]),
    dbQuery('SELECT COUNT(*)::int AS count FROM tasks WHERE user_id = $1 AND completed = TRUE', [req.user.id]),
    dbQuery('SELECT COUNT(*)::int AS count FROM goals WHERE user_id = $1', [req.user.id]),
    dbQuery('SELECT COUNT(*)::int AS count FROM goals WHERE user_id = $1 AND completed = TRUE', [req.user.id])
  ]);

  const totalTasks = tasksTotal.rows[0].count;
  const completedTasks = tasksCompleted.rows[0].count;

  res.json({
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      open: totalTasks - completedTasks
    },
    goals: {
      total: goalsTotal.rows[0].count,
      completed: goalsCompleted.rows[0].count
    }
  });
});

ensureDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MindConnect API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });

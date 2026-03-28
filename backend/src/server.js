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

/* =========================
   ✅ CORS CONFIG (UPDATED)
========================= */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://mind-connect-ofqswtkjv-nathanaellahirwas-projects.vercel.app',
  'https://mind-connect-git-main-nathanaellahirwas-projects.vercel.app'
].filter(Boolean);

const isVercelPreview = (origin) =>
  origin && origin.endsWith('.vercel.app');

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      isVercelPreview(origin)
    ) {
      return callback(null, true);
    }

    console.error('❌ Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  exposedHeaders: ['Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

/* =========================
   ✅ ENV + CONFIG
========================= */

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

const BACKEND_PUBLIC_URL =
  process.env.BACKEND_PUBLIC_URL || `http://localhost:${PORT}`;

const APP_BASE_URL =
  process.env.APP_BASE_URL || 'http://localhost:5173';

/* =========================
   ✅ DATABASE
========================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const missingPgVars = REQUIRED_PG_VARS.filter((v) => !process.env[v]);

if (missingPgVars.length > 0) {
  throw new Error(
    `Missing DB env vars: ${missingPgVars.join(', ')}`
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

/* =========================
   ✅ EMAIL CONFIG
========================= */

const EMAIL_FROM = process.env.EMAIL_FROM || 'MindConnect <no-reply@mindconnect.local>';

const smtpConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
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
    const info = await mailTransport.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html
    });

    if (!smtpConfigured) {
      console.log('[EMAIL PREVIEW]', info.message);
    }

    return true;
  } catch (err) {
    console.error('Email failed:', err);
    return false;
  }
};

/* =========================
   ✅ AUTH HELPERS
========================= */

const createToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Missing token' });

  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/* =========================
   ✅ EMAIL TOKENS (UPDATED URLs)
========================= */

const issueEmailVerification = async ({ userId, email, name }) => {
  const token = crypto.randomBytes(32).toString('hex');

  await dbQuery(
    `INSERT INTO email_verification_tokens (id, user_id, token, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
    [uuid(), userId, token]
  );

  const link = `${BACKEND_PUBLIC_URL}/api/auth/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your account',
    text: `Verify here: ${link}`,
    html: `<a href="${link}">Verify Email</a>`
  });

  return link;
};

const issuePasswordReset = async ({ userId, email, name }) => {
  const token = crypto.randomBytes(32).toString('hex');

  await dbQuery(
    `INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')`,
    [uuid(), userId, token]
  );

  const link = `${APP_BASE_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset Password',
    text: `Reset here: ${link}`,
    html: `<a href="${link}">Reset Password</a>`
  });

  return link;
};

/* =========================
   ✅ HEALTH CHECK
========================= */

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    backend: BACKEND_PUBLIC_URL
  });
});

/* =========================
   ✅ AUTH ROUTES (UNCHANGED)
========================= */

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = {
    id: uuid(),
    email,
    password: hashed,
    name,
    role: 'user'
  };

  await dbQuery(
    `INSERT INTO users (id, email, password, name, role)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, user.email, user.password, user.name, user.role]
  );

  const token = createToken(user);

  res.json({ token, user });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const result = await dbQuery(
    `SELECT * FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createToken(user);

  res.json({ token, user });
});

/* =========================
   ✅ START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`🚀 API running on ${BACKEND_PUBLIC_URL}`);
});

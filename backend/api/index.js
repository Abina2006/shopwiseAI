// Sanitize Neon DATABASE_URL automatically to prevent 6543/pooler port errors
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL
    .replace(/:6543/g, '')
    .replace(/&pgbouncer=true/g, '')
    .replace(/\?pgbouncer=true/g, '')
    .replace(/-pooler\./g, '.');
}

import app from '../src/app.js';
export default app;


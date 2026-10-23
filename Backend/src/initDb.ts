import bcrypt from 'bcryptjs';
import fs from 'fs';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const SQL_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../database/hms_full_database.sql');

/**
 * Creates all tables and starting data if the database is empty.
 * Does nothing when the tables already exist, so it is safe to run on every start.
 */
export async function ensureDatabase() {
  const conn = await mysql.createConnection({ ...config.db, multipleStatements: true });
  try {
    const [tables] = await conn.query("SHOW TABLES LIKE 'users'");
    if ((tables as unknown[]).length) return;

    if (config.production && !config.adminPassword) {
      throw new Error('The database is empty. Set ADMIN_PASSWORD (8+ characters) so the demo passwords are not used.');
    }
    console.log('Empty database found: creating tables and starting data...');

    // The file creates its own "hms" database; here we use the one the host gave us.
    const sql = fs
      .readFileSync(SQL_FILE, 'utf8')
      .replace(/^\s*(DROP DATABASE|CREATE DATABASE|USE)\b.*$/gim, '');
    await conn.query(sql);

    if (config.adminPassword) {
      const hash = await bcrypt.hash(config.adminPassword, 10);
      await conn.query("UPDATE users SET password_hash = ? WHERE username = 'admin'", [hash]);
      // switch off the other demo accounts; the admin can create real users on the Users screen
      await conn.query("UPDATE users SET is_active = 0 WHERE username <> 'admin'");
      console.log('Admin password set. Demo accounts other than admin are switched off.');
    }
  } finally {
    await conn.end();
  }
}

// `npm run db:init` runs it by hand
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  ensureDatabase().then(() => console.log('Database ready.'), (e) => { console.error(e.message); process.exit(1); });
}

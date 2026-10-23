import 'dotenv/config';
import path from 'path';

const env = process.env;

const need = (name: string): string => {
  const v = env[name];
  if (!v) throw new Error(`Missing ${name}. Set it in Backend/.env (or in your host's variables).`);
  return v;
};

// Database: DB_* variables, or a single MYSQL_URL / DATABASE_URL (what Railway provides)
const url = env.MYSQL_URL || env.DATABASE_URL ? new URL((env.MYSQL_URL || env.DATABASE_URL)!) : null;

export const config = {
  production: env.NODE_ENV === 'production',
  port: Number(env.PORT) || 4000,
  jwtSecret: need('JWT_SECRET'),
  db: {
    host: env.DB_HOST || url?.hostname,
    port: Number(env.DB_PORT || url?.port) || 3306,
    user: env.DB_USER || (url ? decodeURIComponent(url.username) : undefined),
    password: env.DB_PASS ?? (url ? decodeURIComponent(url.password) : undefined),
    database: env.DB_NAME || url?.pathname.slice(1),
  },
  // On a host, point these at a persistent volume (e.g. /data/uploads) or files vanish on redeploy
  uploadDir: env.UPLOAD_DIR || 'uploads',
  backupDir: env.BACKUP_DIR || 'backups',
  backupsEnabled: env.ENABLE_BACKUPS !== 'false',
  frontendDir: env.FRONTEND_DIR || path.resolve('../Frontend/dist'),
  adminPassword: env.ADMIN_PASSWORD, // used once, when an empty database is first set up
};

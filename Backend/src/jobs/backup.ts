import { exec } from 'child_process';
import cron from 'node-cron';
import fs from 'fs';
import { config } from '../config.js';

const { host, port, user, password, database } = config.db;

function dump(name: string, extraFlags = '') {
  fs.mkdirSync(config.backupDir, { recursive: true });
  const file = `${config.backupDir}/${name}-${new Date().toISOString().slice(0, 10)}.sql`;
  // MYSQL_PWD keeps the password out of the command line
  exec(
    `mysqldump --single-transaction ${extraFlags} -h${host} -P${port} -u${user} ${database} > ${file}`,
    { env: { ...process.env, MYSQL_PWD: password || '' } },
    (err) => console.log(err ? `Backup failed: ${name}` : `Backup saved ${file}`),
  );
}

if (config.backupsEnabled) {
  cron.schedule('0 2 * * *', () => dump('daily')); // every day 02:00
  cron.schedule('0 3 * * 0', () => dump('weekly-full', '--routines --triggers --events')); // Sundays 03:00
}

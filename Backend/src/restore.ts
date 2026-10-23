import { exec } from 'child_process';
import { config } from './config.js';

const file = process.argv[2];
if (!file) {
  console.log('Usage: npm run restore -- backups/<file>.sql');
  process.exit(1);
}

const { host, port, user, password, database } = config.db;
exec(
  `mysql -h${host} -P${port} -u${user} ${database} < ${file}`,
  { env: { ...process.env, MYSQL_PWD: password || '' } },
  (err) => {
    console.log(err ? `Restore failed: ${err.message}` : 'Restore complete');
    process.exit(err ? 1 : 0);
  },
);

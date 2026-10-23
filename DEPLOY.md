# Hosting HMS

The app is one service (the API also serves the website) plus a MySQL database.

**Railway is the easier choice**: it offers managed MySQL.

## Railway

1. Push this folder to a GitHub repository (the `.gitignore` already keeps secrets and patient data out).
2. In Railway: **New Project → Deploy from GitHub repo**, pick the repository. Railway builds the `Dockerfile` automatically.
3. In the same project: **New → Database → Add MySQL**.
4. Open your app service → **Variables** and add:

   | Variable | Value |
   |---|---|
   | `MYSQL_URL` | `${{MySQL.MYSQL_URL}}` (type it exactly; Railway fills it in) |
   | `JWT_SECRET` | a long random string, e.g. from `openssl rand -hex 32` |
   | `ADMIN_PASSWORD` | the password you want for `admin` (8+ characters) |
   | `UPLOAD_DIR` | `/data/uploads` |
   | `BACKUP_DIR` | `/data/backups` |

5. Open the app service → **Settings → Volumes → Add volume**, mount path `/data`. Without it, uploaded patient documents and backups are deleted on every redeploy.
6. **Settings → Networking → Generate domain**, then open it. Sign in as `admin` with your `ADMIN_PASSWORD`.

On first start the app sees an empty database and creates all tables and starting data by itself. It then sets the admin password and **switches off the other demo accounts** (doctor, nurse, ...). Create real users on the **Users** screen. It never touches a database that already has tables.

The starting data also includes sample patients, doctors and so on. To remove them, open the database in Railway's **Data** tab and delete those rows, or delete the "SAMPLE DATA" part of `database/hms_full_database.sql` before the first deploy.
# Hospital Management System (HMS)

A web application that manages patients, appointments, medical records, laboratory, pharmacy, billing and staff for a hospital.

**Stack:** TypeScript · Node.js (Express) · React (Vite) + Tailwind CSS · MySQL

## Features

| Area | What it does |
|---|---|
| Access | Login, 30-minute sessions, 15-minute idle logout, role-based access, password change, audit log |
| Users | Admin creates users, assigns roles, resets passwords, deactivates accounts |
| Patients | Register, edit, search, soft delete, medical history, document upload |
| Doctors | Profiles, departments, weekly working hours (bookings outside them are refused) |
| Appointments | Book, cancel, reschedule, status tracking, calendar view, double-booking check |
| Records | Diagnosis, prescriptions, treatment, admissions, medical report PDF |
| Laboratory | Test catalogue, requests, sample collection, results, lab report PDF |
| Pharmacy | Medicine stock, prescriptions dispensed by the pharmacist, low-stock and expiry alerts |
| Billing | Automatic bill from all unbilled charges, payments, invoice and receipt PDFs |
| Staff | Employees, attendance, leave records |
| Reports | Patients, appointments, revenue, pharmacy, laboratory, staff |
| Backup | Daily and weekly MySQL dumps, restore command |

## Requirements

- Node.js 18 or newer
- MySQL 8 (running)
- `mysqldump` on the PATH (only needed for the automatic backups)

## Setup

**1. Create the database.** From the project folder, in Command Prompt (in PowerShell, put `cmd /c` in front and use quotes):

```
mysql -u root -p < database\hms_full_database.sql
```

This file **drops and recreates** the `hms` database, creates all tables, the seven demo users and sample data. Delete the sample-data section at the bottom of the file if you want an empty system.

Alternatively, create an empty database named `hms` and just start the server: when it finds no tables it creates them (and the demo data) itself.

**2. Configure the server.**

```
cd Backend
copy .env.example .env
```

Open `Backend/.env` and set your MySQL details and a long random secret:

```
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=hms
JWT_SECRET=a-long-random-string
```

Generate a secret with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**3. Start the server.**

```
npm install
npm run dev
```

(`npm run build` then `npm start` runs the compiled server; `npm run typecheck` checks types.)

Wait for `HMS API running`.

**4. Start the website** in a second terminal.

```
cd Frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Keep both terminals open while you use the system.

## Demo logins

Username is the role name, and the password is the role name plus `123`.

| Username | Password |
|---|---|
| admin | admin123 |
| doctor | doctor123 |
| nurse | nurse123 |
| receptionist | receptionist123 |
| lab | lab123 |
| pharmacist | pharmacist123 |
| accountant | accountant123 |

On a hosted site only `admin` stays active, with the password you set in `ADMIN_PASSWORD` (see [DEPLOY.md](DEPLOY.md)); the other demo accounts are switched off.

**Change these before using real data** (Users screen for admin, "My password" for everyone else).

### Adding users with SQL

There is no seed script. Users are stored in the `users` table, and passwords must be saved as bcrypt hashes, never as plain text.

1. Generate a hash (run inside `Backend/`, after `npm install`):
   ```
   node -e "console.log(require('bcryptjs').hashSync('YourPassword1',10))"
   ```
2. Insert the user in MySQL, using the hash from step 1 and one of the roles `admin`, `doctor`, `nurse`, `receptionist`, `lab`, `pharmacist`, `accountant`:
   ```sql
   USE hms;
   INSERT INTO users(username,password_hash,full_name,role_id)
   VALUES('dr.silva','PASTE_HASH_HERE','Dr. Silva',(SELECT id FROM roles WHERE name='doctor'));
   ```

Once an admin can sign in, new users can also be created from the **Users** screen.

## Who can do what

Admin can do everything. Other roles:

| Role | Main permissions |
|---|---|
| Doctor | View patients and appointments, write medical records, prescribe, request lab tests |
| Nurse | Register patients, book appointments, admissions, view records |
| Receptionist | Register patients, book appointments, admissions, billing |
| Lab | Lab tests and results |
| Pharmacist | Medicines, dispense prescriptions, stock alerts |
| Accountant | Billing, payments, reports |

To change a rule, edit the `read` and `write` lists in `Backend/src/routes/index.ts` and the matching `roles` / `write` on that page in `Frontend/src/pages/config.ts`.

## Project structure

```
hms/
├── Dockerfile, railway.json, DEPLOY.md   hosting
├── database/hms_full_database.sql   schema + demo data (the only SQL file you need)
├── Backend/src/
│   ├── app.ts, config.ts, db.ts, roles.ts
│   ├── middleware/auth.ts           login check, role check, audit log
│   ├── routes/
│   │   ├── index.ts                 simple tables + who can read/write them
│   │   ├── crud.ts                  generic list/get/create/update/delete
│   │   ├── appointments.ts, billing.ts, pharmacy.ts, patients.ts, pdf.ts, admin.ts
│   └── jobs/backup.ts, restore.ts
└── Frontend/src/
    ├── App.tsx, api.ts, types.ts
    ├── components/                  Resource (generic page), DataTable, FormDialog, ui
    └── pages/                       config.ts (all table pages) + Dashboard, Calendar, Reports, ...
```

## Hosting

See [DEPLOY.md](DEPLOY.md) for Railway (recommended) and Render.

## Backups

- Daily dump at 02:00 and a full dump every Sunday at 03:00, saved in `Backend/backups/`.
- Restore: `cd Backend` then `npm run restore -- backups/<file>.sql`
- Copy `Backend/backups/` and `Backend/uploads/` to separate storage regularly.
- Folders can be moved with `BACKUP_DIR` and `UPLOAD_DIR` in `.env` (on a host, point them at a persistent volume).

## Troubleshooting

| Problem | Fix |
|---|---|
| `ECONNREFUSED` in the client terminal | The server is not running. Start it in `Backend/` |
| `Access denied for user` | Check `DB_USER` and `DB_PASS` in `Backend/.env`, then restart the server |
| `Table ... doesn't exist` | Load `database/hms_full_database.sql` |
| Cannot sign in | Make sure the database was created from `hms_full_database.sql` (it includes the demo users) |
| Page shows "Cannot GET" on port 4000 | With `npm run dev`, port 4000 is the API only. Open http://localhost:5173. After `npm run build` in both folders, port 4000 serves the whole site |

## Security notes

- Never commit `.env`, `Backend/uploads/` or `Backend/backups/` (the included `.gitignore` already excludes them).
- Use HTTPS when deployed, and change every demo password and the `JWT_SECRET`.
- Clinical records are soft-deleted, never erased.

## Not included

Mobile app, patient portal, SMS and email notifications, telemedicine, insurance integration, AI decision support, biometric login, automated tests, and high availability setup.

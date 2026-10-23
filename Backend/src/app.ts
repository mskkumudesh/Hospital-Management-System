import "express-async-errors";
import bcrypt from "bcryptjs";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";
import { config } from "./config.js";
import { one, run } from "./db.js";
import { ensureDatabase } from "./initDb.js";
import "./jobs/backup.js";
import { audit, authenticate } from "./middleware/auth.js";
import routes from "./routes/index.js";

const app = express();
app.set("trust proxy", 1); // behind the host's proxy: use the real client IP
// object-src allows the PDF viewer to open blob: files
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: { "object-src": ["'self'", "blob:"] },
    },
  }),
  express.json(),
);

app.get("/health", (_req, res) => res.json({ ok: true }));

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

app.post("/api/auth/login", loginLimit, async (req, res) => {
  const { username, password } = req.body;
  const user = await one(
    "SELECT u.*, r.name role FROM users u JOIN roles r ON r.id = u.role_id WHERE username = ? AND is_active = 1",
    [username],
  );
  if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
    return res.status(401).json({ error: "Wrong username or password." });
  }
  await run("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.full_name },
    config.jwtSecret,
    {
      expiresIn: "30m",
    },
  );
  res.json({
    token,
    user: { id: user.id, name: user.full_name, role: user.role },
  });
});

app.use("/api", authenticate, audit, routes);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong on the server." });
  },
);

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

// In production the API also serves the built website, so one service is enough
if (fs.existsSync(config.frontendDir)) {
  app.use(express.static(config.frontendDir));
  app.get("*", (_req, res) =>
    res.sendFile(path.join(config.frontendDir, "index.html")),
  );
}

ensureDatabase()
  .then(() => app.listen(config.port, () => console.log("HMS API running")))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });

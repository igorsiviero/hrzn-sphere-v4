
const express = require("express");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const multer = require("multer");
const crypto = require("crypto");
const { promisify } = require("util");

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT = __dirname;
const WORKSPACE = process.env.WORKSPACE_DIR ? path.resolve(process.env.WORKSPACE_DIR) : path.join(ROOT, "workspace");
const UPLOADS = path.join(WORKSPACE, "uploads");
const CONFIG_FILE = path.join(WORKSPACE, "config.json");
const CLIENTS_FILE = path.join(WORKSPACE, "clients.json");
const CONTRACTS_FILE = path.join(WORKSPACE, "contracts.json");
const FINANCE_FILE = path.join(WORKSPACE, "finance.json");
const BILLS_FILE = path.join(WORKSPACE, "bills.json");
const RECEIVABLES_FILE = path.join(WORKSPACE, "receivables.json");
const TASKS_FILE = path.join(WORKSPACE, "tasks.json");
const LOGO_FILE = path.join(WORKSPACE, "brand-logo.png");
const USERS_FILE = path.join(WORKSPACE, "users.json");
const SESSIONS_FILE = path.join(WORKSPACE, "sessions.json");
const AUDIT_FILE = path.join(WORKSPACE, "audit-log.json");
const SESSION_COOKIE = "hrzn_sphere_session";
const SESSION_DAYS = 7;

app.set("trust proxy", 1);

app.use(express.json({ limit: "8mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.static(path.join(ROOT, "public")));

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function readJSON(filePath, fallback) {
  try {
    const raw = await fsp.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

async function writeJSONAtomic(filePath, data) {
  const tmp = filePath + ".tmp";
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fsp.rename(tmp, filePath);
}

function makeId(prefix = "id") {
  // Sem dependências: id curto + aleatório
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rnd}`;
}

function todaySaoPauloISO(){
  try{
    return new Intl.DateTimeFormat("sv-SE",{ timeZone: "America/Sao_Paulo" }).format(new Date());
  }catch{
    return new Date().toISOString().slice(0,10);
  }
}

function sanitizeFilename(name) {
  return String(name || "arquivo")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}



function normalizeContractMonthlyValues(values) {
  if (!values || typeof values !== "object" || Array.isArray(values)) return {};
  const out = {};
  for (const [k, v] of Object.entries(values)) {
    if (!/^\d{4}-\d{2}$/.test(String(k))) continue;
    out[String(k)] = Math.max(0, Math.round(Number(v) || 0));
  }
  return out;
}

function defaultFinanceData(){
  return {
    settings: {
      monthlyBudgetCents: 0,
      currency: "BRL"
    },
    categories: [
      { id: "cat_alimentacao", name: "Alimentação", color: "#3B82F6", budgetCents: 0 },
      { id: "cat_transporte", name: "Transporte", color: "#22C55E", budgetCents: 0 },
      { id: "cat_residencia", name: "Residência", color: "#F97316", budgetCents: 0 },
      { id: "cat_lazer", name: "Lazer", color: "#A855F7", budgetCents: 0 },
      { id: "cat_assinaturas", name: "Assinaturas", color: "#EF4444", budgetCents: 0 }
    ],
    expenses: []
  };
}


function defaultBillsData(){
  return { bills: [] };
}

function defaultReceivablesData(){
  return { receivables: [] };
}

function defaultTasksData(){
  return {
    meta: {
      statuses: [
        { id: "st_todo", name: "A fazer", color: "", order: 1 },
        { id: "st_pending", name: "Pendente", color: "#F97316", order: 2 },
        { id: "st_progress", name: "Em andamento", color: "#3B82F6", order: 3 },
        { id: "st_done", name: "Concluída", color: "#22C55E", order: 4 }
      ],
      priorities: [
        { id: "pr_low", name: "Baixa", color: "#94A3B8", order: 1 },
        { id: "pr_med", name: "Média", color: "#F59E0B", order: 2 },
        { id: "pr_high", name: "Alta", color: "#EF4444", order: 3 }
      ]
    },
    tasks: []
  };
}

function defaultUsersData(){
  return { users: [] };
}

function defaultSessionsData(){
  return { sessions: [] };
}

function defaultAuditData(){
  return { events: [] };
}

const scryptAsync = promisify(crypto.scrypt);

function nowISO(){
  return new Date().toISOString();
}

function addDays(date, days){
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sha256(input){
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

async function hashPassword(password){
  const raw = String(password || "");
  if (raw.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres");
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scryptAsync(raw, salt, 64);
  return `scrypt:${salt}:${key.toString("hex")}`;
}

async function verifyPassword(password, stored){
  try{
    const [scheme, salt, keyHex] = String(stored || "").split(":");
    if (scheme !== "scrypt" || !salt || !keyHex) return false;
    const candidate = await scryptAsync(String(password || ""), salt, 64);
    const expected = Buffer.from(keyHex, "hex");
    return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
  }catch{
    return false;
  }
}

function normalizeEmail(email){
  return String(email || "").trim().toLowerCase();
}

function publicUser(user){
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active !== false,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || null
  };
}

function parseCookies(req){
  const header = req.headers.cookie || "";
  const out = {};
  for (const part of header.split(";")){
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function setSessionCookie(req, res, token, expiresAt){
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${new Date(expiresAt).toUTCString()}`
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(res){
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

async function pruneSessions(){
  const data = await readJSON(SESSIONS_FILE, defaultSessionsData());
  const n = Date.now();
  data.sessions = (data.sessions || []).filter(s => Date.parse(s.expiresAt || "") > n);
  await writeJSONAtomic(SESSIONS_FILE, data);
  return data;
}

async function createSession(req, res, user){
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = addDays(new Date(), SESSION_DAYS).toISOString();
  const sessions = await pruneSessions();
  sessions.sessions.unshift({
    id: makeId("ses"),
    userId: user.id,
    tokenHash: sha256(token),
    createdAt: nowISO(),
    lastSeenAt: nowISO(),
    expiresAt,
    ip: req.ip,
    userAgent: String(req.headers["user-agent"] || "").slice(0, 240)
  });
  await writeJSONAtomic(SESSIONS_FILE, sessions);
  setSessionCookie(req, res, token, expiresAt);
}

async function recordAudit(req, action, entity, details = {}){
  try{
    const data = await readJSON(AUDIT_FILE, defaultAuditData());
    data.events = data.events || [];
    data.events.unshift({
      id: makeId("aud"),
      at: nowISO(),
      action,
      entity,
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
      ip: req.ip,
      details
    });
    data.events = data.events.slice(0, 1000);
    await writeJSONAtomic(AUDIT_FILE, data);
  }catch(e){
    console.warn("Audit log failed:", e.message);
  }
}

async function hasActiveUsers(){
  const usersData = await readJSON(USERS_FILE, defaultUsersData());
  return (usersData.users || []).some(u => u.active !== false);
}

async function requireAuth(req, res, next){
  try{
    const cookies = parseCookies(req);
    const token = cookies[SESSION_COOKIE];
    if (!token) return res.status(401).json({ ok:false, error:"Sessão não encontrada" });

    const sessions = await pruneSessions();
    const tokenHash = sha256(token);
    const session = (sessions.sessions || []).find(s => s.tokenHash === tokenHash);
    if (!session) return res.status(401).json({ ok:false, error:"Sessão expirada" });

    const usersData = await readJSON(USERS_FILE, defaultUsersData());
    const user = (usersData.users || []).find(u => u.id === session.userId && u.active !== false);
    if (!user) return res.status(401).json({ ok:false, error:"Usuário inativo ou não encontrado" });

    req.user = user;
    req.session = session;
    next();
  }catch(e){
    res.status(500).json({ ok:false, error:e.message });
  }
}

function requireAdmin(req, res, next){
  if (req.user?.role !== "admin") return res.status(403).json({ ok:false, error:"Acesso restrito a administradores" });
  next();
}

async function safeWriteIfMissing(file, fallback){
  if (!fs.existsSync(file)) await writeJSONAtomic(file, fallback);
}

async function bootstrap() {
  ensureDirSync(WORKSPACE);
  ensureDirSync(UPLOADS);

  // cria arquivos default se não existirem
  if (!fs.existsSync(CONFIG_FILE)) {
    await writeJSONAtomic(CONFIG_FILE, {
      company: { tradeName: "", legalName: "", cnpj: "", addressLine: "", neighborhood: "", city: "", state: "", zip: "", email: "", phone: "", representativeName: "", representativeRole: "" },
      branding: { accent: "#2563EB", companyShort: "HRZN", theme: "dark" }
    });}
  if (!fs.existsSync(CLIENTS_FILE)) await writeJSONAtomic(CLIENTS_FILE, { clients: [] });
  if (!fs.existsSync(CONTRACTS_FILE)) await writeJSONAtomic(CONTRACTS_FILE, { contracts: [] });
  if (!fs.existsSync(FINANCE_FILE)) await writeJSONAtomic(FINANCE_FILE, defaultFinanceData());
  if (!fs.existsSync(BILLS_FILE)) await writeJSONAtomic(BILLS_FILE, defaultBillsData());
  if (!fs.existsSync(RECEIVABLES_FILE)) await writeJSONAtomic(RECEIVABLES_FILE, defaultReceivablesData());
  if (!fs.existsSync(TASKS_FILE)) await writeJSONAtomic(TASKS_FILE, defaultTasksData());
  await safeWriteIfMissing(USERS_FILE, defaultUsersData());
  await safeWriteIfMissing(SESSIONS_FILE, defaultSessionsData());
  await safeWriteIfMissing(AUDIT_FILE, defaultAuditData());
}


const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const clientId = req.body.clientId;
      if (!clientId) return cb(new Error("clientId é obrigatório"), null);
      const dir = path.join(UPLOADS, clientId);
      ensureDirSync(dir);
      cb(null, dir);
    } catch (e) {
      cb(e, null);
    }
  },
  filename: (req, file, cb) => {
    const original = file.originalname || "upload";
    const safe = sanitizeFilename(original);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    cb(null, `${stamp}__${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }
});


// ---------- API: Auth / Usuários ----------
app.get("/api/health", async (req, res) => {
  res.json({ ok:true, app:"HRZN Sphere", version:"1.1.0", time: nowISO() });
});

app.get("/api/auth/status", async (req, res) => {
  const needsSetup = !(await hasActiveUsers());
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return res.json({ ok:true, authenticated:false, needsSetup, user:null });

  const sessions = await pruneSessions();
  const session = (sessions.sessions || []).find(s => s.tokenHash === sha256(token));
  if (!session) return res.json({ ok:true, authenticated:false, needsSetup, user:null });

  const usersData = await readJSON(USERS_FILE, defaultUsersData());
  const user = (usersData.users || []).find(u => u.id === session.userId && u.active !== false);
  if (!user) return res.json({ ok:true, authenticated:false, needsSetup, user:null });

  res.json({ ok:true, authenticated:true, needsSetup:false, user: publicUser(user) });
});

app.post("/api/auth/setup", async (req, res) => {
  try{
    if (await hasActiveUsers()) return res.status(409).json({ ok:false, error:"O administrador inicial já foi criado" });
    const body = req.body || {};
    const name = String(body.name || "Administrador").trim() || "Administrador";
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    if (!email || !email.includes("@")) return res.status(400).json({ ok:false, error:"E-mail inválido" });

    const passwordHash = await hashPassword(password);
    const usersData = defaultUsersData();
    const user = {
      id: makeId("usr"),
      name,
      email,
      role: "admin",
      active: true,
      passwordHash,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      lastLoginAt: nowISO()
    };
    usersData.users.push(user);
    await writeJSONAtomic(USERS_FILE, usersData);
    await createSession(req, res, user);
    await recordAudit({ user, ip: req.ip }, "auth.setup", "user", { userId: user.id, email });
    res.json({ ok:true, user: publicUser(user) });
  }catch(e){
    res.status(400).json({ ok:false, error:e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try{
    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const usersData = await readJSON(USERS_FILE, defaultUsersData());
    const user = (usersData.users || []).find(u => normalizeEmail(u.email) === email && u.active !== false);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ ok:false, error:"E-mail ou senha inválidos" });
    }
    user.lastLoginAt = nowISO();
    user.updatedAt = nowISO();
    await writeJSONAtomic(USERS_FILE, usersData);
    await createSession(req, res, user);
    await recordAudit({ user, ip: req.ip }, "auth.login", "user", { userId: user.id });
    res.json({ ok:true, user: publicUser(user) });
  }catch(e){
    res.status(500).json({ ok:false, error:e.message });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try{
    const token = parseCookies(req)[SESSION_COOKIE];
    if (token){
      const sessions = await readJSON(SESSIONS_FILE, defaultSessionsData());
      sessions.sessions = (sessions.sessions || []).filter(s => s.tokenHash !== sha256(token));
      await writeJSONAtomic(SESSIONS_FILE, sessions);
    }
    clearSessionCookie(res);
    res.json({ ok:true });
  }catch(e){
    res.status(500).json({ ok:false, error:e.message });
  }
});

// Todas as rotas de dados abaixo exigem sessão autenticada.
app.use("/api", requireAuth);
app.use("/api", (req, res, next) => {
  res.on("finish", () => {
    if (["POST", "PUT", "DELETE"].includes(req.method) && res.statusCode < 400) {
      recordAudit(req, `api.${req.method.toLowerCase()}`, req.path, { statusCode: res.statusCode }).catch(()=>{});
    }
  });
  next();
});

app.get("/api/users", requireAdmin, async (req, res) => {
  const usersData = await readJSON(USERS_FILE, defaultUsersData());
  res.json({ ok:true, users: (usersData.users || []).map(publicUser) });
});

app.post("/api/users", requireAdmin, async (req, res) => {
  try{
    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const name = String(body.name || "").trim();
    const role = ["admin","manager","member"].includes(body.role) ? body.role : "member";
    const password = String(body.password || "");
    if (!name) return res.status(400).json({ ok:false, error:"Nome é obrigatório" });
    if (!email || !email.includes("@")) return res.status(400).json({ ok:false, error:"E-mail inválido" });

    const usersData = await readJSON(USERS_FILE, defaultUsersData());
    if ((usersData.users || []).some(u => normalizeEmail(u.email) === email)) {
      return res.status(409).json({ ok:false, error:"Já existe um usuário com este e-mail" });
    }
    const user = {
      id: makeId("usr"),
      name,
      email,
      role,
      active: body.active !== false,
      passwordHash: await hashPassword(password),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      lastLoginAt: null
    };
    usersData.users = [user, ...(usersData.users || [])];
    await writeJSONAtomic(USERS_FILE, usersData);
    await recordAudit(req, "user.create", "user", { userId: user.id, email, role });
    res.json({ ok:true, user: publicUser(user) });
  }catch(e){
    res.status(400).json({ ok:false, error:e.message });
  }
});

app.put("/api/users/:id", requireAdmin, async (req, res) => {
  try{
    const id = req.params.id;
    const patch = req.body || {};
    const usersData = await readJSON(USERS_FILE, defaultUsersData());
    const idx = (usersData.users || []).findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ ok:false, error:"Usuário não encontrado" });

    const current = usersData.users[idx];
    const nextEmail = normalizeEmail(patch.email ?? current.email);
    if (!nextEmail || !nextEmail.includes("@")) return res.status(400).json({ ok:false, error:"E-mail inválido" });
    if ((usersData.users || []).some(u => u.id !== id && normalizeEmail(u.email) === nextEmail)) {
      return res.status(409).json({ ok:false, error:"Outro usuário já usa este e-mail" });
    }

    const role = ["admin","manager","member"].includes(patch.role) ? patch.role : current.role;
    const active = patch.active === undefined ? current.active !== false : patch.active !== false;
    const adminCount = (usersData.users || []).filter(u => u.role === "admin" && u.active !== false && (u.id !== id || active)).length;
    if (adminCount < 1) return res.status(400).json({ ok:false, error:"O sistema precisa manter pelo menos um administrador ativo" });

    const updated = {
      ...current,
      name: String(patch.name ?? current.name).trim() || current.name,
      email: nextEmail,
      role,
      active,
      updatedAt: nowISO()
    };
    if (patch.password) updated.passwordHash = await hashPassword(String(patch.password));
    usersData.users[idx] = updated;
    await writeJSONAtomic(USERS_FILE, usersData);
    await recordAudit(req, "user.update", "user", { userId: id, role, active });
    res.json({ ok:true, user: publicUser(updated) });
  }catch(e){
    res.status(400).json({ ok:false, error:e.message });
  }
});

app.delete("/api/users/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;
  if (id === req.user.id) return res.status(400).json({ ok:false, error:"Você não pode excluir o próprio usuário" });
  const usersData = await readJSON(USERS_FILE, defaultUsersData());
  const target = (usersData.users || []).find(u => u.id === id);
  if (!target) return res.status(404).json({ ok:false, error:"Usuário não encontrado" });
  usersData.users = (usersData.users || []).filter(u => u.id !== id);
  const adminCount = usersData.users.filter(u => u.role === "admin" && u.active !== false).length;
  if (adminCount < 1) return res.status(400).json({ ok:false, error:"O sistema precisa manter pelo menos um administrador ativo" });
  await writeJSONAtomic(USERS_FILE, usersData);
  await recordAudit(req, "user.delete", "user", { userId: id, email: target.email });
  res.json({ ok:true });
});

app.get("/api/audit", requireAdmin, async (req, res) => {
  const data = await readJSON(AUDIT_FILE, defaultAuditData());
  res.json({ ok:true, events: (data.events || []).slice(0, 200) });
});

// ---------- API: Config ----------
app.get("/api/config", async (req, res) => {
  const cfg = await readJSON(CONFIG_FILE, {});
  res.json(cfg);
});

app.put("/api/config", async (req, res) => {
  const cfg = req.body || {};
  await writeJSONAtomic(CONFIG_FILE, cfg);
  res.json({ ok: true });
});


// ---------- API: Logo (personalizável) ----------
app.get("/api/logo/meta", async (req, res) => {
  const cfg = await readJSON(CONFIG_FILE, {});
  const hasImage = fs.existsSync(LOGO_FILE);
  res.json({
    ok: true,
    hasImage,
    logoUpdatedAt: cfg?.branding?.logoUpdatedAt || null
  });
});

app.get("/api/logo/image", async (req, res) => {
  if (!fs.existsSync(LOGO_FILE)) return res.status(404).end();
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(LOGO_FILE);
});

app.post("/api/logo/upload", logoUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "arquivo não enviado" });
    if (!(req.file.mimetype || "").startsWith("image/")) {
      return res.status(400).json({ ok: false, error: "arquivo precisa ser imagem" });
    }
    await fsp.writeFile(LOGO_FILE, req.file.buffer);

    const cfg = await readJSON(CONFIG_FILE, {});
    cfg.branding = cfg.branding || {};
    cfg.branding.logoImage = "brand-logo.png";
    cfg.branding.logoUpdatedAt = new Date().toISOString();
    await writeJSONAtomic(CONFIG_FILE, cfg);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/logo/delete", async (req, res) => {
  try {
    if (fs.existsSync(LOGO_FILE)) await fsp.unlink(LOGO_FILE);
    const cfg = await readJSON(CONFIG_FILE, {});
    if (cfg.branding) {
      delete cfg.branding.logoImage;
      delete cfg.branding.logoUpdatedAt;
    }
    await writeJSONAtomic(CONFIG_FILE, cfg);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------- API: Clients ----------
app.get("/api/clients", async (req, res) => {
  const data = await readJSON(CLIENTS_FILE, { clients: [] });
  res.json(data);
});

app.post("/api/clients", async (req, res) => {
  const body = req.body || {};
  const data = await readJSON(CLIENTS_FILE, { clients: [] });

  const client = {
    id: makeId("cli"),
    name: body.name || "Novo cliente",
    doc: body.doc || "",
    email: body.email || "",
    phone: body.phone || "",
    address: body.address || "",
    notes: body.notes || "",
    status: body.status || "negociacao", // negociacao | assinatura | ativo | rescindido
    contractValueCents: Math.max(0, Math.round(Number(body.contractValueCents || 0) || 0)),
    contractMonthlyValues: normalizeContractMonthlyValues(body.contractMonthlyValues),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [] // {id, name, type, filename, path, uploadedAt}
  };

  data.clients.unshift(client);
  await writeJSONAtomic(CLIENTS_FILE, data);
  res.json({ ok: true, client });
});

app.put("/api/clients/:id", async (req, res) => {
  const id = req.params.id;
  const patch = req.body || {};
  const data = await readJSON(CLIENTS_FILE, { clients: [] });

  const idx = data.clients.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Cliente não encontrado" });

  const normalizedPatch = { ...patch };
  if (Object.prototype.hasOwnProperty.call(patch, "contractValueCents")) {
    normalizedPatch.contractValueCents = Math.max(0, Math.round(Number(patch.contractValueCents) || 0));
  }
  if (Object.prototype.hasOwnProperty.call(patch, "contractMonthlyValues")) {
    normalizedPatch.contractMonthlyValues = normalizeContractMonthlyValues(patch.contractMonthlyValues);
  }

  const updated = { ...data.clients[idx], ...normalizedPatch, updatedAt: new Date().toISOString() };
  data.clients[idx] = updated;

  await writeJSONAtomic(CLIENTS_FILE, data);
  res.json({ ok: true, client: updated });
});

app.delete("/api/clients/:id", async (req, res) => {
  const id = req.params.id;
  const data = await readJSON(CLIENTS_FILE, { clients: [] });
  data.clients = data.clients.filter(c => c.id !== id);
  await writeJSONAtomic(CLIENTS_FILE, data);
  res.json({ ok: true });
});

// ---------- API: Contracts ----------
app.get("/api/contracts", async (req, res) => {
  const data = await readJSON(CONTRACTS_FILE, { contracts: [] });
  res.json(data);
});

app.post("/api/contracts", async (req, res) => {
  const body = req.body || {};
  const data = await readJSON(CONTRACTS_FILE, { contracts: [] });

  const contract = {
    id: makeId("ctr"),
    clientId: body.clientId || "",
    title: body.title || "Contrato",
    status: body.status || "rascunho", // rascunho | enviado | assinado | cancelado
    data: body.data || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [] // {id, name, type, filename, uploadedAt}
  };

  data.contracts.unshift(contract);
  await writeJSONAtomic(CONTRACTS_FILE, data);
  res.json({ ok: true, contract });
});

app.put("/api/contracts/:id", async (req, res) => {
  const id = req.params.id;
  const patch = req.body || {};
  const data = await readJSON(CONTRACTS_FILE, { contracts: [] });

  const idx = data.contracts.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Contrato não encontrado" });

  const updated = { ...data.contracts[idx], ...patch, updatedAt: new Date().toISOString() };
  data.contracts[idx] = updated;

  await writeJSONAtomic(CONTRACTS_FILE, data);
  res.json({ ok: true, contract: updated });
});

app.delete("/api/contracts/:id", async (req, res) => {
  const id = req.params.id;
  const data = await readJSON(CONTRACTS_FILE, { contracts: [] });
  data.contracts = data.contracts.filter(c => c.id !== id);
  await writeJSONAtomic(CONTRACTS_FILE, data);
  res.json({ ok: true });
});

// ---------- API: Upload / Download ----------
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const { clientId, contractId, fileType } = req.body;
    if (!clientId) return res.status(400).json({ ok: false, error: "clientId é obrigatório" });
    if (!req.file) return res.status(400).json({ ok: false, error: "arquivo não enviado" });

    const meta = {
      id: makeId("file"),
      name: req.file.originalname,
      type: fileType || "anexo",
      filename: req.file.filename,
      relPath: `uploads/${clientId}/${req.file.filename}`,
      uploadedAt: new Date().toISOString()
    };

    // salva no cliente
    const clientsData = await readJSON(CLIENTS_FILE, { clients: [] });
    const cIdx = clientsData.clients.findIndex(c => c.id === clientId);
    if (cIdx !== -1) {
      clientsData.clients[cIdx].attachments = [meta, ...(clientsData.clients[cIdx].attachments || [])];
      clientsData.clients[cIdx].updatedAt = new Date().toISOString();
      await writeJSONAtomic(CLIENTS_FILE, clientsData);
    }

    // opcional: também associa ao contrato
    if (contractId) {
      const contractsData = await readJSON(CONTRACTS_FILE, { contracts: [] });
      const kIdx = contractsData.contracts.findIndex(c => c.id === contractId);
      if (kIdx !== -1) {
        contractsData.contracts[kIdx].files = [meta, ...(contractsData.contracts[kIdx].files || [])];
        contractsData.contracts[kIdx].updatedAt = new Date().toISOString();
        await writeJSONAtomic(CONTRACTS_FILE, contractsData);
      }
    }

    await recordAudit(req, "file.upload", "file", { clientId, contractId: contractId || null, fileId: meta.id, type: meta.type });

    res.json({ ok: true, file: meta });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/download", async (req, res) => {
  // /api/download?path=uploads/cli_xxx/file.pdf
  const rel = String(req.query.path || "");
  if (!rel) return res.status(400).send("path é obrigatório");
  const abs = path.resolve(WORKSPACE, rel);
  const workspaceRoot = path.resolve(WORKSPACE) + path.sep;
  if (!abs.startsWith(workspaceRoot)) return res.status(400).send("path inválido");
  if (!fs.existsSync(abs)) return res.status(404).send("Arquivo não encontrado");
  res.download(abs);
});


// ---------- API: Finanças ----------
app.get("/api/finance", async (req, res) => {
  const data = await readJSON(FINANCE_FILE, defaultFinanceData());
  res.json(data);
});

app.get("/api/finance/categories", async (req, res) => {
  const data = await readJSON(FINANCE_FILE, defaultFinanceData());
  res.json({ categories: data.categories || [] });
});

app.post("/api/finance/categories", async (req, res) => {
  const body = req.body || {};
  const data = await readJSON(FINANCE_FILE, defaultFinanceData());

  const name = String(body.name || "").trim();
  const color = String(body.color || "").trim() || "#3B82F6";
  const budgetCents = Number(body.budgetCents || 0) || 0;

  if (!name) return res.status(400).json({ ok: false, error: "Nome da categoria é obrigatório" });

  const cat = {
    id: makeId("cat"),
    name,
    color,
    budgetCents: Math.max(0, Math.round(budgetCents))
  };

  data.categories = [cat, ...(data.categories || [])];
  await writeJSONAtomic(FINANCE_FILE, data);
  res.json({ ok: true, category: cat });
});

app.put("/api/finance/categories/:id", async (req, res) => {
  const id = req.params.id;
  const patch = req.body || {};
  const data = await readJSON(FINANCE_FILE, defaultFinanceData());

  const idx = (data.categories || []).findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Categoria não encontrada" });

  const updated = {
    ...data.categories[idx],
    ...patch,
    name: String(patch.name ?? data.categories[idx].name).trim(),
    color: String(patch.color ?? data.categories[idx].color).trim(),
    budgetCents: Math.max(0, Math.round(Number(patch.budgetCents ?? data.categories[idx].budgetCents) || 0))
  };

  data.categories[idx] = updated;
  await writeJSONAtomic(FINANCE_FILE, data);
  res.json({ ok: true, category: updated });
});

app.delete("/api/finance/categories/:id", async (req, res) => {
  const id = req.params.id;
  const data = await readJSON(FINANCE_FILE, defaultFinanceData());

  data.categories = (data.categories || []).filter(c => c.id !== id);
  // "desvincula" despesas da categoria deletada
  data.expenses = (data.expenses || []).map(e => e.categoryId === id ? { ...e, categoryId: "" } : e);

  await writeJSONAtomic(FINANCE_FILE, data);
  res.json({ ok: true });
});

app.get("/api/finance/expenses", async (req, res) => {
  const data = await readJSON(FINANCE_FILE, defaultFinanceData());
  res.json({ expenses: data.expenses || [] });
});

app.post("/api/finance/expenses", async (req, res) => {
  const body = req.body || {};
  const data = await readJSON(FINANCE_FILE, defaultFinanceData());

  const exp = {
    id: makeId("exp"),
    name: String(body.name || "").trim() || "Gasto",
    categoryId: String(body.categoryId || ""),
    amountCents: Math.max(0, Math.round(Number(body.amountCents || 0) || 0)),
    date: String(body.date || "").slice(0, 10), // YYYY-MM-DD
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!exp.date || !/^\d{4}-\d{2}-\d{2}$/.test(exp.date)) {
    return res.status(400).json({ ok: false, error: "Data inválida (use YYYY-MM-DD)" });
  }

  data.expenses = [exp, ...(data.expenses || [])];
  await writeJSONAtomic(FINANCE_FILE, data);
  res.json({ ok: true, expense: exp });
});

app.put("/api/finance/expenses/:id", async (req, res) => {
  const id = req.params.id;
  const patch = req.body || {};
  const data = await readJSON(FINANCE_FILE, defaultFinanceData());

  const idx = (data.expenses || []).findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Gasto não encontrado" });

  const current = data.expenses[idx];
  const updated = {
    ...current,
    ...patch,
    name: String(patch.name ?? current.name).trim(),
    categoryId: String(patch.categoryId ?? current.categoryId),
    amountCents: Math.max(0, Math.round(Number(patch.amountCents ?? current.amountCents) || 0)),
    date: String(patch.date ?? current.date).slice(0, 10),
    updatedAt: new Date().toISOString()
  };

  if (!updated.date || !/^\d{4}-\d{2}-\d{2}$/.test(updated.date)) {
    return res.status(400).json({ ok: false, error: "Data inválida (use YYYY-MM-DD)" });
  }

  data.expenses[idx] = updated;
  await writeJSONAtomic(FINANCE_FILE, data);
  res.json({ ok: true, expense: updated });
});

app.delete("/api/finance/expenses/:id", async (req, res) => {
  const id = req.params.id;
  const data = await readJSON(FINANCE_FILE, defaultFinanceData());

  const exp = (data.expenses || []).find(e => e.id === id);

  data.expenses = (data.expenses || []).filter(e => e.id !== id);
  await writeJSONAtomic(FINANCE_FILE, data);

  // Se este gasto veio de uma conta a pagar, devolve a conta para "pendente"
  if (exp && exp.sourceBillId) {
    const billsData = await readJSON(BILLS_FILE, defaultBillsData());
    const bIdx = (billsData.bills || []).findIndex(b => b.id === exp.sourceBillId);
    if (bIdx !== -1) {
      billsData.bills[bIdx] = {
        ...billsData.bills[bIdx],
        status: "pending",
        paidAt: null,
        paidDate: null,
        expenseId: null,
        updatedAt: new Date().toISOString()
      };
      await writeJSONAtomic(BILLS_FILE, billsData);
    }
  }

  res.json({ ok: true });
});

app.get("/api/finance/settings", async (req, res) => {
  const data = await readJSON(FINANCE_FILE, defaultFinanceData());
  res.json({ settings: data.settings || defaultFinanceData().settings });
});

app.put("/api/finance/settings", async (req, res) => {
  const patch = req.body || {};
  const data = await readJSON(FINANCE_FILE, defaultFinanceData());

  data.settings = {
    ...(data.settings || {}),
    ...patch,
    monthlyBudgetCents: Math.max(0, Math.round(Number(patch.monthlyBudgetCents ?? data.settings?.monthlyBudgetCents) || 0)),
    currency: String(patch.currency ?? data.settings?.currency ?? "BRL")
  };

  await writeJSONAtomic(FINANCE_FILE, data);
  res.json({ ok: true, settings: data.settings });
});
// ---------- API: Contas a pagar ----------
app.get("/api/bills", async (req, res) => {
  const data = await readJSON(BILLS_FILE, defaultBillsData());
  res.json(data);
});

app.post("/api/bills", async (req, res) => {
  const body = req.body || {};
  const billsData = await readJSON(BILLS_FILE, defaultBillsData());

  const bill = {
    id: makeId("bill"),
    name: String(body.name || "").trim() || "Conta",
    categoryId: String(body.categoryId || ""),
    amountCents: Math.max(0, Math.round(Number(body.amountCents || 0) || 0)),
    dueDate: String(body.dueDate || "").slice(0,10),
    status: "pending", // pending | paid
    paidAt: null,
    paidDate: null, // YYYY-MM-DD
    expenseId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!bill.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(bill.dueDate)) {
    return res.status(400).json({ ok: false, error: "Vencimento inválido (use YYYY-MM-DD)" });
  }

  billsData.bills = [bill, ...(billsData.bills || [])];
  await writeJSONAtomic(BILLS_FILE, billsData);
  res.json({ ok: true, bill });
});

async function payBill(billId, paidDateOpt){
  const billsData = await readJSON(BILLS_FILE, defaultBillsData());
  const financeData = await readJSON(FINANCE_FILE, defaultFinanceData());

  const idx = (billsData.bills || []).findIndex(b => b.id === billId);
  if (idx === -1) return { ok:false, status:404, error:"Conta não encontrada" };

  const bill = billsData.bills[idx];
  if (bill.status === "paid" && bill.expenseId) {
    return { ok:true, bill, expenseId: bill.expenseId };
  }

  const paidDate = String(paidDateOpt || todaySaoPauloISO()).slice(0,10);
  if (!paidDate || !/^\d{4}-\d{2}-\d{2}$/.test(paidDate)) {
    return { ok:false, status:400, error:"Data de pagamento inválida" };
  }

  const exp = {
    id: makeId("exp"),
    name: bill.name,
    categoryId: bill.categoryId,
    amountCents: bill.amountCents,
    date: paidDate,
    sourceBillId: bill.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  financeData.expenses = [exp, ...(financeData.expenses || [])];
  await writeJSONAtomic(FINANCE_FILE, financeData);

  billsData.bills[idx] = {
    ...bill,
    status: "paid",
    paidAt: new Date().toISOString(),
    paidDate: paidDate,
    expenseId: exp.id,
    updatedAt: new Date().toISOString()
  };
  await writeJSONAtomic(BILLS_FILE, billsData);

  return { ok:true, bill: billsData.bills[idx], expense: exp };
}

async function unpayBill(billId){
  const billsData = await readJSON(BILLS_FILE, defaultBillsData());
  const financeData = await readJSON(FINANCE_FILE, defaultFinanceData());

  const idx = (billsData.bills || []).findIndex(b => b.id === billId);
  if (idx === -1) return { ok:false, status:404, error:"Conta não encontrada" };

  const bill = billsData.bills[idx];
  if (bill.status !== "paid") {
    return { ok:true, bill };
  }

  // remove o gasto vinculado, se existir e se for realmente desta conta
  if (bill.expenseId) {
    financeData.expenses = (financeData.expenses || []).filter(e => !(e.id === bill.expenseId && e.sourceBillId === bill.id));
    await writeJSONAtomic(FINANCE_FILE, financeData);
  }

  billsData.bills[idx] = {
    ...bill,
    status: "pending",
    paidAt: null,
    paidDate: null,
    expenseId: null,
    updatedAt: new Date().toISOString()
  };
  await writeJSONAtomic(BILLS_FILE, billsData);

  return { ok:true, bill: billsData.bills[idx] };
}

app.put("/api/bills/:id", async (req, res) => {
  const id = req.params.id;
  const patch = req.body || {};
  const billsData = await readJSON(BILLS_FILE, defaultBillsData());

  const idx = (billsData.bills || []).findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Conta não encontrada" });

  const current = billsData.bills[idx];

  // status transitions
  if (patch.status === "paid" && current.status !== "paid") {
    const r = await payBill(id, patch.paidDate);
    if (!r.ok) return res.status(r.status || 400).json({ ok:false, error: r.error });
    return res.json({ ok:true, bill: r.bill, expense: r.expense });
  }
  if (patch.status === "pending" && current.status === "paid") {
    const r = await unpayBill(id);
    if (!r.ok) return res.status(r.status || 400).json({ ok:false, error: r.error });
    return res.json({ ok:true, bill: r.bill });
  }

  const updated = {
    ...current,
    ...patch,
    name: String(patch.name ?? current.name).trim(),
    categoryId: String(patch.categoryId ?? current.categoryId),
    amountCents: Math.max(0, Math.round(Number(patch.amountCents ?? current.amountCents) || 0)),
    dueDate: String(patch.dueDate ?? current.dueDate).slice(0,10),
    updatedAt: new Date().toISOString()
  };

  if (!updated.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(updated.dueDate)) {
    return res.status(400).json({ ok: false, error: "Vencimento inválido (use YYYY-MM-DD)" });
  }

  billsData.bills[idx] = updated;
  await writeJSONAtomic(BILLS_FILE, billsData);
  res.json({ ok: true, bill: updated });
});

app.delete("/api/bills/:id", async (req, res) => {
  const id = req.params.id;
  const billsData = await readJSON(BILLS_FILE, defaultBillsData());

  const bill = (billsData.bills || []).find(b => b.id === id);
  billsData.bills = (billsData.bills || []).filter(b => b.id !== id);
  await writeJSONAtomic(BILLS_FILE, billsData);

  // se tinha gasto vinculado, remove também
  if (bill && bill.status === "paid" && bill.expenseId) {
    const financeData = await readJSON(FINANCE_FILE, defaultFinanceData());
    financeData.expenses = (financeData.expenses || []).filter(e => !(e.id === bill.expenseId && e.sourceBillId === bill.id));
    await writeJSONAtomic(FINANCE_FILE, financeData);
  }

  res.json({ ok: true });
});



// ---------- API: Export / Import ----------

// ---------- API: À Receber ----------
app.get("/api/receivables", async (req, res) => {
  const data = await readJSON(RECEIVABLES_FILE, defaultReceivablesData());
  res.json(data);
});

app.post("/api/receivables", async (req, res) => {
  const body = req.body || {};
  const receivablesData = await readJSON(RECEIVABLES_FILE, defaultReceivablesData());

  const receivable = {
    id: makeId("recv"),
    name: String(body.name || "").trim() || "Cliente",
    categoryId: String(body.categoryId || ""),
    amountCents: Math.max(0, Math.round(Number(body.amountCents || 0) || 0)),
    dueDate: String(body.dueDate || "").slice(0,10),
    status: "pending",
    receivedAt: null,
    receivedDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!receivable.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(receivable.dueDate)) {
    return res.status(400).json({ ok: false, error: "Vencimento inválido (use YYYY-MM-DD)" });
  }

  receivablesData.receivables = [receivable, ...(receivablesData.receivables || [])];
  await writeJSONAtomic(RECEIVABLES_FILE, receivablesData);
  res.json({ ok: true, receivable });
});

async function receiveReceivable(receivableId, receivedDateOpt){
  const receivablesData = await readJSON(RECEIVABLES_FILE, defaultReceivablesData());
  const idx = (receivablesData.receivables || []).findIndex(r => r.id === receivableId);
  if (idx === -1) return { ok:false, status:404, error:"Recebimento não encontrado" };

  const current = receivablesData.receivables[idx];
  if (current.status === "received") return { ok:true, receivable: current };

  const receivedDate = String(receivedDateOpt || todaySaoPauloISO()).slice(0,10);
  if (!receivedDate || !/^\d{4}-\d{2}-\d{2}$/.test(receivedDate)) {
    return { ok:false, status:400, error:"Data de recebimento inválida" };
  }

  receivablesData.receivables[idx] = {
    ...current,
    status: "received",
    receivedAt: new Date().toISOString(),
    receivedDate: receivedDate,
    updatedAt: new Date().toISOString()
  };
  await writeJSONAtomic(RECEIVABLES_FILE, receivablesData);
  return { ok:true, receivable: receivablesData.receivables[idx] };
}

async function unreceiveReceivable(receivableId){
  const receivablesData = await readJSON(RECEIVABLES_FILE, defaultReceivablesData());
  const idx = (receivablesData.receivables || []).findIndex(r => r.id === receivableId);
  if (idx === -1) return { ok:false, status:404, error:"Recebimento não encontrado" };

  const current = receivablesData.receivables[idx];
  if (current.status !== "received") return { ok:true, receivable: current };

  receivablesData.receivables[idx] = {
    ...current,
    status: "pending",
    receivedAt: null,
    receivedDate: null,
    updatedAt: new Date().toISOString()
  };
  await writeJSONAtomic(RECEIVABLES_FILE, receivablesData);
  return { ok:true, receivable: receivablesData.receivables[idx] };
}

app.put("/api/receivables/:id", async (req, res) => {
  const id = req.params.id;
  const patch = req.body || {};
  const receivablesData = await readJSON(RECEIVABLES_FILE, defaultReceivablesData());

  const idx = (receivablesData.receivables || []).findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Recebimento não encontrado" });

  const current = receivablesData.receivables[idx];

  if (patch.status === "received" && current.status !== "received") {
    const r = await receiveReceivable(id, patch.receivedDate);
    if (!r.ok) return res.status(r.status || 400).json({ ok:false, error: r.error });
    return res.json({ ok:true, receivable: r.receivable });
  }
  if (patch.status === "pending" && current.status === "received") {
    const r = await unreceiveReceivable(id);
    if (!r.ok) return res.status(r.status || 400).json({ ok:false, error: r.error });
    return res.json({ ok:true, receivable: r.receivable });
  }

  const updated = {
    ...current,
    ...patch,
    name: String(patch.name ?? current.name).trim(),
    categoryId: String(patch.categoryId ?? current.categoryId),
    amountCents: Math.max(0, Math.round(Number(patch.amountCents ?? current.amountCents) || 0)),
    dueDate: String(patch.dueDate ?? current.dueDate).slice(0,10),
    updatedAt: new Date().toISOString()
  };

  if (!updated.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(updated.dueDate)) {
    return res.status(400).json({ ok: false, error: "Vencimento inválido (use YYYY-MM-DD)" });
  }

  receivablesData.receivables[idx] = updated;
  await writeJSONAtomic(RECEIVABLES_FILE, receivablesData);
  res.json({ ok: true, receivable: updated });
});

app.delete("/api/receivables/:id", async (req, res) => {
  const id = req.params.id;
  const receivablesData = await readJSON(RECEIVABLES_FILE, defaultReceivablesData());
  receivablesData.receivables = (receivablesData.receivables || []).filter(r => r.id !== id);
  await writeJSONAtomic(RECEIVABLES_FILE, receivablesData);
  res.json({ ok: true });
});

app.get("/api/export", async (req, res) => {
  const config = await readJSON(CONFIG_FILE, {});
  const clients = await readJSON(CLIENTS_FILE, { clients: [] });
  const contracts = await readJSON(CONTRACTS_FILE, { contracts: [] });
  const finance = await readJSON(FINANCE_FILE, defaultFinanceData());
  const bills = await readJSON(BILLS_FILE, defaultBillsData());
  const receivables = await readJSON(RECEIVABLES_FILE, defaultReceivablesData());
  const tasks = await readJSON(TASKS_FILE, defaultTasksData());

  const uploadedFiles = [];
  async function collectUploads(dir){
    if (!fs.existsSync(dir)) return;
    const entries = await fsp.readdir(dir, { withFileTypes:true });
    for (const entry of entries){
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await collectUploads(abs);
      } else if (entry.isFile()) {
        const stat = await fsp.stat(abs);
        uploadedFiles.push({
          path: path.relative(WORKSPACE, abs).replace(/\\/g, "/"),
          sizeBytes: stat.size,
          updatedAt: stat.mtime.toISOString()
        });
      }
    }
  }
  await collectUploads(UPLOADS);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: "1.1.0",
    note: "Backup JSON completo dos dados estruturados. Arquivos binários enviados permanecem no diretório workspace/uploads e aparecem em uploadedFiles.",
    config,
    clients,
    contracts,
    finance,
    bills,
    receivables,
    tasks,
    uploadedFiles
  };

  await recordAudit(req, "workspace.export", "backup", { uploadedFiles: uploadedFiles.length });
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="backup_hrzn_sphere_${Date.now()}.json"`);
  res.send(JSON.stringify(payload, null, 2));
});

app.post("/api/import", async (req, res) => {
  const payload = req.body || {};
  if (!payload.config || !payload.clients || !payload.contracts) {
    return res.status(400).json({ ok: false, error: "Backup inválido" });
  }
  await writeJSONAtomic(CONFIG_FILE, payload.config);
  await writeJSONAtomic(CLIENTS_FILE, payload.clients);
  await writeJSONAtomic(CONTRACTS_FILE, payload.contracts);
  await writeJSONAtomic(FINANCE_FILE, payload.finance || defaultFinanceData());
  await writeJSONAtomic(BILLS_FILE, payload.bills || defaultBillsData());
  await writeJSONAtomic(RECEIVABLES_FILE, payload.receivables || defaultReceivablesData());
  await writeJSONAtomic(TASKS_FILE, payload.tasks || defaultTasksData());
  await recordAudit(req, "workspace.import", "backup", { version: payload.version || null });
  res.json({ ok: true });
});



// ---------- API: Tarefas ----------
app.get("/api/tasks", async (req, res) => {
  const data = await readJSON(TASKS_FILE, defaultTasksData());
  res.json(data);
});

app.put("/api/tasks", async (req, res) => {
  const body = req.body || {};
  // valida minimamente
  const data = {
    meta: body.meta || defaultTasksData().meta,
    tasks: Array.isArray(body.tasks) ? body.tasks : []
  };
  await writeJSONAtomic(TASKS_FILE, data);
  res.json({ ok: true });
});

app.post("/api/tasks/task", async (req, res) => {
  const body = req.body || {};
  const data = await readJSON(TASKS_FILE, defaultTasksData());

  const task = {
    id: makeId("tsk"),
    title: String(body.title || "Nova tarefa").trim() || "Nova tarefa",
    description: String(body.description || ""),
    statusId: String(body.statusId || "st_todo"),
    priorityId: String(body.priorityId || "pr_med"),
    assignee: String(body.assignee || ""),
    dueDate: String(body.dueDate || ""),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: Array.isArray(body.subtasks) ? body.subtasks : [],
    comments: Array.isArray(body.comments) ? body.comments : [],
    updates: Array.isArray(body.updates) ? body.updates : []
  };

  data.tasks = [task, ...(data.tasks || [])];
  await writeJSONAtomic(TASKS_FILE, data);
  res.json({ ok: true, task });
});

app.put("/api/tasks/task/:id", async (req, res) => {
  const id = req.params.id;
  const patch = req.body || {};
  const data = await readJSON(TASKS_FILE, defaultTasksData());

  const idx = (data.tasks || []).findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Tarefa não encontrada" });

  const updated = {
    ...data.tasks[idx],
    ...patch,
    title: String(patch.title ?? data.tasks[idx].title).trim(),
    updatedAt: new Date().toISOString()
  };

  data.tasks[idx] = updated;
  await writeJSONAtomic(TASKS_FILE, data);
  res.json({ ok: true, task: updated });
});

app.delete("/api/tasks/task/:id", async (req, res) => {
  const id = req.params.id;
  const data = await readJSON(TASKS_FILE, defaultTasksData());
  data.tasks = (data.tasks || []).filter(t => t.id !== id);
  await writeJSONAtomic(TASKS_FILE, data);
  res.json({ ok: true });
});


// ---------- API: Reset ----------
app.post("/api/reset", async (req, res) => {
  const keepConfig = Boolean(req.query.keepConfig === "1");
  if (!keepConfig) {
    await writeJSONAtomic(CONFIG_FILE, {
      company: { tradeName: "", legalName: "", cnpj: "", addressLine: "", neighborhood: "", city: "", state: "", zip: "", email: "", phone: "", representativeName: "", representativeRole: "" },
      branding: { accent: "#2563EB", companyShort: "HRZN", theme: "dark" }
    });
  }
  await writeJSONAtomic(CLIENTS_FILE, { clients: [] });
  await writeJSONAtomic(CONTRACTS_FILE, { contracts: [] });
  await writeJSONAtomic(FINANCE_FILE, defaultFinanceData());
  await writeJSONAtomic(BILLS_FILE, defaultBillsData());
  await writeJSONAtomic(RECEIVABLES_FILE, defaultReceivablesData());
  await writeJSONAtomic(TASKS_FILE, defaultTasksData());
  await recordAudit(req, "workspace.reset", "workspace", { keepConfig });
  res.json({ ok: true });
});

// SPA fallback (para recarregar em qualquer rota)
app.get("*", (req, res) => {
  res.sendFile(path.join(ROOT, "public", "index.html"));
});

bootstrap().then(() => {
  app.listen(PORT, () => {
    console.log(`HRZN Sphere rodando em http://localhost:${PORT}`);
    console.log(`📁 Workspace: ${WORKSPACE}`);
  });
});

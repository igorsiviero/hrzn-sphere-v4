
/* HRZN Sphere - interface web */

const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

async function apiFetch(url, options={}){
  const opts = { ...options, credentials: "same-origin" };
  const headers = { ...(options.headers || {}) };
  const hasBody = Object.prototype.hasOwnProperty.call(options, "body");
  if (hasBody && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  opts.headers = headers;
  const response = await fetch(url, opts);
  if (response.status === 401 && !url.startsWith("/api/auth/")){
    if (typeof state !== "undefined"){
      state.auth = { checked: true, authenticated: false, needsSetup: false, user: null };
      try{ render(); }catch{}
    }
  }
  return response;
}

async function jsonFetch(url, options={}){
  const response = await apiFetch(url, options);
  const data = await response.json().catch(()=>({ ok:false, error:"Resposta inválida do servidor" }));
  if (!response.ok && data.ok !== false) data.ok = false;
  return data;
}

const api = {
  // Autenticação
  async getAuthStatus(){ return jsonFetch("/api/auth/status"); },
  async setupAdmin(payload){ return jsonFetch("/api/auth/setup", { method:"POST", body: JSON.stringify(payload) }); },
  async login(payload){ return jsonFetch("/api/auth/login", { method:"POST", body: JSON.stringify(payload) }); },
  async logout(){ return jsonFetch("/api/auth/logout", { method:"POST" }); },
  async listUsers(){ return jsonFetch("/api/users"); },
  async createUser(payload){ return jsonFetch("/api/users", { method:"POST", body: JSON.stringify(payload) }); },
  async updateUser(id, patch){ return jsonFetch(`/api/users/${id}`, { method:"PUT", body: JSON.stringify(patch) }); },
  async deleteUser(id){ return jsonFetch(`/api/users/${id}`, { method:"DELETE" }); },
  async getAudit(){ return jsonFetch("/api/audit"); },

  async getConfig(){ return jsonFetch("/api/config"); },
  async saveConfig(cfg){ return jsonFetch("/api/config", { method:"PUT", body: JSON.stringify(cfg) }); },

  async getClients(){ return jsonFetch("/api/clients"); },
  async createClient(payload){ return jsonFetch("/api/clients", { method:"POST", body: JSON.stringify(payload) }); },
  async updateClient(id, patch){ return jsonFetch(`/api/clients/${id}`, { method:"PUT", body: JSON.stringify(patch) }); },
  async deleteClient(id){ return jsonFetch(`/api/clients/${id}`, { method:"DELETE" }); },

  async getContracts(){ return jsonFetch("/api/contracts"); },
  async createContract(payload){ return jsonFetch("/api/contracts", { method:"POST", body: JSON.stringify(payload) }); },
  async updateContract(id, patch){ return jsonFetch(`/api/contracts/${id}`, { method:"PUT", body: JSON.stringify(patch) }); },
  async deleteContract(id){ return jsonFetch(`/api/contracts/${id}`, { method:"DELETE" }); },

  // Finanças
  async getFinance(){ return jsonFetch("/api/finance"); },
  async getFinanceCategories(){ return jsonFetch("/api/finance/categories"); },
  async createFinanceCategory(payload){ return jsonFetch("/api/finance/categories", { method:"POST", body: JSON.stringify(payload) }); },
  async updateFinanceCategory(id, patch){ return jsonFetch(`/api/finance/categories/${id}`, { method:"PUT", body: JSON.stringify(patch) }); },
  async deleteFinanceCategory(id){ return jsonFetch(`/api/finance/categories/${id}`, { method:"DELETE" }); },
  async createExpense(payload){ return jsonFetch("/api/finance/expenses", { method:"POST", body: JSON.stringify(payload) }); },
  async updateExpense(id, patch){ return jsonFetch(`/api/finance/expenses/${id}`, { method:"PUT", body: JSON.stringify(patch) }); },
  async deleteExpense(id){ return jsonFetch(`/api/finance/expenses/${id}`, { method:"DELETE" }); },
  async updateFinanceSettings(patch){ return jsonFetch("/api/finance/settings", { method:"PUT", body: JSON.stringify(patch) }); },

  async exportBackup(){
    const r = await apiFetch("/api/export");
    return r.blob();
  },
  async importBackup(payload){ return jsonFetch("/api/import", { method:"POST", body: JSON.stringify(payload) }); },
  async resetAll(keepConfig=false){ return jsonFetch(`/api/reset?keepConfig=${keepConfig?1:0}`, { method:"POST" }); },

  async uploadFile({clientId, contractId, fileType, file}){
    const fd = new FormData();
    fd.append("clientId", clientId);
    if (contractId) fd.append("contractId", contractId);
    if (fileType) fd.append("fileType", fileType);
    fd.append("file", file);
    return jsonFetch("/api/upload", { method:"POST", body: fd });
  },

  async getLogoMeta(){ return jsonFetch("/api/logo/meta"); },
  async uploadLogoImage(blob){
    const fd = new FormData();
    fd.append("file", blob, "brand-logo.png");
    return jsonFetch("/api/logo/upload", { method:"POST", body: fd });
  },
  async deleteLogoImage(){ return jsonFetch("/api/logo/delete", { method:"POST" }); },

  // Contas a pagar
  async getBills(){ return jsonFetch("/api/bills"); },
  async createBill(payload){ return jsonFetch("/api/bills", { method:"POST", body: JSON.stringify(payload) }); },
  async updateBill(id, patch){ return jsonFetch(`/api/bills/${id}`, { method:"PUT", body: JSON.stringify(patch) }); },
  async deleteBill(id){ return jsonFetch(`/api/bills/${id}`, { method:"DELETE" }); },

  // À Receber
  async getReceivables(){ return jsonFetch("/api/receivables"); },
  async createReceivable(payload){ return jsonFetch("/api/receivables", { method:"POST", body: JSON.stringify(payload) }); },
  async updateReceivable(id, patch){ return jsonFetch(`/api/receivables/${id}`, { method:"PUT", body: JSON.stringify(patch) }); },
  async deleteReceivable(id){ return jsonFetch(`/api/receivables/${id}`, { method:"DELETE" }); },

  // Tarefas
  async getTasks(){ return jsonFetch("/api/tasks"); },
  async saveTasks(data){ return jsonFetch("/api/tasks", { method:"PUT", body: JSON.stringify(data) }); },
  async createTask(payload){ return jsonFetch("/api/tasks/task", { method:"POST", body: JSON.stringify(payload) }); },
  async updateTask(id, patch){ return jsonFetch(`/api/tasks/task/${id}`, { method:"PUT", body: JSON.stringify(patch) }); },
  async deleteTask(id){ return jsonFetch(`/api/tasks/task/${id}`, { method:"DELETE" }); }
};

const STATUS = [
  { key: "negociacao", label: "Em negociação" },
  { key: "assinatura", label: "Aguardando assinatura" },
  { key: "ativo", label: "Ativo" },
  { key: "rescindido", label: "Rescindido" },
];

const CONTRACT_STATUS = [
  { key: "rascunho", label: "Rascunho" },
  { key: "enviado", label: "Enviado" },
  { key: "assinado", label: "Assinado" },
  { key: "cancelado", label: "Cancelado" },
];

const state = {
  route: "dashboard",
  auth: { checked: false, authenticated: false, needsSetup: false, user: null },
  users: null,
  auditEvents: null,
  q: "",
  config: null,
  clients: [],
  contracts: [],
  finance: { settings: { monthlyBudgetCents: 0, currency: "BRL" }, categories: [], expenses: [] },
  financeFilter: { year: null, month: null },
  bills: [],
  billsFilter: { year: null, month: null, view: "pending" },
  receivables: [],
  receivablesFilter: { year: null, month: null, view: "pending" },

  tasksData: { meta: { statuses: [], priorities: [] }, tasks: [] },
  tasksFilter: { view: "all" },

  busy: false,
};


function getNavOpenMap(){
  try{
    return JSON.parse(localStorage.getItem("navOpen") || "{}") || {};
  }catch{
    return {};
  }
}
function setNavGroupOpen(groupKey, isOpen){
  const map = getNavOpenMap();
  map[groupKey] = Boolean(isOpen);
  try{
    localStorage.setItem("navOpen", JSON.stringify(map));
  }catch{}
}
function toggleNavGroup(groupKey){
  const el = document.querySelector(`.nav__group[data-group="${groupKey}"]`);
  if (!el) return;
  const isOpen = !el.classList.contains("is-open");
  setNavGroupOpen(groupKey, isOpen);
  el.classList.toggle("is-open", isOpen);
}


function fmtDate(iso){
  if (!iso) return "-";
  const s = String(iso);
  // 
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)){
    const [y,m,d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  try{
    const d = new Date(s);
    return d.toLocaleDateString("pt-BR",{year:"numeric", month:"2-digit", day:"2-digit"});
  }catch{ return "-"; }
}
function fmtDateTime(iso){
  if (!iso) return "-";
  try{
    const d = new Date(iso);
    return d.toLocaleString("pt-BR",{year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit"});
  }catch{ return "-"; }
}

function todayISO(){
  try{ return new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo"}).format(new Date()); }
  catch{ return new Date().toISOString().slice(0,10); }
}
function fmtMoney(cents){
  const v = Number(cents||0)/100;
  try{ return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }
  catch{ return `R$ ${v.toFixed(2)}`; }
}
function parseMoneyToCents(input){
  const s = String(input||"").trim();
  if (!s) return 0;
  // aceita "1234,56" "1.234,56" "1234.56"
  const cleaned = s.replace(/[^0-9,.-]/g,"");
  // se tiver vírgula, ela é decimal
  let norm = cleaned;
  const hasComma = norm.includes(",");
  if (hasComma){
    norm = norm.replace(/\./g,"").replace(",", ".");
  }
  const n = Number(norm);
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.round(n*100));
}

function centsToInput(cents){
  const v = Number(cents||0)/100;
  try{ return v.toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); }
  catch{ return String(v.toFixed(2)).replace(".", ","); }
}

function escapeHtml(s){
  return String(s??"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}


function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function makeId(prefix="id"){
  const rnd = Math.random().toString(36).slice(2,8);
  return `${prefix}_${Date.now().toString(36)}_${rnd}`;
}

function hexToRgb(hex){
  const h = String(hex||"").trim().replace("#","");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0,2),16);
  const g = parseInt(h.slice(2,4),16);
  const b = parseInt(h.slice(4,6),16);
  return {r,g,b};
}
function rgbToHex({r,g,b}){
  const to = (x)=> x.toString(16).padStart(2,"0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}
function mixToWhite(rgb, t){
  return { r: Math.round(rgb.r + (255-rgb.r)*t), g: Math.round(rgb.g + (255-rgb.g)*t), b: Math.round(rgb.b + (255-rgb.b)*t) };
}
function mixToBlack(rgb, t){
  return { r: Math.round(rgb.r*(1-t)), g: Math.round(rgb.g*(1-t)), b: Math.round(rgb.b*(1-t)) };
}
function setAccentVars(accentHex){
  const rgb = hexToRgb(accentHex) || {r:37,g:99,b:235};
  const hi = rgbToHex(mixToWhite(rgb, 0.18));
  const lo = rgbToHex(mixToBlack(rgb, 0.12));

  const root = document.documentElement.style;
  root.setProperty("--accent", rgbToHex(rgb));
  root.setProperty("--accent-hi", hi);
  root.setProperty("--accent-lo", lo);
  root.setProperty("--accent-08", `rgba(${rgb.r},${rgb.g},${rgb.b},.08)`);
  root.setProperty("--accent-12", `rgba(${rgb.r},${rgb.g},${rgb.b},.12)`);
  root.setProperty("--accent-18", `rgba(${rgb.r},${rgb.g},${rgb.b},.18)`);
  root.setProperty("--accent-24", `rgba(${rgb.r},${rgb.g},${rgb.b},.24)`);
  root.setProperty("--accent-35", `rgba(${rgb.r},${rgb.g},${rgb.b},.35)`);
  root.setProperty("--accent-45", `rgba(${rgb.r},${rgb.g},${rgb.b},.45)`);
  root.setProperty("--accent-55", `rgba(${rgb.r},${rgb.g},${rgb.b},.55)`);
  root.setProperty("--accent-75", `rgba(${rgb.r},${rgb.g},${rgb.b},.75)`);
}

function normalizePhone(phone){
  const digits = String(phone||"").replace(/\D/g,"");
  if (!digits) return "";
  // Heurística Brasil: se vier com 10/11 dígitos, prefixa 55.
  if ((digits.length===10 || digits.length===11) && !digits.startsWith("55")) return "55"+digits;
  return digits;
}
function makeWhatsAppLink(phone, clientName){
  const num = normalizePhone(phone);
  if (!num) return "";
  const company = state.config?.company?.tradeName || state.config?.branding?.companyShort || "Empresa";
  const msg = `Olá, ${clientName||""}! Tudo bem? Aqui é da ${company}.`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

function getInitials(){
  const short = (state.config?.branding?.companyShort || state.config?.company?.tradeName || "HRZN").trim();
  const clean = short.replace(/\s+/g," ").slice(0,16);
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.replace(/[^A-Za-z0-9]/g,"").slice(0,4).toUpperCase() || "HRZN";
}

function applyTheme(theme){
  const t = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = t;
  try{ localStorage.setItem("theme", t); }catch{}
}

function applyPrivacy(on){
  const v = on ? "on" : "off";
  document.documentElement.dataset.privacy = v;
  try{ localStorage.setItem("privacy", v); }catch{}
}

async function refreshBrandLogo(){
  const img = $("#brandLogo");
  if (!img) return;
  const fallback = "assets/logo.svg";
  try{
    const meta = await api.getLogoMeta();
    if (meta?.ok && meta?.hasImage){
      const ts = encodeURIComponent(meta.logoUpdatedAt || Date.now());
      img.src = `/api/logo/image?ts=${ts}`;
    }else{
      img.src = fallback;
    }
  }catch{
    img.src = fallback;
  }
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toast(msg, type="ok"){
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  Object.assign(t.style, {
    position:"fixed", right:"18px", bottom:"18px", zIndex:99,
    padding:"10px 12px", borderRadius:"14px",
    border:"1px solid rgba(255,255,255,.18)",
    background: type==="ok" ? "rgba(16,185,129,.18)" : type==="warn" ? "rgba(245,158,11,.18)" : "rgba(248,113,113,.18)",
    color:"rgba(255,255,255,.92)",
    boxShadow:"0 14px 40px rgba(0,0,0,.35)"
  });
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.opacity="0"; t.style.transition="opacity .25s"; }, 1800);
  setTimeout(()=>t.remove(), 2200);
}

function applyBranding(){
  const accent = state.config?.branding?.accent || "#2563EB";
  setAccentVars(accent);

  const theme = state.config?.branding?.theme || (localStorage.getItem("theme") || "dark");
  applyTheme(theme);

  $("#brandName").textContent = state.config?.branding?.companyShort ? `${state.config.branding.companyShort}` : "HRZN Sphere";
  $("#brandSub").textContent = "HRZN Sphere";
}

function setRoute(route){
  state.route = route;
  window.location.hash = route;
  render();
}

function setActiveNav(){
  // Ativa item atual
  $$(".nav__item[data-route], .nav__subitem").forEach(btn=>{
    btn.classList.toggle("is-active", btn.dataset.route === state.route);
  });

  // Grupos: marca header ativo e controla abrir/fechar
  const openMap = getNavOpenMap();

  $$(".nav__group").forEach(group=>{
    const key = group.dataset.group;
    const isChildActive = Boolean(group.querySelector(`[data-route="${state.route}"]`)) || (key === "clients" && isClientRoute());
    const shouldOpen = isChildActive || Boolean(openMap[key]);

    group.classList.toggle("is-open", shouldOpen);

    const header = group.querySelector(`[data-group-toggle="${key}"]`);
    header?.classList.toggle("is-active", isChildActive);
  });
}

function filteredClients(){
  const q = state.q.trim().toLowerCase();
  if (!q) return state.clients;
  return state.clients.filter(c => (
    (c.name||"").toLowerCase().includes(q) ||
    (c.email||"").toLowerCase().includes(q) ||
    (c.doc||"").toLowerCase().includes(q) ||
    (c.phone||"").toLowerCase().includes(q)
  ));
}
function filteredContracts(){
  const q = state.q.trim().toLowerCase();
  if (!q) return state.contracts;
  return state.contracts.filter(k => (
    (k.title||"").toLowerCase().includes(q) ||
    (getClientName(k.clientId)||"").toLowerCase().includes(q) ||
    (k.status||"").toLowerCase().includes(q)
  ));
}

function getClientById(id){ return state.clients.find(c=>c.id===id); }
function getContractById(id){ return state.contracts.find(c=>c.id===id); }
function getClientName(id){ return getClientById(id)?.name || "—"; }

const CLIENT_ROUTE_PREFIX = "client/";
function clientRoute(clientId){ return `${CLIENT_ROUTE_PREFIX}${clientId}`; }
function isClientRoute(route = state.route){ return String(route || "").startsWith(CLIENT_ROUTE_PREFIX); }
function clientIdFromRoute(route = state.route){ return isClientRoute(route) ? String(route).slice(CLIENT_ROUTE_PREFIX.length) : null; }
function currentYearMonth(){ return todayISO().slice(0,7); }
function labelFromYearMonth(key){
  const s = String(key || "");
  if (!/^\d{4}-\d{2}$/.test(s)) return s || "—";
  const y = s.slice(0,4);
  const m = Number(s.slice(5,7));
  return `${MONTHS[m-1] || "—"} • ${y}`;
}
function latestContractForClient(clientId){
  return state.contracts
    .filter(k => k.clientId === clientId)
    .slice()
    .sort((a,b)=> String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")))[0] || null;
}
function fallbackContractValueCentsForClient(clientId){
  const latest = latestContractForClient(clientId);
  const raw = latest?.data?.total_value;
  return raw ? parseMoneyToCents(raw) : 0;
}
function clientHasMonthlyContractValue(client, yearMonth = currentYearMonth()){
  return Boolean(client && client.contractMonthlyValues && Object.prototype.hasOwnProperty.call(client.contractMonthlyValues, yearMonth));
}
function getClientBaseContractValueCents(client){
  if (!client) return 0;
  if (Object.prototype.hasOwnProperty.call(client, "contractValueCents") && client.contractValueCents != null) {
    return Math.max(0, Math.round(Number(client.contractValueCents) || 0));
  }
  return fallbackContractValueCentsForClient(client.id);
}
function getClientContractValueCents(client, yearMonth = currentYearMonth()){
  if (!client) return 0;
  if (clientHasMonthlyContractValue(client, yearMonth)) {
    return Math.max(0, Math.round(Number(client.contractMonthlyValues?.[yearMonth]) || 0));
  }
  return getClientBaseContractValueCents(client);
}
function statusLabel(key){ return STATUS.find(s=>s.key===key)?.label || key; }
function contractStatusLabel(key){ return CONTRACT_STATUS.find(s=>s.key===key)?.label || key; }

async function loadAll(){
  state.busy = true;
  const [cfg, clientsData, contractsData, financeData, billsData, receivablesData, tasksData] = await Promise.all([
    api.getConfig(),
    api.getClients(),
    api.getContracts(),
    api.getFinance(),
    api.getBills(),
    api.getReceivables(),
    api.getTasks()
  ]);
  state.config = cfg;
  state.clients = clientsData.clients || [];
  state.contracts = contractsData.contracts || [];
  state.finance = financeData || { settings:{monthlyBudgetCents:0,currency:'BRL'}, categories:[], expenses:[] };
  state.bills = (billsData?.bills || []);
  state.receivables = (receivablesData?.receivables || []);
  state.tasksData = tasksData || state.tasksData;
  applyBranding();
  await refreshBrandLogo();
  $("#pillClients").textContent = state.clients.length;
  $("#pillContracts").textContent = state.contracts.length;
  // inicializa filtro (mês/ano)
  if (!state.financeFilter.year || !state.financeFilter.month){
    const now = new Date();
    state.financeFilter.year = now.getFullYear();
    state.financeFilter.month = now.getMonth()+1;
    try{
      const saved = JSON.parse(localStorage.getItem('financeFilter')||'null');
      if (saved?.year) state.financeFilter.year = saved.year;
      if (saved?.month) state.financeFilter.month = saved.month;
    }catch{}
  }


  // inicializa filtro de contas a pagar (mês/ano/visão)
  if (state.billsFilter.year == null || state.billsFilter.month == null){
    const now2 = new Date();
    state.billsFilter.year = now2.getFullYear();
    state.billsFilter.month = now2.getMonth()+1;
    state.billsFilter.view = "pending";
    try{
      const savedB = JSON.parse(localStorage.getItem('billsFilter')||'null');
      const y = Number(savedB?.year);
      const mo = Number(savedB?.month);
      if (Number.isFinite(y)) state.billsFilter.year = y;
      if (Number.isFinite(mo) && mo >= 0 && mo <= 12) state.billsFilter.month = mo;
      if (savedB?.view) state.billsFilter.view = savedB.view;
    }catch{}
  }

  // inicializa filtro de à receber (mês/ano/visão)
  if (state.receivablesFilter.year == null || state.receivablesFilter.month == null){
    const now3 = new Date();
    state.receivablesFilter.year = now3.getFullYear();
    state.receivablesFilter.month = now3.getMonth()+1;
    state.receivablesFilter.view = "pending";
    try{
      const savedR = JSON.parse(localStorage.getItem('receivablesFilter')||'null');
      const y = Number(savedR?.year);
      const mo = Number(savedR?.month);
      if (Number.isFinite(y)) state.receivablesFilter.year = y;
      if (Number.isFinite(mo) && mo >= 0 && mo <= 12) state.receivablesFilter.month = mo;
      if (savedR?.view) state.receivablesFilter.view = savedR.view;
    }catch{}
  }

  state.busy = false;
}

function renderTopActions(){
  const el = $("#topActions");
  el.innerHTML = "";

  const addBtn = (label, onClick, variant="btn btn--primary") => {
    const b = document.createElement("button");
    b.className = variant;
    b.textContent = label;
    b.addEventListener("click", onClick);
    el.appendChild(b);
  };

  if (state.route === "clients" || state.route === "crm" || state.route === "dashboard"){
    addBtn("+ Cliente", () => openClientEditor());
  }
  if (state.route === "contracts" || state.route === "dashboard"){
    addBtn("+ Contrato", () => openContractEditor());
  }
  if (state.route === "finance"){
    addBtn("+ Gasto", () => openExpenseEditor());
    addBtn("Categorias", () => openCategoryManager(), "btn btn--ghost");
  }
  if (state.route === "bills"){
    addBtn("+ Conta", () => openBillEditor());
    addBtn("Categorias", () => openCategoryManager(), "btn btn--ghost");
    addBtn("Ir para Finanças", () => setRoute("finance"), "btn btn--ghost");
  }
  if (state.route === "receivables"){
    addBtn("+ Cliente", () => openReceivableEditor());
    addBtn("Categorias", () => openCategoryManager(), "btn btn--ghost");
    addBtn("Ir para Finanças", () => setRoute("finance"), "btn btn--ghost");
  }
  if (state.route === "tasks"){
    addBtn("+ Tarefa", () => openTaskEditor());
    addBtn("Status", () => openStatusManager(), "btn btn--ghost");
    addBtn("Prioridades", () => openPriorityManager(), "btn btn--ghost");
  }
  if (isClientRoute()){
    const client = getClientById(clientIdFromRoute());
    addBtn("← Clientes", () => setRoute("clients"), "btn btn--ghost");
    if (client) addBtn("Editar cliente", () => openClientEditor(client), "btn btn--ghost");
    if (client) addBtn("+ Contrato", () => openContractEditor({ clientId: client.id }));
  }
  if (state.route === "settings"){
    addBtn("Salvar", () => saveSettingsFromView(), "btn btn--primary");
  }

  if (state.auth?.authenticated){
    const user = document.createElement("div");
    user.className = "user-chip";
    user.innerHTML = `<strong>${escapeHtml(state.auth.user?.name || "Usuário")}</strong><span>${escapeHtml(roleLabel(state.auth.user?.role))}</span>`;
    el.appendChild(user);
    addBtn("Sair", logout, "btn btn--ghost");
  }
}

function setHeader(crumb, hint){
  $("#crumb").textContent = crumb;
  $("#hint").textContent = hint;
}

function render(){
  setActiveNav();
  renderTopActions();

  const content = $("#content");
  content.innerHTML = "";

  if (!state.auth?.checked){
    setHeader("Inicializando", "Validando sessão.");
    content.appendChild(card("Carregando…", `<div class="muted">Conferindo acesso…</div>`));
    return;
  }

  if (!state.auth?.authenticated){
    setHeader(state.auth?.needsSetup ? "Configuração inicial" : "Login", "Entre para continuar.");
    content.appendChild(renderAuthGate());
    return;
  }

  if (state.busy){
    content.appendChild(card("Carregando…", `<div class="muted">Carregando workspace…</div>`));
    return;
  }

  if (state.route === "dashboard"){
    setHeader("Visão geral", "Resumo operacional e indicadores.");
    content.appendChild(renderDashboard());
    return;
  }
  if (state.route === "clients"){
    setHeader("Lista de clientes", "Cadastro, contratos, contato e status.");
    content.appendChild(renderClients());
    return;
  }
  if (isClientRoute()){
    const client = getClientById(clientIdFromRoute());
    setHeader(client ? client.name : "Cliente", "Cadastro, histórico e arquivos.");
    content.appendChild(renderClientPage(clientIdFromRoute()));
    return;
  }
  if (state.route === "crm"){
    setHeader("CRM", "Pipeline comercial em kanban.");
    content.appendChild(renderCRM());
    return;
  }
  if (state.route === "contracts"){
    setHeader("Contratos", "Modelo, PDF, assinatura e anexos.");
    content.appendChild(renderContracts());
    return;
  }
  if (state.route === "finance"){
    setHeader("Controle de gastos", "Gastos por mês, categorias, gráficos e alertas.");
    content.appendChild(renderFinance());
    return;
  }
  if (state.route === "bills"){
    setHeader("Contas a pagar", "Vencimentos, status e baixa de pagamentos.");
    content.appendChild(renderBills());
    return;
  }
  if (state.route === "receivables"){
    setHeader("A receber", "Recebimentos por cliente, vencimento e status.");
    content.appendChild(renderReceivables());
    return;
  }
  if (state.route === "tasks"){
    setHeader("Tarefas", "Prazos, responsáveis e prioridades.");
    content.appendChild(renderTasks());
    return;
  }
  if (state.route === "settings"){
    setHeader("Configurações", "Empresa, marca, usuários e acessos.");
    content.appendChild(renderSettings());
    return;
  }

}

/* ---------- UI Helpers ---------- */
function card(title, bodyHtml, footerHtml=""){
  const wrap = document.createElement("div");
  wrap.className = "card";
  wrap.innerHTML = `
    <div class="card__hd">
      <div class="card__title">${escapeHtml(title)}</div>
      <div></div>
    </div>
    <div class="card__bd">${bodyHtml}</div>
    ${footerHtml ? `<div class="card__ft">${footerHtml}</div>` : ""}
  `;
  return wrap;
}

function tag(label, isAccent=false){
  return `<span class="tag ${isAccent?'is-accent':''}"><span class="tag__dot"></span>${escapeHtml(label)}</span>`;
}

function emptyState(title, desc, ctaLabel, ctaFn){
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `
    <div class="card__bd">
      <div style="font-weight:950; font-size:18px">${escapeHtml(title)}</div>
      <div class="muted" style="margin-top:6px">${escapeHtml(desc)}</div>
      <div style="margin-top:14px">
        <button class="btn btn--primary">${escapeHtml(ctaLabel)}</button>
      </div>
    </div>
  `;
  $("button", el).addEventListener("click", ctaFn);
  return el;
}


/* ---------- Autenticação ---------- */
function roleLabel(role){
  return ({ admin:"Administrador", manager:"Gestor", member:"Operador" })[role] || role || "Operador";
}
function isAdmin(){ return state.auth?.user?.role === "admin"; }

async function refreshAuth(){
  const res = await api.getAuthStatus();
  state.auth = {
    checked: true,
    authenticated: Boolean(res.authenticated),
    needsSetup: Boolean(res.needsSetup),
    user: res.user || null
  };
  return state.auth;
}

function renderAuthGate(){
  const wrap = document.createElement("div");
  wrap.className = "auth-shell";
  const setup = Boolean(state.auth?.needsSetup);
  wrap.innerHTML = `
    <div class="auth-card card">
      <div class="card__hd">
        <div>
          <div class="card__title">${setup ? "Configuração inicial" : "Entrar no HRZN Sphere"}</div>
          <div class="muted" style="margin-top:4px">${setup ? "Cadastre o primeiro administrador do workspace." : "Acesse com seu usuário cadastrado."}</div>
        </div>
        <span class="tag is-accent"><span class="tag__dot"></span>Acesso protegido</span>
      </div>
      <div class="card__bd">
        <div class="auth-note">
          ${setup
            ? "Nenhum usuário ativo foi encontrado. Depois deste cadastro, o acesso aos dados exigirá login."
            : "Sessão protegida. Os dados permanecem no workspace local do projeto."}
        </div>
        <form class="form auth-form" id="authForm">
          ${setup ? `<div class="field"><label>Nome do administrador</label><input id="authName" autocomplete="name" placeholder="Seu nome"/></div>` : ""}
          <div class="field"><label>E-mail</label><input id="authEmail" type="email" autocomplete="email" placeholder="email@dominio.com.br"/></div>
          <div class="field"><label>Senha</label><input id="authPassword" type="password" autocomplete="current-password" placeholder="Mínimo de 8 caracteres"/></div>
          <button class="btn btn--primary" type="submit">${setup ? "Criar administrador" : "Entrar"}</button>
        </form>
      </div>
    </div>
  `;
  setTimeout(()=>{
    $("#authForm")?.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const payload = {
        name: $("#authName")?.value?.trim() || "Administrador",
        email: $("#authEmail")?.value?.trim() || "",
        password: $("#authPassword")?.value || ""
      };
      const res = setup ? await api.setupAdmin(payload) : await api.login(payload);
      if (!res.ok) return toast(res.error || "Falha na autenticação", "err");
      state.auth = { checked:true, authenticated:true, needsSetup:false, user: res.user };
      state.users = null;
      await loadAll();
      setRoute("dashboard");
      toast(setup ? "Administrador criado" : "Login realizado", "ok");
    });
  }, 0);
  return wrap;
}

async function logout(){
  await api.logout();
  state.auth = { checked:true, authenticated:false, needsSetup:false, user:null };
  state.users = null;
  state.auditEvents = null;
  render();
}

/* ---------- Dashboard ---------- */

function renderDashboard(){
  const wrap = document.createElement("div");
  wrap.className = "content";

  const totalClients = state.clients.length;
  const totalContracts = state.contracts.length;
  const byStatus = key => state.clients.filter(c=>c.status===key).length;

  const today = todayISO();
  const currentKey = yyyymm(today);

  const monthExpenses = expensesForMonth(currentKey);
  const monthSpent = sumExpenses(monthExpenses);
  const monthlyBudget = Number(state.finance?.settings?.monthlyBudgetCents || 0);
  const remainingBudget = monthlyBudget - monthSpent;

  const monthReceived = (state.receivables || [])
    .map(r => ({
      ...r,
      computedStatus: receivableComputedStatus(r),
      effectiveReceivedKey: yyyymm(r.receivedDate || String(r.receivedAt || "").slice(0,10))
    }))
    .filter(r => r.computedStatus === "received" && r.effectiveReceivedKey === currentKey);
  const monthReceivedTotal = sumReceivables(monthReceived);

  const computedBills = (state.bills || []).map(b => ({ ...b, computedStatus: billComputedStatus(b) }));
  const overdueBills = computedBills.filter(b => b.computedStatus === "overdue");
  const nextUpcomingBill = computedBills
    .filter(b => b.computedStatus !== "paid" && String(b.dueDate || "") >= today)
    .sort((a,b)=> String(a.dueDate||"").localeCompare(String(b.dueDate||"")))[0];
  const oldestOverdueBill = overdueBills
    .slice()
    .sort((a,b)=> String(a.dueDate||"").localeCompare(String(b.dueDate||"")))[0];

  const normalizeTask = (s) => String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const taskCounts = (state.tasksData?.tasks || []).reduce((acc, task)=>{
    const id = String(task.statusId || "");
    const label = normalizeTask(statusName(task.statusId));
    if (id === "st_todo" || label === "a fazer") acc.todo += 1;
    if (id === "st_progress" || label === "em andamento" || label === "andamento") acc.progress += 1;
    if (id === "st_pending" || label === "pendente") acc.pending += 1;
    return acc;
  }, { todo: 0, progress: 0, pending: 0 });

  const budgetSub = monthlyBudget > 0
    ? (remainingBudget >= 0
        ? `Ainda pode gastar ${fmtMoney(remainingBudget)} dentro do limite`
        : `Limite excedido em ${fmtMoney(Math.abs(remainingBudget))}`)
    : "Limite mensal não definido";

  const billsSub = nextUpcomingBill
    ? `Próxima: ${escapeHtml(nextUpcomingBill.name || "Conta")} • ${fmtDate(nextUpcomingBill.dueDate)}`
    : (oldestOverdueBill
        ? `Mais antiga: ${escapeHtml(oldestOverdueBill.name || "Conta")} • ${fmtDate(oldestOverdueBill.dueDate)}`
        : "Nenhuma conta pendente");

  const kpis = document.createElement("div");
  kpis.className = "grid3";
  kpis.innerHTML = `
    <div class="kpi">
      <div class="kpi__label">Clientes</div>
      <div class="kpi__value">${totalClients}</div>
      <div class="kpi__sub">${byStatus("ativo")} ativos • ${byStatus("negociacao")} em negociação</div>
    </div>

    <div class="kpi">
      <div class="kpi__label">Contratos</div>
      <div class="kpi__value">${totalContracts}</div>
      <div class="kpi__sub">${state.contracts.filter(c=>c.status==="rascunho").length} rascunhos • ${state.contracts.filter(c=>c.status==="assinado").length} assinados</div>
    </div>

    <div class="kpi">
      <div class="kpi__label">Empresa</div>
      <div class="kpi__value dashboard-company-value">${escapeHtml(state.config?.company?.tradeName || "—")}</div>
      <div class="kpi__sub">${escapeHtml(state.config?.company?.cnpj || "CNPJ não definido")}</div>
    </div>

    <div class="kpi kpi--blue">
      <div class="kpi__label">Gasto do mês atual</div>
      <div class="kpi__value">${fmtMoney(monthSpent)}</div>
      <div class="kpi__sub">${budgetSub}</div>
    </div>

    <div class="kpi kpi--green">
      <div class="kpi__label">Recebidos do mês atual</div>
      <div class="kpi__value">${fmtMoney(monthReceivedTotal)}</div>
      <div class="kpi__sub">${monthReceived.length} recebimento(s) confirmados neste mês</div>
    </div>

    <div class="kpi">
      <div class="kpi__label">Contas à pagar</div>
      <div class="kpi__value ${overdueBills.length ? "kpi__value--danger" : ""}">${overdueBills.length} ${overdueBills.length === 1 ? "conta" : "contas"} em atraso</div>
      <div class="kpi__sub">${billsSub}</div>
    </div>

    <div class="kpi">
      <div class="kpi__label">Tarefas A Fazer</div>
      <div class="kpi__value">${taskCounts.todo}</div>
      <div class="kpi__sub">Status “A fazer”</div>
    </div>

    <div class="kpi">
      <div class="kpi__label">Tarefas em andamento</div>
      <div class="kpi__value">${taskCounts.progress}</div>
      <div class="kpi__sub">Status “Em andamento”</div>
    </div>

    <div class="kpi">
      <div class="kpi__label">Tarefas pendentes</div>
      <div class="kpi__value">${taskCounts.pending}</div>
      <div class="kpi__sub">Status “Pendente”</div>
    </div>
  `;

  wrap.appendChild(kpis);
  return wrap;
}


/* ---------- Clients ---------- */
function renderClients(){
  const list = filteredClients();
  if (!list.length){
    return emptyState("Sem clientes ainda", "Crie o primeiro cliente com os dados essenciais.", "Criar cliente", ()=>openClientEditor());
  }

  const body = document.createElement("div");
  body.className = "card";
  body.innerHTML = `
    <div class="card__hd">
      <div class="card__title">Clientes</div>
      <div class="muted">${list.length} no total</div>
    </div>
    <div class="card__bd">
      <table class="table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Valor do Contrato</th>
            <th>Status</th>
            <th>Contato</th>
            <th>Atualizado</th>
            <th style="width:220px">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(c=>`
            <tr data-id="${c.id}">
              <td><strong class="pii">${escapeHtml(c.name)}</strong><div class="muted pii" style="font-size:12px">${escapeHtml(c.doc||"")}</div></td>
              <td>
                <strong class="client-contract-amount">${getClientContractValueCents(c) ? fmtMoney(getClientContractValueCents(c)) : "—"}</strong>
                <div class="muted" style="font-size:12px">${labelFromYearMonth(currentYearMonth())}</div>
              </td>
              <td>${tag(statusLabel(c.status), c.status==="ativo")}</td>
              <td class="muted"><span class="pii">${escapeHtml(c.email||"—")}</span><div class="pii">${escapeHtml(c.phone||"")}</div></td>
              <td class="muted">${fmtDateTime(c.updatedAt)}</td>
              <td>
                <button class="btn btn--ghost" data-act="open">Abrir</button>
                <button class="btn btn--danger" data-act="del">Excluir</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  body.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button");
    if (!btn) return;
    const tr = e.target.closest("tr[data-id]");
    if (!tr) return;
    const id = tr.dataset.id;
    const act = btn.dataset.act;

    if (act === "open") openClientDetails(id);
    if (act === "del"){
      if (!confirm("Excluir este cliente? (contratos não serão apagados automaticamente)")) return;
      await api.deleteClient(id);
      await refreshAll();
      toast("Cliente excluído", "ok");
    }
  });

  return body;
}

function openClientEditor(existing){
  const isEdit = Boolean(existing?.id);
  const c = existing || { name:"", doc:"", email:"", phone:"", address:"", notes:"", status:"negociacao", contractValueCents: 0, contractMonthlyValues: {} };
  const baseValue = getClientBaseContractValueCents(c);

  openModal({
    title: isEdit ? "Editar cliente" : "Adicionar cliente",
    body: `
      <div class="grid2">
        <div class="form">
          <div class="field">
            <label>Nome do cliente</label>
            <input id="c_name" class="pii" value="${escapeHtml(c.name)}" placeholder="Nome do cliente"/>
          </div>
          <div class="field">
            <label>Documento (CPF/CNPJ)</label>
            <input id="c_doc" class="pii" value="${escapeHtml(c.doc)}" placeholder="00.000.000/0000-00"/>
          </div>
          <div class="field">
            <label>E-mail</label>
            <input id="c_email" class="pii" value="${escapeHtml(c.email)}" placeholder="cliente@dominio.com.br"/>
          </div>
          <div class="field">
            <label>Telefone</label>
            <input id="c_phone" class="pii" value="${escapeHtml(c.phone)}" placeholder="(11) 99999-9999"/>
          </div>
          <div class="field">
            <label>Valor base do contrato (R$)</label>
            <input id="c_contract_value" value="${escapeHtml(centsToInput(baseValue || 0))}" placeholder="Ex: 2.500,00" inputmode="decimal"/>
          </div>
        </div>
        <div class="form">
          <div class="field">
            <label>Endereço</label>
            <textarea id="c_address" class="pii" placeholder="Rua, número, bairro, cidade - UF, CEP">${escapeHtml(c.address)}</textarea>
          </div>
          <div class="field">
            <label>Status (CRM)</label>
            <select id="c_status">
              ${STATUS.map(s=>`<option value="${s.key}" ${c.status===s.key?"selected":""}>${escapeHtml(s.label)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Observações</label>
            <textarea id="c_notes" class="pii" placeholder="Informações internas, histórico, etc.">${escapeHtml(c.notes)}</textarea>
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn--ghost" data-close="1">Cancelar</button>
      <button class="btn btn--primary" id="c_save">${isEdit ? "Salvar" : "Criar"}</button>
    `,
    onMount: ()=>{
      $("#c_save").addEventListener("click", async ()=>{
        const payload = {
          name: $("#c_name").value.trim() || "Cliente",
          doc: $("#c_doc").value.trim(),
          email: $("#c_email").value.trim(),
          phone: $("#c_phone").value.trim(),
          address: $("#c_address").value.trim(),
          status: $("#c_status").value,
          notes: $("#c_notes").value.trim(),
          contractValueCents: parseMoneyToCents($("#c_contract_value").value),
          contractMonthlyValues: c.contractMonthlyValues || {}
        };

        if (isEdit){
          await api.updateClient(c.id, payload);
          toast("Cliente atualizado", "ok");
        }else{
          await api.createClient(payload);
          toast("Cliente criado", "ok");
        }
        closeModal();
        await refreshAll();
      });
    }
  });
}

function openClientDetails(clientId){
  setRoute(clientRoute(clientId));
}

function renderClientPage(clientId){
  const c = getClientById(clientId);
  if (!c){
    return emptyState("Cliente não encontrado", "Esse cliente pode ter sido excluído ou o link está inválido.", "Voltar para clientes", ()=>setRoute("clients"));
  }

  const wa = makeWhatsAppLink(c.phone, c.name);
  const currentYm = currentYearMonth();
  const currentYmLabel = labelFromYearMonth(currentYm);
  const currentValue = getClientContractValueCents(c, currentYm);
  const baseValue = getClientBaseContractValueCents(c);
  const clientContracts = state.contracts
    .filter(k=>k.clientId===clientId)
    .slice()
    .sort((a,b)=> String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));

  const attachments = (c.attachments || []).slice().sort((a,b)=> String(b.uploadedAt||"").localeCompare(String(a.uploadedAt||"")));
  const contractUploads = attachments.filter(a => String(a.type || "").toLowerCase() === "contrato");
  const otherFiles = attachments.filter(a => String(a.type || "").toLowerCase() !== "contrato");

  const wrap = document.createElement("div");
  wrap.className = "content";
  wrap.innerHTML = `
    <div class="card client-page-hero">
      <div class="card__hd">
        <div>
          <div class="card__title pii">${escapeHtml(c.name)}</div>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap">
          ${tag(statusLabel(c.status), c.status==="ativo")}
          <button class="btn btn--ghost" id="cp_back" type="button">← Lista de Clientes</button>
        </div>
      </div>
      <div class="card__bd client-page-hero__bd">
        <div class="client-page-contract-highlight">
          <div class="kpi__label">Valor do contrato • ${escapeHtml(currentYmLabel)}</div>
          <div class="kpi__value">${currentValue ? fmtMoney(currentValue) : "—"}</div>
        </div>
      </div>
    </div>

    <div class="grid2 client-page-top">
      <div class="card">
        <div class="card__hd">
          <div class="card__title">Dados do cliente</div>
          <button class="btn btn--ghost" id="cp_edit_client" type="button">Editar cliente</button>
        </div>
        <div class="card__bd">
          <div class="client-detail-grid">
            <div><div class="muted">Documento</div><strong class="pii">${escapeHtml(c.doc || "—")}</strong></div>
            <div><div class="muted">E-mail</div><strong class="pii">${escapeHtml(c.email || "—")}</strong></div>
            <div>
              <div class="muted">Telefone</div>
              <div class="profile-row" style="margin-top:6px">
                <div class="pii">${escapeHtml(c.phone || "—")}</div>
                ${wa ? ('<a class="btn btn--primary pii" target="_blank" rel="noopener" href="' + wa + '">Chamar no WhatsApp</a>') : ""}
              </div>
            </div>
            <div><div class="muted">Status</div>${tag(statusLabel(c.status), c.status==="ativo")}</div>
          </div>
          <div class="sep"></div>
          <div><div class="muted">Endereço</div><div class="pii">${escapeHtml(c.address || "—")}</div></div>
          <div class="sep"></div>
          <div><div class="muted">Observações</div><div class="pii">${escapeHtml(c.notes || "—")}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card__hd">
          <div class="card__title">Valor do contrato</div>
        </div>
        <div class="card__bd">
          <div class="form">
            <div class="field">
              <label>Valor base (R$)</label>
              <input id="cp_base_value" value="${escapeHtml(centsToInput(baseValue || 0))}" inputmode="decimal" placeholder="Ex: 2.500,00"/>
            </div>
            <div class="grid2" style="grid-template-columns: 180px 1fr">
              <div class="field">
                <label>Mês de referência</label>
                <input id="cp_month_key" type="month" value="${escapeHtml(currentYm)}" />
              </div>
              <div class="field">
                <label>Valor desse mês (opcional)</label>
                <input id="cp_month_value" value="${clientHasMonthlyContractValue(c, currentYm) ? escapeHtml(centsToInput(Number(c.contractMonthlyValues?.[currentYm] || 0))) : ""}" inputmode="decimal" placeholder="Em branco = valor base"/>
              </div>
            </div>
            
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px">
              <button class="btn btn--primary" id="cp_save_values" type="button">Salvar valores</button>
              <button class="btn btn--ghost" id="cp_clear_month" type="button">Limpar ajuste do mês</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card client-page-section">
      <div class="card__hd">
        <div class="card__title">Contratos</div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap">
          <label class="btn btn--ghost" for="cp_contract_upload">Enviar contrato</label>
          <input id="cp_contract_upload" type="file" accept=".pdf,.doc,.docx,image/*" hidden />
          <button class="btn btn--primary" id="cp_new_contract" type="button">+ Contrato</button>
        </div>
      </div>
      <div class="card__bd">
        ${clientContracts.length ? `
          <table class="table">
            <thead><tr><th>Título</th><th>Status</th><th>Atualizado</th><th style="width:220px">Ações</th></tr></thead>
            <tbody>
              ${clientContracts.map(k=>`
                <tr data-id="${k.id}">
                  <td><strong>${escapeHtml(k.title)}</strong></td>
                  <td>${tag(contractStatusLabel(k.status), k.status==="assinado")}</td>
                  <td class="muted">${fmtDateTime(k.updatedAt)}</td>
                  <td>
                    <button class="btn btn--ghost" data-contract-act="edit">Editar</button>
                    <button class="btn btn--ghost" data-contract-act="pdf">PDF</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `<div class="muted">Nenhum contrato criado ainda.</div>`}

        <div class="sep"></div>
        <div class="muted" style="margin-bottom:10px">Contratos enviados via upload</div>
        ${contractUploads.length ? `
          <table class="table">
            <thead><tr><th>Arquivo</th><th>Enviado</th><th style="width:140px">Ações</th></tr></thead>
            <tbody>
              ${contractUploads.map(a=>`
                <tr>
                  <td><strong>${escapeHtml(a.name)}</strong><div class="muted" style="font-size:12px">${escapeHtml(a.filename)}</div></td>
                  <td class="muted">${fmtDateTime(a.uploadedAt)}</td>
                  <td><a class="btn btn--ghost" href="/api/download?path=${encodeURIComponent(a.relPath)}">Baixar</a></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `<div class="muted">Nenhum contrato enviado via upload ainda.</div>`}
      </div>
    </div>

    <div class="card client-page-section">
      <div class="card__hd">
        <div class="card__title">Arquivos</div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap">
          <label class="btn btn--primary" for="cp_file_upload">Enviar arquivo</label>
          <input id="cp_file_upload" type="file" hidden />
        </div>
      </div>
      <div class="card__bd">
        ${otherFiles.length ? `
          <table class="table">
            <thead><tr><th>Arquivo</th><th>Tipo</th><th>Enviado</th><th style="width:140px">Ações</th></tr></thead>
            <tbody>
              ${otherFiles.map(a=>`
                <tr>
                  <td><strong>${escapeHtml(a.name)}</strong><div class="muted" style="font-size:12px">${escapeHtml(a.filename)}</div></td>
                  <td>${tag(a.type || "anexo", false)}</td>
                  <td class="muted">${fmtDateTime(a.uploadedAt)}</td>
                  <td><a class="btn btn--ghost" href="/api/download?path=${encodeURIComponent(a.relPath)}">Baixar</a></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `<div class="muted">Nenhum arquivo enviado para este cliente.</div>`}
      </div>
    </div>
  `;

  const refreshMonthValueInput = ()=>{
    const monthKey = $("#cp_month_key").value || currentYm;
    const hasOverride = clientHasMonthlyContractValue(c, monthKey);
    const cents = hasOverride ? Number(c.contractMonthlyValues?.[monthKey] || 0) : 0;
    $("#cp_month_value").value = hasOverride ? centsToInput(cents) : "";
  };

  setTimeout(()=>{
    $("#cp_back")?.addEventListener("click", ()=>setRoute("clients"));
    $("#cp_edit_client")?.addEventListener("click", ()=>openClientEditor(c));
    $("#cp_new_contract")?.addEventListener("click", ()=>openContractEditor({ clientId }));

    $("#cp_month_key")?.addEventListener("change", refreshMonthValueInput);

    $("#cp_save_values")?.addEventListener("click", async ()=>{
      const baseCents = parseMoneyToCents($("#cp_base_value").value);
      const monthKey = $("#cp_month_key").value || currentYm;
      const monthValueRaw = $("#cp_month_value").value.trim();
      const nextMonthly = { ...(c.contractMonthlyValues || {}) };

      if (monthValueRaw){
        nextMonthly[monthKey] = parseMoneyToCents(monthValueRaw);
      }else{
        delete nextMonthly[monthKey];
      }

      const res = await api.updateClient(c.id, { contractValueCents: baseCents, contractMonthlyValues: nextMonthly });
      if (res.ok){
        toast("Valores do contrato salvos", "ok");
        await refreshAll();
      }else{
        toast("Erro ao salvar valores", "err");
      }
    });

    $("#cp_clear_month")?.addEventListener("click", async ()=>{
      const monthKey = $("#cp_month_key").value || currentYm;
      const nextMonthly = { ...(c.contractMonthlyValues || {}) };
      delete nextMonthly[monthKey];
      const res = await api.updateClient(c.id, { contractMonthlyValues: nextMonthly });
      if (res.ok){
        toast("Ajuste mensal removido", "ok");
        await refreshAll();
      }else{
        toast("Erro ao remover ajuste", "err");
      }
    });

    $("#cp_contract_upload")?.addEventListener("change", async (e)=>{
      const file = e.target.files?.[0];
      if (!file) return;
      const res = await api.uploadFile({ clientId, fileType:"contrato", file });
      e.target.value = "";
      if (res.ok){
        toast("Contrato enviado", "ok");
        await refreshAll();
      }else{
        toast("Falha no upload: " + res.error, "err");
      }
    });

    $("#cp_file_upload")?.addEventListener("change", async (e)=>{
      const file = e.target.files?.[0];
      if (!file) return;
      const res = await api.uploadFile({ clientId, fileType:"anexo", file });
      e.target.value = "";
      if (res.ok){
        toast("Arquivo enviado", "ok");
        await refreshAll();
      }else{
        toast("Falha no upload: " + res.error, "err");
      }
    });

    $$("[data-contract-act]", wrap).forEach(btn=>{
      btn.addEventListener("click", (e)=>{
        e.stopPropagation();
        const tr = btn.closest("tr[data-id]");
        const contractId = tr?.dataset?.id;
        if (!contractId) return;
        const act = btn.dataset.contractAct;
        if (act === "edit") openContractEditor({ contractId });
        if (act === "pdf") generatePDFForContract(contractId);
      });
    });
  },0);

  return wrap;
}

/* ---------- CRM (Kanban) ---------- */
function renderCRM(){
  if (!state.clients.length){
    return emptyState("CRM vazio", "Você precisa ter clientes criados para poder visualizar.", "Criar cliente", ()=>openClientEditor());
  }

  const wrap = document.createElement("div");
  wrap.className = "kanban";

  const byCol = (key) => filteredClients().filter(c=>c.status===key);

  for (const col of STATUS){
    const clients = byCol(col.key);
    const colEl = document.createElement("div");
    colEl.className = "col";
    colEl.dataset.status = col.key;
    colEl.innerHTML = `
      <div class="col__hd">
        <div class="col__title">${escapeHtml(col.label)}</div>
        <div class="col__count">${clients.length}</div>
      </div>
      <div class="col__bd">
        ${clients.map(c=>`
          <div class="client-card" draggable="true" data-id="${c.id}">
            <div class="client-card__name pii">${escapeHtml(c.name)}</div>
            <div class="client-card__meta">
              <span class="pii">${escapeHtml(c.doc||"")}</span>
              <span class="pii">${escapeHtml(c.email||"")}</span>
              <span class="client-card__value">${getClientContractValueCents(c) ? fmtMoney(getClientContractValueCents(c)) : "—"}</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    // Drag behavior
    colEl.addEventListener("dragover", (e)=>{
      e.preventDefault();
      colEl.classList.add("drop-hint");
    });
    colEl.addEventListener("dragleave", ()=>{
      colEl.classList.remove("drop-hint");
    });
    colEl.addEventListener("drop", async (e)=>{
      e.preventDefault();
      colEl.classList.remove("drop-hint");
      const clientId = e.dataTransfer.getData("text/clientId");
      if (!clientId) return;
      await api.updateClient(clientId, { status: col.key });
      await refreshAll(false);
      toast("Status atualizado", "ok");
      render();
    });

    wrap.appendChild(colEl);
  }

  setTimeout(()=>{
    $$(".client-card").forEach(card=>{
      card.addEventListener("dragstart", (e)=>{
        e.dataTransfer.setData("text/clientId", card.dataset.id);
      });
      card.addEventListener("click", ()=>{
        // clique abre detalhes (arrastar continua funcionando)
        openClientDetails(card.dataset.id);
      });
    });
  }, 0);

  return wrap;
}


/* ---------- Finanças ---------- */
const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

function yyyymm(dateStr){
  // dateStr: YYYY-MM-DD
  return String(dateStr||"").slice(0,7);
}
function monthKey(year, month){ // month 1..12
  return `${year}-${String(month).padStart(2,"0")}`;
}
function getCategoryById(id){
  return (state.finance?.categories || []).find(c=>c.id===id);
}
function categoryName(id){
  return getCategoryById(id)?.name || "Sem categoria";
}
function categoryColor(id){
  return getCategoryById(id)?.color || "rgba(255,255,255,.25)";
}
function randomColor(){
  const palette = ["#3B82F6","#22C55E","#A855F7","#F97316","#EF4444","#14B8A6","#EAB308","#F43F5E","#06B6D4","#84CC16"];
  return palette[Math.floor(Math.random()*palette.length)];
}

function ensureChartTip(){
  let tip = $("#chartTip");
  if (tip) return tip;
  tip = document.createElement("div");
  tip.id = "chartTip";
  tip.className = "chart-tip";
  document.body.appendChild(tip);
  return tip;
}
function showTip(x, y, html){
  const tip = ensureChartTip();
  tip.innerHTML = html;
  tip.style.display = "block";
  const pad = 12;
  const rect = tip.getBoundingClientRect();
  let left = x + pad;
  let top = y + pad;
  if (left + rect.width > window.innerWidth - 8) left = x - rect.width - pad;
  if (top + rect.height > window.innerHeight - 8) top = y - rect.height - pad;
  tip.style.left = left + "px";
  tip.style.top = top + "px";
}
function hideTip(){
  const tip = $("#chartTip");
  if (tip) tip.style.display = "none";
}

function prepCanvas(canvas, height=240){
  // CSS controla o tamanho; canvas precisa de resolução real
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(10, Math.floor(canvas.clientWidth * dpr));
  const h = Math.max(10, Math.floor(height * dpr));
  canvas.width = w;
  canvas.height = h;
  canvas.style.height = height + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return ctx;
}

function drawDonut(canvas, segments, totalCentsOverride=null){
  // segments: [{label, valueCents, color}]
  const ctx = prepCanvas(canvas, 240);
  const w = canvas.clientWidth;
  const h = 240;
  ctx.clearRect(0,0,w,h);

  const sliceTotal = segments.reduce((a,s)=>a+s.valueCents,0) || 1;
  const totalCents = (totalCentsOverride===null || totalCentsOverride===undefined) ? (segments.reduce((a,s)=>a+s.valueCents,0)) : Number(totalCentsOverride||0);
  const cx = w/2, cy = h/2;
  const r = Math.min(w,h)/2 - 14;
  const ir = r*0.62;

  let ang = -Math.PI/2;
  const hit = [];

  // fundo
  ctx.beginPath();
  ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fillStyle = "rgba(255,255,255,.03)";
  ctx.fill();

  for (const s of segments){
    const slice = (s.valueCents/sliceTotal) * Math.PI*2;
    const a0 = ang;
    const a1 = ang + slice;

    ctx.beginPath();
    ctx.arc(cx,cy,r,a0,a1);
    ctx.arc(cx,cy,ir,a1,a0,true);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.globalAlpha = 1;

    hit.push({a0,a1, ...s});
    ang = a1;
  }

  // furo
  ctx.beginPath();
  ctx.arc(cx,cy,ir,0,Math.PI*2);
  ctx.fillStyle = (document.documentElement.dataset.theme==="light") ? "rgba(255,255,255,1)" : "rgba(15,25,48,1)";
  ctx.fill();

  // total no centro
  ctx.fillStyle = (document.documentElement.dataset.theme==="light") ? "rgba(17,24,39,.92)" : "rgba(255,255,255,.92)";
  ctx.font = "900 16px ui-sans-serif, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fmtMoney(totalCents), cx, cy-6);
  ctx.fillStyle = (document.documentElement.dataset.theme==="light") ? "rgba(17,24,39,.62)" : "rgba(255,255,255,.62)";
  ctx.font = "700 12px ui-sans-serif, system-ui";
  ctx.fillText("Total do mês", cx, cy+14);

  canvas.__donut = { cx, cy, r, ir, segments: hit, totalCents, sliceTotal };
}

function drawBars(canvas, labels, valuesCents, highlightIndex){
  const ctx = prepCanvas(canvas, 240);
  const w = canvas.clientWidth;
  const h = 240;
  ctx.clearRect(0,0,w,h);

  const pad = 18;
  const chartH = h - pad*2 - 24;
  const chartW = w - pad*2;
  const max = Math.max(...valuesCents, 1);

  // grid
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  if (document.documentElement.dataset.theme==="light") ctx.strokeStyle = "rgba(17,24,39,.10)";
  ctx.lineWidth = 1;

  for (let i=0;i<=4;i++){
    const y = pad + (chartH/4)*i;
    ctx.beginPath();
    ctx.moveTo(pad,y);
    ctx.lineTo(pad+chartW,y);
    ctx.stroke();
  }

  const n = labels.length;
  const gap = 10;
  const barW = Math.max(10, (chartW - gap*(n-1)) / n);

  const rects = [];
  for (let i=0;i<n;i++){
    const v = valuesCents[i] || 0;
    const bh = (v/max) * chartH;
    const x = pad + i*(barW+gap);
    const y = pad + chartH - bh;

    ctx.fillStyle = (i===highlightIndex) ? "rgba(37,99,235,.95)" : "rgba(37,99,235,.55)";
    if (document.documentElement.dataset.theme==="light"){
      ctx.fillStyle = (i===highlightIndex) ? "rgba(37,99,235,.95)" : "rgba(37,99,235,.45)";
    }
    ctx.fillRect(x,y,barW,bh);

    // label
    ctx.fillStyle = (document.documentElement.dataset.theme==="light") ? "rgba(17,24,39,.62)" : "rgba(255,255,255,.62)";
    ctx.font = "700 11px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(labels[i], x+barW/2, pad+chartH+8);

    rects.push({x,y,w:barW,h:bh,label:labels[i],valueCents:v});
  }

  // title corner
  ctx.fillStyle = (document.documentElement.dataset.theme==="light") ? "rgba(17,24,39,.62)" : "rgba(255,255,255,.62)";
  ctx.font = "800 12px ui-sans-serif, system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Total por mês (ano)", pad, 6);

  canvas.__bars = { rects, max };
}

function financeYears(){
  const exp = state.finance?.expenses || [];
  const years = new Set(exp.map(e => Number(String(e.date||"").slice(0,4))).filter(Boolean));
  years.add(new Date().getFullYear());
  return Array.from(years).sort((a,b)=>a-b);
}

function expensesForMonth(key){
  return (state.finance?.expenses || []).filter(e => yyyymm(e.date) === key);
}

function sumExpenses(expenses){
  return expenses.reduce((a,e)=>a + (Number(e.amountCents)||0), 0);
}

function totalsByCategory(expenses){
  const map = new Map();
  for (const e of expenses){
    const id = e.categoryId || "";
    map.set(id, (map.get(id)||0) + (Number(e.amountCents)||0));
  }
  // ordena desc
  return Array.from(map.entries())
    .map(([categoryId,totalCents])=>({categoryId,totalCents}))
    .sort((a,b)=>b.totalCents-a.totalCents);
}

function computeInsights(currentKey){
  const cur = expensesForMonth(currentKey);
  const curTotal = sumExpenses(cur);
  const notes = [];

  const budget = Number(state.finance?.settings?.monthlyBudgetCents || 0);
  if (budget > 0){
    const diff = budget - curTotal;
    if (diff >= 0){
      notes.push({type:"ok", title:"Limite do mês", text:`Você ainda pode gastar ${fmtMoney(diff)} para ficar dentro do seu limite.`});
    }else{
      notes.push({type:"bad", title:"Limite do mês", text:`Você ultrapassou seu limite em ${fmtMoney(Math.abs(diff))}. Para voltar ao alvo, reduza esse valor nos próximos gastos.`});
    }
  }else{
    notes.push({type:"warn", title:"Dica rápida", text:"Defina um limite mensal para o sistema te avisar quando estiver perto de estourar o orçamento."});
  }

  // categoria dominante
  const byCat = totalsByCategory(cur);
  if (byCat.length && curTotal > 0){
    const top = byCat[0];
    const pct = Math.round((top.totalCents/curTotal)*100);
    if (pct >= 35){
      notes.push({type:"warn", title:"Categoria alta", text:`"${categoryName(top.categoryId)}" representa ${pct}% dos seus gastos do mês (${fmtMoney(top.totalCents)}). Vale revisar se dá para cortar algo.`});
    }
  }

  // estouro de orçamento por categoria
  for (const c of (state.finance?.categories || [])){
    const lim = Number(c.budgetCents || 0);
    if (!lim) continue;
    const tot = (cur.filter(e=>e.categoryId===c.id)).reduce((a,e)=>a+(Number(e.amountCents)||0),0);
    if (tot > lim){
      notes.push({type:"bad", title:"Orçamento por categoria", text:`"${c.name}" passou do limite em ${fmtMoney(tot-lim)} (limite ${fmtMoney(lim)}).`});
    }
  }

  // mês anterior: variação
  const [y,m] = currentKey.split("-").map(Number);
  const prevDate = new Date(y, m-2, 1);
  const prevKey = monthKey(prevDate.getFullYear(), prevDate.getMonth()+1);
  const prevTotal = sumExpenses(expensesForMonth(prevKey));
  if (prevTotal > 0){
    const inc = (curTotal - prevTotal)/prevTotal;
    if (inc >= 0.25){
      notes.push({type:"warn", title:"Subiu em relação ao mês anterior", text:`Seus gastos subiram ${Math.round(inc*100)}% vs. ${MONTHS[prevDate.getMonth()]} (${fmtMoney(prevTotal)}).`});
    }
  }

  // recorrências
  const group = new Map();
  for (const e of cur){
    const key = String(e.name||"").trim().toLowerCase().replace(/\s+/g," ");
    if (!key) continue;
    const g = group.get(key) || {name:e.name,count:0,sum:0};
    g.count += 1;
    g.sum += (Number(e.amountCents)||0);
    group.set(key,g);
  }
  const recurring = Array.from(group.values()).filter(g=>g.count>=2).sort((a,b)=>b.sum-a.sum).slice(0,3);
  if (recurring.length){
    const list = recurring.map(r=>`${escapeHtml(r.name)} (${r.count}x, ${fmtMoney(r.sum)})`).join(", ");
    notes.push({type:"ok", title:"Gastos recorrentes", text:`Você teve recorrências neste mês: ${list}. Se forem assinaturas, pode valer cancelar as que não usa.`});
  }

  return notes.slice(0,6);
}

function renderFinance(){
  // garante filtro salvo
  try{ localStorage.setItem("financeFilter", JSON.stringify(state.financeFilter)); }catch{}

  const year = state.financeFilter.year;
  const month = state.financeFilter.month;
  const key = monthKey(year, month);

  const years = financeYears();
  const monthExpenses = expensesForMonth(key).slice().sort((a,b)=> (b.date||"").localeCompare(a.date||""));
  const totalMonth = sumExpenses(monthExpenses);

  const byCat = totalsByCategory(monthExpenses);
  const segments = byCat.length ? byCat.map(x=>({
    label: categoryName(x.categoryId),
    valueCents: x.totalCents,
    color: categoryColor(x.categoryId)
  })) : [{label:"Sem gastos", valueCents:1, color:"rgba(255,255,255,.12)"}];

  const budget = Number(state.finance?.settings?.monthlyBudgetCents || 0);
  const pct = budget>0 ? Math.min(100, Math.round((totalMonth/budget)*100)) : 0;
  const remaining = budget>0 ? (budget - totalMonth) : 0;

  // total por mês do ano
  const labels = MONTHS.map(m=>m.slice(0,3));
  const values = [];
  for (let i=1;i<=12;i++){
    const k = monthKey(year, i);
    values.push(sumExpenses(expensesForMonth(k)));
  }

  const wrap = document.createElement("div");
  wrap.className = "content";

  const controls = document.createElement("div");
  controls.className = "card";
  controls.innerHTML = `
    <div class="card__hd">
      <div class="card__title">Controle financeiro</div>
    </div>
    <div class="card__bd">
      <div class="finance-head">
        <select class="select" id="finMonth">
          ${MONTHS.map((m, i)=>`<option value="${i+1}" ${month===i+1?"selected":""}>${escapeHtml(m)}</option>`).join("")}
        </select>
        <select class="select" id="finYear">
          ${years.map(y=>`<option value="${y}" ${y===year?"selected":""}>${y}</option>`).join("")}
        </select>

        <div class="tag is-accent" style="margin-left:auto">${escapeHtml(MONTHS[month-1])} • ${year}</div>
        <div class="tag"><span class="tag__dot"></span>Total: <strong style="margin-left:6px">${fmtMoney(totalMonth)}</strong></div>
      </div>

      <div class="sep"></div>

      <div class="grid2">
        <div>
          <div class="muted" style="font-size:12.5px; margin-bottom:6px">Limite mensal:</div>
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap">
            <input class="select" id="finBudget" inputmode="decimal" placeholder="Ex: 2500,00" value="${budget? (budget/100).toFixed(2).replace(".",",") : ""}" style="min-width:180px"/>
            <button class="btn btn--ghost" id="finSaveBudget">Salvar limite</button>
            ${budget ? `<span class="muted">${remaining>=0 ? `Restante: ${fmtMoney(remaining)}` : `Excedeu: ${fmtMoney(Math.abs(remaining))}`}</span>` : ``}
          </div>
          <div style="margin-top:10px" class="progress"><div id="finProgress" style="width:${pct}%"></div></div>
        </div>

        <div style="display:flex; gap:10px; align-items:flex-end; justify-content:flex-end; flex-wrap:wrap">
          <button class="btn btn--primary" id="finAddExpense">+ Novo gasto</button>
          <button class="btn btn--ghost" id="finCats">Categorias</button>
        </div>
      </div>
    </div>
  `;
  wrap.appendChild(controls);

  const grid = document.createElement("div");
  grid.className = "finance-grid";

  const left = document.createElement("div");
  left.style.display = "grid";
  left.style.gap = "14px";

  const chartsCard = document.createElement("div");
  chartsCard.className = "card";
  chartsCard.innerHTML = `
    <div class="card__hd">
      <div class="card__title">Gráficos</div>
    </div>
    <div class="card__bd">
      <div class="finance-charts">
        <div class="chart-wrap">
          <div style="font-weight:900">Categorias do mês</div>
          <canvas class="chart-canvas" id="donutCanvas"></canvas>
          <div class="legend" id="donutLegend"></div>
        </div>
        <div class="chart-wrap">
          <div style="font-weight:900">Total por mês (${year})</div>
          <canvas class="chart-canvas" id="barCanvas"></canvas>
        </div>
      </div>
    </div>
  `;
  left.appendChild(chartsCard);

  const listCard = document.createElement("div");
  listCard.className = "card";
  listCard.innerHTML = `
    <div class="card__hd">
      <div class="card__title">Gastos de ${escapeHtml(MONTHS[month-1])}</div>
      <div class="muted">${monthExpenses.length} itens</div>
    </div>
    <div class="card__bd">
      ${monthExpenses.length ? `
        <table class="table" id="finTable">
          <thead>
            <tr>
              <th>Data</th>
              <th>Gasto</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th style="width:180px">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${monthExpenses.map(e=>`
              <tr data-id="${e.id}">
                <td class="muted">${escapeHtml(e.date||"")}</td>
                <td><strong>${escapeHtml(e.name||"")}</strong></td>
                <td>${tag(categoryName(e.categoryId), false)}</td>
                <td><strong>${fmtMoney(e.amountCents)}</strong></td>
                <td>
                  <button class="btn btn--ghost" data-act="edit">Editar</button>
                  <button class="btn btn--danger" data-act="del">Excluir</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `<div class="muted">Nenhum gasto registrado neste mês.</div>`}
    </div>
  `;
  left.appendChild(listCard);

  const right = document.createElement("div");
  right.style.display = "grid";
  right.style.gap = "14px";

  const insights = computeInsights(key);
  const insightsCard = document.createElement("div");
  insightsCard.className = "card";
  insightsCard.innerHTML = `
    <div class="card__hd">
      <div class="card__title">Alertas e sugestões</div>
    </div>
    <div class="card__bd">
      <div class="insights">
        ${insights.map(n=>`
          <div class="note ${n.type}">
            <strong>${escapeHtml(n.title)}</strong>
            <div class="muted">${n.text}</div>
          </div>
        `).join("")}
      </div>
      <div class="sep"></div>
      <div class="muted" style="font-size:12.5px">
        Os alertas são calculados com base nos registros do mês e nos limites definidos.
      </div>
    </div>
  `;
  right.appendChild(insightsCard);

  const catsCard = document.createElement("div");
  catsCard.className = "card";
  catsCard.innerHTML = `
    <div class="card__hd">
      <div class="card__title">Categorias</div>
      <div class="muted">${(state.finance?.categories||[]).length}</div>
    </div>
    <div class="card__bd">
      <div class="legend">
        ${(state.finance?.categories||[]).slice().sort((a,b)=>a.name.localeCompare(b.name)).map(c=>`
          <div class="legend-item">
            <div class="legend-left">
              <span class="swatch" style="background:${escapeHtml(c.color||'#3B82F6')}"></span>
              <div class="legend-name">${escapeHtml(c.name)}</div>
            </div>
            <div class="legend-val">${c.budgetCents ? `Limite: ${fmtMoney(c.budgetCents)}` : "—"}</div>
          </div>
        `).join("")}
      </div>
    </div>
    <div class="card__ft">
      <button class="btn btn--ghost" id="finCats2">Gerenciar categorias</button>
    </div>
  `;
  right.appendChild(catsCard);

  grid.appendChild(left);
  grid.appendChild(right);
  wrap.appendChild(grid);

  setTimeout(()=>{
    // filtros
    $("#finMonth").addEventListener("change", ()=>{
      state.financeFilter.month = Number($("#finMonth").value);
      render();
    });
    $("#finYear").addEventListener("change", ()=>{
      state.financeFilter.year = Number($("#finYear").value);
      render();
    });

    // ações
    $("#finAddExpense").addEventListener("click", ()=>openExpenseEditor({ defaultDate: `${key}-01` }));
    $("#finCats").addEventListener("click", openCategoryManager);
    $("#finCats2").addEventListener("click", openCategoryManager);

    $("#finSaveBudget").addEventListener("click", async ()=>{
      const cents = parseMoneyToCents($("#finBudget").value);
      const res = await api.updateFinanceSettings({ monthlyBudgetCents: cents });
      if (res.ok){
        toast("Limite mensal salvo", "ok");
        await refreshAll(false);
        render();
      }else{
        toast("Falha ao salvar limite", "err");
      }
    });

    // tabela
    $("#finTable")?.addEventListener("click", async (e)=>{
      const btn = e.target.closest("button");
      if (!btn) return;
      const tr = e.target.closest("tr[data-id]");
      if (!tr) return;
      const id = tr.dataset.id;
      const act = btn.dataset.act;
      const exp = (state.finance?.expenses||[]).find(x=>x.id===id);
      if (!exp) return;

      if (act === "edit") openExpenseEditor({ expense: exp });
      if (act === "del"){
        if (!confirm("Excluir este gasto?")) return;
        await api.deleteExpense(id);
        toast("Gasto excluído", "ok");
        await refreshAll(false);
        render();
      }
    });

    // gráficos
    const donut = $("#donutCanvas");
    const bar = $("#barCanvas");

    // legenda donut
    const legend = $("#donutLegend");
    legend.innerHTML = byCat.map(x=>{
      const name = categoryName(x.categoryId);
      const color = categoryColor(x.categoryId);
      const val = fmtMoney(x.totalCents);
      return `
        <div class="legend-item">
          <div class="legend-left">
            <span class="swatch" style="background:${escapeHtml(color)}"></span>
            <div class="legend-name">${escapeHtml(name)}</div>
          </div>
          <div class="legend-val">${val}</div>
        </div>
      `;
    }).join("") || `<div class="muted">Sem dados</div>`;

    drawDonut(donut, segments, totalMonth);
    drawBars(bar, labels, values, month-1);

    const onMoveDonut = (ev)=>{
      const info = donut.__donut;
      if (!info) return;
      const rect = donut.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const dx = x - info.cx;
      const dy = y - info.cy;
      const dist = Math.hypot(dx,dy);
      if (dist < info.ir || dist > info.r){
        hideTip(); return;
      }
      let ang = Math.atan2(dy,dx);
      if (ang < -Math.PI/2) ang += Math.PI*2; // normaliza
      // converte para range inicial
      let a = ang;
      // como começamos em -PI/2
      a = a < -Math.PI/2 ? a + Math.PI*2 : a;
      // ajusta para início
      const norm = (a < -Math.PI/2) ? a + Math.PI*2 : a;

      // Na prática, mais simples: re-calcular usando atan2 e comparar com slices
      const ang2 = Math.atan2(dy,dx);
      let angN = ang2;
      // traz pra 0..2pi, com 0 no topo
      angN = angN + Math.PI/2;
      if (angN < 0) angN += Math.PI*2;

      let found = null;
      for (const s of info.segments){
        let a0 = s.a0 + Math.PI/2; if (a0<0) a0 += Math.PI*2;
        let a1 = s.a1 + Math.PI/2; if (a1<0) a1 += Math.PI*2;
        // slice pode cruzar 2pi
        if (a1 < a0){
          if (angN >= a0 || angN <= a1) found = s;
        }else{
          if (angN >= a0 && angN <= a1) found = s;
        }
        if (found) break;
      }
      if (!found){ hideTip(); return; }
      const base = info.totalCents>0 ? info.totalCents : info.sliceTotal;
      const pct = Math.round((found.valueCents/base)*100);
      showTip(ev.clientX, ev.clientY, `<strong>${escapeHtml(found.label)}</strong><div class="muted">${fmtMoney(found.valueCents)} • ${pct}%</div>`);
    };

    const onMoveBar = (ev)=>{
      const info = bar.__bars;
      if (!info) return;
      const rect = bar.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const r = info.rects.find(rr => x>=rr.x && x<=rr.x+rr.w && y>=rr.y && y<=rr.y+rr.h);
      if (!r){ hideTip(); return; }
      showTip(ev.clientX, ev.clientY, `<strong>${escapeHtml(r.label)}</strong><div class="muted">${fmtMoney(r.valueCents)}</div>`);
    };

    donut.addEventListener("mousemove", onMoveDonut);
    donut.addEventListener("mouseleave", hideTip);
    bar.addEventListener("mousemove", onMoveBar);
    bar.addEventListener("mouseleave", hideTip);

    // redimensiona
    const ro = new ResizeObserver(()=>{
      drawDonut(donut, segments, totalMonth);
      drawBars(bar, labels, values, month-1);
    });
    ro.observe(donut);
    ro.observe(bar);
  },0);

  return wrap;
}

function openExpenseEditor({expense=null, defaultDate=null}={}){
  const isEdit = Boolean(expense?.id);
  const now = new Date();
  const def = defaultDate && /^\d{4}-\d{2}-\d{2}$/.test(defaultDate) ? defaultDate : now.toISOString().slice(0,10);

  const e = expense || { name:"", categoryId:"", amountCents:0, date:def };

  openModal({
    title: isEdit ? "Editar gasto" : "Novo gasto",
    body: `
      <div class="grid2">
        <div class="form">
          <div class="field">
            <label>Nome do gasto</label>
            <input id="exp_name" value="${escapeHtml(e.name||"")}" placeholder="Descrição do gasto"/>
          </div>
          <div class="field">
            <label>Categoria</label>
            <select id="exp_cat">
              <option value="">Sem categoria</option>
              ${(state.finance?.categories||[]).slice().sort((a,b)=>a.name.localeCompare(b.name)).map(c=>`
                <option value="${c.id}" ${c.id===e.categoryId?"selected":""}>${escapeHtml(c.name)}</option>
              `).join("")}
            </select>
          </div>
        </div>
        <div class="form">
          <div class="grid2">
            <div class="field">
              <label>Valor</label>
              <input id="exp_val" inputmode="decimal" value="${e.amountCents? (e.amountCents/100).toFixed(2).replace(".",",") : ""}" placeholder="Ex: 89,90"/>
            </div>
            <div class="field">
              <label>Data</label>
              <input id="exp_date" type="date" value="${escapeHtml(e.date||def)}"/>
            </div>
          </div>
          
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn--ghost" data-close="1">Cancelar</button>
      <button class="btn btn--primary" id="exp_save">${isEdit ? "Salvar" : "Adicionar"}</button>
    `,
    onMount: ()=>{
      $("#exp_save").addEventListener("click", async ()=>{
        const payload = {
          name: $("#exp_name").value.trim() || "Gasto",
          categoryId: $("#exp_cat").value,
          amountCents: parseMoneyToCents($("#exp_val").value),
          date: $("#exp_date").value
        };
        if (!payload.date){
          toast("Informe a data", "warn");
          return;
        }
        if (payload.amountCents <= 0){
          toast("Informe um valor válido", "warn");
          return;
        }

        if (isEdit){
          const res = await api.updateExpense(expense.id, payload);
          if (res.ok) toast("Gasto atualizado", "ok");
          else toast("Erro ao salvar", "err");
        }else{
          const res = await api.createExpense(payload);
          if (res.ok) toast("Gasto adicionado", "ok");
          else toast("Erro ao adicionar", "err");
        }

        closeModal();
        await refreshAll(false);
        render();
      });
    }
  });
}

function openCategoryManager(){
  const cats = (state.finance?.categories||[]).slice().sort((a,b)=>a.name.localeCompare(b.name));
  openModal({
    title: "Categorias",
    body: `
      <div class="muted" style="font-size:12.5px; margin-bottom:10px">
        Crie categorias personalizadas.
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px">
        <button class="btn btn--primary" id="cat_add">+ Nova categoria</button>
      </div>

      ${cats.length ? `
        <table class="table" id="cat_table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Cor</th>
              <th>Limite (opcional)</th>
              <th style="width:200px">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${cats.map(c=>`
              <tr data-id="${c.id}">
                <td><strong>${escapeHtml(c.name)}</strong></td>
                <td><span class="swatch" style="background:${escapeHtml(c.color||'#3B82F6')}"></span></td>
                <td class="muted">${c.budgetCents ? fmtMoney(c.budgetCents) : "—"}</td>
                <td>
                  <button class="btn btn--ghost" data-act="edit">Editar</button>
                  <button class="btn btn--danger" data-act="del">Excluir</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `<div class="muted">Nenhuma categoria criada ainda.</div>`}
    `,
    footer: `<button class="btn btn--ghost" data-close="1">Fechar</button>`,
    onMount: ()=>{
      $("#cat_add").addEventListener("click", ()=>{
        closeModal();
        openCategoryEditor();
      });

      $("#cat_table")?.addEventListener("click", async (e)=>{
        const btn = e.target.closest("button");
        if (!btn) return;
        const tr = e.target.closest("tr[data-id]");
        if (!tr) return;
        const id = tr.dataset.id;
        const act = btn.dataset.act;
        const cat = (state.finance?.categories||[]).find(c=>c.id===id);
        if (!cat) return;

        if (act === "edit"){
          closeModal();
          openCategoryEditor({ category: cat });
        }
        if (act === "del"){
          if (!confirm("Excluir esta categoria? Gastos vinculados ficarão como 'Sem categoria'.")) return;
          await api.deleteFinanceCategory(id);
          toast("Categoria excluída", "ok");
          closeModal();
          await refreshAll(false);
          openCategoryManager();
        }
      });
    }
  });
}

function openCategoryEditor({category=null}={}){
  const isEdit = Boolean(category?.id);
  const c = category || { name:"", color: randomColor(), budgetCents:0 };

  openModal({
    title: isEdit ? "Editar categoria" : "Nova categoria",
    body: `
      <div class="grid2">
        <div class="form">
          <div class="field">
            <label>Nome</label>
            <input id="cat_name" value="${escapeHtml(c.name||"")}" placeholder="Nome da categoria"/>
          </div>
          <div class="field">
            <label>Cor</label>
            <input id="cat_color" type="color" value="${escapeHtml(c.color||'#3B82F6')}" />
          </div>
        </div>
        <div class="form">
          <div class="field">
            <label>Limite mensal da categoria (opcional)</label>
            <input id="cat_budget" inputmode="decimal" value="${c.budgetCents? (c.budgetCents/100).toFixed(2).replace(".",",") : ""}" placeholder="Ex: 400,00"/>
            <div class="muted" style="font-size:12.5px; margin-top:4px">Se o total do mês passar do limite, você recebe um alerta.</div>
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn--ghost" data-close="1">Cancelar</button>
      <button class="btn btn--primary" id="cat_save">${isEdit ? "Salvar" : "Criar"}</button>
    `,
    onMount: ()=>{
      $("#cat_save").addEventListener("click", async ()=>{
        const payload = {
          name: $("#cat_name").value.trim(),
          color: $("#cat_color").value,
          budgetCents: parseMoneyToCents($("#cat_budget").value)
        };
        if (!payload.name){
          toast("Informe o nome da categoria", "warn");
          return;
        }
        if (isEdit){
          const res = await api.updateFinanceCategory(c.id, payload);
          if (res.ok) toast("Categoria atualizada", "ok");
          else toast("Erro ao salvar", "err");
        }else{
          const res = await api.createFinanceCategory(payload);
          if (res.ok) toast("Categoria criada", "ok");
          else toast("Erro ao criar", "err");
        }

        closeModal();
        await refreshAll(false);
        openCategoryManager();
      });
    }
  });
}


/* ---------- Contracts ---------- */
function renderContracts(){
  const list = filteredContracts();
  if (!list.length){
    return emptyState("Sem contratos ainda", "Cadastre um contrato e vincule ao cliente correspondente.", "Criar contrato", ()=>openContractEditor());
  }

  const wrap = document.createElement("div");
  wrap.className = "card";
  wrap.innerHTML = `
    <div class="card__hd">
      <div class="card__title">Contratos</div>
      <div class="muted">${list.length} no total</div>
    </div>
    <div class="card__bd">
      ${renderContractTable(list)}
    </div>
  `;

  wrap.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button");
    if (!btn) return;
    const tr = e.target.closest("tr[data-id]");
    if (!tr) return;
    const id = tr.dataset.id;
    const act = btn.dataset.act;

    if (act === "edit") openContractEditor({ contractId: id });
    if (act === "pdf") generatePDFForContract(id);
    if (act === "del"){
      if (!confirm("Excluir este contrato?")) return;
      await api.deleteContract(id);
      await refreshAll();
      toast("Contrato excluído", "ok");
      render();
    }
  });

  return wrap;
}

function renderContractTable(list, {compact=false}={}){
  const rows = list.map(k=>`
    <tr data-id="${k.id}">
      <td><strong>${escapeHtml(k.title)}</strong><div class="muted" style="font-size:12px">${escapeHtml(k.id)}</div></td>
      <td><span class="pii">${escapeHtml(getClientName(k.clientId))}</span></td>
      <td>${tag(contractStatusLabel(k.status), k.status==="assinado")}</td>
      <td class="muted">${fmtDateTime(k.updatedAt)}</td>
      <td>
        <button class="btn btn--ghost" data-act="edit">Editar</button>
        <button class="btn btn--ghost" data-act="pdf">PDF</button>
        ${compact ? "" : `<button class="btn btn--danger" data-act="del">Excluir</button>`}
      </td>
    </tr>
  `).join("");

  return `
    <table class="table">
      <thead>
        <tr>
          <th>Contrato</th>
          <th>Cliente</th>
          <th>Status</th>
          <th>Atualizado</th>
          <th style="width:${compact?170:250}px">Ações</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/* ---------- Contract Editor ---------- */
function contractTemplateHTML(){
  // Modelo interno do contrato. Campos são atualizados via data-bind.
  return `
  <div id="contractDoc" class="preview">
    <div class="box">
      <h1 data-bind="contract_title">Contrato de Prestação de Serviços</h1>
      <p class="muted small">
        Gerado em <span data-bind="date_long"></span> • Local: <span data-bind="company_city_state"></span>
      </p>
    </div>

    <h2>Partes</h2>
    <p>
      <strong>CONTRATADA:</strong> <span data-bind="company_legal"></span>,
      nome fantasia <span data-bind="company_trade"></span>, inscrita no CNPJ sob nº
      <span data-bind="company_cnpj"></span>, com sede em <span data-bind="company_address_full"></span>.
    </p>
    <p>
      <strong>Representante:</strong> <span data-bind="company_rep_name"></span> (<span data-bind="company_rep_role"></span>).
      Contato: <span data-bind="company_email"></span> • <span data-bind="company_phone"></span>.
    </p>

    <p>
      <strong>CONTRATANTE:</strong> <span class="pii" data-bind="client_name"></span>,
      documento <span class="pii" data-bind="client_doc"></span>, e-mail <span class="pii" data-bind="client_email"></span>,
      telefone <span class="pii" data-bind="client_phone"></span>, endereço <span class="pii" data-bind="client_address"></span>.
    </p>

    <h2>CLÁUSULA 1ª – OBJETO</h2>
<p data-bind="service_description">[Descreva o serviço contratado]</p>

<h2>CLÁUSULA 2ª – ESCOPO E ENTREGÁVEIS</h2>
<p>
  Os serviços incluem somente os itens descritos na Cláusula 1ª e/ou em anexo (escopo/brief). Qualquer atividade não prevista será considerada demanda extra, mediante novo orçamento e prazo.
</p>

<h2>CLÁUSULA 3ª – VALOR E CONDIÇÕES DE PAGAMENTO</h2>
<p>
  Valor total: <strong>R$ <span data-bind="total_value"></span></strong>.<br><br>
  Condições: <span data-bind="payment_terms"></span>.
</p>

<h2>CLÁUSULA 4ª – PRAZO</h2>
<p>
  Início previsto: <span data-bind="start_date"></span>.<br>
  Duração: <span data-bind="duration"></span>.<br><br>
  O cronograma pode ser ajustado por acordo entre as partes, mediante registro por escrito.
</p>

<h2>CLÁUSULA 5ª – APROVAÇÕES E PRAZOS DE RESPOSTA</h2>
<p>
  O <strong>CONTRATANTE</strong> deverá enviar materiais, acessos e aprovações em até 5 (cinco) dias úteis após solicitação. A ausência de retorno dentro do prazo reagendará o cronograma, sem penalidade à <strong>CONTRATADA</strong>, mantendo-se os valores contratados.
</p>

<h2>CLÁUSULA 6ª – OBRIGAÇÕES DAS PARTES</h2>
<p>
  <strong>CONTRATADA:</strong> entregar os serviços descritos na Cláusula 1ª dentro do prazo acordado, com qualidade, sigilo e eficiência técnica.<br><br>
  <strong>CONTRATANTE:</strong> efetuar os pagamentos nas datas previstas, fornecer informações e materiais necessários e cooperar conforme solicitado.
</p>

<h2>CLÁUSULA 7ª – PORTFÓLIO E DIVULGAÇÃO</h2>
<p>
  A <strong>CONTRATADA</strong> poderá exibir peças produzidas em portfólio e redes sociais, após publicação oficial pelo <strong>CONTRATANTE</strong>, resguardando informações confidenciais.<br><br>
  Caso o <strong>CONTRATANTE</strong> solicite sigilo total por escrito, essa exibição será vedada.
</p>

<h2>CLÁUSULA 8ª – INADIMPLÊNCIA E SUSPENSÃO</h2>
<p>
  O atraso no pagamento implicará multa de 5% (cinco por cento), juros de 2% (dois por cento) ao mês e correção monetária.<br><br>
  Persistindo o atraso por mais de 15 (quinze) dias, a <strong>CONTRATADA</strong> poderá suspender os serviços até regularização, com readequação de prazos.
</p>

<h2>CLÁUSULA 9ª – CONFIDENCIALIDADE E PROTEÇÃO DE DADOS (LGPD)</h2>
<p>
  As partes comprometem-se a manter sigilo sobre informações estratégicas, credenciais e acessos compartilhados no contexto deste contrato.<br><br>
  Havendo tratamento de dados pessoais, as partes observarão a LGPD, limitando o uso ao necessário para execução do contrato, adotando medidas razoáveis de segurança.
</p>

<h2>CLÁUSULA 10ª – DA AUSÊNCIA DE DEVOLUÇÃO (NÃO REEMBOLSO)</h2>
<p>
  <strong>10.1.</strong> Em razão da natureza intelectual dos serviços e da imediata alocação de tempo, equipe e recursos pela <strong>CONTRATADA (HRZN / Horizon Interactive Studios)</strong>, fica estabelecido que todos os valores pagos pelo <strong>CONTRATANTE</strong> são irretratáveis e não reembolsáveis, não sendo admitida, em hipótese alguma, devolução total ou parcial, estorno, chargeback, abatimento ou compensação a qualquer título.<br><br>

  <strong>10.2.</strong> A regra do item 10.1 aplica-se tanto a serviços únicos/pontuais (pagos à vista ou parcelados) quanto a serviços recorrentes/continuados, incluindo, mas não se limitando a: marketing, social media, gestão de tráfego, produção de conteúdo, design, estratégia, consultorias e atividades correlatas.<br><br>

  <strong>10.3.</strong> Em caso de rescisão por qualquer motivo, os valores já pagos permanecerão com a <strong>CONTRATADA</strong>, e eventuais parcelas/mensalidades vencidas até a data efetiva da rescisão deverão ser integralmente quitadas pelo <strong>CONTRATANTE</strong>.
</p>

<h2>CLÁUSULA 11ª – RESCISÃO</h2>
<p>
  <strong>11.1.</strong> O contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 7 (sete) dias, por escrito.<br><br>

  <strong>11.2.</strong> Em caso de rescisão, será realizado apenas o acerto de contas para apuração de valores eventualmente devidos até a data efetiva da rescisão, sem qualquer devolução, total ou parcial, de valores já pagos, nos termos da Cláusula 10ª.<br><br>

  <strong>11.3.</strong> Para serviços recorrentes/continuados, a rescisão comunicada durante o período vigente produzirá efeitos ao final do ciclo já contratado/pago, não havendo reembolso ou estorno proporcional.

</p>

<h2>CLÁUSULA 12ª – DISPOSIÇÕES GERAIS</h2>
<p>
  Este contrato não gera vínculo empregatício entre as partes.<br><br>
  Qualquer alteração deste instrumento somente terá validade se feita por escrito e assinada por ambas as partes.
</p>

<h2>CLÁUSULA 13ª – DOCUMENTOS INTEGRANTES E ORDEM DE PREVALÊNCIA</h2>
<p>
  <strong>13.1.</strong> Integram o presente contrato, para todos os fins: (i) Proposta Comercial/Orçamento; (ii) Briefing/Anexo de Escopo (SOW); (iii) Cronograma, quando houver; (iv) Aditivos; e (v) comunicações formais por e-mail/plataforma oficial que alterem escopo/prazo/valor.<br><br>

  <strong>13.2.</strong> Em caso de divergência entre documentos, prevalecerá a seguinte ordem: (a) Contrato; (b) Aditivos assinados; (c) Anexo de Escopo/Briefing; (d) Proposta Comercial; (e) demais comunicações formais.<br><br>

  <strong>13.3.</strong> Mensagens em aplicativos (ex.: WhatsApp/Direct) terão caráter meramente operacional e não alteram escopo, prazos ou valores, salvo se formalizadas nos termos do item 13.1.
</p>

<h2>CLÁUSULA 14ª – GESTÃO DE MUDANÇAS, DEMANDAS EXTRAS E ADITIVOS</h2>
<p>
  <strong>14.1.</strong> Qualquer solicitação do <strong>CONTRATANTE</strong> que altere o escopo, a complexidade, o volume de entregas, a quantidade de peças, a duração, a plataforma, os formatos ou os requisitos definidos no Anexo de Escopo será tratada como “Mudança de Escopo”.<br><br>

  <strong>14.2.</strong> Mudanças de Escopo somente serão executadas mediante: (i) orçamento complementar (ou reprecificação), (ii) novo prazo/cronograma e (iii) aceite formal do <strong>CONTRATANTE</strong> por escrito.<br><br>

  <strong>14.3.</strong> Até a formalização do aditivo, a <strong>CONTRATADA</strong> poderá manter a execução apenas do escopo originalmente contratado, sem caracterizar descumprimento.
</p>

<h2>CLÁUSULA 15ª – RODADAS DE AJUSTES, CRITÉRIOS DE APROVAÇÃO E ACEITE TÁCITO</h2>
<p>
  <strong>15.1.</strong> Salvo disposição diversa no Anexo de Escopo, estão incluídas até <strong>2</strong> rodadas de ajustes por entrega/peça/etapa.<br><br>

  <strong>15.2.</strong> Considera-se “rodada de ajustes” o envio de uma lista única e consolidada de alterações solicitadas pelo <strong>CONTRATANTE</strong>. Solicitações fracionadas, sucessivas ou fora do mesmo envio poderão ser computadas como novas rodadas.<br><br>

  <strong>15.3.</strong> Alterações após a aprovação (incluindo mudança de direção, troca de referências, mudanças de texto/copy já aprovada, ou retrabalho por decisão do <strong>CONTRATANTE</strong>) serão consideradas demanda extra, sujeitas a orçamento e prazo adicionais.<br><br>

  <strong>15.4.</strong> Caso o <strong>CONTRATANTE</strong> não se manifeste em até <strong>5</strong> dias úteis após o envio para aprovação, a entrega será considerada aprovada por aceite tácito, seguindo o fluxo do cronograma.
</p>

<h2>CLÁUSULA 16ª – COMUNICAÇÃO OFICIAL, REUNIÕES E REGISTROS</h2>
<p>
  <strong>16.1.</strong> As partes elegem como canais oficiais para solicitações, validações e aprovações: <strong>[e-mail / plataforma de gestão / Drive / Trello / Notion]</strong>.<br><br>
  
  <strong>16.2.</strong> Decisões que impactem escopo, prazo ou valor somente terão validade se formalizadas nos canais oficiais.
</p>

<h2>CLÁUSULA 17ª – MATERIAIS DO CONTRATANTE, DIREITOS DE TERCEIROS E RESPONSABILIDADE</h2>
<p>
  <strong>17.1.</strong> O <strong>CONTRATANTE</strong> declara ser titular ou possuir autorização/licenças para uso de todo e qualquer material fornecido à <strong>CONTRATADA</strong> (imagens, vídeos, áudios, músicas, fontes, marcas, depoimentos, dados, listas, textos, logotipos e demais conteúdos).<br><br>

  <strong>17.2.</strong> Eventuais reivindicações de terceiros, notificações, strikes, bloqueios, denúncias, remoções ou ações decorrentes de materiais/instruções fornecidas pelo <strong>CONTRATANTE</strong> serão de sua exclusiva responsabilidade, obrigando-se a isentar e indenizar a <strong>CONTRATADA</strong> por quaisquer custos, perdas, danos, multas e despesas (inclusive honorários advocatícios).<br><br>

  <strong>17.3.</strong> A <strong>CONTRATADA</strong> poderá suspender entregas e/ou publicações caso identifique risco jurídico ou violação de direitos/políticas, sem penalidade, até regularização pelo <strong>CONTRATANTE</strong>.
</p>

<h2>CLÁUSULA 18ª – PROPRIEDADE INTELECTUAL, LICENÇA DE USO, ARQUIVOS-FONTE E CONDIÇÃO DE TRANSFERÊNCIA</h2>
<p>
  <strong>18.1.</strong> Salvo ajuste diverso no Anexo de Escopo, os direitos patrimoniais/cessão ou licença de uso sobre as entregas finais serão concedidos ao <strong>CONTRATANTE</strong> somente após a quitação integral de todos os valores devidos (incluindo extras e aditivos).<br><br>

  <strong>18.2.</strong> Até a quitação integral, o <strong>CONTRATANTE</strong> recebe licença de uso restrita, revogável e não exclusiva, apenas para fins de validação interna, vedada publicação/veiculação comercial.<br><br>

  <strong>18.3.</strong> Os arquivos editáveis/fonte (ex.: PSD, arquivos vetoriais editáveis, AEP, PRPROJ, FIG, arquivos de projeto, presets, códigos-fonte e equivalentes) não estão incluídos, salvo se expressamente contratado no Anexo de Escopo, mediante valor adicional e condições específicas.<br><br>

  <strong>18.4.</strong> Elementos pré-existentes da <strong>CONTRATADA</strong> (frameworks, componentes próprios, bibliotecas, métodos, scripts, presets, assets internos e know-how) permanecem de titularidade da <strong>CONTRATADA</strong>, sendo concedida ao <strong>CONTRATANTE</strong> apenas licença de uso conforme necessário ao projeto, quando aplicável.<br><br>

</p>

<h2>CLÁUSULA 19ª – ACESSOS, CREDENCIAIS E SEGURANÇA (QUANDO APLICÁVEL)</h2>
<p>
  <strong>19.1.</strong> O <strong>CONTRATANTE</strong> fornecerá acessos necessários (contas de anúncios, redes sociais, hospedagem, domínio, CMS, e-mails, CRM) preferencialmente por meios seguros e com permissões mínimas necessárias.<br><br>

  <strong>19.2.</strong> A <strong>CONTRATADA</strong> não se responsabiliza por bloqueios, limitações, perda de acesso, recuperação de senha, autenticação em dois fatores não disponibilizada, mudanças de titularidade ou restrições impostas por terceiros.<br><br>

  <strong>19.3.</strong> Sempre que possível, a <strong>CONTRATADA</strong> atuará como colaboradora/administradora, sem assumir propriedade das contas, que deverão permanecer sob titularidade do <strong>CONTRATANTE</strong>.
</p>

<h2>CLÁUSULA 20ª – TRÁFEGO PAGO, VERBA DE MÍDIA E POLÍTICAS DE PLATAFORMAS (QUANDO APLICÁVEL)</h2>
<p>
  <strong>20.1.</strong> A verba de mídia (investimento em anúncios) não integra o valor dos serviços da <strong>CONTRATADA</strong>, sendo paga diretamente pelo <strong>CONTRATANTE</strong> às plataformas (Meta/Google/TikTok e outras), salvo ajuste expresso por escrito.<br><br>

  <strong>20.2.</strong> Reprovações, limitações, bloqueios, instabilidades e mudanças de políticas das plataformas podem impactar performance, prazos e entregas, não caracterizando inadimplemento da <strong>CONTRATADA</strong>.<br><br>

  <strong>20.3.</strong> Publicações e campanhas que dependam de aprovação do <strong>CONTRATANTE</strong> somente serão veiculadas após aceite formal. A ausência de aprovação dentro do prazo poderá readequar cronograma e resultados esperados, sem penalidade à <strong>CONTRATADA</strong>.
</p>

<h2>CLÁUSULA 21ª – AUSÊNCIA DE GARANTIA DE RESULTADOS (MARKETING, VENDAS E PERFORMANCE)</h2>
<p>
  <strong>21.1.</strong> A <strong>CONTRATADA</strong> obriga-se a empregar melhores esforços técnicos e profissionais na execução do escopo, porém não garante resultados específicos (ex.: volume de leads, vendas, faturamento, ROI, alcance, engajamento), por dependerem de fatores alheios ao controle da <strong>CONTRATADA</strong> (mercado, oferta, preço, atendimento/comercial do <strong>CONTRATANTE</strong>, sazonalidade, orçamento de mídia, qualidade de base, concorrência e algoritmos).<br><br>

  <strong>21.2.</strong> Indicadores e metas, quando estabelecidos, terão caráter estimativo e orientativo, não configurando promessa de resultado.
</p>

<h2>CLÁUSULA 22ª – PAUSA POR INÉRCIA, REAGENDA, ARMAZENAMENTO E REENVIO DE ARQUIVOS</h2>
<p>
  <strong>22.1.</strong> Caso o <strong>CONTRATANTE</strong> deixe de fornecer materiais/aprovações por período superior a <strong>7</strong> dias corridos, o projeto poderá ser colocado em “pausa por inércia”, com readequação automática de prazos, sem alteração dos valores.<br><br>

  <strong>22.2.</strong> Persistindo a inércia por mais de <strong>14</strong> dias corridos, a <strong>CONTRATADA</strong> poderá encerrar administrativamente o projeto, mantendo-se devidos os valores vencidos e/ou do ciclo vigente, observadas as regras de não reembolso previstas neste contrato.<br><br>

</p>

<h2>CLÁUSULA 23ª – SUBCONTRATAÇÃO E EQUIPE</h2>
<p>
  <strong>23.1.</strong> A <strong>CONTRATADA</strong> poderá subcontratar profissionais/parceiros para execução parcial do escopo, permanecendo responsável pela gestão e qualidade das entregas.<br><br>
</p>

<h2>CLÁUSULA 24ª – LIMITAÇÃO DE RESPONSABILIDADE</h2>
<p>
  <strong>25.1.</strong> A responsabilidade total da <strong>CONTRATADA</strong> por quaisquer danos, perdas ou reclamações decorrentes deste contrato ficará limitada ao montante efetivamente pago pelo <strong>CONTRATANTE</strong> à <strong>CONTRATADA</strong> nos últimos <strong>1</strong> meses (ou ao valor total do contrato, se menor).<br><br>

  <strong>25.2.</strong> Em nenhuma hipótese a <strong>CONTRATADA</strong> responderá por lucros cessantes, perda de chance, danos indiretos, incidentais, punitivos ou consequenciais.<br><br>
  
  <strong>25.3.</strong> A limitação prevista nesta cláusula não se aplica a casos de dolo comprovado.
</p>

<h2>CLÁUSULA 25ª – INDENIZAÇÃO (RESSARCIMENTO)</h2>
<p>
  <strong>26.1.</strong> O <strong>CONTRATANTE</strong> indenizará a <strong>CONTRATADA</strong> por quaisquer reclamações, autuações, multas, penalidades, custos, despesas e honorários (inclusive advocatícios) decorrentes de: (i) materiais fornecidos pelo <strong>CONTRATANTE</strong>; (ii) instruções do <strong>CONTRATANTE</strong>; (iii) descumprimento de políticas de plataforma pelo <strong>CONTRATANTE</strong>; (iv) atos de seus prepostos/colaboradores; (v) uso indevido das entregas fora do contexto contratado.<br><br>

  <strong>26.2.</strong> A <strong>CONTRATADA</strong> comunicará o <strong>CONTRATANTE</strong> sobre a ocorrência, quando aplicável, e poderá suspender as atividades até a regularização.
</p>

<h2>CLÁUSULA 26ª – CASO FORTUITO, FORÇA MAIOR E EVENTOS DE TERCEIROS</h2>
<p>
  <strong>27.1.</strong> Nenhuma das partes será responsável por atrasos ou falhas decorrentes de caso fortuito/força maior, incluindo, mas não se limitando a: quedas de energia, indisponibilidade de servidores, falhas de internet, ataques cibernéticos, greves, calamidades, indisponibilidade de plataformas e serviços de terceiros.<br><br>

  <strong>27.2.</strong> Ocorrendo tais eventos, os prazos serão prorrogados pelo período necessário, sem penalidades, mantendo-se as obrigações financeiras do período já contratado.
</p>

<h2>CLÁUSULA 27ª – ASSINATURA ELETRÔNICA E VALIDADE</h2>
<p>
  <strong>28.1.</strong> As partes reconhecem a validade de assinatura eletrônica/digital e de evidências eletrônicas (e-mails, registros em plataformas de gestão e comprovantes) como meios hábeis para comprovação de aceite, pagamentos e alterações formalizadas.<br><br>
  <strong>28.2.</strong> A assinatura eletrônica produzirá os mesmos efeitos da assinatura física, para todos os fins de direito.
</p>


    <div class="sep" style="background: rgba(0,0,0,.08)"></div>
    <p class="muted small">
      Ao assinar, as partes declaram que leram e concordam com os termos acima.
    </p>

    <div class="siggrid" id="sigGrid">
      <div class="sig">
        <strong>CONTRATANTE</strong>
        <span class="pii" data-bind="client_name"></span>
        <span class="muted pii" data-bind="client_doc"></span>
      </div>
      <div class="sig">
        <strong>CONTRATADA</strong>
        <span data-bind="company_trade"></span>
        <span class="muted" data-bind="company_cnpj"></span>
      </div>
    </div>
  </div>
  `;
}

function buildContractDataBase(){
  const c = state.config?.company || {};
  const fullAddr = [c.addressLine, c.neighborhood, `${c.city} - ${c.state}`, c.zip].filter(Boolean).join(", ");
  const now = new Date();
  const dateLong = now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day:"2-digit", month:"long", year:"numeric" });

  return {
    contract_title: "Contrato de Prestação de Serviços",
    date_long: dateLong,
    company_trade: c.tradeName || "",
    company_legal: c.legalName || "",
    company_cnpj: c.cnpj || "",
    company_address_full: fullAddr || "",
    company_city_state: [c.city, c.state].filter(Boolean).join(" - "),
    company_city: c.city || "",
    company_state: c.state || "",
    company_email: c.email || "",
    company_phone: c.phone || "",
    company_rep_name: c.representativeName || "",
    company_rep_role: c.representativeRole || "",

    client_name: "",
    client_doc: "",
    client_email: "",
    client_phone: "",
    client_address: "",

    service_description: "",
    total_value: "",
    payment_terms: "",
    start_date: "",
    duration: "",
  };
}

function openContractEditor({contractId=null, clientId=null}={}){
  const isEdit = Boolean(contractId);
  const existing = contractId ? getContractById(contractId) : null;

  const base = buildContractDataBase();
  const data = { ...base, ...(existing?.data || {}) };

  // se veio com clientId, preenche campos do cliente a partir do cadastro
  if (clientId){
    const c = getClientById(clientId);
    if (c){
      data.client_name = c.name || data.client_name;
      data.client_doc = c.doc || data.client_doc;
      data.client_email = c.email || data.client_email;
      data.client_phone = c.phone || data.client_phone;
      data.client_address = c.address || data.client_address;
    }
  } else if (existing?.clientId){
    const c = getClientById(existing.clientId);
    if (c){
      data.client_name = data.client_name || c.name || "";
      data.client_doc = data.client_doc || c.doc || "";
      data.client_email = data.client_email || c.email || "";
      data.client_phone = data.client_phone || c.phone || "";
      data.client_address = data.client_address || c.address || "";
    }
  }

  openModal({
    title: isEdit ? "Editar contrato" : "Novo contrato",
    body: `
      <div class="editor">
        <div class="card no-print" style="box-shadow:none">
          <div class="card__hd">
            <div class="card__title">Dados do contrato</div>
            <div class="muted">${isEdit ? escapeHtml(existing.id) : "Rascunho"}</div>
          </div>
          <div class="card__bd">
            <div class="form">
              <div class="field">
                <label>Título</label>
                <input id="k_title" value="${escapeHtml(existing?.title || data.contract_title)}" placeholder="Contrato de Prestação de Serviços"/>
              </div>
              <div class="field">
                <label>Cliente vinculado</label>
                <select id="k_clientId" class="pii">
                  <option value="">(selecionar)</option>
                  ${state.clients.map(c=>`<option value="${c.id}" ${(existing?.clientId===c.id || clientId===c.id) ? "selected":""}>${escapeHtml(c.name)}</option>`).join("")}
                </select>
                
              </div>
              <div class="sep"></div>

              <div class="field">
                <label>Nome do cliente</label>
                <input id="f_client_name" class="pii" value="${escapeHtml(data.client_name)}" placeholder="Nome completo / Razão social"/>
              </div>
              <div class="field">
                <label>Documento (CPF/CNPJ)</label>
                <input id="f_client_doc" class="pii" value="${escapeHtml(data.client_doc)}"/>
              </div>
              <div class="field">
                <label>E-mail</label>
                <input id="f_client_email" class="pii" value="${escapeHtml(data.client_email)}"/>
              </div>
              <div class="field">
                <label>Telefone</label>
                <input id="f_client_phone" class="pii" value="${escapeHtml(data.client_phone)}"/>
              </div>
              <div class="field">
                <label>Endereço</label>
                <textarea id="f_client_address" class="pii">${escapeHtml(data.client_address)}</textarea>
              </div>

              <div class="sep"></div>

              <div class="field">
                <label>Descrição do serviço</label>
                <textarea id="f_service_description" placeholder="Descreva o serviço contratado">${escapeHtml(data.service_description)}</textarea>
              </div>

              <div class="grid2">
                <div class="field">
                  <label>Data de início</label>
                  <input id="f_start_date" value="${escapeHtml(data.start_date)}" placeholder="dd/mm/aaaa"/>
                </div>
                <div class="field">
                  <label>Duração</label>
                  <input id="f_duration" value="${escapeHtml(data.duration)}" placeholder="Prazo contratado"/>
                </div>
              </div>

              <div class="grid2">
                <div class="field">
                  <label>Valor total (somente números)</label>
                  <input id="f_total_value" value="${escapeHtml(data.total_value)}" placeholder="800,00"/>
                </div>
                <div class="field">
                  <label>Status do contrato</label>
                  <select id="k_status">
                    ${CONTRACT_STATUS.map(s=>`<option value="${s.key}" ${(existing?.status||"rascunho")===s.key?"selected":""}>${escapeHtml(s.label)}</option>`).join("")}
                  </select>
                </div>
              </div>

              <div class="field">
                <label>Condições de pagamento</label>
                <textarea id="f_payment_terms" placeholder="Condições de pagamento">${escapeHtml(data.payment_terms)}</textarea>
              </div>

              <div class="sep"></div>

              <div class="field">
                <label>Assinantes extras (opcional)</label>
                <div class="muted" style="font-size:12px; margin-bottom:6px">Ex: responsável financeiro, sócio, procurador.</div>
                <div id="extraSigners"></div>
                <button class="btn btn--ghost" id="addSigner" type="button">+ Adicionar assinante</button>
              </div>

              <div class="sep"></div>

              <div class="field">
                <label>Salvar e anexos</label>
                <div style="display:flex; gap:10px; flex-wrap:wrap">
                  <button class="btn btn--primary" id="k_save">${isEdit ? "Salvar alterações" : "Salvar contrato"}</button>
                  <button class="btn btn--ghost" id="k_pdf">Baixar PDF</button>
                  <label class="btn btn--ghost" for="k_upload">Upload PDF/arquivo</label>
                  <input id="k_upload" type="file" hidden />
                </div>
              </div>

             
            </div>
          </div>
        </div>

        <div class="print-only"></div>

        <div class="card" style="box-shadow:none">
          
          <div class="card__bd" id="previewWrap">
            ${contractTemplateHTML()}
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn--ghost" data-close="1">Fechar</button>
    `,
    onMount: ()=>{
      // extra signers
      let signers = Array.isArray(existing?.data?.signersExtra) ? structuredClone(existing.data.signersExtra) : [];
      const extraEl = $("#extraSigners");
      function renderSigners(){
        extraEl.innerHTML = signers.map((s, i)=>`
          <div class="grid2" style="align-items:end; margin-bottom:10px" data-i="${i}">
            <div class="field">
              <label>Nome</label>
              <input value="${escapeHtml(s.name||"")}" data-s="name" placeholder="Nome do assinante"/>
            </div>
            <div class="field">
              <label>Informação</label>
              <input value="${escapeHtml(s.info||"")}" data-s="info" placeholder="CPF/CNPJ ou cargo"/>
            </div>
            <div style="display:flex; justify-content:flex-end">
              <button class="btn btn--danger" type="button" data-del="1">Remover</button>
            </div>
          </div>
        `).join("");

        // listeners
        $$("[data-i]", extraEl).forEach(row=>{
          const i = Number(row.dataset.i);
          row.addEventListener("input", (e)=>{
            const inp = e.target.closest("input[data-s]");
            if (!inp) return;
            const key = inp.dataset.s;
            signers[i][key] = inp.value;
            updatePreview();
          });
          row.addEventListener("click", (e)=>{
            if (!e.target.closest("button[data-del]")) return;
            signers.splice(i,1);
            renderSigners();
            updatePreview();
          });
        });
      }
      $("#addSigner").addEventListener("click", ()=>{
        signers.push({name:"", info:""});
        renderSigners();
        updatePreview();
      });
      renderSigners();

      const bindFields = [
        ["f_client_name", "client_name"],
        ["f_client_doc", "client_doc"],
        ["f_client_email", "client_email"],
        ["f_client_phone", "client_phone"],
        ["f_client_address", "client_address"],
        ["f_service_description", "service_description"],
        ["f_total_value", "total_value"],
        ["f_payment_terms", "payment_terms"],
        ["f_start_date", "start_date"],
        ["f_duration", "duration"],
      ];

      function getCurrentBindings(){
        const out = buildContractDataBase();
        // mantém base de empresa/data, mas substitui valores do form
        for (const [id, key] of bindFields){
          out[key] = $("#"+id).value.trim();
        }
        out.contract_title = $("#k_title").value.trim() || out.contract_title;
        out.signersExtra = signers.filter(s => (s.name||"").trim() || (s.info||"").trim());
        return out;
      }

      function applyBindingsToDoc(docEl, bindings){
        $$("[data-bind]", docEl).forEach(node=>{
          const key = node.getAttribute("data-bind");
          const value = bindings[key] ?? "";
          node.textContent = value || "—";
        });

        // assinantes extras
        const grid = $("#sigGrid", docEl);
        // remove extras atuais
        $$(".sig.is-extra", grid).forEach(x=>x.remove());

        for (const s of (bindings.signersExtra || [])){
          const box = document.createElement("div");
          box.className = "sig is-extra";
          box.innerHTML = `
            <strong>ASSINANTE</strong>
            <span>${escapeHtml(s.name||"")}</span>
            <span class="muted">${escapeHtml(s.info||"")}</span>
          `;
          grid.appendChild(box);
        }
      }

      function updatePreview(){
        const doc = $("#contractDoc");
        const bindings = getCurrentBindings();
        applyBindingsToDoc(doc, bindings);
      }

      // initial preview
      updatePreview();

      // listeners
      bindFields.forEach(([id])=>{
        $("#"+id).addEventListener("input", updatePreview);
      });
      $("#k_title").addEventListener("input", updatePreview);

      // pull client data when selecting client
      $("#k_clientId").addEventListener("change", ()=>{
        const cid = $("#k_clientId").value;
        if (!cid) return;
        const c = getClientById(cid);
        if (!c) return;
        // Só preenche se campos estiverem vazios OU se o usuário confirmar overwrite
        const hasAny = ["f_client_name","f_client_doc","f_client_email","f_client_phone","f_client_address"].some(id => $("#"+id).value.trim());
        if (hasAny && !confirm("Puxar dados do cadastro do cliente e sobrescrever os campos do contrato?")) return;

        $("#f_client_name").value = c.name || "";
        $("#f_client_doc").value = c.doc || "";
        $("#f_client_email").value = c.email || "";
        $("#f_client_phone").value = c.phone || "";
        $("#f_client_address").value = c.address || "";
        updatePreview();
      });

      // Save contract
      $("#k_save").addEventListener("click", async ()=>{
        const payload = {
          title: $("#k_title").value.trim() || "Contrato",
          clientId: $("#k_clientId").value,
          status: $("#k_status").value,
          data: getCurrentBindings()
        };

        if (isEdit){
          const res = await api.updateContract(existing.id, payload);
          if (!res.ok) return toast("Erro ao salvar: "+(res.error||""), "err");
          toast("Contrato atualizado", "ok");
        }else{
          const res = await api.createContract(payload);
          if (!res.ok) return toast("Erro ao salvar: "+(res.error||""), "err");
          toast("Contrato salvo", "ok");
        }
        await refreshAll();
      });

      // PDF
      $("#k_pdf").addEventListener("click", async ()=>{
        // sempre salva antes de gerar? opcional
        updatePreview();
        const title = ($("#k_title").value.trim() || "Contrato").replace(/[<>:"/\\|?*]+/g,"_").slice(0,80);
        const element = $("#contractDoc");
        await generatePDFElement(element, `${title}.pdf`);
      });

      // Upload
      $("#k_upload").addEventListener("change", async (e)=>{
        const file = e.target.files?.[0];
        if (!file) return;

        const cid = $("#k_clientId").value || existing?.clientId || "";
        if (!cid){
          toast("Selecione um cliente para associar o upload", "warn");
          return;
        }

        const contractIdForUpload = existing?.id || null;
        const res = await api.uploadFile({ clientId: cid, contractId: contractIdForUpload, fileType: "contrato", file });
        if (res.ok){
          toast("Upload concluído", "ok");
          await refreshAll();
        }else{
          toast("Falha no upload: "+res.error, "err");
        }
      });
    }
  });
}

async function generatePDFElement(element, filename){
  // html2pdf config
  const opt = {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };
  try{
    await html2pdf().set(opt).from(element).save();
  }catch(e){
    toast("Falha ao gerar PDF (tente novamente).", "err");
    console.error(e);
  }
}

async function generatePDFForContract(contractId){
  const k = getContractById(contractId);
  if (!k) return;
  // cria container offscreen
  const off = document.createElement("div");
  off.style.position = "fixed";
  off.style.left = "-99999px";
  off.style.top = "0";
  off.style.width = "900px";
  off.innerHTML = contractTemplateHTML();
  document.body.appendChild(off);

  // aplica binds
  const base = buildContractDataBase();
  const bindings = { ...base, ...(k.data||{}) };
  // repopula dados do cliente se faltando
  const client = getClientById(k.clientId);
  if (client){
    bindings.client_name = bindings.client_name || client.name || "";
    bindings.client_doc = bindings.client_doc || client.doc || "";
    bindings.client_email = bindings.client_email || client.email || "";
    bindings.client_phone = bindings.client_phone || client.phone || "";
    bindings.client_address = bindings.client_address || client.address || "";
  }

  const doc = $("#contractDoc", off);
  $$("[data-bind]", doc).forEach(node=>{
    const key = node.getAttribute("data-bind");
    node.textContent = bindings[key] ?? "—";
  });

  // extras
  const grid = $("#sigGrid", doc);
  for (const s of (bindings.signersExtra || [])){
    const box = document.createElement("div");
    box.className = "sig is-extra";
    box.innerHTML = `
      <strong>ASSINANTE</strong>
      <span>${escapeHtml(s.name||"")}</span>
      <span class="muted">${escapeHtml(s.info||"")}</span>
    `;
    grid.appendChild(box);
  }

  const safeTitle = (k.title || "Contrato").replace(/[<>:"/\\|?*]+/g,"_").slice(0,80);
  await generatePDFElement(doc, `${safeTitle}.pdf`);
  off.remove();
}


/* ---------- Contas a pagar ---------- */
function billsForMonth(key){
  return (state.bills || []).filter(b => yyyymm(b.dueDate) === key);
}
function billsForYear(year){
  const y = String(year || "");
  return (state.bills || []).filter(b => String(b.dueDate || "").startsWith(y + "-"));
}
function sumBills(bills){
  return (bills || []).reduce((acc,b)=> acc + (Number(b.amountCents||0)||0), 0);
}
function billComputedStatus(b){
  if ((b.status||"") === "paid") return "paid";
  const today = todayISO();
  if ((b.dueDate||"") && b.dueDate < today) return "overdue";
  return "pending";
}
function billStatusLabel(st){
  if (st==="paid") return "Pago";
  if (st==="overdue") return "Em atraso";
  return "Pendente";
}
function billStatusTag(st){
  if (st==="paid") return `<span class="tag is-ok"><span class="tag__dot"></span>Pago</span>`;
  if (st==="overdue") return `<span class="tag is-bad"><span class="tag__dot"></span>Em atraso</span>`;
  return `<span class="tag is-warn"><span class="tag__dot"></span>Pendente</span>`;
}

function renderBills(){
  try{ localStorage.setItem("billsFilter", JSON.stringify(state.billsFilter)); }catch{}

  const year = Number(state.billsFilter.year);
  const month = Number(state.billsFilter.month ?? 0);
  const view = state.billsFilter.view || "pending";
  const key = month === 0 ? null : monthKey(year, month);
  const monthLabel = month === 0 ? "Todos os meses" : (MONTHS[month-1] || "");
  const periodLabel = month === 0 ? "no ano" : "no mês";
  const periodTotalLabel = month === 0 ? "do ano" : "do mês";

  const years = Array.from(new Set((state.bills||[]).map(b=> Number((b.dueDate||"").slice(0,4))).filter(Boolean).concat([new Date().getFullYear()]))).sort((a,b)=>b-a);

  let bills = (month===0 ? billsForYear(year) : billsForMonth(key)).slice().sort((a,b)=> (a.dueDate||"").localeCompare(b.dueDate||""));
  const computed = bills.map(b=>({ ...b, computedStatus: billComputedStatus(b) }));

  let shown = computed;
  if (view === "pending") shown = computed.filter(b=>b.computedStatus !== "paid");
  if (view === "paid") shown = computed.filter(b=>b.computedStatus === "paid");

  const pending = computed.filter(b=>b.computedStatus === "pending");
  const overdue = computed.filter(b=>b.computedStatus === "overdue");
  const paid = computed.filter(b=>b.computedStatus === "paid");

  const totalPending = sumBills(pending) + sumBills(overdue);
  const totalPaid = sumBills(paid);
  const totalAll = sumBills(computed);

  const overdueOutside = (state.bills||[])
    .map(b=>({ ...b, computedStatus: billComputedStatus(b) }))
    .filter(b=> b.computedStatus === "overdue" && String(b.dueDate||"").startsWith(String(year) + "-") && (month===0 || yyyymm(b.dueDate) !== key))
    .sort((a,b)=> (a.dueDate||"").localeCompare(b.dueDate||""));

  const wrap = document.createElement("div");
  wrap.className = "content";

  const controls = document.createElement("div");
  controls.className = "card";
  controls.innerHTML = `
    <div class="card__hd">
      <div class="card__title">Contas a pagar</div>
    </div>
    <div class="card__bd">
      <div class="bills-head">
        <select class="select" id="billMonth">
          <option value="0" ${month===0?"selected":""}>Todos</option>
          ${MONTHS.map((m, i)=>`<option value="${i+1}" ${month===i+1?"selected":""}>${escapeHtml(m)}</option>`).join("")}
        </select>
        <select class="select" id="billYear">
          ${years.map(y=>`<option value="${y}" ${year===y?"selected":""}>${y}</option>`).join("")}
        </select>
        <select class="select" id="billView">
          <option value="pending" ${view==="pending"?"selected":""}>Pendentes</option>
          <option value="paid" ${view==="paid"?"selected":""}>Pagas</option>
          <option value="all" ${view==="all"?"selected":""}>Todas</option>
        </select>
        <button class="btn btn--primary" id="billNew">+ Nova conta</button>
      </div>
    </div>
  `;
  wrap.appendChild(controls);

  if (overdueOutside.length){
    const groups = overdueOutside.reduce((acc, b)=>{
      const k = yyyymm(b.dueDate);
      (acc[k] = acc[k] || []).push(b);
      return acc;
    }, {});
    const groupKeys = Object.keys(groups).sort();
    const groupsHtml = groupKeys.map(k=>{
      const itemsHtml = (groups[k] || []).map(b=>`
        <div style="display:flex; gap:12px; justify-content:space-between; align-items:flex-start; flex-wrap:wrap">
          <div>
            <strong>${escapeHtml(b.name || "Conta")}</strong>
            <div class="muted" style="font-size:12.5px">Vencimento: ${fmtDate(b.dueDate)}</div>
          </div>
          <div><strong>${fmtMoney(b.amountCents)}</strong></div>
        </div>
      `).join("");
      return `
        <div class="card" style="box-shadow:none">
          <div class="card__hd" style="background: rgba(245,158,11,.10)">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">
              <strong>${escapeHtml(labelFromYearMonth(k))}</strong>
              <span class="tag is-bad"><span class="tag__dot"></span>Em atraso</span>
              <span class="muted" style="font-size:12.5px">${(groups[k]||[]).length} conta(s)</span>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end">
              <button class="btn btn--ghost btn--xs" data-bill-open="${k}">Abrir mês</button>
            </div>
          </div>
          <div class="card__bd">
            <div style="display:grid; gap:8px">${itemsHtml}</div>
          </div>
        </div>
      `;
    }).join("");

    const alertCard = document.createElement("div");
    alertCard.className = "card";
    alertCard.innerHTML = `
      <div class="card__hd">
        <div class="card__title">Contas em atraso</div>
        <div class="muted">Vencidas em outros meses • ${year}</div>
      </div>
      <div class="card__bd">
        <div class="muted">Você tem <strong>${overdueOutside.length}</strong> conta(s) vencida(s) fora do filtro atual.</div>
        <div class="sep"></div>
        <div style="display:grid; gap:12px">${groupsHtml}</div>
        <div class="sep"></div>
        <div style="display:flex; gap:10px; flex-wrap:wrap">
          <button class="btn btn--ghost btn--xs" data-bill-openall="1">Ver todos os meses</button>
        </div>
      </div>
    `;
    wrap.appendChild(alertCard);
  }

  const kpis = document.createElement("div");
  kpis.className = "bills-kpis";
  kpis.innerHTML = `
    <div class="kpi">
      <div class="kpi__label">Pendentes ${periodLabel}</div>
      <div class="kpi__value">${fmtMoney(totalPending)}</div>
      <div class="kpi__sub">${overdue.length} em atraso</div>
    </div>
    <div class="kpi">
      <div class="kpi__label">Pagas ${periodLabel}</div>
      <div class="kpi__value">${fmtMoney(totalPaid)}</div>
      <div class="kpi__sub">${paid.length} pagas</div>
    </div>
    <div class="kpi">
      <div class="kpi__label">Total ${periodTotalLabel}</div>
      <div class="kpi__value">${fmtMoney(totalAll)}</div>
      <div class="kpi__sub">${computed.length} contas registradas</div>
    </div>
  `;
  wrap.appendChild(kpis);

  const tableCard = document.createElement("div");
  tableCard.className = "card";
  tableCard.innerHTML = `
    <div class="card__hd">
      <div class="card__title">Lista</div>
      <div class="muted">${escapeHtml(monthLabel)} • ${year}</div>
    </div>
    <div class="card__bd">
      ${shown.length ? `
      <table class="table">
        <thead>
          <tr>
            <th>Conta</th>
            <th>Categoria</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th style="width:320px">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${shown.map(b=>`
            <tr data-id="${b.id}">
              <td><strong>${escapeHtml(b.name)}</strong><div class="muted" style="font-size:12px">${escapeHtml(b.id)}</div></td>
              <td>${escapeHtml(categoryName(b.categoryId) || "—")}</td>
              <td><strong>${fmtMoney(b.amountCents)}</strong></td>
              <td class="muted">${fmtDate(b.dueDate)}</td>
              <td>${billStatusTag(b.computedStatus)}</td>
              <td>
                <button class="btn btn--ghost" data-act="edit">Editar</button>
                ${b.computedStatus!=="paid" ? `<button class="btn btn--primary" data-act="pay">Marcar pago</button>` : `<button class="btn btn--ghost" data-act="unpay">Desfazer</button>`}
                <button class="btn btn--danger" data-act="del">Excluir</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ` : `<div class="muted">Nenhuma conta encontrada.</div>`}
    </div>
  `;
  wrap.appendChild(tableCard);

  setTimeout(()=>{
    $("#billMonth")?.addEventListener("change", ()=>{
      state.billsFilter.month = Number($("#billMonth").value);
      render();
    });
    $("#billYear")?.addEventListener("change", ()=>{
      state.billsFilter.year = Number($("#billYear").value);
      render();
    });
    $("#billView")?.addEventListener("change", ()=>{
      state.billsFilter.view = $("#billView").value;
      render();
    });
    $("#billNew")?.addEventListener("click", ()=>openBillEditor());

    wrap.addEventListener("click", (e)=>{
      const openMonth = e.target.closest("[data-bill-open]");
      if (openMonth){
        const keyOpen = openMonth.getAttribute("data-bill-open") || "";
        const y = Number(keyOpen.slice(0,4));
        const m = Number(keyOpen.slice(5,7));
        if (Number.isFinite(y) && Number.isFinite(m)){
          state.billsFilter.year = y;
          state.billsFilter.month = m;
          state.billsFilter.view = "pending";
          render();
        }
        return;
      }
      const openAll = e.target.closest("[data-bill-openall]");
      if (openAll){
        state.billsFilter.month = 0;
        state.billsFilter.view = "pending";
        render();
      }
    });

    tableCard.addEventListener("click", async (e)=>{
      const btn = e.target.closest("button");
      if (!btn) return;
      const tr = e.target.closest("tr[data-id]");
      if (!tr) return;
      const id = tr.dataset.id;
      const act = btn.dataset.act;
      const bill = (state.bills||[]).find(x=>x.id===id);
      if (!bill) return;

      if (act === "edit") return openBillEditor({ bill });
      if (act === "del"){
        if (!confirm("Excluir esta conta?")) return;
        await api.deleteBill(id);
        toast("Conta excluída", "ok");
        await refreshAll(false);
        render();
      }
      if (act === "pay"){
        const paidDate = todayISO();
        const ok = confirm(`Confirmar pagamento?
Data de pagamento: ${paidDate}`);
        if (!ok) return;
        const res = await api.updateBill(id, { status:"paid", paidDate });
        if (!res.ok) toast("Falha ao marcar pago: "+(res.error||""), "err");
        else toast("Conta paga • enviada para Finanças", "ok");
        await refreshAll(false);
        render();
      }
      if (act === "unpay"){
        if (!confirm("Desfazer pagamento? (remove o gasto vinculado em Finanças)")) return;
        const res = await api.updateBill(id, { status:"pending" });
        if (!res.ok) toast("Falha ao desfazer: "+(res.error||""), "err");
        else toast("Conta voltou para pendente", "ok");
        await refreshAll(false);
        render();
      }
    });
  },0);

  return wrap;
}

function openBillEditor({ bill=null } = {}){
  const isEdit = Boolean(bill?.id);
  const b = bill || { name:"", categoryId:"", amountCents:0, dueDate: todayISO(), status:"pending" };
  const computed = bill ? billComputedStatus(bill) : "pending";

  openModal({
    title: isEdit ? "Editar conta" : "Nova conta a pagar",
    body: `
      <div class="grid2">
        <div class="form">
          <div class="field">
            <label>Nome da conta</label>
            <input id="bl_name" value="${escapeHtml(b.name||"")}" placeholder="Nome da conta"/>
          </div>
          <div class="field">
            <label>Categoria</label>
            <select id="bl_cat">
              <option value="">(sem categoria)</option>
              ${(state.finance?.categories||[]).map(c=>`<option value="${c.id}" ${String(b.categoryId||"")===c.id?"selected":""}>${escapeHtml(c.name)}</option>`).join("")}
            </select>
            <div class="muted" style="font-size:12px; margin-top:4px">Dica: você pode criar categorias em Finanças.</div>
          </div>
          <div class="field">
            <label>Valor (R$)</label>
            <input id="bl_amount" inputmode="decimal" value="${escapeHtml(centsToInput(b.amountCents||0))}" placeholder="Ex: 149,90"/>
          </div>
        </div>

        <div class="form">
          <div class="field">
            <label>Vencimento</label>
            <input id="bl_due" type="date" value="${escapeHtml(b.dueDate||todayISO())}"/>
          </div>
          <div class="field">
            <label>Status</label>
            <select id="bl_status">
              <option value="pending" ${(b.status||"pending")==="pending"?"selected":""}>Pendente</option>
              <option value="paid" ${(b.status||"pending")==="paid"?"selected":""}>Pago</option>
            </select>
            ${isEdit ? `<div class="muted" style="font-size:12px; margin-top:6px">Status atual: ${billStatusLabel(computed)}</div>` : ""}
          </div>
          <div class="note warn">
            <strong>Integração</strong>
            <div>Ao marcar como <b>Pago</b>, a conta vira um <b>gasto em Finanças</b>.</div>
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn--ghost" data-close="1">Cancelar</button>
      <button class="btn btn--primary" id="bl_save">${isEdit ? "Salvar" : "Criar"}</button>
    `,
    onMount: ()=>{
      $("#bl_save").addEventListener("click", async ()=>{
        const payload = {
          name: $("#bl_name").value.trim() || "Conta",
          categoryId: $("#bl_cat").value,
          amountCents: parseMoneyToCents($("#bl_amount").value),
          dueDate: $("#bl_due").value,
          status: $("#bl_status").value,
          paidDate: todayISO()
        };

        let res;
        if (isEdit) res = await api.updateBill(b.id, payload);
        else res = await api.createBill(payload);

        if (!res.ok){
          toast("Erro: "+(res.error||"não foi possível salvar"), "err");
          return;
        }
        toast(isEdit ? "Conta atualizada" : "Conta criada", "ok");
        closeModal();
        await refreshAll(false);
        render();
      });
    }
  });
}


/* ---------- À Receber ---------- */
function receivablesForMonth(key){
  return (state.receivables || []).filter(r => yyyymm(r.dueDate) === key);
}
function receivablesForYear(year){
  const y = String(year || "");
  return (state.receivables || []).filter(r => String(r.dueDate || "").startsWith(y + "-"));
}
function sumReceivables(items){
  return (items || []).reduce((acc, r)=> acc + (Number(r.amountCents||0)||0), 0);
}
function receivableComputedStatus(r){
  if ((r.status||"") === "received") return "received";
  const today = todayISO();
  if ((r.dueDate||"") && r.dueDate < today) return "overdue";
  return "pending";
}
function receivableStatusTag(st){
  if (st==="received") return `<span class="tag is-ok"><span class="tag__dot"></span>Recebido</span>`;
  if (st==="overdue") return `<span class="tag is-bad"><span class="tag__dot"></span>Em atraso</span>`;
  return `<span class="tag is-warn"><span class="tag__dot"></span>Pendente</span>`;
}

function renderReceivables(){
  try{ localStorage.setItem("receivablesFilter", JSON.stringify(state.receivablesFilter)); }catch{}

  const year = Number(state.receivablesFilter.year);
  const month = Number(state.receivablesFilter.month ?? 0);
  const view = state.receivablesFilter.view || "pending";
  const key = month === 0 ? null : monthKey(year, month);
  const monthLabel = month === 0 ? "Todos os meses" : (MONTHS[month-1] || "");
  const periodLabel = month === 0 ? "no ano" : "no mês";
  const periodTotalLabel = month === 0 ? "do ano" : "do mês";

  const years = Array.from(new Set((state.receivables||[]).map(r=> Number((r.dueDate||"").slice(0,4))).filter(Boolean).concat([new Date().getFullYear()]))).sort((a,b)=>b-a);

  let receivables = (month===0 ? receivablesForYear(year) : receivablesForMonth(key)).slice().sort((a,b)=> (a.dueDate||"").localeCompare(b.dueDate||""));
  const computed = receivables.map(r=>({ ...r, computedStatus: receivableComputedStatus(r) }));

  let shown = computed;
  if (view === "pending") shown = computed.filter(r=>r.computedStatus !== "received");
  if (view === "received") shown = computed.filter(r=>r.computedStatus === "received");

  const pending = computed.filter(r=>r.computedStatus === "pending");
  const overdue = computed.filter(r=>r.computedStatus === "overdue");
  const received = computed.filter(r=>r.computedStatus === "received");

  const totalPending = sumReceivables(pending) + sumReceivables(overdue);
  const totalReceived = sumReceivables(received);
  const totalAll = sumReceivables(computed);

  const overdueOutside = (state.receivables||[])
    .map(r=>({ ...r, computedStatus: receivableComputedStatus(r) }))
    .filter(r=> r.computedStatus === "overdue" && String(r.dueDate||"").startsWith(String(year) + "-") && (month===0 || yyyymm(r.dueDate) !== key))
    .sort((a,b)=> (a.dueDate||"").localeCompare(b.dueDate||""));

  const wrap = document.createElement("div");
  wrap.className = "content";

  const controls = document.createElement("div");
  controls.className = "card";
  controls.innerHTML = `
    <div class="card__hd">
      <div class="card__title">À Receber</div>
    </div>
    <div class="card__bd">
      <div class="bills-head">
        <select class="select" id="recMonth">
          <option value="0" ${month===0?"selected":""}>Todos</option>
          ${MONTHS.map((m, i)=>`<option value="${i+1}" ${month===i+1?"selected":""}>${escapeHtml(m)}</option>`).join("")}
        </select>
        <select class="select" id="recYear">
          ${years.map(y=>`<option value="${y}" ${year===y?"selected":""}>${y}</option>`).join("")}
        </select>
        <select class="select" id="recView">
          <option value="pending" ${view==="pending"?"selected":""}>Pendentes</option>
          <option value="received" ${view==="received"?"selected":""}>Recebidos</option>
          <option value="all" ${view==="all"?"selected":""}>Todos</option>
        </select>
        <button class="btn btn--primary" id="recNew">+ Cliente</button>
      </div>
    </div>
  `;
  wrap.appendChild(controls);

  if (overdueOutside.length){
    const groups = overdueOutside.reduce((acc, r)=>{
      const k = yyyymm(r.dueDate);
      (acc[k] = acc[k] || []).push(r);
      return acc;
    }, {});
    const groupKeys = Object.keys(groups).sort();
    const groupsHtml = groupKeys.map(k=>{
      const itemsHtml = (groups[k] || []).map(r=>`
        <div style="display:flex; gap:12px; justify-content:space-between; align-items:flex-start; flex-wrap:wrap">
          <div>
            <strong>${escapeHtml(r.name || "Cliente")}</strong>
            <div class="muted" style="font-size:12.5px">Vencimento: ${fmtDate(r.dueDate)}</div>
          </div>
          <div><strong>${fmtMoney(r.amountCents)}</strong></div>
        </div>
      `).join("");
      return `
        <div class="card" style="box-shadow:none">
          <div class="card__hd" style="background: rgba(245,158,11,.10)">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">
              <strong>${escapeHtml(labelFromYearMonth(k))}</strong>
              <span class="tag is-bad"><span class="tag__dot"></span>Em atraso</span>
              <span class="muted" style="font-size:12.5px">${(groups[k]||[]).length} cliente(s)</span>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end">
              <button class="btn btn--ghost btn--xs" data-rec-open="${k}">Abrir mês</button>
            </div>
          </div>
          <div class="card__bd">
            <div style="display:grid; gap:8px">${itemsHtml}</div>
          </div>
        </div>
      `;
    }).join("");

    const alertCard = document.createElement("div");
    alertCard.className = "card";
    alertCard.innerHTML = `
      <div class="card__hd">
        <div class="card__title">Recebimentos em atraso</div>
        <div class="muted">Vencidos em outros meses • ${year}</div>
      </div>
      <div class="card__bd">
        <div class="muted">Você tem <strong>${overdueOutside.length}</strong> recebimento(s) vencido(s) fora do filtro atual.</div>
        <div class="sep"></div>
        <div style="display:grid; gap:12px">${groupsHtml}</div>
        <div class="sep"></div>
        <div style="display:flex; gap:10px; flex-wrap:wrap">
          <button class="btn btn--ghost btn--xs" data-rec-openall="1">Ver todos os meses</button>
        </div>
      </div>
    `;
    wrap.appendChild(alertCard);
  }

  const kpis = document.createElement("div");
  kpis.className = "bills-kpis";
  kpis.innerHTML = `
    <div class="kpi">
      <div class="kpi__label">À receber ${periodLabel}</div>
      <div class="kpi__value">${fmtMoney(totalPending)}</div>
      <div class="kpi__sub">${overdue.length} em atraso</div>
    </div>
    <div class="kpi">
      <div class="kpi__label">Recebidos ${periodLabel}</div>
      <div class="kpi__value">${fmtMoney(totalReceived)}</div>
      <div class="kpi__sub">${received.length} recebidos</div>
    </div>
    <div class="kpi">
      <div class="kpi__label">Total ${periodTotalLabel}</div>
      <div class="kpi__value">${fmtMoney(totalAll)}</div>
      <div class="kpi__sub">${computed.length} recebimento(s) registrados</div>
    </div>
  `;
  wrap.appendChild(kpis);

  const tableCard = document.createElement("div");
  tableCard.className = "card";
  tableCard.innerHTML = `
    <div class="card__hd">
      <div class="card__title">Lista</div>
      <div class="muted">${escapeHtml(monthLabel)} • ${year}</div>
    </div>
    <div class="card__bd">
      ${shown.length ? `
      <table class="table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Categoria</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th style="width:320px">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${shown.map(r=>`
            <tr data-id="${r.id}">
              <td><strong>${escapeHtml(r.name)}</strong><div class="muted" style="font-size:12px">${escapeHtml(r.id)}</div></td>
              <td>${escapeHtml(categoryName(r.categoryId) || "—")}</td>
              <td><strong>${fmtMoney(r.amountCents)}</strong></td>
              <td class="muted">${fmtDate(r.dueDate)}</td>
              <td>${receivableStatusTag(r.computedStatus)}</td>
              <td>
                <button class="btn btn--ghost" data-act="edit">Editar</button>
                ${r.computedStatus!=="received" ? `<button class="btn btn--primary" data-act="receive">Marcar recebido</button>` : `<button class="btn btn--ghost" data-act="unreceive">Desfazer</button>`}
                <button class="btn btn--danger" data-act="del">Excluir</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ` : `<div class="muted">Nenhum cliente encontrado.</div>`}
    </div>
  `;
  wrap.appendChild(tableCard);

  setTimeout(()=>{
    $("#recMonth")?.addEventListener("change", ()=>{
      state.receivablesFilter.month = Number($("#recMonth").value);
      render();
    });
    $("#recYear")?.addEventListener("change", ()=>{
      state.receivablesFilter.year = Number($("#recYear").value);
      render();
    });
    $("#recView")?.addEventListener("change", ()=>{
      state.receivablesFilter.view = $("#recView").value;
      render();
    });
    $("#recNew")?.addEventListener("click", ()=>openReceivableEditor());

    wrap.addEventListener("click", (e)=>{
      const openMonth = e.target.closest("[data-rec-open]");
      if (openMonth){
        const keyOpen = openMonth.getAttribute("data-rec-open") || "";
        const y = Number(keyOpen.slice(0,4));
        const m = Number(keyOpen.slice(5,7));
        if (Number.isFinite(y) && Number.isFinite(m)){
          state.receivablesFilter.year = y;
          state.receivablesFilter.month = m;
          state.receivablesFilter.view = "pending";
          render();
        }
        return;
      }
      const openAll = e.target.closest("[data-rec-openall]");
      if (openAll){
        state.receivablesFilter.month = 0;
        state.receivablesFilter.view = "pending";
        render();
      }
    });

    tableCard.addEventListener("click", async (e)=>{
      const btn = e.target.closest("button");
      if (!btn) return;
      const tr = e.target.closest("tr[data-id]");
      if (!tr) return;
      const id = tr.dataset.id;
      const act = btn.dataset.act;
      const receivable = (state.receivables||[]).find(x=>x.id===id);
      if (!receivable) return;

      if (act === "edit") return openReceivableEditor({ receivable });
      if (act === "del"){
        if (!confirm("Excluir este recebimento?")) return;
        await api.deleteReceivable(id);
        toast("Recebimento excluído", "ok");
        await refreshAll(false);
        render();
      }
      if (act === "receive"){
        const receivedDate = todayISO();
        const ok = confirm(`Confirmar recebimento?
Data de recebimento: ${receivedDate}`);
        if (!ok) return;
        const res = await api.updateReceivable(id, { status:"received", receivedDate });
        if (!res.ok) toast("Falha ao marcar recebido: "+(res.error||""), "err");
        else toast("Recebimento marcado", "ok");
        await refreshAll(false);
        render();
      }
      if (act === "unreceive"){
        if (!confirm("Desfazer recebimento?")) return;
        const res = await api.updateReceivable(id, { status:"pending" });
        if (!res.ok) toast("Falha ao desfazer: "+(res.error||""), "err");
        else toast("Recebimento voltou para pendente", "ok");
        await refreshAll(false);
        render();
      }
    });
  },0);

  return wrap;
}

function openReceivableEditor({ receivable=null } = {}){
  const isEdit = Boolean(receivable?.id);
  const r = receivable || { name:"", categoryId:"", amountCents:0, dueDate: todayISO(), status:"pending" };
  const computed = receivable ? receivableComputedStatus(receivable) : "pending";

  openModal({
    title: isEdit ? "Editar cliente à receber" : "Novo cliente à receber",
    body: `
      <div class="grid2">
        <div class="form">
          <div class="field">
            <label>Cliente</label>
            <input id="rc_name" value="${escapeHtml(r.name||"")}" placeholder="Nome do cliente" list="receivable_clients_list"/>
            <datalist id="receivable_clients_list">
              ${(state.clients || []).map(c=>`<option value="${escapeHtml(c.name)}"></option>`).join("")}
            </datalist>
          </div>
          <div class="field">
            <label>Categoria</label>
            <select id="rc_cat">
              <option value="">(sem categoria)</option>
              ${(state.finance?.categories||[]).map(c=>`<option value="${c.id}" ${String(r.categoryId||"")===c.id?"selected":""}>${escapeHtml(c.name)}</option>`).join("")}
            </select>
            <div class="muted" style="font-size:12px; margin-top:4px">Dica: você pode criar categorias em Finanças.</div>
          </div>
          <div class="field">
            <label>Valor (R$)</label>
            <input id="rc_amount" inputmode="decimal" value="${escapeHtml(centsToInput(r.amountCents||0))}" placeholder="Ex: 149,90"/>
          </div>
        </div>

        <div class="form">
          <div class="field">
            <label>Vencimento</label>
            <input id="rc_due" type="date" value="${escapeHtml(r.dueDate||todayISO())}"/>
          </div>
          <div class="field">
            <label>Status atual</label>
            <div>${receivableStatusTag(computed)}</div>
            
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn--ghost" data-close="1">Cancelar</button>
      <button class="btn btn--primary" id="rc_save">${isEdit ? "Salvar" : "Criar"}</button>
    `,
    onMount: ()=>{
      $("#rc_save").addEventListener("click", async ()=>{
        const payload = {
          name: $("#rc_name").value.trim() || "Cliente",
          categoryId: $("#rc_cat").value,
          amountCents: parseMoneyToCents($("#rc_amount").value),
          dueDate: $("#rc_due").value
        };
        let res;
        if (isEdit){
          res = await api.updateReceivable(r.id, payload);
          if (res.ok) toast("Recebimento atualizado", "ok");
        }else{
          res = await api.createReceivable(payload);
          if (res.ok) toast("Recebimento criado", "ok");
        }
        if (!res?.ok){
          toast("Erro ao salvar: "+(res?.error||""), "err");
          return;
        }
        closeModal();
        await refreshAll(false);
        render();
      });
    }
  });
}

/* ---------- Tasks (Lista por status) ---------- */

function tasksStatuses(){
  return (state.tasksData?.meta?.statuses || []).slice().sort((a,b)=> (Number(a.order||0)-Number(b.order||0)));
}
function tasksPriorities(){
  return (state.tasksData?.meta?.priorities || []).slice().sort((a,b)=> (Number(a.order||0)-Number(b.order||0)));
}
function statusById(id){ return tasksStatuses().find(s=>s.id===id); }
function priorityById(id){ return tasksPriorities().find(p=>p.id===id); }
function statusName(id){ return statusById(id)?.name || "Sem status"; }
function priorityName(id){ return priorityById(id)?.name || "—"; }
function statusColor(id){ return statusById(id)?.color || ""; }
function priorityColor(id){ return priorityById(id)?.color || "rgba(255,255,255,.18)"; }

function filteredTasks(){
  const q = (state.q||"").trim().toLowerCase();
  const list = (state.tasksData?.tasks || []);
  if (!q) return list;
  return list.filter(t => (
    (t.title||"").toLowerCase().includes(q) ||
    (t.assignee||"").toLowerCase().includes(q) ||
    priorityName(t.priorityId).toLowerCase().includes(q) ||
    statusName(t.statusId).toLowerCase().includes(q)
  ));
}

function renderTasks(){
  const wrap = document.createElement("div");
  wrap.className = "content";

  const statuses = tasksStatuses();
  const all = filteredTasks();

  if (!statuses.length){
    wrap.appendChild(emptyState("Tarefas sem configurações", "Crie pelo menos um status para começar.", "Criar status", ()=>openStatusManager()));
    return wrap;
  }

  if (!(state.tasksData?.tasks||[]).length){
    wrap.appendChild(emptyState("Sem tarefas ainda", "Crie sua primeira tarefa e organize por status.", "Criar tarefa", ()=>openTaskEditor()));
    return wrap;
  }

  const header = document.createElement("div");
  header.className = "card";
  header.innerHTML = `
    <div class="card__bd">
      
      <div class="task-table task-table--head">
        <div>Nome</div>
        <div>Prioridade</div>
        <div>Prazo</div>
        <div>Responsável</div>
        <div>Atualizado</div>
        <div style="text-align:right">Ações</div>
      </div>
    </div>
  `;
  wrap.appendChild(header);

  const groups = document.createElement("div");
  groups.className = "content";

  for (const st of statuses){
    const list = all.filter(t => (t.statusId || "st_todo") === st.id)
      .slice()
      .sort((a,b)=> (String(a.dueDate||"").localeCompare(String(b.dueDate||""))) || (String(b.updatedAt||"").localeCompare(String(a.updatedAt||""))));

    const group = document.createElement("div");
    group.className = "task-group card";
    group.dataset.statusId = st.id;
    const bar = st.color ? st.color : "transparent";

    group.innerHTML = `
      <div class="task-group__hd" style="--st-color:${escapeHtml(bar)}">
        <div class="task-group__title">${escapeHtml(st.name)}</div>
        <div class="task-group__meta">${list.length} tarefa(s)</div>
      </div>
      <div class="card__bd">
        ${list.length ? `
          <div class="task-rows">
            ${list.map(t => `
              <div class="task-row" draggable="true" data-id="${t.id}">
                <div class="task-cell task-title">
                  <div class="task-title__main">${escapeHtml(t.title||"—")}</div>
                  ${t.description ? `<div class="task-title__sub muted">${escapeHtml(String(t.description).slice(0,120))}${String(t.description).length>120?"…":""}</div>` : ""}
                </div>
                <div class="task-cell">
                  ${renderPriorityBadge(t.priorityId)}
                </div>
                <div class="task-cell">${escapeHtml(t.dueDate || "—")}</div>
                <div class="task-cell">${escapeHtml(t.assignee || "—")}</div>
                <div class="task-cell muted">${fmtDateTime(t.updatedAt)}</div>
                <div class="task-cell" style="text-align:right">
                  <button class="btn btn--ghost btn--xs" data-act="open">Abrir</button>
                  <button class="btn btn--danger btn--xs" data-act="del">Excluir</button>
                </div>
              </div>
            `).join("")}
          </div>
        ` : `<div class="muted">Nenhuma tarefa neste status.</div>`}
      </div>
    `;

    groups.appendChild(group);
  }

  wrap.appendChild(groups);

  // listeners
  wrap.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const row = e.target.closest(".task-row[data-id]");
    if (!row) return;
    const id = row.dataset.id;
    const act = btn.dataset.act;

    if (act === "open"){
      openTaskEditor({ taskId: id });
    }
    if (act === "del"){
      if (!confirm("Excluir esta tarefa?")) return;
      const res = await api.deleteTask(id);
      if (res.ok){
        toast("Tarefa excluída", "ok");
        await refreshAll();
        render();
      }else{
        toast("Erro ao excluir", "err");
      }
    }
  });

  // clique na linha também abre
  wrap.addEventListener("dblclick", (e)=>{
    const row = e.target.closest(".task-row[data-id]");
    if (!row) return;
    openTaskEditor({ taskId: row.dataset.id });
  });

  // drag & drop: mover tarefa entre status
  wrap.addEventListener("dragstart", (e)=>{
    const row = e.target.closest(".task-row[data-id]");
    if (!row) return;
    e.dataTransfer.setData("text/taskId", row.dataset.id);
    e.dataTransfer.effectAllowed = "move";
    row.classList.add("is-dragging");
  });

  wrap.addEventListener("dragend", ()=>{
    $$(".task-row.is-dragging", wrap).forEach(r=>r.classList.remove("is-dragging"));
    $$(".task-group.drop-hint", wrap).forEach(g=>g.classList.remove("drop-hint"));
  });

  wrap.addEventListener("dragover", (e)=>{
    const group = e.target.closest(".task-group");
    if (!group) return;
    e.preventDefault();
    group.classList.add("drop-hint");
  });

  wrap.addEventListener("dragleave", (e)=>{
    const group = e.target.closest(".task-group");
    if (!group) return;
    if (e.relatedTarget && group.contains(e.relatedTarget)) return;
    group.classList.remove("drop-hint");
  });

  wrap.addEventListener("drop", async (e)=>{
    const group = e.target.closest(".task-group");
    if (!group) return;
    e.preventDefault();
    group.classList.remove("drop-hint");

    const id = e.dataTransfer.getData("text/taskId");
    if (!id) return;

    const newStatusId = group.dataset.statusId || "st_todo";
    const t = taskById(id);
    if (!t) return;

    const cur = (t.statusId || "st_todo");
    if (cur === newStatusId) return;

    const res = await api.updateTask(id, { statusId: newStatusId });
    if (res.ok){
      toast("Tarefa movida de status", "ok");
      await refreshAll();
      render();
    }else{
      toast("Erro ao mover tarefa", "err");
    }
  });

  return wrap;
}

function renderPriorityBadge(priorityId){
  const p = priorityById(priorityId);
  const label = p?.name || "—";
  const color = p?.color || "rgba(255,255,255,.18)";
  const dot = color || "rgba(255,255,255,.18)";
  return `<span class="tag" style="border-color:${escapeHtml(dot)}; background: color-mix(in srgb, ${escapeHtml(dot)} 18%, transparent); color: var(--text)"><span class="tag__dot" style="background:${escapeHtml(dot)}"></span>${escapeHtml(label)}</span>`;
}

function taskById(id){
  return (state.tasksData?.tasks || []).find(t => t.id === id);
}

function normalizeOrders(list){
  return list.map((x,i)=> ({...x, order: i+1}));
}

async function persistTasksData(){
  const res = await api.saveTasks(state.tasksData);
  if (!res.ok){
    toast("Falha ao salvar tarefas", "err");
  }
  return res;
}

function openTaskEditor({taskId=null}={}){
  const isEdit = Boolean(taskId);
  const t0 = isEdit ? (taskById(taskId) || null) : null;

  const task = t0 ? structuredClone(t0) : {
    title: "",
    description: "",
    statusId: "st_todo",
    priorityId: "pr_med",
    assignee: "",
    dueDate: "",
    subtasks: [],
    comments: [],
    updates: []
  };

  const statuses = tasksStatuses();
  const priorities = tasksPriorities();

  openModal({
    title: isEdit ? "Editar tarefa" : "Nova tarefa",
    body: `
      <div class="grid2">
        <div class="card" style="box-shadow:none">
          <div class="card__hd"><div class="card__title">Dados</div><div class="muted">${isEdit ? escapeHtml(taskId) : "Rascunho"}</div></div>
          <div class="card__bd">
            <div class="form">
              <div class="field"><label>Nome da tarefa</label><input id="tk_title" value="${escapeHtml(task.title)}" placeholder="Nome da tarefa"/></div>
              <div class="grid2">
                <div class="field">
                  <label>Status</label>
                  <select id="tk_status">
                    ${statuses.map(s=>`<option value="${s.id}" ${task.statusId===s.id?"selected":""}>${escapeHtml(s.name)}</option>`).join("")}
                  </select>
                  <div class="muted" style="font-size:12px; margin-top:4px"><a href="#" id="tk_manage_status" class="muted">Gerenciar status</a></div>
                </div>
                <div class="field">
                  <label>Prioridade</label>
                  <select id="tk_priority">
                    ${priorities.map(p=>`<option value="${p.id}" ${task.priorityId===p.id?"selected":""}>${escapeHtml(p.name)}</option>`).join("")}
                  </select>
                  <div class="muted" style="font-size:12px; margin-top:4px"><a href="#" id="tk_manage_prio" class="muted">Gerenciar prioridades</a></div>
                </div>
              </div>
              <div class="grid2">
                <div class="field"><label>Responsável</label><input id="tk_assignee" value="${escapeHtml(task.assignee)}" placeholder="Responsável"/></div>
                <div class="field"><label>Prazo</label><input id="tk_due" value="${escapeHtml(task.dueDate)}" placeholder="dd/mm/aaaa"/></div>
              </div>
              <div class="field"><label>Descrição</label><textarea id="tk_desc" placeholder="Detalhes da tarefa...">${escapeHtml(task.description)}</textarea></div>
            </div>
          </div>
        </div>

        <div class="card" style="box-shadow:none">
          <div class="card__hd"><div class="card__title">Subtarefas</div><div class="muted">${(task.subtasks||[]).length}</div></div>
          <div class="card__bd">
            <div id="tk_subtasks" class="task-subtasks"></div>
            <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap">
              <input id="tk_sub_new" style="flex:1; min-width:220px" placeholder="Adicionar subtarefa..." />
              <button class="btn btn--ghost" id="tk_sub_add" type="button">Adicionar</button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid2" style="margin-top:14px">
        <div class="card" style="box-shadow:none">
          <div class="card__hd"><div class="card__title">Comentários</div><div class="muted">${(task.comments||[]).length}</div></div>
          <div class="card__bd">
            <div id="tk_comments" class="task-feed"></div>
            <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap">
              <input id="tk_comment_new" style="flex:1; min-width:220px" placeholder="Escreva um comentário..." />
              <button class="btn btn--ghost" id="tk_comment_add" type="button">Enviar</button>
            </div>
          </div>
        </div>

        <div class="card" style="box-shadow:none">
          <div class="card__hd"><div class="card__title">Atualizações</div><div class="muted">${(task.updates||[]).length}</div></div>
          <div class="card__bd">
            <div id="tk_updates" class="task-feed"></div>
            <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap">
              <input id="tk_update_new" style="flex:1; min-width:220px" placeholder="Registrar uma atualização..." />
              <button class="btn btn--ghost" id="tk_update_add" type="button">Registrar</button>
            </div>
          </div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn--ghost" data-close="1">Fechar</button>
      <button class="btn btn--primary" id="tk_save">${isEdit ? "Salvar alterações" : "Criar tarefa"}</button>
    `,
    onMount: ()=>{
      function renderSubtasks(){
        const box = $("#tk_subtasks");
        const list = task.subtasks || [];
        box.innerHTML = list.length ? list.map((s,i)=>`
          <div class="task-subtask" data-i="${i}">
            <label style="display:flex; gap:10px; align-items:center">
              <input type="checkbox" ${s.done?"checked":""} data-act="toggle"/>
              <span style="${s.done?'text-decoration:line-through; opacity:.7':''}">${escapeHtml(s.text||"")}</span>
            </label>
            <button class="btn btn--danger btn--xs" data-act="del" type="button">X</button>
          </div>
        `).join("") : `<div class="muted">Sem subtarefas.</div>`;
      }

      function renderFeed(elId, list){
        const box = $("#"+elId);
        box.innerHTML = (list||[]).length ? (list||[]).slice().sort((a,b)=> (String(b.createdAt||"").localeCompare(String(a.createdAt||"")))).map(x=>`
          <div class="task-feed__item">
            <div class="task-feed__text">${escapeHtml(x.text||"")}</div>
            <div class="muted task-feed__meta">${fmtDateTime(x.createdAt)}</div>
          </div>
        `).join("") : `<div class="muted">Nada por aqui ainda.</div>`;
      }

      renderSubtasks();
      renderFeed("tk_comments", task.comments || []);
      renderFeed("tk_updates", task.updates || []);

      $("#tk_subtasks").addEventListener("click", (e)=>{
        const row = e.target.closest(".task-subtask[data-i]");
        if (!row) return;
        const i = Number(row.dataset.i);
        const act = e.target.closest("[data-act]")?.dataset?.act;
        if (act === "del"){
          task.subtasks.splice(i,1);
          renderSubtasks();
        }
        if (act === "toggle"){
          task.subtasks[i].done = e.target.checked;
          renderSubtasks();
        }
      });

      $("#tk_sub_add").addEventListener("click", ()=>{
        const v = $("#tk_sub_new").value.trim();
        if (!v) return;
        task.subtasks = task.subtasks || [];
        task.subtasks.push({ id: makeId("sub"), text: v, done:false });
        $("#tk_sub_new").value = "";
        renderSubtasks();
      });

      $("#tk_comment_add").addEventListener("click", ()=>{
        const v = $("#tk_comment_new").value.trim();
        if (!v) return;
        task.comments = task.comments || [];
        task.comments.unshift({ id: makeId("cmt"), text: v, createdAt: new Date().toISOString() });
        $("#tk_comment_new").value = "";
        renderFeed("tk_comments", task.comments);
      });

      $("#tk_update_add").addEventListener("click", ()=>{
        const v = $("#tk_update_new").value.trim();
        if (!v) return;
        task.updates = task.updates || [];
        task.updates.unshift({ id: makeId("upd"), text: v, createdAt: new Date().toISOString() });
        $("#tk_update_new").value = "";
        renderFeed("tk_updates", task.updates);
      });

      $("#tk_manage_status").addEventListener("click", (e)=>{ e.preventDefault(); openStatusManager(); });
      $("#tk_manage_prio").addEventListener("click", (e)=>{ e.preventDefault(); openPriorityManager(); });

      $("#tk_save").addEventListener("click", async ()=>{
        const payload = {
          title: $("#tk_title").value.trim() || "Tarefa",
          description: $("#tk_desc").value.trim(),
          statusId: $("#tk_status").value,
          priorityId: $("#tk_priority").value,
          assignee: $("#tk_assignee").value.trim(),
          dueDate: $("#tk_due").value.trim(),
          subtasks: task.subtasks || [],
          comments: task.comments || [],
          updates: task.updates || []
        };

        if (isEdit){
          const res = await api.updateTask(taskId, payload);
          if (res.ok){ toast("Tarefa salva", "ok"); }
          else { toast("Erro ao salvar: "+(res.error||""), "err"); }
        }else{
          const res = await api.createTask(payload);
          if (res.ok){ toast("Tarefa criada", "ok"); }
          else { toast("Erro ao criar: "+(res.error||""), "err"); }
        }

        closeModal();
        await refreshAll();
        render();
      });
    }
  });
}

function openStatusManager(){
  const meta = state.tasksData.meta || { statuses:[], priorities:[] };
  let list = structuredClone(meta.statuses || []);

  openModal({
    title: "Status das tarefas",
    body: `
      <div class="muted" style="margin-bottom:10px">Crie status personalizados para as suas tarefas.</div>
      <div id="st_list" class="task-meta-list"></div>
      <div class="sep"></div>
      <div class="grid2">
        <div class="field"><label>Novo status</label><input id="st_new_name" placeholder="Nome do status"/></div>
        <div class="field"><label>Cor</label><input id="st_new_color" type="color" value="#3B82F6"/></div>
      </div>
      <button class="btn btn--ghost" id="st_add" type="button">Adicionar status</button>
    `,
    footer: `
      <button class="btn btn--ghost" data-close="1">Cancelar</button>
      <button class="btn btn--primary" id="st_save" type="button">Salvar</button>
    `,
    onMount: ()=>{
      const box = $("#st_list");

      function render(){
        list = normalizeOrders(list);
        box.innerHTML = list.length ? list.map((s,i)=>`
          <div class="task-meta-row" data-i="${i}">
            <div class="field"><label>Nome</label><input data-k="name" value="${escapeHtml(s.name||"")}"/></div>
            <div class="field"><label>Cor (vazio = sem cor)</label><input data-k="color" value="${escapeHtml(s.color||"")}" placeholder="#3B82F6"/></div>
            <div style="display:flex; align-items:flex-end; justify-content:flex-end">
              <button class="btn btn--danger btn--xs" data-act="del" type="button">Excluir</button>
            </div>
          </div>
        `).join("") : `<div class="muted">Nenhum status.</div>`;
      }

      render();

      box.addEventListener("input", (e)=>{
        const row = e.target.closest(".task-meta-row[data-i]");
        const inp = e.target.closest("input[data-k]");
        if (!row || !inp) return;
        const i = Number(row.dataset.i);
        list[i][inp.dataset.k] = inp.value;
      });

      box.addEventListener("click", (e)=>{
        const row = e.target.closest(".task-meta-row[data-i]");
        if (!row) return;
        if (!e.target.closest("button[data-act='del']")) return;
        const i = Number(row.dataset.i);
        list.splice(i,1);
        render();
      });

      $("#st_add").addEventListener("click", ()=>{
        const name = $("#st_new_name").value.trim();
        const color = $("#st_new_color").value || "";
        if (!name) return;
        list.push({ id: makeId("st"), name, color, order: list.length+1 });
        $("#st_new_name").value = "";
        render();
      });

      $("#st_save").addEventListener("click", async ()=>{
        // garante defaults se vazio
        if (!list.length){
          toast("Crie pelo menos um status.", "warn");
          return;
        }
        state.tasksData.meta.statuses = normalizeOrders(list).map(s=>({
          id: s.id || makeId("st"),
          name: String(s.name||"").trim() || "Status",
          color: String(s.color||"").trim(),
          order: s.order
        }));
        await persistTasksData();
        toast("Status salvos", "ok");
        closeModal();
        await refreshAll();
        render();
      });
    }
  });
}

function openPriorityManager(){
  const meta = state.tasksData.meta || { statuses:[], priorities:[] };
  let list = structuredClone(meta.priorities || []);

  openModal({
    title: "Prioridades",
    body: `
      <div class="muted" style="margin-bottom:10px">Defina níveis de prioridade (ex: Baixa, Média, Alta).</div>
      <div id="pr_list" class="task-meta-list"></div>
      <div class="sep"></div>
      <div class="grid2">
        <div class="field"><label>Nova prioridade</label><input id="pr_new_name" placeholder="Nome da prioridade"/></div>
        <div class="field"><label>Cor</label><input id="pr_new_color" type="color" value="#F59E0B"/></div>
      </div>
      <button class="btn btn--ghost" id="pr_add" type="button">Adicionar prioridade</button>
    `,
    footer: `
      <button class="btn btn--ghost" data-close="1">Cancelar</button>
      <button class="btn btn--primary" id="pr_save" type="button">Salvar</button>
    `,
    onMount: ()=>{
      const box = $("#pr_list");

      function render(){
        list = normalizeOrders(list);
        box.innerHTML = list.length ? list.map((p,i)=>`
          <div class="task-meta-row" data-i="${i}">
            <div class="field"><label>Nome</label><input data-k="name" value="${escapeHtml(p.name||"")}"/></div>
            <div class="field"><label>Cor</label><input data-k="color" value="${escapeHtml(p.color||"")}" placeholder="#F59E0B"/></div>
            <div style="display:flex; align-items:flex-end; justify-content:flex-end">
              <button class="btn btn--danger btn--xs" data-act="del" type="button">Excluir</button>
            </div>
          </div>
        `).join("") : `<div class="muted">Nenhuma prioridade.</div>`;
      }

      render();

      box.addEventListener("input", (e)=>{
        const row = e.target.closest(".task-meta-row[data-i]");
        const inp = e.target.closest("input[data-k]");
        if (!row || !inp) return;
        const i = Number(row.dataset.i);
        list[i][inp.dataset.k] = inp.value;
      });

      box.addEventListener("click", (e)=>{
        const row = e.target.closest(".task-meta-row[data-i]");
        if (!row) return;
        if (!e.target.closest("button[data-act='del']")) return;
        const i = Number(row.dataset.i);
        list.splice(i,1);
        render();
      });

      $("#pr_add").addEventListener("click", ()=>{
        const name = $("#pr_new_name").value.trim();
        const color = $("#pr_new_color").value || "";
        if (!name) return;
        list.push({ id: makeId("pr"), name, color, order: list.length+1 });
        $("#pr_new_name").value = "";
        render();
      });

      $("#pr_save").addEventListener("click", async ()=>{
        if (!list.length){
          toast("Crie pelo menos uma prioridade.", "warn");
          return;
        }
        state.tasksData.meta.priorities = normalizeOrders(list).map(p=>({
          id: p.id || makeId("pr"),
          name: String(p.name||"").trim() || "Prioridade",
          color: String(p.color||"").trim() || "#94A3B8",
          order: p.order
        }));
        await persistTasksData();
        toast("Prioridades salvas", "ok");
        closeModal();
        await refreshAll();
        render();
      });
    }
  });
}



/* ---------- Usuários / Administração ---------- */
function userStatusLabel(u){ return u.active === false ? "Inativo" : "Ativo"; }
function renderUsersCard(){
  const el = document.createElement("div");
  el.className = "card";
  const users = state.users;
  const rows = Array.isArray(users) && users.length
    ? users.map(u => `
      <tr>
        <td><strong>${escapeHtml(u.name || "—")}</strong><div class="muted">${escapeHtml(u.email || "—")}</div></td>
        <td>${escapeHtml(roleLabel(u.role))}</td>
        <td>${tag(userStatusLabel(u), u.active !== false)}</td>
        <td>${u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : "—"}</td>
        <td style="text-align:right; white-space:nowrap">
          <button class="btn btn--ghost" data-edit-user="${escapeHtml(u.id)}" type="button">Editar</button>
          ${u.id !== state.auth?.user?.id ? `<button class="btn btn--danger" data-delete-user="${escapeHtml(u.id)}" type="button">Excluir</button>` : ""}
        </td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="muted">${users === null ? "Carregando usuários…" : "Nenhum usuário cadastrado."}</td></tr>`;

  el.innerHTML = `
    <div class="card__hd">
      <div>
        <div class="card__title">Usuários e acesso</div>
        <div class="muted" style="margin-top:4px">Login, papéis e controle administrativo.</div>
      </div>
      <button class="btn btn--primary" id="newUserBtn" type="button">+ Usuário</button>
    </div>
    <div class="card__bd">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Usuário</th><th>Papel</th><th>Status</th><th>Último login</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  setTimeout(()=>{
    if (state.users === null) loadUsers();
    $("#newUserBtn")?.addEventListener("click", ()=>openUserEditor());
    $$('[data-edit-user]', el).forEach(btn=>btn.addEventListener("click", ()=>{
      const u = (state.users || []).find(x=>x.id === btn.dataset.editUser);
      if (u) openUserEditor(u);
    }));
    $$('[data-delete-user]', el).forEach(btn=>btn.addEventListener("click", async ()=>{
      const u = (state.users || []).find(x=>x.id === btn.dataset.deleteUser);
      if (!u) return;
      if (!confirm(`Excluir o usuário ${u.name}?`)) return;
      const res = await api.deleteUser(u.id);
      if (!res.ok) return toast(res.error || "Falha ao excluir", "err");
      toast("Usuário excluído", "ok");
      state.users = null;
      render();
    }));
  }, 0);
  return el;
}

async function loadUsers(){
  const res = await api.listUsers();
  if (res.ok) state.users = res.users || [];
  else state.users = [];
  if (state.route === "settings") render();
}

function openUserEditor(existing=null){
  const isEdit = Boolean(existing);
  openModal({
    title: isEdit ? "Editar usuário" : "Novo usuário",
    body: `
      <div class="form">
        <div class="field"><label>Nome</label><input id="u_name" value="${escapeHtml(existing?.name || "")}"/></div>
        <div class="field"><label>E-mail</label><input id="u_email" type="email" value="${escapeHtml(existing?.email || "")}"/></div>
        <div class="grid2">
          <div class="field">
            <label>Papel</label>
            <select id="u_role">
              <option value="member" ${(existing?.role||"member")==="member"?"selected":""}>Operador</option>
              <option value="manager" ${existing?.role==="manager"?"selected":""}>Gestor</option>
              <option value="admin" ${existing?.role==="admin"?"selected":""}>Administrador</option>
            </select>
          </div>
          <div class="field">
            <label>Status</label>
            <select id="u_active">
              <option value="1" ${existing?.active !== false ? "selected" : ""}>Ativo</option>
              <option value="0" ${existing?.active === false ? "selected" : ""}>Inativo</option>
            </select>
          </div>
        </div>
        <div class="field"><label>${isEdit ? "Nova senha (opcional)" : "Senha inicial"}</label><input id="u_password" type="password" placeholder="Mínimo de 8 caracteres"/></div>
      </div>
    `,
    footer: `<button class="btn btn--ghost" data-close="1">Cancelar</button><button class="btn btn--primary" id="u_save">Salvar</button>`,
    onMount: ()=>{
      $("#u_save")?.addEventListener("click", async ()=>{
        const payload = {
          name: $("#u_name").value.trim(),
          email: $("#u_email").value.trim(),
          role: $("#u_role").value,
          active: $("#u_active").value === "1"
        };
        const password = $("#u_password").value;
        if (password) payload.password = password;
        const res = isEdit ? await api.updateUser(existing.id, payload) : await api.createUser({ ...payload, password });
        if (!res.ok) return toast(res.error || "Falha ao salvar usuário", "err");
        toast("Usuário salvo", "ok");
        state.users = null;
        closeModal();
        render();
      });
    }
  });
}

/* ---------- Settings ---------- */
function renderSettings(){
  const c = state.config?.company || {};
  const b = state.config?.branding || {};
  const wrap = document.createElement("div");
  wrap.className = "content";

  const body = `
    <div class="grid2">
      <div class="card">

        <div class="card__bd">
          <div class="form">
            <div class="field"><label>Nome fantasia</label><input id="s_trade" value="${escapeHtml(c.tradeName||"")}"/></div>
            <div class="field"><label>Razão social</label><input id="s_legal" value="${escapeHtml(c.legalName||"")}"/></div>
            <div class="field"><label>CNPJ</label><input id="s_cnpj" value="${escapeHtml(c.cnpj||"")}"/></div>
            <div class="grid2">
              <div class="field"><label>E-mail</label><input id="s_email" value="${escapeHtml(c.email||"")}"/></div>
              <div class="field"><label>Telefone</label><input id="s_phone" value="${escapeHtml(c.phone||"")}"/></div>
            </div>
            <div class="grid2">
              <div class="field"><label>Representante</label><input id="s_rep_name" value="${escapeHtml(c.representativeName||"")}"/></div>
              <div class="field"><label>Cargo</label><input id="s_rep_role" value="${escapeHtml(c.representativeRole||"")}"/></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">

        <div class="card__bd">
          <div class="form">
            <div class="field"><label>Endereço (linha)</label><input id="s_addr" value="${escapeHtml(c.addressLine||"")}"/></div>
            <div class="field"><label>Bairro</label><input id="s_neigh" value="${escapeHtml(c.neighborhood||"")}"/></div>
            <div class="grid2">
              <div class="field"><label>Cidade</label><input id="s_city" value="${escapeHtml(c.city||"")}"/></div>
              <div class="field"><label>Estado (UF)</label><input id="s_state" value="${escapeHtml(c.state||"")}"/></div>
            </div>
            <div class="grid2">
              <div class="field"><label>CEP</label><input id="s_zip" value="${escapeHtml(c.zip||"")}"/></div>
              <div class="field">
                <label>Cor de destaque</label>
                <input id="s_accent" type="color" value="${escapeHtml(b.accent||"#2563EB")}"/>
              </div>
            </div>
            <div class="field"><label>Nome curto (sidebar)</label><input id="s_short" value="${escapeHtml(b.companyShort||"")}"/></div>

            <div class="grid2">
              <div class="field">
                <label>Tema</label>
                <select id="s_theme">
                  <option value="dark" ${(b.theme||"dark")==="dark"?"selected":""}>Escuro (recomendado)</option>
                  <option value="light" ${(b.theme||"dark")==="light"?"selected":""}>Claro</option>
                </select>
              </div>
              <div class="field" style="display:flex; align-items:flex-end">
                <button class="btn btn--ghost" id="s_logo" type="button">Logo personalizada…</button>
              </div>
            </div>

            
          </div>
        </div>
        <div class="card__ft">
          <button class="btn btn--primary" id="s_save">Salvar</button>
        </div>
      </div>
    </div>
  `;

  const el = document.createElement("div");
  el.innerHTML = body;

  setTimeout(()=>{
    $("#s_save").addEventListener("click", saveSettingsFromView);
    $("#s_logo")?.addEventListener("click", openLogoModal);
  },0);

  wrap.appendChild(el);
  if (isAdmin()) wrap.appendChild(renderUsersCard());
  return wrap;
}

async function saveSettingsFromView(){
  const cfg = state.config || { company:{}, branding:{} };
  cfg.company = {
    tradeName: $("#s_trade")?.value?.trim() || "",
    legalName: $("#s_legal")?.value?.trim() || "",
    cnpj: $("#s_cnpj")?.value?.trim() || "",
    addressLine: $("#s_addr")?.value?.trim() || "",
    neighborhood: $("#s_neigh")?.value?.trim() || "",
    city: $("#s_city")?.value?.trim() || "",
    state: $("#s_state")?.value?.trim() || "",
    zip: $("#s_zip")?.value?.trim() || "",
    email: $("#s_email")?.value?.trim() || "",
    phone: $("#s_phone")?.value?.trim() || "",
    representativeName: $("#s_rep_name")?.value?.trim() || "",
    representativeRole: $("#s_rep_role")?.value?.trim() || "",
  };
  cfg.branding = {
    ...(cfg.branding || {}),
    accent: $("#s_accent")?.value || "#2563EB",
    companyShort: $("#s_short")?.value?.trim() || "Seu nome",
    theme: $("#s_theme")?.value || "dark"
  };

  const res = await api.saveConfig(cfg);
  if (res.ok){
    toast("Configurações salvas", "ok");
    await refreshAll(false);
    applyBranding();
  await refreshBrandLogo();
    render();
  }else{
    toast("Erro ao salvar", "err");
  }
}


function openLogoModal(){
  const currentSrc = $("#brandLogo")?.getAttribute("src") || "";
  openModal({
    title: "Logo da empresa",
    body: `
      <div class="crop-wrap">
        <div class="profile-row">
          <div class="profile-preview">
            <img id="lg_preview_img" src="${escapeHtml(currentSrc)}" alt="Foto atual" onerror="this.style.display='none'"/>
          </div>
          <div>
            <div style="font-weight:950">Seu Logo</div>
            
          </div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px">
          <label class="btn btn--primary" for="lg_file">Escolher imagem</label>
          <input id="lg_file" type="file" accept="image/*" hidden />
          <button class="btn btn--danger" id="lg_remove" type="button">Remover</button>
        </div>

        <div class="sep"></div>

        <div id="lg_crop_area" style="display:none">
          <div class="muted" style="font-size:12.5px; margin-bottom:8px">Arraste para enquadrar • Use o zoom</div>
          <div class="crop-frame" id="lg_frame">
            <img id="lg_crop_img" class="crop-frame__img" alt="Imagem para recorte" />
            <div class="crop-hint"></div>
          </div>
          <div class="crop-controls">
            <div class="muted" style="font-size:12.5px">Zoom</div>
            <input id="lg_zoom" class="range" type="range" min="1" max="3" step="0.01" value="1" />
          </div>
        </div>

        <div class="muted" style="font-size:12.5px">
          Arquivos aceitos: JPG, JPEG, PNG, ICO e SVG (512x512).
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn--ghost" data-close="1">Fechar</button>
      <button class="btn btn--primary" id="lg_save" type="button" disabled>Salvar logo</button>
    `,
    onMount: ()=>{
      const input = $("#lg_file");
      const cropArea = $("#lg_crop_area");
      const frame = $("#lg_frame");
      const imgEl = $("#lg_crop_img");
      const zoomEl = $("#lg_zoom");
      const saveBtn = $("#lg_save");
      const removeBtn = $("#lg_remove");

      let imgObj = null;
      let imgW = 0, imgH = 0;
      let baseScale = 1;
      let zoom = 1;
      let offsetX = 0, offsetY = 0;

      let dragging = false;
      let sx=0, sy=0, ox=0, oy=0;

      function frameSize(){
        const r = frame.getBoundingClientRect();
        return Math.min(r.width, r.height) || 280;
      }

      function computeBaseScale(){
        const s = frameSize();
        if (!imgW || !imgH) return 1;
        return Math.max(s / imgW, s / imgH);
      }

      function applyTransform(){
        if (!imgObj) return;
        const sc = baseScale * zoom;
        imgEl.style.width = imgW + "px";
        imgEl.style.height = imgH + "px";
        imgEl.style.transform = `translate(-50%,-50%) translate(${offsetX}px,${offsetY}px) scale(${sc})`;
      }

      function clampOffsets(){
        // clampa de forma leve para evitar sumir totalmente
        const s = frameSize();
        const sc = baseScale * zoom;
        const dispW = imgW * sc;
        const dispH = imgH * sc;
        // espaço extra que sobra além do frame
        const maxX = Math.max(0, (dispW - s) / 2);
        const maxY = Math.max(0, (dispH - s) / 2);
        offsetX = clamp(offsetX, -maxX, maxX);
        offsetY = clamp(offsetY, -maxY, maxY);
      }

      frame.addEventListener("pointerdown", (e)=>{
        if (!imgObj) return;
        dragging = true;
        frame.setPointerCapture(e.pointerId);
        sx = e.clientX; sy = e.clientY;
        ox = offsetX; oy = offsetY;
      });
      frame.addEventListener("pointermove", (e)=>{
        if (!dragging) return;
        offsetX = ox + (e.clientX - sx);
        offsetY = oy + (e.clientY - sy);
        clampOffsets();
        applyTransform();
      });
      frame.addEventListener("pointerup", ()=>{ dragging=false; });
      frame.addEventListener("pointercancel", ()=>{ dragging=false; });

      zoomEl.addEventListener("input", ()=>{
        zoom = Number(zoomEl.value) || 1;
        clampOffsets();
        applyTransform();
      });

      input.addEventListener("change", async (e)=>{
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        imgObj = new Image();
        imgObj.onload = ()=>{
          imgW = imgObj.naturalWidth;
          imgH = imgObj.naturalHeight;
          imgEl.src = url;
          cropArea.style.display = "";
          zoom = 1;
          zoomEl.value = "1";
          offsetX = 0; offsetY = 0;
          baseScale = computeBaseScale();
          applyTransform();
          saveBtn.disabled = false;
        };
        imgObj.onerror = ()=>{
          toast("Imagem inválida", "err");
          saveBtn.disabled = true;
        };
        imgObj.src = url;
      });

      removeBtn.addEventListener("click", async ()=>{
        const ok = confirm("Remover a logo personalizada? (vai voltar para o padrão)");
        if (!ok) return;
        const res = await api.deleteLogoImage();
        if (res.ok){
          toast("Logo removida", "ok");
          await refreshBrandLogo();
          closeModal();
        }else{
          toast("Falha ao remover", "err");
        }
      });

      saveBtn.addEventListener("click", async ()=>{
        if (!imgObj) return;

        // Renderiza recorte em canvas (512x512)
        const s = frameSize();
        const canvasSize = 512;
        const canvas = document.createElement("canvas");
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext("2d");

        const totalScale = baseScale * zoom;
        const dispW = imgW * totalScale;
        const dispH = imgH * totalScale;
        const x = (s/2 - dispW/2 + offsetX);
        const y = (s/2 - dispH/2 + offsetY);

        const scaleCanvas = canvasSize / s;
        ctx.clearRect(0,0,canvasSize,canvasSize);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(imgObj, x*scaleCanvas, y*scaleCanvas, dispW*scaleCanvas, dispH*scaleCanvas);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.92));
        if (!blob) return toast("Falha ao gerar imagem", "err");

        saveBtn.disabled = true;
        const res = await api.uploadLogoImage(blob);
        if (res.ok){
          toast("Logo salva", "ok");
          await refreshBrandLogo();
          closeModal();
        }else{
          toast("Falha ao salvar: " + (res.error||""), "err");
          saveBtn.disabled = false;
        }
      });

      // se não existir foto ainda, esconder botão remover
      // (ainda assim funciona, mas fica mais clean)
      api.getLogoMeta().then(meta=>{
        if (!meta?.hasImage) removeBtn.style.display = "none";
      }).catch(()=>{});
    }
  });
}


/* ---------- Modal ---------- */
function openModal({title, body, footer="", onMount=null}){
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modalFooter").innerHTML = footer;
  $("#modal").classList.add("is-open");
  $("#modal").setAttribute("aria-hidden", "false");

  // close bindings
  $("#modalClose").onclick = closeModal;
  $$("#modal [data-close]").forEach(el=>{
    el.onclick = closeModal;
  });

  if (onMount) setTimeout(onMount, 0);
}

function closeModal(){
  $("#modal").classList.remove("is-open");
  $("#modal").setAttribute("aria-hidden", "true");
  $("#modalBody").innerHTML = "";
  $("#modalFooter").innerHTML = "";
  $("#modalTitle")?.classList.remove("pii");
}

/* ---------- Global actions ---------- */
async function refreshAll(rerender=true){
  await loadAll();
  if (rerender) render();
}

function wireSidebar(){
    // Navegação (suporta subpáginas)
  const nav = $("#nav");
  nav?.addEventListener("click", (e)=>{
    const groupBtn = e.target.closest("[data-group-toggle]");
    if (groupBtn){
      toggleNavGroup(groupBtn.dataset.groupToggle);
      return;
    }
    const routeBtn = e.target.closest("[data-route]");
    if (routeBtn){
      setRoute(routeBtn.dataset.route);
    }
  });

  $("#q").addEventListener("input", ()=>{
    state.q = $("#q").value;
    render();
  });

  // Tema (toggle)
  $("#themeToggle")?.addEventListener("click", async ()=>{
    const cur = document.documentElement.dataset.theme || "dark";
    const next = cur === "light" ? "dark" : "light";
    // salva no config
    const cfg = state.config || { company:{}, branding:{} };
    cfg.branding = cfg.branding || {};
    cfg.branding.theme = next;
    const res = await api.saveConfig(cfg);
    if (res.ok){
      state.config = cfg;
      applyTheme(next);
      toast(next==="light" ? "Tema claro" : "Tema escuro", "ok");
      render();
    }else{
      applyTheme(next);
    }
  });

  // Privacidade (censurar dados de clientes)
  $("#privacyToggle")?.addEventListener("click", ()=>{
    const cur = (document.documentElement.dataset.privacy || "off") === "on";
    applyPrivacy(!cur);
    toast(!cur ? "Dados de clientes censurados" : "Dados de clientes visíveis", "ok");
    // re-render para aplicar blur em conteúdo recém-renderizado
    render();
  });


  // close modal on ESC
  window.addEventListener("keydown", (e)=>{
    if (e.key === "Escape" && $("#modal").classList.contains("is-open")){
      closeModal();
    }
  });
}

function initRoute(){
  const h = (window.location.hash || "").replace("#","");
  if (h) state.route = h;
}

/* ---------- Boot ---------- */
(async function boot(){
  initRoute();
  wireSidebar();
  await refreshAuth();
  if (state.auth.authenticated) await loadAll();
  render();
})();

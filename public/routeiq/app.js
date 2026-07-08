/* ── RouteIQ App — app.js ──────────────────────────────────────────── */
"use strict";

// ── Constants ──────────────────────────────────────────────────────────
const CITIES = ['Mumbai','Delhi','Bengaluru','Chennai','Hyderabad','Pune',
                'Ahmedabad','Kolkata','Jaipur','Lucknow','Chandigarh','Surat'];

// Distance matrix (km) for major corridors
const DIST = {
  'Mumbai-Pune':149,'Mumbai-Ahmedabad':528,'Mumbai-Surat':265,
  'Delhi-Jaipur':280,'Delhi-Chandigarh':243,'Delhi-Lucknow':555,
  'Bengaluru-Chennai':346,'Bengaluru-Hyderabad':570,'Bengaluru-Pune':840,
  'Hyderabad-Pune':560,'Hyderabad-Chennai':628,
  'Chennai-Kolkata':1659,'Ahmedabad-Surat':265,
};
function getDistKm(a, b) {
  return DIST[`${a}-${b}`] || DIST[`${b}-${a}`] || Math.round(200 + Math.random() * 800);
}

const VEHICLE_TYPES = ['Box Truck','Flatbed Lorry','Mini Truck','Container Truck','Cab'];
const VEHICLE_ICONS = { 'Box Truck':'🚚','Flatbed Lorry':'🚛','Mini Truck':'🚐','Container Truck':'🏗️','Cab':'🚕' };
const CARGO_TYPES   = ['Electronics','FMCG','Furniture','Auto Parts','Food & Beverage','Machinery','Textiles','Pharma'];

// ── LocalStorage DB ─────────────────────────────────────────────────────
const DB = {
  get:    k => { try { return JSON.parse(localStorage.getItem(`riq_${k}`) || '[]'); } catch { return []; } },
  set:    (k, v) => localStorage.setItem(`riq_${k}`, JSON.stringify(v)),
  one:    k => { try { return JSON.parse(localStorage.getItem(`riq_${k}`) || 'null'); } catch { return null; } },
  setOne: (k, v) => localStorage.setItem(`riq_${k}`, JSON.stringify(v)),
  del:    k => localStorage.removeItem(`riq_${k}`),
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fmtINR(n) { return '₹' + Number(n).toLocaleString('en-IN', {minimumFractionDigits:0,maximumFractionDigits:0}); }

// ── Auth ────────────────────────────────────────────────────────────────
const Auth = {
  current() { return DB.one('session'); },
  register(data) {
    const users = DB.get('users');
    if (users.find(u => u.email === data.email)) return { error: 'Email already registered' };
    const user = { ...data, id: uid(), createdAt: Date.now(), earnings: 0, loads: 0 };
    DB.set('users', [...users, user]);
    DB.setOne('session', user);
    return { user };
  },
  login(email, pw) {
    const user = DB.get('users').find(u => u.email === email && u.password === pw);
    if (!user) return { error: 'Invalid email or password' };
    DB.setOne('session', user);
    return { user };
  },
  logout() { DB.del('session'); },
  update(data) {
    const session = Auth.current();
    if (!session) return;
    const users = DB.get('users').map(u => u.id === session.id ? { ...u, ...data } : u);
    DB.set('users', users);
    DB.setOne('session', { ...session, ...data });
  }
};

// ── Match Engine ─────────────────────────────────────────────────────────
const MatchEngine = {
  score(vehicle, load) {
    let s = 0;
    if (vehicle.from === load.from) s += 50;
    if (vehicle.to   === load.to)   s += 40;
    // Partial corridor (same hub city)
    const hubs = ['Mumbai','Delhi','Bengaluru','Hyderabad','Kolkata'];
    if (hubs.includes(vehicle.from) && hubs.includes(load.from)) s += 10;
    // Capacity check
    if (parseFloat(vehicle.capacity) >= parseFloat(load.weight)) s += 10;
    else s -= 20;
    // Rate check
    if (parseFloat(vehicle.minRate || 2) <= parseFloat(load.rate || 3)) s += 10;
    return Math.min(100, Math.max(0, s));
  },
  matchAll() {
    const vehicles = DB.get('vehicles').filter(v => v.status === 'available');
    const loads    = DB.get('loads').filter(l => l.status === 'open');
    const pairs    = [];
    for (const v of vehicles) {
      for (const l of loads) {
        const sc = MatchEngine.score(v, l);
        if (sc >= 30) pairs.push({ vehicle: v, load: l, score: sc });
      }
    }
    return pairs.sort((a, b) => b.score - a.score);
  },
  findForVehicle(vehicleId) {
    const v = DB.get('vehicles').find(x => x.id === vehicleId);
    if (!v) return [];
    return DB.get('loads').filter(l => l.status === 'open').map(l => ({ load: l, score: MatchEngine.score(v, l) })).filter(x => x.score >= 30).sort((a, b) => b.score - a.score);
  },
  findForLoad(loadId) {
    const l = DB.get('loads').find(x => x.id === loadId);
    if (!l) return [];
    return DB.get('vehicles').filter(v => v.status === 'available').map(v => ({ vehicle: v, score: MatchEngine.score(v, l) })).filter(x => x.score >= 30).sort((a, b) => b.score - a.score);
  },
  accept(vehicleId, loadId) {
    DB.set('vehicles', DB.get('vehicles').map(v => v.id === vehicleId ? { ...v, status: 'matched', matchedLoadId: loadId } : v));
    DB.set('loads',    DB.get('loads').map(l => l.id === loadId ? { ...l, status: 'matched', matchedVehicleId: vehicleId } : l));
    toast('✅ Match confirmed! Trip activated.', 'ok');
    renderDash();
  }
};

// ── Seed Demo Data ──────────────────────────────────────────────────────
function seedDemo() {
  if (DB.get('users').length > 0) return; // already seeded

  const demoUsers = [
    { id:'demo-d', name:'Rajan Kumar', email:'driver@demo.com', password:'demo', role:'driver', city:'Mumbai', phone:'+91 98001 11111', cdl:'MH-DL-2019-12345', minRate:2.5, earnings:42800, loads:23 },
    { id:'demo-s', name:'Priya Exports Ltd', email:'shipper@demo.com', password:'demo', role:'shipper', city:'Delhi', phone:'+91 98002 22222', company:'Priya Exports Pvt Ltd', gstin:'07AABCP1234B1Z5', loads:12, earnings:0 },
    { id:'demo-l', name:'South Fleet Co.', email:'lender@demo.com', password:'demo', role:'lender', city:'Bengaluru', phone:'+91 98003 33333', company:'South Fleet Co.', fleetSize:8, earnings:118500, loads:0 },
  ];
  DB.set('users', demoUsers);

  const vehicles = [
    { id:'v1', ownerId:'demo-d', plate:'MH 12 AB 1234', type:'Box Truck', model:'Tata Ace Gold', capacity:'2', from:'Mumbai', to:'Pune', status:'available', minRate:2.5 },
    { id:'v2', ownerId:'demo-d', plate:'MH 04 CD 5678', type:'Flatbed Lorry', model:'Ashok Leyland Dost+', capacity:'5', from:'Mumbai', to:'Ahmedabad', status:'available', minRate:3.0 },
    { id:'v3', ownerId:'demo-l', plate:'KA 01 ZZ 9999', type:'Container Truck', model:'BharatBenz 2823', capacity:'15', from:'Bengaluru', to:'Chennai', status:'available', minRate:4.0, rental:true },
    { id:'v4', ownerId:'demo-l', plate:'KA 05 BB 2020', type:'Box Truck', model:'Tata LPT 407', capacity:'3', from:'Hyderabad', to:'Pune', status:'available', minRate:2.8, rental:true },
    { id:'v5', ownerId:'demo-d', plate:'DL 1C AB 0001', type:'Cab', model:'Maruti Suzuki Dzire', capacity:'0.3', from:'Delhi', to:'Jaipur', status:'available', minRate:1.5 },
    { id:'v6', ownerId:'demo-l', plate:'TN 09 FF 3030', type:'Mini Truck', model:'Mahindra Bolero Pickup', capacity:'1.5', from:'Chennai', to:'Hyderabad', status:'matched', minRate:2.0, rental:true },
  ];
  DB.set('vehicles', vehicles);

  const loads = [
    { id:'l1', shipperId:'demo-s', from:'Mumbai', to:'Pune', cargo:'FMCG', weight:'1.8', vtype:'Box Truck', rate:'3.0', notes:'Fragile, keep upright', status:'open', postedAt:Date.now()-3600000 },
    { id:'l2', shipperId:'demo-s', from:'Mumbai', to:'Ahmedabad', cargo:'Textiles', weight:'4.5', vtype:'Flatbed Lorry', rate:'3.5', notes:'Bales, waterproof cover needed', status:'open', postedAt:Date.now()-7200000 },
    { id:'l3', shipperId:'demo-s', from:'Bengaluru', to:'Chennai', cargo:'Electronics', weight:'8', vtype:'Container Truck', rate:'5.0', notes:'High value — GPS tracker required', status:'open', postedAt:Date.now()-1800000 },
    { id:'l4', shipperId:'demo-s', from:'Hyderabad', to:'Pune', cargo:'Auto Parts', weight:'3', vtype:'Box Truck', rate:'3.2', notes:'', status:'open', postedAt:Date.now()-9000000 },
    { id:'l5', shipperId:'demo-s', from:'Delhi', to:'Jaipur', cargo:'Pharma', weight:'0.4', vtype:'Cab', rate:'2.0', notes:'Temperature-controlled preferred', status:'open', postedAt:Date.now()-5400000 },
    { id:'l6', shipperId:'demo-s', from:'Chennai', to:'Hyderabad', cargo:'Food & Beverage', weight:'1.2', vtype:'Mini Truck', rate:'2.5', notes:'Perishable — urgent', status:'matched', postedAt:Date.now()-18000000 },
    { id:'l7', shipperId:'demo-s', from:'Ahmedabad', to:'Mumbai', cargo:'Machinery', weight:'12', vtype:'Flatbed Lorry', rate:'4.0', notes:'Heavy equipment', status:'open', postedAt:Date.now()-600000 },
    { id:'l8', shipperId:'demo-s', from:'Kolkata', to:'Lucknow', cargo:'Furniture', weight:'5', vtype:'Box Truck', rate:'3.8', notes:'', status:'open', postedAt:Date.now()-12600000 },
  ];
  DB.set('loads', loads);
}

// ── View Router ──────────────────────────────────────────────────────────
let _currentView = 'landing';
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById(`view-${name}`);
  if (!el) return;
  el.classList.add('active');
  _currentView = name;
  document.querySelectorAll('#nav-links button').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name);
  });
  if (name === 'dashboard') renderDash();
  if (name === 'matchboard') { populateCityFilters(); refreshMatchBoard(); }
  if (name === 'ai') initAIView();
  if (name === 'settings') initSettings();
}

function openAuth(tab, role) {
  showView('auth');
  switchAuthTab(tab || 'login');
  if (role) selectRole(role);
}

// ── Nav ──────────────────────────────────────────────────────────────────
function updateNav() {
  const user = Auth.current();
  const links = document.getElementById('nav-links');
  const avatarBtn = document.getElementById('nav-avatar');
  const roleEl = document.getElementById('nav-role-badge');
  const nameEl = document.getElementById('nav-user-info');
  if (user) {
    links.style.display = 'flex';
    avatarBtn.textContent = user.name.charAt(0).toUpperCase();
    nameEl.textContent = user.name.split(' ')[0];
    roleEl.textContent = user.role;
    roleEl.className = `nav-role-badge badge-${user.role}`;
  } else {
    links.style.display = 'none';
    avatarBtn.textContent = '?';
    nameEl.textContent = '';
    roleEl.textContent = '';
    roleEl.className = 'nav-role-badge';
  }
}

function handleAvatarClick() {
  if (Auth.current()) showView('settings');
  else openAuth('login');
}

// ── Auth UI ──────────────────────────────────────────────────────────────
let _selectedRole = 'driver';
function switchAuthTab(tab) {
  document.getElementById('auth-login').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('auth-register').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('tab-login').classList.toggle('active',    tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}
function selectRole(role) {
  _selectedRole = role;
  document.querySelectorAll('.role-opt').forEach(el => el.classList.remove('selected'));
  document.querySelector(`.role-opt[data-role="${role}"]`)?.classList.add('selected');
  document.getElementById('driver-extras').style.display  = role === 'driver'  ? '' : 'none';
  document.getElementById('shipper-extras').style.display = role === 'shipper' ? '' : 'none';
  document.getElementById('lender-extras').style.display  = role === 'lender'  ? '' : 'none';
}
function showAuthErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pw    = document.getElementById('reg-pw').value;
  const city  = document.getElementById('reg-city').value;
  if (!name || !email || !pw || !city || !_selectedRole)
    return showAuthErr('reg-err', 'Please fill all required fields and select a role.');
  const extras = {};
  if (_selectedRole === 'driver') {
    extras.cdl     = document.getElementById('reg-cdl').value;
    extras.vtype   = document.getElementById('reg-vtype').value;
    extras.minRate = parseFloat(document.getElementById('reg-rate').value) || 2.5;
  }
  if (_selectedRole === 'shipper') {
    extras.company = document.getElementById('reg-company').value;
    extras.gstin   = document.getElementById('reg-gstin').value;
  }
  if (_selectedRole === 'lender') {
    extras.fleetSize = parseInt(document.getElementById('reg-fleet').value) || 1;
    extras.company   = document.getElementById('reg-lcompany').value;
  }
  const res = Auth.register({ name, email, password: pw, role: _selectedRole, city,
    phone: document.getElementById('reg-phone').value, ...extras });
  if (res.error) return showAuthErr('reg-err', res.error);
  updateNav(); showView('dashboard');
  toast(`Welcome to RouteIQ, ${name}! 🎉`, 'ok');
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-pw').value;
  if (!email || !pw) return showAuthErr('login-err', 'Enter email and password.');
  const res = Auth.login(email, pw);
  if (res.error) return showAuthErr('login-err', res.error);
  updateNav(); showView('dashboard');
  toast(`Welcome back, ${res.user.name.split(' ')[0]}! 👋`, 'ok');
}

function quickLogin(role) {
  const emails = { driver:'driver@demo.com', shipper:'shipper@demo.com', lender:'lender@demo.com' };
  const res = Auth.login(emails[role], 'demo');
  if (res.error) return toast('Demo account not found — loading data…', 'err');
  updateNav(); showView('dashboard');
  toast(`Signed in as Demo ${role.charAt(0).toUpperCase()+role.slice(1)}`, 'ok');
}

function doLogout() { Auth.logout(); updateNav(); showView('landing'); toast('Signed out.'); }

// ── Dashboard Renderer ───────────────────────────────────────────────────
function renderDash() {
  const user = Auth.current();
  if (!user) { showView('auth'); return; }
  renderSidebar(user);
  const pane = document.getElementById('dash-main');
  if (user.role === 'driver')  renderDriverDash(user, pane);
  if (user.role === 'shipper') renderShipperDash(user, pane);
  if (user.role === 'lender')  renderLenderDash(user, pane);
}

function renderSidebar(user) {
  const myVehicles = DB.get('vehicles').filter(v => v.ownerId === user.id);
  const myLoads    = DB.get('loads').filter(l => l.shipperId === user.id);
  const openMatches = MatchEngine.matchAll().length;
  const items = {
    driver:  [
      { icon:'📊', label:'Overview',    action:"showDashSection('overview')",   count:null },
      { icon:'🚚', label:'My Vehicles', action:"showDashSection('vehicles')",   count:myVehicles.length },
      { icon:'🔁', label:'Open Matches',action:"showView('matchboard')",        count:openMatches },
      { icon:'💰', label:'Earnings',    action:"showDashSection('earnings')",   count:null },
    ],
    shipper: [
      { icon:'📊', label:'Overview',    action:"showDashSection('overview')",   count:null },
      { icon:'📦', label:'My Loads',    action:"showDashSection('myloads')",    count:myLoads.length },
      { icon:'🔍', label:'Find Vehicles',action:"showView('matchboard')",       count:null },
      { icon:'💵', label:'Billing',     action:"showDashSection('billing')",    count:null },
    ],
    lender: [
      { icon:'📊', label:'Overview',    action:"showDashSection('overview')",   count:null },
      { icon:'🏭', label:'My Fleet',    action:"showDashSection('vehicles')",   count:myVehicles.length },
      { icon:'📋', label:'Rentals',     action:"showDashSection('rentals')",    count:null },
      { icon:'💰', label:'Revenue',     action:"showDashSection('earnings')",   count:null },
    ],
  };
  const roleItems = items[user.role] || [];
  document.getElementById('dash-sidebar').innerHTML = `
    <div class="dash-sidebar-brand">${user.role} panel</div>
    ${roleItems.map(it => `
      <button class="sidebar-item" onclick="${it.action}">
        <span class="si-icon">${it.icon}</span>${it.label}
        ${it.count != null ? `<span class="sidebar-count">${it.count}</span>` : ''}
      </button>`).join('')}
    <div style="flex:1"></div>
    <button class="sidebar-item" onclick="showView('ai')"><span class="si-icon">🤖</span>AI Assistant</button>
    <button class="sidebar-item" onclick="showView('settings')"><span class="si-icon">⚙️</span>Settings</button>
  `;
}

function showDashSection(sec) {
  const user = Auth.current();
  if (!user) return;
  const pane = document.getElementById('dash-main');
  if (user.role === 'driver')  renderDriverDash(user, pane, sec);
  if (user.role === 'shipper') renderShipperDash(user, pane, sec);
  if (user.role === 'lender')  renderLenderDash(user, pane, sec);
}

// ── Driver Dashboard ─────────────────────────────────────────────────────
function renderDriverDash(user, pane, sec = 'overview') {
  const myVehicles = DB.get('vehicles').filter(v => v.ownerId === user.id);
  const allMatches = myVehicles.flatMap(v => MatchEngine.findForVehicle(v.id).map(m => ({ ...m, vehicle: v })));
  const topMatches = allMatches.slice(0, 5);

  pane.innerHTML = `
    ${liveTickerHTML()}
    <div class="stat-grid">
      <div class="stat-card glass"><div class="sc-lbl">Today's Earnings</div><div class="sc-num" style="color:var(--driver2)">${fmtINR(user.earnings || 0)}</div><div class="sc-sub">total lifetime</div></div>
      <div class="stat-card glass"><div class="sc-lbl">Vehicles</div><div class="sc-num">${myVehicles.length}</div><div class="sc-sub">${myVehicles.filter(v=>v.status==='available').length} available</div></div>
      <div class="stat-card glass"><div class="sc-lbl">Open Matches</div><div class="sc-num" style="color:var(--accent)">${topMatches.length}</div><div class="sc-sub">on your corridors</div></div>
      <div class="stat-card glass"><div class="sc-lbl">Trips Completed</div><div class="sc-num">${user.loads || 0}</div><div class="sc-sub">since joining</div></div>
    </div>

    <!-- Vehicles -->
    <div class="section-title">
      🚚 My Vehicles
      <button class="btn btn-sm btn-driver action" onclick="openModal('modal-vehicle')">+ Add Vehicle</button>
    </div>
    <div class="vehicle-grid" id="driver-vehicles">
      ${myVehicles.length === 0 ? `<div class="glass" style="padding:20px;color:var(--muted);font-size:.85rem">No vehicles yet. Add your first vehicle to start receiving matches.</div>` :
        myVehicles.map(v => vehicleCardHTML(v)).join('')}
    </div>

    <!-- Matches -->
    <div class="section-title" style="margin-top:24px">
      🔁 Available Loads on Your Routes
      <button class="btn btn-sm btn-ghost action" onclick="showView('matchboard')">See All</button>
    </div>
    <div class="match-list">
      ${topMatches.length === 0 ?
        `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">No matches yet</div><div class="empty-sub">Add a vehicle with a route to start seeing load matches.</div></div>` :
        topMatches.map(m => matchCardHTML(m.load, m.vehicle, m.score, true)).join('')}
    </div>
  `;
}

// ── Shipper Dashboard ────────────────────────────────────────────────────
function renderShipperDash(user, pane, sec = 'overview') {
  const myLoads    = DB.get('loads').filter(l => l.shipperId === user.id);
  const openLoads  = myLoads.filter(l => l.status === 'open');
  const doneLoads  = myLoads.filter(l => l.status === 'done');

  pane.innerHTML = `
    ${liveTickerHTML()}
    <div class="stat-grid">
      <div class="stat-card glass"><div class="sc-lbl">Active Loads</div><div class="sc-num" style="color:var(--shipper2)">${openLoads.length}</div><div class="sc-sub">awaiting match</div></div>
      <div class="stat-card glass"><div class="sc-lbl">Matched</div><div class="sc-num" style="color:var(--accent)">${myLoads.filter(l=>l.status==='matched').length}</div><div class="sc-sub">in transit</div></div>
      <div class="stat-card glass"><div class="sc-lbl">Delivered</div><div class="sc-num">${doneLoads.length}</div><div class="sc-sub">lifetime</div></div>
      <div class="stat-card glass"><div class="sc-lbl">Avg. Rate</div><div class="sc-num">₹3.2<span style="font-size:.9rem">/km</span></div><div class="sc-sub">last 30 days</div></div>
    </div>

    <div class="section-title">
      📦 My Loads
      <button class="btn btn-sm btn-shipper action" onclick="openModal('modal-load')">+ Post Load</button>
    </div>
    <div class="match-list">
      ${myLoads.length === 0 ?
        `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-text">No loads posted</div><div class="empty-sub">Post your first load and get matched with drivers heading your way.</div></div>` :
        myLoads.map(l => loadCardHTML(l)).join('')}
    </div>

    <div class="section-title" style="margin-top:24px">
      🔍 Available Vehicles for Your Loads
      <button class="btn btn-sm btn-ghost action" onclick="showView('matchboard')">Full Board</button>
    </div>
    <div class="match-list">
      ${openLoads.slice(0, 3).flatMap(l =>
        MatchEngine.findForLoad(l.id).slice(0, 2).map(m => matchCardHTML(l, m.vehicle, m.score, false))
      ).join('') || `<div class="empty-state"><div class="empty-icon">🚚</div><div class="empty-text">No vehicles matched</div><div class="empty-sub">Post a load to see matching drivers.</div></div>`}
    </div>
  `;
}

// ── Lender Dashboard ─────────────────────────────────────────────────────
function renderLenderDash(user, pane, sec = 'overview') {
  const myVehicles = DB.get('vehicles').filter(v => v.ownerId === user.id);
  const rented     = myVehicles.filter(v => v.status === 'matched');
  const revenue    = (user.earnings || 118500);

  pane.innerHTML = `
    ${liveTickerHTML()}
    <div class="stat-grid">
      <div class="stat-card glass"><div class="sc-lbl">Total Revenue</div><div class="sc-num" style="color:var(--lender2)">${fmtINR(revenue)}</div><div class="sc-sub">all time</div></div>
      <div class="stat-card glass"><div class="sc-lbl">Fleet Size</div><div class="sc-num">${myVehicles.length}</div><div class="sc-sub">${user.fleetSize || myVehicles.length} registered</div></div>
      <div class="stat-card glass"><div class="sc-lbl">Currently Rented</div><div class="sc-num" style="color:var(--accent)">${rented.length}</div><div class="sc-sub">vehicles active</div></div>
      <div class="stat-card glass"><div class="sc-lbl">Utilisation</div><div class="sc-num">${myVehicles.length ? Math.round((rented.length/myVehicles.length)*100) : 0}%</div><div class="sc-sub">fleet utilisation</div></div>
    </div>

    <div class="section-title">
      🏭 My Fleet
      <button class="btn btn-sm btn-lender action" onclick="openModal('modal-vehicle')">+ Add Vehicle</button>
    </div>
    <div class="vehicle-grid">
      ${myVehicles.length === 0 ?
        `<div class="glass" style="padding:20px;color:var(--muted);font-size:.85rem">No vehicles listed. Add vehicles to start earning rental income.</div>` :
        myVehicles.map(v => vehicleCardHTML(v, true)).join('')}
    </div>

    <div class="section-title" style="margin-top:24px">💰 Revenue by Month</div>
    ${earningsChartHTML([42000,55000,38000,61000,48000,72000,89000],'lender')}
  `;
}

// ── HTML Helpers ─────────────────────────────────────────────────────────
function vehicleCardHTML(v, showRental = false) {
  const statusColor = v.status === 'available' ? 'var(--driver2)' : v.status === 'matched' ? 'var(--accent2)' : 'var(--muted)';
  return `<div class="vehicle-card">
    <div class="vc-type">${VEHICLE_ICONS[v.type] || '🚚'}</div>
    <div class="vc-plate">${v.plate}</div>
    <div class="vc-model">${v.model || v.type}</div>
    <div class="vc-meta">
      <span>📦 ${v.capacity}t capacity</span>
      <span>📍 ${v.from} → ${v.to}</span>
      <span style="color:${statusColor}">● ${v.status}</span>
      ${showRental && v.rental ? '<span style="color:var(--lender2)">🔄 For Rent</span>' : ''}
      <span>₹${v.minRate}/km min</span>
    </div>
  </div>`;
}

function loadCardHTML(l) {
  const statusClass = `status-${l.status}`;
  const ago = Math.round((Date.now() - l.postedAt) / 60000);
  const agoStr = ago < 60 ? `${ago}m ago` : `${Math.round(ago/60)}h ago`;
  const dist = getDistKm(l.from, l.to);
  const earning = fmtINR(parseFloat(l.rate) * dist);
  return `<div class="load-card">
    <div class="load-head">
      <span class="load-id">#${l.id.slice(-5).toUpperCase()}</span>
      <span class="load-status ${statusClass}">${l.status}</span>
    </div>
    <div style="font-size:.92rem;font-weight:700;margin-bottom:6px">${l.from} <span style="color:var(--accent)">→</span> ${l.to}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
      <span class="tag tag-amber">${l.cargo}</span>
      <span class="tag tag-gray">⚖️ ${l.weight}t</span>
      <span class="tag tag-blue">🚚 ${l.vtype}</span>
      <span class="tag tag-green">₹${l.rate}/km · ${earning}</span>
    </div>
    ${l.notes ? `<div style="font-size:.76rem;color:var(--muted);margin-bottom:6px">"${l.notes}"</div>` : ''}
    <div style="font-size:.72rem;color:var(--muted)">${dist} km · Posted ${agoStr}</div>
  </div>`;
}

function matchCardHTML(load, vehicle, score, isDriver) {
  const cls = score >= 80 ? 'score-high' : score >= 60 ? 'score-mid' : 'score-low';
  const dist = getDistKm(load.from, load.to);
  const earning = fmtINR(parseFloat(load.rate || 3) * dist);
  return `<div class="match-card" onclick="openMatchDetail('${load.id}','${vehicle.id}',${score})">
    <div class="match-score ${cls}">${score}%</div>
    <div class="match-info">
      <div class="match-route">${load.from} <span class="route-arrow">→</span> ${load.to}</div>
      <div class="match-meta">
        <span>📦 ${load.cargo} · ${load.weight}t</span>
        <span>${VEHICLE_ICONS[vehicle.type]||'🚚'} ${vehicle.type}</span>
        <span>📍 ${dist} km</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
        ${score >= 80 ? '<span class="tag tag-green">✦ High Match</span>' : ''}
        <span class="tag tag-blue">₹${load.rate}/km</span>
        <span class="tag tag-gray">${vehicle.plate}</span>
      </div>
    </div>
    <div class="match-actions">
      <div class="match-rate">${earning}</div>
      <div class="match-dist">${dist} km</div>
      <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();MatchEngine.accept('${vehicle.id}','${load.id}');renderDash()">Accept</button>
    </div>
  </div>`;
}

function liveTickerHTML() {
  const events = [
    '🚚 MH 12 AB 1234 matched load Mumbai→Pune — ₹12,300',
    '📦 New load posted: Delhi→Jaipur, 4.5t Textiles',
    '✅ TN 09 FF 3030 delivered Bengaluru→Chennai successfully',
    '🚛 KA 01 ZZ 9999 now available on Bengaluru→Chennai corridor',
    '💰 Priya Exports booked backhaul Hyderabad→Pune — ₹28,600',
  ];
  const msg = events[Math.floor(Date.now() / 8000) % events.length];
  return `<div class="live-ticker">
    <span class="ticker-dot"></span>
    <span class="ticker-label">Live</span>
    <span class="ticker-text">${msg}</span>
  </div>`;
}

function earningsChartHTML(data, role = 'driver') {
  const max = Math.max(...data);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
  const color = { driver:'var(--accent)', shipper:'var(--shipper)', lender:'var(--lender)' }[role] || 'var(--accent)';
  return `<div class="glass" style="padding:16px">
    <div class="chart-bars">
      ${data.map((v, i) => `<div title="${months[i]}: ${fmtINR(v)}" class="chart-bar" style="height:${Math.round((v/max)*100)}%;background:${color}"></div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:6px">
      ${months.map(m => `<span style="font-size:.64rem;color:var(--muted);flex:1;text-align:center">${m}</span>`).join('')}
    </div>
    <div style="font-size:.8rem;font-weight:700;color:var(--text);margin-top:10px">Total: ${fmtINR(data.reduce((a,b)=>a+b,0))}</div>
  </div>`;
}

// ── Match Board ──────────────────────────────────────────────────────────
function populateCityFilters() {
  ['filter-from','filter-to'].forEach(id => {
    const el = document.getElementById(id);
    const first = el.children[0].outerHTML;
    el.innerHTML = first + CITIES.map(c => `<option value="${c}">${c}</option>`).join('');
  });
}

function refreshMatchBoard() {
  const fromF  = document.getElementById('filter-from')?.value || '';
  const toF    = document.getElementById('filter-to')?.value   || '';
  const vtypeF = document.getElementById('filter-vtype')?.value || '';
  const minSc  = parseInt(document.getElementById('filter-minsc')?.value || '0');
  let pairs = MatchEngine.matchAll();
  if (fromF)  pairs = pairs.filter(p => p.load.from === fromF);
  if (toF)    pairs = pairs.filter(p => p.load.to   === toF);
  if (vtypeF) pairs = pairs.filter(p => p.vehicle.type === vtypeF || p.load.vtype === vtypeF || p.load.vtype === 'Any');
  if (minSc)  pairs = pairs.filter(p => p.score >= minSc);
  const list = document.getElementById('matchboard-list');
  if (pairs.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">No matches found</div><div class="empty-sub">Try adjusting your filters.</div></div>`;
    return;
  }
  list.innerHTML = pairs.map(p => matchCardHTML(p.load, p.vehicle, p.score, true)).join('');
}

// ── Match Detail Modal ───────────────────────────────────────────────────
function openMatchDetail(loadId, vehicleId, score) {
  const load    = DB.get('loads').find(l => l.id === loadId);
  const vehicle = DB.get('vehicles').find(v => v.id === vehicleId);
  if (!load || !vehicle) return;
  const dist = getDistKm(load.from, load.to);
  const earning = fmtINR(parseFloat(load.rate) * dist);
  const cls = score >= 80 ? 'score-high' : score >= 60 ? 'score-mid' : 'score-low';
  document.getElementById('modal-match-content').innerHTML = `
    <div class="modal-title">Match Detail <button class="modal-close" onclick="closeModal('modal-match')">✕</button></div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
      <div class="match-score ${cls}" style="width:64px;height:64px;font-size:1rem">${score}%</div>
      <div>
        <div style="font-size:1.1rem;font-weight:800">${load.from} → ${load.to}</div>
        <div style="font-size:.82rem;color:var(--muted)">${dist} km · ${earning} estimated payout</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div class="glass-2" style="padding:14px">
        <div style="font-size:.7rem;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase">Load</div>
        <div style="font-size:.85rem;line-height:2">
          <div>📦 ${load.cargo}</div>
          <div>⚖️ ${load.weight} tonnes</div>
          <div>🚚 ${load.vtype}</div>
          <div>💰 ₹${load.rate}/km</div>
          ${load.notes ? `<div>📝 ${load.notes}</div>` : ''}
        </div>
      </div>
      <div class="glass-2" style="padding:14px">
        <div style="font-size:.7rem;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase">Vehicle</div>
        <div style="font-size:.85rem;line-height:2">
          <div>${VEHICLE_ICONS[vehicle.type]||'🚚'} ${vehicle.type}</div>
          <div>🚘 ${vehicle.model || vehicle.type}</div>
          <div>🔢 ${vehicle.plate}</div>
          <div>📦 ${vehicle.capacity}t capacity</div>
          <div>💸 Min ₹${vehicle.minRate}/km</div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-primary" style="flex:1;justify-content:center"
        onclick="MatchEngine.accept('${vehicleId}','${loadId}');closeModal('modal-match')">
        ✅ Accept This Match
      </button>
      <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-match')">Later</button>
    </div>
  `;
  openModal('modal-match');
}

// ── Modals ────────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function addVehicle() {
  const user = Auth.current();
  if (!user) return;
  const plate = document.getElementById('mv-plate').value.trim();
  const model = document.getElementById('mv-model').value.trim();
  if (!plate) return toast('Enter a plate number', 'err');
  const v = {
    id: uid(), ownerId: user.id,
    plate, type: document.getElementById('mv-type').value,
    model, capacity: document.getElementById('mv-cap').value,
    from: document.getElementById('mv-from').value,
    to:   document.getElementById('mv-to').value,
    status: 'available', minRate: user.minRate || 2.5,
    rental: user.role === 'lender',
  };
  DB.set('vehicles', [...DB.get('vehicles'), v]);
  closeModal('modal-vehicle');
  renderDash();
  toast('Vehicle added ✅', 'ok');
}

function postLoad() {
  const user = Auth.current();
  if (!user) return;
  const from = document.getElementById('ml-from').value;
  const to   = document.getElementById('ml-to').value;
  if (from === to) return toast('Pickup and delivery cities must differ', 'err');
  const l = {
    id: uid(), shipperId: user.id,
    from, to,
    cargo:  document.getElementById('ml-cargo').value,
    weight: document.getElementById('ml-weight').value,
    vtype:  document.getElementById('ml-vtype').value,
    rate:   document.getElementById('ml-rate').value,
    notes:  document.getElementById('ml-notes').value,
    status: 'open', postedAt: Date.now(),
  };
  DB.set('loads', [...DB.get('loads'), l]);
  closeModal('modal-load');
  renderDash();
  toast(`Load posted: ${from} → ${to} ✅`, 'ok');
}

// ── AI Assistant ──────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon:'🛣️', text:'Optimise my return route from Pune to Mumbai' },
  { icon:'💰', text:'What should I charge for a 500 km Box Truck load?' },
  { icon:'🌿', text:'Eco-driving tips for diesel lorries on highways' },
  { icon:'⚠️', text:'Alert me about delays on Delhi-Jaipur corridor' },
  { icon:'📊', text:'Compare backhaul rates across India right now' },
  { icon:'🔧', text:'Pre-trip inspection checklist for my truck' },
];

function initAIView() {
  const qpEl = document.getElementById('quick-prompts');
  qpEl.innerHTML = QUICK_PROMPTS.map(p =>
    `<button class="qp-btn" onclick="sendPrompt(${JSON.stringify(p.text)})">${p.icon} ${p.text}</button>`
  ).join('');

  const msgs = document.getElementById('chat-messages');
  if (msgs.children.length === 0) {
    appendAIMsg('👋 Hi! I\'m RouteIQ AI. I can help with route optimisation, pricing advice, eco-driving tips, and backhaul strategies. What can I help you with?');
  }

  const user = Auth.current();
  const ctx = document.getElementById('ai-context-panel');
  if (user) {
    const myVehicles = DB.get('vehicles').filter(v => v.ownerId === user.id);
    const myLoads    = DB.get('loads').filter(l => l.shipperId === user.id);
    ctx.innerHTML = `
      <b style="color:var(--text)">${user.name}</b><br>
      Role: ${user.role}<br>
      City: ${user.city}<br>
      ${user.role==='driver' ? `Vehicles: ${myVehicles.length}<br>Min Rate: ₹${user.minRate}/km` : ''}
      ${user.role==='shipper' ? `Loads Posted: ${myLoads.length}` : ''}
    `;
  }
  updateAPIStatus();
}

function updateAPIStatus() {
  const panel = document.getElementById('api-status-panel');
  const keys = { 'Anthropic': 'riq_sk_anthropic', 'OpenAI': 'riq_sk_openai', 'Gemini': 'riq_sk_gemini' };
  panel.innerHTML = Object.entries(keys).map(([name, k]) => {
    const ok = !!localStorage.getItem(k);
    return `<div style="display:flex;align-items:center;justify-content:space-between">
      <span>${name}</span>
      <span style="color:${ok?'var(--ok)':'var(--muted)'}">${ok ? '✓ configured' : '○ not set'}</span>
    </div>`;
  }).join('') + `<div style="margin-top:4px;color:var(--muted)">Fallback: Rule engine ✓</div>`;
}

function appendAIMsg(text, isUser = false) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `msg ${isUser ? 'msg-user' : 'msg-ai'}`;
  div.innerHTML = isUser ? text : `<div class="ai-label">RouteIQ AI</div>${text.replace(/\n/g,'<br>')}`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function showTyping() {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg msg-ai msg-typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  div.id = 'typing-indicator';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
function hideTyping() { document.getElementById('typing-indicator')?.remove(); }

async function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  sendPrompt(text);
}
async function sendPrompt(text) {
  appendAIMsg(text, true);
  showTyping();
  try {
    const reply = await AIDispatcher.chat(text, buildAIContext());
    hideTyping();
    appendAIMsg(reply);
  } catch {
    hideTyping();
    appendAIMsg('Sorry, I encountered an error. Please check your API keys in Settings or try again.');
  }
}

function buildAIContext() {
  const user = Auth.current();
  const matches = MatchEngine.matchAll().slice(0, 3);
  return `Platform: RouteIQ India backhaul logistics. ${user ? `User: ${user.name}, Role: ${user.role}, City: ${user.city}.` : ''} ${matches.length} active matches on the board. Respond helpfully and concisely.`;
}

// ── AI Dispatcher (cascade) ───────────────────────────────────────────────
const AIDispatcher = {
  async chat(msg, ctx) {
    const anthKey  = localStorage.getItem('riq_sk_anthropic');
    const openKey  = localStorage.getItem('riq_sk_openai');
    const gemKey   = localStorage.getItem('riq_sk_gemini');
    const systemPrompt = `You are RouteIQ AI, a logistics intelligence assistant for a collaborative backhaul platform in India. ${ctx} Be concise, practical, and use Indian context (₹, km, Indian cities, GST etc.)`;

    // 1. Anthropic Claude
    if (anthKey) {
      try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST',
          headers:{'Content-Type':'application/json','x-api-key':anthKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
          body: JSON.stringify({ model:'claude-haiku-4-5',max_tokens:512,system:systemPrompt,messages:[{role:'user',content:msg}] })
        });
        if (r.ok) {
          const d = await r.json();
          document.getElementById('ai-provider-label').textContent = 'Claude Haiku';
          return d.content?.[0]?.text || 'No response.';
        }
      } catch {}
    }

    // 2. OpenAI
    if (openKey) {
      try {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':`Bearer ${openKey}`},
          body: JSON.stringify({ model:'gpt-4o-mini',max_tokens:512,messages:[{role:'system',content:systemPrompt},{role:'user',content:msg}] })
        });
        if (r.ok) {
          const d = await r.json();
          document.getElementById('ai-provider-label').textContent = 'GPT-4o mini';
          return d.choices?.[0]?.message?.content || 'No response.';
        }
      } catch {}
    }

    // 3. Gemini
    if (gemKey) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemKey}`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{ parts:[{text:`${systemPrompt}\n\nUser: ${msg}`}] }] })
        });
        if (r.ok) {
          const d = await r.json();
          document.getElementById('ai-provider-label').textContent = 'Gemini Flash';
          return d.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
        }
      } catch {}
    }

    // 4. Rule engine fallback
    document.getElementById('ai-provider-label').textContent = 'Rule Engine';
    return AIDispatcher.ruleEngine(msg);
  },

  ruleEngine(msg) {
    const m = msg.toLowerCase();
    if (m.includes('rate') || m.includes('price') || m.includes('charge')) {
      return '📊 **Backhaul Rate Guide (India):**\n• Box Truck (2t): ₹2.5–3.5/km\n• Flatbed Lorry (5t): ₹3.0–4.5/km\n• Container Truck (15t): ₹4.0–6.0/km\n• Cab (partial load): ₹1.5–2.5/km\n\nFor backhaul trips, offer 20–30% below full-load rates to attract shippers. Factor in toll costs (~₹0.50/km on NH).';
    }
    if (m.includes('eco') || m.includes('fuel') || m.includes('diesel')) {
      return '🌿 **Eco-Driving Tips:**\n• Maintain 60–80 km/h on highways (optimal diesel efficiency)\n• Pre-plan routes to avoid peak-hour Delhi/Mumbai traffic\n• Check tyre pressure every 3,000 km (underinflation = +5% fuel use)\n• Use engine braking on downslopes — avoid unnecessary braking\n• Load distribution: keep heaviest items near the cab axle\n• Rest every 4 hrs — fatigue = higher RPM and fuel burn';
    }
    if (m.includes('route') || m.includes('corridor') || m.includes('delay')) {
      return '🛣️ **Top Backhaul Corridors (India):**\n• **Mumbai–Pune** (149 km): Highest daily volume, ₹3.0–4.0/km\n• **Delhi–Jaipur** (280 km): Strong FMCG backhaul\n• **Bengaluru–Chennai** (346 km): Electronics, pharma\n• **Hyderabad–Pune** (560 km): Auto parts, machinery\n• **Ahmedabad–Mumbai** (528 km): Textiles returning north\n\n⚠️ Current advisories: NH48 Pune–Bengaluru has weekend lane closures near Satara.';
    }
    if (m.includes('inspection') || m.includes('checklist')) {
      return '🔧 **Pre-Trip Checklist:**\n✅ Engine oil & coolant levels\n✅ Tyre pressure all 6/10 wheels\n✅ Brake test in parking lot\n✅ Headlights, tail, turn signals\n✅ Load securing straps/chains\n✅ Cargo weight within RC book limit\n✅ Valid insurance + PUC certificate\n✅ Driver licence (no expiry within 30 days)\n✅ E-way bill for interstate cargo >₹50,000';
    }
    if (m.includes('gst') || m.includes('billing') || m.includes('invoice')) {
      return '📋 **GST for Freight (India):**\n• Road transport (GTA): 5% GST (no ITC) or 12% (with ITC)\n• Small operators (<₹20L/yr): GST exempt\n• E-way bill required for interstate goods >₹50,000\n• Invoice must include: GSTIN, HSN 9965 (freight), vehicle no.\n• Payment window: Net-30 standard; RouteIQ escrow releases in 48h post delivery confirmation.';
    }
    return `🚛 **RouteIQ Tip:**\nBackhaul intelligence works best when you keep your route corridors updated. Set your vehicle's current origin/destination daily to receive the best matching scores.\n\nFor personalised route advice, add an API key in Settings to unlock full AI responses. I can analyse specific corridors, competitor rates, seasonal demand, and much more.`;
  }
};

// ── Settings ──────────────────────────────────────────────────────────────
function initSettings() {
  ['anthropic','openai','gemini'].forEach(k => {
    const el = document.getElementById(`sk-${k}`);
    if (el) el.value = localStorage.getItem(`riq_sk_${k}`) || '';
  });
  const user = Auth.current();
  const panel = document.getElementById('profile-panel');
  if (!panel) return;
  panel.innerHTML = user
    ? `<b>${user.name}</b><br>Role: ${user.role}<br>Email: ${user.email}<br>City: ${user.city}<br>Member since: ${new Date(user.createdAt).toLocaleDateString('en-IN')}`
    : 'Not signed in.';
}

function saveAPIKeys() {
  ['anthropic','openai','gemini'].forEach(k => {
    const val = document.getElementById(`sk-${k}`)?.value.trim();
    if (val) localStorage.setItem(`riq_sk_${k}`, val);
    else localStorage.removeItem(`riq_sk_${k}`);
  });
  toast('API keys saved ✅', 'ok');
  updateAPIStatus();
}

// ── Rate Calculator ────────────────────────────────────────────────────────
function calcRate() {
  const km   = parseFloat(document.getElementById('calc-km')?.value) || 0;
  const t    = parseFloat(document.getElementById('calc-t')?.value)  || 0;
  const mult = parseFloat(document.getElementById('calc-vtype')?.value) || 1;
  const base = 2.5 * mult;
  const weightFactor = 1 + (t / 20);
  const rate = base * weightFactor;
  const total = Math.round(rate * km);
  const el = document.getElementById('calc-result');
  if (el) el.textContent = total > 0 ? `${fmtINR(total)} (₹${rate.toFixed(2)}/km)` : '—';
}

// ── Toast ─────────────────────────────────────────────────────────────────
function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `show toast-${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Demo Loader ───────────────────────────────────────────────────────────
function loadDemo() {
  seedDemo();
  quickLogin('driver');
}

// ── Live ticker refresh (simulated real-time) ─────────────────────────────
setInterval(() => {
  if (_currentView === 'dashboard') {
    const ticker = document.querySelector('.live-ticker .ticker-text');
    if (ticker) {
      const msgs = [
        '🚚 DL 1C AB 0001 matched Delhi→Jaipur Pharma load — ₹8,400',
        '📦 New load: Kolkata→Lucknow, 5t Furniture — ₹3.8/km',
        '✅ KA 05 BB 2020 arrived Hyderabad — load delivered',
        '🆕 New driver registered: Gurpreet Singh, Chandigarh',
        '💰 Payout processed: ₹21,500 to South Fleet Co.',
        '🔁 Ahmedabad→Mumbai flatbed matched — ₹42,240 trip',
      ];
      ticker.textContent = msgs[Math.floor(Date.now() / 9000) % msgs.length];
    }
  }
}, 9000);

// ── Init ──────────────────────────────────────────────────────────────────
function initApp() {
  seedDemo();
  updateNav();
  const total_drivers = DB.get('users').filter(u => u.role === 'driver').length;
  const el_d = document.getElementById('stat-drivers');
  if (el_d && total_drivers > 0) el_d.textContent = (1200 + total_drivers).toLocaleString();
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
  if (Auth.current()) showView('dashboard');
  setTimeout(calcRate, 100);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

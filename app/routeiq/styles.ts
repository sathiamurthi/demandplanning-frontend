export const ROUTEIQ_CSS = `
/* RouteIQ Design System — /jobs light theme */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #f8fafc;
  --bg2:       #ffffff;
  --bg3:       #f1f5f9;
  --card:      #ffffff;
  --border:    #e2e8f0;
  --border2:   #cbd5e1;
  --accent:    #0d9488;
  --accent-h:  #0f766e;
  --accent-lt: #f0fdfa;
  --accent-2:  #ccfbf1;
  --text:      #0f172a;
  --text2:     #334155;
  --muted:     #64748b;
  --muted2:    #94a3b8;
  --ok:        #10b981;
  --driver:    #3b82f6;
  --driver2:   #2563eb;
  --shipper:   #10b981;
  --shipper2:  #059669;
  --lender:    #8b5cf6;
  --lender2:   #7c3aed;
  --danger:    #ef4444;
  --warn:      #f59e0b;
  --radius:    16px;
  --bot-h:     64px;
}

/* ── Top Nav ── */
#topnav {
  background: #fff !important;
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; height: 60px; gap: 16px;
}
.nav-brand { display: flex; align-items: center; gap: 10px; }
.logo-icon {
  width: 36px; height: 36px; background: var(--accent);
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  font-size: 18px;
}
.brand-name { font-size: 1rem; font-weight: 900; color: var(--text) !important; letter-spacing: -.3px; background: none !important; -webkit-text-fill-color: var(--text) !important; }
.nav-links { display: flex; gap: 2px; }
.nav-links button {
  background: none; border: none; cursor: pointer;
  font-size: .84rem; font-weight: 600; color: var(--muted);
  padding: 6px 12px; border-radius: 8px;
  transition: background .15s, color .15s;
}
.nav-links button:hover  { background: var(--bg3); color: var(--text); }
.nav-links button.active { background: var(--accent-lt); color: var(--accent); }
.nav-right { display: flex; align-items: center; gap: 8px; }
#nav-user-info { font-size: .83rem; font-weight: 600; color: var(--text2); }
.nav-role-badge {
  font-size: .68rem; font-weight: 700; padding: 2px 9px;
  border-radius: 20px; text-transform: capitalize;
  background: var(--bg3); color: var(--muted);
}
.badge-driver  { background: #eff6ff; color: #1d4ed8; }
.badge-shipper { background: #f0fdf4; color: #15803d; }
.badge-lender  { background: #faf5ff; color: #7e22ce; }
.avatar-btn {
  width: 36px; height: 36px; background: var(--accent); color: #fff;
  border: none; border-radius: 50%; font-size: .9rem; font-weight: 900;
  cursor: pointer; transition: background .15s;
}
.avatar-btn:hover { background: var(--accent-h); }

/* ── Views ── */
#main-content { background: var(--bg); min-height: calc(100vh - 60px); }
.view { display: none !important; }
.view.active { display: block !important; }
#view-auth.active { display: flex !important; }

/* ── Landing Hero ── */
.landing-hero {
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #059669 100%) !important;
  color: #fff; padding: 60px 24px 48px; text-align: center;
}
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.15); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,.22);
  padding: 5px 16px; border-radius: 20px;
  font-size: .72rem; font-weight: 700; letter-spacing: .07em; margin-bottom: 20px;
}
.hero-title {
  font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 900;
  line-height: 1.12; letter-spacing: -1px; margin-bottom: 16px;
  color: #fff !important; background: none !important;
  -webkit-text-fill-color: #fff !important; -webkit-background-clip: unset !important;
  background-clip: unset !important;
}
.hero-sub {
  font-size: .95rem; color: rgba(255,255,255,.88);
  max-width: 520px; margin: 0 auto 32px; line-height: 1.7;
}
.hero-ctas { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

/* ── Stat strip ── */
.stat-strip {
  background: #fff; border-bottom: 1px solid var(--border);
  display: flex; overflow-x: auto; padding: 0 24px;
}
.stat-item {
  display: flex; flex-direction: column; align-items: center;
  padding: 16px 28px; border-right: 1px solid var(--border); min-width: 120px;
}
.stat-item:last-child { border-right: none; }
.stat-num { font-size: 1.4rem; font-weight: 900; color: var(--text); }
.stat-lbl {
  font-size: .68rem; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: .06em; margin-top: 2px;
}

/* ── Persona row ── */
.persona-row {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 16px; max-width: 860px; margin: 0 auto;
}
.persona-card {
  background: #fff; border: 1px solid var(--border);
  border-radius: var(--radius); padding: 28px 20px;
  cursor: pointer; text-align: center;
  transition: border-color .15s, box-shadow .15s, transform .15s;
}
.persona-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 16px rgba(13,148,136,.12);
  transform: translateY(-2px);
}
.persona-icon { font-size: 2.4rem; margin-bottom: 12px; display: block; }
.persona-title { font-size: .95rem; font-weight: 800; color: var(--text); margin-bottom: 8px; }
.persona-desc  { font-size: .78rem; color: var(--muted); line-height: 1.65; }

/* ── Auth view ── */
#view-auth {
  min-height: calc(100vh - 60px);
  align-items: center; justify-content: center;
  padding: 24px; background: var(--bg);
}
.auth-box {
  background: #fff; border: 1px solid var(--border);
  border-radius: var(--radius); width: 100%; max-width: 440px;
  padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,.08);
}
.auth-tabs {
  display: flex; background: var(--bg3); border-radius: 12px;
  padding: 4px; margin-bottom: 24px;
}
.auth-tab {
  flex: 1; border: none; background: none; cursor: pointer;
  font-size: .84rem; font-weight: 700; color: var(--muted);
  padding: 8px; border-radius: 9px; transition: background .15s, color .15s;
}
.auth-tab.active { background: #fff; color: var(--accent); box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.auth-title { font-size: 1.2rem; font-weight: 900; color: var(--text); margin-bottom: 4px; }
.auth-sub   { font-size: .8rem; color: var(--muted); margin-bottom: 20px; }
.auth-err   {
  color: #dc2626; font-size: .8rem; background: #fef2f2;
  border: 1px solid #fecaca; border-radius: 8px;
  padding: 8px 12px; margin-bottom: 12px; display: none;
}
.auth-err:not(:empty) { display: block; }
.auth-sep {
  text-align: center; font-size: .75rem; color: var(--muted2);
  margin: 16px 0; position: relative;
}
.auth-sep::before, .auth-sep::after {
  content: ''; position: absolute; top: 50%;
  width: calc(50% - 90px); height: 1px; background: var(--border);
}
.auth-sep::before { left: 0; } .auth-sep::after { right: 0; }

/* ── Role picker ── */
.role-picker {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 8px; margin-bottom: 16px;
}
.role-opt {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 6px; border: 2px solid var(--border);
  border-radius: 12px; cursor: pointer;
  font-size: .75rem; font-weight: 700; color: var(--muted);
  transition: border-color .15s, background .15s, color .15s;
}
.role-opt:hover,
.role-opt.selected { border-color: var(--accent); background: var(--accent-lt); color: var(--accent); }
.role-icon { font-size: 1.4rem; }
.role-lbl  { font-size: .72rem; }

/* ── Form elements ── */
.form-group { margin-bottom: 14px; }
.form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-label {
  display: block; font-size: .7rem; font-weight: 700; color: #475569;
  text-transform: uppercase; letter-spacing: .07em; margin-bottom: 6px;
}
.form-input {
  width: 100%; border: 1px solid var(--border); border-radius: 12px;
  padding: 10px 14px; font-size: .88rem; color: var(--text);
  background: #fff; outline: none; transition: border-color .15s;
  font-family: inherit;
}
.form-input:focus { border-color: var(--accent); }

/* ── Buttons ── */
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  border: none; cursor: pointer; font-family: inherit;
  font-weight: 700; border-radius: 12px;
  transition: background .15s, transform .1s;
  font-size: .88rem; padding: 11px 22px; white-space: nowrap;
}
.btn:active { transform: scale(.97); }
.btn-primary { background: var(--accent) !important; color: #fff !important; }
.btn-primary:hover { background: var(--accent-h) !important; }

/* Ghost buttons — hero context (on teal bg) */
.landing-hero .btn-ghost {
  background: rgba(255,255,255,.15); color: #fff;
  border: 1px solid rgba(255,255,255,.4);
}
.landing-hero .btn-ghost:hover { background: rgba(255,255,255,.28); }

/* Ghost buttons — light bg context */
.dash .btn-ghost, .auth-box .btn-ghost, .modal-box .btn-ghost,
#view-matchboard .btn-ghost, #view-settings .btn-ghost {
  background: #fff; color: var(--text2); border: 1px solid var(--border);
}
.dash .btn-ghost:hover, #view-matchboard .btn-ghost:hover { background: var(--bg3); }

.btn-sm { font-size: .78rem; padding: 7px 14px; border-radius: 8px; }
.btn-driver  { background: #eff6ff !important; color: #1d4ed8 !important; }
.btn-driver:hover  { background: #dbeafe !important; }
.btn-shipper { background: #f0fdf4 !important; color: #15803d !important; }
.btn-shipper:hover { background: #dcfce7 !important; }
.btn-lender  { background: #faf5ff !important; color: #7e22ce !important; }
.btn-lender:hover  { background: #f3e8ff !important; }
.btn-danger  { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.btn-danger:hover  { background: #fee2e2; }

/* ── Dashboard ── */
.dash { display: flex; min-height: calc(100vh - 60px); }
.dash-sidebar {
  width: 240px; flex-shrink: 0; background: #fff;
  border-right: 1px solid var(--border);
  padding: 16px 10px; display: flex; flex-direction: column; gap: 2px;
}
.dash-sidebar-brand {
  font-size: .68rem; font-weight: 900; color: var(--muted2);
  text-transform: uppercase; letter-spacing: .1em;
  padding: 6px 12px 10px; border-bottom: 1px solid var(--border); margin-bottom: 8px;
}
.dash-main { flex: 1; padding: 24px; background: var(--bg); overflow-y: auto; }

.sidebar-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; border: none; background: none;
  padding: 9px 12px; border-radius: 10px;
  font-size: .84rem; font-weight: 600; color: var(--muted);
  cursor: pointer; text-align: left;
  transition: background .12s, color .12s;
}
.sidebar-item:hover  { background: var(--bg3); color: var(--text); }
.sidebar-item.active { background: var(--accent-lt); color: var(--accent); }
.si-icon { font-size: 1rem; width: 20px; text-align: center; }
.sidebar-count {
  margin-left: auto; font-size: .68rem; font-weight: 700;
  background: var(--accent); color: #fff; padding: 1px 7px; border-radius: 20px;
}

/* ── Section title ── */
.section-title {
  font-size: .7rem; font-weight: 900; color: #475569;
  text-transform: uppercase; letter-spacing: .1em;
  margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
}
.section-title .action, .section-title button.action { margin-left: auto; }

/* ── Dashboard KPI cards ── */
.stat-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr));
  gap: 12px; margin-bottom: 24px;
}
.stat-card {
  background: #fff; border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px 18px;
}
.sc-lbl { font-size: .68rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.sc-num { font-size: 1.6rem; font-weight: 900; color: var(--text); margin-top: 4px; }
.sc-sub { font-size: .72rem; color: var(--muted2); margin-top: 2px; }

/* ── Vehicle cards ── */
.vehicle-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr));
  gap: 12px; margin-bottom: 8px;
}
.vehicle-card {
  background: #fff; border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px;
  transition: border-color .15s, box-shadow .15s;
}
.vehicle-card:hover { border-color: var(--accent); box-shadow: 0 2px 8px rgba(13,148,136,.1); }
.vc-type  { font-size: 2rem; margin-bottom: 6px; }
.vc-plate { font-size: .95rem; font-weight: 900; color: var(--text); margin-bottom: 2px; }
.vc-model { font-size: .78rem; color: var(--muted); margin-bottom: 10px; }
.vc-meta  { display: flex; flex-direction: column; gap: 4px; font-size: .76rem; color: var(--muted); }

/* ── Load cards ── */
.load-card {
  background: #fff; border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px; margin-bottom: 10px;
  transition: border-color .15s;
}
.load-card:hover { border-color: var(--accent); }
.load-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.load-id { font-size: .7rem; font-weight: 800; color: var(--muted2); letter-spacing: .05em; }
.load-status {
  font-size: .68rem; font-weight: 700; padding: 2px 9px;
  border-radius: 20px; text-transform: uppercase; letter-spacing: .04em;
}
.status-open    { background: #f0fdf4; color: #15803d; }
.status-matched { background: var(--accent-lt); color: var(--accent); }
.status-done    { background: var(--bg3); color: var(--muted); }

/* ── Tags ── */
.tag {
  display: inline-flex; align-items: center;
  font-size: .68rem; font-weight: 600;
  padding: 2px 9px; border-radius: 20px; border: 1px solid var(--border);
}
.tag-gray  { background: var(--bg3); color: var(--muted); }
.tag-blue  { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.tag-green { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.tag-amber { background: #fffbeb; color: #b45309; border-color: #fde68a; }

/* ── Match cards ── */
.match-list { display: flex; flex-direction: column; gap: 10px; }
.match-card {
  background: #fff; border: 1px solid var(--border);
  border-radius: var(--radius); padding: 14px 16px;
  display: flex; align-items: flex-start; gap: 14px; cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.match-card:hover { border-color: var(--accent); box-shadow: 0 2px 10px rgba(13,148,136,.1); }
.match-score {
  width: 48px; height: 48px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .82rem; font-weight: 900; color: #fff; flex-shrink: 0;
}
.score-high { background: #059669; }
.score-mid  { background: var(--accent); }
.score-low  { background: var(--warn); }
.match-info { flex: 1; min-width: 0; }
.match-route { font-size: .95rem; font-weight: 800; color: var(--text); margin-bottom: 6px; }
.route-arrow { color: var(--accent); }
.match-meta  { display: flex; flex-wrap: wrap; gap: 8px; font-size: .76rem; color: var(--muted); margin-bottom: 6px; }
.match-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.match-rate { font-size: 1rem; font-weight: 900; color: var(--text); }
.match-dist { font-size: .72rem; color: var(--muted); }

/* ── Board filters ── */
.board-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.board-filters select {
  border: 1px solid var(--border); background: #fff;
  border-radius: 10px; padding: 8px 14px;
  font-size: .82rem; color: var(--text); cursor: pointer;
  outline: none; font-family: inherit; transition: border-color .15s;
}
.board-filters select:focus { border-color: var(--accent); }

/* ── Glass cards ── */
.glass   { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); }
.glass-2 { background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; }

/* ── Earnings chart ── */
.chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 80px; }
.chart-bar  { flex: 1; border-radius: 4px 4px 0 0; transition: opacity .15s; }
.chart-bar:hover { opacity: .8; }

/* ── Live ticker ── */
.live-ticker {
  display: flex; align-items: center; gap: 8px;
  background: var(--accent-lt); border: 1px solid var(--accent-2);
  border-radius: 10px; padding: 10px 14px;
  font-size: .8rem; color: var(--accent); margin-bottom: 20px; font-weight: 600;
}
.ticker-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
  flex-shrink: 0; animation: riq-pulse 1.4s ease-in-out infinite;
}
.ticker-label {
  font-size: .68rem; font-weight: 900; text-transform: uppercase;
  letter-spacing: .08em; background: var(--accent); color: #fff;
  padding: 1px 7px; border-radius: 20px;
}
.ticker-text { flex: 1; }
@keyframes riq-pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }

/* ── AI view ── */
.ai-layout { display: flex; height: calc(100vh - 60px); overflow: hidden; }
.chat-panel { flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--border); }
.chat-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; border-bottom: 1px solid var(--border); background: #fff;
}
.ai-dot {
  width: 10px; height: 10px; border-radius: 50%; background: #10b981;
  box-shadow: 0 0 0 3px rgba(16,185,129,.2); flex-shrink: 0;
}
.chat-messages {
  flex: 1; overflow-y: auto; padding: 20px;
  display: flex; flex-direction: column; gap: 12px; background: var(--bg);
}
.msg { max-width: 72%; padding: 12px 16px; border-radius: 12px; font-size: .88rem; line-height: 1.65; }
.msg-user {
  background: var(--accent); color: #fff;
  border-radius: 12px 12px 2px 12px; align-self: flex-end;
}
.msg-ai {
  background: #fff; color: var(--text);
  border: 1px solid var(--border); border-radius: 12px 12px 12px 2px; align-self: flex-start;
}
.msg-typing {
  background: #fff; border: 1px solid var(--border);
  border-radius: 12px 12px 12px 2px; align-self: flex-start;
  display: flex; align-items: center; gap: 4px; padding: 14px 18px;
}
.msg-typing span {
  width: 7px; height: 7px; background: var(--muted2); border-radius: 50%;
  animation: riq-bounce .9s ease-in-out infinite;
}
.msg-typing span:nth-child(2) { animation-delay: .15s; }
.msg-typing span:nth-child(3) { animation-delay: .30s; }
@keyframes riq-bounce { 0%,80%,100% { transform:scale(.6); } 40% { transform:scale(1); } }
.ai-label { font-size: .68rem; font-weight: 700; color: var(--accent); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .06em; }
.chat-input-row {
  display: flex; gap: 8px; padding: 14px 16px;
  border-top: 1px solid var(--border); background: #fff;
}
.chat-input {
  flex: 1; border: 1px solid var(--border); border-radius: 12px;
  padding: 10px 14px; resize: none; font-size: .88rem;
  font-family: inherit; outline: none; color: var(--text); transition: border-color .15s;
}
.chat-input:focus { border-color: var(--accent); }
.chat-send {
  width: 42px; height: 42px; background: var(--accent); color: #fff;
  border: none; border-radius: 12px; cursor: pointer; font-size: 1rem;
  transition: background .15s; flex-shrink: 0;
}
.chat-send:hover { background: var(--accent-h); }
.ai-sidebar {
  width: 280px; flex-shrink: 0; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
  overflow-y: auto; background: var(--bg);
}
.quick-prompts { display: flex; flex-direction: column; gap: 6px; }
.qp-btn {
  border: 1px solid var(--border); background: #fff; border-radius: 10px;
  padding: 9px 12px; font-size: .78rem; color: var(--text2);
  cursor: pointer; text-align: left; font-family: inherit; font-weight: 500;
  transition: border-color .12s, background .12s, color .12s;
}
.qp-btn:hover { border-color: var(--accent); background: var(--accent-lt); color: var(--accent); }

/* ── Settings ── */
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.rate-result { font-size: 1.8rem; font-weight: 900; color: var(--accent); }

/* ── Empty state ── */
.empty-state { text-align: center; padding: 48px 24px; color: var(--muted); }
.empty-icon  { font-size: 2.5rem; margin-bottom: 12px; }
.empty-text  { font-size: 1rem; font-weight: 700; color: var(--text2); margin-bottom: 6px; }
.empty-sub   { font-size: .82rem; }

/* ── Road viz ── */
.road-viz {
  position: relative; height: 60px; margin: 24px auto; max-width: 500px;
  background: rgba(255,255,255,.12); border-radius: 8px; overflow: hidden;
}
.road { position: absolute; top: 50%; left: 0; right: 0; height: 2px; background: rgba(255,255,255,.35); transform: translateY(-50%); }
.city-dot { position: absolute; top: 50%; transform: translate(-50%,-50%); }
.city-dot:nth-child(2) { left: 10%; }
.city-dot:nth-child(3) { left: 40%; }
.city-dot:nth-child(4) { left: 70%; }
.dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(255,255,255,.8); }
.lbl { font-size: .6rem; color: rgba(255,255,255,.85); text-align: center; margin-top: 4px; white-space: nowrap; }
.truck { position: absolute; top: 50%; transform: translateY(-50%); font-size: 1.2rem; animation: riq-drive 8s linear infinite; }
.truck-2 { animation-delay: -4s; opacity: .7; }
@keyframes riq-drive { from { left: -5%; } to { left: 105%; } }

/* ── Modals ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
  display: none; align-items: center; justify-content: center; padding: 16px;
}
.modal-overlay.open { display: flex; }
.modal-box {
  background: #fff; border-radius: var(--radius);
  width: 100%; max-width: 500px; max-height: 90vh;
  overflow-y: auto; padding: 24px;
  box-shadow: 0 20px 50px rgba(0,0,0,.15);
  animation: riq-modal-in .18s ease;
}
@keyframes riq-modal-in { from { opacity:0; transform:scale(.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
.modal-title {
  font-size: 1.05rem; font-weight: 900; color: var(--text);
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
}
.modal-close {
  width: 28px; height: 28px; border: none; cursor: pointer; border-radius: 50%;
  background: var(--bg3); color: var(--muted); font-size: .8rem;
  display: flex; align-items: center; justify-content: center; transition: background .12s;
}
.modal-close:hover { background: var(--border); }

/* ── Toast ── */
.toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 300;
  background: var(--text); color: #fff;
  padding: 12px 20px; border-radius: 12px;
  font-size: .84rem; font-weight: 600;
  box-shadow: 0 8px 24px rgba(0,0,0,.2);
  animation: riq-slideup .2s ease; max-width: 320px;
}
.toast.ok  { background: #059669; }
.toast.err { background: #dc2626; }
@keyframes riq-slideup { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

/* ── Mobile bottom nav ── */
.mobile-bottom-nav {
  display: none; position: fixed; bottom: 0; left: 0; right: 0;
  height: var(--bot-h); z-index: 100; background: #fff;
  border-top: 1px solid var(--border); padding: 0 8px;
  box-shadow: 0 -2px 10px rgba(0,0,0,.06);
}
.mobile-bottom-nav.visible { display: flex; align-items: center; }
.mbn-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 2px; border: none; background: none;
  cursor: pointer; padding: 8px 4px; border-radius: 10px;
  color: var(--muted); transition: color .12s, background .12s;
}
.mbn-btn.active, .mbn-btn:hover { color: var(--accent); background: var(--accent-lt); }
.mbn-icon  { font-size: 1.15rem; }
.mbn-label { font-size: .6rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }

/* ── Responsive ── */
@media (max-width: 767px) {
  .persona-row   { grid-template-columns: 1fr; max-width: 360px; }
  .form-row      { grid-template-columns: 1fr; }
  .settings-grid { grid-template-columns: 1fr; }
  .dash-sidebar  { display: none; }
  .dash          { flex-direction: column; }
  .ai-sidebar    { display: none; }
  .stat-item     { min-width: 90px; padding: 12px 16px; }
  .toast         { bottom: calc(var(--bot-h) + 12px); }
  .board-filters select { flex: 1 1 calc(50% - 4px); }
  #topnav        { padding: 0 16px; }
  .match-card    { flex-wrap: wrap; }
  .match-actions { flex-direction: row; align-items: center; width: 100%; margin-top: 10px; }
}
@media (min-width: 768px) { .mobile-bottom-nav { display: none !important; } }
@media (max-width: 400px) {
  .hero-ctas .btn { justify-content: center; width: 100%; }
  .hero-ctas { flex-direction: column; }
}
`;

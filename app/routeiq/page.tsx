"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    showView: (view: string) => void;
    openAuth: (tab: string, role?: string) => void;
    handleAvatarClick: () => void;
    loadDemo: () => void;
    doLogin: () => void;
    quickLogin: (role: string) => void;
    switchAuthTab: (tab: string) => void;
    selectRole: (role: string) => void;
    doRegister: () => void;
    refreshMatchBoard: () => void;
    sendChat: () => void;
    saveAPIKeys: () => void;
    doLogout: () => void;
    calcRate: () => void;
    closeModal: (id: string) => void;
    addVehicle: () => void;
    postLoad: () => void;
  }
}

export default function RouteIQPage() {
  useEffect(() => {
    document.title = "RouteIQ — Collaborative Logistics Platform";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/routeiq/style.css";
    link.id = "routeiq-styles";
    document.head.appendChild(link);
    return () => {
      document.title = "NexusOS";
      const el = document.getElementById("routeiq-styles");
      if (el) el.remove();
    };
  }, []);

  return (
    <>
      {/* ── Top Nav ── */}
      <nav id="topnav">
        <div className="nav-brand">
          <span className="logo-icon">🚛</span>
          RouteIQ
        </div>
        <div className="nav-links" id="nav-links" style={{ display: "none" }}>
          <button onClick={() => (window as any).showView("dashboard")} data-view="dashboard">Dashboard</button>
          <button onClick={() => (window as any).showView("matchboard")} data-view="matchboard">Match Board</button>
          <button onClick={() => (window as any).showView("ai")} data-view="ai">AI Assistant</button>
          <button onClick={() => (window as any).showView("settings")} data-view="settings">Settings</button>
        </div>
        <div className="nav-right">
          <span id="nav-user-info"></span>
          <span id="nav-role-badge"></span>
          <button className="avatar-btn" id="nav-avatar" onClick={() => (window as any).handleAvatarClick()}>?</button>
        </div>
      </nav>

      {/* ── Main ── */}
      <div id="main-content">

        {/* LANDING */}
        <section id="view-landing" className="view active">
          <div className="landing-hero">
            <div className="hero-eyebrow">🛣️ Backhaul Intelligence Platform</div>
            <h1 className="hero-title">Zero Empty Miles.<br />Full Earnings.</h1>
            <p className="hero-sub">
              RouteIQ connects returning drivers with waiting cargo — real-time corridor matching for lorries, cabs &amp; rental fleets across India.
            </p>

            <div className="road-viz">
              <div className="road"></div>
              <div className="city-dot">
                <div className="dot" style={{ background: "#3b82f6" }}></div>
                <div className="lbl">Mumbai</div>
              </div>
              <div className="city-dot">
                <div className="dot" style={{ background: "#10b981" }}></div>
                <div className="lbl">Pune</div>
              </div>
              <div className="city-dot">
                <div className="dot" style={{ background: "#f59e0b" }}></div>
                <div className="lbl">Hyderabad</div>
              </div>
              <div className="city-dot" style={{ right: "5%", left: "auto" }}>
                <div className="dot" style={{ background: "#8b5cf6" }}></div>
                <div className="lbl">Bengaluru</div>
              </div>
              <div className="truck">🚚</div>
              <div className="truck truck-2">🚕</div>
            </div>

            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={() => (window as any).openAuth("register")}>Get Started Free</button>
              <button className="btn btn-ghost" onClick={() => (window as any).openAuth("login")}>Sign In</button>
              <button className="btn btn-ghost" onClick={() => (window as any).loadDemo()}>▶ Load Demo</button>
            </div>
          </div>

          <div className="stat-strip">
            <div className="stat-item">
              <div className="stat-num" id="stat-drivers">1,284</div>
              <div className="stat-lbl">Active Drivers</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" id="stat-loads">342</div>
              <div className="stat-lbl">Open Loads</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" id="stat-matches">8,910</div>
              <div className="stat-lbl">Matches Made</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">₹2.80</div>
              <div className="stat-lbl">Avg. ₹/km</div>
            </div>
          </div>

          <div style={{ padding: "40px 20px 20px", textAlign: "center" }}>
            <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: "20px" }}>
              Choose Your Role
            </p>
          </div>
          <div className="persona-row">
            <div className="persona-card driver" onClick={() => (window as any).openAuth("register", "driver")}>
              <div className="persona-icon">🚛</div>
              <div className="persona-title">Independent Driver</div>
              <div className="persona-desc">Lorry operators, cab owners. Get backhaul cargo on your return trip. Earn ₹2–5/km on empty miles.</div>
            </div>
            <div className="persona-card shipper" onClick={() => (window as any).openAuth("register", "shipper")}>
              <div className="persona-icon">📦</div>
              <div className="persona-title">Business Shipper</div>
              <div className="persona-desc">Ship pallets at discounted backhaul rates. Book from warehouse → destination with live tracking.</div>
            </div>
            <div className="persona-card lender" onClick={() => (window as any).openAuth("register", "lender")}>
              <div className="persona-icon">🏭</div>
              <div className="persona-title">Fleet Lender</div>
              <div className="persona-desc">Monetise idle vehicles in your fleet. Set geofence, speed limits, and earn rental revenue automatically.</div>
            </div>
          </div>
        </section>

        {/* AUTH */}
        <section id="view-auth" className="view">
          <div className="auth-box glass" style={{ padding: "28px" }}>
            <div className="auth-tabs">
              <button className="auth-tab active" id="tab-login" onClick={() => (window as any).switchAuthTab("login")}>Sign In</button>
              <button className="auth-tab" id="tab-register" onClick={() => (window as any).switchAuthTab("register")}>Register</button>
            </div>

            {/* Login */}
            <div id="auth-login">
              <div className="auth-title">Welcome back</div>
              <div className="auth-sub">Sign in to your RouteIQ account</div>
              <div className="auth-err" id="login-err"></div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" id="login-email" type="email" placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  id="login-pw"
                  type="password"
                  placeholder="••••••••"
                  onKeyDown={(e) => { if (e.key === "Enter") (window as any).doLogin(); }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
                onClick={() => (window as any).doLogin()}
              >
                Sign In
              </button>
              <div className="auth-sep">or try a demo account</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button className="btn btn-driver btn-sm" onClick={() => (window as any).quickLogin("driver")}>🚛 Demo Driver</button>
                <button className="btn btn-shipper btn-sm" onClick={() => (window as any).quickLogin("shipper")}>📦 Demo Shipper</button>
                <button className="btn btn-lender btn-sm" onClick={() => (window as any).quickLogin("lender")}>🏭 Demo Lender</button>
              </div>
            </div>

            {/* Register */}
            <div id="auth-register" style={{ display: "none" }}>
              <div className="auth-title">Create account</div>
              <div className="auth-sub">Join 1,200+ logistics operators</div>
              <div className="auth-err" id="reg-err"></div>
              <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", marginBottom: "10px" }}>Select your role</p>
              <div className="role-picker" id="role-picker">
                <div className="role-opt driver" data-role="driver" onClick={() => (window as any).selectRole("driver")}>
                  <span className="role-icon">🚛</span><span className="role-lbl">Driver</span>
                </div>
                <div className="role-opt shipper" data-role="shipper" onClick={() => (window as any).selectRole("shipper")}>
                  <span className="role-icon">📦</span><span className="role-lbl">Shipper</span>
                </div>
                <div className="role-opt lender" data-role="lender" onClick={() => (window as any).selectRole("lender")}>
                  <span className="role-icon">🏭</span><span className="role-lbl">Lender</span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" id="reg-name" type="text" placeholder="Rajan Kumar" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" id="reg-phone" type="tel" placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" id="reg-email" type="email" placeholder="you@example.com" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" id="reg-pw" type="password" placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label className="form-label">Home City</label>
                  <select className="form-input" id="reg-city">
                    <option value="">Select city</option>
                    <option>Mumbai</option><option>Delhi</option><option>Bengaluru</option>
                    <option>Chennai</option><option>Hyderabad</option><option>Pune</option>
                    <option>Ahmedabad</option><option>Kolkata</option><option>Jaipur</option>
                    <option>Lucknow</option><option>Chandigarh</option><option>Surat</option>
                  </select>
                </div>
              </div>

              <div id="driver-extras" style={{ display: "none" }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">CDL / Licence No.</label>
                    <input className="form-input" id="reg-cdl" placeholder="DL-0420110012345" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Type</label>
                    <select className="form-input" id="reg-vtype">
                      <option>Box Truck</option><option>Flatbed Lorry</option>
                      <option>Mini Truck</option><option>Container Truck</option><option>Cab</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Min. Payout Rate (₹/km)</label>
                  <input className="form-input" id="reg-rate" type="number" defaultValue="2.5" step="0.1" />
                </div>
              </div>

              <div id="shipper-extras" style={{ display: "none" }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input className="form-input" id="reg-company" placeholder="Acme Logistics Pvt Ltd" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GSTIN</label>
                    <input className="form-input" id="reg-gstin" placeholder="27AABCS1429B1Z1" />
                  </div>
                </div>
              </div>

              <div id="lender-extras" style={{ display: "none" }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fleet Size</label>
                    <input className="form-input" id="reg-fleet" type="number" defaultValue="5" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company / Name</label>
                    <input className="form-input" id="reg-lcompany" placeholder="Fleet Co." />
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
                onClick={() => (window as any).doRegister()}
              >
                Create Account
              </button>
            </div>
          </div>
        </section>

        {/* DASHBOARD */}
        <section id="view-dashboard" className="view">
          <div className="dash">
            <aside className="dash-sidebar" id="dash-sidebar"></aside>
            <main className="dash-main" id="dash-main"></main>
          </div>
        </section>

        {/* MATCH BOARD */}
        <section id="view-matchboard" className="view">
          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: "4px" }}>🔁 Match Board</h1>
                <p style={{ fontSize: ".82rem", color: "var(--muted)" }}>Live backhaul matching across all corridors</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => (window as any).refreshMatchBoard()}>↻ Refresh</button>
            </div>
            <div className="board-filters">
              <select id="filter-from" onChange={() => (window as any).refreshMatchBoard()}>
                <option value="">All Origins</option>
              </select>
              <select id="filter-to" onChange={() => (window as any).refreshMatchBoard()}>
                <option value="">All Destinations</option>
              </select>
              <select id="filter-vtype" onChange={() => (window as any).refreshMatchBoard()}>
                <option value="">All Vehicle Types</option>
                <option>Box Truck</option><option>Flatbed Lorry</option>
                <option>Mini Truck</option><option>Container Truck</option><option>Cab</option>
              </select>
              <select id="filter-minsc" onChange={() => (window as any).refreshMatchBoard()}>
                <option value="">Any Score</option>
                <option value="80">80%+ Match</option>
                <option value="60">60%+ Match</option>
                <option value="40">40%+ Match</option>
              </select>
            </div>
            <div id="matchboard-list" className="match-list"></div>
          </div>
        </section>

        {/* AI ASSISTANT */}
        <section id="view-ai" className="view">
          <div className="ai-layout">
            <div className="chat-panel">
              <div className="chat-header">
                <div className="ai-dot"></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".9rem" }}>RouteIQ AI</div>
                  <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>Route optimizer · Load advisor · Eco-driving coach</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: ".72rem", color: "var(--muted)" }} id="ai-provider-label">Claude Haiku</div>
              </div>
              <div className="chat-messages" id="chat-messages"></div>
              <div className="chat-input-row">
                <textarea
                  className="chat-input"
                  id="chat-input"
                  rows={1}
                  placeholder="Ask about routes, load pricing, or eco-driving…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      (window as any).sendChat();
                    }
                  }}
                ></textarea>
                <button className="chat-send" onClick={() => (window as any).sendChat()}>➤</button>
              </div>
            </div>
            <div className="ai-sidebar">
              <div className="glass" style={{ padding: "16px" }}>
                <div className="section-title">Quick Prompts</div>
                <div className="quick-prompts" id="quick-prompts"></div>
              </div>
              <div className="glass" style={{ padding: "16px" }}>
                <div className="section-title">Context</div>
                <div style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.7 }} id="ai-context-panel">
                  Sign in to personalise AI responses with your route data.
                </div>
              </div>
              <div className="glass" style={{ padding: "16px" }}>
                <div className="section-title">API Status</div>
                <div id="api-status-panel" style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: ".75rem" }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* SETTINGS */}
        <section id="view-settings" className="view">
          <div style={{ padding: "24px", maxWidth: "860px" }}>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 900, marginBottom: "20px" }}>⚙️ Settings</h1>
            <div className="settings-grid">
              <div className="glass" style={{ padding: "20px" }}>
                <div className="section-title" style={{ marginBottom: "16px" }}>🤖 AI API Keys</div>
                <p style={{ fontSize: ".78rem", color: "var(--muted)", marginBottom: "14px" }}>
                  Keys stored in localStorage only. Cascade: Anthropic → OpenAI → Gemini → Rule engine.
                </p>
                <div className="form-group">
                  <label className="form-label">Anthropic API Key</label>
                  <input className="form-input" id="sk-anthropic" type="password" placeholder="sk-ant-…" />
                </div>
                <div className="form-group">
                  <label className="form-label">OpenAI API Key</label>
                  <input className="form-input" id="sk-openai" type="password" placeholder="sk-proj-…" />
                </div>
                <div className="form-group">
                  <label className="form-label">Google Gemini Key</label>
                  <input className="form-input" id="sk-gemini" type="password" placeholder="AIza…" />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => (window as any).saveAPIKeys()}>Save Keys</button>
              </div>

              <div className="glass" style={{ padding: "20px" }}>
                <div className="section-title" style={{ marginBottom: "16px" }}>👤 Profile</div>
                <div id="profile-panel" style={{ fontSize: ".85rem", lineHeight: 2, color: "var(--muted)" }}>Not signed in.</div>
                <button className="btn btn-danger btn-sm" style={{ marginTop: "12px" }} onClick={() => (window as any).doLogout()}>Sign Out</button>
              </div>

              <div className="glass" style={{ padding: "20px" }}>
                <div className="section-title" style={{ marginBottom: "16px" }}>💰 Rate Calculator</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Distance (km)</label>
                    <input className="form-input" id="calc-km" type="number" defaultValue="320" onInput={() => (window as any).calcRate()} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Load (tonnes)</label>
                    <input className="form-input" id="calc-t" type="number" defaultValue="5" onInput={() => (window as any).calcRate()} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select className="form-input" id="calc-vtype" onChange={() => (window as any).calcRate()}>
                    <option value="1">Box Truck</option>
                    <option value="1.2">Flatbed Lorry</option>
                    <option value="1.5">Container Truck</option>
                    <option value="0.8">Mini Truck</option>
                    <option value="0.5">Cab</option>
                  </select>
                </div>
                <div className="glass-2" style={{ padding: "16px", textAlign: "center", marginTop: "4px" }}>
                  <div style={{ fontSize: ".75rem", color: "var(--muted)", marginBottom: "4px" }}>Estimated Rate</div>
                  <div className="rate-result" id="calc-result">—</div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ── Modal: Add Vehicle ── */}
      <div className="modal-overlay" id="modal-vehicle">
        <div className="modal-box">
          <div className="modal-title">
            Add Vehicle
            <button className="modal-close" onClick={() => (window as any).closeModal("modal-vehicle")}>✕</button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Plate Number</label>
              <input className="form-input" id="mv-plate" placeholder="MH 12 AB 1234" />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <select className="form-input" id="mv-type">
                <option>Box Truck</option><option>Flatbed Lorry</option>
                <option>Mini Truck</option><option>Container Truck</option><option>Cab</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Make &amp; Model</label>
              <input className="form-input" id="mv-model" placeholder="Tata Ace Gold" />
            </div>
            <div className="form-group">
              <label className="form-label">Capacity (tonnes)</label>
              <input className="form-input" id="mv-cap" type="number" defaultValue="2" step="0.5" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Current Origin City</label>
              <select className="form-input" id="mv-from">
                <option>Mumbai</option><option>Delhi</option><option>Bengaluru</option>
                <option>Chennai</option><option>Hyderabad</option><option>Pune</option>
                <option>Ahmedabad</option><option>Kolkata</option><option>Jaipur</option>
                <option>Lucknow</option><option>Chandigarh</option><option>Surat</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination City</label>
              <select className="form-input" id="mv-to">
                <option>Pune</option><option>Mumbai</option><option>Delhi</option>
                <option>Bengaluru</option><option>Chennai</option><option>Hyderabad</option>
                <option>Ahmedabad</option><option>Kolkata</option><option>Jaipur</option>
                <option>Lucknow</option><option>Chandigarh</option><option>Surat</option>
              </select>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
            onClick={() => (window as any).addVehicle()}
          >
            Add Vehicle
          </button>
        </div>
      </div>

      {/* ── Modal: Post Load ── */}
      <div className="modal-overlay" id="modal-load">
        <div className="modal-box">
          <div className="modal-title">
            Post a Load
            <button className="modal-close" onClick={() => (window as any).closeModal("modal-load")}>✕</button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pickup City</label>
              <select className="form-input" id="ml-from">
                <option>Mumbai</option><option>Delhi</option><option>Bengaluru</option>
                <option>Chennai</option><option>Hyderabad</option><option>Pune</option>
                <option>Ahmedabad</option><option>Kolkata</option><option>Jaipur</option>
                <option>Lucknow</option><option>Chandigarh</option><option>Surat</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Delivery City</label>
              <select className="form-input" id="ml-to">
                <option>Pune</option><option>Mumbai</option><option>Delhi</option>
                <option>Bengaluru</option><option>Chennai</option><option>Hyderabad</option>
                <option>Ahmedabad</option><option>Kolkata</option><option>Jaipur</option>
                <option>Lucknow</option><option>Chandigarh</option><option>Surat</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cargo Type</label>
              <select className="form-input" id="ml-cargo">
                <option>Electronics</option><option>FMCG</option><option>Furniture</option>
                <option>Auto Parts</option><option>Food &amp; Beverage</option>
                <option>Machinery</option><option>Textiles</option><option>Pharma</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Weight (tonnes)</label>
              <input className="form-input" id="ml-weight" type="number" defaultValue="3" step="0.5" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Required Vehicle</label>
              <select className="form-input" id="ml-vtype">
                <option>Any</option><option>Box Truck</option><option>Flatbed Lorry</option>
                <option>Mini Truck</option><option>Container Truck</option><option>Cab</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Offered Rate (₹/km)</label>
              <input className="form-input" id="ml-rate" type="number" defaultValue="3.0" step="0.1" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input className="form-input" id="ml-notes" placeholder="Fragile, keep dry…" />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
            onClick={() => (window as any).postLoad()}
          >
            Post Load
          </button>
        </div>
      </div>

      {/* ── Modal: Match Detail ── */}
      <div className="modal-overlay" id="modal-match">
        <div className="modal-box" id="modal-match-content"></div>
      </div>

      {/* Toast */}
      <div id="toast"></div>

      <Script src="/routeiq/app.js" strategy="afterInteractive" />
    </>
  );
}

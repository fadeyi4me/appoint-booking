import { useState, useEffect, useCallback, useRef } from "react";

// ─── SUPABASE CONFIG ───────────────────────────────────────────────────────
const SUPABASE_URL = "https://tftewlamxkzzajbulsvd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdGV3bGFteGt6emFqYnVsc3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjIyODAsImV4cCI6MjA4ODc5ODI4MH0.hNiA_t5GMYDfqjtITPWoq9cB_lQxag5yYu1fpEleEO4";
const IS_CONFIGURED = SUPABASE_URL !== "https://tftewlamxkzzajbulsvd.supabase.co";

const supabase = {
  async select(table, filters = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filters}&order=created_at.desc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async delete(table, id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) throw new Error(await res.text());
  },
};

// ─── STAFF CREDENTIALS (replace with real credentials) ────────────────────
const STAFF_CREDENTIALS = [
  { id: "admin", name: "Studio Admin", role: "Administrator", pin: "1234", isAdmin: true },
  { id: "1",     name: "Jordan Lee",   role: "Senior Stylist", pin: "2222", isAdmin: false },
  { id: "2",     name: "Maya Chen",    role: "Color Specialist", pin: "3333", isAdmin: false },
  { id: "3",     name: "Alex Rivera",  role: "Style Director", pin: "4444", isAdmin: false },
];

// ─── DATA ─────────────────────────────────────────────────────────────────
const SERVICES = [
  { id: 1, name: "Haircut & Style", duration: 60, price: 65, icon: "✂️", desc: "Precision cut tailored to your face shape and lifestyle" },
  { id: 2, name: "Color Treatment", duration: 120, price: 120, icon: "🎨", desc: "Full color, highlights, balayage or creative color" },
  { id: 3, name: "Deep Conditioning", duration: 45, price: 45, icon: "💧", desc: "Restore moisture and shine with a luxe treatment" },
  { id: 4, name: "Blowout", duration: 30, price: 35, icon: "💨", desc: "Smooth, voluminous finish that lasts for days" },
];

const STAFF = [
  { id: 1, name: "Jordan Lee",  role: "Senior Stylist",    avatar: "JL", since: "8 yrs" },
  { id: 2, name: "Maya Chen",   role: "Color Specialist",  avatar: "MC", since: "5 yrs" },
  { id: 3, name: "Alex Rivera", role: "Style Director",    avatar: "AR", since: "12 yrs" },
];

const TIME_SLOTS = [
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM",
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Beautiful hair/beauty images from Unsplash (free to use)
const CAROUSEL_SLIDES = [
  { url: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?w=1400&q=80", label: "Signature Color", sub: "Bespoke tones crafted for you" },
  { url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1400&q=80", label: "Precision Cut", sub: "Shape that moves with you" },
  { url: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=1400&q=80", label: "Luxury Styling", sub: "Finish that lasts for days" },
  { url: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1400&q=80", label: "Colour Artistry", sub: "Highlights & balayage mastery" },
  { url: "https://images.unsplash.com/photo-1582095133179-bfd08e2533cf?w=1400&q=80", label: "Deep Conditioning", sub: "Restore. Revive. Radiate." },
];

function getDaysInMonth(year, month) {
  const days = [];
  const firstDay = new Date(year, month, 1).getDay();
  const total    = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= total; d++) days.push(d);
  return days;
}

// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const today = new Date();

  // ── theme ──
  const [dark, setDark] = useState(true);

  // ── auth ──
  const [staffUser, setStaffUser]     = useState(null); // logged-in staff
  const [showLogin, setShowLogin]     = useState(false);
  const [loginPin, setLoginPin]       = useState("");
  const [loginError, setLoginError]   = useState("");
  const [loginInput, setLoginInput]   = useState(""); // username field
  const pinRef = useRef(null);

  // ── view ──
  const [view, setView]               = useState("home"); // home | book | admin | settings
  const [step, setStep]               = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // ── carousel ──
  const [slide, setSlide]             = useState(0);
  const [slideDir, setSlideDir]       = useState(1);

  // ── booking ──
  const [selService, setSelService]   = useState(null);
  const [selStaff, setSelStaff]       = useState(null);
  const [calMonth, setCalMonth]       = useState(today.getMonth());
  const [calYear, setCalYear]         = useState(today.getFullYear());
  const [selDate, setSelDate]         = useState(null);
  const [selTime, setSelTime]         = useState(null);
  const [form, setForm]               = useState({ name:"", email:"", phone:"", notes:"" });
  const [submitted, setSubmitted]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [dbError, setDbError]         = useState(null);

  // ── admin data ──
  const [bookings, setBookings]       = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [deleting, setDeleting]       = useState(null);

  const dateStr = selDate ? `${MONTHS[calMonth]} ${selDate}, ${calYear}` : null;

  // ── Auto-advance carousel ──
  useEffect(() => {
    const t = setInterval(() => {
      setSlideDir(1);
      setSlide(s => (s + 1) % CAROUSEL_SLIDES.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  // ── Fetch bookings ──
  const fetchBookings = useCallback(async () => {
    if (!IS_CONFIGURED) return;
    setLoading(true);
    try {
      const data = await supabase.select("bookings");
      setBookings(data);
      setBookedSlots(data.map(b => ({ staff_id: b.staff_id, date: b.date, time: b.time })));
    } catch (e) { setDbError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (view === "admin") fetchBookings(); }, [view, fetchBookings]);

  useEffect(() => {
    if (!IS_CONFIGURED || !selDate || !selStaff) return;
    (async () => {
      try {
        const data = await supabase.select("bookings", `staff_id=eq.${selStaff.id}&date=eq.${encodeURIComponent(dateStr)}&select=time`);
        setBookedSlots(prev => {
          const f = prev.filter(s => !(s.staff_id === selStaff.id && s.date === dateStr));
          return [...f, ...data.map(d => ({ staff_id: selStaff.id, date: dateStr, time: d.time }))];
        });
      } catch (_) {}
    })();
  }, [selDate, selStaff, dateStr]);

  const takenSlots = (selStaff && dateStr)
    ? bookedSlots.filter(s => s.staff_id === selStaff.id && s.date === dateStr).map(s => s.time)
    : [];

  // ── Login logic ──
  function handleLogin() {
    setLoginError("");
    const match = STAFF_CREDENTIALS.find(
      s => s.name.toLowerCase() === loginInput.toLowerCase() && s.pin === loginPin
    );
    if (match) {
      setStaffUser(match);
      setShowLogin(false);
      setLoginInput(""); setLoginPin(""); setLoginError("");
      setView("admin");
    } else {
      setLoginError("Incorrect name or PIN. Please try again.");
      setLoginPin("");
      pinRef.current?.focus();
    }
  }

  function handleLogout() { setStaffUser(null); setView("home"); }

  // ── Book ──
  async function handleBook() {
    setSaving(true); setDbError(null);
    const record = { name: form.name, email: form.email, phone: form.phone, notes: form.notes, service: selService.name, staff: selStaff.name, staff_id: selStaff.id, date: dateStr, time: selTime };
    try {
      if (IS_CONFIGURED) {
        const [saved] = await supabase.insert("bookings", record);
        setBookings(prev => [saved, ...prev]);
        setBookedSlots(prev => [...prev, { staff_id: selStaff.id, date: dateStr, time: selTime }]);
      } else {
        setBookings(prev => [{ id: Date.now(), ...record, created_at: new Date().toISOString() }, ...prev]);
      }
      setSubmitted(true);
    } catch (e) { setDbError("Booking failed: " + e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      if (IS_CONFIGURED) await supabase.delete("bookings", id);
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (e) { setDbError(e.message); }
    finally { setDeleting(null); }
  }

  function resetBook() {
    setStep(1); setSelService(null); setSelStaff(null);
    setSelDate(null); setSelTime(null);
    setForm({ name:"", email:"", phone:"", notes:"" });
    setSubmitted(false); setDbError(null);
  }

  const revenue = bookings.reduce((a, b) => { const s = SERVICES.find(s => s.name === b.service); return a + (s ? s.price : 0); }, 0);
  const days = getDaysInMonth(calYear, calMonth);

  // ─── CSS VARS ──────────────────────────────────────────────────────────
  const D = {
    bg:       dark ? "#0e0c0a" : "#faf8f4",
    surface:  dark ? "#1a1713" : "#ffffff",
    surface2: dark ? "#231f1b" : "#f5f1eb",
    border:   dark ? "#2e2925" : "#e8e0d4",
    text:     dark ? "#f0ece4" : "#1a1713",
    textMid:  dark ? "#9a9088" : "#7a7068",
    textDim:  dark ? "#4a4540" : "#b0a898",
    gold:     "#c9a96e",
    goldDark: "#a8843e",
    goldLight:"#e8c88a",
    danger:   "#c0392b",
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: ${D.bg}; --surface: ${D.surface}; --surface2: ${D.surface2};
      --border: ${D.border}; --text: ${D.text}; --textMid: ${D.textMid};
      --textDim: ${D.textDim}; --gold: ${D.gold}; --golddark: ${D.goldDark};
      --goldlight: ${D.goldLight}; --danger: ${D.danger};
    }
    body { background: var(--bg); color: var(--text); transition: background .4s, color .4s; }
    .pf { font-family: 'Playfair Display', Georgia, serif; }
    .dm { font-family: 'DM Sans', sans-serif; }

    /* ── Buttons ── */
    .btn-primary {
      background: var(--gold); color: #0e0c0a; border: none;
      padding: 13px 32px; font-family: 'DM Sans', sans-serif; font-weight: 500;
      font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;
      cursor: pointer; transition: all .2s; border-radius: 1px;
    }
    .btn-primary:hover { background: var(--goldlight); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,169,110,.35); }
    .btn-primary:disabled { background: var(--border); color: var(--textDim); cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-ghost {
      background: transparent; color: var(--gold);
      border: 1px solid var(--gold); padding: 12px 28px;
      font-family: 'DM Sans', sans-serif; font-size: 13px; letter-spacing: 1.5px;
      text-transform: uppercase; cursor: pointer; transition: all .2s; border-radius: 1px;
    }
    .btn-ghost:hover { background: rgba(201,169,110,.1); }
    .btn-icon {
      background: transparent; border: none; cursor: pointer;
      color: var(--textMid); padding: 6px; transition: color .2s;
      font-size: 18px; line-height: 1; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-icon:hover { color: var(--gold); }

    /* ── Cards ── */
    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 3px; transition: border-color .25s, box-shadow .25s;
    }
    .card:hover { border-color: var(--gold); }
    .card.sel { border-color: var(--gold); background: ${dark ? "#1e1a14" : "#fdf8f0"}; box-shadow: 0 0 0 1px var(--gold); }
    .card.static:hover { border-color: var(--border); }

    /* ── Inputs ── */
    .inp {
      background: var(--surface2); border: 1px solid var(--border);
      color: var(--text); padding: 13px 16px; font-family: 'DM Sans', sans-serif;
      font-size: 14px; width: 100%; outline: none; border-radius: 2px;
      transition: border-color .2s, box-shadow .2s;
    }
    .inp:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,169,110,.12); }
    .inp::placeholder { color: var(--textDim); }
    .lbl { font-family:'DM Sans',sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--textMid); display:block; margin-bottom:8px; }

    /* ── Time slot ── */
    .ts {
      background: var(--surface2); border: 1px solid var(--border);
      color: var(--textMid); padding: 9px 8px;
      font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer;
      letter-spacing: .5px; transition: all .18s; text-align: center; border-radius: 2px;
    }
    .ts:hover:not(.bk) { border-color: var(--gold); color: var(--text); }
    .ts.act { background: var(--gold); color: #0e0c0a; border-color: var(--gold); font-weight: 600; }
    .ts.bk { opacity: .28; cursor: not-allowed; text-decoration: line-through; }

    /* ── Calendar ── */
    .cd {
      aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
      font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer;
      border-radius: 50%; transition: all .15s; color: var(--textMid);
    }
    .cd:hover:not(.past):not(.emp) { background: var(--surface2); color: var(--text); }
    .cd.selday { background: var(--gold) !important; color: #0e0c0a !important; font-weight: 700; }
    .cd.past { opacity: .22; cursor: default; }
    .cd.tod { color: var(--gold); font-weight: 700; }
    .cd.emp { cursor: default; }

    /* ── Carousel ── */
    .carousel { position: relative; width: 100%; height: 480px; overflow: hidden; }
    .c-slide {
      position: absolute; inset: 0; transition: opacity .9s ease, transform .9s ease;
      opacity: 0; transform: scale(1.04);
    }
    .c-slide.active { opacity: 1; transform: scale(1); }
    .c-slide img { width: 100%; height: 100%; object-fit: cover; }
    .c-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to right, rgba(14,12,10,.82) 38%, rgba(14,12,10,.18) 100%);
    }
    .c-overlay.light {
      background: linear-gradient(to right, rgba(250,248,244,.90) 38%, rgba(250,248,244,.2) 100%);
    }
    .c-content {
      position: absolute; top: 50%; left: 0; transform: translateY(-50%);
      padding: 0 64px; max-width: 560px;
    }
    .c-dots {
      position: absolute; bottom: 24px; left: 64px;
      display: flex; gap: 8px; align-items: center;
    }
    .c-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(201,169,110,.35); cursor: pointer; transition: all .3s;
    }
    .c-dot.a { background: var(--gold); width: 20px; border-radius: 3px; }

    /* ── Step dots ── */
    .step-track { display: flex; align-items: center; justify-content: center; gap: 0; }
    .step-dot { width: 8px; height: 8px; border-radius: 50%; transition: all .3s; }
    .step-line { width: 40px; height: 1px; }

    /* ── Login overlay ── */
    .login-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(14,12,10,.88); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .3s ease;
    }
    .login-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 4px; padding: 48px 44px; width: 100%; max-width: 420px;
      position: relative; animation: slideUp .35s ease;
    }
    .pin-dots { display: flex; gap: 12px; justify-content: center; margin: 24px 0 8px; }
    .pin-dot {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid var(--border); transition: all .2s;
    }
    .pin-dot.filled { background: var(--gold); border-color: var(--gold); }
    .pin-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 16px; }
    .pin-btn {
      background: var(--surface2); border: 1px solid var(--border);
      color: var(--text); font-family: 'Playfair Display', serif; font-size: 22px;
      padding: 16px; cursor: pointer; border-radius: 2px; transition: all .15s;
      text-align: center;
    }
    .pin-btn:hover { border-color: var(--gold); color: var(--gold); }
    .pin-btn:active { transform: scale(.95); }

    /* ── Settings panel ── */
    .settings-overlay {
      position: fixed; inset: 0; z-index: 900;
      background: rgba(14,12,10,.6); backdrop-filter: blur(8px);
      display: flex; align-items: flex-end; justify-content: flex-end;
      animation: fadeIn .25s ease;
    }
    .settings-panel {
      background: var(--surface); border-left: 1px solid var(--border);
      border-top: 1px solid var(--border); width: 320px; height: 100%;
      padding: 32px 28px; animation: slideLeft .3s ease; overflow-y: auto;
    }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--border); }
    .toggle {
      width: 48px; height: 26px; border-radius: 13px; cursor: pointer;
      transition: background .25s; position: relative; border: none;
      background: ${dark ? "var(--gold)" : "var(--border)"};
    }
    .toggle::after {
      content: ''; position: absolute; top: 3px;
      left: ${dark ? "25px" : "3px"}; width: 20px; height: 20px;
      border-radius: 50%; background: white; transition: left .25s;
    }

    /* ── Booking row ── */
    .brow { border-bottom: 1px solid var(--border); padding: 14px 0; transition: background .15s; }
    .brow:hover { background: var(--surface2); padding-left: 8px; }
    .tag-svc { display: inline-block; padding: 3px 10px; font-family:'DM Sans',sans-serif; font-size:10px; letter-spacing:1px; text-transform:uppercase; background: rgba(201,169,110,.12); color: var(--gold); border: 1px solid rgba(201,169,110,.25); border-radius: 2px; }

    /* ── Staff avatar ── */
    .avatar {
      width: 52px; height: 52px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif;
      font-size: 15px; font-weight: 600; transition: all .2s; flex-shrink: 0;
    }

    /* ── Divider ── */
    .dv { border: none; border-top: 1px solid var(--border); }

    /* ── Animations ── */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
    .fu { animation: fadeUp .4s ease forwards; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { width: 18px; height: 18px; border: 2px solid var(--border); border-top-color: var(--gold); border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
    .sh::-webkit-scrollbar { display: none; }
    @keyframes fall { 0% { transform: translateY(-20px) rotate(0deg); opacity:1; } 100% { transform: translateY(500px) rotate(720deg); opacity:0; } }
    .confetti { position: absolute; width: 7px; height: 7px; border-radius: 50%; animation: fall 3.5s ease-in forwards; }

    /* ── Nav ── */
    .nav-link { font-family: 'DM Sans', sans-serif; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--textMid); background: none; border: none; cursor: pointer; padding: 4px 0; transition: color .2s; position: relative; }
    .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:1px; background:var(--gold); transform:scaleX(0); transition:transform .25s; }
    .nav-link:hover { color: var(--text); }
    .nav-link.act { color: var(--gold); }
    .nav-link.act::after { transform: scaleX(1); }
  `;

  // ─── RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: D.bg, color: D.text, transition: "background .4s, color .4s" }}>
      <style>{css}</style>

      {/* ══ LOGIN MODAL ══ */}
      {showLogin && (
        <div className="login-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowLogin(false); setLoginPin(""); setLoginInput(""); setLoginError(""); } }}>
          <div className="login-card">
            <button className="btn-icon" style={{ position:"absolute", top:20, right:20 }} onClick={() => { setShowLogin(false); setLoginPin(""); setLoginInput(""); setLoginError(""); }}>✕</button>
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(201,169,110,.12)", border:"1px solid rgba(201,169,110,.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:24 }}>🔑</div>
              <h2 className="pf" style={{ fontSize:26, fontWeight:500, color:D.text }}>Staff Portal</h2>
              <p className="dm" style={{ fontSize:13, color:D.textMid, marginTop:6 }}>Enter your name and PIN to continue</p>
            </div>

            <label className="lbl">Your Name</label>
            <input className="inp" placeholder="e.g. Jordan Lee" value={loginInput}
              onChange={e => setLoginInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && pinRef.current?.focus()}
              style={{ marginBottom:20 }} />

            <label className="lbl" style={{ textAlign:"center", display:"block" }}>PIN</label>
            <div className="pin-dots">
              {[0,1,2,3].map(i => (
                <div key={i} className={`pin-dot ${i < loginPin.length ? "filled" : ""}`} />
              ))}
            </div>

            <input ref={pinRef} type="password" className="inp" placeholder="Enter 4-digit PIN"
              value={loginPin} maxLength={4}
              onChange={e => { setLoginPin(e.target.value.replace(/\D/g,"")); setLoginError(""); }}
              onKeyDown={e => e.key === "Enter" && loginPin.length === 4 && handleLogin()}
              style={{ textAlign:"center", letterSpacing:"8px", fontSize:20, marginBottom:8 }} />

            {loginError && (
              <p className="dm" style={{ fontSize:12, color:D.danger, textAlign:"center", marginBottom:12 }}>{loginError}</p>
            )}

            <button className="btn-primary" style={{ width:"100%", marginTop:16 }}
              disabled={!loginInput || loginPin.length < 4}
              onClick={handleLogin}>
              Sign In
            </button>

            <p className="dm" style={{ fontSize:11, color:D.textDim, textAlign:"center", marginTop:20, lineHeight:1.6 }}>
              Access is restricted to authorized staff only.<br/>Contact admin if you need credentials.
            </p>
          </div>
        </div>
      )}

      {/* ══ SETTINGS PANEL ══ */}
      {showSettings && (
        <div className="settings-overlay" onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}>
          <div className="settings-panel">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
              <h3 className="pf" style={{ fontSize:22, fontWeight:500 }}>Settings</h3>
              <button className="btn-icon" onClick={() => setShowSettings(false)}>✕</button>
            </div>

            <div className="toggle-row">
              <div>
                <p className="dm" style={{ fontSize:14, fontWeight:500 }}>Dark Mode</p>
                <p className="dm" style={{ fontSize:12, color:D.textMid, marginTop:2 }}>Switch between light and dark</p>
              </div>
              <button className="toggle" onClick={() => setDark(d => !d)} aria-label="Toggle dark mode" />
            </div>

            <div style={{ marginTop:32 }}>
              <p className="lbl" style={{ marginBottom:16 }}>Appearance</p>
              <div style={{ display:"flex", gap:12 }}>
                {[
                  { label:"Light", bg:"#faf8f4", border:"#e8e0d4", text:"#1a1713" },
                  { label:"Dark",  bg:"#0e0c0a", border:"#2e2925", text:"#f0ece4" },
                ].map(t => (
                  <div key={t.label}
                    onClick={() => setDark(t.label === "Dark")}
                    style={{ flex:1, background:t.bg, border:`2px solid ${(!dark && t.label==="Light") || (dark && t.label==="Dark") ? "#c9a96e" : t.border}`, borderRadius:4, padding:"12px 8px", cursor:"pointer", textAlign:"center", transition:"border-color .2s" }}>
                    <p style={{ fontFamily:"DM Sans, sans-serif", fontSize:12, color:t.text }}>{t.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {staffUser && (
              <div style={{ marginTop:40, padding:"20px", background:D.surface2, borderRadius:3, border:`1px solid ${D.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div className="avatar" style={{ background:"rgba(201,169,110,.15)", color:D.gold, width:40, height:40, fontSize:13 }}>
                    {staffUser.name.split(" ").map(n=>n[0]).join("")}
                  </div>
                  <div>
                    <p className="dm" style={{ fontSize:14, fontWeight:500 }}>{staffUser.name}</p>
                    <p className="dm" style={{ fontSize:12, color:D.textMid }}>{staffUser.role}</p>
                  </div>
                </div>
                <button className="btn-ghost" style={{ width:"100%", padding:"10px" }} onClick={handleLogout}>Sign Out</button>
              </div>
            )}

            <div style={{ marginTop:"auto", paddingTop:40 }}>
              <p className="dm" style={{ fontSize:11, color:D.textDim, lineHeight:1.7 }}>
                LUMIÈRE Booking System<br/>Production v2.0<br />
                <span style={{ color:IS_CONFIGURED?"#4caf50":D.textDim }}>{IS_CONFIGURED ? "● Database connected" : "○ Demo mode"}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ HEADER ══ */}
      <header style={{ position:"sticky", top:0, zIndex:200, background: dark ? "rgba(14,12,10,.92)" : "rgba(250,248,244,.92)", backdropFilter:"blur(16px)", borderBottom:`1px solid ${D.border}`, padding:"0 48px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", transition:"background .4s" }}>
        <button onClick={() => setView("home")} style={{ background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
          <h1 className="pf" style={{ fontSize:22, fontWeight:500, letterSpacing:5, color:D.text, textTransform:"uppercase" }}>Lumière</h1>
        </button>

        <nav style={{ display:"flex", gap:32, alignItems:"center" }}>
          <button className={`nav-link ${view==="home"?"act":""}`} onClick={() => { setView("home"); resetBook(); }}>Home</button>
          <button className={`nav-link ${view==="book"?"act":""}`} onClick={() => { setView("book"); setStep(1); }}>Book Now</button>
          {staffUser && (
            <button className={`nav-link ${view==="admin"?"act":""}`} onClick={() => setView("admin")}>Dashboard</button>
          )}
        </nav>

        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          {!staffUser ? (
            <button className="btn-icon" title="Staff login" onClick={() => setShowLogin(true)} style={{ fontSize:16 }}>🔒</button>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div className="avatar" style={{ width:32, height:32, fontSize:11, background:"rgba(201,169,110,.15)", color:D.gold, cursor:"pointer" }} onClick={() => setView("admin")}>
                {staffUser.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <span className="dm" style={{ fontSize:12, color:D.gold }}>{staffUser.name.split(" ")[0]}</span>
            </div>
          )}
          <button className="btn-icon" title="Settings" onClick={() => setShowSettings(true)} style={{ fontSize:16 }}>⚙️</button>
        </div>
      </header>

      {/* ══ HOME VIEW ══ */}
      {view === "home" && (
        <div>
          {/* ── Carousel Hero ── */}
          <div className="carousel">
            {CAROUSEL_SLIDES.map((s, i) => (
              <div key={i} className={`c-slide ${i === slide ? "active" : ""}`}>
                <img src={s.url} alt={s.label} />
                <div className={`c-overlay ${dark ? "" : "light"}`} />
              </div>
            ))}
            <div className="c-content">
              <p className="dm" style={{ fontSize:11, letterSpacing:4, textTransform:"uppercase", color:D.gold, marginBottom:12 }}>
                {CAROUSEL_SLIDES[slide].sub}
              </p>
              <h2 className="pf" style={{ fontSize:54, fontWeight:500, lineHeight:1.1, color:D.text, marginBottom:24 }}>
                {CAROUSEL_SLIDES[slide].label}
              </h2>
              <button className="btn-primary" onClick={() => setView("book")}>
                Book Appointment
              </button>
            </div>
            <div className="c-dots">
              {CAROUSEL_SLIDES.map((_, i) => (
                <div key={i} className={`c-dot ${i === slide ? "a" : ""}`} onClick={() => setSlide(i)} />
              ))}
            </div>
            {/* Arrow nav */}
            <button onClick={() => setSlide(s => (s - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
              style={{ position:"absolute", left:24, top:"50%", transform:"translateY(-50%)", background:"rgba(201,169,110,.2)", border:"1px solid rgba(201,169,110,.4)", color:D.gold, width:44, height:44, borderRadius:"50%", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <button onClick={() => setSlide(s => (s + 1) % CAROUSEL_SLIDES.length)}
              style={{ position:"absolute", right:24, top:"50%", transform:"translateY(-50%)", background:"rgba(201,169,110,.2)", border:"1px solid rgba(201,169,110,.4)", color:D.gold, width:44, height:44, borderRadius:"50%", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>

          {/* ── Services strip ── */}
          <div style={{ background:D.surface2, borderTop:`1px solid ${D.border}`, borderBottom:`1px solid ${D.border}`, padding:"48px 48px" }}>
            <p className="dm" style={{ fontSize:11, letterSpacing:4, textTransform:"uppercase", color:D.gold, textAlign:"center", marginBottom:8 }}>Our Services</p>
            <h3 className="pf" style={{ fontSize:32, fontWeight:400, textAlign:"center", marginBottom:36, color:D.text }}>Crafted for You</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20, maxWidth:960, margin:"0 auto" }}>
              {SERVICES.map(s => (
                <div key={s.id} className="card" style={{ padding:"28px 20px", textAlign:"center", cursor:"pointer" }} onClick={() => { setSelService(s); setView("book"); setStep(2); }}>
                  <div style={{ fontSize:30, marginBottom:12 }}>{s.icon}</div>
                  <h4 className="pf" style={{ fontSize:18, fontWeight:400, marginBottom:8, color:D.text }}>{s.name}</h4>
                  <p className="dm" style={{ fontSize:12, color:D.textMid, lineHeight:1.6, marginBottom:12 }}>{s.desc}</p>
                  <p className="pf" style={{ fontSize:22, color:D.gold }}>${s.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Team ── */}
          <div style={{ padding:"64px 48px", maxWidth:900, margin:"0 auto" }}>
            <p className="dm" style={{ fontSize:11, letterSpacing:4, textTransform:"uppercase", color:D.gold, textAlign:"center", marginBottom:8 }}>Our Team</p>
            <h3 className="pf" style={{ fontSize:32, fontWeight:400, textAlign:"center", marginBottom:40, color:D.text }}>Meet the Artists</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
              {STAFF.map(s => (
                <div key={s.id} className="card static" style={{ padding:"32px 24px", textAlign:"center" }}>
                  <div className="avatar" style={{ background:"rgba(201,169,110,.12)", color:D.gold, fontSize:18, margin:"0 auto 16px", width:64, height:64, border:`1px solid rgba(201,169,110,.3)` }}>{s.avatar}</div>
                  <h4 className="pf" style={{ fontSize:20, fontWeight:400, color:D.text }}>{s.name}</h4>
                  <p className="dm" style={{ fontSize:12, color:D.textMid, marginTop:4 }}>{s.role}</p>
                  <p className="dm" style={{ fontSize:11, color:D.textDim, marginTop:8 }}>{s.since} experience</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA strip ── */}
          <div style={{ background:`linear-gradient(135deg, ${dark?"#1a1410":"#f5efe4"} 0%, ${dark?"#0e0c0a":"#faf8f4"} 100%)`, borderTop:`1px solid ${D.border}`, padding:"64px 48px", textAlign:"center" }}>
            <p className="pf" style={{ fontSize:36, fontWeight:400, color:D.text, marginBottom:12 }}>Ready for a new look?</p>
            <p className="dm" style={{ fontSize:15, color:D.textMid, marginBottom:28 }}>Book your appointment in under 2 minutes.</p>
            <button className="btn-primary" onClick={() => setView("book")}>Reserve Your Spot</button>
          </div>
        </div>
      )}

      {/* ══ BOOKING VIEW ══ */}
      {view === "book" && !submitted && (
        <div style={{ maxWidth:820, margin:"0 auto", padding:"56px 24px" }}>
          {/* Step tracker */}
          <div className="step-track" style={{ marginBottom:52 }}>
            {[1,2,3,4].map((s,i) => (
              <div key={s} style={{ display:"flex", alignItems:"center" }}>
                <div className="step-dot" style={{ background: step===s?D.gold : step>s?"#6b5a3e":D.border }} />
                {i<3 && <div className="step-line" style={{ background: step>s?"#6b5a3e":D.border }} />}
              </div>
            ))}
          </div>

          {/* Step 1: Service */}
          {step===1 && (
            <div className="fu">
              <p className="dm" style={{ fontSize:11, letterSpacing:3, textTransform:"uppercase", color:D.gold, marginBottom:8 }}>Step 1 of 4</p>
              <h2 className="pf" style={{ fontSize:40, fontWeight:400, marginBottom:6, color:D.text }}>Select a Service</h2>
              <p className="dm" style={{ color:D.textMid, fontSize:14, marginBottom:36 }}>What would you like done today?</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {SERVICES.map(s => (
                  <div key={s.id} className={`card ${selService?.id===s.id?"sel":""}`} style={{ padding:"28px 24px", cursor:"pointer" }} onClick={()=>setSelService(s)}>
                    <div style={{ fontSize:28, marginBottom:12 }}>{s.icon}</div>
                    <h3 className="pf" style={{ fontSize:22, fontWeight:400, color:D.text }}>{s.name}</h3>
                    <p className="dm" style={{ fontSize:12, color:D.textMid, marginTop:8, marginBottom:16, lineHeight:1.6 }}>{s.desc}</p>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span className="dm" style={{ fontSize:12, color:D.textMid }}>{s.duration} min</span>
                      <span className="pf" style={{ fontSize:22, color:D.gold }}>${s.price}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:32 }}>
                <button className="btn-primary" disabled={!selService} onClick={()=>setStep(2)}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 2: Staff */}
          {step===2 && (
            <div className="fu">
              <p className="dm" style={{ fontSize:11, letterSpacing:3, textTransform:"uppercase", color:D.gold, marginBottom:8 }}>Step 2 of 4</p>
              <h2 className="pf" style={{ fontSize:40, fontWeight:400, marginBottom:6, color:D.text }}>Choose Your Stylist</h2>
              <p className="dm" style={{ color:D.textMid, fontSize:14, marginBottom:36 }}>Select who you'd like to work with</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {STAFF.map(s => (
                  <div key={s.id} className={`card ${selStaff?.id===s.id?"sel":""}`} style={{ padding:"32px 24px", cursor:"pointer", textAlign:"center" }} onClick={()=>setSelStaff(s)}>
                    <div className="avatar" style={{ background: selStaff?.id===s.id?"rgba(201,169,110,.25)":"rgba(201,169,110,.08)", color:D.gold, margin:"0 auto 16px", border:`1px solid ${selStaff?.id===s.id?"rgba(201,169,110,.6)":"rgba(201,169,110,.2)"}` }}>{s.avatar}</div>
                    <h3 className="pf" style={{ fontSize:20, fontWeight:400, color:D.text }}>{s.name}</h3>
                    <p className="dm" style={{ fontSize:12, color:D.textMid, marginTop:6 }}>{s.role}</p>
                    <p className="dm" style={{ fontSize:11, color:D.textDim, marginTop:6 }}>{s.since} experience</p>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:32 }}>
                <button className="btn-ghost" onClick={()=>setStep(1)}>← Back</button>
                <button className="btn-primary" disabled={!selStaff} onClick={()=>setStep(3)}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step===3 && (
            <div className="fu">
              <p className="dm" style={{ fontSize:11, letterSpacing:3, textTransform:"uppercase", color:D.gold, marginBottom:8 }}>Step 3 of 4</p>
              <h2 className="pf" style={{ fontSize:40, fontWeight:400, marginBottom:6, color:D.text }}>Pick a Date & Time</h2>
              <p className="dm" style={{ color:D.textMid, fontSize:14, marginBottom:36 }}>Choose when you'd like to come in</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:28 }}>
                {/* Calendar */}
                <div className="card static" style={{ padding:24 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                    <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1)}else setCalMonth(m=>m-1)}} style={{ background:"none",border:`1px solid ${D.border}`,color:D.textMid,cursor:"pointer",fontSize:16,width:32,height:32,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s" }} className="btn-icon">‹</button>
                    <p className="pf" style={{ fontSize:17, fontWeight:400, color:D.text }}>{MONTHS[calMonth]} {calYear}</p>
                    <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1)}else setCalMonth(m=>m+1)}} style={{ background:"none",border:`1px solid ${D.border}`,color:D.textMid,cursor:"pointer",fontSize:16,width:32,height:32,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s" }} className="btn-icon">›</button>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:8 }}>
                    {DAYS.map(d=><p key={d} className="dm" style={{ textAlign:"center",fontSize:10,color:D.textDim,letterSpacing:1,padding:"4px 0" }}>{d}</p>)}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                    {days.map((day,i)=>{
                      const isPast=day&&new Date(calYear,calMonth,day)<new Date(today.getFullYear(),today.getMonth(),today.getDate());
                      const isToday=day===today.getDate()&&calMonth===today.getMonth()&&calYear===today.getFullYear();
                      return(
                        <div key={i} className={`cd ${!day?"emp":""} ${isPast?"past":""} ${isToday?"tod":""} ${selDate===day?"selday":""}`}
                          onClick={()=>{if(!isPast&&day){setSelDate(day);setSelTime(null)}}}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Times */}
                <div>
                  <p className="lbl" style={{ marginBottom:14 }}>
                    {selDate ? `${MONTHS[calMonth].slice(0,3)} ${selDate} — Available Times` : "Select a date first"}
                  </p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, maxHeight:300, overflowY:"auto" }} className="sh">
                    {selDate ? TIME_SLOTS.map(t=>(
                      <div key={t} className={`ts ${takenSlots.includes(t)?"bk":""} ${selTime===t?"act":""}`}
                        onClick={()=>!takenSlots.includes(t)&&setSelTime(t)}>
                        {t}
                      </div>
                    )) : (
                      <p className="dm" style={{ fontSize:13, color:D.textDim, gridColumn:"span 2", paddingTop:8 }}>← Pick a date</p>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:32 }}>
                <button className="btn-ghost" onClick={()=>setStep(2)}>← Back</button>
                <button className="btn-primary" disabled={!selDate||!selTime} onClick={()=>setStep(4)}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {step===4 && (
            <div className="fu">
              <p className="dm" style={{ fontSize:11, letterSpacing:3, textTransform:"uppercase", color:D.gold, marginBottom:8 }}>Step 4 of 4</p>
              <h2 className="pf" style={{ fontSize:40, fontWeight:400, marginBottom:6, color:D.text }}>Your Details</h2>
              <p className="dm" style={{ color:D.textMid, fontSize:14, marginBottom:36 }}>Almost there — just a few things</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:40 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                  {[{key:"name",label:"Full Name",ph:"Your full name",type:"text"},{key:"email",label:"Email Address",ph:"you@example.com",type:"email"},{key:"phone",label:"Phone Number",ph:"(555) 000-0000",type:"tel"}].map(f=>(
                    <div key={f.key}>
                      <label className="lbl">{f.label}</label>
                      <input className="inp" type={f.type} placeholder={f.ph} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}/>
                    </div>
                  ))}
                  <div>
                    <label className="lbl">Notes (optional)</label>
                    <textarea className="inp" placeholder="Any special requests or allergies..." rows={3} style={{ resize:"none" }} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
                  </div>
                  {dbError && <p className="dm" style={{ fontSize:12, color:D.danger }}>{dbError}</p>}
                </div>
                {/* Summary */}
                <div className="card static" style={{ padding:28, height:"fit-content" }}>
                  <p className="lbl" style={{ marginBottom:20 }}>Booking Summary</p>
                  {[{l:"Service",v:selService?.name},{l:"Duration",v:`${selService?.duration} min`},{l:"Stylist",v:selStaff?.name},{l:"Date",v:dateStr},{l:"Time",v:selTime}].map(item=>(
                    <div key={item.l} style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                      <p className="dm" style={{ fontSize:12, color:D.textMid }}>{item.l}</p>
                      <p className="dm" style={{ fontSize:13, color:D.text, textAlign:"right", maxWidth:160 }}>{item.v}</p>
                    </div>
                  ))}
                  <hr className="dv" style={{ margin:"16px 0" }}/>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <p className="dm" style={{ fontSize:11, color:D.textMid, letterSpacing:1 }}>TOTAL DUE</p>
                    <p className="pf" style={{ fontSize:28, color:D.gold }}>${selService?.price}</p>
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:32 }}>
                <button className="btn-ghost" onClick={()=>setStep(3)}>← Back</button>
                <button className="btn-primary" disabled={!form.name||!form.email||!form.phone||saving} onClick={handleBook}>
                  {saving ? <span style={{ display:"flex",alignItems:"center",gap:10 }}><span className="spin"/>Saving...</span> : "Confirm Booking ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ CONFIRMATION ══ */}
      {view==="book" && submitted && (
        <div style={{ maxWidth:580, margin:"0 auto", padding:"80px 24px", textAlign:"center", position:"relative" }} className="fu">
          {[...Array(16)].map((_,i)=>(
            <div key={i} className="confetti" style={{ left:`${5+Math.random()*90}%`, top:`${Math.random()*15}%`, background:["#c9a96e","#f0ece4","#6b5a3e","#e8c88a"][i%4], animationDelay:`${Math.random()*.6}s`, animationDuration:`${2.5+Math.random()*2}s` }}/>
          ))}
          <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(201,169,110,.12)", border:"1px solid rgba(201,169,110,.4)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", fontSize:28 }}>✦</div>
          <h2 className="pf" style={{ fontSize:44, fontWeight:400, color:D.gold, marginBottom:8 }}>You're Booked</h2>
          <p className="dm" style={{ color:D.textMid, fontSize:14, marginBottom:36 }}>A confirmation has been sent to {form.email}</p>
          <div className="card static" style={{ padding:32, textAlign:"left" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
              {[{l:"Service",v:selService?.name},{l:"Stylist",v:selStaff?.name},{l:"Date",v:dateStr},{l:"Time",v:selTime}].map(item=>(
                <div key={item.l}>
                  <p className="lbl">{item.l}</p>
                  <p className="pf" style={{ fontSize:19, marginTop:4, fontWeight:400, color:D.text }}>{item.v}</p>
                </div>
              ))}
            </div>
            <hr className="dv" style={{ margin:"20px 0" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p className="dm" style={{ fontSize:11, color:D.textMid, letterSpacing:1 }}>TOTAL DUE AT APPOINTMENT</p>
              <p className="pf" style={{ fontSize:28, color:D.gold }}>${selService?.price}</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:28 }}>
            <button className="btn-primary" onClick={resetBook}>Book Again</button>
            <button className="btn-ghost" onClick={()=>setView("home")}>Back to Home</button>
          </div>
        </div>
      )}

      {/* ══ ADMIN DASHBOARD ══ */}
      {view==="admin" && staffUser && (
        <div style={{ maxWidth:1000, margin:"0 auto", padding:"52px 32px" }} className="fu">
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:40 }}>
            <div>
              <p className="dm" style={{ fontSize:11, letterSpacing:3, textTransform:"uppercase", color:D.gold, marginBottom:6 }}>Staff Dashboard</p>
              <h2 className="pf" style={{ fontSize:38, fontWeight:400, color:D.text }}>Appointments</h2>
              <p className="dm" style={{ color:D.textMid, fontSize:13, marginTop:4 }}>
                Logged in as <strong style={{ color:D.text }}>{staffUser.name}</strong> · {staffUser.role}
                {!IS_CONFIGURED && <span style={{ color:D.gold }}> · Demo mode</span>}
              </p>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              {loading && <div className="spin"/>}
              <button className="btn-ghost" style={{ padding:"9px 20px", fontSize:12 }} onClick={fetchBookings}>↻ Refresh</button>
              <button className="btn-primary" style={{ padding:"9px 20px", fontSize:12 }} onClick={()=>setView("book")}>+ New Booking</button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:36 }}>
            {[
              { l:"Total Bookings",  v: bookings.length },
              { l:"Unique Clients",  v: new Set(bookings.map(b=>b.email)).size },
              { l:"Today's Bookings",v: bookings.filter(b=>b.date===`${MONTHS[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`).length },
              { l:"Revenue",         v: `$${revenue}` },
            ].map(s=>(
              <div key={s.l} className="card static" style={{ padding:"20px 22px" }}>
                <p className="dm" style={{ fontSize:10, letterSpacing:2, textTransform:"uppercase", color:D.textMid }}>{s.l}</p>
                <p className="pf" style={{ fontSize:36, fontWeight:400, color:D.gold, lineHeight:1.1, marginTop:8 }}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card static" style={{ overflow:"hidden" }}>
            <div style={{ padding:"14px 24px", borderBottom:`1px solid ${D.border}`, display:"grid", gridTemplateColumns:"2fr 1.5fr 1.2fr 1.1fr 1fr 44px", gap:12 }}>
              {["Client","Service","Stylist","Date","Time",""].map((h,i)=>(
                <p key={i} className="dm" style={{ fontSize:10, letterSpacing:2, textTransform:"uppercase", color:D.textDim }}>{h}</p>
              ))}
            </div>
            <div style={{ padding:"0 24px" }}>
              {bookings.length===0 && (
                <p className="dm" style={{ padding:"40px 0", color:D.textDim, fontSize:13 }}>
                  {loading ? "Loading..." : "No appointments yet. Bookings will appear here."}
                </p>
              )}
              {bookings.map(b=>(
                <div key={b.id} className="brow" style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1.2fr 1.1fr 1fr 44px", gap:12, alignItems:"center" }}>
                  <div>
                    <p className="dm" style={{ fontSize:14, color:D.text, fontWeight:500 }}>{b.name}</p>
                    <p className="dm" style={{ fontSize:11, color:D.textDim, marginTop:2 }}>{b.email}</p>
                  </div>
                  <span className="tag-svc">{b.service}</span>
                  <p className="dm" style={{ fontSize:13, color:D.textMid }}>{b.staff}</p>
                  <p className="dm" style={{ fontSize:13, color:D.textMid }}>{b.date}</p>
                  <p className="dm" style={{ fontSize:13, color:D.gold }}>{b.time}</p>
                  {(staffUser.isAdmin) && (
                    <button className="btn-icon" style={{ color:D.textDim, fontSize:15 }} title="Cancel booking" onClick={()=>handleDelete(b.id)} disabled={deleting===b.id}>
                      {deleting===b.id ? <span className="spin" style={{ width:14, height:14 }}/> : "✕"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Redirect non-staff from admin */}
      {view==="admin" && !staffUser && (
        <div style={{ textAlign:"center", padding:"120px 24px" }} className="fu">
          <div style={{ fontSize:48, marginBottom:20 }}>🔒</div>
          <h2 className="pf" style={{ fontSize:32, fontWeight:400, color:D.text, marginBottom:12 }}>Staff Access Only</h2>
          <p className="dm" style={{ color:D.textMid, fontSize:14, marginBottom:28 }}>Please sign in with your staff credentials to view the dashboard.</p>
          <button className="btn-primary" onClick={()=>setShowLogin(true)}>Staff Sign In</button>
        </div>
      )}

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop:`1px solid ${D.border}`, padding:"32px 48px", display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:64 }}>
        <div>
          <h1 className="pf" style={{ fontSize:18, fontWeight:400, letterSpacing:4, color:D.text }}>LUMIÈRE</h1>
          <p className="dm" style={{ fontSize:11, color:D.textDim, marginTop:4 }}>Hair & Beauty Studio</p>
        </div>
        <p className="dm" style={{ fontSize:12, color:D.textDim }}>© {today.getFullYear()} Lumière. All rights reserved.</p>
        <div style={{ display:"flex", gap:24 }}>
          <button className="nav-link" onClick={()=>setView("book")}>Book Now</button>
          <button className="nav-link" onClick={()=>setShowLogin(true)} style={{ color:D.textDim }}>Staff Login</button>
        </div>
      </footer>
    </div>
  );
}

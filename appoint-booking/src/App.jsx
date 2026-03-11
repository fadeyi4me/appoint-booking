import { useState, useEffect, useCallback, useRef } from "react";

// ─── Supabase config ───────────────────────────────────────────────────────
const SUPABASE_URL      = "https://tftewlamxkzzajbulsvd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdGV3bGFteGt6emFqYnVsc3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjIyODAsImV4cCI6MjA4ODc5ODI4MH0.hNiA_t5GMYDfqjtITPWoq9cB_lQxag5yYu1fpEleEO4";
const IS_CONFIGURED     = SUPABASE_URL !== "https://tftewlamxkzzajbulsvd.supabase.co";

const sb = {
  async select(table, qs = "") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}&order=created_at.desc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async insert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async delete(table, id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!r.ok) throw new Error(await r.text());
  },
};

// ─── Staff credentials (in production: move to Supabase auth) ─────────────
const STAFF_CREDENTIALS = [
  { id: 1, username: "jordan",  password: "stylist123", name: "Jordan Lee",   role: "Senior Stylist",   avatar: "JL" },
  { id: 2, username: "maya",    password: "color456",   name: "Maya Chen",    role: "Color Specialist", avatar: "MC" },
  { id: 3, username: "alex",    password: "director789", name: "Alex Rivera", role: "Style Director",   avatar: "AR" },
  { id: 0, username: "admin",   password: "lumiere2024", name: "Admin",       role: "Administrator",    avatar: "AD" },
];

// ─── Data ──────────────────────────────────────────────────────────────────
const SERVICES = [
  { id: 1, name: "Haircut & Style",     duration: 60,  price: 65,  icon: "✂",  tagline: "Precision cuts tailored to you" },
  { id: 2, name: "Color Treatment",     duration: 120, price: 120, icon: "◈",  tagline: "Vivid, lasting colour artistry" },
  { id: 3, name: "Deep Conditioning",   duration: 45,  price: 45,  icon: "◉",  tagline: "Restore & strengthen your hair" },
  { id: 4, name: "Blowout",             duration: 30,  price: 35,  icon: "◎",  tagline: "Smooth, voluminous finish" },
];

const STAFF = [
  { id: 1, name: "Jordan Lee",   role: "Senior Stylist",   avatar: "JL", specialty: "Precision Cuts" },
  { id: 2, name: "Maya Chen",    role: "Color Specialist", avatar: "MC", specialty: "Balayage & Colour" },
  { id: 3, name: "Alex Rivera",  role: "Style Director",   avatar: "AR", specialty: "Avant-garde Styles" },
];

const TIME_SLOTS = [
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM",
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Carousel slides (CSS art — no images needed) ─────────────────────────
const SLIDES = [
  {
    title: "Haircut & Style",
    sub: "Precision crafted for you",
    price: "from $65",
    bg: "linear-gradient(135deg, #1a0a00 0%, #3d1f00 40%, #c9a96e 100%)",
    accent: "#c9a96e",
    shape: `<circle cx="320" cy="180" r="140" fill="none" stroke="#c9a96e" stroke-width="0.5" opacity="0.4"/>
            <circle cx="320" cy="180" r="100" fill="none" stroke="#c9a96e" stroke-width="0.3" opacity="0.3"/>
            <line x1="180" y1="40" x2="460" y2="320" stroke="#c9a96e" stroke-width="0.4" opacity="0.25"/>
            <line x1="460" y1="40" x2="180" y2="320" stroke="#c9a96e" stroke-width="0.4" opacity="0.25"/>
            <text x="320" y="195" text-anchor="middle" font-size="88" fill="#c9a96e" opacity="0.12" font-family="Georgia">✂</text>`,
  },
  {
    title: "Colour Treatment",
    sub: "Vivid. Lasting. Luminous.",
    price: "from $120",
    bg: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 45%, #8b5cf6 100%)",
    accent: "#a78bfa",
    shape: `<ellipse cx="320" cy="180" rx="160" ry="100" fill="none" stroke="#a78bfa" stroke-width="0.5" opacity="0.4"/>
            <ellipse cx="320" cy="180" rx="120" ry="70" fill="none" stroke="#a78bfa" stroke-width="0.3" opacity="0.3"/>
            <circle cx="200" cy="100" r="40" fill="#a78bfa" opacity="0.06"/>
            <circle cx="440" cy="260" r="60" fill="#7c3aed" opacity="0.08"/>
            <text x="320" y="200" text-anchor="middle" font-size="80" fill="#a78bfa" opacity="0.10" font-family="Georgia">◈</text>`,
  },
  {
    title: "Deep Conditioning",
    sub: "Restore. Strengthen. Glow.",
    price: "from $45",
    bg: "linear-gradient(135deg, #001a0d 0%, #003320 45%, #10b981 100%)",
    accent: "#6ee7b7",
    shape: `<path d="M 160 180 Q 240 80 320 180 Q 400 280 480 180" fill="none" stroke="#6ee7b7" stroke-width="0.8" opacity="0.35"/>
            <path d="M 160 200 Q 240 100 320 200 Q 400 300 480 200" fill="none" stroke="#6ee7b7" stroke-width="0.5" opacity="0.2"/>
            <circle cx="320" cy="180" r="80" fill="none" stroke="#6ee7b7" stroke-width="0.3" opacity="0.3"/>
            <text x="320" y="195" text-anchor="middle" font-size="72" fill="#6ee7b7" opacity="0.10" font-family="Georgia">◉</text>`,
  },
  {
    title: "Blowout",
    sub: "Smooth. Voluminous. Bold.",
    price: "from $35",
    bg: "linear-gradient(135deg, #1a0505 0%, #3d0a0a 45%, #ef4444 100%)",
    accent: "#fca5a5",
    shape: `<rect x="160" y="80" width="320" height="200" rx="100" fill="none" stroke="#fca5a5" stroke-width="0.5" opacity="0.35"/>
            <rect x="190" y="110" width="260" height="140" rx="70" fill="none" stroke="#fca5a5" stroke-width="0.3" opacity="0.25"/>
            <circle cx="320" cy="180" r="50" fill="#ef4444" opacity="0.06"/>
            <text x="320" y="195" text-anchor="middle" font-size="68" fill="#fca5a5" opacity="0.10" font-family="Georgia">◎</text>`,
  },
];

function getDaysInMonth(year, month) {
  const d = [];
  const firstDay  = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) d.push(null);
  for (let i = 1; i <= totalDays; i++) d.push(i);
  return d;
}

// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const today = new Date();

  // Theme
  const [dark, setDark] = useState(true);

  // Nav
  const [view, setView]         = useState("home"); // home | book | admin
  const [bookStep, setBookStep] = useState(1);

  // Auth
  const [showLogin, setShowLogin]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loggedIn, setLoggedIn]       = useState(null); // staff object or null
  const [loginForm, setLoginForm]     = useState({ u: "", p: "", err: "" });

  // Booking state
  const [selService, setSelService] = useState(null);
  const [selStaff, setSelStaff]     = useState(null);
  const [calMonth, setCalMonth]     = useState(today.getMonth());
  const [calYear, setCalYear]       = useState(today.getFullYear());
  const [selDate, setSelDate]       = useState(null);
  const [selTime, setSelTime]       = useState(null);
  const [clientForm, setClientForm] = useState({ name:"", email:"", phone:"", notes:"" });
  const [submitted, setSubmitted]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [bookErr, setBookErr]       = useState("");

  // DB
  const [bookings, setBookings]     = useState([]);
  const [takenMap, setTakenMap]     = useState({});
  const [dbLoading, setDbLoading]   = useState(false);
  const [deleting, setDeleting]     = useState(null);

  // Carousel
  const [slide, setSlide]           = useState(0);
  const slideRef                    = useRef(null);

  // ── Theme vars ──────────────────────────────────────────────────────────
  const T = dark ? {
    bg:"#0a0a0a", surface:"#131313", card:"#181818", border:"#252525",
    text:"#f0ece4", muted:"#6b6b6b", accent:"#c9a96e", accentText:"#0a0a0a",
    inputBg:"#0d0d0d", overlay:"rgba(0,0,0,0.85)", glass:"rgba(20,18,14,0.92)",
    shadow:"0 32px 80px rgba(0,0,0,0.6)", subtext:"#999",
  } : {
    bg:"#faf8f4", surface:"#ffffff", card:"#f5f0e8", border:"#e2d9c8",
    text:"#1a1a1a", muted:"#888", accent:"#a07840", accentText:"#ffffff",
    inputBg:"#ffffff", overlay:"rgba(250,248,244,0.88)", glass:"rgba(255,253,248,0.95)",
    shadow:"0 32px 80px rgba(0,0,0,0.12)", subtext:"#666",
  };

  // ── Carousel auto-advance ───────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // ── Fetch bookings ──────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    if (!IS_CONFIGURED) return;
    setDbLoading(true);
    try {
      const data = await sb.select("bookings");
      setBookings(data);
      const map = {};
      data.forEach(b => {
        const k = `${b.staff_id}__${b.date}`;
        if (!map[k]) map[k] = [];
        map[k].push(b.time);
      });
      setTakenMap(map);
    } catch (e) { console.error(e); }
    finally { setDbLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Fetch slots when staff+date changes ────────────────────────────────
  const dateStr = selDate ? `${MONTHS[calMonth]} ${selDate}, ${calYear}` : null;
  useEffect(() => {
    if (!IS_CONFIGURED || !selDate || !selStaff) return;
    sb.select("bookings", `staff_id=eq.${selStaff.id}&date=eq.${encodeURIComponent(dateStr)}&select=time`)
      .then(data => {
        const k = `${selStaff.id}__${dateStr}`;
        setTakenMap(prev => ({ ...prev, [k]: data.map(d => d.time) }));
      }).catch(() => {});
  }, [selDate, selStaff, dateStr]);

  const takenSlots = (selStaff && dateStr) ? (takenMap[`${selStaff.id}__${dateStr}`] || []) : [];

  // ── Login ───────────────────────────────────────────────────────────────
  function doLogin() {
    const match = STAFF_CREDENTIALS.find(
      s => s.username === loginForm.u.trim().toLowerCase() && s.password === loginForm.p
    );
    if (match) {
      setLoggedIn(match);
      setShowLogin(false);
      setLoginForm({ u:"", p:"", err:"" });
      setView("admin");
      fetchBookings();
    } else {
      setLoginForm(f => ({ ...f, err: "Invalid credentials. Please try again." }));
    }
  }

  function doLogout() {
    setLoggedIn(null);
    setView("home");
  }

  // ── Book ────────────────────────────────────────────────────────────────
  async function confirmBooking() {
    setSaving(true); setBookErr("");
    const record = {
      name: clientForm.name, email: clientForm.email,
      phone: clientForm.phone, notes: clientForm.notes,
      service: selService.name, staff: selStaff.name,
      staff_id: selStaff.id, date: dateStr, time: selTime,
    };
    try {
      if (IS_CONFIGURED) {
        const [saved] = await sb.insert("bookings", record);
        setBookings(p => [saved, ...p]);
        const k = `${selStaff.id}__${dateStr}`;
        setTakenMap(p => ({ ...p, [k]: [...(p[k] || []), selTime] }));
      } else {
        setBookings(p => [{ id: Date.now(), ...record, created_at: new Date().toISOString() }, ...p]);
      }
      setSubmitted(true);
    } catch (e) { setBookErr("Booking failed: " + e.message); }
    finally { setSaving(false); }
  }

  async function deleteBooking(id) {
    setDeleting(id);
    try {
      if (IS_CONFIGURED) await sb.delete("bookings", id);
      setBookings(p => p.filter(b => b.id !== id));
    } catch (e) { console.error(e); }
    finally { setDeleting(null); }
  }

  function resetBook() {
    setBookStep(1); setSelService(null); setSelStaff(null);
    setSelDate(null); setSelTime(null);
    setClientForm({ name:"", email:"", phone:"", notes:"" });
    setSubmitted(false); setBookErr("");
  }

  const revenue = bookings.reduce((a, b) => {
    const s = SERVICES.find(s => s.name === b.service);
    return a + (s ? s.price : 0);
  }, 0);

  const days = getDaysInMonth(calYear, calMonth);

  // ═══════════════════════════════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════════════════════════════
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: ${T.bg}; color: ${T.text}; font-family: 'Outfit', sans-serif; transition: background .4s, color .4s; }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${T.bg}; }
    ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }

    .serif { font-family: 'Cormorant Garamond', Georgia, serif; }

    /* ── Carousel ── */
    .carousel { position: relative; width: 100%; height: 420px; overflow: hidden; }
    .carousel-slide {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 80px;
      opacity: 0; transition: opacity .9s ease, transform .9s ease;
      transform: translateX(30px);
    }
    .carousel-slide.active { opacity: 1; transform: translateX(0); }
    .carousel-slide.exit   { opacity: 0; transform: translateX(-30px); }
    .carousel-text { position: relative; z-index: 2; }
    .carousel-art  { position: absolute; right: 60px; top: 50%; transform: translateY(-50%); opacity: .9; }
    .carousel-dots { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
    .cdot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.3); cursor: pointer; transition: all .3s; border: none; }
    .cdot.active { width: 24px; border-radius: 3px; background: white; }

    /* ── Cards ── */
    .card {
      background: ${T.card};
      border: 1px solid ${T.border};
      border-radius: 4px;
      transition: border-color .25s, transform .2s, box-shadow .25s;
      cursor: pointer;
    }
    .card:hover { border-color: ${T.accent}; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,.15); }
    .card.sel { border-color: ${T.accent}; background: ${dark ? "#1a180f" : "#fdf6e8"}; }

    /* ── Buttons ── */
    .btn-primary {
      background: ${T.accent}; color: ${T.accentText};
      border: none; padding: 14px 36px;
      font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 12px;
      letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
      border-radius: 2px; transition: all .2s; white-space: nowrap;
    }
    .btn-primary:hover { filter: brightness(1.12); transform: translateY(-1px); }
    .btn-primary:disabled { background: ${T.border}; color: ${T.muted}; cursor: not-allowed; transform: none; filter: none; }
    .btn-ghost {
      background: transparent; color: ${T.accent};
      border: 1px solid ${T.accent}; padding: 13px 36px;
      font-family: 'Outfit', sans-serif; font-weight: 500; font-size: 12px;
      letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
      border-radius: 2px; transition: all .2s;
    }
    .btn-ghost:hover { background: ${dark ? "rgba(201,169,110,.1)" : "rgba(160,120,64,.08)"}; }
    .btn-icon {
      background: ${T.surface}; border: 1px solid ${T.border};
      color: ${T.text}; width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all .2s; font-size: 16px;
    }
    .btn-icon:hover { border-color: ${T.accent}; color: ${T.accent}; }

    /* ── Input ── */
    .inp {
      background: ${T.inputBg}; border: 1px solid ${T.border};
      color: ${T.text}; padding: 13px 16px; width: 100%; outline: none;
      font-family: 'Outfit', sans-serif; font-size: 14px; border-radius: 2px;
      transition: border-color .2s;
    }
    .inp:focus { border-color: ${T.accent}; }
    .inp::placeholder { color: ${T.muted}; }
    textarea.inp { resize: none; }

    /* ── Time slots ── */
    .slot {
      background: ${T.card}; border: 1px solid ${T.border};
      color: ${T.subtext}; padding: 9px; font-size: 12px;
      font-family: 'Outfit', sans-serif; letter-spacing: .5px;
      cursor: pointer; text-align: center; border-radius: 2px; transition: all .2s;
    }
    .slot:hover:not(.taken) { border-color: ${T.accent}; color: ${T.text}; }
    .slot.chosen { background: ${T.accent}; color: ${T.accentText}; border-color: ${T.accent}; font-weight: 600; }
    .slot.taken { opacity: .28; cursor: not-allowed; text-decoration: line-through; }

    /* ── Calendar ── */
    .cday {
      aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
      font-size: 13px; cursor: pointer; border-radius: 50%;
      transition: all .15s; color: ${T.muted}; font-family: 'Outfit', sans-serif;
    }
    .cday:hover:not(.past):not(.emp) { background: ${T.border}; color: ${T.text}; }
    .cday.chosen { background: ${T.accent} !important; color: ${T.accentText} !important; font-weight: 600; }
    .cday.past { opacity: .22; cursor: default; }
    .cday.tod { color: ${T.accent}; font-weight: 600; }
    .cday.emp { cursor: default; }

    /* ── Modal overlay ── */
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 100;
      background: ${T.overlay};
      backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .25s ease;
    }
    .modal-box {
      background: ${T.glass};
      border: 1px solid ${T.border};
      border-radius: 8px;
      padding: 48px;
      width: 420px; max-width: 90vw;
      box-shadow: ${T.shadow};
      animation: slideUp .3s ease;
    }

    /* ── Progress dots ── */
    .prog { display: flex; align-items: center; justify-content: center; gap: 0; }
    .pdot { width: 8px; height: 8px; border-radius: 50%; transition: all .3s; }
    .pline { width: 40px; height: 1px; }

    /* ── Tags ── */
    .tag {
      display: inline-block; padding: 3px 12px;
      font-family: 'Outfit', sans-serif; font-size: 10px;
      letter-spacing: 1.5px; text-transform: uppercase; border-radius: 2px;
    }

    /* ── Animations ── */
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    @keyframes slideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
    @keyframes spin { to { transform:rotate(360deg) } }
    @keyframes confettiFall {
      0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
    }
    .fade-up { animation: fadeUp .4s ease forwards; }
    .spinner { width:18px; height:18px; border:2px solid ${T.border}; border-top-color:${T.accent}; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
    .cf { position:absolute; width:6px; height:6px; border-radius:50%; animation:confettiFall 3s ease-in forwards; pointer-events:none; }

    /* ── Nav link ── */
    .navlink {
      font-family:'Outfit',sans-serif; font-size:11px; letter-spacing:2px;
      text-transform:uppercase; cursor:pointer; transition:color .2s;
      background:none; border:none; color:${T.muted}; padding:4px 0;
    }
    .navlink:hover { color:${T.text}; }

    /* ── Toggle switch ── */
    .toggle { position:relative; width:44px; height:24px; cursor:pointer; }
    .toggle input { opacity:0; width:0; height:0; }
    .toggle-track {
      position:absolute; inset:0; border-radius:12px;
      background:${dark ? T.accent : T.border}; transition:background .3s;
    }
    .toggle-thumb {
      position:absolute; top:3px; left:3px; width:18px; height:18px;
      border-radius:50%; background:white;
      transition:transform .3s; transform:${dark ? "translateX(20px)" : "translateX(0)"};
    }

    /* ── Admin table ── */
    .admin-row { border-bottom:1px solid ${T.border}; padding:14px 0; transition:background .15s; }
    .admin-row:hover { background:${dark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)"}; }

    /* ── Stat card ── */
    .stat-card {
      background:${T.card}; border:1px solid ${T.border}; border-radius:4px; padding:24px 28px;
    }

    /* ── Scrollbar hide ── */
    .sh::-webkit-scrollbar { display:none; }

    /* ── Divider ── */
    .divider { border:none; border-top:1px solid ${T.border}; }

    /* ── Section label ── */
    .section-label {
      font-family:'Outfit',sans-serif; font-size:10px; letter-spacing:3px;
      text-transform:uppercase; color:${T.muted};
    }

    /* ── Avatar ── */
    .avatar {
      border-radius:50%; display:flex; align-items:center; justify-content:center;
      font-family:'Outfit',sans-serif; font-weight:600; letter-spacing:1px;
      transition:all .25s;
    }
  `;

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, transition:"background .4s, color .4s" }}>
      <style>{css}</style>

      {/* ════════════════ HEADER ════════════════ */}
      <header style={{
        position:"sticky", top:0, zIndex:50,
        background: dark ? "rgba(10,10,10,.92)" : "rgba(250,248,244,.92)",
        backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${T.border}`,
        padding:"0 48px", height:68,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        transition:"background .4s",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"baseline", gap:12 }}>
          <h1 className="serif" style={{ fontSize:26, fontWeight:300, letterSpacing:5, color:T.text }}>LUMIÈRE</h1>
          <span style={{ fontSize:9, letterSpacing:3, color:T.muted, textTransform:"uppercase" }}>Hair Studio</span>
        </div>

        {/* Nav */}
        <nav style={{ display:"flex", alignItems:"center", gap:32 }}>
          <button className="navlink" style={{ color: view==="home" ? T.text : T.muted }} onClick={() => setView("home")}>Home</button>
          <button className="navlink" style={{ color: view==="book" ? T.text : T.muted }} onClick={() => { setView("book"); resetBook(); }}>Book Now</button>
          {loggedIn ? (
            <button className="navlink" style={{ color: view==="admin" ? T.text : T.muted }} onClick={() => setView("admin")}>Admin</button>
          ) : null}
        </nav>

        {/* Right actions */}
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {/* Settings */}
          <button className="btn-icon" title="Settings" onClick={() => setShowSettings(true)}>
            <span style={{ fontSize:15 }}>⚙</span>
          </button>

          {/* Staff login / avatar */}
          {loggedIn ? (
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div className="avatar" style={{ width:34, height:34, background:T.accent, color:T.accentText, fontSize:11 }}>
                {loggedIn.avatar}
              </div>
              <button className="navlink" onClick={doLogout} style={{ color:T.muted, fontSize:10 }}>Sign out</button>
            </div>
          ) : (
            <button
              className="btn-icon"
              title="Staff login"
              onClick={() => setShowLogin(true)}
              style={{ width:"auto", padding:"0 16px", borderRadius:2, fontSize:11, letterSpacing:1.5, fontFamily:"'Outfit',sans-serif", textTransform:"uppercase" }}>
              Staff
            </button>
          )}

          {/* Book CTA */}
          <button className="btn-primary" style={{ padding:"10px 24px" }} onClick={() => { setView("book"); resetBook(); }}>
            Book Now
          </button>
        </div>
      </header>

      {/* ════════════════ SETTINGS MODAL ════════════════ */}
      {showSettings && (
        <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width:360 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
              <h2 className="serif" style={{ fontSize:28, fontWeight:300 }}>Settings</h2>
              <button className="btn-icon" onClick={() => setShowSettings(false)} style={{ fontSize:18 }}>×</button>
            </div>

            {/* Theme toggle */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 0", borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}` }}>
              <div>
                <p style={{ fontSize:14, fontWeight:500, color:T.text }}>Appearance</p>
                <p style={{ fontSize:12, color:T.muted, marginTop:3 }}>{dark ? "Dark mode active" : "Light mode active"}</p>
              </div>
              <label className="toggle" onClick={() => setDark(d => !d)}>
                <div className="toggle-track">
                  <div className="toggle-thumb" />
                </div>
              </label>
            </div>

            <div style={{ marginTop:24, padding:"16px 20px", background: dark ? "#111" : "#f5f0e8", borderRadius:4 }}>
              <p style={{ fontSize:11, color:T.muted, letterSpacing:.5, lineHeight:1.7 }}>
                {dark ? "🌙 Dark mode — easy on the eyes, perfect for evenings." : "☀️ Light mode — clean and bright for daytime use."}
              </p>
            </div>

            <button className="btn-primary" style={{ width:"100%", marginTop:28 }} onClick={() => setShowSettings(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ STAFF LOGIN MODAL ════════════════ */}
      {showLogin && (
        <div className="modal-backdrop" onClick={() => { setShowLogin(false); setLoginForm({ u:"", p:"", err:"" }); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            {/* Decorative accent line */}
            <div style={{ position:"absolute", top:0, left:48, right:48, height:2, background:`linear-gradient(90deg, transparent, ${T.accent}, transparent)`, borderRadius:1 }} />

            <div style={{ textAlign:"center", marginBottom:36 }}>
              <div className="avatar" style={{ width:56, height:56, background:T.accent, color:T.accentText, fontSize:18, margin:"0 auto 16px" }}>✦</div>
              <h2 className="serif" style={{ fontSize:32, fontWeight:300, letterSpacing:2 }}>Staff Portal</h2>
              <p style={{ fontSize:12, color:T.muted, marginTop:6, letterSpacing:.5 }}>Sign in to access appointments & admin</p>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <p className="section-label" style={{ marginBottom:8 }}>Username</p>
                <input
                  className="inp"
                  placeholder="Enter username"
                  value={loginForm.u}
                  onChange={e => setLoginForm(f => ({ ...f, u:e.target.value, err:"" }))}
                  onKeyDown={e => e.key === "Enter" && doLogin()}
                  autoFocus
                />
              </div>
              <div>
                <p className="section-label" style={{ marginBottom:8 }}>Password</p>
                <input
                  className="inp"
                  type="password"
                  placeholder="Enter password"
                  value={loginForm.p}
                  onChange={e => setLoginForm(f => ({ ...f, p:e.target.value, err:"" }))}
                  onKeyDown={e => e.key === "Enter" && doLogin()}
                />
              </div>
              {loginForm.err && (
                <p style={{ fontSize:12, color:"#e74c3c", textAlign:"center" }}>{loginForm.err}</p>
              )}
            </div>

            <button className="btn-primary" style={{ width:"100%", marginTop:28 }} onClick={doLogin}>
              Sign In
            </button>

            <p style={{ textAlign:"center", fontSize:11, color:T.muted, marginTop:20 }}>
              Demo — try <span style={{ color:T.accent }}>admin / lumiere2024</span>
            </p>

            <button className="navlink" style={{ display:"block", margin:"14px auto 0", color:T.muted }} onClick={() => { setShowLogin(false); setLoginForm({ u:"", p:"", err:"" }); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ HOME ════════════════ */}
      {view === "home" && (
        <>
          {/* ── Hero Carousel ── */}
          <div className="carousel">
            {SLIDES.map((sl, i) => (
              <div
                key={i}
                className={`carousel-slide ${i === slide ? "active" : ""}`}
                style={{ background: sl.bg }}
              >
                {/* Text */}
                <div className="carousel-text" style={{ maxWidth:520 }}>
                  <p style={{ fontSize:10, letterSpacing:4, textTransform:"uppercase", color: sl.accent, marginBottom:16, fontFamily:"'Outfit',sans-serif" }}>
                    Featured Service
                  </p>
                  <h2 className="serif" style={{ fontSize:56, fontWeight:300, color:"#fff", lineHeight:1.1, marginBottom:14 }}>
                    {sl.title}
                  </h2>
                  <p style={{ fontSize:15, color:"rgba(255,255,255,.6)", marginBottom:24, fontFamily:"'Outfit',sans-serif", letterSpacing:.5 }}>
                    {sl.sub}
                  </p>
                  <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                    <span className="serif" style={{ fontSize:28, color: sl.accent }}>{sl.price}</span>
                    <button className="btn-primary" style={{ background: sl.accent, color:"#0d0d0d" }}
                      onClick={() => { setView("book"); resetBook(); }}>
                      Book Now
                    </button>
                  </div>
                </div>

                {/* SVG art */}
                <div className="carousel-art">
                  <svg width="360" height="360" viewBox="0 0 640 360" fill="none" dangerouslySetInnerHTML={{ __html: sl.shape }} />
                </div>
              </div>
            ))}

            {/* Dots */}
            <div className="carousel-dots">
              {SLIDES.map((_, i) => (
                <button key={i} className={`cdot ${i === slide ? "active" : ""}`} onClick={() => setSlide(i)} />
              ))}
            </div>
          </div>

          {/* ── Services grid ── */}
          <section style={{ maxWidth:1100, margin:"0 auto", padding:"80px 40px 40px" }}>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <p className="section-label" style={{ marginBottom:12 }}>What we offer</p>
              <h2 className="serif" style={{ fontSize:44, fontWeight:300 }}>Our Services</h2>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:20 }}>
              {SERVICES.map(s => (
                <div key={s.id} className="card" style={{ padding:"32px 24px", textAlign:"center" }}
                  onClick={() => { setSelService(s); setView("book"); setBookStep(2); }}>
                  <div style={{ fontSize:32, marginBottom:16, color:T.accent }}>{s.icon}</div>
                  <h3 className="serif" style={{ fontSize:22, fontWeight:400, marginBottom:8 }}>{s.name}</h3>
                  <p style={{ fontSize:12, color:T.muted, marginBottom:20, lineHeight:1.6 }}>{s.tagline}</p>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:11, color:T.muted }}>{s.duration} min</span>
                    <span className="serif" style={{ fontSize:22, color:T.accent }}>${s.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Team ── */}
          <section style={{ maxWidth:1100, margin:"0 auto", padding:"40px 40px 80px" }}>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <p className="section-label" style={{ marginBottom:12 }}>The team</p>
              <h2 className="serif" style={{ fontSize:44, fontWeight:300 }}>Meet Your Stylists</h2>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:20 }}>
              {STAFF.map(s => (
                <div key={s.id} className="card" style={{ padding:"36px", textAlign:"center" }}>
                  <div className="avatar" style={{ width:72, height:72, background:dark?"#2a2a2a":T.border, color:T.accent, fontSize:18, margin:"0 auto 20px" }}>
                    {s.avatar}
                  </div>
                  <h3 className="serif" style={{ fontSize:24, fontWeight:400 }}>{s.name}</h3>
                  <p style={{ fontSize:11, color:T.muted, marginTop:4, letterSpacing:1, textTransform:"uppercase" }}>{s.role}</p>
                  <p style={{ fontSize:12, color:T.accent, marginTop:10 }}>{s.specialty}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ════════════════ BOOKING FLOW ════════════════ */}
      {view === "book" && !submitted && (
        <div style={{ maxWidth:860, margin:"0 auto", padding:"60px 32px" }}>
          {/* Progress */}
          <div className="prog" style={{ marginBottom:52 }}>
            {[1,2,3,4].map((s,i) => (
              <div key={s} style={{ display:"flex", alignItems:"center" }}>
                <div className="pdot" style={{ background: bookStep===s ? T.accent : bookStep>s ? (dark?"#6b5a3e":"#c8a97e") : T.border }} />
                {i < 3 && <div className="pline" style={{ background: bookStep>s ? (dark?"#6b5a3e":"#c8a97e") : T.border }} />}
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {bookStep===1 && (
            <div className="fade-up">
              <p className="section-label" style={{ marginBottom:10 }}>Step 1 of 4</p>
              <h2 className="serif" style={{ fontSize:44, fontWeight:300, marginBottom:8 }}>Choose a Service</h2>
              <p style={{ color:T.muted, fontSize:14, marginBottom:40 }}>Select the treatment you'd like</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                {SERVICES.map(s => (
                  <div key={s.id} className={`card ${selService?.id===s.id?"sel":""}`} style={{ padding:"28px 24px" }}
                    onClick={() => setSelService(s)}>
                    <div style={{ fontSize:28, color:T.accent, marginBottom:14 }}>{s.icon}</div>
                    <h3 className="serif" style={{ fontSize:24, fontWeight:400, marginBottom:6 }}>{s.name}</h3>
                    <p style={{ fontSize:12, color:T.muted, marginBottom:20 }}>{s.tagline}</p>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:12, color:T.muted }}>{s.duration} min</span>
                      <span className="serif" style={{ fontSize:24, color:T.accent }}>${s.price}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:36 }}>
                <button className="btn-primary" disabled={!selService} onClick={() => setBookStep(2)}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {bookStep===2 && (
            <div className="fade-up">
              <p className="section-label" style={{ marginBottom:10 }}>Step 2 of 4</p>
              <h2 className="serif" style={{ fontSize:44, fontWeight:300, marginBottom:8 }}>Choose Your Stylist</h2>
              <p style={{ color:T.muted, fontSize:14, marginBottom:40 }}>Select who you'd like to work with</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18 }}>
                {STAFF.map(s => (
                  <div key={s.id} className={`card ${selStaff?.id===s.id?"sel":""}`} style={{ padding:"36px 24px", textAlign:"center" }}
                    onClick={() => setSelStaff(s)}>
                    <div className="avatar" style={{
                      width:68, height:68,
                      background: selStaff?.id===s.id ? T.accent : (dark?"#252525":T.border),
                      color: selStaff?.id===s.id ? T.accentText : T.text,
                      fontSize:18, margin:"0 auto 18px",
                    }}>{s.avatar}</div>
                    <h3 className="serif" style={{ fontSize:22, fontWeight:400 }}>{s.name}</h3>
                    <p style={{ fontSize:11, color:T.muted, marginTop:5, letterSpacing:1, textTransform:"uppercase" }}>{s.role}</p>
                    <p style={{ fontSize:12, color:T.accent, marginTop:8 }}>{s.specialty}</p>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:36 }}>
                <button className="btn-ghost" onClick={() => setBookStep(1)}>Back</button>
                <button className="btn-primary" disabled={!selStaff} onClick={() => setBookStep(3)}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {bookStep===3 && (
            <div className="fade-up">
              <p className="section-label" style={{ marginBottom:10 }}>Step 3 of 4</p>
              <h2 className="serif" style={{ fontSize:44, fontWeight:300, marginBottom:8 }}>Pick a Date & Time</h2>
              <p style={{ color:T.muted, fontSize:14, marginBottom:40 }}>Real-time availability for {selStaff?.name}</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:28 }}>
                {/* Calendar */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:24 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                    <button className="btn-icon" style={{ width:32, height:32, fontSize:16 }} onClick={() => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1)}else setCalMonth(m=>m-1) }}>‹</button>
                    <p className="serif" style={{ fontSize:18, fontWeight:300 }}>{MONTHS[calMonth]} {calYear}</p>
                    <button className="btn-icon" style={{ width:32, height:32, fontSize:16 }} onClick={() => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1)}else setCalMonth(m=>m+1) }}>›</button>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:8 }}>
                    {DAYS.map(d=><p key={d} className="section-label" style={{ textAlign:"center", padding:"4px 0", fontSize:9 }}>{d}</p>)}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                    {days.map((day,i) => {
                      const isPast = day && new Date(calYear,calMonth,day) < new Date(today.getFullYear(),today.getMonth(),today.getDate());
                      const isToday = day===today.getDate() && calMonth===today.getMonth() && calYear===today.getFullYear();
                      return (
                        <div key={i} className={`cday ${!day?"emp":""} ${isPast?"past":""} ${isToday?"tod":""} ${selDate===day?"chosen":""}`}
                          onClick={() => { if(!isPast&&day){ setSelDate(day); setSelTime(null); } }}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                <div>
                  <p className="section-label" style={{ marginBottom:14 }}>
                    {selDate ? `Available — ${MONTHS[calMonth].slice(0,3)} ${selDate}` : "Select a date first"}
                  </p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, maxHeight:320, overflowY:"auto" }} className="sh">
                    {selDate ? TIME_SLOTS.map(t => (
                      <div key={t} className={`slot ${takenSlots.includes(t)?"taken":""} ${selTime===t?"chosen":""}`}
                        onClick={() => !takenSlots.includes(t) && setSelTime(t)}>
                        {t}
                      </div>
                    )) : (
                      <p style={{ fontSize:13, color:T.muted, gridColumn:"span 2", paddingTop:12 }}>← Pick a date to see times</p>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:36 }}>
                <button className="btn-ghost" onClick={() => setBookStep(2)}>Back</button>
                <button className="btn-primary" disabled={!selDate||!selTime} onClick={() => setBookStep(4)}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {bookStep===4 && (
            <div className="fade-up">
              <p className="section-label" style={{ marginBottom:10 }}>Step 4 of 4</p>
              <h2 className="serif" style={{ fontSize:44, fontWeight:300, marginBottom:8 }}>Your Details</h2>
              <p style={{ color:T.muted, fontSize:14, marginBottom:40 }}>Almost done — just a few things</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:40 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {[
                    { k:"name",  label:"Full Name",     ph:"Your full name",    type:"text" },
                    { k:"email", label:"Email Address",  ph:"you@example.com",   type:"email" },
                    { k:"phone", label:"Phone Number",   ph:"(555) 000-0000",    type:"tel" },
                  ].map(f => (
                    <div key={f.k}>
                      <p className="section-label" style={{ marginBottom:8 }}>{f.label}</p>
                      <input className="inp" type={f.type} placeholder={f.ph}
                        value={clientForm[f.k]} onChange={e => setClientForm(p=>({...p,[f.k]:e.target.value}))} />
                    </div>
                  ))}
                  <div>
                    <p className="section-label" style={{ marginBottom:8 }}>Notes (optional)</p>
                    <textarea className="inp" rows={3} placeholder="Any special requests..."
                      value={clientForm.notes} onChange={e => setClientForm(p=>({...p,notes:e.target.value}))} />
                  </div>
                  {bookErr && <p style={{ fontSize:12, color:"#e74c3c" }}>{bookErr}</p>}
                </div>

                {/* Summary */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:28, height:"fit-content" }}>
                  <p className="section-label" style={{ marginBottom:20 }}>Booking Summary</p>
                  {[
                    { label:"Service",  value:selService?.name },
                    { label:"Duration", value:`${selService?.duration} min` },
                    { label:"Stylist",  value:selStaff?.name },
                    { label:"Date",     value:dateStr },
                    { label:"Time",     value:selTime },
                  ].map(row => (
                    <div key={row.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                      <span style={{ fontSize:12, color:T.muted }}>{row.label}</span>
                      <span style={{ fontSize:13, color:T.text }}>{row.value}</span>
                    </div>
                  ))}
                  <hr className="divider" style={{ margin:"16px 0" }} />
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span className="section-label">Total Due</span>
                    <span className="serif" style={{ fontSize:32, color:T.accent }}>${selService?.price}</span>
                  </div>
                  <div style={{ marginTop:16, padding:"10px 14px", background:dark?"#0d1a0d":"#edfaf3", borderRadius:2 }}>
                    <p style={{ fontSize:11, color:IS_CONFIGURED?"#4caf50":T.muted }}>
                      {IS_CONFIGURED ? "✓ Saves to database in real time" : "Demo mode — booking stored in session only"}
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:36 }}>
                <button className="btn-ghost" onClick={() => setBookStep(3)}>Back</button>
                <button className="btn-primary"
                  disabled={!clientForm.name||!clientForm.email||!clientForm.phone||saving}
                  onClick={confirmBooking}>
                  {saving ? <span style={{ display:"flex", alignItems:"center", gap:10 }}><span className="spinner"/>Saving…</span> : "Confirm Booking"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ CONFIRMATION ════════════════ */}
      {view === "book" && submitted && (
        <div style={{ maxWidth:580, margin:"0 auto", padding:"80px 32px", textAlign:"center", position:"relative" }} className="fade-up">
          {[...Array(16)].map((_,i) => (
            <div key={i} className="cf" style={{
              left:`${8+Math.random()*84}%`, top:`${Math.random()*15}%`,
              background:[T.accent,"#f0ece4","#6b5a3e","#fff"][i%4],
              animationDelay:`${Math.random()*.6}s`, animationDuration:`${2+Math.random()*2}s`,
            }} />
          ))}
          <div className="serif" style={{ fontSize:64, color:T.accent, marginBottom:16 }}>✦</div>
          <h2 className="serif" style={{ fontSize:48, fontWeight:300, color:T.text, marginBottom:8 }}>You're Booked</h2>
          <p style={{ fontSize:13, color:T.muted, marginBottom:40 }}>A confirmation will be sent to {clientForm.email}</p>

          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:32, textAlign:"left" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:24 }}>
              {[
                { label:"Service", value:selService?.name },
                { label:"Stylist", value:selStaff?.name },
                { label:"Date",    value:dateStr },
                { label:"Time",    value:selTime },
              ].map(row => (
                <div key={row.label}>
                  <p className="section-label" style={{ marginBottom:5 }}>{row.label}</p>
                  <p className="serif" style={{ fontSize:20, fontWeight:300 }}>{row.value}</p>
                </div>
              ))}
            </div>
            <hr className="divider" style={{ marginBottom:20 }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p className="section-label">Total at appointment</p>
              <span className="serif" style={{ fontSize:32, color:T.accent }}>${selService?.price}</span>
            </div>
          </div>

          <div style={{ display:"flex", gap:14, justifyContent:"center", marginTop:32 }}>
            <button className="btn-primary" onClick={resetBook}>Book Again</button>
            <button className="btn-ghost" onClick={() => setView("home")}>Back to Home</button>
          </div>
        </div>
      )}

      {/* ════════════════ ADMIN ════════════════ */}
      {view === "admin" && loggedIn && (
        <div style={{ maxWidth:1060, margin:"0 auto", padding:"56px 40px" }} className="fade-up">
          {/* Admin header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:36 }}>
            <div>
              <p className="section-label" style={{ marginBottom:8 }}>Staff Portal</p>
              <h2 className="serif" style={{ fontSize:40, fontWeight:300 }}>Appointments</h2>
              <p style={{ fontSize:13, color:T.muted, marginTop:4 }}>
                Signed in as <span style={{ color:T.accent }}>{loggedIn.name}</span> · {loggedIn.role}
              </p>
            </div>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              {dbLoading && <span className="spinner" />}
              <button className="btn-ghost" style={{ padding:"10px 20px" }} onClick={fetchBookings}>↻ Refresh</button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:40 }}>
            {[
              { label:"Total Bookings",   value: bookings.length },
              { label:"Unique Clients",   value: new Set(bookings.map(b=>b.email)).size },
              { label:"Projected Revenue",value: `$${revenue}` },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <p className="section-label" style={{ marginBottom:8 }}>{s.label}</p>
                <p className="serif" style={{ fontSize:44, fontWeight:300, color:T.accent, lineHeight:1.1 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:"0 28px" }}>
            <div style={{
              display:"grid", gridTemplateColumns:"2fr 1.5fr 1.2fr 1fr 1fr 44px",
              gap:12, padding:"14px 0", borderBottom:`1px solid ${T.border}`,
            }}>
              {["Client","Service","Stylist","Date","Time",""].map((h,i) => (
                <p key={i} className="section-label">{h}</p>
              ))}
            </div>

            {bookings.length === 0 && (
              <p style={{ padding:"36px 0", color:T.muted, fontSize:13 }}>
                {dbLoading ? "Loading…" : "No bookings yet. Make a booking to see it appear here."}
              </p>
            )}

            {bookings.map(b => (
              <div key={b.id} className="admin-row" style={{
                display:"grid", gridTemplateColumns:"2fr 1.5fr 1.2fr 1fr 1fr 44px",
                gap:12, alignItems:"center",
              }}>
                <div>
                  <p style={{ fontSize:14, color:T.text }}>{b.name}</p>
                  <p style={{ fontSize:11, color:T.muted, marginTop:2 }}>{b.email}</p>
                </div>
                <span className="tag" style={{ background:dark?"rgba(201,169,110,.12)":"rgba(160,120,64,.1)", color:T.accent, border:`1px solid ${dark?"rgba(201,169,110,.2)":"rgba(160,120,64,.2)"}` }}>
                  {b.service}
                </span>
                <p style={{ fontSize:13, color:T.subtext }}>{b.staff}</p>
                <p style={{ fontSize:13, color:T.subtext }}>{b.date}</p>
                <p style={{ fontSize:13, color:T.accent, fontFamily:"'Outfit',sans-serif" }}>{b.time}</p>
                <button
                  style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:16, padding:"4px 8px", transition:"color .2s", borderRadius:2 }}
                  onMouseEnter={e => e.target.style.color="#e74c3c"}
                  onMouseLeave={e => e.target.style.color=T.muted}
                  onClick={() => deleteBooking(b.id)}
                  disabled={deleting===b.id}
                  title="Cancel booking">
                  {deleting===b.id ? <span className="spinner" style={{ width:14,height:14 }}/> : "✕"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guard: redirect if admin accessed without login */}
      {view === "admin" && !loggedIn && (
        <div style={{ maxWidth:500, margin:"0 auto", padding:"120px 32px", textAlign:"center" }} className="fade-up">
          <div className="serif" style={{ fontSize:52, color:T.accent, marginBottom:20 }}>✦</div>
          <h2 className="serif" style={{ fontSize:36, fontWeight:300, marginBottom:12 }}>Staff Access Only</h2>
          <p style={{ fontSize:14, color:T.muted, marginBottom:32 }}>Please sign in with your staff credentials to view appointments.</p>
          <button className="btn-primary" onClick={() => setShowLogin(true)}>Sign In</button>
        </div>
      )}

      {/* ════════════════ FOOTER ════════════════ */}
      <footer style={{ borderTop:`1px solid ${T.border}`, padding:"28px 48px", display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:40 }}>
        <p className="serif" style={{ fontSize:18, fontWeight:300, letterSpacing:3, color:T.muted }}>LUMIÈRE</p>
        <p style={{ fontSize:11, color:T.muted, letterSpacing:.5 }}>© 2026 Lumière Hair Studio · All rights reserved</p>
        <div style={{ display:"flex", gap:24 }}>
          <button className="navlink" onClick={() => setView("home")}>Home</button>
          <button className="navlink" onClick={() => { setView("book"); resetBook(); }}>Book</button>
          <button className="navlink" onClick={() => setShowLogin(true)}>Staff</button>
        </div>
      </footer>
    </div>
  );
}

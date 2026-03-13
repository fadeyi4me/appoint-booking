import { useState, useEffect, useCallback, useRef } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────
const SUPABASE_URL      = "https://tftewlamxkzzajbulsvd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdGV3bGFteGt6emFqYnVsc3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjIyODAsImV4cCI6MjA4ODc5ODI4MH0.hNiA_t5GMYDfqjtITPWoq9cB_lQxag5yYu1fpEleEO4";
const IS_CONFIGURED     = SUPABASE_URL !== "https://tftewlamxkzzajbulsvd.supabase.co";

const db = {
  async select(table, filters = "") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filters}&order=created_at.desc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async insert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json", Prefer: "return=representation" },
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

// ─── STAFF CREDENTIALS ────────────────────────────────────────────────────
const STAFF_CREDS = [
  { id: "admin", name: "Studio Admin",  role: "Administrator",    pin: "1234", isAdmin: true  },
  { id: "1",     name: "Jordan Lee",    role: "Senior Stylist",   pin: "2222", isAdmin: false },
  { id: "2",     name: "Maya Chen",     role: "Color Specialist", pin: "3333", isAdmin: false },
  { id: "3",     name: "Alex Rivera",   role: "Style Director",   pin: "4444", isAdmin: false },
];

// ─── APP DATA ─────────────────────────────────────────────────────────────
const SERVICES = [
  { id:1, name:"Haircut & Style",    duration:60,  price:65,  icon:"✂️", desc:"Precision cut tailored to your face shape" },
  { id:2, name:"Color Treatment",    duration:120, price:120, icon:"🎨", desc:"Full color, highlights or balayage" },
  { id:3, name:"Deep Conditioning",  duration:45,  price:45,  icon:"💧", desc:"Restore moisture and shine" },
  { id:4, name:"Blowout",            duration:30,  price:35,  icon:"💨", desc:"Smooth finish that lasts for days" },
];
const STAFF = [
  { id:1, name:"Jordan Lee",  role:"Senior Stylist",   avatar:"JL", since:"8 yrs"  },
  { id:2, name:"Maya Chen",   role:"Color Specialist", avatar:"MC", since:"5 yrs"  },
  { id:3, name:"Alex Rivera", role:"Style Director",   avatar:"AR", since:"12 yrs" },
];
const TIME_SLOTS = [
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM",
];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const SLIDES = [
  { url:"https://images.unsplash.com/photo-1560869713-da86a9ec0744?w=1400&q=80", label:"Signature Color",   sub:"Bespoke tones crafted for you"     },
  { url:"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1400&q=80", label:"Precision Cut",    sub:"Shape that moves with you"         },
  { url:"https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=1400&q=80", label:"Luxury Styling",   sub:"Finish that lasts for days"        },
  { url:"https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1400&q=80", label:"Colour Artistry",  sub:"Highlights & balayage mastery"     },
  { url:"https://images.unsplash.com/photo-1582095133179-bfd08e2533cf?w=1400&q=80", label:"Deep Conditioning",sub:"Restore. Revive. Radiate."          },
];

function getDays(year, month) {
  const days = [];
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < first; i++) days.push(null);
  for (let d = 1; d <= total; d++) days.push(d);
  return days;
}

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────
function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

// ═════════════════════════════════════════════════════════════════════════
export default function App() {
  const today  = new Date();
  const width  = useWidth();
  const isMob  = width < 640;
  const isTab  = width >= 640 && width < 1024;
  const isDesk = width >= 1024;

  // ── state ──
  const [dark, setDark]             = useState(true);
  const [staffUser, setStaffUser]   = useState(null);
  const [showLogin, setShowLogin]   = useState(false);
  const [loginName, setLoginName]   = useState("");
  const [loginPin, setLoginPin]     = useState("");
  const [loginErr, setLoginErr]     = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [view, setView]             = useState("home");
  const [step, setStep]             = useState(1);
  const [slide, setSlide]           = useState(0);
  const [selService, setSelSvc]     = useState(null);
  const [selStaff, setSelStaff]     = useState(null);
  const [calMonth, setCalMonth]     = useState(today.getMonth());
  const [calYear, setCalYear]       = useState(today.getFullYear());
  const [selDate, setSelDate]       = useState(null);
  const [selTime, setSelTime]       = useState(null);
  const [form, setForm]             = useState({ name:"", email:"", phone:"", notes:"" });
  const [submitted, setSubmitted]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [dbErr, setDbErr]           = useState(null);
  const [bookings, setBookings]     = useState([]);
  const [bookedSlots, setBooked]    = useState([]);
  const [loading, setLoading]       = useState(false);
  const [deleting, setDeleting]     = useState(null);

  const dateStr = selDate ? `${MONTHS[calMonth]} ${selDate}, ${calYear}` : null;

  // carousel auto-advance
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  // close mobile menu on navigate
  useEffect(() => setMenuOpen(false), [view]);

  // fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!IS_CONFIGURED) return;
    setLoading(true);
    try {
      const data = await db.select("bookings");
      setBookings(data);
      setBooked(data.map(b => ({ staff_id: b.staff_id, date: b.date, time: b.time })));
    } catch (e) { setDbErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (view === "admin") fetchBookings(); }, [view, fetchBookings]);

  // fetch slots when date+staff selected
  useEffect(() => {
    if (!IS_CONFIGURED || !selDate || !selStaff) return;
    (async () => {
      try {
        const data = await db.select("bookings",
          `staff_id=eq.${selStaff.id}&date=eq.${encodeURIComponent(dateStr)}&select=time`);
        setBooked(prev => {
          const f = prev.filter(s => !(s.staff_id === selStaff.id && s.date === dateStr));
          return [...f, ...data.map(d => ({ staff_id: selStaff.id, date: dateStr, time: d.time }))];
        });
      } catch (_) {}
    })();
  }, [selDate, selStaff, dateStr]);

  const takenSlots = (selStaff && dateStr)
    ? bookedSlots.filter(s => s.staff_id === selStaff.id && s.date === dateStr).map(s => s.time)
    : [];

  // ── actions ──
  function doLogin(name, pin) {
    const match = STAFF_CREDS.find(s => s.name === name && s.pin === pin);
    if (match) {
      setStaffUser(match); setShowLogin(false);
      setLoginName(""); setLoginPin(""); setLoginErr("");
      setView("admin");
    } else {
      setLoginErr("Incorrect PIN. Please try again.");
      setLoginPin("");
    }
  }

  async function handleBook() {
    setSaving(true); setDbErr(null);
    const rec = { name:form.name, email:form.email, phone:form.phone, notes:form.notes,
      service:selService.name, staff:selStaff.name, staff_id:selStaff.id, date:dateStr, time:selTime };
    try {
      if (IS_CONFIGURED) {
        const [saved] = await db.insert("bookings", rec);
        setBookings(p => [saved, ...p]);
        setBooked(p => [...p, { staff_id:selStaff.id, date:dateStr, time:selTime }]);
      } else {
        setBookings(p => [{ id:Date.now(), ...rec, created_at:new Date().toISOString() }, ...p]);
      }
      setSubmitted(true);
    } catch (e) { setDbErr("Booking failed: " + e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      if (IS_CONFIGURED) await db.delete("bookings", id);
      setBookings(p => p.filter(b => b.id !== id));
    } catch (e) { setDbErr(e.message); }
    finally { setDeleting(null); }
  }

  function resetBook() {
    setStep(1); setSelSvc(null); setSelStaff(null);
    setSelDate(null); setSelTime(null);
    setForm({ name:"", email:"", phone:"", notes:"" });
    setSubmitted(false); setDbErr(null);
  }

  const revenue = bookings.reduce((a, b) => {
    const s = SERVICES.find(s => s.name === b.service); return a + (s ? s.price : 0);
  }, 0);
  const days = getDays(calYear, calMonth);

  // ── theme tokens ──
  const D = {
    bg:      dark ? "#0e0c0a" : "#faf8f4",
    surf:    dark ? "#1a1713" : "#ffffff",
    surf2:   dark ? "#231f1b" : "#f5f1eb",
    border:  dark ? "#2e2925" : "#e8e0d4",
    text:    dark ? "#f0ece4" : "#1a1713",
    mid:     dark ? "#9a9088" : "#7a7068",
    dim:     dark ? "#4a4540" : "#b0a898",
    gold:    "#c9a96e",
    goldLt:  "#e8c88a",
    danger:  "#c0392b",
  };

  // ── padding helpers ──
  const px   = isMob ? "16px" : isTab ? "28px" : "48px";
  const pySection = isMob ? "36px" : "56px";

  // ─── GLOBAL CSS ──────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: ${D.bg}; color: ${D.text}; font-family: 'DM Sans', sans-serif;
           transition: background .4s, color .4s; -webkit-font-smoothing: antialiased; }
    .pf { font-family: 'Playfair Display', Georgia, serif; }
    .dm { font-family: 'DM Sans', sans-serif; }

    /* ─ Buttons ─ */
    .btn-p {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      background: ${D.gold}; color: #0e0c0a; border: none;
      padding: ${isMob ? "12px 24px" : "13px 32px"};
      font-family: 'DM Sans', sans-serif; font-weight: 500;
      font-size: ${isMob ? "12px" : "13px"}; letter-spacing: 1.5px;
      text-transform: uppercase; cursor: pointer; transition: all .2s; border-radius: 1px;
      white-space: nowrap;
    }
    .btn-p:hover { background: ${D.goldLt}; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,169,110,.3); }
    .btn-p:disabled { background: ${D.border}; color: ${D.dim}; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-p:active { transform: scale(.97); }
    .btn-g {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      background: transparent; color: ${D.gold}; border: 1px solid ${D.gold};
      padding: ${isMob ? "11px 20px" : "12px 28px"};
      font-family: 'DM Sans', sans-serif; font-size: ${isMob ? "12px" : "13px"};
      letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer;
      transition: all .2s; border-radius: 1px;
    }
    .btn-g:hover { background: rgba(201,169,110,.1); }
    .btn-g:active { transform: scale(.97); }
    .btn-ic {
      background: transparent; border: none; cursor: pointer;
      color: ${D.mid}; padding: 8px; transition: color .2s;
      font-size: 18px; line-height: 1; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .btn-ic:hover { color: ${D.gold}; }

    /* ─ Card ─ */
    .card { background: ${D.surf}; border: 1px solid ${D.border}; border-radius: 3px;
            transition: border-color .25s, box-shadow .25s; }
    .card:hover { border-color: ${D.gold}; }
    .card.sel { border-color: ${D.gold}; background: ${dark ? "#1e1a14" : "#fdf8f0"};
                box-shadow: 0 0 0 1px ${D.gold}; }
    .card.flat:hover { border-color: ${D.border}; }

    /* ─ Form ─ */
    .inp {
      background: ${D.surf2}; border: 1px solid ${D.border};
      color: ${D.text}; padding: 13px 16px; font-family: 'DM Sans', sans-serif;
      font-size: 14px; width: 100%; outline: none; border-radius: 2px;
      transition: border-color .2s, box-shadow .2s;
      -webkit-appearance: none; appearance: none;
    }
    .inp:focus { border-color: ${D.gold}; box-shadow: 0 0 0 3px rgba(201,169,110,.12); }
    .inp::placeholder { color: ${D.dim}; }
    .lbl { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
           color: ${D.mid}; display: block; margin-bottom: 8px; }

    /* ─ Time slot ─ */
    .ts {
      background: ${D.surf2}; border: 1px solid ${D.border};
      color: ${D.mid}; padding: 10px 6px; cursor: pointer;
      font-size: ${isMob ? "11px" : "12px"}; transition: all .18s;
      text-align: center; border-radius: 2px; touch-action: manipulation;
    }
    .ts:hover:not(.bk) { border-color: ${D.gold}; color: ${D.text}; }
    .ts.act { background: ${D.gold}; color: #0e0c0a; border-color: ${D.gold}; font-weight: 600; }
    .ts.bk { opacity: .28; cursor: not-allowed; text-decoration: line-through; }

    /* ─ Calendar ─ */
    .cd {
      aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
      font-size: ${isMob ? "12px" : "13px"}; cursor: pointer;
      border-radius: 50%; transition: all .15s; color: ${D.mid};
      touch-action: manipulation;
    }
    .cd:hover:not(.past):not(.emp) { background: ${D.surf2}; color: ${D.text}; }
    .cd.seld { background: ${D.gold} !important; color: #0e0c0a !important; font-weight: 700; }
    .cd.past { opacity: .22; cursor: default; }
    .cd.tod  { color: ${D.gold}; font-weight: 700; }
    .cd.emp  { cursor: default; }

    /* ─ Carousel ─ */
    .hero { position: relative; width: 100%;
            height: ${isMob ? "420px" : isTab ? "460px" : "520px"}; overflow: hidden; }
    .csl { position: absolute; inset: 0; transition: opacity .9s ease, transform .9s ease;
           opacity: 0; transform: scale(1.04); }
    .csl.on { opacity: 1; transform: scale(1); }
    .csl img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
    .covl { position: absolute; inset: 0;
      background: ${isMob
        ? `linear-gradient(to bottom, rgba(14,12,10,.3) 0%, rgba(14,12,10,.75) 100%)`
        : `linear-gradient(to right, rgba(14,12,10,.82) 36%, rgba(14,12,10,.15) 100%)`};
    }
    .covl.lt { background: ${isMob
        ? `linear-gradient(to bottom, rgba(250,248,244,.3) 0%, rgba(250,248,244,.88) 100%)`
        : `linear-gradient(to right, rgba(250,248,244,.88) 36%, rgba(250,248,244,.12) 100%)`}; }
    .hero-txt {
      position: absolute;
      ${isMob ? "bottom: 40px; left: 0; right: 0; padding: 0 20px; text-align: center;"
               : "top: 50%; left: 0; transform: translateY(-50%); padding: 0 64px; max-width: 560px;"}
    }
    .hero-dots { position: absolute; bottom: ${isMob ? "16px" : "24px"};
      ${isMob ? "left: 50%; transform: translateX(-50%);" : "left: 64px;"}
      display: flex; gap: 8px; align-items: center; }
    .hdot { width: 6px; height: 6px; border-radius: 50%;
            background: rgba(201,169,110,.35); cursor: pointer; transition: all .3s; }
    .hdot.on { background: ${D.gold}; width: 20px; border-radius: 3px; }
    .harrow {
      position: absolute; top: 50%; transform: translateY(-50%);
      background: rgba(201,169,110,.2); border: 1px solid rgba(201,169,110,.4);
      color: ${D.gold}; width: ${isMob ? "36px" : "44px"}; height: ${isMob ? "36px" : "44px"};
      border-radius: 50%; cursor: pointer; font-size: ${isMob ? "16px" : "18px"};
      display: flex; align-items: center; justify-content: center; z-index: 2;
      transition: all .2s; touch-action: manipulation;
    }
    .harrow:hover { background: rgba(201,169,110,.4); }

    /* ─ Nav ─ */
    .nav-l { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;
             color: ${D.mid}; background: none; border: none; cursor: pointer;
             padding: 4px 0; transition: color .2s; position: relative; white-space: nowrap; }
    .nav-l::after { content:''; position:absolute; bottom:-2px; left:0; right:0;
                    height:1px; background:${D.gold}; transform:scaleX(0); transition:transform .25s; }
    .nav-l:hover { color: ${D.text}; }
    .nav-l.on { color: ${D.gold}; }
    .nav-l.on::after { transform: scaleX(1); }

    /* ─ Mobile menu ─ */
    .mob-menu {
      position: fixed; inset: 0; top: 64px; z-index: 150;
      background: ${D.surf}; border-top: 1px solid ${D.border};
      display: flex; flex-direction: column; padding: 24px 20px; gap: 8px;
      animation: slideDown .25s ease;
    }
    .mob-nav-l {
      font-size: 16px; letter-spacing: 1px; text-transform: uppercase;
      color: ${D.text}; background: none; border: none; cursor: pointer;
      padding: 14px 16px; text-align: left; border-radius: 2px;
      transition: background .15s, color .15s; font-family: 'Playfair Display', serif;
    }
    .mob-nav-l:hover, .mob-nav-l.on { background: ${D.surf2}; color: ${D.gold}; }

    /* ─ Admin table responsive ─ */
    .admin-tbl-hd { display: grid; gap: 12px; padding: 12px 16px;
      border-bottom: 1px solid ${D.border};
      grid-template-columns: ${isMob ? "1fr 1fr" : isTab ? "2fr 1.5fr 1fr 40px" : "2fr 1.5fr 1.2fr 1.1fr 1fr 44px"}; }
    .admin-row { display: grid; gap: 12px; padding: 14px 16px;
      border-bottom: 1px solid ${D.border}; transition: background .15s;
      grid-template-columns: ${isMob ? "1fr 1fr" : isTab ? "2fr 1.5fr 1fr 40px" : "2fr 1.5fr 1.2fr 1.1fr 1fr 44px"};
      align-items: center; }
    .admin-row:hover { background: ${D.surf2}; }

    /* ─ Stats grid ─ */
    .stats-grid { display: grid; gap: 16px;
      grid-template-columns: ${isMob ? "1fr 1fr" : "repeat(4,1fr)"}; }

    /* ─ Services grid ─ */
    .svc-grid { display: grid; gap: ${isMob ? "12px" : "20px"};
      grid-template-columns: ${isMob ? "1fr 1fr" : isTab ? "1fr 1fr" : "repeat(4,1fr)"}; }

    /* ─ Team grid ─ */
    .team-grid { display: grid; gap: ${isMob ? "12px" : "20px"};
      grid-template-columns: ${isMob ? "1fr" : "repeat(3,1fr)"}; }

    /* ─ Booking step grids ─ */
    .svc-pick { display: grid; gap: ${isMob ? "10px" : "16px"};
      grid-template-columns: ${isMob ? "1fr" : "1fr 1fr"}; }
    .staff-pick { display: grid; gap: ${isMob ? "10px" : "16px"};
      grid-template-columns: repeat(3,1fr); }
    .datetime-grid { display: grid; gap: ${isMob ? "20px" : "28px"};
      grid-template-columns: ${isMob ? "1fr" : "1fr 1fr"}; }
    .details-grid { display: grid; gap: ${isMob ? "20px" : "40px"};
      grid-template-columns: ${isMob ? "1fr" : "1fr 1fr"}; }
    .confirm-grid { display: grid; gap: ${isMob ? "16px" : "24px"};
      grid-template-columns: 1fr 1fr; }

    /* ─ Step tracker ─ */
    .step-tr { display: flex; align-items: center; justify-content: center; }
    .step-d { width: 8px; height: 8px; border-radius: 50%; transition: all .3s; }
    .step-ln { width: ${isMob ? "28px" : "40px"}; height: 1px; }

    /* ─ Divider ─ */
    .dv { border: none; border-top: 1px solid ${D.border}; }

    /* ─ Tag ─ */
    .tag { display: inline-block; padding: 3px 8px; font-size: 10px;
           letter-spacing: 1px; text-transform: uppercase;
           background: rgba(201,169,110,.12); color: ${D.gold};
           border: 1px solid rgba(201,169,110,.25); border-radius: 2px; }

    /* ─ Avatar ─ */
    .av { border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-weight: 600; transition: all .2s; flex-shrink: 0; }

    /* ─ Settings panel ─ */
    .sp-overlay { position: fixed; inset: 0; z-index: 900;
      background: rgba(14,12,10,.6); backdrop-filter: blur(8px);
      display: flex; align-items: stretch; justify-content: flex-end;
      animation: fadeIn .25s ease; }
    .sp-panel { background: ${D.surf}; border-left: 1px solid ${D.border};
      width: ${isMob ? "100%" : "320px"}; height: 100%;
      padding: 28px 24px; animation: slideLeft .3s ease; overflow-y: auto; }
    .tog-row { display: flex; align-items: center; justify-content: space-between;
               padding: 16px 0; border-bottom: 1px solid ${D.border}; }
    .tog { width: 48px; height: 26px; border-radius: 13px; cursor: pointer;
           position: relative; border: none; flex-shrink: 0;
           background: ${dark ? D.gold : D.border}; transition: background .25s; }
    .tog::after { content:''; position:absolute; top:3px;
      left: ${dark ? "25px" : "3px"}; width:20px; height:20px;
      border-radius:50%; background:white; transition: left .25s; }

    /* ─ Scrollbar ─ */
    .sh::-webkit-scrollbar { display: none; }
    .sh { -ms-overflow-style: none; scrollbar-width: none; }

    /* ─ Spin ─ */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { width:18px; height:18px; border:2px solid ${D.border};
            border-top-color:${D.gold}; border-radius:50%;
            animation:spin .7s linear infinite; display:inline-block; flex-shrink:0; }

    /* ─ Animations ─ */
    @keyframes fadeIn   { from{opacity:0}        to{opacity:1} }
    @keyframes slideUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideLeft{ from{transform:translateX(100%)} to{transform:translateX(0)} }
    @keyframes slideDown{ from{transform:translateY(-10px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fall     { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(500px) rotate(720deg);opacity:0} }
    .fu  { animation: fadeUp .4s ease forwards; }
    .cf  { position:absolute; width:7px; height:7px; border-radius:50%; animation:fall 3.5s ease-in forwards; }

    /* ─ Footer ─ */
    .footer-inner { display:flex; gap:${isMob ? "16px" : "0"};
      flex-direction:${isMob ? "column" : "row"};
      align-items:${isMob ? "flex-start" : "center"};
      justify-content:space-between; }
  `;

  // ─── SHARED SECTIONS ─────────────────────────────────────────────────────
  const H = (text, size = isMob ? 28 : 38) =>
    <h2 className="pf" style={{ fontSize: size, fontWeight: 400, color: D.text, lineHeight: 1.15 }}>{text}</h2>;

  const SubLabel = ({ children }) =>
    <p style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: D.gold, marginBottom: 8 }}>{children}</p>;

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: D.bg, color: D.text, transition: "background .4s, color .4s", overflowX: "hidden" }}>
      <style>{css}</style>

      {/* ══ LOGIN MODAL ══ */}
      {showLogin && (
        <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(14,12,10,.9)",
          backdropFilter:"blur(14px)", display:"flex", alignItems:"center", justifyContent:"center",
          padding:"16px", animation:"fadeIn .3s ease" }}
          onClick={e => { if (e.target===e.currentTarget) { setShowLogin(false); setLoginPin(""); setLoginName(""); setLoginErr(""); } }}>
          <div style={{ background:D.surf, border:`1px solid ${D.border}`, borderRadius:4,
            padding: isMob ? "32px 20px" : "44px 40px",
            width:"100%", maxWidth:400, position:"relative", animation:"slideUp .35s ease" }}>
            <button onClick={() => { setShowLogin(false); setLoginPin(""); setLoginName(""); setLoginErr(""); }}
              style={{ position:"absolute", top:14, right:14, background:"none", border:"none",
                color:D.mid, cursor:"pointer", fontSize:20, padding:6 }}>✕</button>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(201,169,110,.12)",
                border:"1px solid rgba(201,169,110,.3)", display:"flex", alignItems:"center",
                justifyContent:"center", margin:"0 auto 14px", fontSize:22 }}>🔑</div>
              <h2 className="pf" style={{ fontSize:24, fontWeight:500, color:D.text }}>Staff Portal</h2>
              <p style={{ fontSize:13, color:D.mid, marginTop:5 }}>Select your name and enter PIN</p>
            </div>
            <label className="lbl">Your Name</label>
            <select className="inp" value={loginName}
              onChange={e => { setLoginName(e.target.value); setLoginErr(""); setLoginPin(""); }}
              style={{ marginBottom:20, cursor:"pointer", background:D.surf2, color:D.text }}>
              <option value="">— Select staff member —</option>
              {STAFF_CREDS.map(s => <option key={s.id} value={s.name}>{s.name} · {s.role}</option>)}
            </select>
            <label className="lbl" style={{ textAlign:"center" }}>PIN</label>
            <div style={{ display:"flex", gap:12, justifyContent:"center", margin:"10px 0 18px" }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:14, height:14, borderRadius:"50%",
                  border:`2px solid ${i < loginPin.length ? D.gold : D.border}`,
                  background: i < loginPin.length ? D.gold : "transparent", transition:"all .2s" }} />
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => {
                const empty = key === ""; const back = key === "⌫";
                return (
                  <button key={idx} onClick={() => {
                    if (empty) return;
                    if (back) { setLoginPin(p => p.slice(0,-1)); return; }
                    if (loginPin.length < 4) {
                      const np = loginPin + key; setLoginPin(np); setLoginErr("");
                      if (np.length === 4 && loginName) doLogin(loginName, np);
                    }
                  }} style={{ background: empty?"transparent":D.surf2,
                    border: empty?"none":`1px solid ${D.border}`,
                    color: back ? D.gold : D.text,
                    fontFamily:"'Playfair Display',serif", fontSize: back?18:22,
                    padding:"14px 8px", cursor: empty?"default":"pointer",
                    borderRadius:3, transition:"all .15s", touchAction:"manipulation" }}>
                    {key}
                  </button>
                );
              })}
            </div>
            {loginErr && <p style={{ fontSize:12, color:D.danger, textAlign:"center", marginBottom:10 }}>{loginErr}</p>}
            <button className="btn-p" style={{ width:"100%", opacity:(!loginName||loginPin.length<4)?0.4:1 }}
              disabled={!loginName || loginPin.length < 4}
              onClick={() => doLogin(loginName, loginPin)}>Sign In →</button>
            <p style={{ fontSize:11, color:D.dim, textAlign:"center", marginTop:16, lineHeight:1.7 }}>
              Authorized staff only. Contact admin for access.
            </p>
          </div>
        </div>
      )}

      {/* ══ SETTINGS PANEL ══ */}
      {showSettings && (
        <div className="sp-overlay" onClick={e => { if (e.target===e.currentTarget) setShowSettings(false); }}>
          <div className="sp-panel">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
              <h3 className="pf" style={{ fontSize:20, fontWeight:500, color:D.text }}>Settings</h3>
              <button className="btn-ic" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="tog-row">
              <div>
                <p style={{ fontSize:14, fontWeight:500, color:D.text }}>Dark Mode</p>
                <p style={{ fontSize:12, color:D.mid, marginTop:3 }}>Switch appearance</p>
              </div>
              <button className="tog" onClick={() => setDark(d => !d)} aria-label="Toggle dark mode" />
            </div>
            <div style={{ marginTop:28 }}>
              <p className="lbl" style={{ marginBottom:14 }}>Theme Preview</p>
              <div style={{ display:"flex", gap:10 }}>
                {[{l:"Light",bg:"#faf8f4",bd:"#e8e0d4",tx:"#1a1713"},{l:"Dark",bg:"#0e0c0a",bd:"#2e2925",tx:"#f0ece4"}].map(t => (
                  <div key={t.l} onClick={() => setDark(t.l==="Dark")}
                    style={{ flex:1, background:t.bg, border:`2px solid ${(dark&&t.l==="Dark")||(!dark&&t.l==="Light")?"#c9a96e":t.bd}`,
                      borderRadius:4, padding:"12px 8px", cursor:"pointer", textAlign:"center" }}>
                    <p style={{ fontSize:12, color:t.tx, fontFamily:"DM Sans,sans-serif" }}>{t.l}</p>
                  </div>
                ))}
              </div>
            </div>
            {staffUser && (
              <div style={{ marginTop:32, padding:16, background:D.surf2, borderRadius:3, border:`1px solid ${D.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <div className="av" style={{ width:38, height:38, fontSize:12, background:"rgba(201,169,110,.15)", color:D.gold }}>
                    {staffUser.name.split(" ").map(n=>n[0]).join("")}
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:500, color:D.text }}>{staffUser.name}</p>
                    <p style={{ fontSize:12, color:D.mid }}>{staffUser.role}</p>
                  </div>
                </div>
                <button className="btn-g" style={{ width:"100%", padding:"9px" }}
                  onClick={() => { setStaffUser(null); setView("home"); setShowSettings(false); }}>Sign Out</button>
              </div>
            )}
            <div style={{ marginTop:36 }}>
              <p style={{ fontSize:11, color:D.dim, lineHeight:1.8 }}>
                LUMIÈRE Booking v2.0<br/>
                <span style={{ color: IS_CONFIGURED?"#4caf50":D.dim }}>
                  {IS_CONFIGURED ? "● Database connected" : "○ Demo mode"}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ HEADER ══ */}
      <header style={{ position:"sticky", top:0, zIndex:200,
        background: dark?"rgba(14,12,10,.94)":"rgba(250,248,244,.94)",
        backdropFilter:"blur(16px)", borderBottom:`1px solid ${D.border}`,
        padding:`0 ${px}`, height:64, display:"flex", alignItems:"center",
        justifyContent:"space-between", transition:"background .4s", gap:16 }}>
        <button onClick={() => { setView("home"); resetBook(); }}
          style={{ background:"none", border:"none", cursor:"pointer", flexShrink:0 }}>
          <h1 className="pf" style={{ fontSize: isMob?18:22, fontWeight:500, letterSpacing:4, color:D.text, textTransform:"uppercase" }}>Lumière</h1>
        </button>

        {/* Desktop nav */}
        {!isMob && (
          <nav style={{ display:"flex", gap: isTab?20:32, alignItems:"center" }}>
            <button className={`nav-l ${view==="home"?"on":""}`} onClick={() => { setView("home"); resetBook(); }}>Home</button>
            <button className={`nav-l ${view==="book"?"on":""}`} onClick={() => { setView("book"); setStep(1); }}>Book Now</button>
            {staffUser && (
              <button className={`nav-l ${view==="admin"?"on":""}`} onClick={() => setView("admin")}>Dashboard</button>
            )}
          </nav>
        )}

        <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
          {!staffUser ? (
            <button className="btn-ic" title="Staff login" onClick={() => setShowLogin(true)}>🔒</button>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }} onClick={() => setView("admin")}>
              <div className="av" style={{ width:30, height:30, fontSize:11, background:"rgba(201,169,110,.15)", color:D.gold }}>
                {staffUser.name.split(" ").map(n=>n[0]).join("")}
              </div>
              {!isMob && <span style={{ fontSize:12, color:D.gold }}>{staffUser.name.split(" ")[0]}</span>}
            </div>
          )}
          <button className="btn-ic" title="Settings" onClick={() => setShowSettings(true)}>⚙️</button>
          {/* Mobile hamburger */}
          {isMob && (
            <button className="btn-ic" onClick={() => setMenuOpen(o => !o)} style={{ fontSize:20 }}>
              {menuOpen ? "✕" : "☰"}
            </button>
          )}
          {/* Desktop Book Now CTA */}
          {isDesk && view !== "book" && (
            <button className="btn-p" style={{ padding:"9px 20px", fontSize:11 }}
              onClick={() => { setView("book"); setStep(1); }}>Book Now</button>
          )}
        </div>
      </header>

      {/* ── Mobile slide-down menu ── */}
      {isMob && menuOpen && (
        <div className="mob-menu">
          {[
            { label:"Home",      action:() => { setView("home"); resetBook(); } },
            { label:"Book Now",  action:() => { setView("book"); setStep(1);  } },
            ...(staffUser ? [{ label:"Dashboard", action:() => setView("admin") }] : []),
          ].map(item => (
            <button key={item.label} className={`mob-nav-l ${view===item.label.toLowerCase().replace(" ","")?"on":""}`}
              onClick={item.action}>{item.label}</button>
          ))}
          {!staffUser && (
            <button className="mob-nav-l" onClick={() => { setShowLogin(true); setMenuOpen(false); }}>
              🔒 Staff Login
            </button>
          )}
        </div>
      )}

      {/* ══ HOME ══ */}
      {view === "home" && (
        <div>
          {/* Carousel */}
          <div className="hero">
            {SLIDES.map((s, i) => (
              <div key={i} className={`csl ${i===slide?"on":""}`}>
                <img src={s.url} alt={s.label} />
                <div className={`covl ${dark?"":"lt"}`} />
              </div>
            ))}
            <div className="hero-txt">
              <SubLabel>{SLIDES[slide].sub}</SubLabel>
              <h2 className="pf" style={{ fontSize: isMob?34:isTab?44:54, fontWeight:500,
                lineHeight:1.1, color:D.text, marginBottom:20 }}>
                {SLIDES[slide].label}
              </h2>
              <button className="btn-p" onClick={() => setView("book")}>Book Appointment</button>
            </div>
            <div className="hero-dots">
              {SLIDES.map((_, i) => <div key={i} className={`hdot ${i===slide?"on":""}`} onClick={() => setSlide(i)} />)}
            </div>
            <button className="harrow" style={{ left: isMob?8:24 }}
              onClick={() => setSlide(s => (s-1+SLIDES.length)%SLIDES.length)}>‹</button>
            <button className="harrow" style={{ right: isMob?8:24 }}
              onClick={() => setSlide(s => (s+1)%SLIDES.length)}>›</button>
          </div>

          {/* Services */}
          <div style={{ background:D.surf2, borderTop:`1px solid ${D.border}`,
            borderBottom:`1px solid ${D.border}`, padding:`${pySection} ${px}` }}>
            <SubLabel>Our Services</SubLabel>
            <h3 className="pf" style={{ fontSize: isMob?26:32, fontWeight:400, marginBottom:32, color:D.text }}>Crafted for You</h3>
            <div className="svc-grid" style={{ maxWidth:960, margin:"0 auto" }}>
              {SERVICES.map(s => (
                <div key={s.id} className="card" style={{ padding: isMob?"18px 16px":"28px 20px",
                  cursor:"pointer", textAlign: isMob?"left":"center" }}
                  onClick={() => { setSelSvc(s); setView("book"); setStep(2); }}>
                  <div style={{ fontSize: isMob?24:30, marginBottom:10 }}>{s.icon}</div>
                  <h4 className="pf" style={{ fontSize: isMob?16:18, fontWeight:400, marginBottom:6, color:D.text }}>{s.name}</h4>
                  {!isMob && <p style={{ fontSize:12, color:D.mid, lineHeight:1.6, marginBottom:12 }}>{s.desc}</p>}
                  <p className="pf" style={{ fontSize: isMob?18:22, color:D.gold }}>${s.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div style={{ padding:`${pySection} ${px}`, maxWidth:900, margin:"0 auto" }}>
            <SubLabel>Our Team</SubLabel>
            <h3 className="pf" style={{ fontSize: isMob?26:32, fontWeight:400, marginBottom:32, color:D.text }}>Meet the Artists</h3>
            <div className="team-grid">
              {STAFF.map(s => (
                <div key={s.id} className="card flat" style={{ padding: isMob?"16px":"28px 24px",
                  display:"flex", alignItems:"center", gap:16, flexDirection: isMob?"row":"column",
                  textAlign: isMob?"left":"center" }}>
                  <div className="av" style={{ width: isMob?44:64, height: isMob?44:64,
                    fontSize: isMob?14:18, background:"rgba(201,169,110,.12)", color:D.gold,
                    border:"1px solid rgba(201,169,110,.3)", flexShrink:0 }}>{s.avatar}</div>
                  <div>
                    <h4 className="pf" style={{ fontSize: isMob?17:20, fontWeight:400, color:D.text }}>{s.name}</h4>
                    <p style={{ fontSize:12, color:D.mid, marginTop:3 }}>{s.role}</p>
                    <p style={{ fontSize:11, color:D.dim, marginTop:4 }}>{s.since} experience</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ background:`linear-gradient(135deg, ${dark?"#1a1410":"#f5efe4"}, ${D.bg})`,
            borderTop:`1px solid ${D.border}`, padding:`${pySection} ${px}`, textAlign:"center" }}>
            <p className="pf" style={{ fontSize: isMob?26:36, fontWeight:400, color:D.text, marginBottom:10 }}>Ready for a new look?</p>
            <p style={{ fontSize:14, color:D.mid, marginBottom:24 }}>Book your appointment in under 2 minutes.</p>
            <button className="btn-p" onClick={() => setView("book")}>Reserve Your Spot</button>
          </div>
        </div>
      )}

      {/* ══ BOOKING FLOW ══ */}
      {view === "book" && !submitted && (
        <div style={{ maxWidth:820, margin:"0 auto", padding:`${pySection} ${px}` }}>
          {/* Step tracker */}
          <div className="step-tr" style={{ marginBottom: isMob?36:48, gap:0 }}>
            {[1,2,3,4].map((s,i) => (
              <div key={s} style={{ display:"flex", alignItems:"center" }}>
                <div className="step-d" style={{ background: step===s?D.gold:step>s?"#6b5a3e":D.border }} />
                {i<3 && <div className="step-ln" style={{ background: step>s?"#6b5a3e":D.border }} />}
              </div>
            ))}
          </div>

          {step===1 && (
            <div className="fu">
              <SubLabel>Step 1 of 4</SubLabel>
              {H("Select a Service")}
              <p style={{ color:D.mid, fontSize:14, margin:"8px 0 28px" }}>What would you like done today?</p>
              <div className="svc-pick">
                {SERVICES.map(s => (
                  <div key={s.id} className={`card ${selService?.id===s.id?"sel":""}`}
                    style={{ padding: isMob?"16px":"24px 20px", cursor:"pointer", display:"flex",
                      flexDirection: isMob?"row":"column", alignItems: isMob?"center":"flex-start", gap: isMob?12:0 }}
                    onClick={() => setSelSvc(s)}>
                    <div style={{ fontSize: isMob?24:28, marginBottom: isMob?0:10, flexShrink:0 }}>{s.icon}</div>
                    <div style={{ flex:1 }}>
                      <h3 className="pf" style={{ fontSize: isMob?16:20, fontWeight:400, color:D.text }}>{s.name}</h3>
                      {!isMob && <p style={{ fontSize:12, color:D.mid, margin:"6px 0 12px", lineHeight:1.6 }}>{s.desc}</p>}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop: isMob?4:0 }}>
                        <span style={{ fontSize:12, color:D.mid }}>{s.duration} min</span>
                        <span className="pf" style={{ fontSize: isMob?18:20, color:D.gold }}>${s.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:24 }}>
                <button className="btn-p" disabled={!selService} onClick={() => setStep(2)}>Continue →</button>
              </div>
            </div>
          )}

          {step===2 && (
            <div className="fu">
              <SubLabel>Step 2 of 4</SubLabel>
              {H("Choose Your Stylist")}
              <p style={{ color:D.mid, fontSize:14, margin:"8px 0 28px" }}>Who would you like to work with?</p>
              <div className="staff-pick">
                {STAFF.map(s => (
                  <div key={s.id} className={`card ${selStaff?.id===s.id?"sel":""}`}
                    style={{ padding: isMob?"14px 10px":"28px 20px", cursor:"pointer", textAlign:"center" }}
                    onClick={() => setSelStaff(s)}>
                    <div className="av" style={{ width: isMob?40:52, height: isMob?40:52,
                      fontSize: isMob?13:16, background: selStaff?.id===s.id?"rgba(201,169,110,.25)":"rgba(201,169,110,.08)",
                      color:D.gold, margin:"0 auto", marginBottom: isMob?8:14,
                      border:`1px solid ${selStaff?.id===s.id?"rgba(201,169,110,.6)":"rgba(201,169,110,.2)"}` }}>{s.avatar}</div>
                    <h3 className="pf" style={{ fontSize: isMob?14:18, fontWeight:400, color:D.text }}>{s.name}</h3>
                    <p style={{ fontSize:11, color:D.mid, marginTop:4 }}>{s.role}</p>
                    {!isMob && <p style={{ fontSize:11, color:D.dim, marginTop:4 }}>{s.since}</p>}
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:24 }}>
                <button className="btn-g" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-p" disabled={!selStaff} onClick={() => setStep(3)}>Continue →</button>
              </div>
            </div>
          )}

          {step===3 && (
            <div className="fu">
              <SubLabel>Step 3 of 4</SubLabel>
              {H("Pick a Date & Time")}
              <p style={{ color:D.mid, fontSize:14, margin:"8px 0 28px" }}>Choose when you'd like to come in</p>
              <div className="datetime-grid">
                {/* Calendar */}
                <div className="card flat" style={{ padding: isMob?16:24 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <button className="btn-ic" onClick={() => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1)}else setCalMonth(m=>m-1) }}>‹</button>
                    <p className="pf" style={{ fontSize:16, color:D.text }}>{MONTHS[calMonth]} {calYear}</p>
                    <button className="btn-ic" onClick={() => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1)}else setCalMonth(m=>m+1) }}>›</button>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:6 }}>
                    {DAYS.map(d => <p key={d} style={{ textAlign:"center", fontSize:10, color:D.dim, padding:"3px 0" }}>{d}</p>)}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                    {days.map((day,i) => {
                      const past = day && new Date(calYear,calMonth,day) < new Date(today.getFullYear(),today.getMonth(),today.getDate());
                      const tod  = day===today.getDate()&&calMonth===today.getMonth()&&calYear===today.getFullYear();
                      return (
                        <div key={i} className={`cd ${!day?"emp":""} ${past?"past":""} ${tod?"tod":""} ${selDate===day?"seld":""}`}
                          onClick={() => { if(!past&&day){setSelDate(day);setSelTime(null); } }}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Times */}
                <div>
                  <label className="lbl" style={{ marginBottom:12 }}>
                    {selDate ? `${MONTHS[calMonth].slice(0,3)} ${selDate} — Times` : "Select a date first"}
                  </label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8,
                    maxHeight: isMob?200:300, overflowY:"auto" }} className="sh">
                    {selDate ? TIME_SLOTS.map(t => (
                      <div key={t} className={`ts ${takenSlots.includes(t)?"bk":""} ${selTime===t?"act":""}`}
                        onClick={() => !takenSlots.includes(t) && setSelTime(t)}>{t}</div>
                    )) : (
                      <p style={{ fontSize:13, color:D.dim, gridColumn:"span 2", paddingTop:8 }}>
                        {isMob ? "↑ Pick a date above" : "← Pick a date"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:24 }}>
                <button className="btn-g" onClick={() => setStep(2)}>← Back</button>
                <button className="btn-p" disabled={!selDate||!selTime} onClick={() => setStep(4)}>Continue →</button>
              </div>
            </div>
          )}

          {step===4 && (
            <div className="fu">
              <SubLabel>Step 4 of 4</SubLabel>
              {H("Your Details")}
              <p style={{ color:D.mid, fontSize:14, margin:"8px 0 28px" }}>Almost there — just a few things</p>
              <div className="details-grid">
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {[{k:"name",l:"Full Name",ph:"Your full name",t:"text"},
                    {k:"email",l:"Email Address",ph:"you@example.com",t:"email"},
                    {k:"phone",l:"Phone Number",ph:"(555) 000-0000",t:"tel"}].map(f => (
                    <div key={f.k}>
                      <label className="lbl">{f.l}</label>
                      <input className="inp" type={f.t} placeholder={f.ph}
                        value={form[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))} />
                    </div>
                  ))}
                  <div>
                    <label className="lbl">Notes (optional)</label>
                    <textarea className="inp" placeholder="Any special requests..." rows={3}
                      style={{ resize:"none" }} value={form.notes}
                      onChange={e => setForm(p => ({...p,notes:e.target.value}))} />
                  </div>
                  {dbErr && <p style={{ fontSize:12, color:D.danger }}>{dbErr}</p>}
                </div>
                {/* Summary — always show on desktop, show below on mobile */}
                <div className="card flat" style={{ padding: isMob?20:28, height:"fit-content" }}>
                  <label className="lbl" style={{ marginBottom:16 }}>Booking Summary</label>
                  {[{l:"Service",v:selService?.name},{l:"Duration",v:`${selService?.duration} min`},
                    {l:"Stylist",v:selStaff?.name},{l:"Date",v:dateStr},{l:"Time",v:selTime}].map(item => (
                    <div key={item.l} style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                      <p style={{ fontSize:12, color:D.mid }}>{item.l}</p>
                      <p style={{ fontSize:13, color:D.text, textAlign:"right", maxWidth:160 }}>{item.v}</p>
                    </div>
                  ))}
                  <hr className="dv" style={{ margin:"14px 0" }} />
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <p style={{ fontSize:11, color:D.mid, letterSpacing:1 }}>TOTAL DUE</p>
                    <p className="pf" style={{ fontSize:26, color:D.gold }}>${selService?.price}</p>
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:24, flexWrap:"wrap", gap:12 }}>
                <button className="btn-g" onClick={() => setStep(3)}>← Back</button>
                <button className="btn-p" disabled={!form.name||!form.email||!form.phone||saving} onClick={handleBook}>
                  {saving ? <span style={{ display:"flex",alignItems:"center",gap:8 }}><span className="spin"/>Saving...</span> : "Confirm Booking ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ CONFIRMATION ══ */}
      {view==="book" && submitted && (
        <div style={{ maxWidth:560, margin:"0 auto", padding:`${pySection} ${px}`,
          textAlign:"center", position:"relative" }} className="fu">
          {[...Array(14)].map((_,i) => (
            <div key={i} className="cf" style={{ left:`${5+Math.random()*90}%`, top:`${Math.random()*15}%`,
              background:["#c9a96e","#f0ece4","#6b5a3e","#e8c88a"][i%4],
              animationDelay:`${Math.random()*.6}s`, animationDuration:`${2.5+Math.random()*2}s` }} />
          ))}
          <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(201,169,110,.12)",
            border:"1px solid rgba(201,169,110,.4)", display:"flex", alignItems:"center",
            justifyContent:"center", margin:"0 auto 20px", fontSize:26 }}>✦</div>
          <h2 className="pf" style={{ fontSize: isMob?32:42, fontWeight:400, color:D.gold, marginBottom:8 }}>You're Booked</h2>
          <p style={{ color:D.mid, fontSize:14, marginBottom:28 }}>Confirmation sent to {form.email}</p>
          <div className="card flat" style={{ padding: isMob?20:28, textAlign:"left" }}>
            <div className="confirm-grid">
              {[{l:"Service",v:selService?.name},{l:"Stylist",v:selStaff?.name},{l:"Date",v:dateStr},{l:"Time",v:selTime}].map(item => (
                <div key={item.l}>
                  <label className="lbl">{item.l}</label>
                  <p className="pf" style={{ fontSize: isMob?16:19, marginTop:3, color:D.text }}>{item.v}</p>
                </div>
              ))}
            </div>
            <hr className="dv" style={{ margin:"16px 0" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ fontSize:11, color:D.mid, letterSpacing:1 }}>TOTAL DUE AT APPOINTMENT</p>
              <p className="pf" style={{ fontSize:26, color:D.gold }}>${selService?.price}</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:24, flexWrap:"wrap" }}>
            <button className="btn-p" onClick={resetBook}>Book Again</button>
            <button className="btn-g" onClick={() => setView("home")}>Back to Home</button>
          </div>
        </div>
      )}

      {/* ══ ADMIN DASHBOARD ══ */}
      {view==="admin" && staffUser && (
        <div style={{ maxWidth:1000, margin:"0 auto", padding:`${pySection} ${px}` }} className="fu">
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
            marginBottom:32, flexWrap:"wrap", gap:16 }}>
            <div>
              <SubLabel>Staff Dashboard</SubLabel>
              {H("Appointments", isMob?26:36)}
              <p style={{ color:D.mid, fontSize:13, marginTop:4 }}>
                Logged in as <strong style={{ color:D.text }}>{staffUser.name}</strong>
                {!IS_CONFIGURED && <span style={{ color:D.gold }}> · Demo mode</span>}
              </p>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              {loading && <div className="spin" />}
              <button className="btn-g" style={{ padding:"9px 16px", fontSize:12 }} onClick={fetchBookings}>↻ Refresh</button>
              <button className="btn-p" style={{ padding:"9px 16px", fontSize:12 }} onClick={() => setView("book")}>+ New</button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom:28 }}>
            {[
              { l:"Total",   v: bookings.length },
              { l:"Clients", v: new Set(bookings.map(b=>b.email)).size },
              { l:"Today",   v: bookings.filter(b=>b.date===`${MONTHS[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`).length },
              { l:"Revenue", v: `$${revenue}` },
            ].map(s => (
              <div key={s.l} className="card flat" style={{ padding: isMob?"14px 16px":"18px 20px" }}>
                <p style={{ fontSize:10, letterSpacing:2, textTransform:"uppercase", color:D.mid }}>{s.l}</p>
                <p className="pf" style={{ fontSize: isMob?28:34, color:D.gold, lineHeight:1.1, marginTop:6 }}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Bookings table / cards */}
          <div className="card flat" style={{ overflow:"hidden" }}>
            {!isMob && (
              <div className="admin-tbl-hd">
                {(isDesk ? ["Client","Service","Stylist","Date","Time",""] : ["Client","Service","Date",""]).map((h,i) => (
                  <p key={i} style={{ fontSize:10, letterSpacing:2, textTransform:"uppercase", color:D.dim }}>{h}</p>
                ))}
              </div>
            )}
            <div style={{ padding: isMob?"0 12px":"0 16px" }}>
              {bookings.length===0 && (
                <p style={{ padding:"32px 0", color:D.dim, fontSize:13 }}>
                  {loading ? "Loading..." : "No appointments yet."}
                </p>
              )}
              {bookings.map(b => (
                isMob ? (
                  // Mobile card layout
                  <div key={b.id} style={{ padding:"14px 0", borderBottom:`1px solid ${D.border}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:14, color:D.text, fontWeight:500 }}>{b.name}</p>
                        <p style={{ fontSize:11, color:D.dim, marginTop:2 }}>{b.email}</p>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:8, flexWrap:"wrap" }}>
                          <span className="tag">{b.service}</span>
                          <span style={{ fontSize:12, color:D.mid }}>{b.staff}</span>
                        </div>
                        <div style={{ display:"flex", gap:12, marginTop:6 }}>
                          <span style={{ fontSize:12, color:D.mid }}>{b.date}</span>
                          <span style={{ fontSize:12, color:D.gold }}>{b.time}</span>
                        </div>
                      </div>
                      {staffUser.isAdmin && (
                        <button className="btn-ic" style={{ color:D.dim, fontSize:14, marginLeft:8 }}
                          onClick={() => handleDelete(b.id)} disabled={deleting===b.id}>
                          {deleting===b.id ? <span className="spin" style={{ width:13,height:13 }} /> : "✕"}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  // Tablet/Desktop row layout
                  <div key={b.id} className="admin-row">
                    <div>
                      <p style={{ fontSize:14, color:D.text, fontWeight:500 }}>{b.name}</p>
                      <p style={{ fontSize:11, color:D.dim, marginTop:2 }}>{b.email}</p>
                    </div>
                    <span className="tag">{b.service}</span>
                    {isDesk && <p style={{ fontSize:13, color:D.mid }}>{b.staff}</p>}
                    <p style={{ fontSize:13, color:D.mid }}>{b.date}</p>
                    {isDesk && <p style={{ fontSize:13, color:D.gold }}>{b.time}</p>}
                    {staffUser.isAdmin && (
                      <button className="btn-ic" style={{ color:D.dim, fontSize:14 }}
                        onClick={() => handleDelete(b.id)} disabled={deleting===b.id}>
                        {deleting===b.id ? <span className="spin" style={{ width:13,height:13 }} /> : "✕"}
                      </button>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Non-staff admin redirect ── */}
      {view==="admin" && !staffUser && (
        <div style={{ textAlign:"center", padding:`80px ${px}` }} className="fu">
          <div style={{ fontSize:44, marginBottom:16 }}>🔒</div>
          <h2 className="pf" style={{ fontSize: isMob?24:30, fontWeight:400, color:D.text, marginBottom:10 }}>Staff Access Only</h2>
          <p style={{ color:D.mid, fontSize:14, marginBottom:24 }}>Sign in to view the dashboard.</p>
          <button className="btn-p" onClick={() => setShowLogin(true)}>Staff Sign In</button>
        </div>
      )}

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop:`1px solid ${D.border}`, padding:`28px ${px}`, marginTop:48 }}>
        <div className="footer-inner">
          <div>
            <h1 className="pf" style={{ fontSize:16, fontWeight:400, letterSpacing:4, color:D.text }}>LUMIÈRE</h1>
            <p style={{ fontSize:11, color:D.dim, marginTop:3 }}>Hair & Beauty Studio</p>
          </div>
          {!isMob && <p style={{ fontSize:12, color:D.dim }}>© {today.getFullYear()} Lumière. All rights reserved.</p>}
          <div style={{ display:"flex", gap: isMob?16:24, flexWrap:"wrap" }}>
            <button className="nav-l" onClick={() => setView("book")}>Book Now</button>
            <button className="nav-l" onClick={() => setShowLogin(true)} style={{ color:D.dim }}>Staff Login</button>
          </div>
          {isMob && <p style={{ fontSize:11, color:D.dim }}>© {today.getFullYear()} Lumière.</p>}
        </div>
      </footer>
    </div>
  );
}

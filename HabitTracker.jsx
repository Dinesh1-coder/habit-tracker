import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const DEFAULT_HABITS = [
  "Morning Meditation","Exercise","Read 30 min","Drink Water",
  "No Social Media","Journal","Healthy Eating","Sleep 8hrs",
  "Gratitude","Cold Shower",
];

const QUOTES = [
  "Small steps every day lead to big changes.",
  "Discipline is choosing between what you want now and what you want most.",
  "We are what we repeatedly do. Excellence is a habit.",
  "Your future is created by what you do today, not tomorrow.",
  "Motivation gets you started. Habit keeps you going.",
  "The secret of your future is hidden in your daily routine.",
];

const WEEK_COLORS = ["#a8d8ea","#ffd3b6","#b8f0b8","#e8c8f0","#ffeaa7"];
const PALETTE = [
  "#7EC8E3","#F7B731","#A29BFE","#55EFC4","#FD79A8",
  "#FDCB6E","#74B9FF","#00CEC9","#E17055","#6C5CE7",
  "#FF7675","#00B894","#E84393","#0984E3","#B2BEC3",
];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getMonthName(m) {
  return ["January","February","March","April","May","June",
    "July","August","September","October","November","December"][m];
}
function loadData(k, fb) {
  try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; }
}
function saveData(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}
function habitColor(i) { return PALETTE[i % PALETTE.length]; }

// ── Circular Progress ──────────────────────────────────────────────────────────
function CircularProgress({ pct, size=100, stroke=8, color="#7EC8E3", label, sublabel }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:"stroke-dasharray .6s cubic-bezier(.4,0,.2,1)" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", textAlign:"center" }}>
        {label && <span style={{ fontWeight:700, fontSize:size>80?16:11, color:"var(--fg)" }}>{label}</span>}
        {sublabel && <span style={{ fontSize:9, color:"var(--muted)", marginTop:1 }}>{sublabel}</span>}
      </div>
    </div>
  );
}

function MiniBar({ pct, color }) {
  return (
    <div style={{ background:"var(--track)", borderRadius:99, height:6, overflow:"hidden", flex:1 }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width .6s ease" }}/>
    </div>
  );
}

// ── Add Modal ──────────────────────────────────────────────────────────────────
function AddHabitModal({ onAdd, onClose, dark }) {
  const [name, setName] = useState("");
  const ref = useRef();
  useEffect(() => { ref.current?.focus(); }, []);
  const submit = () => { const t = name.trim(); if (!t) return; onAdd(t); onClose(); };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)" }}
      onClick={onClose}>
      <div style={{ background:dark?"#20243a":"#fff", borderRadius:24, padding:32, width:360,
        boxShadow:"0 24px 80px rgba(0,0,0,.3)", border:"1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:32, textAlign:"center", marginBottom:12 }}>✨</div>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:20,
          textAlign:"center", marginBottom:6 }}>Add New Habit</div>
        <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", marginBottom:20 }}>
          Added everywhere — grid, charts, streaks & summary</div>
        <input ref={ref} value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key==="Enter" && submit()}
          placeholder="e.g. Drink Green Tea, Evening Walk..."
          style={{ width:"100%", padding:"12px 16px", borderRadius:12, fontSize:13,
            border:"1.5px solid var(--border)", background:"var(--track)", color:"var(--fg)",
            outline:"none", marginBottom:16 }}/>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:12,
            border:"1.5px solid var(--border)", background:"transparent", color:"var(--muted)",
            cursor:"pointer", fontSize:13, fontWeight:600 }}>Cancel</button>
          <button onClick={submit} style={{ flex:2, padding:"12px", borderRadius:12,
            border:"none", background:"linear-gradient(135deg,#7EC8E3,#A29BFE)", color:"#fff",
            cursor:"pointer", fontSize:13, fontWeight:700 }}>+ Add Habit</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
function EditHabitModal({ habit, onSave, onClose, dark }) {
  const [name, setName] = useState(habit);
  const ref = useRef();
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  const submit = () => { const t = name.trim(); if (!t) return; onSave(t); onClose(); };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)" }}
      onClick={onClose}>
      <div style={{ background:dark?"#20243a":"#fff", borderRadius:24, padding:32, width:360,
        boxShadow:"0 24px 80px rgba(0,0,0,.3)", border:"1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:32, textAlign:"center", marginBottom:12 }}>✏️</div>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:20,
          textAlign:"center", marginBottom:20 }}>Edit Habit Name</div>
        <input ref={ref} value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key==="Enter" && submit()}
          style={{ width:"100%", padding:"12px 16px", borderRadius:12, fontSize:13,
            border:"1.5px solid var(--border)", background:"var(--track)", color:"var(--fg)",
            outline:"none", marginBottom:16 }}/>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:12,
            border:"1.5px solid var(--border)", background:"transparent", color:"var(--muted)",
            cursor:"pointer", fontSize:13, fontWeight:600 }}>Cancel</button>
          <button onClick={submit} style={{ flex:2, padding:"12px", borderRadius:12,
            border:"none", background:"linear-gradient(135deg,#F7B731,#FD79A8)", color:"#fff",
            cursor:"pointer", fontSize:13, fontWeight:700 }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
function ConfirmModal({ habit, onConfirm, onClose, dark }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)" }}
      onClick={onClose}>
      <div style={{ background:dark?"#20243a":"#fff", borderRadius:24, padding:32, width:340,
        boxShadow:"0 24px 80px rgba(0,0,0,.3)", border:"1px solid var(--border)", textAlign:"center" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:40, marginBottom:12 }}>🗑️</div>
        <div style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:20, marginBottom:10 }}>
          Delete Habit?</div>
        <div style={{ fontSize:13, color:"var(--muted)", marginBottom:24, lineHeight:1.7,
          background:"var(--track)", padding:"12px 16px", borderRadius:12 }}>
          "<strong style={{ color:"var(--fg)" }}>{habit}</strong>"<br/>
          <span style={{ fontSize:11 }}>All tracking data will be permanently removed.</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:12,
            border:"1.5px solid var(--border)", background:"transparent", color:"var(--muted)",
            cursor:"pointer", fontSize:13, fontWeight:600 }}>Keep it</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ flex:1, padding:"12px",
            borderRadius:12, border:"none", background:"linear-gradient(135deg,#E17055,#FD79A8)",
            color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Small Add Button ───────────────────────────────────────────────────────────
function AddBtn({ onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 12px",
        borderRadius:99, border:"1.5px dashed #7EC8E3",
        background: h ? "#7EC8E322" : "#7EC8E311",
        color:"#7EC8E3", cursor:"pointer", fontSize:11, fontWeight:700,
        transition:"all .2s", whiteSpace:"nowrap", flexShrink:0 }}>
      + Add
    </button>
  );
}

// ── Hover Action Buttons ───────────────────────────────────────────────────────
function HabitActions({ onEdit, onDelete }) {
  return (
    <div className="habit-actions" style={{ display:"flex", gap:3,
      opacity:0, transition:"opacity .2s", flexShrink:0 }}>
      <button onClick={onEdit} title="Edit"
        style={{ width:20, height:20, borderRadius:6, border:"none",
          background:"#F7B73122", color:"#F7B731", cursor:"pointer",
          fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}>✏️</button>
      <button onClick={onDelete} title="Delete"
        style={{ width:20, height:20, borderRadius:6, border:"none",
          background:"#E1705522", color:"#E17055", cursor:"pointer",
          fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}>🗑️</button>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function HabitTracker() {
  const today = new Date();
  const [dark, setDark] = useState(() => loadData("ht_dark", false));
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [grid, setGrid] = useState(() => loadData("ht_grid", {}));
  const [habits, setHabits] = useState(() => loadData("ht_habits", DEFAULT_HABITS));
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [modal, setModal] = useState(null);

  useEffect(() => { saveData("ht_dark", dark); }, [dark]);
  useEffect(() => { saveData("ht_grid", grid); }, [grid]);
  useEffect(() => { saveData("ht_habits", habits); }, [habits]);
  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 8000);
    return () => clearInterval(t);
  }, []);

  const days = getDaysInMonth(year, month);
  const key = useCallback((h, d) => `${year}-${month}-${h}-${d}`, [year, month]);

  const toggle = useCallback((h, d) => {
    setGrid(g => ({ ...g, [key(h, d)]: !g[key(h, d)] }));
  }, [key]);

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const addHabit = (name) => setHabits(h => [...h, name]);

  const editHabit = (idx, newName) =>
    setHabits(h => h.map((v, i) => i === idx ? newName : v));

  const deleteHabit = (idx) => {
    setGrid(g => {
      const ng = {};
      Object.entries(g).forEach(([k, v]) => {
        const parts = k.split("-");
        const hi = parseInt(parts[2]);
        if (hi === idx) return;
        if (hi > idx) { parts[2] = String(hi - 1); ng[parts.join("-")] = v; }
        else ng[k] = v;
      });
      return ng;
    });
    setHabits(h => h.filter((_, i) => i !== idx));
  };

  const openAdd    = () => setModal({ type:"add" });
  const openEdit   = (idx) => setModal({ type:"edit", idx });
  const openDelete = (idx) => setModal({ type:"delete", idx });
  const closeModal = () => setModal(null);

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const habitCompletions = habits.map((_, hi) => {
    let count = 0;
    for (let d = 1; d <= days; d++) if (grid[key(hi, d)]) count++;
    return count;
  });

  const dayCompletions = Array.from({ length: days }, (_, di) => {
    let count = 0;
    habits.forEach((_, hi) => { if (grid[key(hi, di+1)]) count++; });
    return { day:di+1, count, pct: habits.length ? Math.round((count/habits.length)*100) : 0 };
  });

  const totalDone     = habitCompletions.reduce((a, b) => a + b, 0);
  const totalPossible = habits.length * days;
  const overallPct    = totalPossible ? ((totalDone / totalPossible) * 100).toFixed(1) : "0.0";

  const weeklyData = Array.from({ length:5 }, (_, wi) => {
    let total = 0, possible = 0;
    for (let d = wi*7+1; d <= Math.min((wi+1)*7, days); d++) {
      total    += dayCompletions[d-1]?.count ?? 0;
      possible += habits.length;
    }
    return { name:`Wk ${wi+1}`, value: possible ? Math.round((total/possible)*100) : 0, color:WEEK_COLORS[wi] };
  });

  const streaks = habits.map((_, hi) => {
    let max = 0, cur = 0;
    for (let d = 1; d <= days; d++) {
      if (grid[key(hi, d)]) { cur++; max = Math.max(max, cur); } else cur = 0;
    }
    return max;
  });

  const topHabits = habits
    .map((name, i) => ({ name, idx:i, pct: days ? Math.round((habitCompletions[i]/days)*100) : 0, color:habitColor(i) }))
    .sort((a, b) => b.pct - a.pct);

  const weekColorForDay = (d) => WEEK_COLORS[Math.floor((d-1)/7) % 5];
  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  // ── Theme ─────────────────────────────────────────────────────────────────────
  const theme = dark ? {
    "--bg":"#0f1117","--surface":"#1a1d27","--card":"#20243a",
    "--fg":"#e8eaf6","--muted":"#7b82a8","--track":"#2a2f4a","--border":"#2e3354",
  } : {
    "--bg":"#f0f4ff","--surface":"#ffffff","--card":"#ffffff",
    "--fg":"#1a1d2e","--muted":"#8890b0","--track":"#e8ecf8","--border":"#e0e6f5",
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:wght@700;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    :root{${Object.entries(theme).map(([k,v])=>`${k}:${v}`).join(";")}}
    body{background:var(--bg);color:var(--fg);font-family:'DM Sans',sans-serif;transition:background .3s,color .3s}
    .card{background:var(--card);border-radius:20px;
      box-shadow:0 2px 20px rgba(0,0,0,${dark?.1:.06});
      border:1px solid var(--border);padding:20px;transition:background .3s,box-shadow .3s}
    .card:hover{box-shadow:0 6px 30px rgba(0,0,0,${dark?.18:.1})}
    .grid-cell{width:22px;height:22px;border-radius:6px;cursor:pointer;
      border:1.5px solid var(--border);display:flex;align-items:center;
      justify-content:center;transition:all .15s;flex-shrink:0}
    .grid-cell:hover{transform:scale(1.2);border-color:#7EC8E3}
    .grid-cell.done{border-color:transparent}
    .habit-row:hover .habit-actions{opacity:1!important}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
    .fade-up{animation:fadeUp .5s ease both}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px}
    button:active{transform:scale(.97)}
  `;

  // ── Empty state helper ────────────────────────────────────────────────────────
  const Empty = ({ msg }) => (
    <div style={{ textAlign:"center", padding:"20px 0", color:"var(--muted)",
      fontSize:12, fontStyle:"italic" }}>{msg}</div>
  );

  return (
    <>
      <style>{css}</style>

      {/* Modals */}
      {modal?.type==="add"    && <AddHabitModal    dark={dark} onAdd={addHabit} onClose={closeModal}/>}
      {modal?.type==="edit"   && <EditHabitModal   dark={dark} habit={habits[modal.idx]}
        onSave={n => editHabit(modal.idx, n)} onClose={closeModal}/>}
      {modal?.type==="delete" && <ConfirmModal     dark={dark} habit={habits[modal.idx]}
        onConfirm={() => deleteHabit(modal.idx)} onClose={closeModal}/>}

      <div style={{ minHeight:"100vh", padding:"20px", background:"var(--bg)" }}>

        {/* ── Header ── */}
        <div className="fade-up" style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12,
              background:"linear-gradient(135deg,#7EC8E3,#A29BFE)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🌱</div>
            <div>
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:22,
                background:"linear-gradient(135deg,#7EC8E3,#A29BFE)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>HabitFlow</div>
              <div style={{ fontSize:11, color:"var(--muted)" }}>Your daily growth companion</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Big Add button in header */}
            <button onClick={openAdd}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 18px",
                borderRadius:99, border:"none",
                background:"linear-gradient(135deg,#7EC8E3,#A29BFE)", color:"#fff",
                cursor:"pointer", fontSize:13, fontWeight:700, boxShadow:"0 4px 14px #7EC8E366" }}>
              + Add Habit
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"var(--surface)",
              borderRadius:99, padding:"6px 14px", border:"1px solid var(--border)" }}>
              <button onClick={prevMonth} style={{ background:"none", border:"none",
                cursor:"pointer", color:"var(--muted)", fontSize:14, padding:"0 2px" }}>‹</button>
              <span style={{ fontSize:13, fontWeight:600, color:"var(--fg)",
                minWidth:110, textAlign:"center" }}>{getMonthName(month)} {year}</span>
              <button onClick={nextMonth} style={{ background:"none", border:"none",
                cursor:"pointer", color:"var(--muted)", fontSize:14, padding:"0 2px" }}>›</button>
            </div>
            <button onClick={() => setDark(d=>!d)}
              style={{ width:38, height:38, borderRadius:99, background:"var(--surface)",
                border:"1px solid var(--border)", cursor:"pointer", fontSize:17,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
              {dark?"☀️":"🌙"}
            </button>
          </div>
        </div>

        {/* ── Row 1: Left + Chart + Progress ── */}
        <div style={{ display:"grid", gridTemplateColumns:"220px 1fr 230px", gap:16, marginBottom:16 }}>

          {/* Left Panel */}
          <div className="card fade-up" style={{ animationDelay:".05s", display:"flex",
            flexDirection:"column", gap:14 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ width:64, height:64, borderRadius:99,
                background:"linear-gradient(135deg,#ffd3b6,#a8d8ea)",
                margin:"0 auto 10px", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:30 }}>🦋</div>
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:15 }}>
                {getMonthName(month)} {year}</div>
              <div style={{ fontSize:11, color:"var(--muted)", marginTop:4, lineHeight:1.5,
                fontStyle:"italic", animation:"pulse 4s ease infinite" }}>
                "{QUOTES[quoteIdx]}"</div>
            </div>

            <div>
              <div style={{ display:"flex", alignItems:"center",
                justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:600, color:"var(--muted)",
                  textTransform:"uppercase", letterSpacing:1 }}>Daily Habits</span>
                <AddBtn onClick={openAdd}/>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {habits.map((h, i) => (
                  <div key={i} className="habit-row"
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"2px 0" }}>
                    <div style={{ width:8, height:8, borderRadius:99,
                      background:habitColor(i), flexShrink:0 }}/>
                    <span style={{ fontSize:11, flex:1, overflow:"hidden",
                      textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h}</span>
                    <span style={{ fontSize:10, color:"var(--muted)", fontWeight:600 }}>
                      {habitCompletions[i]}d</span>
                    <HabitActions onEdit={()=>openEdit(i)} onDelete={()=>openDelete(i)}/>
                  </div>
                ))}
              </div>
              {habits.length===0 && <Empty msg="No habits yet. Add one! 🌱"/>}
            </div>
          </div>

          {/* Area Chart */}
          <div className="card fade-up" style={{ animationDelay:".1s" }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:16 }}>
              <div>
                <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:16 }}>
                  Daily Activity</div>
                <div style={{ fontSize:11, color:"var(--muted)" }}>
                  {habits.length} habits tracked · {getMonthName(month)} {year}</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={dayCompletions} margin={{ top:4,right:4,bottom:0,left:-20 }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7EC8E3" stopOpacity={.4}/>
                    <stop offset="95%" stopColor="#7EC8E3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="day" tick={{ fontSize:10,fill:"var(--muted)" }}
                  axisLine={false} tickLine={false} interval={4}/>
                <YAxis tick={{ fontSize:10,fill:"var(--muted)" }} axisLine={false}
                  tickLine={false} domain={[0, Math.max(habits.length,1)]}/>
                <Tooltip contentStyle={{ background:"var(--card)",
                  border:"1px solid var(--border)", borderRadius:12,fontSize:12 }}
                  labelFormatter={l=>`Day ${l}`} formatter={v=>[`${v} habits`,"Done"]}/>
                <Area type="monotone" dataKey="count" stroke="#7EC8E3" strokeWidth={2.5}
                  fill="url(#ag)" dot={false} activeDot={{ r:4,fill:"#7EC8E3" }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Progress Ring */}
          <div className="card fade-up" style={{ animationDelay:".15s", display:"flex",
            flexDirection:"column", gap:16, alignItems:"center", justifyContent:"center" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:36,
                background:"linear-gradient(135deg,#A29BFE,#7EC8E3)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                {overallPct}%</div>
              <div style={{ fontSize:11, color:"var(--muted)" }}>Monthly Progress</div>
            </div>
            <CircularProgress pct={parseFloat(overallPct)} size={120} stroke={10}
              color="#A29BFE" label={`${totalDone}`} sublabel={`/ ${totalPossible}`}/>
            <div style={{ width:"100%", background:"var(--track)", borderRadius:12,
              padding:"10px 14px" }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                fontSize:11, marginBottom:6 }}>
                <span style={{ color:"var(--muted)" }}>Completed</span>
                <span style={{ fontWeight:600, color:"#55EFC4" }}>{totalDone}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}>
                <span style={{ color:"var(--muted)" }}>Remaining</span>
                <span style={{ fontWeight:600, color:"#FD79A8" }}>{totalPossible-totalDone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Weekly + Top Habits + Streaks ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 270px 230px", gap:16, marginBottom:16 }}>

          {/* Weekly Bar */}
          <div className="card fade-up" style={{ animationDelay:".2s" }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:15, marginBottom:14 }}>
              Weekly Breakdown</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData} margin={{ top:4,right:4,bottom:0,left:-20 }} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize:11,fill:"var(--muted)" }}
                  axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{ fontSize:10,fill:"var(--muted)" }}
                  axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                <Tooltip contentStyle={{ background:"var(--card)",
                  border:"1px solid var(--border)", borderRadius:12,fontSize:12 }}
                  formatter={v=>[`${v}%`,"Completion"]}/>
                <Bar dataKey="value" radius={[8,8,0,0]}>
                  {weeklyData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              {weeklyData.map((w,i)=>(
                <div key={i} style={{ flex:1, textAlign:"center" }}>
                  <CircularProgress pct={w.value} size={40} stroke={5}
                    color={w.color} label={`${w.value}%`}/>
                </div>
              ))}
            </div>
          </div>

          {/* Top Habits */}
          <div className="card fade-up" style={{ animationDelay:".25s" }}>
            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:15 }}>
                Top Habits 🏆</div>
              <AddBtn onClick={openAdd}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {topHabits.map((h,i)=>(
                <div key={h.idx} className="habit-row"
                  style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:"var(--muted)",
                    width:14, textAlign:"right" }}>{i+1}</span>
                  <div style={{ width:6,height:6,borderRadius:99,
                    background:h.color,flexShrink:0 }}/>
                  <span style={{ fontSize:11,flex:1,overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{h.name}</span>
                  <MiniBar pct={h.pct} color={h.color}/>
                  <span style={{ fontSize:10,fontWeight:600,color:"var(--muted)",
                    width:30,textAlign:"right" }}>{h.pct}%</span>
                  <HabitActions onEdit={()=>openEdit(h.idx)} onDelete={()=>openDelete(h.idx)}/>
                </div>
              ))}
            </div>
            {habits.length===0 && <Empty msg="Add habits to see rankings!"/>}
          </div>

          {/* Streaks */}
          <div className="card fade-up" style={{ animationDelay:".3s" }}>
            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:15 }}>
                Streaks 🔥</div>
              <AddBtn onClick={openAdd}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {habits.map((h,i)=>(
                <div key={i} className="habit-row"
                  style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11,flex:1,overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{h}</span>
                  <span style={{ fontSize:13 }}>🔥</span>
                  <span style={{ fontSize:12,fontWeight:700,minWidth:16,
                    color:streaks[i]>=7?"#F7B731":streaks[i]>=3?"#55EFC4":"var(--muted)" }}>
                    {streaks[i]}
                  </span>
                  <HabitActions onEdit={()=>openEdit(i)} onDelete={()=>openDelete(i)}/>
                </div>
              ))}
            </div>
            {habits.length===0 && <Empty msg="No habits yet!"/>}
          </div>
        </div>

        {/* ── Row 3: Habit Grid ── */}
        <div className="card fade-up" style={{ animationDelay:".35s",
          marginBottom:16, overflowX:"auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:16 }}>
                Habit Tracker Grid</div>
              <div style={{ fontSize:11, color:"var(--muted)" }}>
                Click cell to toggle · Hover row for edit/delete</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ display:"flex", gap:8 }}>
                {WEEK_COLORS.map((c,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{ width:10,height:10,borderRadius:3,background:c }}/>
                    <span style={{ fontSize:10,color:"var(--muted)" }}>Wk{i+1}</span>
                  </div>
                ))}
              </div>
              <AddBtn onClick={openAdd}/>
            </div>
          </div>

          <div style={{ minWidth: 170 + days*26 }}>
            {/* Day numbers */}
            <div style={{ display:"flex", gap:4, marginBottom:6, marginLeft:164 }}>
              {Array.from({length:days},(_,d)=>(
                <div key={d} style={{ width:22,height:22,display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:9,color:"var(--muted)",fontWeight:600,
                  flexShrink:0,
                  background:d+1===today.getDate()&&month===today.getMonth()&&
                    year===today.getFullYear()?"#7EC8E326":"transparent",
                  borderRadius:6 }}>{d+1}</div>
              ))}
            </div>

            {/* Habit rows */}
            {habits.map((habit,hi)=>(
              <div key={hi} className="habit-row"
                style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5 }}>
                <div style={{ width:160,display:"flex",alignItems:"center",
                  gap:6,flexShrink:0 }}>
                  <div style={{ width:8,height:8,borderRadius:99,
                    background:habitColor(hi),flexShrink:0 }}/>
                  <span style={{ fontSize:11,fontWeight:500,flex:1,overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{habit}</span>
                  <HabitActions onEdit={()=>openEdit(hi)} onDelete={()=>openDelete(hi)}/>
                </div>
                {Array.from({length:days},(_,di)=>{
                  const done = grid[key(hi,di+1)];
                  const wc   = weekColorForDay(di+1);
                  return (
                    <div key={di} className={`grid-cell${done?" done":""}`}
                      style={{ background:done?wc:"transparent", opacity:done?1:.45 }}
                      onClick={()=>toggle(hi,di+1)}
                      title={`${habit} — Day ${di+1}`}>
                      {done && <span style={{ fontSize:10 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            ))}

            {habits.length===0 && (
              <div style={{ textAlign:"center",padding:"40px 0",
                color:"var(--muted)",fontSize:13,fontStyle:"italic" }}>
                No habits to track. Click "+ Add Habit" to get started! 🌱
              </div>
            )}
          </div>
        </div>

        {/* ── Row 4: Summary Table ── */}
        <div className="card fade-up" style={{ animationDelay:".4s" }}>
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, fontSize:16 }}>
              Daily Progress Summary</div>
            <AddBtn onClick={openAdd}/>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ color:"var(--muted)", textTransform:"uppercase",
                  fontSize:10, letterSpacing:.5 }}>
                  {["Habit","Goal","% Done","Days Done","Streak","Actions"].map(h=>(
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left",
                      fontWeight:600, borderBottom:"1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((h,i)=>(
                  <tr key={i} style={{ borderBottom:"1px solid var(--track)" }}>
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:8,height:8,borderRadius:99,background:habitColor(i) }}/>
                        <span style={{ fontWeight:500 }}>{h}</span>
                      </div>
                    </td>
                    <td style={{ padding:"10px 12px", color:"var(--muted)" }}>{days}d</td>
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1,background:"var(--track)",borderRadius:99,
                          height:6,maxWidth:80 }}>
                          <div style={{ width:`${days?Math.round((habitCompletions[i]/days)*100):0}%`,
                            height:"100%",background:habitColor(i),borderRadius:99,
                            transition:"width .6s" }}/>
                        </div>
                        <span style={{ fontWeight:600,color:habitColor(i),minWidth:34 }}>
                          {days?Math.round((habitCompletions[i]/days)*100):0}%</span>
                      </div>
                    </td>
                    <td style={{ padding:"10px 12px", fontWeight:600 }}>{habitCompletions[i]}</td>
                    <td style={{ padding:"10px 12px" }}>
                      <span style={{ display:"inline-flex",alignItems:"center",gap:4,
                        background:streaks[i]>=7?"#F7B73122":streaks[i]>=3?"#55EFC422":"var(--track)",
                        padding:"3px 10px",borderRadius:99,fontWeight:700,
                        color:streaks[i]>=7?"#F7B731":streaks[i]>=3?"#55EFC4":"var(--muted)" }}>
                        🔥 {streaks[i]}
                      </span>
                    </td>
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>openEdit(i)}
                          style={{ padding:"5px 12px",borderRadius:8,
                            border:"1px solid #F7B731",background:"#F7B73111",
                            color:"#F7B731",cursor:"pointer",fontSize:11,fontWeight:600 }}>
                          ✏️ Edit
                        </button>
                        <button onClick={()=>openDelete(i)}
                          style={{ padding:"5px 12px",borderRadius:8,
                            border:"1px solid #E17055",background:"#E1705511",
                            color:"#E17055",cursor:"pointer",fontSize:11,fontWeight:600 }}>
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {habits.length===0 && (
              <div style={{ textAlign:"center",padding:"30px",
                color:"var(--muted)",fontSize:13,fontStyle:"italic" }}>
                No habits yet. Click "+ Add Habit" to begin! 🚀
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center",marginTop:24,color:"var(--muted)",fontSize:11 }}>
          HabitFlow · {getMonthName(month)} {year} · {habits.length} habits · {totalDone} completions
        </div>
      </div>
    </>
  );
}

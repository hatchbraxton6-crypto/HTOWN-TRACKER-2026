import { useState, useEffect, useRef } from "react";

// ── Month color palette ───────────────────────────────────────────
const MONTH_COLORS = {
  "Apr": { bg: "#1a1a0a", border: "#6e6e1e", text: "#c8c820", badge: "#2a2a0a" },
  "May": { bg: "#0a1a2a", border: "#1e4a6e", text: "#20a0c8", badge: "#0a1a2a" },
  "Jun": { bg: "#1a0a2a", border: "#4e1e6e", text: "#a020c8", badge: "#1a0a2a" },
  "Jul": { bg: "#2a0a0a", border: "#6e1e1e", text: "#c82020", badge: "#2a0a0a" },
  "Aug": { bg: "#0a2a1a", border: "#1e6e4e", text: "#20c880", badge: "#0a2a1a" },
};
const DEFAULT_COLOR = { bg: "#141414", border: "#2a2a2a", text: "#888", badge: "#1a1a1a" };

function getMonthTag(label) {
  const match = label.match(/^([A-Za-z]+)/);
  return match ? match[1] : null;
}
function monthColor(label) {
  const tag = getMonthTag(label);
  return MONTH_COLORS[tag] || DEFAULT_COLOR;
}

// ── Seed data ─────────────────────────────────────────────────────
const SEED_WEEKS = [
  {
    id: 1, label: "Apr Wk 1", dates: "3/30/26 – 4/5/26", month: "April",
    reps: [
      { name: "Braxton H",    accounts: 16, acv: 1029 },
      { name: "Hannemann W",  accounts: 16, acv: 1045 },
      { name: "Salsabil F",   accounts: 8,  acv: 1088 },
      { name: "Anthony V",    accounts: 7,  acv: 1201 },
      { name: "Kevin J",      accounts: 7,  acv: 1104 },
      { name: "Burkley P",    accounts: 5,  acv: 1260 },
      { name: "Will G ☠️",    accounts: 2,  acv: 1271 },
    ],
  },
  {
    id: 2, label: "Apr Wk 2", dates: "4/6/26 – 4/12/26", month: "April",
    reps: [
      { name: "Braxton H",    accounts: 15, acv: 1136 },
      { name: "Anthony V",    accounts: 13, acv: 1005 },
      { name: "Salsabil F",   accounts: 10, acv: 1088 },
      { name: "Hannemann W",  accounts: 8,  acv: 1007 },
      { name: "Kevin J",      accounts: 7,  acv: 984  },
      { name: "Burkley P",    accounts: 6,  acv: 1291 },
      { name: "Reese H",      accounts: 5,  acv: 1009 },
      { name: "Will G ☠️",    accounts: 2,  acv: 1091 },
    ],
  },
  {
    id: 3, label: "Apr Wk 3", dates: "4/13/26 – 4/19/26", month: "April",
    reps: [
      { name: "Hannemann W",  accounts: 20, acv: 1171 },
      { name: "Anthony V",    accounts: 12, acv: 1103 },
      { name: "Burkley P",    accounts: 8,  acv: 1182 },
      { name: "Braxton H",    accounts: 5,  acv: 1017 },
      { name: "Salsabil F",   accounts: 5,  acv: 1213 },
      { name: "Kevin J",      accounts: 5,  acv: 1241 },
      { name: "Reese H",      accounts: 4,  acv: 1646 },
    ],
  },
  {
    id: 4, label: "Apr Wk 4", dates: "4/20/26 – 4/26/26", month: "April",
    reps: [
      { name: "Hannemann W",  accounts: 21, acv: 1035 },
      { name: "Braxton H",    accounts: 15, acv: 1013 },
      { name: "Reese H",      accounts: 13, acv: 1108 },
      { name: "Anthony V",    accounts: 12, acv: 1059 },
      { name: "Burkley P",    accounts: 10, acv: 1124 },
      { name: "Kevin J",      accounts: 10, acv: 1008 },
      { name: "Salsabil F",   accounts: 7,  acv: 1021 },
      { name: "Seth T",       accounts: 2,  acv: 993  },
    ],
  },
  {
    id: 5, label: "May Wk 1", dates: "4/27/26 – 5/3/26", month: "May",
    reps: [
      { name: "Salsabil F",   accounts: 20, acv: 1017 },
      { name: "Braxton H",    accounts: 17, acv: 1026 },
      { name: "Hannemann W",  accounts: 15, acv: 1024 },
      { name: "Kevin J",      accounts: 13, acv: 1011 },
      { name: "Reese H",      accounts: 12, acv: 1043 },
      { name: "Anthony V",    accounts: 10, acv: 1040 },
      { name: "Burkley P",    accounts: 6,  acv: 993  },
      { name: "Seth T",       accounts: 4,  acv: 1023 },
    ],
  },
];

const STORAGE_KEY = "htown_south_full_v3";
const GOAL_KEY = "htown_south_goal";
const fmt$ = (n) => "$" + Math.round(n).toLocaleString();
const repRev = (r) => r.accounts * r.acv;

function weekTotals(w) {
  const accounts = w.reps.reduce((a, r) => a + r.accounts, 0);
  const revenue = w.reps.reduce((a, r) => a + repRev(r), 0);
  return { accounts, revenue };
}

function groupByMonth(weeks) {
  const map = {};
  weeks.forEach(w => {
    const m = w.month || "Unknown";
    if (!map[m]) map[m] = [];
    map[m].push(w);
  });
  return map;
}

function repSummary(weeks) {
  const map = {};
  weeks.forEach((w) =>
    w.reps.forEach((r) => {
      if (!map[r.name]) map[r.name] = { accounts: 0, revenue: 0, acvSum: 0, weeksActive: 0, bestWeek: 0, weekHistory: [] };
      map[r.name].accounts += r.accounts;
      map[r.name].revenue += repRev(r);
      map[r.name].acvSum += r.acv;
      map[r.name].weeksActive += 1;
      map[r.name].bestWeek = Math.max(map[r.name].bestWeek, r.accounts);
      map[r.name].weekHistory.push({ label: w.label, accounts: r.accounts, revenue: repRev(r) });
    })
  );
  return Object.entries(map)
    .map(([name, v]) => {
      const avg = v.accounts / v.weeksActive;
      const variance = v.weekHistory.reduce((s, wh) => s + Math.pow(wh.accounts - avg, 2), 0) / (v.weeksActive || 1);
      const stdDev = Math.sqrt(variance);
      // Consistency: 100 = perfectly consistent, lower = more streaky. Based on coefficient of variation.
      const consistency = avg > 0 ? Math.max(0, Math.round(100 - (stdDev / avg) * 100)) : 0;
      return { name, ...v, avgAcv: v.acvSum / v.weeksActive, avgPerWeek: avg, consistency };
    })
    .sort((a, b) => b.accounts - a.accounts);
}

function repTrend(weeks, repName) {
  return weeks.map(w => {
    const r = w.reps.find(x => x.name === repName);
    return r ? r.accounts : null;
  });
}

// ── Sparkline ─────────────────────────────────────────────────────
function Spark({ data }) {
  const valid = data.filter(d => d !== null);
  if (valid.length < 2) return <span style={{ color: "#555", fontSize: 11 }}>—</span>;
  const max = Math.max(...valid), min = Math.min(...valid);
  const range = max - min || 1;
  const W = 56, H = 22;
  const coords = data.map((v, i) => v !== null ? `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}` : null).filter(Boolean).join(" ");
  const last = valid[valid.length - 1], prev = valid[valid.length - 2];
  const up = last > prev, down = last < prev;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <svg width={W} height={H}>
        <polyline points={coords} fill="none" stroke={up ? "#3db557" : down ? "#e05252" : "#888"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 13, fontWeight: 800, color: up ? "#3db557" : down ? "#e05252" : "#888" }}>
        {up ? "▲" : down ? "▼" : "—"}
      </span>
    </span>
  );
}

// ── Goal Bar ──────────────────────────────────────────────────────
function GoalBar({ current, goal, label }) {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  const color = pct >= 100 ? "#3db557" : pct >= 75 ? "#c8c820" : pct >= 50 ? "#e09020" : "#e05252";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: "#666", fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{current} / {goal} ({pct}%)</span>
      </div>
      <div style={{ background: "#1a1a1a", borderRadius: 6, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 6, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

// ── Add Week Modal ────────────────────────────────────────────────
function AddWeekModal({ weeks, onClose, onSave }) {
  const nextId = weeks.length + 1;
  const months = [...new Set(weeks.map(w => w.month))];
  const lastMonth = months[months.length - 1] || "May";
  const [month, setMonth] = useState(lastMonth);
  const [customMonth, setCustomMonth] = useState("");
  const [dates, setDates] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [manualRows, setManualRows] = useState([{ name: "", accounts: "", acv: "" }]);
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const allMonths = [...new Set([...months, "May", "June", "July", "August"])];

  const handleFile = (f) => {
    if (!f) return;
    setFile(f); setParsed(null); setError("");
    setPreview(URL.createObjectURL(f));
  };

  const parseImage = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const prompt = `This is a Moxie Pest Control sales leaderboard screenshot for H-Town South.
Each rep shows: their name (e.g. "Braxton H-476"), a green badge with their account count, and a dollar amount (their Average Contract Value / ACV — not total revenue).
Extract ALL reps. Format names as "FirstName LastInitial" only — strip any numbers/IDs (e.g. "Braxton H-476" becomes "Braxton H"). Return ONLY a JSON array, no markdown, no backticks:
[{"name":"Braxton H","accounts":N,"acv":N},...]`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: file.type || "image/png", data: base64 } },
            { type: "text", text: prompt }
          ]}]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const reps = JSON.parse(text.replace(/```json|```/g, "").trim());
      setParsed(reps);
      setManualRows(reps.map(r => ({ ...r })));
    } catch {
      setError("Auto-parse failed — enter data manually below.");
      setShowManual(true);
    }
    setLoading(false);
  };

  const updateRow = (i, field, val) => setManualRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addRow = () => setManualRows(prev => [...prev, { name: "", accounts: "", acv: "" }]);
  const removeRow = (i) => setManualRows(prev => prev.filter((_, idx) => idx !== i));

  const save = () => {
    const source = showManual ? manualRows : parsed;
    const reps = (source || []).filter(r => r.name && r.accounts).map(r => ({ name: r.name.trim(), accounts: Number(r.accounts) || 0, acv: Number(r.acv) || 0 }));
    if (!reps.length) { setError("No valid rep data to save."); return; }
    const finalMonth = customMonth.trim() || month;
    const monthAbbr = finalMonth.slice(0, 3);
    const weekNum = weeks.filter(w => w.month === finalMonth).length + 1;
    const label = `${monthAbbr} Wk ${weekNum}`;
    onSave({ id: nextId, label, dates: dates.trim() || label, month: finalMonth, reps });
    onClose();
  };

  const previewTotals = (parsed && !showManual ? parsed : manualRows).reduce(
    (a, r) => ({ accounts: a.accounts + (Number(r.accounts) || 0), revenue: a.revenue + (Number(r.accounts) || 0) * (Number(r.acv) || 0) }),
    { accounts: 0, revenue: 0 }
  );

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.modalHead}>
          <span style={S.modalTitle}>+ ADD NEW WEEK</span>
          <button onClick={onClose} style={S.xBtn}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={S.label}>Month</div>
            <select style={S.input} value={month} onChange={e => setMonth(e.target.value)}>
              {allMonths.map(m => <option key={m} value={m}>{m}</option>)}
              <option value="__custom__">Other…</option>
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <div style={S.label}>Date Range</div>
            <input style={S.input} placeholder="e.g. 5/4/26 – 5/10/26" value={dates} onChange={e => setDates(e.target.value)} />
          </div>
        </div>

        {month === "__custom__" && (
          <div style={{ marginBottom: 14 }}>
            <div style={S.label}>Custom Month Name</div>
            <input style={S.input} placeholder="e.g. June" value={customMonth} onChange={e => setCustomMonth(e.target.value)} />
          </div>
        )}

        <div style={S.dropzone} onClick={() => fileRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
          {preview
            ? <img src={preview} alt="preview" style={{ maxHeight: 170, borderRadius: 6, objectFit: "contain" }} />
            : <div style={{ color: "#555", textAlign: "center" }}>
                <div style={{ fontSize: 30, marginBottom: 6 }}>📸</div>
                <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 17, letterSpacing: 1, color: "#777" }}>DROP SCREENSHOT HERE</div>
                <div style={{ fontSize: 11, marginTop: 3 }}>or tap to upload</div>
              </div>}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        {file && !parsed && !showManual && (
          <button style={{ ...S.btn, marginTop: 12, width: "100%" }} onClick={parseImage} disabled={loading}>
            {loading ? "⏳ Reading screenshot…" : "🤖 Auto-Parse with AI"}
          </button>
        )}
        {error && <div style={{ color: "#e05252", fontSize: 12, marginTop: 8 }}>{error}</div>}

        {parsed && !showManual && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: "#3db557", fontWeight: 700 }}>✅ {parsed.length} reps parsed</div>
              <button style={S.ghostBtn} onClick={() => setShowManual(true)}>Edit</button>
            </div>
            <div style={S.tableWrap}>
              <table style={{ ...S.table, fontSize: 12 }}>
                <thead><tr>
                  <th style={S.th}>Rep</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Accts</th>
                  <th style={{ ...S.th, textAlign: "right" }}>ACV</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Revenue</th>
                </tr></thead>
                <tbody>{parsed.map((r, i) => (
                  <tr key={i}>
                    <td style={S.td}>{r.name}</td>
                    <td style={{ ...S.td, textAlign: "center", fontWeight: 700 }}>{r.accounts}</td>
                    <td style={{ ...S.td, textAlign: "right", color: "#888" }}>{fmt$(r.acv)}</td>
                    <td style={{ ...S.td, textAlign: "right", color: "#3db557", fontWeight: 700 }}>{fmt$(r.accounts * r.acv)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "6px 2px", borderTop: "1px solid #222", fontSize: 13, fontWeight: 700 }}>
              <span style={{ color: "#3db557" }}>TOTAL</span>
              <span>{previewTotals.accounts} accounts</span>
              <span style={{ color: "#3db557" }}>{fmt$(previewTotals.revenue)}</span>
            </div>
          </div>
        )}

        {showManual && (
          <div style={{ marginTop: 14 }}>
            <div style={S.label}>Manual Entry</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <span style={{ flex: 3, fontSize: 9, color: "#555" }}>REP NAME</span>
              <span style={{ flex: 1, fontSize: 9, color: "#555" }}>ACCTS</span>
              <span style={{ flex: 1, fontSize: 9, color: "#555" }}>ACV</span>
              <span style={{ width: 20 }}></span>
            </div>
            {manualRows.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <input style={{ ...S.input, flex: 3, padding: "7px 9px" }} placeholder="Rep name" value={r.name} onChange={e => updateRow(i, "name", e.target.value)} />
                <input style={{ ...S.input, flex: 1, padding: "7px 5px", textAlign: "center" }} type="number" placeholder="0" value={r.accounts} onChange={e => updateRow(i, "accounts", e.target.value)} />
                <input style={{ ...S.input, flex: 1, padding: "7px 5px", textAlign: "center" }} type="number" placeholder="0" value={r.acv} onChange={e => updateRow(i, "acv", e.target.value)} />
                <button onClick={() => removeRow(i)} style={{ background: "none", border: "none", color: "#733", cursor: "pointer", fontSize: 15 }}>✕</button>
              </div>
            ))}
            <button style={S.ghostBtn} onClick={addRow}>+ Add Rep</button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "7px 2px", borderTop: "1px solid #222", fontSize: 13, fontWeight: 700 }}>
              <span style={{ color: "#3db557" }}>TOTAL</span>
              <span>{previewTotals.accounts} accounts</span>
              <span style={{ color: "#3db557" }}>{fmt$(previewTotals.revenue)}</span>
            </div>
          </div>
        )}

        {!file && !showManual && (
          <button style={{ ...S.ghostBtn, marginTop: 10, width: "100%" }} onClick={() => setShowManual(true)}>Enter manually instead</button>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button style={{ ...S.btn, flex: 1, background: "#1e1e1e", color: "#666" }} onClick={onClose}>Cancel</button>
          <button style={{ ...S.btn, flex: 2 }} onClick={save} disabled={!parsed && !showManual}>💾 Save Week</button>
        </div>
      </div>
    </div>
  );
}

// ── Goal Modal ────────────────────────────────────────────────────
function GoalModal({ goal, onClose, onSave }) {
  const [weekly, setWeekly] = useState(goal.weekly || "");
  const [monthly, setMonthly] = useState(goal.monthly || "");
  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 340 }}>
        <div style={S.modalHead}>
          <span style={S.modalTitle}>🎯 SET GOALS</span>
          <button onClick={onClose} style={S.xBtn}>✕</button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={S.label}>Weekly Account Goal</div>
          <input style={S.input} type="number" placeholder="e.g. 80" value={weekly} onChange={e => setWeekly(e.target.value)} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={S.label}>Monthly Account Goal</div>
          <input style={S.input} type="number" placeholder="e.g. 300" value={monthly} onChange={e => setMonthly(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.btn, flex: 1, background: "#1e1e1e", color: "#666" }} onClick={onClose}>Cancel</button>
          <button style={{ ...S.btn, flex: 2 }} onClick={() => { onSave({ weekly: Number(weekly) || 0, monthly: Number(monthly) || 0 }); onClose(); }}>Save Goals</button>
        </div>
      </div>
    </div>
  );
}

// ── PIN Lock ──────────────────────────────────────────────────────
const CORRECT_PIN = "2288";

function PinModal({ onSuccess, onClose, reason }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        onSuccess();
        onClose();
      } else {
        setShake(true);
        setTimeout(() => { setPin(""); setShake(false); setError("Wrong PIN"); }, 600);
      }
    }
  };
  const handleBack = () => { setPin(prev => prev.slice(0, -1)); setError(""); };

  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 300, textAlign: "center" }}>
        <div style={S.modalHead}>
          <span style={S.modalTitle}>🔒 ENTER PIN</span>
          <button onClick={onClose} style={S.xBtn}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 20 }}>{reason}</div>
        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 24 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: pin.length > i ? "#3db557" : "#222", border: "2px solid", borderColor: pin.length > i ? "#3db557" : "#333", transition: "all 0.15s", transform: shake ? "translateX(4px)" : "none" }} />
          ))}
        </div>
        {error && <div style={{ color: "#e05252", fontSize: 12, marginBottom: 12 }}>{error}</div>}
        {/* Keypad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} onClick={() => handleDigit(String(d))} style={S.pinBtn}>{d}</button>
          ))}
          <div />
          <button onClick={() => handleDigit("0")} style={S.pinBtn}>0</button>
          <button onClick={handleBack} style={{ ...S.pinBtn, background: "#1a1a1a", color: "#888" }}>⌫</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [weeks, setWeeks] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : SEED_WEEKS; } catch { return SEED_WEEKS; }
  });
  const [goal, setGoal] = useState(() => {
    try { const s = localStorage.getItem(GOAL_KEY); return s ? JSON.parse(s) : { weekly: 0, monthly: 0 }; } catch { return { weekly: 0, monthly: 0 }; }
  });
  const [view, setView] = useState("dashboard");
  const [selWeek, setSelWeek] = useState(0);
  const [selMonth, setSelMonth] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [pinQueue, setPinQueue] = useState(null); // { reason, onSuccess }
  const [unlocked, setUnlocked] = useState(false); // stays unlocked for session

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(weeks)); } catch {} }, [weeks]);
  useEffect(() => { try { localStorage.setItem(GOAL_KEY, JSON.stringify(goal)); } catch {} }, [goal]);

  const requirePin = (reason, onSuccess) => {
    if (unlocked) { onSuccess(); return; }
    setPinQueue({ reason, onSuccess });
  };

  const addWeek = (w) => { setWeeks(prev => [...prev, w]); setSelWeek(weeks.length); };
  const deleteWeek = (id) => {
    requirePin("Confirm deletion", () => {
      setWeeks(prev => { const n = prev.filter(w => w.id !== id); setSelWeek(Math.max(0, n.length - 1)); return n; });
    });
  };

  const months = ["All", ...Object.keys(groupByMonth(weeks))];
  const filteredWeeks = selMonth === "All" ? weeks : weeks.filter(w => w.month === selMonth);
  const cw = weeks[selWeek];
  const ct = cw ? weekTotals(cw) : null;
  const allSummary = repSummary(weeks);
  const filteredSummary = repSummary(filteredWeeks);
  const filteredTotals = filteredWeeks.reduce((a, w) => { const t = weekTotals(w); return { accounts: a.accounts + t.accounts, revenue: a.revenue + t.revenue }; }, { accounts: 0, revenue: 0 });
  const latestWeek = weeks[weeks.length - 1];
  const latestTotals = latestWeek ? weekTotals(latestWeek) : { accounts: 0 };

  // Rep of the Week
  const repOfWeek = latestWeek ? [...latestWeek.reps].sort((a, b) => b.accounts - a.accounts)[0] : null;

  // Office record — best single week ever
  const officeRecord = weeks.reduce((best, w) => {
    const t = weekTotals(w);
    return t.accounts > best.accounts ? { accounts: t.accounts, label: w.label } : best;
  }, { accounts: 0, label: "" });

  // Month-over-month
  const monthGroups = groupByMonth(weeks);
  const momData = Object.keys(monthGroups).map(m => {
    const mWeeks = monthGroups[m];
    const totals = mWeeks.reduce((a, w) => { const t = weekTotals(w); return { accounts: a.accounts + t.accounts, revenue: a.revenue + t.revenue }; }, { accounts: 0, revenue: 0 });
    return { month: m, ...totals, weeks: mWeeks.length };
  });

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.brand}>H-TOWN SOUTH</div>
          <div style={S.sub}>Moxie Pest Control · Rep Performance Tracker</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.addBtn, background: "#1e3a28", fontSize: 13, padding: "9px 12px" }} onClick={() => requirePin("Access goals", () => setShowGoal(true))}>🎯</button>
          <button style={S.addBtn} onClick={() => requirePin("Add new week", () => setShowModal(true))}>+ WEEK</button>
        </div>
      </div>

      {/* Nav */}
      <div style={S.nav}>
        {[["dashboard","📊 Overview"],["weekly","📅 Weekly"],["monthly","📆 Monthly"],["career","🏆 Career"]].map(([v, label]) => (
          <button key={v} style={{ ...S.navBtn, ...(view === v ? S.navActive : {}) }} onClick={() => setView(v)}>{label}</button>
        ))}
      </div>

      {/* ══ DASHBOARD ══ */}
      {view === "dashboard" && (
        <div style={S.content}>
          {/* Goal bars */}
          {(goal.weekly > 0 || goal.monthly > 0) && (
            <div style={S.section}>
              <div style={S.sectionTitle}>🎯 Goal Tracker</div>
              {goal.weekly > 0 && <GoalBar current={latestTotals.accounts} goal={goal.weekly} label={`${latestWeek?.label || "Latest Week"} vs Weekly Goal`} />}
              {goal.monthly > 0 && (() => {
                const currentMonthWeeks = weeks.filter(w => w.month === (latestWeek?.month || ""));
                const monthAccts = currentMonthWeeks.reduce((a, w) => a + weekTotals(w).accounts, 0);
                return <GoalBar current={monthAccts} goal={goal.monthly} label={`${latestWeek?.month || ""} vs Monthly Goal`} />;
              })()}
            </div>
          )}

          {/* Stat cards - all time */}
          <div style={S.cardRow}>
            <div style={S.card}>
              <div style={S.cardLabel}>All-Time Accounts</div>
              <div style={S.cardVal}>{weeks.reduce((a, w) => a + weekTotals(w).accounts, 0)}</div>
              <div style={S.cardSub}>{weeks.length} weeks tracked</div>
            </div>
            <div style={{ ...S.card, background: "linear-gradient(135deg,#0d2014,#091510)" }}>
              <div style={S.cardLabel}>All-Time Revenue</div>
              <div style={{ ...S.cardVal, fontSize: 26 }}>{fmt$(weeks.reduce((a, w) => a + weekTotals(w).revenue, 0))}</div>
              <div style={S.cardSub}>avg {fmt$(weeks.reduce((a, w) => a + weekTotals(w).revenue, 0) / (weeks.length || 1))}/wk</div>
            </div>
          </div>

          {/* Rep of the Week + Office Record */}
          {repOfWeek && (
            <div style={S.cardRow}>
              <div style={{ ...S.card, background: "linear-gradient(135deg,#1a1400,#110e00)", border: "1px solid #4a3e00", flex: 3 }}>
                <div style={{ ...S.cardLabel, color: "#f5c842" }}>⭐ Rep of the Week · {latestWeek?.label}</div>
                <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, letterSpacing: 2, color: "#f5c842", marginBottom: 2 }}>{repOfWeek.name}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
                  <div><span style={{ fontSize: 28, fontFamily: "'Bebas Neue',cursive", color: "#f5c842" }}>{repOfWeek.accounts}</span><span style={{ fontSize: 11, color: "#776600", marginLeft: 4 }}>ACCTS</span></div>
                  <div><span style={{ fontSize: 18, fontFamily: "'Bebas Neue',cursive", color: "#c8a010" }}>{fmt$(repRev(repOfWeek))}</span><span style={{ fontSize: 11, color: "#776600", marginLeft: 4 }}>REV</span></div>
                </div>
              </div>
              <div style={{ ...S.card, flex: 2, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                <div style={{ ...S.cardLabel }}>🏆 Office Record</div>
                <div style={{ fontSize: 36, fontFamily: "'Bebas Neue',cursive", color: latestTotals.accounts >= officeRecord.accounts ? "#f5c842" : "#3db557" }}>{officeRecord.accounts}</div>
                <div style={{ fontSize: 10, color: "#555" }}>{officeRecord.label}</div>
                {latestTotals.accounts >= officeRecord.accounts && <div style={{ fontSize: 10, color: "#f5c842", marginTop: 2 }}>🎉 CURRENT WEEK!</div>}
              </div>
            </div>
          )}

          {/* Month-over-Month */}
          {momData.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Month-over-Month</div>
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Month</th>
                    <th style={{ ...S.th, textAlign: "center" }}>Wks</th>
                    <th style={{ ...S.th, textAlign: "center" }}>Accounts</th>
                    <th style={{ ...S.th, textAlign: "right" }}>Revenue</th>
                    <th style={{ ...S.th, textAlign: "center" }}>Avg/Wk</th>
                    <th style={{ ...S.th, textAlign: "center" }}>vs Prior</th>
                  </tr></thead>
                  <tbody>{momData.map((m, i) => {
                    const prev = i > 0 ? momData[i - 1] : null;
                    const avgNow = Math.round(m.accounts / m.weeks);
                    const avgPrev = prev ? Math.round(prev.accounts / prev.weeks) : null;
                    const diff = avgPrev !== null ? avgNow - avgPrev : null;
                    const pct = avgPrev && avgPrev > 0 ? Math.round(((avgNow - avgPrev) / avgPrev) * 100) : null;
                    const mc = MONTH_COLORS[m.month.slice(0, 3)] || DEFAULT_COLOR;
                    return (
                      <tr key={m.month} style={S.tr}>
                        <td style={{ ...S.td, fontWeight: 700 }}>
                          <span style={{ background: mc.bg, color: mc.text, border: `1px solid ${mc.border}`, borderRadius: 5, padding: "2px 8px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{m.month}</span>
                        </td>
                        <td style={{ ...S.td, textAlign: "center", color: "#555" }}>{m.weeks}</td>
                        <td style={{ ...S.td, textAlign: "center", fontWeight: 800, fontSize: 18 }}>{m.accounts}</td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{fmt$(m.revenue)}</td>
                        <td style={{ ...S.td, textAlign: "center", color: "#aaa", fontWeight: 600 }}>{avgNow}/wk</td>
                        <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: diff === null ? "#444" : diff > 0 ? "#3db557" : diff < 0 ? "#e05252" : "#888" }}>
                          {diff === null ? "—" : `${diff > 0 ? "+" : ""}${diff}/wk (${pct > 0 ? "+" : ""}${pct}%)`}
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Weekly totals */}
          <div style={S.section}>
            <div style={S.sectionTitle}>All Weeks</div>
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Week</th>
                  <th style={S.th}>Dates</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Accounts</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Revenue</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Avg ACV</th>
                </tr></thead>
                <tbody>{weeks.map((w, i) => {
                  const t = weekTotals(w);
                  const mc = monthColor(w.label);
                  return (
                    <tr key={w.id} style={{ ...S.tr, cursor: "pointer" }} onClick={() => { setSelWeek(i); setView("weekly"); }}>
                      <td style={{ ...S.td, fontWeight: 700 }}>
                        <span style={{ background: mc.bg, color: mc.text, border: `1px solid ${mc.border}`, borderRadius: 5, padding: "2px 7px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{w.label}</span>
                      </td>
                      <td style={{ ...S.td, color: "#555", fontSize: 11 }}>{w.dates}</td>
                      <td style={{ ...S.td, textAlign: "center", fontWeight: 800, fontSize: 18 }}>{t.accounts}</td>
                      <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{fmt$(t.revenue)}</td>
                      <td style={{ ...S.td, textAlign: "right", color: "#666", fontSize: 12 }}>{fmt$(t.revenue / (t.accounts || 1))}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>

          {/* Leaderboard */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Rep Leaderboard · All Time</div>
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead><tr>
                  <th style={{ ...S.th, textAlign: "center" }}>#</th>
                  <th style={S.th}>Rep</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Accts</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Revenue</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Trend</th>
                </tr></thead>
                <tbody>{allSummary.map((rep, i) => (
                  <tr key={rep.name} style={S.tr}>
                    <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: i === 0 ? "#f5c842" : i === 1 ? "#b0b0b0" : i === 2 ? "#c87533" : "#444" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{rep.name}</td>
                    <td style={{ ...S.td, textAlign: "center" }}><span style={S.badge}>{rep.accounts}</span></td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{fmt$(rep.revenue)}</td>
                    <td style={{ ...S.td, textAlign: "center" }}><Spark data={repTrend(weeks, rep.name)} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ WEEKLY ══ */}
      {view === "weekly" && (
        <div style={S.content}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {weeks.map((w, i) => {
              const mc = monthColor(w.label);
              return (
                <button key={w.id} style={{ background: selWeek === i ? mc.bg : "#181818", border: `1px solid ${selWeek === i ? mc.border : "#252525"}`, color: selWeek === i ? mc.text : "#666", borderRadius: 20, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontWeight: selWeek === i ? 700 : 400 }} onClick={() => setSelWeek(i)}>
                  {w.label}
                </button>
              );
            })}
          </div>

          {cw && ct && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 24, letterSpacing: 3 }}>{cw.label}</div>
                  <div style={{ color: "#666", fontSize: 11 }}>{cw.dates}</div>
                </div>
                <button onClick={() => deleteWeek(cw.id)} style={S.deleteBtn}>Delete</button>
              </div>
              <div style={S.cardRow}>
                <div style={S.card}>
                  <div style={S.cardLabel}>Total Accounts</div>
                  <div style={S.cardVal}>{ct.accounts}</div>
                  {goal.weekly > 0 && <GoalBar current={ct.accounts} goal={goal.weekly} label="vs Weekly Goal" />}
                </div>
                <div style={{ ...S.card, background: "linear-gradient(135deg,#0d2014,#091510)" }}>
                  <div style={S.cardLabel}>Total Revenue</div>
                  <div style={{ ...S.cardVal, fontSize: 28 }}>{fmt$(ct.revenue)}</div>
                  <div style={S.cardSub}>Avg ACV {fmt$(ct.revenue / (ct.accounts || 1))}</div>
                </div>
              </div>
              <div style={S.section}>
                <div style={S.sectionTitle}>{cw.label} · Rep Breakdown</div>
                <table style={S.table}>
                  <thead><tr>
                    <th style={{ ...S.th, textAlign: "center" }}>#</th>
                    <th style={S.th}>Rep</th>
                    <th style={{ ...S.th, textAlign: "center" }}>Accounts</th>
                    <th style={{ ...S.th, textAlign: "right" }}>ACV</th>
                    <th style={{ ...S.th, textAlign: "right" }}>Revenue</th>
                  </tr></thead>
                  <tbody>{cw.reps.map((r, i) => (
                    <tr key={r.name} style={S.tr}>
                      <td style={{ ...S.td, textAlign: "center", color: "#444", fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{r.name}</td>
                      <td style={{ ...S.td, textAlign: "center" }}><span style={S.badge}>{r.accounts}</span></td>
                      <td style={{ ...S.td, textAlign: "right", color: "#666", fontSize: 12 }}>{fmt$(r.acv)}</td>
                      <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: "#3db557" }}>{fmt$(repRev(r))}</td>
                    </tr>
                  ))}</tbody>
                  <tfoot><tr style={{ borderTop: "2px solid #2a6e3a" }}>
                    <td colSpan={2} style={{ ...S.td, fontWeight: 800, color: "#3db557" }}>OFFICE TOTAL</td>
                    <td style={{ ...S.td, textAlign: "center" }}><span style={{ ...S.badge, border: "1px solid #3db557" }}>{ct.accounts}</span></td>
                    <td></td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: "#3db557" }}>{fmt$(ct.revenue)}</td>
                  </tr></tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ MONTHLY ══ */}
      {view === "monthly" && (
        <div style={S.content}>
          {/* Month filter dropdown */}
          <div style={{ marginBottom: 16 }}>
            <div style={S.label}>Filter by Month</div>
            <select
              style={{ ...S.input, fontFamily: "'DM Sans',sans-serif", color: selMonth === "All" ? "#888" : (MONTH_COLORS[selMonth.slice(0,3)]?.text || "#e0e0e0") }}
              value={selMonth}
              onChange={e => setSelMonth(e.target.value)}
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={S.cardRow}>
            <div style={S.card}>
              <div style={S.cardLabel}>{selMonth === "All" ? "All-Time" : selMonth} Accounts</div>
              <div style={{ ...S.cardVal, fontSize: 50 }}>{filteredTotals.accounts}</div>
              <div style={S.cardSub}>{filteredWeeks.length} weeks · avg {Math.round(filteredTotals.accounts / (filteredWeeks.length || 1))}/wk</div>
              {goal.monthly > 0 && selMonth !== "All" && <GoalBar current={filteredTotals.accounts} goal={goal.monthly} label="vs Monthly Goal" />}
            </div>
            <div style={{ ...S.card, background: "linear-gradient(135deg,#0d2014,#091510)" }}>
              <div style={S.cardLabel}>{selMonth === "All" ? "All-Time" : selMonth} Revenue</div>
              <div style={{ ...S.cardVal, fontSize: 26 }}>{fmt$(filteredTotals.revenue)}</div>
              <div style={S.cardSub}>avg {fmt$(filteredTotals.revenue / (filteredWeeks.length || 1))}/wk</div>
            </div>
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}>Rep Totals · {selMonth}</div>
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead><tr>
                  <th style={{ ...S.th, textAlign: "center" }}>#</th>
                  <th style={S.th}>Rep</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Accts</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Revenue</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Avg ACV</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Wks</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Avg/Wk</th>
                </tr></thead>
                <tbody>{filteredSummary.map((rep, i) => (
                  <tr key={rep.name} style={S.tr}>
                    <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: i === 0 ? "#f5c842" : i === 1 ? "#b0b0b0" : i === 2 ? "#c87533" : "#444" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{rep.name}</td>
                    <td style={{ ...S.td, textAlign: "center" }}><span style={S.badge}>{rep.accounts}</span></td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{fmt$(rep.revenue)}</td>
                    <td style={{ ...S.td, textAlign: "right", color: "#666", fontSize: 12 }}>{fmt$(rep.avgAcv)}</td>
                    <td style={{ ...S.td, textAlign: "center", color: "#555" }}>{rep.weeksActive}</td>
                    <td style={{ ...S.td, textAlign: "center", color: "#888" }}>{rep.avgPerWeek.toFixed(1)}</td>
                  </tr>
                ))}</tbody>
                <tfoot><tr style={{ borderTop: "2px solid #2a6e3a" }}>
                  <td colSpan={2} style={{ ...S.td, fontWeight: 800, color: "#3db557" }}>TOTAL</td>
                  <td style={{ ...S.td, textAlign: "center" }}><span style={{ ...S.badge, border: "1px solid #3db557" }}>{filteredTotals.accounts}</span></td>
                  <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: "#3db557" }}>{fmt$(filteredTotals.revenue)}</td>
                  <td colSpan={3}></td>
                </tr></tfoot>
              </table>
            </div>
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}>Week-by-Week · {selMonth}</div>
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>Week</th>
                <th style={{ ...S.th, textAlign: "center" }}>Accounts</th>
                <th style={{ ...S.th, textAlign: "right" }}>Revenue</th>
                <th style={{ ...S.th, textAlign: "center" }}>vs Prior</th>
              </tr></thead>
              <tbody>{filteredWeeks.map((w, i) => {
                const t = weekTotals(w);
                const prev = i > 0 ? weekTotals(filteredWeeks[i - 1]) : null;
                const diff = prev ? t.accounts - prev.accounts : null;
                const mc = monthColor(w.label);
                return (
                  <tr key={w.id} style={S.tr}>
                    <td style={{ ...S.td }}>
                      <span style={{ background: mc.bg, color: mc.text, border: `1px solid ${mc.border}`, borderRadius: 5, padding: "2px 7px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{w.label}</span>
                      <span style={{ color: "#444", fontSize: 11, marginLeft: 7 }}>{w.dates}</span>
                    </td>
                    <td style={{ ...S.td, textAlign: "center", fontWeight: 800, fontSize: 17 }}>{t.accounts}</td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{fmt$(t.revenue)}</td>
                    <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: diff === null ? "#444" : diff > 0 ? "#3db557" : diff < 0 ? "#e05252" : "#888" }}>
                      {diff === null ? "—" : diff > 0 ? `+${diff} ▲` : `${diff} ▼`}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ CAREER ══ */}
      {view === "career" && (
        <div style={S.content}>
          <div style={S.section}>
            <div style={S.sectionTitle}>Rep Career Stats · All Time</div>
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead><tr>
                  <th style={{ ...S.th, textAlign: "center" }}>#</th>
                  <th style={S.th}>Rep</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Total Accts</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Total Rev</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Best Wk</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Avg/Wk</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Avg ACV</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Consistency</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Trend</th>
                </tr></thead>
                <tbody>{allSummary.map((rep, i) => (
                  <tr key={rep.name} style={S.tr}>
                    <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: i === 0 ? "#f5c842" : i === 1 ? "#b0b0b0" : i === 2 ? "#c87533" : "#444" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{rep.name}</td>
                    <td style={{ ...S.td, textAlign: "center" }}><span style={S.badge}>{rep.accounts}</span></td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{fmt$(rep.revenue)}</td>
                    <td style={{ ...S.td, textAlign: "center", color: "#3db557", fontWeight: 700 }}>{rep.bestWeek}</td>
                    <td style={{ ...S.td, textAlign: "center", color: "#aaa" }}>{rep.avgPerWeek.toFixed(1)}</td>
                    <td style={{ ...S.td, textAlign: "right", color: "#666", fontSize: 12 }}>{fmt$(rep.avgAcv)}</td>
                    <td style={{ ...S.td, textAlign: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: rep.consistency >= 80 ? "#3db557" : rep.consistency >= 60 ? "#c8c820" : rep.consistency >= 40 ? "#e09020" : "#e05252" }}>
                        {rep.weeksActive < 2 ? "—" : `${rep.consistency}`}
                      </span>
                      {rep.weeksActive >= 2 && <span style={{ fontSize: 9, color: "#444", marginLeft: 2 }}>/100</span>}
                    </td>
                    <td style={{ ...S.td, textAlign: "center" }}><Spark data={repTrend(weeks, rep.name)} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          {/* Per-rep week history */}
          {allSummary.map((rep, i) => (
            <div key={rep.name} style={{ ...S.section, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 14, letterSpacing: 2, color: i === 0 ? "#f5c842" : "#3db557" }}>
                  {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}{rep.name}
                </div>
                <div style={{ fontSize: 11, color: "#555" }}>{rep.weeksActive} weeks · {rep.accounts} total accts</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {rep.weekHistory.map((wh, j) => {
                  const mc = monthColor(wh.label);
                  return (
                    <div key={j} style={{ background: mc.bg, border: `1px solid ${mc.border}`, borderRadius: 8, padding: "6px 10px", minWidth: 70, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: mc.text, letterSpacing: 1, fontWeight: 700 }}>{wh.label}</div>
                      <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',cursive", color: "#e0e0e0", lineHeight: 1.2 }}>{wh.accounts}</div>
                      <div style={{ fontSize: 10, color: "#555" }}>{fmt$(wh.revenue)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddWeekModal weeks={weeks} onClose={() => setShowModal(false)} onSave={addWeek} />}
      {showGoal && <GoalModal goal={goal} onClose={() => setShowGoal(false)} onSave={setGoal} />}
      {pinQueue && <PinModal reason={pinQueue.reason} onSuccess={() => { setUnlocked(true); pinQueue.onSuccess(); }} onClose={() => setPinQueue(null)} />}
    </div>
  );
}

const S = {
  app: { background: "#0c0c0c", minHeight: "100vh", color: "#e0e0e0", fontFamily: "'DM Sans', sans-serif" },
  header: { background: "linear-gradient(135deg,#0a1e10,#0d2416)", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1e5c2e" },
  brand: { fontFamily: "'Bebas Neue',cursive", fontSize: 26, letterSpacing: 4, color: "#3db557" },
  sub: { fontSize: 10, color: "#4a7a5a", letterSpacing: 1.5, marginTop: 2 },
  addBtn: { background: "#3db557", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontFamily: "'Bebas Neue',cursive", fontSize: 16, letterSpacing: 2, cursor: "pointer" },
  nav: { display: "flex", background: "#0e0e0e", borderBottom: "1px solid #1a1a1a" },
  navBtn: { flex: 1, background: "none", border: "none", color: "#555", padding: "10px 0", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  navActive: { color: "#3db557", borderBottom: "2px solid #3db557", fontWeight: 700 },
  content: { padding: "16px 14px", maxWidth: 720, margin: "0 auto" },
  cardRow: { display: "flex", gap: 10, marginBottom: 14 },
  card: { flex: 1, background: "linear-gradient(135deg,#141420,#0f0f1a)", border: "1px solid #1e1e30", borderRadius: 12, padding: "14px 12px" },
  cardLabel: { fontSize: 9, letterSpacing: 2.5, color: "#555", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" },
  cardVal: { fontSize: 42, fontFamily: "'Bebas Neue',cursive", color: "#3db557", letterSpacing: 2, lineHeight: 1, marginBottom: 4 },
  cardSub: { fontSize: 10, color: "#444", marginBottom: 8 },
  section: { background: "#111", border: "1px solid #1c1c1c", borderRadius: 12, padding: "12px", marginBottom: 14 },
  sectionTitle: { fontFamily: "'Bebas Neue',cursive", fontSize: 13, letterSpacing: 3, color: "#3db557", marginBottom: 10, opacity: 0.8 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 9, letterSpacing: 2, color: "#444", fontWeight: 700, paddingBottom: 8, borderBottom: "1px solid #1c1c1c", textTransform: "uppercase" },
  td: { padding: "9px 3px", fontSize: 13, borderBottom: "1px solid #171717" },
  tr: {},
  badge: { display: "inline-block", background: "#122018", color: "#3db557", fontWeight: 800, fontSize: 14, borderRadius: 6, padding: "2px 10px", minWidth: 28, textAlign: "center" },
  deleteBtn: { background: "none", border: "1px solid #2a1010", color: "#7a2a2a", fontSize: 11, borderRadius: 6, padding: "4px 10px", cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 14 },
  modal: { background: "#131313", border: "1px solid #222", borderRadius: 16, padding: 18, width: "100%", maxWidth: 460, maxHeight: "92vh", overflowY: "auto" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { fontFamily: "'Bebas Neue',cursive", fontSize: 18, letterSpacing: 3, color: "#3db557" },
  xBtn: { background: "none", border: "none", color: "#555", fontSize: 17, cursor: "pointer" },
  label: { fontSize: 10, letterSpacing: 2, color: "#555", fontWeight: 700, marginBottom: 5, textTransform: "uppercase" },
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #282828", borderRadius: 7, color: "#e0e0e0", padding: "9px 11px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" },
  dropzone: { border: "2px dashed #222", borderRadius: 10, padding: "18px 10px", textAlign: "center", cursor: "pointer", background: "#0d0d0d", minHeight: 90, display: "flex", alignItems: "center", justifyContent: "center" },
  btn: { background: "#3db557", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontFamily: "'Bebas Neue',cursive", fontSize: 15, letterSpacing: 2, cursor: "pointer" },
  ghostBtn: { background: "none", border: "1px solid #252525", color: "#888", borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  pinBtn: { background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#e0e0e0", borderRadius: 10, padding: "14px 0", fontSize: 20, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 },
  tableWrap: { maxHeight: 190, overflowY: "auto", background: "#0d0d0d", borderRadius: 8, padding: 6 },
};

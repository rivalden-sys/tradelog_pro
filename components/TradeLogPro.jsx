import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  green:  "#30d158",
  red:    "#ff453a",
  gray:   "#8e8e93",
  blue:   "#0a84ff",
  font:   "-apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif",
};

const light = {
  bg:       "#f2f2f7",
  surface:  "#ffffff",
  surface2: "#f2f2f7",
  border:   "rgba(0,0,0,0.08)",
  text:     "#000000",
  text2:    "#3c3c43",
  text3:    "#8e8e93",
  shadow:   "0 2px 16px rgba(0,0,0,0.07)",
};
const dark = {
  bg:       "#0a0a0b",
  surface:  "#1c1c1e",
  surface2: "#2c2c2e",
  border:   "rgba(255,255,255,0.08)",
  text:     "#ffffff",
  text2:    "#ebebf5",
  text3:    "#8e8e93",
  shadow:   "0 2px 16px rgba(0,0,0,0.4)",
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const SETUPS = [
  "CHoCH + BOS + FVG",
  "Breaker/Mitigation + iFVG",
  "Order Block + FVG",
  "Liquidity Sweep + Reversal",
  "NWOG / NDOG",
  "Premium/Discount + POI",
];

const mockTrades = [
  { id:"1", date:"2026-03-01", pair:"BTC/USDT", setup:"CHoCH + BOS + FVG", rr:2.94, direction:"Long",  result:"Тейк", profit_usd:312,  profit_pct:3.1,  self_grade:"A", comment:"Чистый вход по структуре, всё по системе", trade_score:82 },
  { id:"2", date:"2026-03-02", pair:"ETH/USDT", setup:"Order Block + FVG",  rr:1.8,  direction:"Short", result:"Стоп", profit_usd:-180, profit_pct:-1.8, self_grade:"C", comment:"Торопился, вошёл до подтверждения. Смущала объёмы.", trade_score:34 },
  { id:"3", date:"2026-03-03", pair:"POL/USDT", setup:"Liquidity Sweep + Reversal", rr:4.21, direction:"Long", result:"Тейк", profit_usd:421, profit_pct:4.2, self_grade:"A", comment:"Идеальный ликвидити своп, терпеливо ждал", trade_score:88 },
  { id:"4", date:"2026-03-04", pair:"BTC/USDT", setup:"Breaker/Mitigation + iFVG", rr:2.0, direction:"Short", result:"БУ", profit_usd:0, profit_pct:0, self_grade:"B", comment:"Перевёл в безубыток по правилам", trade_score:61 },
  { id:"5", date:"2026-03-05", pair:"SOL/USDT", setup:"CHoCH + BOS + FVG", rr:6.02, direction:"Long", result:"Тейк", profit_usd:602, profit_pct:6.0, self_grade:"A", comment:"Лучшая сделка месяца. Всё идеально совпало.", trade_score:91 },
  { id:"6", date:"2026-03-06", pair:"ETH/USDT", setup:"Order Block + FVG", rr:1.5, direction:"Long", result:"Стоп", profit_usd:-150, profit_pct:-1.5, self_grade:"D", comment:"Реванш-трейд после вчерашнего стопа. Не стоило входить", trade_score:22 },
  { id:"7", date:"2026-03-07", pair:"BTC/USDT", setup:"Premium/Discount + POI", rr:3.1, direction:"Long", result:"Тейк", profit_usd:310, profit_pct:3.1, self_grade:"B", comment:"Хороший вход, но немного рано", trade_score:74 },
];

const balanceCurve = [
  { date:"01.03", pnl:312 },  { date:"02.03", pnl:132 },  { date:"03.03", pnl:553 },
  { date:"04.03", pnl:553 },  { date:"05.03", pnl:1155 }, { date:"06.03", pnl:1005 },
  { date:"07.03", pnl:1315 },
];

const pnlByPair = [
  { pair:"BTC/USDT", pnl:622 }, { pair:"ETH/USDT", pnl:-330 },
  { pair:"POL/USDT", pnl:421 }, { pair:"SOL/USDT", pnl:602 },
];

const pnlBySetup = [
  { setup:"CHoCH+BOS", pnl:914 }, { setup:"OB+FVG", pnl:-330 },
  { setup:"LiqSweep", pnl:421 },  { setup:"Breaker", pnl:0 },
  { setup:"Prem/Disc", pnl:310 },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Badge({ children, color }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:600,
      background: color + "22", color,
    }}>{children}</span>
  );
}

function Card({ children, theme, style = {} }) {
  const c = theme;
  return (
    <div style={{
      background: c.surface, borderRadius:18, padding:"20px 22px",
      boxShadow: c.shadow, border: `1px solid ${c.border}`, ...style,
    }}>{children}</div>
  );
}

function StatCard({ label, value, sub, color, theme }) {
  const c = theme;
  return (
    <Card theme={theme}>
      <div style={{ fontSize:13, color:c.text3, marginBottom:6, fontWeight:500 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color: color || c.text, letterSpacing:"-0.5px" }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:c.text3, marginTop:4 }}>{sub}</div>}
    </Card>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 70 ? T.green : score >= 40 ? "#ff9f0a" : T.red;
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:6,
      background: color + "18", border:`1px solid ${color}44`,
      borderRadius:20, padding:"3px 10px",
    }}>
      <div style={{ width:7, height:7, borderRadius:"50%", background:color }} />
      <span style={{ fontSize:13, fontWeight:700, color }}>{score}%</span>
    </div>
  );
}

function Btn({ children, onClick, variant="primary", theme, style={} }) {
  const c = theme;
  const base = {
    border:"none", borderRadius:12, padding:"10px 18px",
    fontSize:14, fontWeight:600, cursor:"pointer", transition:"opacity .15s",
    fontFamily: T.font, ...style,
  };
  const variants = {
    primary: { background: c.text, color: c.surface },
    ghost:   { background: "transparent", color: c.text3, border:`1px solid ${c.border}` },
    green:   { background: T.green, color:"#fff" },
    red:     { background: T.red,   color:"#fff" },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant] }}
      onMouseEnter={e => e.target.style.opacity=".75"}
      onMouseLeave={e => e.target.style.opacity="1"}
    >{children}</button>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────────────────

function Header({ page, setPage, darkMode, setDarkMode, theme }) {
  const c = theme;
  const navItems = [
    { id:"dashboard", label:"Dashboard" },
    { id:"trades",    label:"Журнал" },
    { id:"ai",        label:"AI Coach" },
    { id:"analytics", label:"Аналитика" },
  ];
  return (
    <header style={{
      background: c.surface, borderBottom:`1px solid ${c.border}`,
      position:"sticky", top:0, zIndex:100,
      backdropFilter:"blur(20px)",
    }}>
      <div style={{
        maxWidth:1200, margin:"0 auto", padding:"0 24px",
        height:56, display:"flex", alignItems:"center", gap:24,
      }}>
        <div style={{ fontWeight:800, fontSize:17, letterSpacing:"-0.3px", color:c.text }}>
          TradeLog <span style={{ color:T.green }}>Pro</span>
        </div>
        <div style={{ fontSize:11, color:c.text3, marginTop:1 }}>by dnproduction</div>

        <nav style={{ display:"flex", gap:4, marginLeft:16 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              background: page===n.id ? c.text : "transparent",
              color: page===n.id ? c.surface : c.text3,
              border:"none", borderRadius:10, padding:"6px 14px",
              fontSize:14, fontWeight:600, cursor:"pointer",
              fontFamily: T.font, transition:"all .15s",
            }}>{n.label}</button>
          ))}
        </nav>

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:12, color:T.green, fontWeight:600,
            background:T.green+"18", padding:"4px 10px", borderRadius:20 }}>PRO</span>
          <button onClick={() => setDarkMode(!darkMode)} style={{
            background: c.surface2, border:`1px solid ${c.border}`,
            borderRadius:20, padding:"6px 14px", cursor:"pointer",
            fontSize:13, color:c.text, fontFamily:T.font,
          }}>{darkMode ? "☀️ Light" : "🌙 Dark"}</button>
        </div>
      </div>
    </header>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

function Dashboard({ theme }) {
  const c = theme;
  const winCount = mockTrades.filter(t => t.result==="Тейк").length;
  const totalPnl = mockTrades.reduce((s,t) => s + t.profit_usd, 0);
  const avgRR = (mockTrades.reduce((s,t) => s + t.rr, 0) / mockTrades.length).toFixed(2);
  const winRate = Math.round(winCount / mockTrades.length * 100);

  const pieData = [
    { name:"Тейк", value: winCount, color: T.green },
    { name:"Стоп", value: mockTrades.filter(t=>t.result==="Стоп").length, color: T.red },
    { name:"БУ",   value: mockTrades.filter(t=>t.result==="БУ").length, color: T.gray },
  ];

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"28px 24px" }}>
      {/* Period filter */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:c.text, margin:0 }}>Dashboard</h1>
        <div style={{ display:"flex", gap:6 }}>
          {["Неделя","Месяц","Всё время"].map((p,i) => (
            <button key={p} style={{
              background: i===0 ? c.text : "transparent",
              color: i===0 ? c.surface : c.text3,
              border:`1px solid ${c.border}`, borderRadius:10,
              padding:"7px 14px", fontSize:13, fontWeight:500,
              cursor:"pointer", fontFamily:T.font,
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr) repeat(3,1fr)", gap:14, marginBottom:22 }}>
        <StatCard label="Всего сделок"    value={mockTrades.length} theme={theme} />
        <StatCard label="Win Rate"        value={`${winRate}%`}    color={T.green} theme={theme} />
        <StatCard label="Общий P&L"       value={`+$${totalPnl}`} color={T.green} theme={theme} />
        <StatCard label="Средний RR"      value={avgRR}            theme={theme} />
        <StatCard label="Лучший сетап"    value="CHoCH+BOS+FVG"   sub="Win rate: 100%" theme={theme} />
        <StatCard label="Серия побед"     value="3 🔥"             color={T.green} theme={theme} />
      </div>

      {/* Charts row 1 */}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14, marginBottom:14 }}>
        <Card theme={theme}>
          <div style={{ fontSize:14, fontWeight:600, color:c.text, marginBottom:16 }}>Кривая баланса</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={balanceCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
              <XAxis dataKey="date" tick={{ fontSize:12, fill:c.text3 }} />
              <YAxis tick={{ fontSize:12, fill:c.text3 }} />
              <Tooltip contentStyle={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:10, color:c.text }} />
              <Line type="monotone" dataKey="pnl" stroke={T.green} strokeWidth={2.5} dot={{ r:4, fill:T.green }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card theme={theme}>
          <div style={{ fontSize:14, fontWeight:600, color:c.text, marginBottom:16 }}>Win / Loss</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:10, color:c.text }} />
              <Legend formatter={(v) => <span style={{ color:c.text3, fontSize:12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:22 }}>
        <Card theme={theme}>
          <div style={{ fontSize:14, fontWeight:600, color:c.text, marginBottom:16 }}>P&L по парам</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={pnlByPair} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
              <XAxis type="number" tick={{ fontSize:11, fill:c.text3 }} />
              <YAxis dataKey="pair" type="category" tick={{ fontSize:11, fill:c.text3 }} width={80} />
              <Tooltip contentStyle={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:10, color:c.text }} />
              <Bar dataKey="pnl" radius={[0,6,6,0]}>
                {pnlByPair.map((e,i) => <Cell key={i} fill={e.pnl>=0 ? T.green : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card theme={theme}>
          <div style={{ fontSize:14, fontWeight:600, color:c.text, marginBottom:16 }}>P&L по сетапам</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={pnlBySetup} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
              <XAxis type="number" tick={{ fontSize:11, fill:c.text3 }} />
              <YAxis dataKey="setup" type="category" tick={{ fontSize:11, fill:c.text3 }} width={80} />
              <Tooltip contentStyle={{ background:c.surface, border:`1px solid ${c.border}`, borderRadius:10, color:c.text }} />
              <Bar dataKey="pnl" radius={[0,6,6,0]}>
                {pnlBySetup.map((e,i) => <Cell key={i} fill={e.pnl>=0 ? T.green : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent trades */}
      <Card theme={theme}>
        <div style={{ fontSize:14, fontWeight:600, color:c.text, marginBottom:16 }}>Последние сделки</div>
        <TradeTable trades={mockTrades.slice(0,5)} theme={theme} compact />
      </Card>
    </div>
  );
}

// ─── TRADE TABLE ─────────────────────────────────────────────────────────────

function TradeTable({ trades, theme, compact, onSelect }) {
  const c = theme;
  const resultColor = (r) => r==="Тейк" ? T.green : r==="Стоп" ? T.red : T.gray;

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
          <tr style={{ borderBottom:`1px solid ${c.border}` }}>
            {["Дата","Пара","Сетап","RR","Dir","Результат","P&L $","P&L %","Оценка","Score"].map(h => (
              <th key={h} style={{ textAlign:"left", padding:"8px 12px", color:c.text3, fontWeight:500, whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map(t => (
            <tr key={t.id}
              onClick={() => onSelect && onSelect(t)}
              style={{
                borderBottom:`1px solid ${c.border}`,
                cursor: onSelect ? "pointer" : "default",
                background: t.result==="Тейк" ? T.green+"08" : t.result==="Стоп" ? T.red+"08" : "transparent",
                transition:"background .12s",
              }}
              onMouseEnter={e => { if(onSelect) e.currentTarget.style.background = c.surface2 }}
              onMouseLeave={e => { e.currentTarget.style.background = t.result==="Тейк" ? T.green+"08" : t.result==="Стоп" ? T.red+"08" : "transparent" }}
            >
              <td style={{ padding:"10px 12px", color:c.text2 }}>{t.date.slice(5)}</td>
              <td style={{ padding:"10px 12px", fontWeight:600, color:c.text }}>{t.pair}</td>
              <td style={{ padding:"10px 12px", color:c.text3, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.setup}</td>
              <td style={{ padding:"10px 12px", color:c.text }}>{t.rr}</td>
              <td style={{ padding:"10px 12px" }}>
                <Badge color={t.direction==="Long" ? T.green : T.red}>{t.direction}</Badge>
              </td>
              <td style={{ padding:"10px 12px" }}>
                <Badge color={resultColor(t.result)}>{t.result}</Badge>
              </td>
              <td style={{ padding:"10px 12px", fontWeight:600, color:t.profit_usd>=0 ? T.green : T.red }}>
                {t.profit_usd>=0 ? "+" : ""}{t.profit_usd}$
              </td>
              <td style={{ padding:"10px 12px", color:t.profit_pct>=0 ? T.green : T.red }}>
                {t.profit_pct>=0 ? "+" : ""}{t.profit_pct}%
              </td>
              <td style={{ padding:"10px 12px" }}>
                <Badge color={t.self_grade==="A" ? T.green : t.self_grade==="B" ? "#0a84ff" : t.self_grade==="C" ? "#ff9f0a" : T.red}>{t.self_grade}</Badge>
              </td>
              <td style={{ padding:"10px 12px" }}>
                <ScoreBadge score={t.trade_score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TRADES PAGE ─────────────────────────────────────────────────────────────

function TradesPage({ theme, setPage }) {
  const c = theme;
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [filterResult, setFilterResult] = useState("Все");

  const filtered = filterResult==="Все" ? mockTrades : mockTrades.filter(t=>t.result===filterResult);

  if (showNew) return <NewTradePage theme={theme} onBack={() => setShowNew(false)} />;
  if (selected) return <TradeDetail trade={selected} theme={theme} onBack={() => setSelected(null)} />;

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"28px 24px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:c.text, margin:0 }}>Журнал сделок</h1>
        <Btn theme={theme} variant="green" onClick={() => setShowNew(true)}>+ Добавить сделку</Btn>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["Все","Тейк","Стоп","БУ"].map(f => (
          <button key={f} onClick={() => setFilterResult(f)} style={{
            background: filterResult===f ? c.text : "transparent",
            color: filterResult===f ? c.surface : c.text3,
            border:`1px solid ${c.border}`, borderRadius:10,
            padding:"7px 14px", fontSize:13, fontWeight:500,
            cursor:"pointer", fontFamily:T.font,
          }}>{f}</button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <select style={{
            background:c.surface2, border:`1px solid ${c.border}`,
            color:c.text, borderRadius:10, padding:"7px 14px",
            fontSize:13, fontFamily:T.font,
          }}>
            <option>Все пары</option>
            <option>BTC/USDT</option>
            <option>ETH/USDT</option>
          </select>
          <select style={{
            background:c.surface2, border:`1px solid ${c.border}`,
            color:c.text, borderRadius:10, padding:"7px 14px",
            fontSize:13, fontFamily:T.font,
          }}>
            <option>Все сетапы</option>
            {SETUPS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <Card theme={theme} style={{ padding:0 }}>
        <TradeTable trades={filtered} theme={theme} onSelect={setSelected} />
      </Card>
    </div>
  );
}

// ─── TRADE DETAIL ─────────────────────────────────────────────────────────────

function TradeDetail({ trade: t, theme, onBack }) {
  const c = theme;
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAI = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setAiResult({
      entry: "Вход выполнен точно по структуре рынка. CHoCH подтверждён, BOS сформирован, FVG заполнен на 50%. Исполнение на высшем уровне.",
      errors: "Небольшое отклонение — вход чуть выше идеального уровня 50% FVG. Некритично.",
      verdict: "Сделка полностью соответствует системе. Вход обоснован.",
      ai_grade: "A",
      recommendation: "Продолжать торговать по этому сетапу — он работает на вашей истории.",
    });
    setLoading(false);
  };

  const resultColor = t.result==="Тейк" ? T.green : t.result==="Стоп" ? T.red : T.gray;

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 24px" }}>
      <button onClick={onBack} style={{
        background:"transparent", border:"none", color:c.text3,
        fontSize:14, cursor:"pointer", marginBottom:20, fontFamily:T.font,
        display:"flex", alignItems:"center", gap:6,
      }}>← Назад к журналу</button>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <Card theme={theme}>
          <div style={{ fontSize:18, fontWeight:700, color:c.text, marginBottom:16 }}>
            {t.pair} · {t.date}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[
              ["Сетап", t.setup],
              ["RR", t.rr],
              ["Направление", <Badge color={t.direction==="Long"?T.green:T.red}>{t.direction}</Badge>],
              ["Результат", <Badge color={resultColor}>{t.result}</Badge>],
              ["P&L $", <span style={{color:t.profit_usd>=0?T.green:T.red,fontWeight:700}}>{t.profit_usd>=0?"+":""}{t.profit_usd}$</span>],
              ["P&L %", <span style={{color:t.profit_pct>=0?T.green:T.red,fontWeight:700}}>{t.profit_pct>=0?"+":""}{t.profit_pct}%</span>],
              ["Самооценка", <Badge color={t.self_grade==="A"?T.green:"#0a84ff"}>{t.self_grade}</Badge>],
              ["Trade Score", <ScoreBadge score={t.trade_score} />],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize:11, color:c.text3, marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:14, fontWeight:500, color:c.text }}>{val}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card theme={theme}>
          <div style={{ fontSize:14, fontWeight:600, color:c.text, marginBottom:10 }}>Комментарий трейдера</div>
          <p style={{ fontSize:14, color:c.text2, lineHeight:1.6, margin:0 }}>{t.comment}</p>
          <div style={{ marginTop:16, padding:"12px 14px", background:c.surface2, borderRadius:12, fontSize:13, color:c.text3 }}>
            📎 Скриншот не загружен. <span style={{ color:T.blue, cursor:"pointer" }}>Загрузить</span>
          </div>
        </Card>
      </div>

      {/* AI Analysis */}
      <Card theme={theme}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:700, color:c.text }}>🤖 AI Анализ сделки</div>
          {!aiResult && (
            <Btn theme={theme} variant="primary" onClick={runAI} style={{ opacity: loading ? .5:1 }}>
              {loading ? "Анализирую..." : "Запустить анализ"}
            </Btn>
          )}
        </div>

        {loading && (
          <div style={{ textAlign:"center", padding:"32px 0", color:c.text3 }}>
            <div style={{ fontSize:24, marginBottom:8 }}>⏳</div>
            GPT-4o анализирует сделку...
          </div>
        )}

        {aiResult && (
          <div style={{ display:"grid", gap:12 }}>
            {[
              ["✅ Что сделано правильно", aiResult.entry, T.green],
              ["⚠️ Ошибки и замечания", aiResult.errors, "#ff9f0a"],
              ["📋 Соответствие системе", aiResult.verdict, T.blue],
              ["💡 Рекомендация", aiResult.recommendation, c.text3],
            ].map(([title, text, color]) => (
              <div key={title} style={{
                padding:"14px 16px", borderRadius:12,
                background: color + "12", borderLeft:`3px solid ${color}`,
              }}>
                <div style={{ fontSize:13, fontWeight:600, color, marginBottom:6 }}>{title}</div>
                <div style={{ fontSize:13, color:c.text2, lineHeight:1.6 }}>{text}</div>
              </div>
            ))}
            <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:4 }}>
              <span style={{ color:c.text3, fontSize:13 }}>Оценка AI:</span>
              <Badge color={T.green}>{aiResult.ai_grade}</Badge>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── NEW TRADE FORM ───────────────────────────────────────────────────────────

function NewTradePage({ theme, onBack }) {
  const c = theme;
  const [form, setForm] = useState({
    date:"", pair:"", setup:"", rr:"", direction:"", result:"",
    profit_usd:"", profit_pct:"", comment:"", self_grade:"",
  });

  const upd = (k, v) => setForm(f => ({...f, [k]: v}));

  const inputStyle = {
    width:"100%", boxSizing:"border-box",
    background:c.surface2, border:`1px solid ${c.border}`,
    borderRadius:12, padding:"11px 14px", fontSize:14,
    color:c.text, fontFamily:T.font, outline:"none",
  };
  const labelStyle = { fontSize:13, color:c.text3, marginBottom:6, display:"block", fontWeight:500 };

  const SelectGroup = ({ label, field, options, colorMap={} }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {options.map(o => (
          <button key={o} onClick={() => upd(field, o)} style={{
            background: form[field]===o ? (colorMap[o]||c.text) : "transparent",
            color: form[field]===o ? (colorMap[o]?"#fff":c.surface) : c.text3,
            border:`1px solid ${form[field]===o ? (colorMap[o]||c.text) : c.border}`,
            borderRadius:10, padding:"9px 16px", fontSize:14,
            fontWeight:600, cursor:"pointer", fontFamily:T.font,
          }}>{o}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"28px 24px" }}>
      <button onClick={onBack} style={{
        background:"transparent", border:"none", color:c.text3,
        fontSize:14, cursor:"pointer", marginBottom:20, fontFamily:T.font,
      }}>← Назад</button>

      <h1 style={{ fontSize:24, fontWeight:700, color:c.text, margin:"0 0 24px" }}>Новая сделка</h1>

      <Card theme={theme}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
          <div>
            <label style={labelStyle}>Дата</label>
            <input type="date" style={inputStyle} value={form.date} onChange={e=>upd("date",e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Торговая пара</label>
            <input type="text" placeholder="BTC/USDT" style={inputStyle} value={form.pair} onChange={e=>upd("pair",e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop:18 }}>
          <label style={labelStyle}>Сетап</label>
          <select style={{ ...inputStyle }} value={form.setup} onChange={e=>upd("setup",e.target.value)}>
            <option value="">Выберите сетап</option>
            {SETUPS.map(s => <option key={s}>{s}</option>)}
            <option>+ Кастомный сетап</option>
          </select>
        </div>

        <div style={{ marginTop:18, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:18 }}>
          <div>
            <label style={labelStyle}>Risk/Reward</label>
            <input type="number" placeholder="2.5" step="0.01" style={inputStyle} value={form.rr} onChange={e=>upd("rr",e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>P&L ($)</label>
            <input type="number" placeholder="250" style={inputStyle} value={form.profit_usd} onChange={e=>upd("profit_usd",e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>P&L (%)</label>
            <input type="number" placeholder="2.5" step="0.01" style={inputStyle} value={form.profit_pct} onChange={e=>upd("profit_pct",e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop:20 }}>
          <SelectGroup label="Направление" field="direction" options={["Long","Short"]}
            colorMap={{ Long: T.green, Short: T.red }} />
        </div>
        <div style={{ marginTop:20 }}>
          <SelectGroup label="Результат" field="result" options={["Тейк","Стоп","БУ"]}
            colorMap={{ Тейк: T.green, Стоп: T.red, БУ: T.gray }} />
        </div>
        <div style={{ marginTop:20 }}>
          <SelectGroup label="Самооценка" field="self_grade" options={["A","B","C","D"]}
            colorMap={{ A: T.green, B: "#0a84ff", C: "#ff9f0a", D: T.red }} />
        </div>

        <div style={{ marginTop:18 }}>
          <label style={labelStyle}>Ссылка TradingView</label>
          <input type="url" placeholder="https://tradingview.com/..." style={inputStyle}
            value={form.tradingview_url} onChange={e=>upd("tradingview_url",e.target.value)} />
        </div>

        <div style={{ marginTop:18 }}>
          <label style={labelStyle}>Скриншот графика</label>
          <div style={{
            border:`2px dashed ${c.border}`, borderRadius:14,
            padding:"28px 20px", textAlign:"center", cursor:"pointer",
            color:c.text3, fontSize:13,
          }}>
            🖼️ Перетащите скриншот или нажмите для загрузки
          </div>
        </div>

        <div style={{ marginTop:18 }}>
          <label style={labelStyle}>Комментарий</label>
          <textarea placeholder="Что смущало? Почему вошли? Что можно было сделать лучше?"
            style={{ ...inputStyle, minHeight:90, resize:"vertical", lineHeight:1.5 }}
            value={form.comment} onChange={e=>upd("comment",e.target.value)} />
        </div>

        <div style={{ marginTop:22, display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn theme={theme} variant="ghost" onClick={onBack}>Отмена</Btn>
          <Btn theme={theme} variant="green">Сохранить сделку</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── AI COACH PAGE ────────────────────────────────────────────────────────────

function AICoachPage({ theme }) {
  const c = theme;
  const [activeTab, setActiveTab] = useState("coach");
  const [coachResult, setCoachResult] = useState(null);
  const [psychResult, setPsychResult] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);

  const runCoach = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setCoachResult({
      main_error: "Revenge trading — после стопа на ETH/USDT вы немедленно открыли новую позицию с оценкой D. Это самый дорогой паттерн в вашем журнале.",
      best_setup: "CHoCH + BOS + FVG — 100% win rate, средний P&L +$457. Ваш edge. Торгуйте только этот сетап в дни неуверенности.",
      worst_setup: "Order Block + FVG — 0% win rate в этом периоде. Возможно, неверная идентификация OB. Рекомендую паузу.",
      discipline: "Оценки A/B: 5 сделок — прибыль $1,645. Оценки C/D: 2 сделки — убыток -$330. Дисциплина = деньги.",
      recommendation: "Правило 1: после стопа — перерыв минимум 2 часа. Правило 2: торговать только сетапы с win rate >60% на вашей истории.",
    });
    setLoading(false);
  };

  const runPsych = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setPsychResult([
      { pattern:"Revenge Trading", severity:"high", evidence:"\"Реванш-трейд после вчерашнего стопа\" — сделка 06.03, оценка D, убыток -$150", action:"Ввести обязательный таймаут 2ч после каждого стопа" },
      { pattern:"Страх пропустить вход", severity:"medium", evidence:"\"Торопился, вошёл до подтверждения\" — сделка 02.03, оценка C", action:"Переключиться на вход только по закрытию свечи" },
      { pattern:"Позитивный паттерн", severity:"low", evidence:"\"Терпеливо ждал\" — сделка 03.03, оценка A, +$421. Ваша лучшая черта.", action:"Масштабировать терпение на все сделки" },
    ]);
    setLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role:"user", text: chatInput };
    setChatMessages(m => [...m, userMsg]);
    setChatInput("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const aiReply = { role:"ai", text: "На основе вашего журнала: лучший день — среда и пятница (+$733 суммарно). Худший — воскресенье. Рекомендую не торговать в понедельник утром — ваш win rate в это время 25%. Данные за последние 7 сделок." };
    setChatMessages(m => [...m, aiReply]);
    setLoading(false);
  };

  const tabs = [
    { id:"coach", label:"🎯 AI Coach" },
    { id:"psychology", label:"🧠 Психология" },
    { id:"chat", label:"💬 AI Чат" },
  ];

  const severityColor = s => s==="high" ? T.red : s==="medium" ? "#ff9f0a" : T.green;

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 24px" }}>
      <h1 style={{ fontSize:24, fontWeight:700, color:c.text, margin:"0 0 24px" }}>AI Coach</h1>

      <div style={{ display:"flex", gap:6, marginBottom:20 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab===tab.id ? c.text : "transparent",
            color: activeTab===tab.id ? c.surface : c.text3,
            border:`1px solid ${c.border}`, borderRadius:10,
            padding:"9px 18px", fontSize:14, fontWeight:600,
            cursor:"pointer", fontFamily:T.font,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* COACH TAB */}
      {activeTab==="coach" && (
        <Card theme={theme}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:c.text }}>Анализ журнала</div>
              <div style={{ fontSize:13, color:c.text3, marginTop:4 }}>GPT-4o проанализирует все {mockTrades.length} сделок и даст структурированный разбор</div>
            </div>
            {!coachResult && <Btn theme={theme} variant="primary" onClick={runCoach} style={{ opacity:loading?.5:1 }}>
              {loading ? "Анализирую..." : "Запустить анализ"}
            </Btn>}
          </div>

          {loading && activeTab==="coach" && !coachResult && (
            <div style={{ textAlign:"center", padding:"48px 0", color:c.text3 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🤖</div>
              GPT-4o читает ваш журнал...
            </div>
          )}

          {coachResult && (
            <div style={{ display:"grid", gap:14 }}>
              {[
                ["🚨 Главная ошибка периода", coachResult.main_error, T.red],
                ["🏆 Лучший сетап", coachResult.best_setup, T.green],
                ["⚠️ Худший сетап", coachResult.worst_setup, "#ff9f0a"],
                ["📊 Анализ дисциплины", coachResult.discipline, T.blue],
                ["💡 Конкретные шаги", coachResult.recommendation, c.text3],
              ].map(([title, text, color]) => (
                <div key={title} style={{
                  padding:"16px 18px", borderRadius:14,
                  background: color + "10", borderLeft:`3px solid ${color}`,
                }}>
                  <div style={{ fontSize:14, fontWeight:700, color, marginBottom:8 }}>{title}</div>
                  <div style={{ fontSize:13, color:c.text2, lineHeight:1.65 }}>{text}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* PSYCHOLOGY TAB */}
      {activeTab==="psychology" && (
        <Card theme={theme}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:c.text }}>Психологический анализ</div>
              <div style={{ fontSize:13, color:c.text3, marginTop:4 }}>AI читает ваши комментарии и выявляет поведенческие паттерны</div>
            </div>
            {!psychResult && <Btn theme={theme} variant="primary" onClick={runPsych}>
              {loading ? "Анализирую..." : "Запустить анализ"}
            </Btn>}
          </div>

          {loading && activeTab==="psychology" && !psychResult && (
            <div style={{ textAlign:"center", padding:"48px 0", color:c.text3 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🧠</div>
              AI читает ваши комментарии...
            </div>
          )}

          {psychResult && (
            <div style={{ display:"grid", gap:12 }}>
              {psychResult.map(p => (
                <div key={p.pattern} style={{
                  padding:"16px 18px", borderRadius:14,
                  border:`1px solid ${severityColor(p.severity)}44`,
                  background: severityColor(p.severity) + "08",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:c.text }}>{p.pattern}</div>
                    <Badge color={severityColor(p.severity)}>
                      {p.severity==="high"?"⚠️ Высокий риск": p.severity==="medium"?"Средний":"✅ Позитивный"}
                    </Badge>
                  </div>
                  <div style={{ fontSize:12, color:c.text3, fontStyle:"italic", marginBottom:8 }}>
                    📝 {p.evidence}
                  </div>
                  <div style={{ fontSize:13, color:c.text2 }}>
                    🎯 <strong>Действие:</strong> {p.action}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* CHAT TAB */}
      {activeTab==="chat" && (
        <Card theme={theme} style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${c.border}` }}>
            <div style={{ fontSize:14, fontWeight:600, color:c.text }}>AI Чат</div>
            <div style={{ fontSize:12, color:c.text3 }}>Контекст: {mockTrades.length} сделок из вашего журнала</div>
          </div>

          <div style={{ minHeight:320, padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
            {chatMessages.length===0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
                <div style={{ fontSize:13, color:c.text3, marginBottom:4 }}>Примеры вопросов:</div>
                {[
                  "Почему я продолжаю терять на Short позициях?",
                  "Какой мой лучший день недели для торговли?",
                  "Оцени мою дисциплину за последний месяц",
                ].map(q => (
                  <button key={q} onClick={() => setChatInput(q)} style={{
                    background:c.surface2, border:`1px solid ${c.border}`,
                    borderRadius:12, padding:"10px 14px", textAlign:"left",
                    fontSize:13, color:c.text2, cursor:"pointer", fontFamily:T.font,
                  }}>{q}</button>
                ))}
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role==="user" ? "flex-end" : "flex-start",
                maxWidth:"75%",
                background: m.role==="user" ? c.text : c.surface2,
                color: m.role==="user" ? c.surface : c.text,
                borderRadius: m.role==="user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding:"12px 16px", fontSize:13, lineHeight:1.6,
              }}>{m.text}</div>
            ))}
            {loading && <div style={{ color:c.text3, fontSize:13, alignSelf:"flex-start" }}>AI печатает...</div>}
          </div>

          <div style={{ padding:"12px 16px", borderTop:`1px solid ${c.border}`, display:"flex", gap:10 }}>
            <input
              placeholder="Задайте вопрос по вашему журналу..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && sendChat()}
              style={{
                flex:1, background:c.surface2, border:`1px solid ${c.border}`,
                borderRadius:12, padding:"10px 14px", fontSize:14,
                color:c.text, fontFamily:T.font, outline:"none",
              }}
            />
            <Btn theme={theme} variant="primary" onClick={sendChat}>Отправить</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────

function AnalyticsPage({ theme }) {
  const c = theme;

  const setupStats = [
    { setup:"CHoCH+BOS+FVG", wr:100, avgRR:4.48, trades:2, pnl:914 },
    { setup:"OB+FVG",         wr:0,   avgRR:1.65, trades:2, pnl:-330 },
    { setup:"LiqSweep",       wr:100, avgRR:4.21, trades:1, pnl:421 },
    { setup:"Breaker",        wr:50,  avgRR:2.0,  trades:1, pnl:0 },
    { setup:"Prem/Disc",      wr:100, avgRR:3.1,  trades:1, pnl:310 },
  ];

  const gradeStats = [
    { grade:"A", count:3, pnl:1335, color:T.green },
    { grade:"B", count:2, pnl:310,  color:"#0a84ff" },
    { grade:"C", count:1, pnl:-180, color:"#ff9f0a" },
    { grade:"D", count:1, pnl:-150, color:T.red },
  ];

  const disciplineActual = mockTrades.reduce((s,t)=>s+t.profit_usd,0);
  const disciplineFiltered = mockTrades.filter(t=>t.self_grade!=="C"&&t.self_grade!=="D").reduce((s,t)=>s+t.profit_usd,0);

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px" }}>
      <h1 style={{ fontSize:24, fontWeight:700, color:c.text, margin:"0 0 24px" }}>Аналитика</h1>

      {/* Discipline calculator */}
      <Card theme={theme} style={{ marginBottom:16, background: T.green+"12", border:`1px solid ${T.green}33` }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.green, marginBottom:12 }}>💰 Калькулятор дисциплины</div>
        <div style={{ display:"flex", gap:32, alignItems:"center" }}>
          <div>
            <div style={{ fontSize:12, color:c.text3 }}>Реальный P&L (все сделки)</div>
            <div style={{ fontSize:22, fontWeight:700, color:c.text }}>+${disciplineActual}</div>
          </div>
          <div style={{ fontSize:20, color:c.text3 }}>→</div>
          <div>
            <div style={{ fontSize:12, color:c.text3 }}>P&L без C/D сделок</div>
            <div style={{ fontSize:22, fontWeight:700, color:T.green }}>+${disciplineFiltered}</div>
          </div>
          <div style={{ padding:"10px 16px", background:T.green+"20", borderRadius:12 }}>
            <div style={{ fontSize:12, color:T.green }}>Потеряно на недисциплине</div>
            <div style={{ fontSize:18, fontWeight:700, color:T.red }}>-${disciplineFiltered - disciplineActual}</div>
          </div>
        </div>
      </Card>

      {/* Setup table */}
      <Card theme={theme} style={{ marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, color:c.text, marginBottom:16 }}>Win Rate по сетапам</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${c.border}` }}>
              {["Сетап","Сделок","Win Rate","Средний RR","P&L"].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"8px 12px", color:c.text3, fontWeight:500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {setupStats.map(s => (
              <tr key={s.setup} style={{ borderBottom:`1px solid ${c.border}` }}>
                <td style={{ padding:"10px 12px", color:c.text, fontWeight:500 }}>{s.setup}</td>
                <td style={{ padding:"10px 12px", color:c.text3 }}>{s.trades}</td>
                <td style={{ padding:"10px 12px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, height:6, background:c.border, borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${s.wr}%`, height:"100%", background: s.wr>=60?T.green:T.red, borderRadius:3 }} />
                    </div>
                    <span style={{ color:s.wr>=60?T.green:T.red, fontWeight:600 }}>{s.wr}%</span>
                  </div>
                </td>
                <td style={{ padding:"10px 12px", color:c.text }}>{s.avgRR}</td>
                <td style={{ padding:"10px 12px", fontWeight:600, color:s.pnl>=0?T.green:T.red }}>
                  {s.pnl>=0?"+":""}{s.pnl}$
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Grade stats */}
      <Card theme={theme}>
        <div style={{ fontSize:14, fontWeight:600, color:c.text, marginBottom:16 }}>Статистика самооценок</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {gradeStats.map(g => (
            <div key={g.grade} style={{
              padding:"16px", borderRadius:14,
              background: g.color + "12", border:`1px solid ${g.color}33`,
              textAlign:"center",
            }}>
              <div style={{ fontSize:28, fontWeight:800, color:g.color }}>{g.grade}</div>
              <div style={{ fontSize:12, color:c.text3, marginTop:4 }}>{g.count} сделок</div>
              <div style={{ fontSize:16, fontWeight:700, color:g.pnl>=0?T.green:T.red, marginTop:6 }}>
                {g.pnl>=0?"+":""}{g.pnl}$
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState("dashboard");
  const theme = darkMode ? dark : light;
  const c = theme;

  return (
    <div style={{ minHeight:"100vh", background:c.bg, fontFamily:T.font, color:c.text }}>
      <Header page={page} setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} theme={theme} />
      {page==="dashboard" && <Dashboard theme={theme} />}
      {page==="trades"    && <TradesPage theme={theme} setPage={setPage} />}
      {page==="ai"        && <AICoachPage theme={theme} />}
      {page==="analytics" && <AnalyticsPage theme={theme} />}
      <footer style={{ textAlign:"center", padding:"24px", fontSize:12, color:c.text3, borderTop:`1px solid ${c.border}` }}>
        TradeLog Pro · by dnproduction · 2026
      </footer>
    </div>
  );
}

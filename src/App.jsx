import { useState, useEffect, useRef, useCallback } from "react";
import { loadData, saveData } from "./supabase.js";

const fmt = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(n||0);
const pct = (n) => `${(n||0).toFixed(1)}%`;
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const qk=()=>{const d=new Date();return `${d.getFullYear()}-Q${Math.ceil((d.getMonth()+1)/3)}`;};
const mk=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
const hk=()=>{const d=new Date();return d.getMonth()<6?`${d.getFullYear()}-H1`:`${d.getFullYear()}-H2`;};
const yk=()=>`${new Date().getFullYear()}`;
const periodKey=(f)=>f==="monthly"?mk():f==="quarterly"?qk():f==="semiannual"?hk():f==="annual"?yk():"ongoing";
const periodLabel=(f)=>{if(f==="monthly")return new Date().toLocaleString("en-US",{month:"short"});if(f==="quarterly")return qk().replace("-"," ");if(f==="semiannual")return hk().includes("H1")?"Jan-Jun":"Jul-Dec";if(f==="annual")return yk();return "";};
const fCol={monthly:"#6366f1",quarterly:"#f59e0b",semiannual:"#10b981",annual:"#ec4899","multi-year":"#8b5cf6",ongoing:"#475569"};

const CARDS=[
  {id:"amex-plat",name:"Amex Platinum",network:"Amex",annualFee:895,limit:0,balance:0,apr:0,rewards:"5x flights & hotels via Amex Travel, 1x all else",benefits:[
    {id:"ap1",name:"Hotel Credit (FHR/THC)",value:600,frequency:"semiannual",note:"Up to $300/half on prepaid bookings via Amex Travel",checked:{}},
    {id:"ap2",name:"Resy Dining Credit",value:400,frequency:"quarterly",note:"Up to $100/qtr at U.S. Resy restaurants. Enroll required",checked:{}},
    {id:"ap3",name:"Lululemon Credit",value:300,frequency:"quarterly",note:"Up to $75/qtr at U.S. stores & online. Enroll",checked:{}},
    {id:"ap4",name:"Digital Entertainment",value:300,frequency:"monthly",note:"Up to $25/mo: Disney+, Hulu, ESPN+, Peacock, NYT, WSJ, YouTube, Paramount+",checked:{}},
    {id:"ap5",name:"Equinox Credit",value:300,frequency:"annual",note:"Up to $300/yr on Equinox membership. Enroll",checked:{}},
    {id:"ap6",name:"Uber Cash",value:200,frequency:"monthly",note:"$15/mo + $20 bonus Dec",checked:{}},
    {id:"ap7",name:"Oura Ring Credit",value:200,frequency:"annual",note:"Up to $200/yr hardware via OURAring.com",checked:{}},
    {id:"ap8",name:"Airline Fee Credit",value:200,frequency:"annual",note:"Up to $200/yr bags, seats on selected airline",checked:{}},
    {id:"ap9",name:"CLEAR+ Credit",value:209,frequency:"annual",note:"Up to $209 toward CLEAR+",checked:{}},
    {id:"ap10",name:"Walmart+ Credit",value:155,frequency:"monthly",note:"$12.95+tax/mo. Auto-renew. Enroll",checked:{}},
    {id:"ap11",name:"Uber One Credit",value:120,frequency:"annual",note:"Up to $120/yr on auto-renewing Uber One",checked:{}},
    {id:"ap12",name:"Saks Credit",value:100,frequency:"semiannual",note:"$50/half. Ends Jul 1 2026. Enroll",checked:{}},
    {id:"ap13",name:"Global Entry/TSA",value:120,frequency:"multi-year",note:"$120 GE every 4yr or $85 TSA Pre every 4.5yr",checked:{}},
    {id:"ap14",name:"Centurion Lounge",value:0,frequency:"ongoing",note:"Centurion + Priority Pass w/ 2 guests",checked:{}},
    {id:"ap15",name:"Hilton Gold + Marriott Gold",value:0,frequency:"ongoing",note:"Complimentary elite status",checked:{}},
    {id:"ap16",name:"Travel Insurance",value:0,frequency:"ongoing",note:"Trip cancel $10K, delay $500, car CDW, baggage",checked:{}},
  ]},
  {id:"csp",name:"Chase Sapphire Preferred",network:"Visa",annualFee:95,limit:0,balance:0,apr:0,rewards:"5x Chase Travel, 3x dining/streaming/grocery, 2x travel, 1x all",benefits:[
    {id:"cs1",name:"Hotel Credit",value:50,frequency:"annual",note:"Up to $50/yr hotel via Chase Travel",checked:{}},
    {id:"cs2",name:"10% Anniversary Bonus",value:0,frequency:"annual",note:"Bonus pts = 10% of annual spend",checked:{}},
    {id:"cs3",name:"DoorDash DashPass",value:120,frequency:"annual",note:"12-mo free. Activate by 12/31/2027",checked:{}},
    {id:"cs4",name:"Points Boost",value:0,frequency:"ongoing",note:"Up to 1.5x hotels, 1.75x premium cabin",checked:{}},
    {id:"cs5",name:"Transfer Partners (14+)",value:0,frequency:"ongoing",note:"Hyatt, United, Southwest, BA, etc",checked:{}},
    {id:"cs6",name:"Primary Car Rental CDW",value:0,frequency:"ongoing",note:"Primary coverage, decline rental insurance",checked:{}},
    {id:"cs7",name:"Trip/Delay/Baggage Insurance",value:0,frequency:"ongoing",note:"Cancel $10K, delay $500/12hr, baggage $100/day",checked:{}},
    {id:"cs8",name:"Purchase Protection + Warranty",value:0,frequency:"ongoing",note:"120-day $500/item + 1yr ext warranty",checked:{}},
    {id:"cs9",name:"No Foreign Txn Fee",value:0,frequency:"ongoing",note:"0% internationally",checked:{}},
  ]},
  {id:"cfu",name:"Chase Freedom Unlimited",network:"Visa",annualFee:0,limit:0,balance:0,apr:0,rewards:"5% Chase Travel, 3% dining & drugstores, 1.5% all else",benefits:[
    {id:"cf1",name:"Pool to Sapphire Preferred",value:0,frequency:"ongoing",note:"Transfer pts to CSP for higher value",checked:{}},
    {id:"cf2",name:"DashPass (6 months)",value:60,frequency:"annual",note:"6-mo free. Activate by 12/31/2027",checked:{}},
    {id:"cf3",name:"Purchase + Trip Protection",value:0,frequency:"ongoing",note:"120-day purchase, trip cancel $1.5K/person",checked:{}},
    {id:"cf4",name:"Auto Rental (Secondary)",value:0,frequency:"ongoing",note:"Secondary CDW",checked:{}},
    {id:"cf5",name:"No Annual Fee",value:0,frequency:"ongoing",note:"$0/yr",checked:{}},
  ]},
];

const WATERFALL=[
  {s:1,name:"401(k) up to employer match",desc:"Free money. Confirm WF match on Day 1",c:"#10b981"},
  {s:2,name:"Max Roth IRA ($7,500)",desc:"2026 limit. Tax-free growth. ~$625/mo",c:"#6366f1"},
  {s:3,name:"Max HSA ($4,400)",desc:"Triple tax advantage. Self-only 2026. Requires HDHP",c:"#f59e0b"},
  {s:4,name:"Max 401(k) ($24,500)",desc:"Remaining after match. Pre-tax or Roth",c:"#10b981"},
  {s:5,name:"Emergency Fund (6 months)",desc:"Target ~$35K-$42K in Wealthfront HYSA",c:"#ec4899"},
  {s:6,name:"Trip + Property Funds",desc:"Sinking funds for travel & investment properties",c:"#a78bfa"},
  {s:7,name:"Taxable Brokerage",desc:"Additional investing after tax-advantaged maxed",c:"#3b82f6"},
];
const STEP_ICONS = "①②③④⑤⑥⑦";

const CARD_TRANSITION = [
  {phase:"Now → Aug 2026",title:"Maximize Platinum Credits",desc:"Use every credit before renewal. Track in Perks tab. Claim Resy, Lululemon, Uber, streaming, airline fees.",c:"#6366f1",icon:"⏳"},
  {phase:"Aug 2026",title:"Downgrade Platinum → Gold",desc:"Call Amex to product change. Keeps MR points & account history. Ask for retention offer first. Fee drops $895 → $325.",c:"#f59e0b",icon:"🔄"},
  {phase:"Next CSP Renewal",title:"Downgrade CSP → Freedom Flex",desc:"Converts to $0/yr card. Keeps account open for credit history. Gold covers dining better at 4x vs 3x.",c:"#3b82f6",icon:"↓"},
  {phase:"Year 2-3",title:"Re-evaluate Platinum",desc:"Once traveling regularly, consider adding Platinum back for lounge access & hotel status.",c:"#10b981",icon:"✈"},
];

const FUTURE_CARDS = {
  "amex-gold": {id:"amex-gold",name:"Amex Gold",network:"Amex",annualFee:325,limit:0,balance:0,apr:0,rewards:"4x dining (up to $50K), 4x U.S. groceries (up to $25K), 3x flights direct, 1x all else",benefits:[
    {id:"ag1",name:"Dining Credit",value:120,frequency:"monthly",note:"Up to $10/mo at select restaurants (Grubhub, Goldbelly, etc). Enroll",checked:{}},
    {id:"ag2",name:"Uber Cash",value:120,frequency:"monthly",note:"$10/mo for Uber rides or Uber Eats. Add card to Uber",checked:{}},
    {id:"ag3",name:"Resy Dining Credit",value:100,frequency:"semiannual",note:"Up to $50/half at U.S. Resy restaurants. Enroll",checked:{}},
    {id:"ag4",name:"Dunkin' Credit",value:84,frequency:"monthly",note:"Up to $7/mo at U.S. Dunkin'. Enroll",checked:{}},
    {id:"ag5",name:"Hotel Collection $100 Credit",value:0,frequency:"ongoing",note:"$100 property credit on 2+ night stays via Amex Travel Hotel Collection",checked:{}},
    {id:"ag6",name:"Transfer Partners",value:0,frequency:"ongoing",note:"Same MR transfer partners as Platinum: Delta, BA, ANA, Hilton, etc",checked:{}},
    {id:"ag7",name:"No Foreign Txn Fee",value:0,frequency:"ongoing",note:"0% internationally",checked:{}},
    {id:"ag8",name:"Car Rental CDW (Secondary)",value:0,frequency:"ongoing",note:"Secondary coverage up to $50K",checked:{}},
    {id:"ag9",name:"Purchase Protection",value:0,frequency:"ongoing",note:"Up to $1K/item for 90 days. Extended warranty +1yr",checked:{}},
    {id:"ag10",name:"Trip Delay + Baggage",value:0,frequency:"ongoing",note:"Delay $300 after 12hr (2x/yr). Baggage $1,250 carry-on, $500 checked",checked:{}},
  ]},
};

function getDefault(){
  return {
    creditCards:JSON.parse(JSON.stringify(CARDS)),
    investments:[
      {id:"inv-roth",name:"Roth IRA (2025)",type:"Roth IRA",value:7000,objective:"Tax-free retirement growth. Maxed 2025 tax year"},
      {id:"inv-brk",name:"Personal Brokerage",type:"Brokerage",value:34000,objective:"Long-term wealth building"},
      {id:"inv-hsa",name:"HSA",type:"HSA",value:0,objective:"Triple tax advantage. 2026 limit: $4,400. Requires HDHP through Wells Fargo"},
    ],
    savingsAccounts:[
      {id:"sav-ef",name:"Emergency Fund",bank:"Wealthfront",type:"HYSA",balance:450,apy:3.30,target:35000,purpose:"rainy-day"},
      {id:"sav-trip",name:"Trip Fund",bank:"Wealthfront",type:"HYSA",balance:0,apy:3.30,target:5000,purpose:"trips"},
      {id:"sav-prop",name:"Investment Property Fund",bank:"Wealthfront",type:"HYSA",balance:0,apy:3.30,target:50000,purpose:"property"},
    ],
    bills:[
      {id:"bill-rent",name:"Rent",amount:0,icon:"🏠"},
      {id:"bill-groceries",name:"Groceries (est.)",amount:0,icon:"🛒"},
      {id:"bill-transit",name:"Gas / Transit",amount:0,icon:"⛽"},
      {id:"bill-streaming",name:"Streaming Services",amount:0,icon:"📺"},
      {id:"bill-renters",name:"Renters Insurance",amount:0,icon:"🛡"},
    ],
    salary:140000,
    monthlyTakeHome:7000,
  };
}

const TABS=[
  {id:"overview",l:"Home",i:"◉"},
  {id:"plan",l:"Plan",i:"⚡"},
  {id:"cards",l:"Cards",i:"▣"},
  {id:"perks",l:"Perks",i:"✦"},
  {id:"goals",l:"Goals",i:"◎"},
  {id:"bills",l:"Bills",i:"▤"},
];

export default function App(){
  const [data, setData] = useState(getDefault());
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const dataRef = useRef(data);

  // Keep ref in sync
  useEffect(() => { dataRef.current = data; }, [data]);

  // Load on mount
  useEffect(() => {
    (async () => {
      try {
        const s = await loadData();
        if (s && Object.keys(s).length > 0) {
          // Merge any new preset benefits
          const pm = {};
          CARDS.forEach(p => { pm[p.id] = p; });
          if (s.creditCards) {
            s.creditCards = s.creditCards.map(c => {
              if (!pm[c.id]) return c;
              const eids = new Set((c.benefits || []).map(b => b.id));
              const merged = [...(c.benefits || [])];
              pm[c.id].benefits.forEach(pb => {
                if (!eids.has(pb.id)) merged.push(pb);
              });
              return { ...c, benefits: merged };
            });
          }
          const merged = { ...getDefault(), ...s };
          setData(merged);
          dataRef.current = merged;
        }
      } catch (e) {
        console.error("Load error:", e);
      }
      setLoading(false);
    })();
  }, []);

  // Save helper - uses functional update to always get latest state
  const persist = useCallback(async (newData) => {
    setData(newData);
    dataRef.current = newData;
    try {
      const result = await saveData(newData);
      if (!result) console.error("Supabase save failed");
    } catch (e) {
      console.error("Save error:", e);
    }
  }, []);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 1800); };

  // All mutators read from dataRef.current for latest state
  const addItem = useCallback((key, item) => {
    const cur = dataRef.current;
    const nd = { ...cur, [key]: [...cur[key], { ...item, id: uid() }] };
    persist(nd);
    flash("Added");
    setModal(null);
  }, [persist]);

  const rmItem = useCallback((key, id) => {
    const cur = dataRef.current;
    const nd = { ...cur, [key]: cur[key].filter(i => i.id !== id) };
    persist(nd);
    flash("Removed");
  }, [persist]);

  const updCard = useCallback((cid, u) => {
    const cur = dataRef.current;
    persist({ ...cur, creditCards: cur.creditCards.map(c => c.id === cid ? { ...c, ...u } : c) });
  }, [persist]);

  const updSav = useCallback((sid, u) => {
    const cur = dataRef.current;
    persist({ ...cur, savingsAccounts: cur.savingsAccounts.map(a => a.id === sid ? { ...a, ...u } : a) });
  }, [persist]);

  const updInv = useCallback((iid, u) => {
    const cur = dataRef.current;
    persist({ ...cur, investments: cur.investments.map(i => i.id === iid ? { ...i, ...u } : i) });
  }, [persist]);

  const togBen = useCallback((cid, bid) => {
    const cur = dataRef.current;
    const nc = cur.creditCards.map(c => {
      if (c.id !== cid) return c;
      return {
        ...c,
        benefits: c.benefits.map(b => {
          if (b.id !== bid) return b;
          const k = periodKey(b.frequency);
          const ch = { ...b.checked };
          ch[k] = !ch[k];
          return { ...b, checked: ch };
        }),
      };
    });
    persist({ ...cur, creditCards: nc });
  }, [persist]);

  const updField = useCallback((k, v) => {
    const cur = dataRef.current;
    persist({ ...cur, [k]: v });
  }, [persist]);

  const updBill = useCallback((bid, u) => {
    const cur = dataRef.current;
    persist({ ...cur, bills: cur.bills.map(b => b.id === bid ? { ...b, ...u } : b) });
  }, [persist]);

  const addBill = useCallback((item) => {
    const cur = dataRef.current;
    persist({ ...cur, bills: [...cur.bills, { ...item, id: uid() }] });
    flash("Added");
    setModal(null);
  }, [persist]);

  const rmBill = useCallback((bid) => {
    const cur = dataRef.current;
    persist({ ...cur, bills: cur.bills.filter(b => b.id !== bid) });
    flash("Removed");
  }, [persist]);

  const resetAll = useCallback(async () => {
    if (confirm("Reset all data? This cannot be undone.")) {
      const fresh = getDefault();
      await persist(fresh);
      flash("Reset complete");
    }
  }, [persist]);

  // Computed values
  const totalDebt = data.creditCards.reduce((s, c) => s + (c.balance || 0), 0);
  const totalSav = data.savingsAccounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalInv = data.investments.reduce((s, i) => s + (i.value || 0), 0);
  const netWorth = totalSav + totalInv - totalDebt;
  const totalFees = data.creditCards.reduce((s, c) => s + (c.annualFee || 0), 0);
  const totalBills = (data.bills || []).reduce((s, b) => s + (b.amount || 0), 0);
  const monthlyRemaining = (data.monthlyTakeHome || 0) - totalBills;
  let tpv = 0, cpv = 0;
  data.creditCards.forEach(c => (c.benefits || []).forEach(b => {
    if (b.frequency === "ongoing" || b.frequency === "multi-year" || !b.value) return;
    tpv += b.value;
    if (b.checked && b.checked[periodKey(b.frequency)]) cpv += b.value;
  }));

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0a0a0f" }}>
      <span style={{ fontSize:40, color:"#6366f1", animation:"pulse 1.5s ease infinite" }}>◉</span>
    </div>
  );

  return (
    <div style={S.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,500;9..40,700&family=Playfair+Display:wght@600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}input,select,textarea{font-family:'DM Sans',sans-serif}input:focus,select:focus{outline:none;border-color:#6366f1!important}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}@keyframes toastIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, paddingTop:6 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:"#f8fafc" }}>Finance HQ</h1>
          <p style={{ fontSize:9, color:"#64748b", letterSpacing:"1.5px", textTransform:"uppercase" }}>Personal Finance Tracker</p>
        </div>
        <button onClick={resetAll} style={{ fontSize:10, color:"#64748b", background:"none", border:"1px solid #1e293b", borderRadius:5, padding:"4px 10px", cursor:"pointer" }}>Reset</button>
      </div>

      <div style={{ display:"flex", gap:2, marginBottom:14, background:"#111118", borderRadius:10, padding:2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:1,
            padding:"7px 1px", border:"none", borderRadius:8,
            background: tab === t.id ? "#1e1e2e" : "transparent",
            color: tab === t.id ? "#f8fafc" : "#64748b", cursor:"pointer", transition:"all .2s"
          }}>
            <span style={{ fontSize:12 }}>{t.i}</span>
            <span style={{ fontSize:8, fontWeight:500 }}>{t.l}</span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth:680, margin:"0 auto" }}>
        {tab === "overview" && <OverviewTab data={data} totalDebt={totalDebt} totalSav={totalSav} totalInv={totalInv} netWorth={netWorth} totalFees={totalFees} tpv={tpv} cpv={cpv} totalBills={totalBills} monthlyRemaining={monthlyRemaining} setTab={setTab} />}
        {tab === "plan" && <PlanTab data={data} updField={updField} totalFees={totalFees} />}
        {tab === "cards" && <CardsTab data={data} updCard={updCard} />}
        {tab === "perks" && <PerksTab data={data} togBen={togBen} />}
        {tab === "goals" && <GoalsTab data={data} updSav={updSav} updInv={updInv} addItem={addItem} rmItem={rmItem} setModal={setModal} />}
        {tab === "bills" && <BillsTab data={data} updBill={updBill} addBill={addBill} rmBill={rmBill} totalBills={totalBills} monthlyRemaining={monthlyRemaining} setModal={setModal} />}
      </div>

      {modal && (
        <div style={S.ov} onClick={() => setModal(null)}>
          <div style={S.mo} onClick={e => e.stopPropagation()}>{modal}</div>
        </div>
      )}
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

/* ─── OVERVIEW ─── */
function OverviewTab({ data, totalDebt, totalSav, totalInv, netWorth, totalFees, tpv, cpv, totalBills, monthlyRemaining, setTab }) {
  const pp = tpv > 0 ? (cpv / tpv) * 100 : 0;
  const stats = [
    { l:"Net Worth", v:fmt(netWorth), c: netWorth >= 0 ? "#10b981" : "#ef4444" },
    { l:"Invested", v:fmt(totalInv), c:"#f59e0b" },
    { l:"Savings", v:fmt(totalSav), c:"#6366f1" },
    { l:"Monthly Bills", v:fmt(totalBills), c:"#f97316" },
    { l:"Left to Save", v:fmt(monthlyRemaining), c: monthlyRemaining >= 0 ? "#10b981" : "#ef4444" },
    { l:"Perks Claimed", v:fmt(cpv), c:"#a78bfa" },
  ];

  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <div style={S.g2}>
        {stats.map((s, i) => (
          <div key={i} style={S.sc}>
            <span style={S.sl}>{s.l}</span>
            <span style={{ ...S.sv, color: s.c }}>{s.v}</span>
          </div>
        ))}
      </div>

      {tpv > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={S.st}>Benefits Progress</span>
            <button onClick={() => setTab("perks")} style={S.lk}>View</button>
          </div>
          <div style={S.br}><div style={{ ...S.bf, width:`${pp}%`, background:"linear-gradient(90deg,#6366f1,#a78bfa)" }} /></div>
          <p style={S.bt}>{fmt(cpv)} of {fmt(tpv)} ({pp.toFixed(0)}%)</p>
        </div>
      )}

      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={S.st}>Savings Goals</span>
          <button onClick={() => setTab("goals")} style={S.lk}>Details</button>
        </div>
        {data.savingsAccounts.map(a => {
          const p = a.target > 0 ? Math.min((a.balance / a.target) * 100, 100) : 0;
          return (
            <div key={a.id} style={{ marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}>
                <span style={{ color:"#cbd5e1" }}>{a.name}</span>
                <span style={{ color:"#64748b" }}>{fmt(a.balance)}/{fmt(a.target)}</span>
              </div>
              <div style={S.br}><div style={{ ...S.bf, width:`${p}%`, background: a.purpose === "rainy-day" ? "#ec4899" : a.purpose === "trips" ? "#f59e0b" : "#10b981" }} /></div>
            </div>
          );
        })}
      </div>

      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={S.st}>Priority Waterfall</span>
          <button onClick={() => setTab("plan")} style={S.lk}>Full Plan</button>
        </div>
        {WATERFALL.slice(0, 4).map(w => (
          <div key={w.s} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
            <span style={{ fontSize:14, fontWeight:700, color:w.c }}>{STEP_ICONS[w.s - 1]}</span>
            <span style={{ fontSize:11, color:"#cbd5e1" }}>{w.name}</span>
          </div>
        ))}
        <p style={{ fontSize:10, color:"#64748b" }}>+ 3 more steps...</p>
      </div>
    </div>
  );
}

/* ─── PLAN ─── */
function PlanTab({ data, updField, totalFees }) {
  const th = data.monthlyTakeHome || 7000;
  const efTarget = th * 6;
  const efBal = (data.savingsAccounts.find(a => a.purpose === "rainy-day") || {}).balance || 0;

  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <h2 style={S.pt}>Financial Plan</h2>

      <div style={{ ...S.cd, borderLeft:"3px solid #6366f1" }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#f8fafc", marginBottom:6 }}>Your Numbers</h3>
        <div style={S.r2}>
          <div style={S.fd}>
            <label style={S.lb}>Annual Salary</label>
            <input type="number" value={data.salary || ""} onChange={e => updField("salary", parseFloat(e.target.value) || 0)} style={S.inp} />
          </div>
          <div style={S.fd}>
            <label style={S.lb}>Monthly Take-Home</label>
            <input type="number" value={th || ""} onChange={e => updField("monthlyTakeHome", parseFloat(e.target.value) || 0)} style={S.inp} />
          </div>
        </div>
        <p style={{ fontSize:10, color:"#64748b", marginTop:4 }}>Start: Jul 14, 2026. Update after first pay stub.</p>
      </div>

      <div style={{ ...S.cd, marginTop:10 }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#f8fafc", marginBottom:8 }}>2026 IRS Limits</h3>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[{ l:"Roth IRA", v:"$7,500", c:"#6366f1" }, { l:"401(k)", v:"$24,500", c:"#10b981" }, { l:"HSA (Self)", v:"$4,400", c:"#f59e0b" }].map(x => (
            <div key={x.l} style={{ flex:"1 1 28%", padding:8, background:"#0a0a0f", borderRadius:7, border:"1px solid #1e293b", textAlign:"center" }}>
              <span style={{ fontSize:9, color:"#94a3b8", textTransform:"uppercase", display:"block" }}>{x.l}</span>
              <span style={{ fontSize:15, fontWeight:700, color:x.c, fontFamily:"'Playfair Display',serif" }}>{x.v}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize:10, color:"#64748b", marginTop:6 }}>Total to max: $36,400/yr (~$3,033/mo)</p>
      </div>

      <div style={{ ...S.cd, marginTop:10 }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#f8fafc", marginBottom:8 }}>Investment Priority Waterfall</h3>
        <p style={{ fontSize:10, color:"#94a3b8", marginBottom:10 }}>Follow this order to maximize every dollar:</p>
        {WATERFALL.map(w => (
          <div key={w.s} style={{ display:"flex", gap:8, marginBottom:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:18, color:w.c }}>{STEP_ICONS[w.s - 1]}</span>
            <div>
              <span style={{ fontSize:12, fontWeight:600, color:"#f8fafc" }}>{w.name}</span>
              <p style={{ fontSize:10, color:"#64748b", marginTop:1 }}>{w.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.cd, marginTop:10 }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#f8fafc", marginBottom:6 }}>Annual Card Fees</h3>
        {data.creditCards.map(c => (
          <div key={c.id} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:11, color:"#cbd5e1" }}>{c.name}</span>
            <span style={{ fontSize:11, fontWeight:600, color: c.annualFee ? "#f97316" : "#10b981" }}>{fmt(c.annualFee)}</span>
          </div>
        ))}
        <div style={{ borderTop:"1px solid #1e293b", marginTop:5, paddingTop:5, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, fontWeight:600, color:"#f8fafc" }}>Total</span>
          <span style={{ fontSize:12, fontWeight:700, color:"#f97316" }}>{fmt(totalFees)}</span>
        </div>
      </div>

      <div style={{ ...S.cd, marginTop:10 }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#f8fafc", marginBottom:4 }}>Emergency Fund Target</h3>
        <p style={{ fontSize:20, fontWeight:700, color:"#ec4899", fontFamily:"'Playfair Display',serif" }}>{fmt(efTarget)}</p>
        <p style={{ fontSize:10, color:"#64748b" }}>6 mo x {fmt(th)} take-home. Current: {fmt(efBal)}</p>
      </div>

      <div style={{ ...S.cd, marginTop:10, borderLeft:"3px solid #f59e0b" }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#f8fafc", marginBottom:10 }}>Card Transition Roadmap</h3>
        {CARD_TRANSITION.map((t, i) => (
          <div key={i} style={{ display:"flex", gap:8, marginBottom:12, alignItems:"flex-start" }}>
            <span style={{ fontSize:18 }}>{t.icon}</span>
            <div>
              <span style={{ fontSize:9, padding:"1px 6px", borderRadius:3, background: t.c + "22", color: t.c, fontWeight:600 }}>{t.phase}</span>
              <p style={{ fontSize:12, fontWeight:600, color:"#f8fafc", marginTop:3 }}>{t.title}</p>
              <p style={{ fontSize:10, color:"#64748b", marginTop:1 }}>{t.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.cd, marginTop:10 }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#f8fafc", marginBottom:8 }}>Current vs Future Setup</h3>
        <div style={S.r2}>
          <div style={{ padding:8, background:"#0a0a0f", borderRadius:7, border:"1px solid #1e293b" }}>
            <span style={{ fontSize:9, color:"#ef4444", textTransform:"uppercase", fontWeight:600, display:"block", marginBottom:4 }}>Now</span>
            <p style={{ fontSize:10, color:"#cbd5e1" }}>Amex Platinum</p>
            <p style={{ fontSize:10, color:"#cbd5e1" }}>Chase Sapphire Pref</p>
            <p style={{ fontSize:10, color:"#cbd5e1" }}>Chase Freedom Unl</p>
            <div style={{ borderTop:"1px solid #1e293b", marginTop:6, paddingTop:4 }}>
              <span style={{ fontSize:12, fontWeight:700, color:"#ef4444" }}>{fmt(990)}/yr</span>
            </div>
          </div>
          <div style={{ padding:8, background:"#0a0a0f", borderRadius:7, border:"1px solid #10b981" }}>
            <span style={{ fontSize:9, color:"#10b981", textTransform:"uppercase", fontWeight:600, display:"block", marginBottom:4 }}>After Aug</span>
            <p style={{ fontSize:10, color:"#cbd5e1" }}>Amex Gold</p>
            <p style={{ fontSize:10, color:"#cbd5e1" }}>Chase Freedom Unl</p>
            <p style={{ fontSize:10, color:"#475569" }}>(CSP → Freedom Flex)</p>
            <div style={{ borderTop:"1px solid #1e293b", marginTop:6, paddingTop:4 }}>
              <span style={{ fontSize:12, fontWeight:700, color:"#10b981" }}>{fmt(325)}/yr</span>
              <span style={{ fontSize:9, color:"#10b981", display:"block" }}>Save {fmt(665)}/yr</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...S.cd, marginTop:10 }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#f8fafc", marginBottom:6 }}>Future: Amex Gold Benefits</h3>
        <p style={{ fontSize:10, color:"#94a3b8", marginBottom:8 }}>What you'll get after the switch ($424/yr in credits):</p>
        {FUTURE_CARDS["amex-gold"].benefits.filter(b => b.value > 0).map(b => (
          <div key={b.id} style={{ display:"flex", justifyContent:"space-between", marginBottom:4, alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#cbd5e1" }}>{b.name}</span>
            <span style={{ fontSize:11, fontWeight:600, color:"#10b981" }}>{fmt(b.value)}/yr</span>
          </div>
        ))}
        <div style={{ borderTop:"1px solid #1e293b", marginTop:5, paddingTop:5 }}>
          <p style={{ fontSize:10, color:"#94a3b8" }}>Earning: 4x dining, 4x groceries, 3x flights</p>
          <p style={{ fontSize:10, color:"#94a3b8" }}>Same MR transfer partners as Platinum</p>
        </div>
      </div>
    </div>
  );
}

/* ─── CARDS ─── */
function CardsTab({ data, updCard }) {
  const [ed, setEd] = useState(null);
  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <h2 style={S.pt}>Credit Cards</h2>
      {data.creditCards.map(c => {
        const u = c.limit > 0 ? (c.balance / c.limit) * 100 : 0;
        return (
          <div key={c.id} style={{ ...S.cd, borderLeft:`3px solid ${c.network === "Amex" ? "#6366f1" : "#3b82f6"}` }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div>
                <h3 style={{ fontSize:13, fontWeight:600, color:"#f8fafc" }}>{c.name}</h3>
                <div style={{ display:"flex", gap:5, marginTop:2 }}>
                  <span style={S.bg}>{c.network}</span>
                  <span style={S.bg}>{fmt(c.annualFee)}/yr</span>
                </div>
              </div>
              <button onClick={() => setEd(ed === c.id ? null : c.id)} style={{ ...S.lk, fontSize:10 }}>
                {ed === c.id ? "Done" : "Edit"}
              </button>
            </div>
            {ed === c.id && (
              <div style={{ marginTop:8, padding:8, background:"#0a0a0f", borderRadius:7 }}>
                <div style={S.r2}>
                  <div style={S.fd}>
                    <label style={S.lb}>Limit</label>
                    <input type="number" value={c.limit || ""} onChange={e => updCard(c.id, { limit: parseFloat(e.target.value) || 0 })} style={S.inp} />
                  </div>
                  <div style={S.fd}>
                    <label style={S.lb}>Balance</label>
                    <input type="number" value={c.balance || ""} onChange={e => updCard(c.id, { balance: parseFloat(e.target.value) || 0 })} style={S.inp} />
                  </div>
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:12, marginTop:8 }}>
              <div>
                <span style={{ fontSize:9, color:"#64748b", textTransform:"uppercase", display:"block" }}>Balance</span>
                <span style={{ fontSize:13, fontWeight:700, color: c.balance > 0 ? "#ef4444" : "#10b981" }}>{fmt(c.balance)}</span>
              </div>
              <div>
                <span style={{ fontSize:9, color:"#64748b", textTransform:"uppercase", display:"block" }}>Limit</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{c.limit ? fmt(c.limit) : "--"}</span>
              </div>
            </div>
            {c.limit > 0 && (
              <>
                <div style={S.br}><div style={{ ...S.bf, width:`${Math.min(u, 100)}%`, background: u > 30 ? "#ef4444" : "#10b981" }} /></div>
                <p style={S.bt}>{pct(u)} utilization</p>
              </>
            )}
            <p style={{ fontSize:10, color:"#64748b", marginTop:4 }}>{c.rewards}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ─── PERKS ─── */
function PerksTab({ data, togBen }) {
  const [card, setCard] = useState("all");
  const [freq, setFreq] = useState("actionable");

  const all = [];
  data.creditCards.forEach(c => {
    if (card !== "all" && c.id !== card) return;
    (c.benefits || []).forEach(b => all.push({ ...b, cid: c.id, cn: c.name }));
  });

  const fil = all.filter(b => {
    if (freq === "all") return true;
    if (freq === "actionable") return b.frequency !== "ongoing" && b.value > 0;
    return b.frequency === freq;
  });

  const act = fil.filter(b => b.frequency !== "ongoing" && b.frequency !== "multi-year" && b.value > 0);
  const ong = fil.filter(b => b.frequency === "ongoing" || b.frequency === "multi-year" || !b.value);
  const cc = act.filter(b => b.checked && b.checked[periodKey(b.frequency)]).length;

  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <h2 style={S.pt}>Benefits & Perks</h2>
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
        <button onClick={() => setCard("all")} style={{ ...S.ch, ...(card === "all" ? S.cha : {}) }}>All</button>
        {data.creditCards.map(c => (
          <button key={c.id} onClick={() => setCard(c.id)} style={{ ...S.ch, ...(card === c.id ? S.cha : {}) }}>
            {c.name.split(" ").pop()}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
        {["actionable","all","monthly","quarterly","semiannual","annual","ongoing"].map(f => (
          <button key={f} onClick={() => setFreq(f)} style={{ ...S.ch, ...(freq === f ? S.cha : {}), fontSize:8 }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {act.length > 0 && <p style={{ fontSize:10, color:"#94a3b8", marginBottom:8 }}>{cc}/{act.length} claimed this period</p>}

      {act.map(b => {
        const k = periodKey(b.frequency);
        const done = b.checked && b.checked[k];
        return (
          <div key={b.cid + b.id} onClick={() => togBen(b.cid, b.id)} style={{
            display:"flex", gap:8, padding:9, background:"#111118", borderRadius:7,
            marginBottom:4, border:"1px solid #1e293b", opacity: done ? 0.55 : 1,
            cursor:"pointer", alignItems:"flex-start"
          }}>
            <div style={{
              width:18, height:18, borderRadius:4,
              border:`2px solid ${done ? "#6366f1" : "#475569"}`,
              background: done ? "#6366f1" : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0
            }}>
              {done && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, fontWeight:600, color:"#f8fafc", textDecoration: done ? "line-through" : "none" }}>{b.name}</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#10b981" }}>{fmt(b.value)}</span>
              </div>
              <div style={{ display:"flex", gap:4, marginTop:2, flexWrap:"wrap" }}>
                <span style={{ fontSize:8, padding:"0 4px", borderRadius:3, background:(fCol[b.frequency] || "#475569") + "22", color: fCol[b.frequency], fontWeight:600 }}>{b.frequency}</span>
                <span style={{ fontSize:9, color:"#64748b" }}>{periodLabel(b.frequency)}</span>
                {card === "all" && <span style={{ fontSize:9, color:"#475569" }}>{b.cn}</span>}
              </div>
              <p style={{ fontSize:9, color:"#64748b", marginTop:2 }}>{b.note}</p>
            </div>
          </div>
        );
      })}

      {ong.length > 0 && freq !== "actionable" && ong.map(b => (
        <div key={b.cid + b.id} style={{ padding:"7px 9px", background:"#0f0f18", borderRadius:5, marginBottom:3, border:"1px solid #151520" }}>
          <span style={{ fontSize:11, color:"#cbd5e1" }}>{b.name}</span>
          {card === "all" && <span style={{ fontSize:9, color:"#475569", display:"block" }}>{b.cn}</span>}
          <p style={{ fontSize:9, color:"#64748b", marginTop:1 }}>{b.note}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── GOALS ─── */
function GoalsTab({ data, updSav, updInv, addItem, rmItem, setModal }) {
  const ti = data.investments.reduce((s, i) => s + (i.value || 0), 0);

  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <h2 style={S.pt}>Goals & Accounts</h2>

      <h3 style={{ ...S.st, marginBottom:6 }}>Savings Goals</h3>
      {data.savingsAccounts.map(a => {
        const p = a.target > 0 ? Math.min((a.balance / a.target) * 100, 100) : 0;
        return (
          <div key={a.id} style={S.cd}>
            <h3 style={{ fontSize:13, fontWeight:600, color:"#f8fafc" }}>{a.name}</h3>
            <span style={S.bg}>{a.bank} {pct(a.apy)} APY</span>
            <div style={{ display:"flex", gap:8, marginTop:6 }}>
              <div style={S.fd}>
                <label style={S.lb}>Balance</label>
                <input type="number" value={a.balance || ""} onChange={e => updSav(a.id, { balance: parseFloat(e.target.value) || 0 })} style={{ ...S.inp, width:110 }} />
              </div>
              <div style={S.fd}>
                <label style={S.lb}>Target</label>
                <input type="number" value={a.target || ""} onChange={e => updSav(a.id, { target: parseFloat(e.target.value) || 0 })} style={{ ...S.inp, width:110 }} />
              </div>
            </div>
            <div style={S.br}><div style={{ ...S.bf, width:`${p}%`, background: a.purpose === "rainy-day" ? "#ec4899" : a.purpose === "trips" ? "#f59e0b" : "#10b981" }} /></div>
            <p style={S.bt}>{pct(p)} complete — {fmt(Math.max(0, (a.target || 0) - (a.balance || 0)))} to go</p>
          </div>
        );
      })}

      <h3 style={{ ...S.st, marginTop:14, marginBottom:6 }}>Investment Accounts</h3>
      <p style={{ fontSize:15, fontWeight:700, color:"#f59e0b", fontFamily:"'Playfair Display',serif", marginBottom:8 }}>Portfolio: {fmt(ti)}</p>
      {data.investments.map(inv => (
        <div key={inv.id} style={S.cd}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <h3 style={{ fontSize:13, fontWeight:600, color:"#f8fafc" }}>{inv.name}</h3>
              <span style={S.bg}>{inv.type}</span>
            </div>
            <button style={{ background:"none", border:"none", color:"#475569", fontSize:11, cursor:"pointer" }} onClick={() => rmItem("investments", inv.id)}>✕</button>
          </div>
          <div style={S.fd}>
            <label style={S.lb}>Value</label>
            <input type="number" value={inv.value || ""} onChange={e => updInv(inv.id, { value: parseFloat(e.target.value) || 0 })} style={{ ...S.inp, width:130 }} />
          </div>
          {inv.objective && <p style={{ fontSize:10, color:"#64748b" }}>{inv.objective}</p>}
          {ti > 0 && <p style={{ fontSize:10, color:"#94a3b8" }}>{pct((inv.value / ti) * 100)} of portfolio</p>}
        </div>
      ))}
      <button style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:7, padding:"7px 12px", fontSize:10, fontWeight:600, cursor:"pointer", marginTop:6 }} onClick={() => {
        const F = () => {
          const [f, sF] = useState({ name:"", type:"Brokerage", value:"", objective:"" });
          return (
            <div>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:"#f8fafc", marginBottom:10 }}>Add Account</h3>
              <Inp l="Name" v={f.name} o={v => sF({ ...f, name:v })} />
              <Sl l="Type" v={f.type} opts={["Brokerage","Roth IRA","401k","HSA","IRA","ETF","Crypto","Other"]} o={v => sF({ ...f, type:v })} />
              <Inp l="Value" v={f.value} o={v => sF({ ...f, value:v })} t="number" />
              <Inp l="Objective" v={f.objective} o={v => sF({ ...f, objective:v })} />
              <button style={{ width:"100%", padding:9, background:"#6366f1", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", marginTop:4 }} onClick={() => { if (f.name) addItem("investments", { ...f, value: parseFloat(f.value) || 0 }); }}>Add</button>
            </div>
          );
        };
        setModal(<F />);
      }}>+ Add Account</button>
    </div>
  );
}

/* ─── EXPENSES ─── */
function BillsTab({ data, updBill, addBill, rmBill, totalBills, monthlyRemaining, setModal }) {
  const th = data.monthlyTakeHome || 0;
  const billsPct = th > 0 ? (totalBills / th) * 100 : 0;

  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <h2 style={S.pt}>Monthly Bills</h2>
        <button style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:7, padding:"7px 12px", fontSize:10, fontWeight:600, cursor:"pointer" }} onClick={() => {
          const F = () => {
            const [f, sF] = useState({ name:"", amount:"" });
            return (
              <div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:"#f8fafc", marginBottom:10 }}>Add Bill</h3>
                <Inp l="Name" v={f.name} o={v => sF({ ...f, name:v })} p="e.g. Car Payment" />
                <Inp l="Monthly Amount" v={f.amount} o={v => sF({ ...f, amount:v })} t="number" />
                <button style={{ width:"100%", padding:9, background:"#6366f1", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", marginTop:4 }} onClick={() => { if (f.name) addBill({ name: f.name, amount: parseFloat(f.amount) || 0, icon:"📌" }); }}>Add</button>
              </div>
            );
          };
          setModal(<F />);
        }}>+ Add Bill</button>
      </div>

      <div style={{ ...S.cd, borderLeft:"3px solid #f97316", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
          <span style={{ fontSize:11, color:"#94a3b8" }}>Monthly Burn</span>
          <span style={{ fontSize:16, fontWeight:700, color:"#f97316", fontFamily:"'Playfair Display',serif" }}>{fmt(totalBills)}</span>
        </div>
        <div style={S.br}><div style={{ ...S.bf, width:`${Math.min(billsPct, 100)}%`, background: billsPct > 50 ? "#ef4444" : "#f97316" }} /></div>
        <p style={S.bt}>{pct(billsPct)} of {fmt(th)} take-home</p>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
          <span style={{ fontSize:11, color:"#94a3b8" }}>Left to Save & Invest</span>
          <span style={{ fontSize:16, fontWeight:700, color: monthlyRemaining >= 0 ? "#10b981" : "#ef4444", fontFamily:"'Playfair Display',serif" }}>{fmt(monthlyRemaining)}</span>
        </div>
      </div>

      {(data.bills || []).map(bill => (
        <div key={bill.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 11px", background:"#111118", borderRadius:8, marginBottom:5, border:"1px solid #1e293b" }}>
          <span style={{ fontSize:18 }}>{bill.icon || "📌"}</span>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:12, fontWeight:500, color:"#f8fafc", display:"block" }}>{bill.name}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:10, color:"#64748b" }}>$</span>
            <input
              type="number"
              value={bill.amount || ""}
              onChange={e => updBill(bill.id, { amount: parseFloat(e.target.value) || 0 })}
              style={{ width:80, padding:"5px 7px", background:"#0a0a0f", border:"1px solid #1e293b", borderRadius:5, color:"#e2e8f0", fontSize:13, fontWeight:600, textAlign:"right" }}
              placeholder="0"
            />
            <span style={{ fontSize:10, color:"#64748b" }}>/mo</span>
            {!bill.id.startsWith("bill-") && (
              <button style={{ background:"none", border:"none", color:"#475569", fontSize:11, cursor:"pointer" }} onClick={() => rmBill(bill.id)}>✕</button>
            )}
          </div>
        </div>
      ))}

      {th > 0 && totalBills > 0 && (
        <div style={{ ...S.cd, marginTop:12 }}>
          <h3 style={{ fontSize:12, fontWeight:600, color:"#cbd5e1", marginBottom:6 }}>Monthly Breakdown</h3>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:11, color:"#94a3b8" }}>Take-home pay</span>
            <span style={{ fontSize:11, fontWeight:600, color:"#f8fafc" }}>{fmt(th)}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:11, color:"#94a3b8" }}>Bills & expenses</span>
            <span style={{ fontSize:11, fontWeight:600, color:"#f97316" }}>-{fmt(totalBills)}</span>
          </div>
          <div style={{ borderTop:"1px solid #1e293b", marginTop:4, paddingTop:4, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, fontWeight:600, color:"#f8fafc" }}>Available to save/invest</span>
            <span style={{ fontSize:12, fontWeight:700, color: monthlyRemaining >= 0 ? "#10b981" : "#ef4444" }}>{fmt(monthlyRemaining)}</span>
          </div>
          <p style={{ fontSize:10, color:"#64748b", marginTop:4 }}>
            Target ~$3,033/mo for tax-advantaged accounts (Roth IRA + HSA + 401k)
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── FORM HELPERS ─── */
function Inp({ l, v, o, t = "text", p = "" }) {
  return (
    <div style={S.fd}>
      <label style={S.lb}>{l}</label>
      <input value={v} onChange={e => o(e.target.value)} type={t} placeholder={p} style={S.inp} />
    </div>
  );
}

function Sl({ l, v, opts, o }) {
  return (
    <div style={S.fd}>
      <label style={S.lb}>{l}</label>
      <select value={v} onChange={e => o(e.target.value)} style={S.inp}>
        {opts.map(x => <option key={x} value={x}>{x}</option>)}
      </select>
    </div>
  );
}

/* ─── STYLES ─── */
const S = {
  root: { fontFamily:"'DM Sans',sans-serif", background:"#0a0a0f", color:"#e2e8f0", minHeight:"100vh", padding:"14px 14px 90px" },
  g2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 },
  sc: { borderRadius:8, padding:"9px 8px", border:"1px solid #1e293b", background:"#111118" },
  sl: { fontSize:9, color:"#94a3b8", display:"block", marginBottom:1, textTransform:"uppercase", letterSpacing:".5px" },
  sv: { fontSize:15, fontWeight:700, fontFamily:"'Playfair Display',serif" },
  st: { fontSize:12, fontWeight:600, color:"#cbd5e1" },
  pt: { fontFamily:"'Playfair Display',serif", fontSize:18, color:"#f8fafc", marginBottom:10 },
  lk: { background:"none", border:"none", color:"#6366f1", fontSize:10, fontWeight:600, cursor:"pointer" },
  cd: { background:"#111118", borderRadius:9, padding:11, marginBottom:7, border:"1px solid #1e293b" },
  bg: { display:"inline-block", fontSize:9, fontWeight:500, background:"#1e293b", color:"#94a3b8", borderRadius:3, padding:"0 5px" },
  br: { height:4, background:"#1e293b", borderRadius:2, overflow:"hidden", marginTop:3 },
  bf: { height:"100%", borderRadius:2, transition:"width .4s ease" },
  bt: { fontSize:9, color:"#64748b", marginTop:2 },
  ch: { fontSize:9, padding:"3px 7px", borderRadius:5, border:"1px solid #1e293b", background:"transparent", color:"#94a3b8", cursor:"pointer" },
  cha: { background:"#6366f1", color:"#fff", borderColor:"#6366f1" },
  fd: { marginBottom:7 },
  lb: { fontSize:9, fontWeight:600, color:"#94a3b8", display:"block", marginBottom:1, textTransform:"uppercase", letterSpacing:".5px" },
  inp: { width:"100%", padding:"7px 9px", background:"#0a0a0f", border:"1px solid #1e293b", borderRadius:6, color:"#e2e8f0", fontSize:12 },
  r2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 },
  ov: { position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:100, backdropFilter:"blur(4px)" },
  mo: { background:"#111118", borderRadius:"16px 16px 0 0", padding:"18px 14px 30px", width:"100%", maxWidth:500, maxHeight:"85vh", overflowY:"auto", animation:"slideUp .3s ease", border:"1px solid #1e293b" },
  toast: { position:"fixed", bottom:70, left:"50%", transform:"translateX(-50%)", background:"#10b981", color:"#fff", padding:"5px 14px", borderRadius:6, fontSize:11, fontWeight:500, animation:"toastIn .3s ease", zIndex:200 },
};

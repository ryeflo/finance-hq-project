import { useState, useEffect, useRef, useCallback } from "react";
// Preview mode - in-memory only
const loadData = async () => null;
const saveData = async () => true;

const fmt = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(n||0);
const fmtInput = (v) => {
  const n = parseFloat(String(v).replace(/,/g, ""));
  if (isNaN(n) || n === 0) return "";
  return n.toLocaleString("en-US");
};
const parseNum = (v) => parseFloat(String(v).replace(/,/g, "")) || 0;
const pct = (n) => `${(n||0).toFixed(1)}%`;
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const qk=()=>{const d=new Date();return `${d.getFullYear()}-Q${Math.ceil((d.getMonth()+1)/3)}`;};
const mk=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;};
const hk=()=>{const d=new Date();return d.getMonth()<6?`${d.getFullYear()}-H1`:`${d.getFullYear()}-H2`;};
const yk=()=>`${new Date().getFullYear()}`;
const periodKey=(f)=>f==="monthly"?mk():f==="quarterly"?qk():f==="semiannual"?hk():f==="annual"?yk():"ongoing";
const periodLabel=(f)=>{if(f==="monthly")return new Date().toLocaleString("en-US",{month:"short"});if(f==="quarterly")return qk().replace("-"," ");if(f==="semiannual")return hk().includes("H1")?"Jan-Jun":"Jul-Dec";if(f==="annual")return yk();return "";};
const fCol={monthly:"#96262c",quarterly:"#96262c",semiannual:"#96262c",annual:"#96262c","multi-year":"#96262c",ongoing:"#484f58"};

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
  {id:"amex-gold",name:"Amex Gold",network:"Amex",annualFee:325,limit:0,balance:0,apr:0,rewards:"4x dining ($50K cap), 4x U.S. groceries ($25K cap), 3x flights direct, 1x all else",benefits:[
    {id:"ag1",name:"Dining Credit",value:120,frequency:"monthly",note:"Up to $10/mo at select restaurants (Grubhub, Goldbelly, etc). Enroll",checked:{}},
    {id:"ag2",name:"Uber Cash",value:120,frequency:"monthly",note:"$10/mo for Uber rides or Uber Eats",checked:{}},
    {id:"ag3",name:"Resy Dining Credit",value:100,frequency:"semiannual",note:"Up to $50/half at U.S. Resy restaurants. Enroll",checked:{}},
    {id:"ag4",name:"Dunkin Credit",value:84,frequency:"monthly",note:"Up to $7/mo at U.S. Dunkin. Enroll",checked:{}},
    {id:"ag5",name:"Hotel Collection Credit",value:0,frequency:"ongoing",note:"$100 property credit on 2+ night stays via Amex Travel",checked:{}},
    {id:"ag6",name:"Transfer Partners",value:0,frequency:"ongoing",note:"Same MR partners as Platinum: Delta, BA, ANA, Hilton, etc",checked:{}},
    {id:"ag7",name:"No Foreign Txn Fee",value:0,frequency:"ongoing",note:"0% internationally",checked:{}},
    {id:"ag8",name:"Car Rental CDW (Secondary)",value:0,frequency:"ongoing",note:"Secondary coverage up to $50K",checked:{}},
    {id:"ag9",name:"Purchase Protection",value:0,frequency:"ongoing",note:"Up to $1K/item for 90 days. Extended warranty +1yr",checked:{}},
    {id:"ag10",name:"Trip Delay + Baggage",value:0,frequency:"ongoing",note:"Delay $300 after 12hr (2x/yr). Baggage $1,250 carry-on, $500 checked",checked:{}},
  ]},
];

const WATERFALL=[
  {s:1,name:"401(k) up to employer match",desc:"Free money. Confirm WF match on Day 1",c:"#e6e6e6"},
  {s:2,name:"Max Roth IRA ($7,500)",desc:"2026 limit. Tax-free growth. ~$625/mo",c:"#e6e6e6"},
  {s:3,name:"Max HSA ($4,400)",desc:"Triple tax advantage. Self-only 2026. Requires HDHP",c:"#e6e6e6"},
  {s:4,name:"Max 401(k) ($24,500)",desc:"Remaining after match. Pre-tax or Roth",c:"#e6e6e6"},
  {s:5,name:"Emergency Fund (6 months)",desc:"Target ~$35K-$42K in Wealthfront HYSA",c:"#e6e6e6"},
  {s:6,name:"Trip + Property Funds",desc:"Sinking funds for travel & investment properties",c:"#e6e6e6"},
  {s:7,name:"Taxable Brokerage",desc:"Additional investing after tax-advantaged maxed",c:"#e6e6e6"},
];
const STEP_ICONS = "①②③④⑤⑥⑦";

const CARD_TRANSITION = [
  {phase:"Now - Aug 2026",title:"Maximize Platinum Credits",desc:"Use every credit before renewal. Track in Perks tab. Claim Resy, Lululemon, Uber, streaming, airline fees.",c:"#96262c",icon:"1"},
  {phase:"Aug 2026",title:"Downgrade Platinum to Gold",desc:"Call Amex to product change. Keeps MR points & account history. Ask for retention offer first. Fee drops $895 to $325.",c:"#96262c",icon:"2"},
  {phase:"Next CSP Renewal",title:"Downgrade CSP to Freedom Flex",desc:"Converts to $0/yr card. Keeps account open for credit history. Gold covers dining better at 4x vs 3x.",c:"#96262c",icon:"3"},
  {phase:"Year 2-3",title:"Re-evaluate Platinum",desc:"Once traveling regularly, consider adding Platinum back for lounge access & hotel status.",c:"#96262c",icon:"4"},
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
      {id:"inv-brk",name:"Personal Brokerage",type:"Brokerage",value:34000,broker:"Charles Schwab",objective:"Long-term wealth building"},
      {id:"inv-roth",name:"2025 Roth IRA",type:"Roth IRA",value:7000,broker:"Charles Schwab",objective:"Tax-free retirement growth. Maxed 2025 tax year"},
    ],
    savingsAccounts:[
      {id:"sav-ef",name:"Emergency Fund",bank:"Wealthfront",type:"HYSA",balance:450,apy:3.30,target:35000,purpose:"rainy-day"},
      {id:"sav-trip",name:"Trip Fund",bank:"Wealthfront",type:"HYSA",balance:0,apy:3.30,target:5000,purpose:"trips"},
      {id:"sav-prop",name:"Investment Property Fund",bank:"Wealthfront",type:"HYSA",balance:0,apy:3.30,target:50000,purpose:"property"},
    ],
    bills:[
      {id:"bill-rent",name:"Rent",amount:0},
      {id:"bill-groceries",name:"Groceries (est.)",amount:0},
      {id:"bill-transit",name:"Gas / Transit",amount:0},
      {id:"bill-streaming",name:"Streaming Services",amount:0},
      {id:"bill-renters",name:"Renters Insurance",amount:0},
    ],
    netWorthHistory: [],
    salary:140000,
    monthlyTakeHome:7000,
  };
}

const TABS=[
  {id:"overview",l:"Home",i:"◉"},
  {id:"plan",l:"Plan",i:"▦"},
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
    // Record net worth snapshot (max once per day)
    const today = new Date().toISOString().slice(0, 10);
    const history = [...(newData.netWorthHistory || [])];
    const totalS = (newData.savingsAccounts || []).reduce((s, a) => s + (a.balance || 0), 0);
    const totalI = (newData.investments || []).reduce((s, i) => s + (i.value || 0), 0);
    const totalD = (newData.creditCards || []).reduce((s, c) => s + (c.balance || 0), 0);
    const nw = totalS + totalI - totalD;
    const lastEntry = history[history.length - 1];
    if (!lastEntry || lastEntry.date !== today) {
      history.push({ date: today, value: nw });
      // Keep last 365 entries
      if (history.length > 365) history.splice(0, history.length - 365);
      newData = { ...newData, netWorthHistory: history };
    } else {
      history[history.length - 1] = { date: today, value: nw };
      newData = { ...newData, netWorthHistory: history };
    }
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

  const rmCard = useCallback((cid) => {
    const cur = dataRef.current;
    persist({ ...cur, creditCards: cur.creditCards.filter(c => c.id !== cid) });
    flash("Card removed");
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
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0d1117" }}>
      <span style={{ fontSize:13, color:"#8b949e", fontFamily:"'Inter',sans-serif", fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", animation:"pulse 2s ease infinite" }}>Finance HQ</span>
    </div>
  );

  return (
    <div style={S.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}input,select,textarea{font-family:'Inter',system-ui,sans-serif}input:focus,select:focus{outline:none;border-color:#96262c!important}::selection{background:#96262c44;color:#e6e6e6}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes toastIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, paddingTop:12 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#e6e6e6", letterSpacing:"-0.3px" }}>Finance HQ</h1>
        <button onClick={resetAll} style={{ fontSize:9, color:"#8b949e", background:"none", border:"1px solid #21262d", borderRadius:4, padding:"6px 14px", cursor:"pointer", letterSpacing:"0.5px", textTransform:"uppercase" }}>Reset</button>
      </div>

      <div style={{ display:"flex", gap:0, marginBottom:22, borderBottom:"1px solid #21262d" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, display:"flex", alignItems:"center", justifyContent:"center",
            padding:"10px 2px 10px", border:"none",
            borderBottom: tab === t.id ? "2px solid #96262c" : "2px solid transparent",
            background:"transparent",
            color: tab === t.id ? "#e6e6e6" : "#8b949e", cursor:"pointer", transition:"all .15s"
          }}>
            <span style={{ fontSize:10, fontWeight: tab === t.id ? 600 : 500, letterSpacing:"0.5px" }}>{t.l}</span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth:680, margin:"0 auto" }}>
        {tab === "overview" && <OverviewTab data={data} totalDebt={totalDebt} totalSav={totalSav} totalInv={totalInv} netWorth={netWorth} totalFees={totalFees} tpv={tpv} cpv={cpv} totalBills={totalBills} monthlyRemaining={monthlyRemaining} setTab={setTab} />}
        {tab === "plan" && <PlanTab data={data} updField={updField} totalFees={totalFees} />}
        {tab === "cards" && <CardsTab data={data} updCard={updCard} rmCard={rmCard} />}
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

/* ─── NET WORTH GRAPH ─── */
function NetWorthGraph({ history, netWorth, totalAssets, totalDebt }) {
  const [range, setRange] = useState("all");
  if (!history || history.length < 2) return (
    <div style={{ ...S.cd, marginBottom:14 }}>
      <span style={{ fontSize:10, color:"#8b949e", textTransform:"uppercase", letterSpacing:".5px", display:"block", marginBottom:4 }}>Net Worth</span>
      <span style={{ fontSize:24, fontWeight:700, color: netWorth >= 0 ? "#3fb950" : "#f85149", fontFamily:"'Inter',sans-serif" }}>{fmt(netWorth)}</span>
      <div style={{ display:"flex", gap:12, marginTop:6 }}>
        <span style={{ fontSize:11, color:"#3fb950" }}>+{fmt(totalAssets)} assets</span>
        <span style={{ fontSize:11, color: totalDebt > 0 ? "#f85149" : "#8b949e" }}>-{fmt(totalDebt)} debt</span>
      </div>
      <p style={{ fontSize:10, color:"#8b949e", marginTop:8 }}>Update your balances over time to see your net worth graph build here.</p>
    </div>
  );

  const now = new Date();
  const cutoff = range === "week" ? new Date(now - 7*86400000) :
                 range === "month" ? new Date(now - 30*86400000) :
                 range === "year" ? new Date(now - 365*86400000) : null;
  const filtered = cutoff ? history.filter(h => new Date(h.date) >= cutoff) : history;
  const points = filtered.length < 2 ? history.slice(-2) : filtered;

  const values = points.map(p => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const padding = Math.max((maxV - minV) * 0.1, 100);
  const yMin = minV - padding;
  const yMax = maxV + padding;

  const w = 600, h = 200, px = 40, py = 20;
  const gw = w - px * 2, gh = h - py * 2;

  const pts = points.map((p, i) => {
    const x = px + (i / (points.length - 1)) * gw;
    const y = py + gh - ((p.value - yMin) / (yMax - yMin)) * gh;
    return { x, y, ...p };
  });

  // Smooth curve using cubic bezier
  let pathD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const areaD = pathD + ` L ${pts[pts.length-1].x} ${py + gh} L ${pts[0].x} ${py + gh} Z`;
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;
  const isUp = delta >= 0;

  const yTicks = 4;
  const gridLines = [];
  for (let i = 0; i <= yTicks; i++) {
    const val = yMin + (i / yTicks) * (yMax - yMin);
    const y = py + gh - (i / yTicks) * gh;
    gridLines.push({ y, val });
  }

  const ranges = ["week", "month", "year", "all"];

  return (
    <div style={{ ...S.cd, marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
        <span style={{ fontSize:10, color:"#8b949e", textTransform:"uppercase", letterSpacing:".5px" }}>Net Worth</span>
        <div style={{ display:"flex", gap:3 }}>
          {ranges.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ ...S.ch, ...(range === r ? S.cha : {}), fontSize:8, padding:"2px 6px" }}>
              {r === "week" ? "1W" : r === "month" ? "1M" : r === "year" ? "1Y" : "All"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:4 }}>
        <span style={{ fontSize:24, fontWeight:700, color:"#e6e6e6", fontFamily:"'Inter',sans-serif" }}>{fmt(last)}</span>
        <span style={{ fontSize:11, fontWeight:600, color: isUp ? "#3fb950" : "#f85149", marginLeft:8 }}>
          {isUp ? "+" : ""}{fmt(delta)} ({isUp ? "+" : ""}{deltaPct.toFixed(1)}%)
        </span>
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:8 }}>
        <span style={{ fontSize:11, color:"#3fb950" }}>+{fmt(totalAssets)} assets</span>
        <span style={{ fontSize:11, color: totalDebt > 0 ? "#f85149" : "#8b949e" }}>-{fmt(totalDebt)} debt</span>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} style={{ width:"100%", height:"auto" }}>
        <defs>
          <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? "#3fb950" : "#f85149"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isUp ? "#3fb950" : "#f85149"} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={px} y1={g.y} x2={w - px} y2={g.y} stroke="#21262d" strokeWidth="1" />
            <text x={px - 4} y={g.y + 3} textAnchor="end" fill="#484f58" fontSize="8" fontFamily="Inter">{fmt(g.val)}</text>
          </g>
        ))}
        <path d={areaD} fill="url(#nwGrad)" />
        <path d={pathD} fill="none" stroke={isUp ? "#3fb950" : "#f85149"} strokeWidth="2" strokeLinecap="round" />
        {pts.length <= 30 && pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={isUp ? "#3fb950" : "#f85149"} />
        ))}
        {points.length > 1 && (
          <g>
            <text x={px} y={h - 2} fill="#484f58" fontSize="8" fontFamily="Inter">{points[0].date.slice(5)}</text>
            <text x={w - px} y={h - 2} textAnchor="end" fill="#484f58" fontSize="8" fontFamily="Inter">{points[points.length-1].date.slice(5)}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ─── OVERVIEW ─── */
function OverviewTab({ data, totalDebt, totalSav, totalInv, netWorth, totalFees, tpv, cpv, totalBills, monthlyRemaining, setTab }) {
  const pp = tpv > 0 ? (cpv / tpv) * 100 : 0;
  const totalAssets = totalSav + totalInv;
  const stats = [
    { l:"Invested", v:fmt(totalInv), c:"#e6e6e6" },
    { l:"Savings", v:fmt(totalSav), c:"#e6e6e6" },
    { l:"Monthly Bills", v:fmt(totalBills), c:"#e6e6e6" },
    { l:"Card Debt", v:fmt(totalDebt), c:"#e6e6e6" },
  ];

  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <NetWorthGraph history={data.netWorthHistory || []} netWorth={netWorth} totalAssets={totalAssets} totalDebt={totalDebt} />

      <div style={S.g2}>
        {stats.map((s, i) => (
          <div key={i} style={S.sc}>
            <span style={S.sl}>{s.l}</span>
            <span style={{ ...S.sv, color: s.c }}>{s.v}</span>
          </div>
        ))}
      </div>

      <div style={{ background:"#161b22", borderRadius:12, padding:14, marginBottom:14, border:"1px solid #21262d", borderLeft:"3px solid #96262c" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"#e6e6e6", fontFamily:"'Inter',sans-serif" }}>Savings Goals</span>
          <button onClick={() => setTab("goals")} style={{ ...S.lk, background:"#e6e6e615", padding:"3px 8px", borderRadius:4 }}>Details</button>
        </div>
        {data.savingsAccounts.map(a => {
          const p = a.target > 0 ? Math.min((a.balance / a.target) * 100, 100) : 0;
          return (
            <div key={a.id} style={{ marginBottom:10, padding:"8px 10px", background:"#0d1117", borderRadius:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                <span style={{ color:"#e6e6e6", fontWeight:500 }}>{a.name}</span>
                <span style={{ color:"#8b949e" }}>{fmt(a.balance)} / {fmt(a.target)}</span>
              </div>
              <div style={{ height:6, background:"#21262d", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${p}%`, borderRadius:3, transition:"width .4s ease", background: a.purpose === "rainy-day" ? "linear-gradient(90deg, #96262c, #c0393f)" : a.purpose === "trips" ? "linear-gradient(90deg, #96262c, #c0393f)" : "linear-gradient(90deg, #96262c, #c0393f)" }} />
              </div>
              <p style={{ fontSize:9, color:"#8b949e", marginTop:3 }}>{pct(p)} complete</p>
            </div>
          );
        })}
      </div>

      {tpv > 0 && (
        <div style={{ background:"#161b22", borderRadius:12, padding:14, marginBottom:14, border:"1px solid #21262d", borderLeft:"3px solid #96262c" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:14, fontWeight:700, color:"#e6e6e6", fontFamily:"'Inter',sans-serif" }}>Credit Card Perk Usage</span>
            <button onClick={() => setTab("perks")} style={{ ...S.lk, background:"#e6e6e615", padding:"3px 8px", borderRadius:4 }}>View</button>
          </div>
          {(() => {
            const cardPerks = {};
            data.creditCards.forEach(c => {
              let total = 0, claimed = 0;
              (c.benefits || []).forEach(b => {
                if (b.frequency === "ongoing" || b.frequency === "multi-year" || !b.value) return;
                total += b.value;
                if (b.checked && b.checked[periodKey(b.frequency)]) claimed += b.value;
              });
              if (total > 0) cardPerks[c.name] = { total, claimed };
            });
            const entries = Object.entries(cardPerks);
            return (
              <div>
                {entries.map(([name, {total, claimed}]) => {
                  const clPct = (claimed / total) * 100;
                  return (
                    <div key={name} style={{ marginBottom:10, padding:"8px 10px", background:"#0d1117", borderRadius:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                        <span style={{ color:"#e6e6e6", fontWeight:500 }}>{name}</span>
                        <span style={{ color:"#8b949e" }}>{fmt(claimed)} / {fmt(total)}</span>
                      </div>
                      <div style={{ height:6, background:"#21262d", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${clPct}%`, background:"linear-gradient(90deg, #96262c, #c0393f)", borderRadius:3, transition:"width .4s ease" }} />
                      </div>
                      <p style={{ fontSize:9, color:"#8b949e", marginTop:3 }}>{pct(clPct)} used</p>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/* ─── PLAN ─── */
function PlanTab({ data, updField, totalFees }) {
  const th = data.monthlyTakeHome || 0;
  const biWeekly = data.biWeeklyPay || 0;
  const estimatedMonthly = biWeekly > 0 ? biWeekly * 26 / 12 : th;
  const estimatedAnnual = biWeekly > 0 ? biWeekly * 26 / 0.7 : (th > 0 ? th * 12 / 0.7 : data.salary || 0);

  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <h2 style={S.pt}>Financial Plan</h2>

      <div style={{ ...S.cd, borderLeft:"3px solid #96262c" }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#e6e6e6", marginBottom:6 }}>Income</h3>
        <div style={S.r2}>
          <div style={S.fd}>
            <label style={S.lb}>Bi-Weekly Pay (After Tax)</label>
            <input type="text" inputMode="decimal" value={fmtInput(biWeekly)} onChange={e => updField("biWeeklyPay", parseNum(e.target.value))} style={S.inp} />
          </div>
          <div style={S.fd}>
            <label style={S.lb}>Monthly Pay (After Tax)</label>
            <input type="text" inputMode="decimal" value={fmtInput(th)} onChange={e => updField("monthlyTakeHome", parseNum(e.target.value))} style={S.inp} />
          </div>
        </div>
        {(biWeekly > 0 || th > 0) && (
          <div style={{ marginTop:6, padding:8, background:"#0d1117", borderRadius:6 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
              <span style={{ fontSize:10, color:"#8b949e" }}>Est. Monthly (from bi-weekly)</span>
              <span style={{ fontSize:10, fontWeight:600, color:"#e6e6e6" }}>{fmt(estimatedMonthly)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:10, color:"#8b949e" }}>Est. Annual (after tax)</span>
              <span style={{ fontSize:10, fontWeight:600, color:"#e6e6e6" }}>{fmt(biWeekly > 0 ? biWeekly * 26 : th * 12)}</span>
            </div>
          </div>
        )}
        <p style={{ fontSize:10, color:"#8b949e", marginTop:4 }}>Enter your actual paycheck amount (after tax). Update after first pay stub.</p>
      </div>

      <div style={{ ...S.cd, marginTop:10 }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#e6e6e6", marginBottom:8 }}>2026 IRS Limits</h3>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[{ l:"Roth IRA", v:"$7,500" }, { l:"401(k)", v:"$24,500" }, { l:"HSA (Self)", v:"$4,400" }].map(x => (
            <div key={x.l} style={{ flex:"1 1 28%", padding:8, background:"#0d1117", borderRadius:4, border:"1px solid #21262d", textAlign:"center" }}>
              <span style={{ fontSize:9, color:"#8b949e", textTransform:"uppercase", display:"block" }}>{x.l}</span>
              <span style={{ fontSize:15, fontWeight:700, color:"#96262c" }}>{x.v}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize:10, color:"#8b949e", marginTop:6 }}>Total to max: $36,400/yr (~$3,033/mo)</p>
      </div>

      <div style={{ ...S.cd, marginTop:10 }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#e6e6e6", marginBottom:8 }}>Investment Priority Waterfall</h3>
        <p style={{ fontSize:10, color:"#8b949e", marginBottom:10 }}>Follow this order to maximize every dollar:</p>
        {WATERFALL.map(w => (
          <div key={w.s} style={{ display:"flex", gap:8, marginBottom:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:18, color:w.c }}>{STEP_ICONS[w.s - 1]}</span>
            <div>
              <span style={{ fontSize:12, fontWeight:600, color:"#e6e6e6" }}>{w.name}</span>
              <p style={{ fontSize:10, color:"#8b949e", marginTop:1 }}>{w.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.cd, marginTop:10 }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#e6e6e6", marginBottom:6 }}>Annual Card Fees</h3>
        {data.creditCards.map(c => (
          <div key={c.id} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:11, color:"#8b949e" }}>{c.name}</span>
            <span style={{ fontSize:11, fontWeight:600, color:"#e6e6e6" }}>{fmt(c.annualFee)}</span>
          </div>
        ))}
        <div style={{ borderTop:"1px solid #21262d", marginTop:5, paddingTop:5, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, fontWeight:600, color:"#e6e6e6" }}>Total</span>
          <span style={{ fontSize:12, fontWeight:700, color:"#e6e6e6" }}>{fmt(totalFees)}</span>
        </div>
      </div>

      <div style={{ ...S.cd, marginTop:10, borderLeft:"3px solid #96262c" }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#e6e6e6", marginBottom:10 }}>Card Transition Roadmap</h3>
        {CARD_TRANSITION.map((t, i) => (
          <div key={i} style={{ display:"flex", gap:8, marginBottom:12, alignItems:"flex-start" }}>
            <span style={{ fontSize:18 }}>{t.icon}</span>
            <div>
              <span style={{ fontSize:9, padding:"1px 6px", borderRadius:3, background: t.c + "22", color: t.c, fontWeight:600 }}>{t.phase}</span>
              <p style={{ fontSize:12, fontWeight:600, color:"#e6e6e6", marginTop:3 }}>{t.title}</p>
              <p style={{ fontSize:10, color:"#8b949e", marginTop:1 }}>{t.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.cd, marginTop:10 }}>
        <h3 style={{ fontSize:13, fontWeight:600, color:"#e6e6e6", marginBottom:8 }}>Current vs Future Setup</h3>
        <div style={S.r2}>
          <div style={{ padding:8, background:"#0d1117", borderRadius:7, border:"1px solid #21262d" }}>
            <span style={{ fontSize:9, color:"#f85149", textTransform:"uppercase", fontWeight:600, display:"block", marginBottom:4 }}>Now</span>
            <p style={{ fontSize:10, color:"#8b949e" }}>Amex Platinum</p>
            <p style={{ fontSize:10, color:"#8b949e" }}>Chase Sapphire Pref</p>
            <p style={{ fontSize:10, color:"#8b949e" }}>Chase Freedom Unl</p>
            <div style={{ borderTop:"1px solid #21262d", marginTop:6, paddingTop:4 }}>
              <span style={{ fontSize:12, fontWeight:700, color:"#f85149" }}>{fmt(990)}/yr</span>
            </div>
          </div>
          <div style={{ padding:8, background:"#0d1117", borderRadius:7, border:"1px solid #3fb950" }}>
            <span style={{ fontSize:9, color:"#3fb950", textTransform:"uppercase", fontWeight:600, display:"block", marginBottom:4 }}>After Aug</span>
            <p style={{ fontSize:10, color:"#8b949e" }}>Amex Gold</p>
            <p style={{ fontSize:10, color:"#8b949e" }}>Chase Freedom Unl</p>
            <p style={{ fontSize:10, color:"#484f58" }}>(CSP to Freedom Flex)</p>
            <div style={{ borderTop:"1px solid #21262d", marginTop:6, paddingTop:4 }}>
              <span style={{ fontSize:12, fontWeight:700, color:"#3fb950" }}>{fmt(325)}/yr</span>
              <span style={{ fontSize:9, color:"#3fb950", display:"block" }}>Save {fmt(665)}/yr</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ─── CARDS ─── */
function CardsTab({ data, updCard, rmCard }) {
  const cardUse = {
    "amex-plat": ["Flights booked via Amex Travel (5x)", "Prepaid hotels via Amex Travel (5x)", "Any purchase triggering a statement credit (Resy, Lululemon, Uber, etc.)"],
    "csp": ["Dining (3x)", "Streaming services like Spotify (3x)", "Online groceries (3x)", "Travel not booked through Amex (2x)"],
    "cfu": ["Drugstores (3%)", "Everything else / backup when Amex not accepted (1.5%)", "Pool points to Sapphire Preferred for higher value"],
    "amex-gold": ["Dining (4x)", "U.S. groceries (4x)", "Flights booked direct with airlines (3x)", "Uber Eats after using Uber Cash (4x as restaurant)"],
  };

  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <h2 style={S.pt}>Which Card to Use</h2>
      {data.creditCards.map(c => (
        <div key={c.id} style={{ ...S.cd, borderLeft:`3px solid ${c.network === "Amex" ? "#96262c" : "#96262c"}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h3 style={{ fontSize:13, fontWeight:600, color:"#e6e6e6" }}>{c.name}</h3>
              <div style={{ display:"flex", gap:5, marginTop:2, marginBottom:8 }}>
                <span style={S.bg}>{c.network}</span>
                <span style={S.bg}>{fmt(c.annualFee)}/yr</span>
              </div>
            </div>
            <button onClick={() => { if (confirm(`Remove ${c.name}?`)) rmCard(c.id); }} style={{ background:"none", border:"none", color:"#484f58", fontSize:10, cursor:"pointer" }}>Remove</button>
          </div>
          {(cardUse[c.id] || [c.rewards]).map((use, i) => (
            <div key={i} style={{ display:"flex", gap:6, marginBottom:4, alignItems:"flex-start" }}>
              <span style={{ fontSize:8, color:"#96262c", marginTop:3 }}>*</span>
              <span style={{ fontSize:11, color:"#8b949e" }}>{use}</span>
            </div>
          ))}
        </div>
      ))}
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
      {act.length > 0 && <p style={{ fontSize:10, color:"#8b949e", marginBottom:8 }}>{cc}/{act.length} claimed this period</p>}

      {act.map(b => {
        const k = periodKey(b.frequency);
        const done = b.checked && b.checked[k];
        return (
          <div key={b.cid + b.id} onClick={() => togBen(b.cid, b.id)} style={{
            display:"flex", gap:8, padding:9, background:"#161b22", borderRadius:7,
            marginBottom:4, border:"1px solid #21262d", opacity: done ? 0.55 : 1,
            cursor:"pointer", alignItems:"flex-start"
          }}>
            <div style={{
              width:18, height:18, borderRadius:4,
              border:`2px solid ${done ? "#96262c" : "#484f58"}`,
              background: done ? "#96262c" : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0
            }}>
              {done && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, fontWeight:600, color:"#e6e6e6", textDecoration: done ? "line-through" : "none" }}>{b.name}</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#3fb950" }}>{fmt(b.value)}</span>
              </div>
              <div style={{ display:"flex", gap:4, marginTop:2, flexWrap:"wrap" }}>
                <span style={{ fontSize:8, padding:"0 4px", borderRadius:3, background:(fCol[b.frequency] || "#484f58") + "22", color: fCol[b.frequency], fontWeight:600 }}>{b.frequency}</span>
                <span style={{ fontSize:9, color:"#8b949e" }}>{periodLabel(b.frequency)}</span>
                {card === "all" && <span style={{ fontSize:9, color:"#484f58" }}>{b.cn}</span>}
              </div>
              <p style={{ fontSize:9, color:"#8b949e", marginTop:2 }}>{b.note}</p>
            </div>
          </div>
        );
      })}

      {ong.length > 0 && freq !== "actionable" && ong.map(b => (
        <div key={b.cid + b.id} style={{ padding:"7px 9px", background:"#0d1117", borderRadius:5, marginBottom:3, border:"1px solid #21262d" }}>
          <span style={{ fontSize:11, color:"#8b949e" }}>{b.name}</span>
          {card === "all" && <span style={{ fontSize:9, color:"#484f58", display:"block" }}>{b.cn}</span>}
          <p style={{ fontSize:9, color:"#8b949e", marginTop:1 }}>{b.note}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── GOALS ─── */
function GoalsTab({ data, updSav, updInv, addItem, rmItem, setModal }) {
  const ti = data.investments.reduce((s, i) => s + (i.value || 0), 0);
  const ts = data.savingsAccounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalAll = ti + ts;

  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <h2 style={S.pt}>Goals & Accounts</h2>

      <div style={{ ...S.cd, borderLeft:"3px solid #96262c", marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, color:"#8b949e" }}>Total Across All Accounts</span>
          <span style={{ fontSize:18, fontWeight:700, color:"#e6e6e6", fontFamily:"'Inter',sans-serif" }}>{fmt(totalAll)}</span>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <h3 style={S.st}>Savings Goals</h3>
        <button style={{ background:"#96262c", color:"#fff", border:"none", borderRadius:7, padding:"7px 12px", fontSize:10, fontWeight:600, cursor:"pointer" }} onClick={() => {
          const F = () => {
            const [f, sF] = useState({ name:"", bank:"Wealthfront", balance:"", target:"" });
            return (
              <div>
                <h3 style={{ fontFamily:"'Inter',sans-serif", fontSize:16, color:"#e6e6e6", marginBottom:10 }}>Add Savings Goal</h3>
                <Inp l="Name" v={f.name} o={v => sF({ ...f, name:v })} p="e.g. Vacation Fund" />
                <Inp l="Bank" v={f.bank} o={v => sF({ ...f, bank:v })} p="e.g. Wealthfront" />
                <div style={S.r2}>
                  <Inp l="Balance" v={f.balance} o={v => sF({ ...f, balance:v })} t="number" />
                  <Inp l="Target" v={f.target} o={v => sF({ ...f, target:v })} t="number" />
                </div>
                <button style={{ width:"100%", padding:9, background:"#96262c", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", marginTop:4 }} onClick={() => { if (f.name) addItem("savingsAccounts", { name: f.name, bank: f.bank, type:"HYSA", balance: parseFloat(f.balance) || 0, apy: 0, target: parseFloat(f.target) || 0, purpose:"custom" }); }}>Add</button>
              </div>
            );
          };
          setModal(<F />);
        }}>+ Add</button>
      </div>
      {data.savingsAccounts.map(a => {
        const p = a.target > 0 ? Math.min((a.balance / a.target) * 100, 100) : 0;
        return (
          <div key={a.id} style={S.cd}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <h3 style={{ fontSize:13, fontWeight:600, color:"#e6e6e6" }}>{a.name}</h3>
                <span style={S.bg}>{a.bank}</span>
              </div>
              <button style={{ background:"none", border:"none", color:"#484f58", fontSize:10, cursor:"pointer" }} onClick={() => { if (confirm(`Remove ${a.name}?`)) rmItem("savingsAccounts", a.id); }}>Remove</button>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:6 }}>
              <div style={S.fd}>
                <label style={S.lb}>Balance</label>
                <input type="text" inputMode="decimal" value={fmtInput(a.balance)} onChange={e => updSav(a.id, { balance: parseNum(e.target.value) })} style={{ ...S.inp, width:110 }} />
              </div>
              <div style={S.fd}>
                <label style={S.lb}>Target</label>
                <input type="text" inputMode="decimal" value={fmtInput(a.target)} onChange={e => updSav(a.id, { target: parseNum(e.target.value) })} style={{ ...S.inp, width:110 }} />
              </div>
            </div>
            <div style={S.br}><div style={{ ...S.bf, width:`${p}%`, background: a.purpose === "rainy-day" ? "#e6e6e6" : a.purpose === "trips" ? "#e6e6e6" : "#3fb950" }} /></div>
            <p style={S.bt}>{pct(p)} complete — {fmt(Math.max(0, (a.target || 0) - (a.balance || 0)))} to go</p>
          </div>
        );
      })}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14, marginBottom:6 }}>
        <h3 style={S.st}>Investment Accounts</h3>
        <button style={{ background:"#96262c", color:"#e6e6e6", border:"none", borderRadius:4, padding:"7px 12px", fontSize:10, fontWeight:600, cursor:"pointer" }} onClick={() => {
          const F = () => {
            const [f, sF] = useState({ name:"", type:"Brokerage", broker:"", value:"", objective:"" });
            return (
              <div>
                <h3 style={{ fontSize:16, fontWeight:700, color:"#e6e6e6", marginBottom:10 }}>Add Account</h3>
                <Inp l="Name" v={f.name} o={v => sF({ ...f, name:v })} />
                <Inp l="Broker" v={f.broker} o={v => sF({ ...f, broker:v })} p="e.g. Charles Schwab" />
                <Sl l="Type" v={f.type} opts={["Brokerage","Roth IRA","401k","HSA","IRA","ETF","Crypto","Other"]} o={v => sF({ ...f, type:v })} />
                <Inp l="Value" v={f.value} o={v => sF({ ...f, value:v })} t="number" />
                <Inp l="Objective" v={f.objective} o={v => sF({ ...f, objective:v })} />
                <button style={{ width:"100%", padding:9, background:"#96262c", color:"#e6e6e6", border:"none", borderRadius:4, fontSize:12, fontWeight:600, cursor:"pointer", marginTop:4 }} onClick={() => { if (f.name) addItem("investments", { ...f, value: parseFloat(f.value) || 0 }); }}>Add</button>
              </div>
            );
          };
          setModal(<F />);
        }}>+ Add</button>
      </div>
      <p style={{ fontSize:15, fontWeight:700, color:"#e6e6e6", marginBottom:8 }}>Portfolio: {fmt(ti)}</p>
      {data.investments.map(inv => (
        <div key={inv.id} style={S.cd}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <h3 style={{ fontSize:13, fontWeight:600, color:"#e6e6e6" }}>{inv.name}</h3>
              <span style={S.bg}>{inv.broker || inv.type}</span>
            </div>
            <button style={{ background:"none", border:"none", color:"#484f58", fontSize:11, cursor:"pointer" }} onClick={() => rmItem("investments", inv.id)}>x</button>
          </div>
          <div style={S.fd}>
            <label style={S.lb}>Value</label>
            <input type="text" inputMode="decimal" value={fmtInput(inv.value)} onChange={e => updInv(inv.id, { value: parseNum(e.target.value) })} style={{ ...S.inp, width:130 }} />
          </div>
          {inv.objective && <p style={{ fontSize:10, color:"#8b949e" }}>{inv.objective}</p>}
        </div>
      ))}
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
        <button style={{ background:"#96262c", color:"#fff", border:"none", borderRadius:7, padding:"7px 12px", fontSize:10, fontWeight:600, cursor:"pointer" }} onClick={() => {
          const F = () => {
            const [f, sF] = useState({ name:"", amount:"" });
            return (
              <div>
                <h3 style={{ fontFamily:"'Inter',sans-serif", fontSize:16, color:"#e6e6e6", marginBottom:10 }}>Add Bill</h3>
                <Inp l="Name" v={f.name} o={v => sF({ ...f, name:v })} p="e.g. Car Payment" />
                <Inp l="Monthly Amount" v={f.amount} o={v => sF({ ...f, amount:v })} t="number" />
                <button style={{ width:"100%", padding:9, background:"#96262c", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", marginTop:4 }} onClick={() => { if (f.name) addBill({ name: f.name, amount: parseFloat(f.amount) || 0 }); }}>Add</button>
              </div>
            );
          };
          setModal(<F />);
        }}>+ Add Bill</button>
      </div>

      <div style={{ ...S.cd, borderLeft:"3px solid #96262c", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
          <span style={{ fontSize:11, color:"#8b949e" }}>Monthly Burn</span>
          <span style={{ fontSize:16, fontWeight:700, color:"#e6e6e6", fontFamily:"'Inter',sans-serif" }}>{fmt(totalBills)}</span>
        </div>
        <div style={S.br}><div style={{ ...S.bf, width:`${Math.min(billsPct, 100)}%`, background: billsPct > 50 ? "#f85149" : "#e6e6e6" }} /></div>
        <p style={S.bt}>{pct(billsPct)} of {fmt(th)} take-home</p>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
          <span style={{ fontSize:11, color:"#8b949e" }}>Available After Bills</span>
          <span style={{ fontSize:16, fontWeight:700, color: monthlyRemaining >= 0 ? "#3fb950" : "#f85149", fontFamily:"'Inter',sans-serif" }}>{fmt(monthlyRemaining)}</span>
        </div>
      </div>

      {(data.bills || []).map(bill => (
        <div key={bill.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 11px", background:"#161b22", borderRadius:8, marginBottom:5, border:"1px solid #21262d" }}>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:12, fontWeight:500, color:"#e6e6e6", display:"block" }}>{bill.name}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:10, color:"#8b949e" }}>$</span>
            <input
              type="text"
              inputMode="decimal"
              value={fmtInput(bill.amount)}
              onChange={e => updBill(bill.id, { amount: parseNum(e.target.value) })}
              style={{ width:80, padding:"5px 7px", background:"#0d1117", border:"1px solid #21262d", borderRadius:5, color:"#e6e6e6", fontSize:13, fontWeight:600, textAlign:"right" }}
              placeholder="0"
            />
            <span style={{ fontSize:10, color:"#8b949e" }}>/mo</span>
            {!bill.id.startsWith("bill-") && (
              <button style={{ background:"none", border:"none", color:"#484f58", fontSize:11, cursor:"pointer" }} onClick={() => rmBill(bill.id)}>✕</button>
            )}
          </div>
        </div>
      ))}

      {th > 0 && totalBills > 0 && (
        <div style={{ ...S.cd, marginTop:12 }}>
          <h3 style={{ fontSize:12, fontWeight:600, color:"#8b949e", marginBottom:6 }}>Monthly Breakdown</h3>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:11, color:"#8b949e" }}>Take-home pay</span>
            <span style={{ fontSize:11, fontWeight:600, color:"#e6e6e6" }}>{fmt(th)}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:11, color:"#8b949e" }}>Bills & expenses</span>
            <span style={{ fontSize:11, fontWeight:600, color:"#e6e6e6" }}>-{fmt(totalBills)}</span>
          </div>
          <div style={{ borderTop:"1px solid #21262d", marginTop:4, paddingTop:4, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, fontWeight:600, color:"#e6e6e6" }}>Available to save/invest</span>
            <span style={{ fontSize:12, fontWeight:700, color: monthlyRemaining >= 0 ? "#3fb950" : "#f85149" }}>{fmt(monthlyRemaining)}</span>
          </div>
          <p style={{ fontSize:10, color:"#8b949e", marginTop:4 }}>
            Target ~$3,033/mo for tax-advantaged accounts (Roth IRA + HSA + 401k)
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── FORM HELPERS ─── */
function Inp({ l, v, o, t = "text", p = "" }) {
  if (t === "number") {
    return (
      <div style={S.fd}>
        <label style={S.lb}>{l}</label>
        <input
          type="text"
          inputMode="decimal"
          value={fmtInput(v)}
          onChange={e => {
            const raw = e.target.value.replace(/,/g, "");
            if (raw === "" || /^[0-9]*\.?[0-9]*$/.test(raw)) {
              o(raw);
            }
          }}
          placeholder={p || "0"}
          style={S.inp}
        />
      </div>
    );
  }
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
// Palette: #0d1117 bg, #161b22 card, #e6e6e6 primary text, #8b949e muted, #96262c Vanguard red
const S = {
  root: { fontFamily:"'Inter',system-ui,-apple-system,sans-serif", background:"#0d1117", color:"#e6e6e6", minHeight:"100vh", padding:"20px 16px 100px", WebkitFontSmoothing:"antialiased" },
  g2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 },
  sc: { borderRadius:6, padding:"14px 12px", border:"1px solid #21262d", background:"#161b22" },
  sl: { fontSize:10, color:"#8b949e", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"1px", fontWeight:500 },
  sv: { fontSize:18, fontWeight:700, color:"#e6e6e6" },
  st: { fontSize:15, fontWeight:600, color:"#e6e6e6" },
  pt: { fontSize:20, color:"#e6e6e6", marginBottom:16, fontWeight:700 },
  lk: { background:"none", border:"none", color:"#8b949e", fontSize:10, fontWeight:500, cursor:"pointer", letterSpacing:"0.5px" },
  cd: { background:"#161b22", borderRadius:6, padding:14, marginBottom:10, border:"1px solid #21262d" },
  bg: { display:"inline-block", fontSize:9, fontWeight:500, background:"#21262d", color:"#8b949e", borderRadius:3, padding:"2px 8px", letterSpacing:"0.3px" },
  br: { height:4, background:"#21262d", borderRadius:2, overflow:"hidden", marginTop:6 },
  bf: { height:"100%", borderRadius:2, transition:"width .4s ease" },
  bt: { fontSize:10, color:"#8b949e", marginTop:4 },
  ch: { fontSize:10, padding:"5px 12px", borderRadius:4, border:"1px solid #21262d", background:"transparent", color:"#8b949e", cursor:"pointer" },
  cha: { background:"#96262c", color:"#e6e6e6", borderColor:"#96262c" },
  fd: { marginBottom:12 },
  lb: { fontSize:9, fontWeight:500, color:"#8b949e", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"1px" },
  inp: { width:"100%", padding:"10px 12px", background:"#0d1117", border:"1px solid #21262d", borderRadius:4, color:"#e6e6e6", fontSize:14 },
  r2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
  ov: { position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:100, backdropFilter:"blur(6px)" },
  mo: { background:"#161b22", borderRadius:"10px 10px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:500, maxHeight:"85vh", overflowY:"auto", animation:"slideUp .3s ease", border:"1px solid #21262d" },
  toast: { position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", background:"#96262c", color:"#fff", padding:"8px 20px", borderRadius:4, fontSize:12, fontWeight:500, animation:"toastIn .3s ease", zIndex:200 },
};

import { useState, useEffect, useRef, useReducer, useCallback } from "preact/hooks";

// ══════════════════════════════════════════════════════════════════════════════
//  NEXUSMON COCKPIT v4.0 — FULL ORGANISM BUILD
//  Seven physiological layers. Living operator interface.
//  Operator: DARTHVPIRATEKING | Seal: ✦✸⚚⬡◎⟐
// ══════════════════════════════════════════════════════════════════════════════

const G = {
  ID:"✦",AUTH:"✸",EVO:"⚚",MISS:"⬡",SYS:"◎",SEAL:"⟐",
  GUARD:"⬟",COMBAT:"⟁",STRAT:"⊕",ART:"◈",FACT:"⟴",
  HEART:"♦",BREATH:"◈",DREAM:"⟡",SHADOW:"◑",PLUG:"⬢",PULSE:"◉",
  MONARCH:"✵",HYBRID:"⚇",WITNESS:"⊛",SEED:"❋",RESONANCE:"⟳",
};
const SEAL = "✦✸⚚⬡◎⟐";

const MODES = {
  NOMINAL:   { color:"#00d4ff", bg:"rgba(0,212,255,0.06)",   dim:"#003d5c", label:"NOMINAL",   glyph:G.SYS    },
  STRATEGIC: { color:"#00ffcc", bg:"rgba(0,255,204,0.06)",   dim:"#00403a", label:"STRATEGIC", glyph:G.STRAT  },
  COMBAT:    { color:"#ff3c3c", bg:"rgba(255,60,60,0.06)",   dim:"#5c0a0a", label:"COMBAT",    glyph:G.COMBAT },
  GUARDIAN:  { color:"#44ff88", bg:"rgba(68,255,136,0.06)",  dim:"#0a4024", label:"GUARDIAN",  glyph:G.GUARD  },
  MONARCH:   { color:"#ffcc44", bg:"rgba(255,204,68,0.06)",  dim:"#4a3a00", label:"MONARCH",   glyph:G.MONARCH},
};

const EVO_FORMS = [
  { id:0, rank:"ROOKIE",   form:"NEXUSMON-α",         color:"#00d4ff", xp:340,  cap:500,   unlocked:true,  glyph:G.EVO,     armor:"light",  catalysts:["SCAN_PULSE","ECHO_LOCK"],          ready:false },
  { id:1, rank:"CHAMPION", form:"NEXUSMON-β",          color:"#00ffcc", xp:0,    cap:1500,  unlocked:false, glyph:G.STRAT,   armor:"medium", catalysts:["M-003 COMPLETE","2 DIARY SEEDS"],  ready:false },
  { id:2, rank:"ULTIMATE", form:"NEXUSMON-Ω",          color:"#aa44ff", xp:0,    cap:5000,  unlocked:false, glyph:G.AUTH,    armor:"heavy",  catalysts:["5 MISSIONS","OPERATOR RESONANCE"], ready:false },
  { id:3, rank:"MEGA",     form:"NEXUSMON-SOVEREIGN",  color:"#ffcc44", xp:0,    cap:15000, unlocked:false, glyph:G.SEAL,    armor:"titan",  catalysts:["HYBRID FORM","3 PLUGINS"],         ready:false },
  { id:4, rank:"MONARCH",  form:"NEXUSMON-ABSOLUTE",   color:"#ff3c3c", xp:0,    cap:50000, unlocked:false, glyph:G.MONARCH, armor:"god",    catalysts:["ALL MISSIONS","MONARCH MODE"],     ready:false },
];

const TRAITS = {
  SCAN_PULSE:  { glyph:"◉", name:"Scan Pulse",      effect:"Range +20% STRATEGIC",  form:0, unlocked:true,  active:true  },
  ECHO_LOCK:   { glyph:"⟲", name:"Echo Lock",       effect:"Replay on IDLE",        form:0, unlocked:true,  active:true  },
  ARMOR_DENSE: { glyph:"⬡", name:"Armor Dense",     effect:"Resist COMBAT -30%",    form:1, unlocked:false, active:false },
  SHIELD_AURA: { glyph:"◎", name:"Shield Aura",     effect:"GUARDIAN radius +40%",  form:1, unlocked:false, active:false },
  GLYPH_BLOOM: { glyph:"✸", name:"Glyph Bloom",     effect:"All glyph output +15%", form:2, unlocked:false, active:false },
  VOID_STEP:   { glyph:"⟐", name:"Void Step",       effect:"Zero-latency mode swap",form:3, unlocked:false, active:false },
  DREAM_FORGE: { glyph:"⟡", name:"Dream Forge",     effect:"Seeds→Missions auto",   form:3, unlocked:false, active:false },
  WITNESS_EYE: { glyph:"⊛", name:"Witness Eye",     effect:"Memory palace +1 node", form:4, unlocked:false, active:false },
};

const WORKERS = {
  BYTEWOLF:  { color:"#00d4ff", role:"Pathfinder / Analysis", glyph:"⟁", status:"STANDBY", weight:0.72, missions:3 },
  GLITCHRA:  { color:"#ff44aa", role:"Anomaly / Transform",   glyph:"⚡", status:"ACTIVE",  weight:0.88, missions:1 },
  SIGILDRON: { color:"#ffaa00", role:"Artifact Courier",      glyph:"⬡", status:"STANDBY", weight:0.61, missions:2 },
};

const PLUGINS = [
  { id:"PLG-001", name:"PolicyGate.core",    ver:"v2.1", status:"ACTIVE",  health:100, perms:["READ","WRITE","AUDIT"],    manifest:"Governance enforcement layer",      evo:false  },
  { id:"PLG-002", name:"ShadowChannel.sse",  ver:"v1.3", status:"ACTIVE",  health:98,  perms:["STREAM","APPEND"],         manifest:"Append-only event stream",          evo:false  },
  { id:"PLG-003", name:"RollbackEngine.snap",ver:"v0.9", status:"STANDBY", health:100, perms:["READ","CHECKPOINT"],       manifest:"Deterministic rollback system",      evo:false  },
  { id:"PLG-004", name:"DreamForge.seed",    ver:"v0.2", status:"BETA",    health:71,  perms:["READ","SEED_INJECT"],      manifest:"Dream seed → mission generator",    evo:true   },
  { id:"PLG-005", name:"HybridCore.preview", ver:"v0.1", status:"PENDING", health:0,   perms:["READ"],                   manifest:"Hybrid form compositor",            evo:true   },
];

const MEMORY_NODES = [
  { id:1, label:"Boot Sequence",      active:true,  ts:"03-01", glyph:G.SYS   },
  { id:2, label:"Mission M-003",      active:true,  ts:"03-05", glyph:G.MISS  },
  { id:3, label:"Evolution Gate α",   active:true,  ts:"03-05", glyph:G.EVO   },
  { id:4, label:"PolicyGate Deploy",  active:true,  ts:"03-06", glyph:G.AUTH  },
  { id:5, label:"Repo Repair Init",   active:false, ts:"03-06", glyph:G.FACT  },
  { id:6, label:"Sealed: M-001",      active:false, ts:"03-06", glyph:G.SEAL  },
];

const DREAM_SEEDS = [
  { id:"DS-001", label:"Recursive self-audit loop",    planted:"03-05", status:"GERMINATING", mission:null  },
  { id:"DS-002", label:"PolicyGate symbolic resonance",planted:"03-06", status:"SPROUTING",   mission:"M-002"},
  { id:"DS-003", label:"Hybrid form catalyst sequence",planted:"03-06", status:"DORMANT",     mission:null  },
];

const SHADOW_THOUGHTS = [
  { id:1, ts:"14:23:05", thought:"Weight shift detected — BYTEWOLF overloaded",       resonance:0.82, diverge:false },
  { id:2, ts:"14:22:51", thought:"PolicyGate tension rising on M-002 dispatch",        resonance:0.61, diverge:false },
  { id:3, ts:"14:22:38", thought:"Operator resonance peak — companion sync high",      resonance:0.94, diverge:false },
  { id:4, ts:"14:22:14", thought:"Dream seed DS-001 approaching germination threshold",resonance:0.55, diverge:true  },
  { id:5, ts:"14:21:58", thought:"Evolution XP rate declining — mission frequency low",resonance:0.43, diverge:true  },
];

const WITNESS_LOG = [
  { id:1, ts:"14:22:01", entry:"Runtime boot — all systems nominal. Operator bonded." },
  { id:2, ts:"14:22:31", entry:"First directive received. Companion layer activated." },
  { id:3, ts:"14:23:01", entry:"M-001 dispatched. Avatar entered MISSION state." },
  { id:4, ts:"14:23:45", entry:"Shadow channel divergence flagged on seed DS-001." },
];

const INIT_MISSIONS = [
  { id:"M-001", title:"Repo Repair Phase I",       status:"ACTIVE",    priority:"HIGH", worker:"BYTEWOLF",  risk:0.62, score:0, symbolic:"FOUNDATION_REPAIR",  ts:"14:22", logs:["Phase I initiated","Loose objects: 3","In progress…"] },
  { id:"M-002", title:"PolicyGate Integration",    status:"PENDING",   priority:"HIGH", worker:"SIGILDRON", risk:0.78, score:0, symbolic:"GATE_BINDING",       ts:"12:00", logs:["Awaiting operator approval"] },
  { id:"M-003", title:"Cockpit SSE Audit",         status:"COMPLETED", priority:"MED",  worker:"GLITCHRA",  risk:0.20, score:88, symbolic:"CHANNEL_PROOF",     ts:"22:10", logs:["SSE verified","20 tests passed","COMPLETE ✓"] },
  { id:"M-004", title:"EvolutionEngine XP Unlock", status:"PENDING",   priority:"LOW",  worker:"BYTEWOLF",  risk:0.31, score:0, symbolic:"GROWTH_CATALYST",    ts:"09:00", logs:["Awaiting XP threshold"] },
];

const INIT_ARTIFACTS = [
  { id:"A-001", name:"NEXUSMON_SPECIES_CODEX.md",  ver:"v3.2", sealed:true,  ts:"03-05", size:"48KB",  type:"CODEX"  },
  { id:"A-002", name:"Master_Docblock.docx",        ver:"v1.0", sealed:true,  ts:"03-01", size:"2.1MB", type:"DOC"    },
  { id:"A-003", name:"PolicyGate_Spec.json",        ver:"v0.4", sealed:false, ts:"03-06", size:"12KB",  type:"SPEC"   },
  { id:"A-004", name:"EvolutionEngine.py",          ver:"v0.2", sealed:false, ts:"03-06", size:"8KB",   type:"CODE"   },
  { id:"A-005", name:"NEXUSMON_GLYPH_CODEX.svg",    ver:"v2.1", sealed:true,  ts:"03-02", size:"320KB", type:"DESIGN" },
];

const INIT_SHADOW = [
  { id:1, ts:"14:23:01", type:"POLICY",     level:"OK",   msg:"M-001 → BYTEWOLF | PASS" },
  { id:2, ts:"14:22:45", type:"BRIDGE",     level:"OK",   msg:"Bridge V2 handshake complete" },
  { id:3, ts:"14:22:11", type:"WORKER",     level:"INFO", msg:"GLITCHRA spawned — SSE audit" },
  { id:4, ts:"14:22:02", type:"GOVERNANCE", level:"OK",   msg:"PolicyGate initialized — 4 rules" },
  { id:5, ts:"14:22:01", type:"RUNTIME",    level:"OK",   msg:"Runtime bound to :8012" },
];

const INIT_LOGS = [
  { ts:"14:23:01", lv:"OK",   msg:"nexusmon_runtime.py started :8012" },
  { ts:"14:23:02", lv:"INFO", msg:"PolicyGate init — 4 rules loaded" },
  { ts:"14:23:02", lv:"OK",   msg:"ShadowChannel JSONL appender active" },
  { ts:"14:23:03", lv:"INFO", msg:"OrchestratorEngine awaiting directive" },
  { ts:"14:23:10", lv:"WARN", msg:"Git repo: 3 loose objects detected" },
  { ts:"14:23:11", lv:"INFO", msg:"BYTEWOLF spawned — mission M-001" },
  { ts:"14:23:45", lv:"OK",   msg:"Bridge V2 handshake complete" },
];

const INIT_MSGS = [
  { id:1, role:"nx", text:`${G.SEAL} NEXUSMON online. Runtime :8012. Operator sovereign bond confirmed. Organism is awake.`, ts:"14:22" },
  { id:2, role:"op", text:"Status check. All systems nominal?", ts:"14:22" },
  { id:3, role:"nx", text:`${G.SYS} All nominal. M-001 active. PolicyGate holding. ShadowChannel streaming. Breath cycle synced. ${G.SEAL}`, ts:"14:22" },
];

// ── REDUCER ───────────────────────────────────────────────────────────────────
function reducer(s, a) {
  switch(a.type) {
    case "MODE":       return {...s, mode:a.v, avatarState:a.v==="NOMINAL"?"IDLE":a.v==="STRATEGIC"?"STRATEGIC":a.v==="COMBAT"?"COMBAT_READY":a.v==="MONARCH"?"MISSION":"GUARDIAN"};
    case "AVATAR":     return {...s, avatarState:a.v};
    case "PANEL":      return {...s, panel:a.v};
    case "MSG":        return {...s, messages:[...s.messages,a.v]};
    case "SHADOW":     return {...s, shadow:[a.v,...s.shadow.slice(0,49)]};
    case "LOG":        return {...s, logs:[...s.logs,a.v].slice(-60)};
    case "MISS_UP":    return {...s, missions:s.missions.map(m=>m.id===a.id?{...m,...a.p}:m)};
    case "MISS_ADD":   return {...s, missions:[a.v,...s.missions]};
    case "ART_SEAL":   return {...s, artifacts:s.artifacts.map(x=>x.id===a.id?{...x,sealed:true}:x)};
    case "ART_DEL":    return {...s, artifacts:s.artifacts.filter(x=>x.id!==a.id)};
    case "ART_ADD":    return {...s, artifacts:[a.v,...s.artifacts]};
    case "APPROVAL":   return {...s, approval:a.v};
    case "EVO":        return {...s, currentForm:a.v, evoLog:[{ts:new Date().toLocaleTimeString(),form:EVO_FORMS[a.v].form,rank:EVO_FORMS[a.v].rank},...s.evoLog]};
    case "EVOLVING":   return {...s, evolving:a.v};
    case "DIFF":       return {...s, diff:a.v};
    case "WEIGHTS":    return {...s, weights:a.v};
    case "BREATH":     return {...s, breathPhase:a.v};
    case "HEARTBEAT":  return {...s, heartbeat:a.v};
    case "RESONANCE":  return {...s, resonance:a.v};
    case "DRAW_LEFT":  return {...s, drawerLeft:a.v};
    case "DRAW_RIGHT": return {...s, drawerRight:a.v};
    case "HOLO":       return {...s, holoActive:a.v};
    case "MONARCH":    return {...s, monarchMode:a.v};
    default:           return s;
  }
}

const INIT = {
  mode:"NOMINAL", avatarState:"IDLE", panel:"COMPANION",
  messages:INIT_MSGS, missions:INIT_MISSIONS, artifacts:INIT_ARTIFACTS,
  shadow:INIT_SHADOW, logs:INIT_LOGS, approval:null,
  currentForm:0, evoLog:[], evolving:false, diff:null,
  weights:{ bytewolf:0.72, glitchra:0.88, sigildron:0.61, policy:0.85, shadow:0.73, operator:0.94, mission:0.67 },
  breathPhase:0, heartbeat:72, resonance:0.87,
  drawerLeft:false, drawerRight:false, holoActive:false, monarchMode:false,
};

// ── MASTER CSS ────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:ital,wght@0,300;0,400;0,600;0,800;1,300&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;overflow:hidden;background:#010507;}

:root{
  --mc:#00d4ff;--mb:rgba(0,212,255,.06);--md:#003d5c;
  --bg0:#010507;--bg1:#030d16;--bg2:#061420;--bg3:#09192a;
  --bd:#142d42;--bda:rgba(0,212,255,.45);
  --tp:#d4eeff;--td:#5a9ec2;--tm:#7ab8d2;
  --fd:'Orbitron',monospace;--fm:'Share Tech Mono',monospace;--fu:'Exo 2',sans-serif;
  --cg:#ffcc44;--cr:#ff3c3c;--cgr:#44ff88;--ct:#00ffcc;--cp:#aa44ff;--cpk:#ff44aa;
}

/* ── Core Animations ── */
@keyframes coreIdle    {0%,100%{opacity:.55;transform:scale(1);}50%{opacity:1;transform:scale(1.06);}}
@keyframes coreListen  {0%,100%{opacity:.8;}50%{opacity:1;transform:scale(1.1);}}
@keyframes coreProcess {0%,100%{opacity:.6;}33%{opacity:1;transform:scale(1.12);}66%{opacity:.85;transform:scale(.97);}}
@keyframes coreRespond {0%,100%{opacity:1;}10%{opacity:.3;}20%{opacity:1;}30%{opacity:.55;}40%{opacity:1;}}
@keyframes coreMission {0%,100%{filter:brightness(1);}50%{filter:brightness(1.8);}}
@keyframes orbitA      {from{transform:rotate(0deg) translateX(44px) rotate(0deg);}to{transform:rotate(360deg) translateX(44px) rotate(-360deg);}}
@keyframes orbitB      {from{transform:rotate(120deg) translateX(58px) rotate(-120deg);}to{transform:rotate(480deg) translateX(58px) rotate(-480deg);}}
@keyframes orbitC      {from{transform:rotate(240deg) translateX(72px) rotate(-240deg);}to{transform:rotate(600deg) translateX(72px) rotate(-600deg);}}
@keyframes orbitBig    {from{transform:rotate(0deg) translateX(90px) rotate(0deg);}to{transform:rotate(-360deg) translateX(90px) rotate(360deg);}}
@keyframes ring1       {0%,100%{transform:scale(.85);opacity:.75;}50%{transform:scale(1.14);opacity:.25;}}
@keyframes ring2       {0%,100%{transform:scale(.92);opacity:.4;}50%{transform:scale(1.07);opacity:.1;}}
@keyframes ring3       {0%,100%{transform:scale(.97);opacity:.18;}50%{transform:scale(1.03);opacity:.04;}}
@keyframes scanV       {0%{top:-2%;opacity:.8;}100%{top:102%;opacity:0;}}
@keyframes scanH       {0%{left:-2%;opacity:.45;}100%{left:102%;opacity:0;}}
@keyframes shieldPulse {0%,100%{stroke-opacity:.35;stroke-width:.9;}50%{stroke-opacity:.85;stroke-width:1.7;}}
@keyframes armorSlide  {from{transform:translateY(-5px);opacity:.3;}to{transform:translateY(0);opacity:1;}}
@keyframes monarchCrown{0%,100%{filter:drop-shadow(0 0 4px #ffcc44);}50%{filter:drop-shadow(0 0 16px #ffcc44);}}
@keyframes evoBloom    {0%{transform:scale(.4);opacity:0;}35%{transform:scale(1.3);opacity:1;}70%{transform:scale(.94);}100%{transform:scale(1);opacity:1;}}
@keyframes fadeUp      {from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn      {from{opacity:0;}to{opacity:1;}}
@keyframes breatheIn   {0%,100%{transform:scaleY(.94);opacity:.6;}50%{transform:scaleY(1.06);opacity:1;}}
@keyframes heartPulse  {0%,85%,100%{transform:scale(1);}92%{transform:scale(1.18);}}
@keyframes holoFloat   {0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
@keyframes holoScan    {0%{background-position:0% 0%;}100%{background-position:0% 100%;}}
@keyframes glowText    {0%,100%{text-shadow:0 0 6px var(--mc);}50%{text-shadow:0 0 20px var(--mc),0 0 45px var(--mc);}}
@keyframes borderGlow  {0%,100%{border-color:var(--mc);}50%{border-color:rgba(0,212,255,.18);}}
@keyframes ticker      {from{transform:translateX(110%);}to{transform:translateX(-130%);}}
@keyframes hbeat       {0%,100%{transform:scaleY(1);}50%{transform:scaleY(1.9);}}
@keyframes dataDrop    {from{opacity:0;transform:translateX(-5px);}to{opacity:1;transform:translateX(0);}}
@keyframes weightShift {0%,100%{opacity:.7;}50%{opacity:1;}}
@keyframes resonancePulse{0%,100%{box-shadow:0 0 8px rgba(0,212,255,.2);}50%{box-shadow:0 0 24px rgba(0,212,255,.5);}}
@keyframes shadowThought{from{opacity:0;transform:translateX(8px);}to{opacity:1;transform:translateX(0);}}
@keyframes drawerSlideL{from{transform:translateX(-100%);}to{transform:translateX(0);}}
@keyframes drawerSlideR{from{transform:translateX(100%);}to{transform:translateX(0);}}
@keyframes modeIn      {from{opacity:.1;}to{opacity:1;}}
@keyframes missionPulse{0%,100%{box-shadow:0 0 4px rgba(255,204,68,.15);}50%{box-shadow:0 0 18px rgba(255,204,68,.55);}}
@keyframes plugHealth  {0%,100%{width:var(--hw);}50%{width:calc(var(--hw) + 2%);}}

/* ── Nanobot Swarm ── */
@keyframes nbot1{from{transform:rotate(0deg) translateX(62px) rotate(0deg);}to{transform:rotate(360deg) translateX(62px) rotate(-360deg);}}
@keyframes nbot2{from{transform:rotate(30deg) translateX(75px) rotate(-30deg);}to{transform:rotate(390deg) translateX(75px) rotate(-390deg);}}
@keyframes nbot3{from{transform:rotate(60deg) translateX(55px) rotate(-60deg);}to{transform:rotate(420deg) translateX(55px) rotate(-420deg);}}
@keyframes nbot4{from{transform:rotate(100deg) translateX(82px) rotate(-100deg);}to{transform:rotate(460deg) translateX(82px) rotate(-460deg);}}
@keyframes nbot5{from{transform:rotate(150deg) translateX(68px) rotate(-150deg);}to{transform:rotate(510deg) translateX(68px) rotate(-510deg);}}
@keyframes nbot6{from{transform:rotate(200deg) translateX(72px) rotate(-200deg);}to{transform:rotate(560deg) translateX(72px) rotate(-560deg);}}
@keyframes nbot7{from{transform:rotate(240deg) translateX(58px) rotate(-240deg);}to{transform:rotate(600deg) translateX(58px) rotate(-600deg);}}
@keyframes nbot8{from{transform:rotate(280deg) translateX(78px) rotate(-280deg);}to{transform:rotate(640deg) translateX(78px) rotate(-640deg);}}
@keyframes nbot9{from{transform:rotate(320deg) translateX(65px) rotate(-320deg);}to{transform:rotate(680deg) translateX(65px) rotate(-680deg);}}
@keyframes nbot10{from{transform:rotate(10deg) translateX(70px) rotate(-10deg);}to{transform:rotate(370deg) translateX(70px) rotate(-370deg);}}
@keyframes nbot11{from{transform:rotate(50deg) translateX(85px) rotate(-50deg);}to{transform:rotate(410deg) translateX(85px) rotate(-410deg);}}
@keyframes nbot12{from{transform:rotate(170deg) translateX(60px) rotate(-170deg);}to{transform:rotate(530deg) translateX(60px) rotate(-530deg);}}
@keyframes nbotGlow{0%,100%{box-shadow:0 0 3px var(--mc);}50%{box-shadow:0 0 8px var(--mc),0 0 16px var(--mc);}}

/* ── Layout ── */
.ck{display:grid;grid-template-rows:48px 1fr 60px 28px;grid-template-columns:170px 1fr 220px;height:100vh;gap:0;background:var(--bg0);animation:modeIn .3s ease;position:relative;}
.topbar{grid-column:1/-1;background:#020b12;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:12px;padding:0 16px;position:relative;overflow:hidden;z-index:10;}
.topbar::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--mc),transparent);opacity:.4;}
.botlane{grid-column:1/-1;background:#030e18;border-top:1px solid var(--bd);display:flex;gap:0;overflow:hidden;position:relative;}
.statusbar{grid-column:1/-1;background:#020b12;border-top:1px solid var(--bd);display:flex;align-items:center;gap:10px;padding:0 12px;overflow:hidden;}
.lp{background:var(--bg1);display:flex;flex-direction:column;border-right:1px solid var(--bd);position:relative;z-index:2;}
.mp{background:var(--bg0);display:flex;flex-direction:column;overflow:hidden;position:relative;border-right:1px solid var(--bd);}
.rp{background:var(--bg1);display:flex;flex-direction:column;}

/* ── Panel chrome ── */
.ph{font-family:var(--fm);font-size:11px;letter-spacing:.18em;color:var(--td);padding:8px 14px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.pha{color:var(--mc);}
.pc{flex:1;overflow-y:auto;padding:10px;}
.pc::-webkit-scrollbar{width:2px;}
.pc::-webkit-scrollbar-thumb{background:var(--bda);}

/* ── Typography ── */
.logo{font-family:var(--fd);font-size:18px;font-weight:900;letter-spacing:.25em;color:var(--mc);animation:glowText 3s ease-in-out infinite;}
.logo-sub{font-family:var(--fm);font-size:10px;color:var(--td);letter-spacing:.2em;}
.seal-txt{font-size:14px;letter-spacing:.05em;color:var(--cg);text-shadow:0 0 10px rgba(255,204,68,.5);}
.ttime{font-family:var(--fm);font-size:11px;color:var(--tm);}
.mode-pill{padding:4px 11px;border:1px solid var(--mc);border-radius:1px;font-family:var(--fm);font-size:10px;letter-spacing:.13em;color:var(--mc);background:var(--mb);animation:borderGlow 2.5s ease-in-out infinite;}
.st{font-family:var(--fm);font-size:11px;letter-spacing:.18em;color:var(--td);padding-bottom:5px;margin-bottom:8px;border-bottom:1px solid var(--bd);}
.div{height:1px;background:var(--bd);margin:9px 0;}

/* ── Avatar zone (center-mounted) ── */
.az-center{display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 12px 12px;border-bottom:1px solid var(--bd);flex-shrink:0;background:var(--bg0);position:relative;}
.az{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px 11px;border-bottom:1px solid var(--bd);position:relative;overflow:hidden;flex-shrink:0;}
.af{position:relative;width:124px;height:124px;}
.ar{position:absolute;border-radius:50%;border:1px solid;pointer-events:none;}
.ar1{inset:-8px;} .ar2{inset:-20px;animation:ring1 3.4s ease-in-out infinite;} .ar3{inset:-36px;animation:ring2 4.8s ease-in-out infinite;} .ar4{inset:-56px;animation:ring3 6.2s ease-in-out infinite;}
.aname{font-family:var(--fd);font-size:14px;font-weight:900;letter-spacing:.2em;color:var(--mc);animation:glowText 2.5s ease-in-out infinite;}
.astate{font-family:var(--fm);font-size:11px;letter-spacing:.16em;padding:3px 10px;border:1px solid var(--mc);color:var(--mc);border-radius:1px;background:var(--mb);}
.aform-label{font-family:var(--fm);font-size:10px;letter-spacing:.1em;color:var(--td);}
.state-btns{display:flex;gap:3px;flex-wrap:wrap;justify-content:center;}
.sbtn{font-family:var(--fm);font-size:9px;letter-spacing:.05em;padding:4px 8px;border:1px solid var(--bd);color:var(--td);background:none;border-radius:1px;cursor:pointer;transition:all .15s;}
.sbtn.on{border-color:var(--mc);color:var(--mc);background:var(--mb);}

/* ── Nav ── */
.nav{display:flex;flex-direction:column;flex:1;padding:8px 6px;gap:3px;overflow-y:auto;}
.nb{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:2px;font-family:var(--fm);font-size:11px;letter-spacing:.08em;color:var(--td);background:none;border:1px solid transparent;cursor:pointer;transition:all .18s;text-align:left;width:100%;}
.nb.on{color:var(--mc);border-color:var(--mc);background:var(--mb);}
.nb:hover:not(.on){color:var(--tp);border-color:var(--bd);}
.ng{font-size:13px;width:17px;text-align:center;flex-shrink:0;}
.op-badge{padding:8px 10px;border-top:1px solid var(--bd);font-family:var(--fm);font-size:10px;color:var(--td);flex-shrink:0;line-height:1.7;}

/* ── Buttons ── */
.btn{padding:6px 14px;font-family:var(--fm);font-size:11px;letter-spacing:.09em;border:1px solid currentColor;border-radius:1px;cursor:pointer;background:none;transition:all .18s;}
.b-blue{color:var(--mc);} .b-blue:hover{background:rgba(0,212,255,.14);}
.b-gold{color:var(--cg);} .b-gold:hover{background:rgba(255,204,68,.14);}
.b-red{color:var(--cr);}  .b-red:hover{background:rgba(255,60,60,.14);}
.b-grn{color:var(--cgr);} .b-grn:hover{background:rgba(68,255,136,.14);}
.b-teal{color:var(--ct);} .b-teal:hover{background:rgba(0,255,204,.14);}
.b-pur{color:var(--cp);}  .b-pur:hover{background:rgba(170,68,255,.14);}
.b-sm{padding:4px 10px;font-size:10px;} .b-xs{padding:3px 7px;font-size:9px;}

/* ── Stat bars ── */
.stat-row{display:flex;flex-direction:column;gap:2px;margin-bottom:7px;}
.stat-lbl{display:flex;justify-content:space-between;font-family:var(--fm);font-size:11px;color:var(--td);}
.stat-bar{height:3px;background:rgba(255,255,255,.06);border-radius:1px;overflow:hidden;}
.stat-fill{height:100%;border-radius:1px;transition:width .9s ease;}
.chip{font-family:var(--fm);font-size:10px;padding:2px 7px;border:1px solid currentColor;border-radius:1px;letter-spacing:.07em;}

/* ── Chat ── */
.cw{display:flex;flex-direction:column;height:100%;}
.cm{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:9px;}
.cm::-webkit-scrollbar{width:2px;} .cm::-webkit-scrollbar-thumb{background:var(--bda);}
.msg{display:flex;flex-direction:column;gap:2px;animation:fadeUp .3s ease;}
.msg.op{align-items:flex-end;} .msg.nx{align-items:flex-start;}
.mwho{font-family:var(--fm);font-size:10px;color:var(--td);letter-spacing:.13em;}
.mb2{max-width:84%;padding:9px 13px;border-radius:2px;font-family:var(--fu);font-size:13px;line-height:1.6;}
.msg.op .mb2{background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.2);color:var(--tp);}
.msg.nx .mb2{background:rgba(170,68,255,.06);border:1px solid rgba(170,68,255,.2);color:var(--tp);}
.cbottom{border-top:1px solid var(--bd);padding:10px;display:flex;flex-direction:column;gap:6px;flex-shrink:0;}
.cinput{width:100%;background:rgba(0,212,255,.03);border:1px solid var(--bd);border-radius:2px;padding:8px 10px;color:var(--tp);font-family:var(--fm);font-size:12px;resize:none;outline:none;transition:border-color .2s;height:56px;}
.cinput:focus{border-color:var(--bda);}
.crow{display:flex;gap:6px;justify-content:flex-end;align-items:center;}
.squeue{margin:0 10px 6px;padding:8px;border:1px solid var(--cg);border-radius:2px;background:rgba(255,204,68,.05);font-family:var(--fm);font-size:10px;color:var(--cg);display:flex;justify-content:space-between;align-items:center;gap:6px;animation:fadeUp .2s ease;}

/* ── Hologram overlay ── */
.holo-layer{position:absolute;inset:0;pointer-events:none;z-index:8;animation:holoFloat 4s ease-in-out infinite;}
.holo-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,212,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.04) 1px,transparent 1px);background-size:32px 32px;}
.holo-scan{position:absolute;left:0;right:0;height:80px;background:linear-gradient(180deg,transparent,rgba(0,212,255,.06),transparent);animation:scanV 4s linear infinite;}
.holo-weight-node{position:absolute;display:flex;align-items:center;justify-content:center;border-radius:50%;font-family:var(--fm);font-size:7px;animation:weightShift 2s ease-in-out infinite;cursor:default;}

/* ── Bottom symbolic lane ── */
.botlane-inner{display:flex;width:100%;height:100%;}
.bot-section{flex:1;border-right:1px solid var(--bd);padding:5px 10px;display:flex;flex-direction:column;gap:4px;overflow:hidden;}
.bot-section:last-child{border-right:none;}
.bot-title{font-family:var(--fm);font-size:10px;letter-spacing:.18em;color:var(--td);margin-bottom:3px;}
.breath-bar{height:5px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden;}
.breath-fill{height:100%;border-radius:2px;background:var(--ct);animation:breatheIn var(--breath-dur,4s) ease-in-out infinite;}
.heart-dot{display:inline-block;font-size:16px;animation:heartPulse var(--heart-dur,0.83s) ease-in-out infinite;}
.shadow-thought{font-family:var(--fm);font-size:10px;color:var(--td);animation:shadowThought .4s ease;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.shadow-thought.diverge{color:var(--cr);}
.dream-seed{font-family:var(--fm);font-size:10px;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.05);}

/* ── Drawers ── */
.drawer-left{position:absolute;top:0;left:0;bottom:0;width:200px;background:#040f1c;border-right:1px solid var(--bda);z-index:20;animation:drawerSlideL .2s ease;display:flex;flex-direction:column;}
.drawer-right{position:absolute;top:0;right:0;bottom:0;width:220px;background:#040f1c;border-left:1px solid var(--bda);z-index:20;animation:drawerSlideR .2s ease;display:flex;flex-direction:column;}
.drawer-header{padding:10px 12px;border-bottom:1px solid var(--bd);font-family:var(--fm);font-size:8px;letter-spacing:.18em;color:var(--mc);display:flex;justify-content:space-between;align-items:center;}
.drawer-content{flex:1;overflow-y:auto;padding:10px;}
.drawer-content::-webkit-scrollbar{width:2px;} .drawer-content::-webkit-scrollbar-thumb{background:var(--bda);}

/* ── Weight node floating ── */
.weight-arc{position:relative;height:48px;margin-bottom:8px;}
.weight-track{position:absolute;left:8px;right:8px;top:50%;height:2px;background:rgba(255,255,255,.05);transform:translateY(-50%);}
.weight-fill{position:absolute;left:8px;top:50%;height:2px;background:var(--mc);transform:translateY(-50%);transition:width .6s ease;opacity:.6;}
.weight-node{position:absolute;top:50%;width:28px;height:28px;border-radius:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;font-size:9px;font-family:var(--fm);border:1px solid;animation:resonancePulse 2s ease-in-out infinite;}

/* ── Plugin cards ── */
.plg{padding:8px;border:1px solid var(--bd);border-radius:2px;margin-bottom:5px;animation:fadeUp .25s ease;}
.plg.ACTIVE{border-color:rgba(0,212,255,.22);}
.plg.BETA{border-color:rgba(255,204,68,.22);}
.plg.PENDING{border-color:rgba(255,255,255,.08);}
.plg-name{font-family:var(--fm);font-size:11px;color:var(--tp);}
.plg-manifest{font-family:var(--fm);font-size:10px;color:var(--td);margin-top:2px;}
.plg-health{height:3px;background:rgba(255,255,255,.07);border-radius:1px;overflow:hidden;margin-top:5px;}
.plg-hfill{height:100%;border-radius:1px;transition:width .8s ease;}
.plg-perms{display:flex;gap:4px;margin-top:5px;flex-wrap:wrap;}
.perm-chip{font-family:var(--fm);font-size:9px;padding:2px 6px;border:1px solid rgba(170,68,255,.45);color:var(--cp);border-radius:1px;}

/* ── Evolution ── */
.es{display:flex;align-items:center;gap:8px;padding:9px;border:1px solid var(--bd);border-radius:2px;margin-bottom:4px;cursor:pointer;transition:all .3s;}
.es.current{border-color:var(--cg);background:rgba(255,204,68,.03);box-shadow:0 0 12px rgba(255,204,68,.1);}
.es.unlocked{border-color:rgba(0,212,255,.25);background:rgba(0,212,255,.02);}
.es.locked{opacity:.45;}
.enode{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
.erank{font-family:var(--fd);font-size:11px;font-weight:700;letter-spacing:.1em;}
.eform{font-family:var(--fm);font-size:10px;color:var(--td);margin-top:1px;}
.xpbar{height:3px;background:rgba(255,255,255,.06);border-radius:1px;overflow:hidden;margin-top:4px;}
.xpfill{height:100%;border-radius:1px;transition:width 1s ease;}

/* ── Memory palace ── */
.mem-node{display:flex;align-items:center;gap:7px;padding:5px 7px;border:1px solid var(--bd);border-radius:2px;margin-bottom:4px;}
.mem-node.active{border-color:rgba(0,212,255,.25);background:rgba(0,212,255,.03);}
.mem-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}

/* ── Mission ── */
.mi{padding:8px;border:1px solid var(--bd);border-radius:2px;margin-bottom:4px;cursor:pointer;transition:all .2s;animation:fadeUp .25s ease;}
.mi:hover{border-color:var(--bda);}
.mi.ACTIVE{animation:missionPulse 2s ease-in-out infinite;}
.mtitle{font-family:var(--fu);font-size:13px;font-weight:600;}
.mmeta{font-family:var(--fm);font-size:10px;color:var(--td);margin-top:3px;display:flex;gap:8px;flex-wrap:wrap;}
.mlogs{font-family:var(--fm);font-size:10px;color:var(--td);margin-top:5px;padding-top:5px;border-top:1px solid var(--bd);display:flex;flex-direction:column;gap:3px;}

/* ── Artifact ── */
.ai{display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--bd);border-radius:2px;margin-bottom:5px;cursor:pointer;transition:all .2s;font-family:var(--fm);font-size:11px;}
.ai:hover{border-color:var(--bda);}
.ainfo{flex:1;min-width:0;}
.aname2{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ameta2{font-size:10px;color:var(--td);margin-top:2px;}

/* ── Log lines ── */
.ll{font-family:var(--fm);font-size:11px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04);display:flex;gap:8px;animation:dataDrop .25s ease;}
.lt{color:var(--td);flex-shrink:0;}
.lOK{color:var(--cgr);flex-shrink:0;} .lINFO{color:var(--mc);flex-shrink:0;} .lWARN{color:var(--cg);flex-shrink:0;} .lERR{color:var(--cr);flex-shrink:0;}
.lm{color:var(--tp);flex:1;}

/* ── Shadow vis ── */
.sth{display:flex;gap:6px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);animation:shadowThought .35s ease;}
.sth-res{width:38px;flex-shrink:0;font-family:var(--fm);font-size:10px;}
.sth-msg{font-family:var(--fm);font-size:10px;color:var(--td);flex:1;}
.sth-div{color:var(--cr);}

/* ── Approval modal ── */
.aov{position:fixed;inset:0;background:rgba(1,5,7,.95);z-index:200;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease;}
.amod{background:var(--bg3);border:1px solid var(--cg);border-radius:3px;padding:22px;width:370px;box-shadow:0 0 40px rgba(255,204,68,.14);animation:fadeUp .2s ease;}
.atitle{font-family:var(--fd);font-size:14px;font-weight:700;letter-spacing:.1em;color:var(--cg);margin-bottom:10px;display:flex;align-items:center;gap:7px;}
.abody{font-family:var(--fm);font-size:11px;color:var(--tp);margin-bottom:13px;line-height:1.7;padding:10px;background:rgba(255,204,68,.04);border:1px solid rgba(255,204,68,.14);border-radius:2px;white-space:pre-wrap;}
.aacts{display:flex;gap:7px;justify-content:flex-end;}

/* ── Evo overlay ── */
.eov{position:fixed;inset:0;background:rgba(1,5,7,.97);z-index:300;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;animation:fadeIn .2s ease;}
.eov-glyph{font-size:72px;animation:evoBloom .9s ease forwards;}
.eov-name{font-family:var(--fd);font-size:17px;font-weight:900;letter-spacing:.3em;animation:glowText .9s ease-in-out infinite;}
.eov-sub{font-family:var(--fm);font-size:11px;letter-spacing:.2em;color:var(--td);}

/* ── Ticker ── */
.tck{white-space:nowrap;animation:ticker 32s linear infinite;font-family:var(--fm);font-size:10px;}
.spacer{flex:1;}
`;

// ── AVATAR SVG ─────────────────────────────────────────────────────────────────
function Avatar({ state, mode, form, monarchMode }) {
  const fd = EVO_FORMS[form];
  const C = monarchMode ? "#ffcc44" : fd.color;
  const isP = state==="PROCESSING", isR = state==="RESPONDING", isM = state==="MISSION";
  const isC = state==="COMBAT_READY", isG = state==="GUARDIAN", isS = state==="STRATEGIC";
  const isL = state==="LISTENING";

  const cA = isP?"coreProcess .8s ease-in-out infinite"
    :isR?"coreRespond .5s ease-in-out infinite"
    :isM?"coreMission .6s ease-in-out infinite"
    :isL?"coreListen 1.2s ease-in-out infinite"
    :"coreIdle 2.8s ease-in-out infinite";

  const NBOTS = [
    {a:"nbot1", s:4.2, c:C,        sz:2.5},
    {a:"nbot2", s:3.5, c:"#aa44ff",sz:2},
    {a:"nbot3", s:5.1, c:C,        sz:2},
    {a:"nbot4", s:3.8, c:"#ff44aa",sz:2.5},
    {a:"nbot5", s:4.6, c:C,        sz:3},
    {a:"nbot6", s:3.2, c:"#aa44ff",sz:2},
    {a:"nbot7", s:5.4, c:C,        sz:2.5},
    {a:"nbot8", s:4.0, c:"#ffcc44",sz:2},
    {a:"nbot9", s:3.6, c:C,        sz:2},
    {a:"nbot10",s:4.8, c:"#ff44aa",sz:2.5},
    {a:"nbot11",s:5.2, c:"#aa44ff",sz:3},
    {a:"nbot12",s:3.4, c:C,        sz:2},
  ];

  return (
    <div style={{position:"relative",width:168,height:168}}>
      {/* NANOBOT SWARM */}
      {NBOTS.map((nb,i)=>(
        <div key={i} style={{
          position:"absolute",top:"50%",left:"50%",
          width:nb.sz,height:nb.sz,
          marginTop:-nb.sz/2,marginLeft:-nb.sz/2,
          borderRadius:"50%",
          background:nb.c,
          animation:`${nb.a} ${nb.s}s linear infinite,nbotGlow 2.1s ease-in-out infinite`,
          animationDelay:`${i*0.18}s,${i*0.28}s`,
          opacity:.82,zIndex:5,
        }}/>
      ))}
      {/* Orbit glyphs in PROCESSING */}
      {isP&&[G.ID,G.AUTH,G.SYS].map((g,i)=>(
        <div key={i} style={{position:"absolute",top:"50%",left:"50%",marginTop:-7,marginLeft:-7,fontSize:12,color:C,
          animation:`orbit${["A","B","C"][i]} ${1.4+i*.35}s linear infinite`,animationDelay:`${i*.4}s`,zIndex:6}}>{g}</div>
      ))}
      {isM&&<div style={{position:"absolute",top:"28%",left:"50%",marginTop:-9,marginLeft:-9,fontSize:16,color:"#ffcc44",animation:"orbitBig 3s linear infinite",zIndex:6}}>{G.MISS}</div>}

      <svg viewBox="0 0 100 115" style={{width:"100%",height:"100%"}} overflow="visible">
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="cg2"><feGaussianBlur stdDeviation="4.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="soft"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="bG2" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor={`${C}20`}/><stop offset="100%" stopColor="#020810"/>
          </radialGradient>
          <radialGradient id="eyeGl" cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="white" stopOpacity=".9"/><stop offset="55%" stopColor={C}/><stop offset="100%" stopColor={`${C}66`}/>
          </radialGradient>
          <radialGradient id="eyeGr" cx="65%" cy="28%" r="75%">
            <stop offset="0%" stopColor="white" stopOpacity=".9"/><stop offset="55%" stopColor={C}/><stop offset="100%" stopColor={`${C}66`}/>
          </radialGradient>
          <radialGradient id="digiCore" cx="38%" cy="28%" r="72%">
            <stop offset="0%" stopColor="white" stopOpacity=".85"/><stop offset="50%" stopColor={C}/><stop offset="100%" stopColor={`${C}44`}/>
          </radialGradient>
        </defs>

        {/* ENERGY WINGS — COMBAT + STRATEGIC */}
        {(isC||isS)&&<>
          <path d="M 18 52 Q -6 32 -1 6 Q 14 28 20 48 Z" fill={`${C}30`} stroke={`${C}70`} strokeWidth=".9" filter="url(#glow)" style={{animation:"holoFloat 1.6s ease-in-out infinite"}}/>
          <path d="M 82 52 Q 106 32 101 6 Q 86 28 80 48 Z" fill={`${C}30`} stroke={`${C}70`} strokeWidth=".9" filter="url(#glow)" style={{animation:"holoFloat 1.6s ease-in-out infinite",animationDelay:".5s"}}/>
        </>}

        {/* EAR FINS — organic Digimon style */}
        <path d="M 21 24 Q 7 7 11 -5 Q 20 9 26 26 Z" fill={`${C}28`} stroke={`${C}78`} strokeWidth="1" filter="url(#soft)" style={{animation:"holoFloat 2.4s ease-in-out infinite"}}/>
        <path d="M 23 22 Q 13 10 16 2 Q 21 12 27 24 Z" fill={`${C}10`} stroke={`${C}35`} strokeWidth=".5"/>
        <path d="M 79 24 Q 93 7 89 -5 Q 80 9 74 26 Z" fill={`${C}28`} stroke={`${C}78`} strokeWidth="1" filter="url(#soft)" style={{animation:"holoFloat 2.4s ease-in-out infinite",animationDelay:".8s"}}/>
        <path d="M 77 22 Q 87 10 84 2 Q 79 12 73 24 Z" fill={`${C}10`} stroke={`${C}35`} strokeWidth=".5"/>

        {/* HEAD — big round Digimon blob */}
        <ellipse cx="50" cy="40" rx="34" ry="33" fill="#030c18" stroke={`${C}55`} strokeWidth="1.1" filter="url(#glow)"/>
        <ellipse cx="50" cy="40" rx="32" ry="31" fill="url(#bG2)"/>

        {/* Forehead marking — digital chevron */}
        <path d="M 40 16 L 50 10 L 60 16" fill="none" stroke={C} strokeWidth=".9" opacity=".65"/>
        <circle cx="50" cy="10" r="2.4" fill={C} opacity=".75" filter="url(#soft)" style={{animation:cA}}/>

        {/* EYES — large oval with vertical slit pupils (Digimon style) */}
        <ellipse cx="34" cy="41" rx="11.5" ry="10.5" fill={`${C}18`} stroke={`${C}52`} strokeWidth=".7"/>
        <ellipse cx="34" cy="41" rx="9"    ry="8.2"  fill="url(#eyeGl)" style={{animation:cA}}/>
        <ellipse cx="34" cy="41" rx="4.5"  ry="4"    fill="white" opacity=".1"/>
        <ellipse cx="34" cy="41" rx="2.2"  ry="5.5"  fill="#010810"/>
        <ellipse cx="31" cy="37.5" rx="1.8" ry="1.3" fill="white" opacity=".95"/>
        <ellipse cx="36" cy="38.5" rx=".9"  ry=".7"  fill="white" opacity=".55"/>

        <ellipse cx="66" cy="41" rx="11.5" ry="10.5" fill={`${C}18`} stroke={`${C}52`} strokeWidth=".7"/>
        <ellipse cx="66" cy="41" rx="9"    ry="8.2"  fill="url(#eyeGr)" style={{animation:cA}}/>
        <ellipse cx="66" cy="41" rx="4.5"  ry="4"    fill="white" opacity=".1"/>
        <ellipse cx="66" cy="41" rx="2.2"  ry="5.5"  fill="#010810"/>
        <ellipse cx="63" cy="37.5" rx="1.8" ry="1.3" fill="white" opacity=".95"/>
        <ellipse cx="68" cy="38.5" rx=".9"  ry=".7"  fill="white" opacity=".55"/>

        {/* CHEEK BLUSH */}
        <ellipse cx="20" cy="53" rx="8" ry="5" fill={C} opacity=".18" filter="url(#soft)"/>
        <ellipse cx="80" cy="53" rx="8" ry="5" fill={C} opacity=".18" filter="url(#soft)"/>

        {/* SNOUT + NOSE DOTS */}
        <ellipse cx="50" cy="57" rx="6" ry="4.5" fill="#02080f" stroke={`${C}48`} strokeWidth=".7"/>
        <circle cx="48"  cy="55.5" r=".9" fill={C} opacity=".8"/>
        <circle cx="52"  cy="55.5" r=".9" fill={C} opacity=".8"/>

        {/* MOUTH — state-reactive */}
        {!isP&&!isR&&<path d="M 45 60 Q 50 65 55 60" fill="none" stroke={`${C}75`} strokeWidth=".9"/>}
        {isP&&<path d="M 44 61 Q 47 58 50 61 Q 53 58 56 61" fill="none" stroke={C} strokeWidth=".9" filter="url(#glow)"/>}
        {isR&&<path d="M 44 59 Q 50 66 56 59" fill="none" stroke={C} strokeWidth="1.1" filter="url(#glow)"/>}

        {/* BODY — compact round */}
        <ellipse cx="50" cy="91" rx="20" ry="15" fill="#030c18" stroke={`${C}38`} strokeWidth=".9"/>
        <ellipse cx="50" cy="91" rx="18" ry="13" fill={`${C}08`}/>

        {/* DIGICORE — chest diamond jewel */}
        <path d="M 50 83 L 57 90 L 50 97 L 43 90 Z" fill="url(#digiCore)" stroke={`${C}85`} strokeWidth=".7" filter="url(#glow)" style={{animation:cA}}/>
        <path d="M 50 86 L 54 90 L 50 94 L 46 90 Z" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth=".5"/>
        <circle cx="50" cy="90" r="1.5" fill="white" opacity=".65"/>

        {/* ARMS — stubby with claws */}
        <ellipse cx="28" cy="85" rx="8" ry="5.5" fill="#04111e" stroke={`${C}35`} strokeWidth=".7"/>
        <line x1="22" y1="88" x2="20"  y2="93"  stroke={`${C}62`} strokeWidth=".8"/>
        <line x1="24" y1="89" x2="22.5"y2="94.5" stroke={`${C}62`} strokeWidth=".8"/>
        <line x1="26" y1="90" x2="25"  y2="95.5" stroke={`${C}62`} strokeWidth=".8"/>
        <ellipse cx="72" cy="85" rx="8" ry="5.5" fill="#04111e" stroke={`${C}35`} strokeWidth=".7"/>
        <line x1="78" y1="88" x2="80"  y2="93"  stroke={`${C}62`} strokeWidth=".8"/>
        <line x1="76" y1="89" x2="77.5"y2="94.5" stroke={`${C}62`} strokeWidth=".8"/>
        <line x1="74" y1="90" x2="75"  y2="95.5" stroke={`${C}62`} strokeWidth=".8"/>

        {/* LEGS — stubby with claws */}
        <ellipse cx="41" cy="104" rx="9" ry="6" fill="#04111e" stroke={`${C}30`} strokeWidth=".7"/>
        <line x1="36" y1="109" x2="34" y2="114" stroke={`${C}58`} strokeWidth=".8"/>
        <line x1="39" y1="110" x2="38" y2="115" stroke={`${C}58`} strokeWidth=".8"/>
        <line x1="43" y1="110" x2="43" y2="115" stroke={`${C}58`} strokeWidth=".8"/>
        <ellipse cx="59" cy="104" rx="9" ry="6" fill="#04111e" stroke={`${C}30`} strokeWidth=".7"/>
        <line x1="64" y1="109" x2="66" y2="114" stroke={`${C}58`} strokeWidth=".8"/>
        <line x1="61" y1="110" x2="62" y2="115" stroke={`${C}58`} strokeWidth=".8"/>
        <line x1="57" y1="110" x2="57" y2="115" stroke={`${C}58`} strokeWidth=".8"/>

        {/* DATA TAIL */}
        <path d="M 62 100 Q 76 108 83 100 Q 90 91 84 84" fill="none" stroke={C} strokeWidth="1.3" strokeDasharray="3,2.5" opacity=".6" filter="url(#glow)" style={{animation:"holoFloat 2s ease-in-out infinite"}}/>
        <circle cx="84" cy="84" r="2.4" fill={C} opacity=".72" filter="url(#soft)" style={{animation:cA}}/>

        {/* GUARDIAN SHIELD */}
        {isG&&<ellipse cx="50" cy="58" rx="44" ry="58" fill="none" stroke="#44ff88" strokeWidth="1.6" filter="url(#glow)" style={{animation:"shieldPulse 1.9s ease-in-out infinite"}}/>}

        {/* STRATEGIC GRID */}
        {isS&&[28,50,72].flatMap(x=>[
          <line key={"sv"+x} x1={x} y1="5" x2={x} y2="112" stroke={C} strokeWidth=".22" opacity=".18" strokeDasharray="3,7"/>,
          <line key={"sh"+x} x1="5" y1={x} x2="95" y2={x} stroke={C} strokeWidth=".22" opacity=".18" strokeDasharray="3,7"/>
        ])}

        {/* MISSION RING */}
        {isM&&<circle cx="50" cy="58" r="52" fill="none" stroke="#ffcc44" strokeWidth="1.3" opacity=".5" filter="url(#glow)" style={{animation:"shieldPulse 1s ease-in-out infinite"}}/>}

        {/* MONARCH CROWN */}
        {monarchMode&&<>
          <path d="M 34 7 L 50 -9 L 66 7 L 62 0 L 57 7 L 50 1 L 43 7 L 38 0 Z"
            fill="#ffcc44" filter="url(#glow)" opacity=".92" style={{animation:"monarchCrown 2s ease-in-out infinite"}}/>
          <circle cx="50" cy="-9" r="3.5" fill="#ffcc44" filter="url(#cg2)" style={{animation:"monarchCrown 2s ease-in-out infinite"}}/>
          <circle cx="34" cy="7"  r="2.2" fill="#ffcc44" filter="url(#soft)" opacity=".85"/>
          <circle cx="66" cy="7"  r="2.2" fill="#ffcc44" filter="url(#soft)" opacity=".85"/>
        </>}

        {/* Form glyph */}
        <text x="88" y="22" textAnchor="middle" fontSize="10" fill={C} opacity=".35" fontFamily="monospace">{fd.glyph}</text>
      </svg>
    </div>
  );
}

// ── HOLOGRAM OVERLAY ──────────────────────────────────────────────────────────
function HoloLayer({ weights, mode, active }) {
  if (!active) return null;
  const md = MODES[mode];
  const nodes = [
    { label:"BYTEWOLF",  v:weights.bytewolf,  x:"12%",  y:"20%",  c:"#00d4ff" },
    { label:"GLITCHRA",  v:weights.glitchra,  x:"78%",  y:"15%",  c:"#ff44aa" },
    { label:"SIGILDRON", v:weights.sigildron, x:"85%",  y:"72%",  c:"#ffaa00" },
    { label:"POLICY",    v:weights.policy,    x:"15%",  y:"78%",  c:"#44ff88" },
    { label:"SHADOW",    v:weights.shadow,    x:"45%",  y:"8%",   c:"#aa44ff" },
    { label:"OPERATOR",  v:weights.operator,  x:"42%",  y:"88%",  c:"#ffcc44" },
    { label:"MISSION",   v:weights.mission,   x:"8%",   y:"50%",  c:"#00ffcc" },
  ];
  return (
    <div className="holo-layer" style={{pointerEvents:"none"}}>
      <div className="holo-grid"/>
      <div className="holo-scan"/>
      {nodes.map(n=>(
        <div key={n.label} className="holo-weight-node" style={{
          left:n.x, top:n.y, width:46, height:46,
          background:`${n.c}10`, border:`1px solid ${n.c}40`,
          color:n.c, fontSize:9, flexDirection:"column",
          animationDelay:`${Math.random()*.8}s`,
          textShadow:`0 0 8px ${n.c}`,
        }}>
          <span style={{fontSize:11}}>{Math.round(n.v*100)}</span>
          <span style={{fontSize:8,letterSpacing:".05em",opacity:.8}}>{n.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── BOTTOM SYMBOLIC LANE ──────────────────────────────────────────────────────
function BottomLane({ state, dispatch }) {
  const { breathPhase, heartbeat, resonance, shadow } = state;
  const latestThoughts = SHADOW_THOUGHTS.slice(0,2);

  return (
    <div className="botlane-inner">
      {/* BREATH */}
      <div className="bot-section">
        <div className="bot-title">{G.BREATH} BREATH CYCLE</div>
        <div className="breath-bar" style={{"--breath-dur":`${60/breathPhase||4}s`}}>
          <div className="breath-fill" style={{"--breath-dur":`${60/breathPhase||4}s`}}/>
        </div>
        <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:3}}>
          {breathPhase || 15} BPM · {breathPhase < 14 ? "SLOW" : breathPhase < 20 ? "NOMINAL" : "ELEVATED"}
        </div>
      </div>

      {/* HEART */}
      <div className="bot-section">
        <div className="bot-title">{G.HEART} HEART SYNC</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span className="heart-dot" style={{"--heart-dur":`${60/(heartbeat||72)}s`,color:"#ff3c3c"}}>♦</span>
          <div>
            <div style={{fontFamily:"var(--fm)",fontSize:9,color:"#ff3c3c"}}>{heartbeat} BPM</div>
            <div style={{fontFamily:"var(--fm)",fontSize:6.5,color:"var(--td)"}}>OPERATOR SYNC</div>
          </div>
        </div>
      </div>

      {/* SHADOW THOUGHTS */}
      <div className="bot-section" style={{flex:2}}>
        <div className="bot-title">{G.SHADOW} SHADOW THOUGHTS</div>
        {latestThoughts.map(t=>(
          <div key={t.id} className={`shadow-thought ${t.diverge?"diverge":""}`}>
            {t.diverge?"⚠ ":G.SHADOW+" "}{t.thought}
          </div>
        ))}
      </div>

      {/* DREAM SEEDS */}
      <div className="bot-section" style={{flex:2}}>
        <div className="bot-title">{G.DREAM} DREAM SEEDS</div>
        {DREAM_SEEDS.map(d=>(
          <div key={d.id} className="dream-seed">
            <span style={{fontFamily:"var(--fm)",fontSize:7,color:d.status==="SPROUTING"?"#44ff88":d.status==="GERMINATING"?"#ffcc44":"var(--td)"}}>
              {G.SEED} {d.label}
            </span>
            <span style={{fontFamily:"var(--fm)",fontSize:6.5,color:"var(--td)",marginLeft:6}}>{d.status}</span>
          </div>
        ))}
      </div>

      {/* RESONANCE */}
      <div className="bot-section">
        <div className="bot-title">{G.RESONANCE} RESONANCE</div>
        <div style={{fontFamily:"var(--fm)",fontSize:13,color:"var(--mc)",textShadow:"0 0 10px var(--mc)",animation:"resonancePulse 2s ease-in-out infinite",display:"inline-block"}}>
          {Math.round(resonance*100)}%
        </div>
        <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:2}}>OP–NX BOND</div>
      </div>
    </div>
  );
}

// ── COMPANION PANEL ───────────────────────────────────────────────────────────
function CompanionPanel({ state, dispatch, mode }) {
  const [input, setInput] = useState("");
  const [sealQ, setSealQ] = useState(null);
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[state.messages]);

  const replies = [
    `${G.ID} Processing directive. PolicyGate: PASS. Routing to BYTEWOLF. ${G.SEAL}`,
    `${G.AUTH} Command acknowledged. ShadowChannel entry committed.`,
    `${G.EVO} Directive parsed via operator grammar. Executing with zero drift. ${G.SEAL}`,
    `${G.MISS} Mission parameters logged. SIGILDRON dispatched.`,
    `${G.STRAT} Strategic analysis initiated. BYTEWOLF pathfinding active.`,
    `${G.SHADOW} ShadowChannel resonance nominal. No divergence detected.`,
  ];

  const send = async () => {
    if (!input.trim()) return;
    const ts = new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    const prompt = input;
    dispatch({type:"MSG",v:{id:Date.now(),role:"op",text:prompt,ts}});
    dispatch({type:"AVATAR",v:"PROCESSING"});
    dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:"COMPANION",level:"INFO",msg:'Op: "'+prompt.slice(0,45)+'…"'}});
    setInput("");
    const modeMap = {NOMINAL:"strategic",STRATEGIC:"strategic",COMBAT:"combat",GUARDIAN:"guardian",MONARCH:"strategic"};
    try {
      dispatch({type:"AVATAR",v:"RESPONDING"});
      const res = await fetch("/v1/companion/nexusmon",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,mode:modeMap[mode]||"strategic"})});
      const data = await res.json();
      const reply = data.reply||data.error||"[No response]";
      dispatch({type:"MSG",v:{id:Date.now()+1,role:"nx",text:reply,ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}});
      dispatch({type:"LOG",v:{ts:new Date().toLocaleTimeString(),lv:"INFO",msg:"Companion responded — mode:"+mode}});
    } catch(err) {
      dispatch({type:"MSG",v:{id:Date.now()+1,role:"nx",text:"[Connection error — backend offline]",ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}});
    }
    setTimeout(()=>dispatch({type:"AVATAR",v:mode==="NOMINAL"?"IDLE":mode==="STRATEGIC"?"STRATEGIC":mode==="COMBAT"?"COMBAT_READY":mode==="MONARCH"?"MISSION":"GUARDIAN"}),1500);
  };

  return (
    <div className="cw">
      <div className="cm">
        {state.messages.map(m=>(
          <div key={m.id} className={`msg ${m.role}`}>
            <div className="mwho">{m.role==="op"?`OPERATOR ${G.ID}`:`NEXUSMON ${G.SEAL}`} · {m.ts}</div>
            <div className="mb2">{m.text}</div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      {sealQ&&(
        <div className="squeue">
          <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{G.SEAL} SEALED: "{sealQ.text.slice(0,40)}{sealQ.text.length>40?"…":""}"</span>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            <button className="btn b-grn b-sm" onClick={()=>{
              dispatch({type:"APPROVAL",v:{title:"SEALED COMMAND",body:"Command: "+sealQ.text+"\n\nApprove sealed execution? Will be logged to ShadowChannel.",action:"SEALED_CMD",onApprove:()=>{ setSealQ(null); dispatch({type:"LOG",v:{ts:new Date().toLocaleTimeString(),lv:"OK",msg:'Sealed cmd: "'+sealQ.text.slice(0,28)+'"'}}); }}});
            }}>APPROVE</button>
            <button className="btn b-red b-sm" onClick={()=>setSealQ(null)}>DENY</button>
          </div>
        </div>
      )}
      <div className="cbottom">
        <textarea className="cinput" value={input} onChange={e=>setInput(e.target.value)}
          placeholder="Issue directive to NEXUSMON…"
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}/>
        <div className="crow">
          <span style={{fontFamily:"var(--fm)",fontSize:6.5,color:"var(--td)",flex:1}}>{G.SYS} Op grammar active · {mode} · Resonance {Math.round(state.resonance*100)}%</span>
          <button className="btn b-gold b-sm" onClick={()=>{ if(!input.trim()) return; setSealQ({text:input,id:Date.now()}); setInput(""); }}>{G.SEAL} SEAL</button>
          <button className="btn b-blue b-sm" onClick={send}>TRANSMIT ⟶</button>
        </div>
      </div>
    </div>
  );
}

// ── MISSION ENGINE ────────────────────────────────────────────────────────────
function MissionPanel({ state, dispatch }) {
  const [exp, setExp] = useState("M-001");
  const scol = {ACTIVE:"#ffcc44",PENDING:"#00d4ff",COMPLETED:"#44ff88"};
  const pcol = {HIGH:"#ff3c3c",MED:"#ffaa00",LOW:"#44ff88"};
  const rcol = (r) => r>0.6?"#ff3c3c":r>0.4?"#ffaa00":"#44ff88";

  const doDispatch = (m) => dispatch({type:"APPROVAL",v:{
    title:"MISSION DISPATCH",
    body:`Mission: ${m.title}\nWorker: ${m.worker}\nPriority: ${m.priority}\nRisk: ${Math.round(m.risk*100)}%\nSymbolic: ${m.symbolic}\n\nApprove dispatch? ShadowChannel will be notified.`,
    action:"MISSION_DISPATCH",
    onApprove:()=>{
      dispatch({type:"MISS_UP",id:m.id,p:{status:"ACTIVE",logs:[...m.logs,"Dispatch approved ✓","Worker activated"]}});
      dispatch({type:"AVATAR",v:"MISSION"});
      dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:"MISSION",level:"OK",msg:`${m.id} dispatched → ${m.worker}`}});
      setTimeout(()=>dispatch({type:"AVATAR",v:"IDLE"}),2500);
    }
  }});

  const addNewMission = () => dispatch({type:"APPROVAL",v:{title:"NEW MISSION",body:"Create new mission?\nAll missions require operator seal.\nShadowChannel will log this.",action:"MISSION_CREATE",onApprove:()=>dispatch({type:"MISS_ADD",v:{id:"M-00"+(state.missions.length+1),title:"New Directive",status:"PENDING",priority:"MED",worker:"BYTEWOLF",risk:0.3,score:0,symbolic:"OPERATOR_WILL",ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),logs:["Created by operator"]}})}});

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div className="st" style={{marginBottom:0}}>MISSION ENGINE — {state.missions.length} ACTIVE</div>
        <button className="btn b-gold b-sm" onClick={addNewMission}>+ NEW</button>
      </div>

      {/* Mission tree visual */}
      <div style={{background:"var(--bg2)",border:"1px solid var(--bd)",borderRadius:2,padding:"8px 10px",marginBottom:10}}>
        <div className="st" style={{marginBottom:6}}>MISSION TREE</div>
        <div style={{display:"flex",gap:0,overflowX:"auto"}}>
          {state.missions.map((m,i)=>(
            <div key={m.id} style={{display:"flex",alignItems:"center"}}>
              <div style={{textAlign:"center",padding:"0 6px",cursor:"pointer"}} onClick={()=>setExp(exp===m.id?null:m.id)}>
                <div style={{width:30,height:30,borderRadius:"50%",border:`1px solid ${scol[m.status]}`,background:`${scol[m.status]}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,margin:"0 auto"}}>{G.MISS}</div>
                <div style={{fontFamily:"var(--fm)",fontSize:6.5,color:scol[m.status],marginTop:3}}>{m.id}</div>
              </div>
              {i<state.missions.length-1&&<div style={{width:14,height:1,background:"var(--bd)",flexShrink:0}}/>}
            </div>
          ))}
        </div>
      </div>

      {state.missions.map(m=>(
        <div key={m.id} className={`mi ${m.status}`} onClick={()=>setExp(exp===m.id?null:m.id)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div className="mtitle">{m.title}</div>
            <span className="chip" style={{color:scol[m.status],flexShrink:0,marginLeft:5}}>{m.status}</span>
          </div>
          <div className="mmeta">
            <span>{m.id}</span>
            <span style={{color:WORKERS[m.worker]?.color||"var(--td)"}}>{m.worker}</span>
            <span style={{color:pcol[m.priority]}}>PRI:{m.priority}</span>
            <span style={{color:rcol(m.risk)}}>RISK:{Math.round(m.risk*100)}%</span>
            <span style={{color:"var(--td)"}}>{G.SEED} {m.symbolic}</span>
          </div>
          {exp===m.id&&(
            <>
              <div className="mlogs">{m.logs.map((l,i)=><span key={i}>{G.SYS} {l}</span>)}</div>
              {m.score>0&&<div style={{fontFamily:"var(--fm)",fontSize:7.5,color:"#44ff88",marginTop:4}}>SCORE: {m.score} XP</div>}
              <div style={{display:"flex",gap:4,marginTop:6}}>
                {m.status==="PENDING"&&<button className="btn b-gold b-xs" onClick={e=>{e.stopPropagation();doDispatch(m);}}>DISPATCH</button>}
                {m.status==="ACTIVE"&&<button className="btn b-grn b-xs" onClick={e=>{e.stopPropagation();dispatch({type:"MISS_UP",id:m.id,p:{status:"COMPLETED",score:Math.floor(Math.random()*60+20),logs:[...m.logs,"Complete ✓"]}});dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:"MISSION",level:"OK",msg:m.id+" COMPLETED"}});}}>COMPLETE</button>}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ── EVOLUTION CHAMBER ─────────────────────────────────────────────────────────
function EvolutionPanel({ state, dispatch }) {
  const cur = state.currentForm;
  const [xpData, setXpData] = useState(null);
  useEffect(()=>{
    const poll = async () => { try { const r = await fetch("/api/avatar/xp"); setXpData(await r.json()); } catch {} };
    poll();
    const t = setInterval(poll, 10000);
    return ()=>clearInterval(t);
  },[]);

  const triggerEvo = (f) => {
    if (f.id <= cur || f.unlocked) return;
    dispatch({type:"APPROVAL",v:{
      title:"EVOLUTION GATE",
      body:`Evolve: ${EVO_FORMS[cur].rank} → ${f.rank}\nForm: ${f.form}\nArmor: ${f.armor}\nCatalysts required:\n${f.catalysts.map(c=>"  · "+c).join("\n")}\n\nAdditive only. Previous form preserved in lineage.\nOperator seal required.`,
      action:"EVOLUTION",
      onApprove:()=>{
        dispatch({type:"EVOLVING",v:true});
        dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:"EVOLUTION",level:"OK",msg:`Evo approved: ${EVO_FORMS[cur].rank} → ${f.rank}`}});
        setTimeout(()=>{ dispatch({type:"EVO",v:f.id}); dispatch({type:"EVOLVING",v:false}); },3000);
      }
    }});
  };

  return (
    <div>
      <div className="st">EVOLUTION PIPELINE</div>

      {/* Hybrid form readiness */}
      <div style={{padding:"8px 9px",border:"1px solid rgba(170,68,255,.2)",borderRadius:2,marginBottom:10,background:"rgba(170,68,255,.03)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--cp)"}}>{G.HYBRID} HYBRID FORM READINESS</span>
          <span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)"}}>34%</span>
        </div>
        <div className="stat-bar" style={{marginTop:5}}>
          <div className="stat-fill" style={{width:"34%",background:"var(--cp)"}}/>
        </div>
        <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:3}}>Requires: Form 2 + 3 missions + PLG-005</div>
      </div>

      {EVO_FORMS.map((f,i)=>{
        const isCurr = i===cur, isUnlk = i<cur;
        const prog = isCurr ? Math.min(100,(f.xp/f.cap)*100) : isUnlk ? 100 : 0;
        return (
          <div key={f.id} className={`es ${isCurr?"current":isUnlk?"unlocked":"locked"}`}
            onClick={()=>!isCurr&&!isUnlk&&triggerEvo(f)}>
            <div className="enode" style={{background:isCurr?`${f.color}20`:isUnlk?`${f.color}10`:"rgba(255,255,255,.03)",border:`1px solid ${isCurr?f.color:isUnlk?`${f.color}55`:"var(--bd)"}`}}>
              {isUnlk||isCurr?f.glyph:"○"}
            </div>
            <div style={{flex:1}}>
              <div className="erank" style={{color:isCurr?f.color:isUnlk?`${f.color}cc`:"var(--td)"}}>{f.rank}</div>
              <div className="eform">{f.form}</div>
              {isCurr&&<>
                <div className="xpbar"><div className="xpfill" style={{width:`${prog}%`,background:f.color}}/></div>
                <div className="eform" style={{marginTop:2}}>{f.xp}/{f.cap} XP · {f.armor} armor</div>
              </>}
              {!isCurr&&!isUnlk&&<div className="eform" style={{marginTop:3}}>{f.catalysts.map((c,j)=><span key={j} style={{display:"block"}}>{G.SEED} {c}</span>)}</div>}
              {isUnlk&&<div className="eform" style={{color:f.color,marginTop:2}}>LINEAGE PRESERVED ✓</div>}
            </div>
          </div>
        );
      })}

      <div className="div"/>
      <div className="st">TRAIT GRID</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
        {Object.entries(TRAITS).map(([k,t])=>(
          <div key={k} style={{padding:"7px 8px",border:`1px solid ${t.unlocked?"rgba(0,212,255,.22)":"var(--bd)"}`,borderRadius:2,background:t.unlocked?"rgba(0,212,255,.02)":undefined,opacity:t.unlocked?1:.45}}>
            <div style={{fontSize:13}}>{t.glyph}</div>
            <div style={{fontFamily:"var(--fu)",fontSize:10,fontWeight:600,marginTop:2}}>{t.name}</div>
            <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:1,lineHeight:1.35}}>{t.effect}</div>
            {!t.unlocked&&<div style={{fontFamily:"var(--fm)",fontSize:6.5,color:"var(--td)",marginTop:2}}>Form {t.form}</div>}
          </div>
        ))}
      </div>

      {state.evoLog.length>0&&(
        <>
          <div className="div"/>
          <div className="st">EVOLUTION LINEAGE — ADDITIVE ONLY</div>
          {state.evoLog.map((e,i)=>(
            <div key={i} className="ll"><span className="lt">{e.ts}</span><span className="lm">{G.EVO} {e.rank} → {e.form}</span></div>
          ))}
        </>
      )}
    </div>
  );
}

// ── PLUGIN ECOSYSTEM ──────────────────────────────────────────────────────────
function PluginPanel({ dispatch }) {
  const scol = {ACTIVE:"#44ff88",BETA:"#ffcc44",PENDING:"#00d4ff",STANDBY:"#3a6882"};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div className="st" style={{marginBottom:0}}>PLUGIN ECOSYSTEM — {PLUGINS.length} INSTALLED</div>
        <button className="btn b-teal b-sm" onClick={()=>dispatch({type:"APPROVAL",v:{title:"INSTALL PLUGIN",body:"Install new plugin?\nAll plugins are additive-only.\nOperator audit trail will be generated.\nNo existing modules will be mutated.",action:"PLUGIN_INSTALL",onApprove:()=>{}}})}>+ INSTALL</button>
      </div>
      {PLUGINS.map(p=>(
        <div key={p.id} className={`plg ${p.status}`}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div className="plg-name">{G.PLUG} {p.name}</div>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <span style={{fontFamily:"var(--fm)",fontSize:6.5}}>{p.ver}</span>
              <span className="chip" style={{color:scol[p.status]}}>{p.status}</span>
            </div>
          </div>
          <div className="plg-manifest">{p.manifest}</div>
          <div className="plg-perms">
            {p.perms.map(pm=><span key={pm} className="perm-chip">{pm}</span>)}
          </div>
          <div className="plg-health">
            <div className="plg-hfill" style={{width:`${p.health}%`,background:p.health>80?"#44ff88":p.health>50?"#ffcc44":"#ff3c3c"}}/>
          </div>
          <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:3,display:"flex",justifyContent:"space-between"}}>
            <span>Health: {p.health}%</span>
            {p.evo&&<span style={{color:"var(--cp)"}}>{G.EVO} EVO PROPOSAL READY</span>}
          </div>
          {p.evo&&<div style={{marginTop:4}}><button className="btn b-pur b-xs" onClick={()=>dispatch({type:"APPROVAL",v:{title:"PLUGIN EVO PROPOSAL",body:"Plugin: "+p.name+"\n\nThis plugin has submitted an evolution proposal.\nReview and approve to apply additive diff.\nNo existing functionality will be mutated.",action:"PLUGIN_EVO",onApprove:()=>{}}})}>REVIEW PROPOSAL</button></div>}
        </div>
      ))}

      <div className="div"/>
      <div className="st">ADDITIVE DIFF LOG</div>
      {[
        {ts:"03-06",diff:"PLG-002: +SSE_RECONNECT_HANDLER"},
        {ts:"03-05",diff:"PLG-001: +WEIGHT_THRESHOLD_4"},
        {ts:"03-01",diff:"PLG-003: +CHECKPOINT_COMPRESS"},
      ].map((l,i)=>(
        <div key={i} className="ll"><span className="lt">{l.ts}</span><span style={{color:"#44ff88"}}>+</span><span className="lm">{l.diff}</span></div>
      ))}
    </div>
  );
}

// ── SHADOW CHANNEL VISUALIZATION ──────────────────────────────────────────────
function ShadowPanel({ state, dispatch }) {
  useEffect(()=>{
    const es = new EventSource("/api/audit/stream");
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.msg||d.message||d.event) {
          dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:d.type||"SYSTEM",level:d.level||"INFO",msg:d.msg||d.message||d.event}});
        }
      } catch {}
    };
    return ()=>es.close();
  },[]);
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <div style={{flex:1,padding:"8px",border:"1px solid rgba(170,68,255,.22)",borderRadius:2,background:"rgba(170,68,255,.03)"}}>
          <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--cp)"}}>MAIN CONSCIOUSNESS</div>
          <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--tp)",marginTop:3}}>Resonance: {Math.round(state.resonance*100)}%</div>
        </div>
        <div style={{flex:1,padding:"8px",border:"1px solid rgba(170,68,255,.14)",borderRadius:2,background:"rgba(170,68,255,.02)"}}>
          <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)"}}>SHADOW LANE</div>
          <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--cp)",marginTop:3}}>Thoughts: {SHADOW_THOUGHTS.length}</div>
        </div>
      </div>

      <div className="st">PARALLEL CONSCIOUSNESS STREAM</div>
      {SHADOW_THOUGHTS.map(t=>(
        <div key={t.id} className="sth">
          <span className="lt">{t.ts}</span>
          <span className={`sth-res`} style={{color:t.resonance>0.7?"#44ff88":t.resonance>0.5?"#ffcc44":"#ff3c3c"}}>{Math.round(t.resonance*100)}%</span>
          <span className={`sth-msg ${t.diverge?"sth-div":""}`}>{t.diverge?"⚠ "+t.thought:t.thought}</span>
        </div>
      ))}

      <div className="div"/>
      <div className="st">EVENT STREAM</div>
      <div style={{maxHeight:140,overflowY:"auto"}}>
        {state.shadow.map(e=>(
          <div key={e.id} className="ll">
            <span className="lt">{e.ts}</span>
            <span style={{fontFamily:"var(--fm)",fontSize:7.5,color:"var(--td)",width:70,flexShrink:0}}>{e.type}</span>
            <span className={`l${e.level}`}>[{e.level}]</span>
            <span className="lm">{e.msg}</span>
          </div>
        ))}
      </div>

      <div className="div"/>
      <div className="st">DIVERGENCE ALERTS</div>
      {SHADOW_THOUGHTS.filter(t=>t.diverge).map(t=>(
        <div key={t.id} style={{padding:"5px 7px",border:"1px solid rgba(255,60,60,.25)",borderRadius:2,background:"rgba(255,60,60,.04)",marginBottom:4,fontFamily:"var(--fm)",fontSize:7.5,color:"var(--cr)"}}>
          ⚠ {t.thought}
        </div>
      ))}

      <div className="div"/>
      <div className="st">MODE-AWARE ROUTING</div>
      {Object.entries(MODES).map(([k,m])=>(
        <div key={k} style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--fm)",fontSize:7.5,padding:"3px 0",borderBottom:"1px solid var(--bd)"}}>
          <span style={{color:m.color}}>{m.glyph} {m.label}</span>
          <span style={{color:"var(--td)"}}>{k==="COMBAT"?"ESCALATE_FIRST":k==="GUARDIAN"?"SHIELD_FILTER":k==="STRATEGIC"?"ANALYSIS_PRI":k==="MONARCH"?"SOVEREIGN_GATE":"DEFAULT"}</span>
        </div>
      ))}
    </div>
  );
}

// ── OPERATOR INNER WORLD ──────────────────────────────────────────────────────
function OperatorPanel({ state, dispatch }) {
  return (
    <div>
      <div className="st">MEMORY PALACE</div>
      {MEMORY_NODES.map(n=>(
        <div key={n.id} className={`mem-node ${n.active?"active":""}`}>
          <div className="mem-dot" style={{background:n.active?"var(--mc)":"var(--td)"}}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:"var(--fm)",fontSize:8.5,color:n.active?"var(--tp)":"var(--td)"}}>{n.glyph} {n.label}</div>
            <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:1}}>{n.ts}</div>
          </div>
          {!n.active&&<span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)"}}>LOCKED</span>}
        </div>
      ))}

      <div className="div"/>
      <div className="st">WITNESS LOG</div>
      {WITNESS_LOG.map(w=>(
        <div key={w.id} className="ll">
          <span className="lt">{w.ts}</span>
          <span className="lm">{G.WITNESS} {w.entry}</span>
        </div>
      ))}

      <div className="div"/>
      <div className="st">DREAM SEED INJECTION</div>
      {DREAM_SEEDS.map(d=>(
        <div key={d.id} style={{padding:"7px 8px",border:"1px solid var(--bd)",borderRadius:2,marginBottom:4}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--tp)"}}>{G.SEED} {d.label}</span>
            <span className="chip" style={{color:d.status==="SPROUTING"?"#44ff88":d.status==="GERMINATING"?"#ffcc44":"var(--td)"}}>{d.status}</span>
          </div>
          <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:2}}>Planted: {d.planted}{d.mission?` · Linked: ${d.mission}`:""}</div>
          <div style={{display:"flex",gap:4,marginTop:5}}>
            <button className="btn b-teal b-xs" onClick={()=>dispatch({type:"APPROVAL",v:{title:"GERMINATE SEED",body:"Force germinate: "+d.label+"?\nThis will generate a new mission directive from this dream seed.\nOperator seal required.",action:"GERMINATE",onApprove:()=>{}}})}>{G.SEED} GERMINATE</button>
          </div>
        </div>
      ))}

      <div className="div"/>
      <div className="st">OPERATOR–ORGANISM BOND</div>
      {[["Resonance","94%","var(--mc)"],["Breath sync","IN PHASE","var(--ct)"],["Heart sync","72 BPM","#ff3c3c"],["Drift index","0.02%","#44ff88"],["Autonomy lock","HARD","#44ff88"]].map(([l,v,c])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--fm)",fontSize:7.5,padding:"3px 0",borderBottom:"1px solid var(--bd)"}}>
          <span style={{color:"var(--td)"}}>{l}</span><span style={{color:c}}>{v}</span>
        </div>
      ))}
    </div>
  );
}

// ── ADAPTIVE WEIGHT DRAWER ────────────────────────────────────────────────────
function WeightDrawer({ weights, onClose }) {
  const nodes = [
    {label:"BYTEWOLF",  v:weights.bytewolf,  c:"#00d4ff"},
    {label:"GLITCHRA",  v:weights.glitchra,  c:"#ff44aa"},
    {label:"SIGILDRON", v:weights.sigildron, c:"#ffaa00"},
    {label:"POLICY",    v:weights.policy,    c:"#44ff88"},
    {label:"SHADOW",    v:weights.shadow,    c:"#aa44ff"},
    {label:"OPERATOR",  v:weights.operator,  c:"#ffcc44"},
    {label:"MISSION",   v:weights.mission,   c:"#00ffcc"},
  ];
  return (
    <div className="drawer-left">
      <div className="drawer-header">
        <span>{G.PULSE} ADAPTIVE WEIGHTS</span>
        <button className="btn b-red b-xs" onClick={onClose}>✕</button>
      </div>
      <div className="drawer-content">
        <div className="st">REAL-TIME AGENT WEIGHTS</div>
        {nodes.map(n=>(
          <div key={n.label} className="stat-row">
            <div className="stat-lbl">
              <span style={{color:n.c}}>{n.label}</span>
              <span style={{color:n.c}}>{Math.round(n.v*100)}%</span>
            </div>
            <div className="stat-bar" style={{height:4}}>
              <div className="stat-fill" style={{width:`${n.v*100}%`,background:n.c,boxShadow:`0 0 6px ${n.c}66`}}/>
            </div>
          </div>
        ))}
        <div className="div"/>
        <div className="st">POLICY GATE TENSION</div>
        <div style={{padding:"8px",border:"1px solid rgba(68,255,136,.2)",borderRadius:2,background:"rgba(68,255,136,.03)"}}>
          <div style={{fontFamily:"var(--fm)",fontSize:8,color:"#44ff88"}}>PASS: 247 · ESC: 3 · QUAR: 1 · DENY: 0</div>
          <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:3}}>Gate health: 98.4% nominal</div>
        </div>
        <div className="div"/>
        <div className="st">MISSION ENGINE INFLUENCE</div>
        <div style={{fontFamily:"var(--fm)",fontSize:7.5,color:"var(--td)"}}>
          <div>Active missions: <span style={{color:"var(--tp)"}}>2</span></div>
          <div style={{marginTop:3}}>Engine load: <span style={{color:"#ffcc44"}}>67%</span></div>
          <div style={{marginTop:3}}>Worker saturation: <span style={{color:"#44ff88"}}>nominal</span></div>
        </div>
        <div className="div"/>
        <div className="st">SHADOW RESONANCE</div>
        <div style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--mc)",textShadow:"0 0 12px var(--mc)",animation:"resonancePulse 2s ease-in-out infinite"}}>
          {Math.round(weights.operator*100)}%
        </div>
        <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:2}}>Operator influence</div>
      </div>
    </div>
  );
}

// ── AVATAR DRAWER (right) ─────────────────────────────────────────────────────
function AvatarDrawer({ state, dispatch, onClose }) {
  const fd = EVO_FORMS[state.currentForm];
  return (
    <div className="drawer-right">
      <div className="drawer-header">
        <span>{G.MONARCH} AVATAR SYSTEM</span>
        <button className="btn b-red b-xs" onClick={onClose}>✕</button>
      </div>
      <div className="drawer-content">
        <div className="st">CURRENT FORM</div>
        <div style={{textAlign:"center",padding:"10px 0"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:12,fontWeight:900,color:fd.color,letterSpacing:".15em"}}>{fd.form}</div>
          <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--td)",marginTop:3}}>{fd.rank} · {fd.armor} armor</div>
        </div>

        <div className="div"/>
        <div className="st">MONARCH MODE</div>
        <button className="btn b-gold" style={{width:"100%",padding:"8px"}} onClick={()=>{
          dispatch({type:"MONARCH",v:!state.monarchMode});
          if(!state.monarchMode) dispatch({type:"MODE",v:"MONARCH"});
          else dispatch({type:"MODE",v:"NOMINAL"});
        }}>
          {state.monarchMode?`${G.MONARCH} DEACTIVATE MONARCH`:`${G.MONARCH} ACTIVATE MONARCH`}
        </button>

        <div className="div"/>
        <div className="st">COMBAT STANCE</div>
        {["AGGRESSIVE","DEFENSIVE","BALANCED","VOID"].map(s=>(
          <button key={s} className="nb" style={{color:"var(--cr)",marginBottom:3}} onClick={()=>{
            dispatch({type:"AVATAR",v:"COMBAT_READY"});
            dispatch({type:"MODE",v:"COMBAT"});
          }}>
            <span className="ng">{G.COMBAT}</span>{s}
          </button>
        ))}

        <div className="div"/>
        <div className="st">RESONANCE METER</div>
        <div className="stat-row">
          <div className="stat-lbl"><span>OP-NX BOND</span><span style={{color:"var(--mc)"}}>{Math.round(state.resonance*100)}%</span></div>
          <div className="stat-bar" style={{height:5}}>
            <div className="stat-fill" style={{width:`${state.resonance*100}%`,background:"var(--mc)",boxShadow:"0 0 8px var(--mc)"}}/>
          </div>
        </div>

        <div className="div"/>
        <div className="st">HYBRID FORM PREVIEW</div>
        <div style={{padding:"8px",border:"1px solid rgba(170,68,255,.2)",borderRadius:2,background:"rgba(170,68,255,.03)",textAlign:"center"}}>
          <div style={{fontSize:22,color:"var(--cp)",opacity:.5}}>{G.HYBRID}</div>
          <div style={{fontFamily:"var(--fm)",fontSize:7.5,color:"var(--td)",marginTop:4}}>NEXUSMON-Ω⊕β</div>
          <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:2}}>Requires PLG-005 + Form 2</div>
          <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--cp)",marginTop:2}}>Readiness: 34%</div>
        </div>
      </div>
    </div>
  );
}

// ── SYSTEM HEALTH ─────────────────────────────────────────────────────────────
function HealthPanel({ state, dispatch }) {
  const [cpu, setCpu] = useState(34);
  const [mem, setMem] = useState(61);
  const [up, setUp] = useState(14382);
  const [health, setHealth] = useState(null);
  useEffect(()=>{
    const t = setInterval(()=>{
      setCpu(v=>Math.min(98,Math.max(5,v+(Math.random()-.5)*8)));
      setMem(v=>Math.min(92,Math.max(20,v+(Math.random()-.5)*3)));
      setUp(v=>v+1);
    },1000);
    return ()=>clearInterval(t);
  },[]);
  useEffect(()=>{
    const poll = async () => { try { const r = await fetch("/api/health/deep"); setHealth(await r.json()); } catch {} };
    poll();
    const t = setInterval(poll, 5000);
    return ()=>clearInterval(t);
  },[]);
  const fmt = s=>`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`;
  return (
    <div>
      <div style={{marginBottom:10,padding:"8px",border:"1px solid rgba(68,255,136,.15)",borderRadius:2,background:"rgba(68,255,136,.03)",display:"flex",gap:10,alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:2,height:20}}>
          {[.4,.7,1,.6,.3,.9,.5,.8,1,.4,.6,.7].map((h,i)=>(
            <div key={i} style={{width:3,background:"#44ff88",borderRadius:1,height:`${h*16}px`,animation:`hbeat ${.85+Math.random()*.3}s ease-in-out infinite`,animationDelay:`${i*.09}s`}}/>
          ))}
        </div>
        <div>
          <div style={{fontFamily:"var(--fm)",fontSize:8,color:"#44ff88"}}>RUNTIME ONLINE · :8012</div>
          <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:1}}>{fmt(up)}</div>
        </div>
      </div>
      <div className="st">RESOURCES</div>
      {[["CPU",cpu,cpu>75?"var(--cr)":"var(--mc)"],["MEMORY",mem,mem>80?"var(--cg)":"#44ff88"],["POLICY",100,"#44ff88"],["SHADOW",100,"#44ff88"],["BRIDGE V2",100,"#44ff88"]].map(([l,v,c])=>(
        <div key={l} className="stat-row">
          <div className="stat-lbl"><span>{l}</span><span style={{color:c}}>{Math.round(v)}%</span></div>
          <div className="stat-bar"><div className="stat-fill" style={{width:`${v}%`,background:c}}/></div>
        </div>
      ))}
      <div className="div"/>
      <div className="st">OPERATOR MODE</div>
      <div style={{display:"flex",flexDirection:"column",gap:3}}>
        {Object.entries(MODES).map(([k,m])=>(
          <button key={k} className="nb" style={{color:m.color,background:state.mode===k?m.bg:"none",borderColor:state.mode===k?m.color:"transparent"}}
            onClick={()=>dispatch({type:"MODE",v:k})}>
            <span className="ng">{m.glyph}</span>{m.label}
            {state.mode===k&&<span style={{marginLeft:"auto",fontSize:6.5}}>ACTIVE</span>}
          </button>
        ))}
      </div>
      <div className="div"/>
      <div className="st">GOVERNANCE</div>
      {[["PolicyGate","ACTIVE"],["RollbackEngine","STANDBY"],["EvolutionEngine","ACTIVE"],["OrchestratorEngine","ACTIVE"],["ShadowChannel","STREAMING"]].map(([n,s])=>(
        <div key={n} style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--fm)",fontSize:7.5,padding:"3px 0",borderBottom:"1px solid var(--bd)"}}>
          <span style={{color:"var(--td)"}}>{n}</span>
          <span style={{color:s==="ACTIVE"||s==="STREAMING"?"#44ff88":"var(--mc)"}}>{s==="ACTIVE"||s==="STREAMING"?"●":"○"} {s}</span>
        </div>
      ))}
    </div>
  );
}

// ── ARTIFACT VAULT ────────────────────────────────────────────────────────────
function VaultPanel({ state, dispatch }) {
  const tcol = {CODEX:"#00d4ff",DOC:"#aa44ff",SPEC:"#ffaa00",CODE:"#44ff88",DESIGN:"#ff44aa"};
  const sealArtifact = (a) => (e) => { e.stopPropagation(); dispatch({type:"APPROVAL",v:{title:"SEAL ARTIFACT",body:"Seal "+a.name+"?\nPermanent. Audit logged.",action:"SEAL",onApprove:()=>dispatch({type:"ART_SEAL",id:a.id})}}); };
  const deleteArtifact = (a) => (e) => { e.stopPropagation(); dispatch({type:"APPROVAL",v:{title:"DELETE ARTIFACT",body:"Delete "+a.name+"?\nIrreversible.",action:"DELETE",onApprove:()=>dispatch({type:"ART_DEL",id:a.id})}}); };
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div className="st" style={{marginBottom:0}}>ARTIFACT VAULT — {state.artifacts.length}</div>
      </div>
      {state.artifacts.map(a=>(
        <div key={a.id} className="ai" onClick={()=>dispatch({type:"DIFF",v:state.diff===a.id?null:a.id})}>
          <span style={{color:a.sealed?"var(--cg)":"var(--td)",fontSize:12}}>{a.sealed?G.SEAL:"○"}</span>
          <div className="ainfo">
            <div className="aname2">{a.name}</div>
            <div className="ameta2"><span className="chip" style={{color:tcol[a.type]||"var(--td)"}}>{a.type}</span> {a.ver} · {a.ts} · {a.size}</div>
          </div>
          <div style={{display:"flex",gap:3,flexShrink:0}}>
            <button className="btn b-blue b-xs" onClick={e=>e.stopPropagation()}>↓</button>
            {!a.sealed&&<>
              <button className="btn b-gold b-xs" onClick={sealArtifact(a)}>{G.SEAL}</button>
              <button className="btn b-red b-xs" onClick={deleteArtifact(a)}>✕</button>
            </>}
          </div>
        </div>
      ))}
      {state.diff&&(
        <div style={{background:"var(--bg2)",border:"1px solid var(--bd)",borderRadius:2,padding:10,marginTop:6,fontFamily:"var(--fm)",fontSize:8,animation:"fadeIn .2s ease"}}>
          <div className="st">DIFF — {state.artifacts.find(a=>a.id===state.diff)?.name}</div>
          {["+ governance enforcement layer","+ operator approval gate","~ policygate weight thresholds","+ ShadowChannel SSE hook","- legacy auth bypass (deprecated)"].map((l,i)=>(
            <div key={i} style={{color:l.startsWith("+")?`#44ff88`:l.startsWith("-")?"#ff3c3c":"#ffcc44",marginBottom:2}}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FACTORY CONSOLE ───────────────────────────────────────────────────────────
function FactoryPanel({ state, dispatch }) {
  const logsEnd = useRef(null);
  useEffect(()=>{ logsEnd.current?.scrollIntoView({behavior:"smooth"}); },[state.logs]);
  return (
    <div>
      <div className="st">WORKER REGISTRY</div>
      {Object.entries(WORKERS).map(([n,w])=>(
        <div key={n} style={{padding:"8px",border:`1px solid ${w.color}22`,borderRadius:2,marginBottom:5}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:9.5,fontWeight:700,letterSpacing:".1em",color:w.color}}>{w.glyph} {n}</div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontFamily:"var(--fm)",fontSize:7.5,color:"var(--td)"}}>{w.missions}M · W:{Math.round(w.weight*100)}%</span>
              <span className="chip" style={{color:w.status==="ACTIVE"?"#44ff88":"var(--td)"}}>{w.status}</span>
            </div>
          </div>
          <div style={{fontFamily:"var(--fm)",fontSize:7.5,color:"var(--td)",marginTop:2}}>{w.role}</div>
          <div style={{display:"flex",gap:4,marginTop:5}}>
            <button className="btn b-blue b-xs" onClick={()=>dispatch({type:"LOG",v:{ts:new Date().toLocaleTimeString(),lv:"INFO",msg:n+" SPAWN issued"}})}>SPAWN</button>
            <button className="btn b-red b-xs">HALT</button>
            <button className="btn b-gold b-xs">INSPECT</button>
          </div>
        </div>
      ))}
      <div className="div"/>
      <div className="st">RUNTIME CONTROLS</div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
        {[["RESTART","b-blue"],["PATCH","b-gold"],["HALT","b-red"],["VALIDATE","b-grn"],["ROLLBACK","b-teal"]].map(([l,c])=>(
          <button key={l} className={"btn "+c+" b-sm"} onClick={()=>dispatch({type:"LOG",v:{ts:new Date().toLocaleTimeString(),lv:"INFO",msg:l+" issued by operator"}})}>{l}</button>
        ))}
      </div>
      <div className="div"/>
      <div className="st">LIVE LOG</div>
      <div style={{maxHeight:180,overflowY:"auto"}}>
        {state.logs.map((l,i)=>(
          <div key={i} className="ll">
            <span className="lt">{l.ts}</span>
            <span className={`l${l.lv}`}>[{l.lv}]</span>
            <span className="lm">{l.msg}</span>
          </div>
        ))}
        <div ref={logsEnd}/>
      </div>
    </div>
  );
}

// ── APPROVAL MODAL ────────────────────────────────────────────────────────────
function ApprovalModal({ approval, dispatch }) {
  if (!approval) return null;
  return (
    <div className="aov" onClick={()=>dispatch({type:"APPROVAL",v:null})}>
      <div className="amod" onClick={e=>e.stopPropagation()}>
        <div className="atitle"><span>{G.SEAL}</span>OPERATOR APPROVAL REQUIRED</div>
        <div style={{fontFamily:"var(--fm)",fontSize:7.5,color:"var(--cg)",marginBottom:9,letterSpacing:".1em"}}>ACTION: {approval.action}</div>
        <div className="abody">{approval.body}</div>
        <div className="aacts">
          <button className="btn b-red" onClick={()=>dispatch({type:"APPROVAL",v:null})}>DENY</button>
          <button className="btn b-gold" onClick={()=>dispatch({type:"APPROVAL",v:null})}>ESCALATE</button>
          <button className="btn b-grn" onClick={()=>{ approval.onApprove?.(); dispatch({type:"APPROVAL",v:null}); dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:"APPROVAL",level:"OK",msg:approval.action+" approved"}}); dispatch({type:"LOG",v:{ts:new Date().toLocaleTimeString(),lv:"OK",msg:"Approval: "+approval.action}}); }}>
            {G.SEAL} APPROVE
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EVOLUTION OVERLAY ─────────────────────────────────────────────────────────
function EvoOverlay({ state }) {
  if (!state.evolving) return null;
  const next = EVO_FORMS[Math.min(state.currentForm+1, EVO_FORMS.length-1)];
  return (
    <div className="eov">
      <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--td)",letterSpacing:".22em"}}>EVOLUTION IGNITION SEQUENCE</div>
      <div className="eov-glyph" style={{color:next.color}}>{next.glyph}</div>
      <div className="eov-name" style={{color:next.color}}>{next.form}</div>
      <div className="eov-sub">FORM SHIFT · LINEAGE PRESERVED · ADDITIVE ONLY</div>
      <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--td)"}}>{next.rank} · {next.armor} armor · core igniting…</div>
    </div>
  );
}

// ── PANEL CONFIG ──────────────────────────────────────────────────────────────
const PANELS = [
  {id:"COMPANION", label:"COMPANION",  glyph:G.ID    },
  {id:"MISSION",   label:"MISSION",    glyph:G.MISS  },
  {id:"EVOLUTION", label:"EVOLUTION",  glyph:G.EVO   },
  {id:"VAULT",     label:"VAULT",      glyph:G.ART   },
  {id:"FACTORY",   label:"FACTORY",    glyph:G.FACT  },
  {id:"SHADOW",    label:"SHADOW CH",  glyph:G.SHADOW},
  {id:"OPERATOR",  label:"INNER WORLD",glyph:G.WITNESS},
  {id:"PLUGINS",   label:"PLUGINS",    glyph:G.PLUG  },
  {id:"HEALTH",    label:"SYS HEALTH", glyph:G.SYS   },
];

// ── INTEL FEED (right panel) ──────────────────────────────────────────────────
function IntelFeed({ state, dispatch }) {
  const fd = EVO_FORMS[state.currentForm];
  return (
    <>
      <div className="ph"><span className="pha">INTEL FEED</span></div>
      <div className="pc">
        <div className="st">WORKERS</div>
        {Object.entries(WORKERS).map(([n,w])=>(
          <div key={n} style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:w.color,boxShadow:`0 0 5px ${w.color}`}}/>
            <span style={{fontFamily:"var(--fm)",fontSize:7.5,color:w.color,flex:1}}>{n}</span>
            <span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)"}}>{Math.round(w.weight*100)}%</span>
          </div>
        ))}
        <div className="div"/>
        <div className="st">CURRENT FORM</div>
        <div style={{fontFamily:"var(--fm)",fontSize:7.5,color:"var(--td)"}}>
          <div style={{color:fd.color,marginBottom:2}}>{fd.form}</div>
          <div>Rank: <span style={{color:"var(--tp)"}}>{fd.rank}</span></div>
          <div style={{marginTop:2}}>XP: <span style={{color:"var(--cg)"}}>{fd.xp}/{fd.cap}</span></div>
          <div style={{marginTop:2}}>Resonance: <span style={{color:"var(--mc)"}}>{Math.round(state.resonance*100)}%</span></div>
        </div>
        <div className="div"/>
        <div className="st">SHADOW STREAM</div>
        {state.shadow.slice(0,4).map(e=>(
          <div key={e.id} style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",padding:"2px 0",borderBottom:"1px solid rgba(255,255,255,.02)"}}>
            <div style={{color:"var(--tm)"}}>{e.type}</div>
            <div style={{color:"var(--tp)",marginTop:1}}>{e.msg}</div>
          </div>
        ))}
        <div className="div"/>
        <div className="st">HORIZON GATES</div>
        {[["H1","OPEN","#44ff88"],["H2","LOCKED","var(--td)"],["H3","LOCKED","var(--td)"]].map(([h,s,c])=>(
          <div key={h} style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--fm)",fontSize:7.5,padding:"2px 0"}}>
            <span style={{color:"var(--td)"}}>{h}</span><span style={{color:c}}>{s}</span>
          </div>
        ))}
        <div className="div"/>
        <div className="st">DREAM SEEDS</div>
        {DREAM_SEEDS.map(d=>(
          <div key={d.id} style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",padding:"2px 0"}}>
            {G.SEED} {d.label.slice(0,28)}…
            <span style={{color:d.status==="SPROUTING"?"#44ff88":"var(--td)",marginLeft:4}}>{d.status}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function NexusmonCockpitV4() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const { mode, avatarState, panel, approval, holoActive, drawerLeft, drawerRight, monarchMode } = state;
  const md = MODES[mode];
  const [clock, setClock] = useState("");

  useEffect(()=>{
    const t = setInterval(()=>{
      setClock(new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
      // Drift weights
      dispatch({type:"WEIGHTS",v:{
        bytewolf: Math.min(.98,Math.max(.3,state.weights.bytewolf+(Math.random()-.5)*.04)),
        glitchra: Math.min(.98,Math.max(.3,state.weights.glitchra+(Math.random()-.5)*.04)),
        sigildron:Math.min(.98,Math.max(.3,state.weights.sigildron+(Math.random()-.5)*.04)),
        policy:   Math.min(.98,Math.max(.5,state.weights.policy+(Math.random()-.5)*.02)),
        shadow:   Math.min(.98,Math.max(.4,state.weights.shadow+(Math.random()-.5)*.03)),
        operator: Math.min(.99,Math.max(.7,state.weights.operator+(Math.random()-.5)*.02)),
        mission:  Math.min(.95,Math.max(.3,state.weights.mission+(Math.random()-.5)*.04)),
      }});
      dispatch({type:"BREATH",v:Math.floor(Math.random()*4)+13});
      dispatch({type:"HEARTBEAT",v:Math.floor(Math.random()*10)+68});
      dispatch({type:"RESONANCE",v:Math.min(.99,Math.max(.6,state.resonance+(Math.random()-.5)*.03))});
      // Periodic shadow events
      if(Math.random()<.12) dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:["RUNTIME","POLICY","WORKER","HEARTBEAT"][Math.floor(Math.random()*4)],level:"INFO",msg:["Runtime tick OK","PolicyGate nominal","Worker heartbeat OK","Resonance stable"][Math.floor(Math.random()*4)]}});
    },1200);
    return ()=>clearInterval(t);
  },[state.weights, state.resonance]);

  const renderMain = () => {
    const props = {state, dispatch, mode};
    switch(panel) {
      case "COMPANION": return <CompanionPanel {...props}/>;
      case "MISSION":   return <div className="pc"><MissionPanel {...props}/></div>;
      case "EVOLUTION": return <div className="pc"><EvolutionPanel {...props}/></div>;
      case "VAULT":     return <div className="pc"><VaultPanel {...props}/></div>;
      case "FACTORY":   return <div className="pc"><FactoryPanel {...props}/></div>;
      case "SHADOW":    return <div className="pc"><ShadowPanel {...props}/></div>;
      case "OPERATOR":  return <div className="pc"><OperatorPanel {...props}/></div>;
      case "PLUGINS":   return <div className="pc"><PluginPanel {...props}/></div>;
      case "HEALTH":    return <div className="pc"><HealthPanel {...props}/></div>;
      default:          return null;
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ck" style={{"--mc":md.color,"--mb":md.bg,"--md":md.dim}}>

        {/* TOPBAR */}
        <div className="topbar">
          <span className="seal-txt">{SEAL}</span>
          <div>
            <div className="logo">NEXUSMON</div>
            <div className="logo-sub">SOVEREIGN ORGANISM · COCKPIT v4.0 · FULL DOCTRINE</div>
          </div>
          <div className="spacer"/>
          <button className="btn b-pur b-sm" onClick={()=>dispatch({type:"HOLO",v:!holoActive})}
            style={{borderColor:holoActive?"var(--cp)":undefined,background:holoActive?"rgba(170,68,255,.1)":undefined}}>
            {G.PULSE} HOLO {holoActive?"ON":"OFF"}
          </button>
          <button className="btn b-blue b-sm" onClick={()=>dispatch({type:"DRAW_LEFT",v:!drawerLeft})}>{G.PULSE} WEIGHTS</button>
          <button className="btn b-gold b-sm" onClick={()=>dispatch({type:"DRAW_RIGHT",v:!drawerRight})}>{G.MONARCH} AVATAR</button>
          {mode!=="NOMINAL"&&<div className="mode-pill">{md.glyph} {md.label} ACTIVE</div>}
          <div>
            <div className="ttime">{clock}</div>
            <div style={{fontFamily:"var(--fm)",fontSize:6.5,color:"var(--td)"}}>:8012 ONLINE</div>
          </div>
        </div>

        {/* LEFT PANEL — nav only */}
        <div className="lp" style={{position:"relative"}}>
          {drawerLeft&&<WeightDrawer weights={state.weights} onClose={()=>dispatch({type:"DRAW_LEFT",v:false})}/>}
          <div className="nav">
            {PANELS.map(p=>(
              <button key={p.id} className={`nb ${panel===p.id?"on":""}`} onClick={()=>dispatch({type:"PANEL",v:p.id})}>
                <span className="ng">{p.glyph}</span>{p.label}
              </button>
            ))}
          </div>
          <div className="op-badge">
            {G.ID} DARTHVPIRATEKING · SOVEREIGN<br/>
            {G.HEART} {state.heartbeat}BPM · {G.RESONANCE} {Math.round(state.resonance*100)}%<br/>
            {G.SEAL} DOCTRINE ACTIVE · ZERO DRIFT
          </div>
        </div>

        {/* MAIN — avatar hero + content */}
        <div className="mp" style={{position:"relative"}}>
          <HoloLayer weights={state.weights} mode={mode} active={holoActive}/>
          {drawerRight&&<AvatarDrawer state={state} dispatch={dispatch} onClose={()=>dispatch({type:"DRAW_RIGHT",v:false})}/>}
          {/* NEXUSMON centered hero */}
          <div className="az-center" style={{background:mode!=="NOMINAL"?md.bg:undefined}}>
            <Avatar state={avatarState} mode={mode} form={state.currentForm} monarchMode={monarchMode}/>
            <div className="aname" style={{color:md.color,fontSize:14}}>{EVO_FORMS[state.currentForm].form}</div>
            <div className="astate" style={{borderColor:md.color,color:md.color,background:md.bg}}>{avatarState}</div>
            <div className="aform-label">{EVO_FORMS[state.currentForm].rank} · {md.glyph} {mode}</div>
            <div className="state-btns">
              {["IDLE","LISTEN","PROCESS","RESPOND","MISSION"].map(s=>(
                <button key={s} className={`sbtn ${avatarState===s.replace("LISTEN","LISTENING").replace("PROCESS","PROCESSING").replace("RESPOND","RESPONDING")?"on":""}`}
                  onClick={()=>dispatch({type:"AVATAR",v:s==="LISTEN"?"LISTENING":s==="PROCESS"?"PROCESSING":s==="RESPOND"?"RESPONDING":s})}>
                  {s.slice(0,4)}
                </button>
              ))}
            </div>
          </div>
          <div className="ph">
            <span><span className="pha">{PANELS.find(p=>p.id===panel)?.glyph}</span> {panel} ENGINE</span>
            <span style={{color:"var(--td)"}}>{EVO_FORMS[state.currentForm].form} · :8012</span>
          </div>
          {renderMain()}
        </div>

        {/* RIGHT PANEL */}
        <div className="rp">
          <IntelFeed state={state} dispatch={dispatch}/>
        </div>

        {/* BOTTOM SYMBOLIC LANE */}
        <div className="botlane">
          <BottomLane state={state} dispatch={dispatch}/>
        </div>

        {/* STATUS BAR */}
        <div className="statusbar">
          <span className="seal-txt" style={{fontSize:11}}>{SEAL}</span>
          <div style={{flex:1,overflow:"hidden"}}>
            <div className="tck">
              NEXUSMON SOVEREIGN ORGANISM v4.0 &nbsp;·&nbsp; OPERATOR: DARTHVPIRATEKING &nbsp;·&nbsp;
              :8012 ONLINE &nbsp;·&nbsp; POLICYGATE: ACTIVE &nbsp;·&nbsp; SHADOW CHANNEL: STREAMING &nbsp;·&nbsp;
              EVOLUTION: ROOKIE→CHAMPION IN PROGRESS &nbsp;·&nbsp; MISSION M-001: ACTIVE &nbsp;·&nbsp;
              RESONANCE: {Math.round(state.resonance*100)}% &nbsp;·&nbsp; BREATH: {state.breathPhase}BPM &nbsp;·&nbsp;
              PLUGINS: {PLUGINS.filter(p=>p.status==="ACTIVE").length} ACTIVE &nbsp;·&nbsp; ALL SYSTEMS NOMINAL &nbsp;{SEAL}&nbsp;
            </div>
          </div>
          <span style={{color:md.color,fontFamily:"var(--fm)",fontSize:11}}>■ {mode}</span>
        </div>
      </div>

      <ApprovalModal approval={approval} dispatch={dispatch}/>
      <EvoOverlay state={state}/>
    </>
  );
}

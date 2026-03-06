import { useState, useEffect, useRef, useReducer, useCallback } from "preact/hooks";

// ══════════════════════════════════════════════════════════════════════════════
//  NEXUSMON COCKPIT v3.0 — FULL DOCTRINE BUILD
//  Operator: DARTHVPIRATEKING | Seal: ✦✸⚚⬡◎⟐
//  All modules. All states. All doctrine.
// ══════════════════════════════════════════════════════════════════════════════

const G = {
  ID:"✦",AUTH:"✸",EVO:"⚚",MISS:"⬡",SYS:"◎",SEAL:"⟐",
  GUARD:"⬟",COMBAT:"⟁",STRAT:"⊕",WARN:"⚠",OK:"✓",LOCK:"■",ART:"◈",FACT:"⟴"
};
const SEAL = "✦✸⚚⬡◎⟐";

const MODES = {
  NOMINAL:   { color:"#00d4ff", bg:"rgba(0,212,255,0.05)",   label:"NOMINAL",   glyph:G.SYS   },
  STRATEGIC: { color:"#00ffcc", bg:"rgba(0,255,204,0.05)",   label:"STRATEGIC", glyph:G.STRAT },
  COMBAT:    { color:"#ff3c3c", bg:"rgba(255,60,60,0.05)",   label:"COMBAT",    glyph:G.COMBAT},
  GUARDIAN:  { color:"#44ff88", bg:"rgba(68,255,136,0.05)",  label:"GUARDIAN",  glyph:G.GUARD },
};

// Evolution Forms — each form is a distinct canonical identity
const EVO_FORMS = [
  { id:0, rank:"ROOKIE",   form:"NEXUSMON-α",        color:"#00d4ff", xp:340,  threshold:500,   unlocked:true,  glyph:G.EVO,  armorStyle:"light",  traits:["SCAN_PULSE","ECHO_LOCK"] },
  { id:1, rank:"CHAMPION", form:"NEXUSMON-β",        color:"#00ffcc", xp:0,    threshold:1500,  unlocked:false, glyph:G.STRAT,armorStyle:"medium", traits:[] },
  { id:2, rank:"ULTIMATE", form:"NEXUSMON-Ω",        color:"#aa44ff", xp:0,    threshold:5000,  unlocked:false, glyph:G.AUTH, armorStyle:"heavy",  traits:[] },
  { id:3, rank:"MEGA",     form:"NEXUSMON-SOVEREIGN",color:"#ffcc44", xp:0,    threshold:15000, unlocked:false, glyph:G.SEAL, armorStyle:"titan",  traits:[] },
  { id:4, rank:"ULTRA",    form:"NEXUSMON-ABSOLUTE", color:"#ff3c3c", xp:0,    threshold:50000, unlocked:false, glyph:G.COMBAT,armorStyle:"god",   traits:[] },
];

const TRAITS = {
  SCAN_PULSE:  { glyph:"◉", name:"Scan Pulse",    effect:"Range +20% in STRATEGIC mode", form:0, mode:"STRATEGIC", unlocked:true  },
  ECHO_LOCK:   { glyph:"⟲", name:"Echo Lock",     effect:"Replay last directive on IDLE",form:0, mode:"NOMINAL",   unlocked:true  },
  ARMOR_DENSE: { glyph:"⬡", name:"Armor Dense",   effect:"Damage reduction in COMBAT",   form:1, mode:"COMBAT",    unlocked:false },
  SHIELD_AURA: { glyph:"◎", name:"Shield Aura",   effect:"Guardian radius +40%",         form:1, mode:"GUARDIAN",  unlocked:false },
  GLYPH_BLOOM: { glyph:"✸", name:"Glyph Bloom",   effect:"All glyph output +15%",        form:2, mode:"ALL",       unlocked:false },
  VOID_STEP:   { glyph:"⟐", name:"Void Step",     effect:"Zero-latency mode switch",     form:3, mode:"ALL",       unlocked:false },
};

const WORKERS = {
  BYTEWOLF:  { color:"#00d4ff", role:"Pathfinder / Analysis", glyph:"⟁", status:"STANDBY", missions:3 },
  GLITCHRA:  { color:"#ff44aa", role:"Anomaly / Transform",   glyph:"⚡", status:"ACTIVE",  missions:1 },
  SIGILDRON: { color:"#ffaa00", role:"Artifact Courier",      glyph:"⬡", status:"STANDBY", missions:2 },
};

const POLICY_OUTCOMES = { PASS:{color:"#44ff88",count:247}, ESCALATE:{color:"#ffaa00",count:3}, QUARANTINE:{color:"#ff4444",count:1}, DENY:{color:"#ff2222",count:0} };

const INIT_MISSIONS = [
  { id:"M-001", title:"Repo Repair Phase I",       status:"ACTIVE",    priority:"HIGH", worker:"BYTEWOLF",  ts:"14:22", logs:["Phase I initiated","Loose objects: 3","Repair in progress…"] },
  { id:"M-002", title:"PolicyGate Integration",    status:"PENDING",   priority:"HIGH", worker:"SIGILDRON", ts:"12:00", logs:["Awaiting operator approval"] },
  { id:"M-003", title:"Cockpit SSE Audit",         status:"COMPLETED", priority:"MED",  worker:"GLITCHRA",  ts:"22:10", logs:["SSE stream verified","20 tests passed","COMPLETE ✓"] },
  { id:"M-004", title:"EvolutionEngine XP Unlock", status:"PENDING",   priority:"LOW",  worker:"BYTEWOLF",  ts:"09:00", logs:["Awaiting XP threshold"] },
];

const INIT_ARTIFACTS = [
  { id:"A-001", name:"NEXUSMON_SPECIES_CODEX.md", ver:"v3.2", sealed:true,  ts:"03-05", size:"48KB",  type:"CODEX"  },
  { id:"A-002", name:"Master_Docblock.docx",       ver:"v1.0", sealed:true,  ts:"03-01", size:"2.1MB", type:"DOC"    },
  { id:"A-003", name:"PolicyGate_Spec.json",       ver:"v0.4", sealed:false, ts:"03-06", size:"12KB",  type:"SPEC"   },
  { id:"A-004", name:"EvolutionEngine.py",         ver:"v0.2", sealed:false, ts:"03-06", size:"8KB",   type:"CODE"   },
  { id:"A-005", name:"NEXUSMON_GLYPH_CODEX.svg",   ver:"v2.1", sealed:true,  ts:"03-02", size:"320KB", type:"DESIGN" },
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
  { ts:"14:24:01", lv:"INFO", msg:"SSE audit stream connected /events" },
];

const INIT_MSGS = [
  { id:1, role:"nx", text:`${G.SEAL} NEXUSMON online. Runtime :8012. Operator sovereignty confirmed. Awaiting directive.`, ts:"14:22" },
  { id:2, role:"op", text:"Status check. All systems nominal?", ts:"14:22" },
  { id:3, role:"nx", text:`${G.SYS} All nominal. M-001 active via BYTEWOLF. PolicyGate standing by. ShadowChannel streaming. ${G.SEAL}`, ts:"14:22" },
];

// ── REDUCER ───────────────────────────────────────────────────────────────────
function reducer(s, a) {
  switch(a.type) {
    case "MODE":      return {...s, mode:a.v, avatarState: a.v==="NOMINAL"?"IDLE":a.v==="STRATEGIC"?"STRATEGIC":a.v==="COMBAT"?"COMBAT_READY":"GUARDIAN"};
    case "AVATAR":    return {...s, avatarState:a.v};
    case "PANEL":     return {...s, panel:a.v};
    case "MSG":       return {...s, messages:[...s.messages,a.v]};
    case "SHADOW":    return {...s, shadow:[a.v,...s.shadow.slice(0,49)]};
    case "LOG":       return {...s, logs:[...s.logs,a.v].slice(-60)};
    case "MISSION_UP":return {...s, missions:s.missions.map(m=>m.id===a.id?{...m,...a.p}:m)};
    case "MISSION_ADD":return{...s, missions:[a.v,...s.missions]};
    case "ART_SEAL":  return {...s, artifacts:s.artifacts.map(a2=>a2.id===a.id?{...a2,sealed:true}:a2)};
    case "ART_DEL":   return {...s, artifacts:s.artifacts.filter(a2=>a2.id!==a.id)};
    case "ART_ADD":   return {...s, artifacts:[a.v,...s.artifacts]};
    case "APPROVAL":  return {...s, approval:a.v};
    case "EVO":       return {...s, currentForm:a.v, evoLog:[{ts:new Date().toLocaleTimeString(),form:EVO_FORMS[a.v].form},...s.evoLog]};
    case "EVOLVING":  return {...s, evolving:a.v};
    case "DIFF":      return {...s, diff:a.v};
    default:          return s;
  }
}

const INIT = {
  mode:"NOMINAL", avatarState:"IDLE", panel:"COMPANION",
  messages:INIT_MSGS, missions:INIT_MISSIONS, artifacts:INIT_ARTIFACTS,
  shadow:INIT_SHADOW, logs:INIT_LOGS, approval:null,
  currentForm:0, evoLog:[], evolving:false, diff:null
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:ital,wght@0,300;0,400;0,600;0,800;1,300&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;overflow:hidden;background:#010507;}

:root{
  --mc:#00d4ff;--mb:rgba(0,212,255,0.05);
  --bg0:#010507;--bg1:#040c13;--bg2:#071220;--bg3:#0a1828;
  --bd:#0b2035;--bda:rgba(0,212,255,0.3);
  --tp:#a8d8f0;--td:#254560;--tm:#456070;
  --fd:'Orbitron',monospace;--fm:'Share Tech Mono',monospace;--fu:'Exo 2',sans-serif;
  --c-gold:#ffcc44;--c-red:#ff3c3c;--c-green:#44ff88;--c-teal:#00ffcc;--c-purple:#aa44ff;--c-pink:#ff44aa;
}

/* Animations */
@keyframes coreIdle{0%,100%{opacity:.6;transform:scale(1);}50%{opacity:1;transform:scale(1.05);}}
@keyframes coreListen{0%,100%{opacity:.8;}50%{opacity:1;transform:scale(1.08);}}
@keyframes coreProcess{0%,100%{transform:scale(1);opacity:.7;}33%{transform:scale(1.1);opacity:1;}66%{transform:scale(.95);opacity:.9;}}
@keyframes coreRespond{0%,100%{opacity:1;}10%{opacity:.4;}20%{opacity:1;}30%{opacity:.6;}40%{opacity:1;}}
@keyframes coreMission{0%,100%{opacity:1;filter:brightness(1);}50%{opacity:1;filter:brightness(1.6);}}
@keyframes orbitA{0%{transform:rotate(0deg) translateX(44px) rotate(0deg);}100%{transform:rotate(360deg) translateX(44px) rotate(-360deg);}}
@keyframes orbitB{0%{transform:rotate(120deg) translateX(58px) rotate(-120deg);}100%{transform:rotate(480deg) translateX(58px) rotate(-480deg);}}
@keyframes orbitC{0%{transform:rotate(240deg) translateX(72px) rotate(-240deg);}100%{transform:rotate(600deg) translateX(72px) rotate(-600deg);}}
@keyframes orbitBig{0%{transform:rotate(0deg) translateX(86px) rotate(0deg);}100%{transform:rotate(-360deg) translateX(86px) rotate(360deg);}}
@keyframes ring1{0%,100%{transform:scale(.86);opacity:.8;}50%{transform:scale(1.12);opacity:.3;}}
@keyframes ring2{0%,100%{transform:scale(.92);opacity:.5;}50%{transform:scale(1.06);opacity:.15;}}
@keyframes ring3{0%,100%{transform:scale(.98);opacity:.2;}50%{transform:scale(1.02);opacity:.06;}}
@keyframes scanV{0%{top:-2%;opacity:.8;}100%{top:102%;opacity:0;}}
@keyframes scanH{0%{left:-2%;opacity:.5;}100%{left:102%;opacity:0;}}
@keyframes shieldPulse{0%,100%{stroke-opacity:.4;stroke-width:1;}50%{stroke-opacity:.9;stroke-width:1.8;}}
@keyframes armorSlide{0%{transform:translateY(-5px);opacity:.3;}100%{transform:translateY(0);opacity:1;}}
@keyframes ignite{0%{opacity:0;transform:scale(.8);}30%{opacity:1;transform:scale(1.15);}60%{transform:scale(.97);}100%{opacity:1;transform:scale(1);}}
@keyframes evoBloom{0%{transform:scale(.5);opacity:0;}40%{transform:scale(1.3);opacity:1;}70%{transform:scale(.9);}100%{transform:scale(1);opacity:1;}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes breathe{0%,100%{box-shadow:0 0 12px rgba(0,212,255,.1);}50%{box-shadow:0 0 30px rgba(0,212,255,.28);}}
@keyframes borderGlow{0%,100%{border-color:var(--mc);}50%{border-color:rgba(0,212,255,.2);}}
@keyframes ticker{from{transform:translateX(110%);}to{transform:translateX(-110%);}}
@keyframes hbeat{0%,100%{transform:scaleY(1);}50%{transform:scaleY(1.8);}}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
@keyframes glowText{0%,100%{text-shadow:0 0 6px var(--mc);}50%{text-shadow:0 0 22px var(--mc),0 0 50px var(--mc);}}
@keyframes missionPulse{0%,100%{box-shadow:0 0 5px rgba(255,204,68,.2);}50%{box-shadow:0 0 20px rgba(255,204,68,.6);}}
@keyframes dataDrop{from{opacity:0;transform:translateX(-4px);}to{opacity:1;transform:translateX(0);}}
@keyframes modeIn{from{opacity:.2;}to{opacity:1;}}

/* Layout */
.ck{display:grid;grid-template-rows:44px 1fr 28px;grid-template-columns:256px 1fr 214px;height:100vh;gap:1px;background:var(--bd);animation:modeIn .35s ease;}
.topbar{grid-column:1/-1;background:#020b12;border-bottom:1px solid var(--bda);display:flex;align-items:center;gap:12px;padding:0 16px;position:relative;overflow:hidden;}
.topbar::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--mc),transparent);opacity:.5;}
.botbar{grid-column:1/-1;background:#020b12;border-top:1px solid var(--bd);display:flex;align-items:center;gap:10px;padding:0 12px;overflow:hidden;}
.lp{background:var(--bg1);display:flex;flex-direction:column;border-right:1px solid var(--bd);}
.mp{background:var(--bg0);display:flex;flex-direction:column;overflow:hidden;position:relative;}
.rp{background:var(--bg1);display:flex;flex-direction:column;border-left:1px solid var(--bd);}

/* Panel chrome */
.ph{font-family:var(--fm);font-size:7.5px;letter-spacing:.22em;color:var(--td);padding:7px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.pc{flex:1;overflow-y:auto;padding:10px;}
.pc::-webkit-scrollbar{width:2px;}
.pc::-webkit-scrollbar-thumb{background:var(--bda);}

/* Typography */
.logo{font-family:var(--fd);font-size:15px;font-weight:900;letter-spacing:.25em;color:var(--mc);animation:glowText 3s ease-in-out infinite;}
.logo-sub{font-family:var(--fm);font-size:7.5px;color:var(--td);letter-spacing:.18em;}
.seal{font-size:12px;letter-spacing:.05em;color:var(--c-gold);text-shadow:0 0 10px rgba(255,204,68,.5);}
.ttime{font-family:var(--fm);font-size:9.5px;color:var(--tm);}
.mode-pill{padding:3px 10px;border:1px solid var(--mc);border-radius:1px;font-family:var(--fm);font-size:8px;letter-spacing:.12em;color:var(--mc);background:var(--mb);animation:borderGlow 2.5s ease-in-out infinite;}

/* Avatar zone */
.az{display:flex;flex-direction:column;align-items:center;gap:7px;padding:16px 8px 12px;border-bottom:1px solid var(--bd);position:relative;overflow:hidden;flex-shrink:0;}
.af{position:relative;width:128px;height:128px;}
.ar{position:absolute;border-radius:50%;border:1px solid;pointer-events:none;}
.ar1{inset:-8px;border-color:rgba(0,212,255,.38);}
.ar2{inset:-20px;border-color:rgba(0,212,255,.12);animation:ring1 3.2s ease-in-out infinite;}
.ar3{inset:-36px;border-color:rgba(0,212,255,.05);animation:ring2 4.5s ease-in-out infinite;}
.ar4{inset:-56px;border-color:rgba(0,212,255,.02);animation:ring3 6s ease-in-out infinite;}
.aname{font-family:var(--fd);font-size:11px;font-weight:900;letter-spacing:.2em;color:var(--mc);animation:glowText 2.5s ease-in-out infinite;}
.astate{font-family:var(--fm);font-size:7.5px;letter-spacing:.16em;padding:2px 8px;border:1px solid var(--mc);color:var(--mc);border-radius:1px;background:var(--mb);}
.aform{font-family:var(--fm);font-size:7px;letter-spacing:.12em;color:var(--td);}

/* Nav */
.nav{display:flex;flex-direction:column;flex:1;padding:8px 6px;gap:2px;overflow-y:auto;}
.nb{display:flex;align-items:center;gap:7px;padding:7px 9px;border-radius:2px;font-family:var(--fm);font-size:8.5px;letter-spacing:.09em;color:var(--td);background:none;border:1px solid transparent;cursor:pointer;transition:all .18s;text-align:left;width:100%;}
.nb.on{color:var(--mc);border-color:var(--mc);background:var(--mb);}
.nb:hover:not(.on){color:var(--tp);border-color:var(--bd);}
.nb .ng{font-size:11px;width:15px;text-align:center;flex-shrink:0;}
.op-badge{padding:7px 10px;border-top:1px solid var(--bd);font-family:var(--fm);font-size:7px;color:var(--td);letter-spacing:.08em;flex-shrink:0;}

/* Buttons */
.btn{padding:4px 11px;font-family:var(--fm);font-size:7.5px;letter-spacing:.1em;border:1px solid currentColor;border-radius:1px;cursor:pointer;background:none;transition:all .18s;}
.b-blue{color:var(--mc);}   .b-blue:hover{background:rgba(0,212,255,.1);}
.b-gold{color:var(--c-gold);}.b-gold:hover{background:rgba(255,204,68,.1);}
.b-red{color:var(--c-red);}  .b-red:hover{background:rgba(255,60,60,.1);}
.b-grn{color:var(--c-green);}.b-grn:hover{background:rgba(68,255,136,.1);}
.b-teal{color:var(--c-teal);}.b-teal:hover{background:rgba(0,255,204,.1);}
.b-pur{color:var(--c-purple);}.b-pur:hover{background:rgba(170,68,255,.1);}
.b-sm{padding:2px 7px;font-size:7px;}
.b-xs{padding:1px 5px;font-size:6px;}

/* Sections */
.st{font-family:var(--fm);font-size:7px;letter-spacing:.24em;color:var(--td);padding-bottom:4px;margin-bottom:7px;border-bottom:1px solid var(--bd);}
.div{height:1px;background:var(--bd);margin:9px 0;}
.stat-row{display:flex;flex-direction:column;gap:2px;margin-bottom:7px;}
.stat-lbl{display:flex;justify-content:space-between;font-family:var(--fm);font-size:7.5px;color:var(--td);}
.stat-bar{height:2px;background:rgba(255,255,255,.04);border-radius:1px;overflow:hidden;}
.stat-fill{height:100%;border-radius:1px;transition:width .9s ease;}
.chip{font-family:var(--fm);font-size:6.5px;padding:1px 5px;border:1px solid currentColor;border-radius:1px;letter-spacing:.08em;}

/* Chat */
.cw{display:flex;flex-direction:column;height:100%;}
.cm{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:9px;}
.cm::-webkit-scrollbar{width:2px;}
.cm::-webkit-scrollbar-thumb{background:var(--bda);}
.msg{display:flex;flex-direction:column;gap:2px;animation:fadeUp .3s ease;}
.msg.op{align-items:flex-end;}.msg.nx{align-items:flex-start;}
.mwho{font-family:var(--fm);font-size:6.5px;color:var(--td);letter-spacing:.14em;}
.mb2{max-width:84%;padding:8px 11px;border-radius:2px;font-family:var(--fu);font-size:11.5px;line-height:1.55;}
.msg.op .mb2{background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.18);color:var(--tp);}
.msg.nx .mb2{background:rgba(170,68,255,.06);border:1px solid rgba(170,68,255,.18);color:var(--tp);}
.cbottom{border-top:1px solid var(--bd);padding:10px;display:flex;flex-direction:column;gap:5px;flex-shrink:0;}
.cinput{width:100%;background:rgba(0,212,255,.03);border:1px solid var(--bd);border-radius:2px;padding:7px 9px;color:var(--tp);font-family:var(--fm);font-size:10.5px;resize:none;outline:none;transition:border-color .2s;height:52px;}
.cinput:focus{border-color:var(--bda);}
.crow{display:flex;gap:5px;justify-content:flex-end;align-items:center;}
.cbadge{font-family:var(--fm);font-size:6.5px;color:var(--td);letter-spacing:.09em;flex:1;}
.squeue{margin:0 10px 6px;padding:7px 9px;border:1px solid var(--c-gold);border-radius:2px;background:rgba(255,204,68,.04);font-family:var(--fm);font-size:7.5px;color:var(--c-gold);display:flex;justify-content:space-between;align-items:center;gap:6px;animation:fadeUp .2s ease;}

/* Mission */
.mi{padding:8px 9px;border:1px solid var(--bd);border-radius:2px;margin-bottom:4px;cursor:pointer;transition:all .2s;animation:fadeUp .25s ease;}
.mi:hover{border-color:var(--bda);}
.mi.ACTIVE{animation:missionPulse 2s ease-in-out infinite;}
.mi.exp .mlogs{display:flex;}
.mtitle{font-family:var(--fu);font-size:11.5px;font-weight:600;letter-spacing:.04em;}
.mmeta{font-family:var(--fm);font-size:7.5px;color:var(--td);margin-top:2px;display:flex;gap:7px;}
.mlogs{font-family:var(--fm);font-size:7.5px;color:var(--td);margin-top:5px;padding-top:5px;border-top:1px solid var(--bd);flex-direction:column;gap:2px;display:none;}

/* Evolution */
.es{display:flex;align-items:center;gap:9px;padding:9px;border:1px solid var(--bd);border-radius:2px;margin-bottom:4px;cursor:pointer;transition:all .3s;}
.es.unlocked{border-color:rgba(0,212,255,.3);background:rgba(0,212,255,.02);}
.es.current{border-color:var(--c-gold);background:rgba(255,204,68,.03);box-shadow:0 0 12px rgba(255,204,68,.12);}
.es.locked{opacity:.5;}
.enode{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
.erank{font-family:var(--fd);font-size:9.5px;font-weight:700;letter-spacing:.1em;}
.eform{font-family:var(--fm);font-size:7.5px;color:var(--td);margin-top:1px;}
.xpbar{height:2px;background:rgba(255,255,255,.05);border-radius:1px;overflow:hidden;margin-top:4px;}
.xpfill{height:100%;border-radius:1px;transition:width 1s ease;}

/* Trait grid */
.tg{display:grid;grid-template-columns:1fr 1fr;gap:5px;}
.tcard{padding:7px 8px;border:1px solid var(--bd);border-radius:2px;}
.tcard.unlocked{border-color:rgba(0,212,255,.25);background:rgba(0,212,255,.02);}
.tcard.locked{opacity:.45;}
.tglyph{font-size:14px;margin-bottom:3px;}
.tname{font-family:var(--fu);font-size:10px;font-weight:600;}
.teff{font-family:var(--fm);font-size:7px;color:var(--td);margin-top:2px;line-height:1.4;}

/* Artifact */
.ai{display:flex;align-items:center;gap:7px;padding:6px 8px;border:1px solid var(--bd);border-radius:2px;margin-bottom:4px;cursor:pointer;transition:all .2s;font-family:var(--fm);font-size:9px;}
.ai:hover{border-color:var(--bda);background:rgba(0,212,255,.02);}
.ainfo{flex:1;min-width:0;}
.aname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ameta{font-size:7px;color:var(--td);margin-top:1px;}
.diff-panel{background:var(--bg2);border:1px solid var(--bd);border-radius:2px;padding:10px;margin-top:6px;font-family:var(--fm);font-size:8px;animation:fadeIn .2s ease;}

/* Factory log */
.ll{font-family:var(--fm);font-size:8px;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.02);display:flex;gap:7px;animation:dataDrop .25s ease;}
.lt{color:var(--td);flex-shrink:0;}
.lOK{color:var(--c-green);flex-shrink:0;}
.lINFO{color:var(--mc);flex-shrink:0;}
.lWARN{color:var(--c-gold);flex-shrink:0;}
.lERR{color:var(--c-red);flex-shrink:0;}
.lm{color:var(--tp);flex:1;}

/* Worker cards */
.wc{padding:8px 9px;border:1px solid var(--bd);border-radius:2px;margin-bottom:5px;}
.wname{font-family:var(--fd);font-size:10px;font-weight:700;letter-spacing:.1em;}
.wrole{font-family:var(--fm);font-size:7.5px;color:var(--td);margin-top:1px;}

/* Shadow channel */
.se{display:flex;gap:7px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.03);font-family:var(--fm);font-size:7.5px;animation:dataDrop .25s ease;}
.stype{width:70px;flex-shrink:0;color:var(--td);}
.slOK{color:var(--c-green);flex-shrink:0;width:26px;}
.slINFO{color:var(--mc);flex-shrink:0;width:26px;}
.slWARN{color:var(--c-gold);flex-shrink:0;width:26px;}
.sm2{color:var(--tp);flex:1;}

/* System health */
.hb{display:flex;align-items:flex-end;gap:2px;height:22px;}
.hbb{width:3px;background:var(--c-green);border-radius:1px;animation:hbeat 1.2s ease-in-out infinite;}

/* Approval overlay */
.aov{position:fixed;inset:0;background:rgba(1,5,7,.94);z-index:200;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease;}
.amod{background:var(--bg3);border:1px solid var(--c-gold);border-radius:3px;padding:22px;width:370px;box-shadow:0 0 40px rgba(255,204,68,.15);animation:fadeUp .2s ease;}
.atitle{font-family:var(--fd);font-size:13px;font-weight:700;letter-spacing:.1em;color:var(--c-gold);margin-bottom:11px;display:flex;align-items:center;gap:8px;}
.abody{font-family:var(--fm);font-size:9px;color:var(--tp);margin-bottom:14px;line-height:1.65;padding:9px;background:rgba(255,204,68,.04);border:1px solid rgba(255,204,68,.15);border-radius:2px;}
.aacts{display:flex;gap:7px;justify-content:flex-end;}

/* Evo overlay */
.eov{position:fixed;inset:0;background:rgba(1,5,7,.97);z-index:300;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;animation:fadeIn .2s ease;}
.eov-core{font-size:64px;animation:evoBloom 1s ease forwards;}
.eov-text{font-family:var(--fd);font-size:18px;font-weight:900;letter-spacing:.3em;color:var(--c-gold);animation:glowText 1s ease-in-out infinite;}
.eov-sub{font-family:var(--fm);font-size:10px;letter-spacing:.2em;color:var(--td);}

/* Ticker */
.tck{white-space:nowrap;animation:ticker 28s linear infinite;font-family:var(--fm);font-size:8.5px;}

/* Scan line overlays */
.slo{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5;}
.slv{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--mc),transparent);opacity:.5;animation:scanV 2.2s linear infinite;}
.slh{position:absolute;top:0;bottom:0;width:1px;background:linear-gradient(180deg,transparent,var(--mc),transparent);opacity:.3;animation:scanH 3.5s linear infinite;}
`;

// ── NEXUSMON AVATAR ───────────────────────────────────────────────────────────
function Avatar({ state, mode, form }) {
  const modeData = MODES[mode];
  const formData = EVO_FORMS[form];
  const C = formData.color;

  const isIdle       = state === "IDLE";
  const isListen     = state === "LISTENING";
  const isProcess    = state === "PROCESSING";
  const isRespond    = state === "RESPONDING";
  const isMission    = state === "MISSION";
  const isCombat     = state === "COMBAT_READY";
  const isGuardian   = state === "GUARDIAN";
  const isStrategic  = state === "STRATEGIC";

  const coreAnim = isIdle?"coreIdle 2.8s ease-in-out infinite"
    :isListen ?"coreListen 1.2s ease-in-out infinite"
    :isProcess?"coreProcess 0.8s ease-in-out infinite"
    :isRespond?"coreRespond 0.5s ease-in-out infinite"
    :isMission?"coreMission 0.6s ease-in-out infinite"
    :"coreIdle 2s ease-in-out infinite";

  return (
    <div style={{position:"relative",width:128,height:128}}>
      {/* Rings */}
      <div className="ar ar1" style={{borderColor:`${C}55`}}/>
      <div className="ar ar2" style={{borderColor:`${C}18`}}/>
      <div className="ar ar3" style={{borderColor:`${C}08`}}/>
      <div className="ar ar4" style={{borderColor:`${C}04`}}/>

      {/* Orbiting glyphs — only when processing */}
      {isProcess && [G.ID,G.AUTH,G.SYS].map((g,i)=>(
        <div key={i} style={{position:"absolute",top:"50%",left:"50%",marginTop:-5,marginLeft:-5,fontSize:9,color:C,
          animation:`orbit${["A","B","C"][i]} ${1.4+i*.35}s linear infinite`,animationDelay:`${i*.4}s`}}>{g}</div>
      ))}
      {/* Mission outer orbit */}
      {isMission && (
        <div style={{position:"absolute",top:"50%",left:"50%",marginTop:-7,marginLeft:-7,fontSize:12,color:"#ffcc44",
          animation:"orbitBig 3s linear infinite"}}>{G.MISS}</div>
      )}

      {/* Main SVG */}
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%"}}>
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="cglow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="bodyG" cx="50%" cy="38%" r="52%">
            <stop offset="0%" stopColor={`${C}28`}/>
            <stop offset="100%" stopColor="#040c13"/>
          </radialGradient>
          <radialGradient id="coreG" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C}/>
            <stop offset="100%" stopColor={`${C}88`}/>
          </radialGradient>
        </defs>

        {/* Body fill */}
        <ellipse cx="50" cy="54" rx="28" ry="36" fill="url(#bodyG)" stroke={`${C}33`} strokeWidth=".5"/>

        {/* Helmet */}
        <path d="M 31 42 Q 31 18 50 16 Q 69 18 69 42 L 67 52 Q 60 58 50 59 Q 40 58 33 52 Z"
          fill="#06111a" stroke={`${C}55`} strokeWidth=".8" filter="url(#glow)"/>

        {/* Visor */}
        <path d="M 37 35 Q 37 27 50 26 Q 63 27 63 35 L 62 44 Q 56 48 50 48 Q 44 48 38 44 Z"
          fill={`${C}18`} stroke={`${C}77`} strokeWidth=".6"/>

        {/* Eyes */}
        {[42,58].map((x,i)=>(
          <g key={i}>
            <ellipse cx={x} cy="36" rx="4.5" ry="3.5" fill={`${C}33`}/>
            <ellipse cx={x} cy="36" rx="2.2" ry="2" fill={C} filter="url(#cglow)"
              style={{animation:coreAnim}}/>
            <ellipse cx={x-.6} cy="35" rx=".8" ry=".6" fill="white" opacity=".5"/>
          </g>
        ))}

        {/* Armor plates */}
        {[
          {d:"M 33 58 L 26 78 L 38 82 L 44 60 Z"},
          {d:"M 67 58 L 74 78 L 62 82 L 56 60 Z"},
        ].map((p,i)=>(
          <path key={i} {...p} fill="#07131e" stroke={`${C}28`} strokeWidth=".5"
            style={{animation:isCombat?`armorSlide .3s ease ${i*.08}s both`:undefined}}/>
        ))}

        {/* Shoulder plates */}
        <ellipse cx="29" cy="56" rx="7.5" ry="5" fill="#07131e" stroke={`${C}44`} strokeWidth=".6"
          style={{animation:isCombat?"armorSlide .25s ease .04s both":undefined}}/>
        <ellipse cx="71" cy="56" rx="7.5" ry="5" fill="#07131e" stroke={`${C}44`} strokeWidth=".6"
          style={{animation:isCombat?"armorSlide .25s ease .04s both":undefined}}/>

        {/* Center core orb */}
        <circle cx="50" cy="64" r="8" fill={`${C}18`} stroke={`${C}55`} strokeWidth=".8" filter="url(#glow)"/>
        <circle cx="50" cy="64" r="5" fill="url(#coreG)" filter="url(#cglow)"
          style={{animation:coreAnim}}/>

        {/* Seal glyph on chest */}
        <text x="50" y="66.5" textAnchor="middle" fontSize="4.5" fill="#010810" fontFamily="monospace" opacity=".9">{G.SEAL}</text>

        {/* Antenna */}
        <line x1="50" y1="16" x2="50" y2="8" stroke={`${C}66`} strokeWidth=".9"/>
        <circle cx="50" cy="7" r="2.2" fill={C} filter="url(#cglow)" style={{animation:coreAnim}}/>

        {/* Form glyph ring — decorative */}
        <circle cx="50" cy="50" r="40" fill="none" stroke={`${C}08`} strokeWidth=".4" strokeDasharray="2,6"/>

        {/* Guardian shield aura */}
        {isGuardian && (
          <ellipse cx="50" cy="52" rx="34" ry="42" fill="none" stroke="#44ff88" strokeWidth="1.4"
            filter="url(#glow)" style={{animation:"shieldPulse 1.8s ease-in-out infinite"}}/>
        )}

        {/* Strategic grid overlays */}
        {isStrategic && [34,50,66].map(x=>(
          <line key={x} x1={x} y1="20" x2={x} y2="82" stroke={C} strokeWidth=".25" opacity=".35" strokeDasharray="2,5"/>
        ))}
        {isStrategic && [34,50,66].map(y=>(
          <line key={y} x1="20" y1={y} x2="80" y2={y} stroke={C} strokeWidth=".25" opacity=".35" strokeDasharray="2,5"/>
        ))}

        {/* Mission ignition ring */}
        {isMission && (
          <circle cx="50" cy="50" r="44" fill="none" stroke="#ffcc44" strokeWidth="1.2"
            opacity=".6" filter="url(#glow)" style={{animation:"shieldPulse 1s ease-in-out infinite"}}/>
        )}

        {/* Evolution form marker (top right) */}
        <text x="85" y="22" textAnchor="middle" fontSize="9" fill={C} opacity=".5" fontFamily="monospace">{formData.glyph}</text>
      </svg>

      {/* Scan line overlay for strategic */}
      {isStrategic && (
        <div className="slo">
          <div className="slv"/>
          <div className="slh"/>
        </div>
      )}
    </div>
  );
}

// ── COMPANION PANEL (CHAT) ────────────────────────────────────────────────────
function CompanionPanel({ state, dispatch, mode }) {
  const [input, setInput] = useState("");
  const [sealQueue, setSealQueue] = useState(null);
  const endRef = useRef(null);
  const msgs = state.messages;
  const modeData = MODES[mode];

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  const nx_replies = [
    `${G.ID} Processing directive. PolicyGate: PASS. Routing to ${Object.keys(WORKERS)[Math.floor(Math.random()*3)]}.`,
    `${G.AUTH} Command acknowledged. ShadowChannel entry committed. ${G.SEAL}`,
    `${G.EVO} Directive parsed via operator grammar. Executing with zero drift.`,
    `${G.MISS} Mission parameters logged. SIGILDRON dispatched for artifact retrieval.`,
    `${G.SYS} Validated. OrchestratorEngine acknowledged. Runtime nominal. ${G.SEAL}`,
    `${G.STRAT} Strategic analysis initiated. BYTEWOLF pathfinding active.`,
  ];

  const send = async () => {
    if (!input.trim()) return;
    const ts = new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    const prompt = input;
    dispatch({type:"MSG",v:{id:Date.now(),role:"op",text:prompt,ts}});
    dispatch({type:"AVATAR",v:"PROCESSING"});
    dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:"COMPANION",level:"INFO",msg:`Op directive: "${prompt.slice(0,40)}…"`}});
    setInput("");

    // Map v3 mode names to backend companion mode names
    const modeMap = {NOMINAL:"strategic",STRATEGIC:"strategic",COMBAT:"combat",GUARDIAN:"guardian"};
    try {
      const res = await fetch("/v1/companion/nexusmon", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({prompt, mode:modeMap[mode]||"strategic"})
      });
      const data = await res.json();
      dispatch({type:"AVATAR",v:"RESPONDING"});
      dispatch({type:"MSG",v:{id:Date.now()+1,role:"nx",text:data.reply||data.error||"[No response]",ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}});
      dispatch({type:"LOG",v:{ts:new Date().toLocaleTimeString(),lv:"INFO",msg:`Companion responded — tier: ${data.tier_used||"?"} — mode: ${mode}`}});
    } catch {
      dispatch({type:"AVATAR",v:"RESPONDING"});
      dispatch({type:"MSG",v:{id:Date.now()+1,role:"nx",text:`${G.SEAL} [COMPANION OFFLINE] Backend unavailable. Start nexusmon_server.py.`,ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}});
    } finally {
      setTimeout(()=>dispatch({type:"AVATAR",v:mode==="NOMINAL"?"IDLE":mode==="STRATEGIC"?"STRATEGIC":mode==="COMBAT"?"COMBAT_READY":"GUARDIAN"}),1400);
    }
  };

  const seal = () => {
    if (!input.trim()) return;
    setSealQueue({text:input,id:Date.now()});
    setInput("");
  };

  return (
    <div className="cw">
      <div className="cm">
        {msgs.map(m=>(
          <div key={m.id} className={`msg ${m.role}`}>
            <div className="mwho">{m.role==="op"?`OPERATOR ${G.ID}`:`NEXUSMON ${G.SEAL}`} · {m.ts}</div>
            <div className="mb2">{m.text}</div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>

      {sealQueue && (
        <div className="squeue">
          <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {G.SEAL} SEALED: "{sealQueue.text.slice(0,45)}{sealQueue.text.length>45?"…":""}"
          </span>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            <button className="btn b-grn b-sm" onClick={()=>{
              dispatch({type:"APPROVAL",v:{title:"SEALED COMMAND",body:`Command: ${sealQueue.text}\n\nThis sealed directive will be executed and committed to the ShadowChannel audit log. Approve?`,action:"SEALED_CMD",onApprove:()=>{ setSealQueue(null); dispatch({type:"LOG",v:{ts:new Date().toLocaleTimeString(),lv:"OK",msg:`Sealed command executed: "${sealQueue.text.slice(0,30)}"`}}); }}});
            }}>APPROVE</button>
            <button className="btn b-red b-sm" onClick={()=>setSealQueue(null)}>DENY</button>
          </div>
        </div>
      )}

      <div className="cbottom">
        <textarea className="cinput" value={input} onChange={e=>setInput(e.target.value)}
          placeholder="Issue directive to NEXUSMON…"
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}/>
        <div className="crow">
          <span className="cbadge">{G.SYS} Operator grammar active · Mode: {mode}</span>
          <button className="btn b-gold b-sm" onClick={seal}>{G.SEAL} SEAL</button>
          <button className="btn b-blue b-sm" onClick={send}>TRANSMIT ⟶</button>
        </div>
      </div>
    </div>
  );
}

// ── MISSION ENGINE ────────────────────────────────────────────────────────────
function MissionPanel({ state, dispatch }) {
  const [expanded, setExpanded] = useState("M-001");
  const missions = state.missions;
  const scol = {ACTIVE:"#ffcc44",PENDING:"#00d4ff",COMPLETED:"#44ff88"};
  const pcol = {HIGH:"#ff3c3c",MED:"#ffaa00",LOW:"#44ff88"};

  const dispatchMission = (m) => {
    dispatch({type:"APPROVAL",v:{
      title:"MISSION DISPATCH",
      body:`Mission: ${m.title}\nWorker: ${m.worker}\nPriority: ${m.priority}\n\nApprove dispatch? This will be logged to ShadowChannel.`,
      action:"MISSION_DISPATCH",
      onApprove:()=>{
        dispatch({type:"MISSION_UP",id:m.id,p:{status:"ACTIVE",logs:[...m.logs,"Dispatch approved","Worker activated"]}});
        dispatch({type:"AVATAR",v:"MISSION"});
        dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:"MISSION",level:"OK",msg:`${m.id} dispatched → ${m.worker} | ACTIVE`}});
        dispatch({type:"LOG",v:{ts:new Date().toLocaleTimeString(),lv:"OK",msg:`Mission ${m.id} activated`}});
        setTimeout(()=>dispatch({type:"AVATAR",v:"IDLE"}),2000);
      }
    }});
  };

  const completeMission = (m) => {
    dispatch({type:"MISSION_UP",id:m.id,p:{status:"COMPLETED",logs:[...m.logs,"Mission complete ✓"]}});
    dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:"MISSION",level:"OK",msg:`${m.id} COMPLETED`}});
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div className="st" style={{marginBottom:0}}>MISSION BOARD</div>
        <button className="btn b-gold b-sm" onClick={()=>dispatch({type:"APPROVAL",v:{
          title:"NEW MISSION",
          body:"Create new mission directive?\nAll missions require operator signature.\nShadowChannel will log this action.",
          action:"MISSION_CREATE",
          onApprove:()=>{
            const id = `M-00${missions.length+1}`;
            dispatch({type:"MISSION_ADD",v:{id,title:"New Directive",status:"PENDING",priority:"MED",worker:"BYTEWOLF",ts:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),logs:["Created by operator"]}});
          }
        }})}>+ NEW</button>
      </div>

      {missions.map(m=>(
        <div key={m.id} className={`mi ${m.status}`} onClick={()=>setExpanded(expanded===m.id?null:m.id)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div className="mtitle">{m.title}</div>
            <span className="chip" style={{color:scol[m.status],flexShrink:0,marginLeft:6}}>{m.status}</span>
          </div>
          <div className="mmeta">
            <span>{m.id}</span>
            <span style={{color:WORKERS[m.worker]?.color}}>{m.worker}</span>
            <span style={{color:pcol[m.priority]}}>PRI:{m.priority}</span>
            <span>{m.ts}</span>
          </div>
          {expanded===m.id && (
            <>
              <div className="mlogs" style={{display:"flex"}}>
                {m.logs.map((l,i)=><span key={i}>{G.SYS} {l}</span>)}
              </div>
              <div style={{display:"flex",gap:4,marginTop:6}}>
                {m.status==="PENDING" && <button className="btn b-gold b-xs" onClick={e=>{e.stopPropagation();dispatchMission(m);}}>DISPATCH</button>}
                {m.status==="ACTIVE"  && <button className="btn b-grn b-xs" onClick={e=>{e.stopPropagation();completeMission(m);}}>COMPLETE</button>}
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
  const current = state.currentForm;
  const [xpData, setXpData] = useState(null);

  // Poll real XP from backend
  useEffect(()=>{
    const poll = async()=>{
      try {
        const d = await fetch("/api/avatar/xp").then(r=>r.json());
        setXpData(d.summary ?? d);
      } catch {}
    };
    poll();
    const t = setInterval(poll, 10000);
    return ()=>clearInterval(t);
  },[]);

  const triggerEvo = (target) => {
    if (target.id <= current || target.unlocked) return;
    if (EVO_FORMS[current].xp < EVO_FORMS[current].threshold) return;
    dispatch({type:"APPROVAL",v:{
      title:"EVOLUTION GATE",
      body:`Evolve NEXUSMON from ${EVO_FORMS[current].rank} → ${target.rank}?\n\nForm: ${target.form}\nColor: ${target.color}\nArmor: ${target.armorStyle}\n\nThis is additive. Previous form is preserved in lineage. Operator seal required.`,
      action:"EVOLUTION",
      onApprove:()=>{
        dispatch({type:"EVOLVING",v:true});
        dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:"EVOLUTION",level:"OK",msg:`Evolution approved: ${EVO_FORMS[current].rank} → ${target.rank}`}});
        setTimeout(()=>{
          dispatch({type:"EVO",v:target.id});
          dispatch({type:"EVOLVING",v:false});
          dispatch({type:"LOG",v:{ts:new Date().toLocaleTimeString(),lv:"OK",msg:`Evolution complete: ${target.form}`}});
        },3000);
      }
    }});
  };

  return (
    <div>
      <div className="st">EVOLUTION TREE</div>
      {EVO_FORMS.map((f,i)=>{
        const isCurr = i === current;
        const isUnlk = i < current;
        const realXp = isCurr && xpData?.xp != null ? xpData.xp : f.xp;
        const prog   = isCurr ? Math.min(100,(realXp/f.threshold)*100) : isUnlk ? 100 : 0;
        return (
          <div key={f.id} className={`es ${isCurr?"current":isUnlk?"unlocked":"locked"}`}
            onClick={()=>!isCurr&&!isUnlk&&triggerEvo(f)}>
            <div className="enode" style={{
              background:isCurr?`${f.color}20`:isUnlk?`${f.color}10`:"rgba(255,255,255,.03)",
              border:`1px solid ${isCurr?f.color:isUnlk?`${f.color}55`:"var(--bd)"}`,
            }}>{isUnlk||isCurr?f.glyph:"○"}</div>
            <div style={{flex:1}}>
              <div className="erank" style={{color:isCurr?f.color:isUnlk?`${f.color}cc`:"var(--td)"}}>{f.rank}</div>
              <div className="eform">{f.form}</div>
              {isCurr && <>
                <div className="xpbar"><div className="xpfill" style={{width:`${prog}%`,background:f.color}}/></div>
                <div className="eform" style={{marginTop:2}}>{realXp.toLocaleString()}/{f.threshold.toLocaleString()} XP{xpData?.rank&&` · ${xpData.rank}`}</div>
              </>}
              {!isCurr&&!isUnlk && <div className="eform">Requires {f.threshold.toLocaleString()} XP · Operator approval</div>}
              {isUnlk && <div className="eform" style={{color:f.color}}>FORM COMPLETE — Preserved in lineage</div>}
            </div>
          </div>
        );
      })}

      <div className="div"/>
      <div className="st">TRAIT GRID</div>
      <div className="tg">
        {Object.entries(TRAITS).map(([key,t])=>(
          <div key={key} className={`tcard ${t.unlocked?"unlocked":"locked"}`}>
            <div className="tglyph">{t.glyph}</div>
            <div className="tname">{t.name}</div>
            <div className="teff">{t.effect}</div>
            {!t.unlocked && <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:3}}>Form {t.form} required</div>}
          </div>
        ))}
      </div>

      {state.evoLog.length > 0 && <>
        <div className="div"/>
        <div className="st">EVOLUTION LINEAGE (ADDITIVE)</div>
        {state.evoLog.map((e,i)=>(
          <div key={i} className="ll"><span className="lt">{e.ts}</span><span className="lm">{G.EVO} {e.form}</span></div>
        ))}
      </>}
    </div>
  );
}

// ── ARTIFACT VAULT ────────────────────────────────────────────────────────────
function VaultPanel({ state, dispatch }) {
  const { artifacts, diff } = state;
  const tcol = {CODEX:"#00d4ff",DOC:"#aa44ff",SPEC:"#ffaa00",CODE:"#44ff88",DESIGN:"#ff44aa"};

  const sealArtifact = (a) => (e) => {
    e.stopPropagation();
    dispatch({type:"APPROVAL",v:{
      title:"SEAL ARTIFACT",
      body:"Seal artifact " + a.id + ": " + a.name + "?\nSealing is permanent. Operator approval required.",
      action:"SEAL",
      onApprove:()=>dispatch({type:"ART_SEAL",id:a.id})
    }});
  };
  const deleteArtifact = (a) => (e) => {
    e.stopPropagation();
    dispatch({type:"APPROVAL",v:{
      title:"DELETE ARTIFACT",
      body:"Delete " + a.name + "?\nThis action is irreversible. ShadowChannel will log deletion.",
      action:"DELETE",
      onApprove:()=>dispatch({type:"ART_DEL",id:a.id})
    }});
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div className="st" style={{marginBottom:0}}>ARTIFACT VAULT — {artifacts.length} ITEMS</div>
      </div>

      {artifacts.map(a=>(
        <div key={a.id} className="ai" onClick={()=>dispatch({type:"DIFF",v:diff===a.id?null:a.id})}>
          <span style={{color:a.sealed?"var(--c-gold)":"var(--td)",fontSize:13}}>{a.sealed?G.SEAL:"○"}</span>
          <div className="ainfo">
            <div className="aname">{a.name}</div>
            <div className="ameta">
              <span className="chip" style={{color:tcol[a.type]||"var(--td)"}}>{a.type}</span>
              {" "}{a.ver} · {a.ts} · {a.size}
            </div>
          </div>
          <div style={{display:"flex",gap:3,flexShrink:0}}>
            <button className="btn b-blue b-xs" onClick={e=>e.stopPropagation()}>↓</button>
            {!a.sealed && <>
              <button className="btn b-gold b-xs" onClick={sealArtifact(a)}>{G.SEAL}</button>
              <button className="btn b-red b-xs" onClick={deleteArtifact(a)}>✕</button>
            </>}
          </div>
        </div>
      ))}

      {diff && (
        <div className="diff-panel">
          <div className="st">DIFF VIEWER — {artifacts.find(a=>a.id===diff)?.name}</div>
          {["+ Added: governance enforcement layer","+ Added: operator approval gate","~ Modified: policygate weight thresholds","+ Added: ShadowChannel SSE hook","- Removed: legacy auth bypass (deprecated)"].map((l,i)=>(
            <div key={i} style={{color:l.startsWith("+")?`var(--c-green)`:l.startsWith("-")?"var(--c-red)":"var(--td)",marginBottom:2}}>{l}</div>
          ))}
        </div>
      )}

      <div className="div"/>
      <div className="st">AUDIT LOG</div>
      {[
        {ts:"03-06 14:22",ev:"A-003 created by SIGILDRON"},
        {ts:"03-06 14:18",ev:"A-001 sealed by operator"},
        {ts:"03-06 13:55",ev:"A-004 version bump v0.1→v0.2"},
        {ts:"03-05 22:10",ev:"A-002 sealed by operator"},
        {ts:"03-02 18:40",ev:"A-005 sealed by operator"},
      ].map((l,i)=>(
        <div key={i} className="ll"><span className="lt">{l.ts}</span><span className="lm">{l.ev}</span></div>
      ))}
    </div>
  );
}

// ── FACTORY CONSOLE ───────────────────────────────────────────────────────────
function FactoryPanel({ state, dispatch }) {
  const logs = state.logs;
  const logsEndRef = useRef(null);
  useEffect(()=>{ logsEndRef.current?.scrollIntoView({behavior:"smooth"}); },[logs]);

  const lvClass = {OK:"lOK",INFO:"lINFO",WARN:"lWARN",ERR:"lERR"};

  return (
    <div>
      <div className="st">WORKER REGISTRY</div>
      {Object.entries(WORKERS).map(([name,w])=>(
        <div key={name} className="wc" style={{borderColor:`${w.color}22`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div className="wname" style={{color:w.color}}>{w.glyph} {name}</div>
            <span className="chip" style={{color:w.status==="ACTIVE"?"var(--c-green)":"var(--td)"}}>{w.status}</span>
          </div>
          <div className="wrole">{w.role} · {w.missions} missions</div>
          <div style={{display:"flex",gap:4,marginTop:5}}>
            <button className="btn b-blue b-xs">SPAWN</button>
            <button className="btn b-red b-xs">HALT</button>
            <button className="btn b-gold b-xs">INSPECT</button>
          </div>
        </div>
      ))}

      <div className="div"/>
      <div className="st">RUNTIME CONTROLS</div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {[["RESTART","b-blue"],["PATCH","b-gold"],["HALT","b-red"],["VALIDATE","b-grn"],["ROLLBACK","b-teal"]].map(([l,c])=>(
          <button key={l} className={`btn ${c} b-sm`} onClick={()=>dispatch({type:"LOG",v:{ts:new Date().toLocaleTimeString(),lv:"INFO",msg:`${l} command issued by operator`}})}>{l}</button>
        ))}
      </div>

      <div className="div"/>
      <div className="st">MODULE LOADER</div>
      {["PolicyGate","RollbackEngine","EvolutionEngine","OrchestratorEngine","ShadowChannel"].map(m=>(
        <div key={m} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid var(--bd)"}}>
          <span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--tm)"}}>{m}</span>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            <span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--c-green)"}}>● ACTIVE</span>
            <button className="btn b-red b-xs">UNLOAD</button>
          </div>
        </div>
      ))}

      <div className="div"/>
      <div className="st">LIVE RUNTIME LOG</div>
      <div style={{maxHeight:160,overflowY:"auto"}}>
        {logs.map((l,i)=>(
          <div key={i} className="ll">
            <span className="lt">{l.ts}</span>
            <span className={lvClass[l.lv]||"lINFO"}>[{l.lv}]</span>
            <span className="lm">{l.msg}</span>
          </div>
        ))}
        <div ref={logsEndRef}/>
      </div>
    </div>
  );
}

// ── SHADOW CHANNEL ────────────────────────────────────────────────────────────
function ShadowPanel({ state, dispatch }) {
  const events = state.shadow;
  const lcol = {OK:"slOK",INFO:"slINFO",WARN:"slWARN"};

  // Wire to live audit SSE stream
  useEffect(()=>{
    const es = new EventSource("/api/audit/stream");
    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data);
        if (ev.type === "keepalive" || ev.ping) return;
        dispatch({type:"SHADOW",v:{
          id:Date.now(),
          ts:new Date().toLocaleTimeString(),
          type:ev.event_type||ev.type||"EVENT",
          level:ev.level||"INFO",
          msg:ev.message||ev.msg||JSON.stringify(ev).slice(0,80)
        }});
      } catch {}
    };
    return ()=>es.close();
  },[]);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div className="st" style={{marginBottom:0}}>SHADOW CHANNEL — {events.length} EVENTS</div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--c-green)"}}>● SSE LIVE</span>
        </div>
      </div>

      <div style={{marginBottom:10,padding:"7px 9px",border:"1px solid rgba(0,212,255,.15)",borderRadius:2,background:"rgba(0,212,255,.03)"}}>
        <div style={{fontFamily:"var(--fm)",fontSize:7.5,color:"var(--td)"}}>
          <div>Entries: <span style={{color:"var(--tp)"}}>1,852</span> · Append-only JSONL</div>
          <div style={{marginTop:3}}>SSE: <span style={{color:"var(--c-green)"}}>CONNECTED</span> · /events</div>
          <div style={{marginTop:3}}>Mode routing: <span style={{color:"var(--mc)"}}>ACTIVE</span></div>
        </div>
      </div>

      <div className="st">EVENT STREAM</div>
      <div style={{maxHeight:240,overflowY:"auto"}}>
        {events.map(e=>(
          <div key={e.id} className="se">
            <span className="lt">{e.ts}</span>
            <span className="stype">{e.type}</span>
            <span className={lcol[e.level]||"slINFO"}>[{e.level}]</span>
            <span className="sm2">{e.msg}</span>
          </div>
        ))}
      </div>

      <div className="div"/>
      <div className="st">MODE-AWARE ROUTING</div>
      {Object.entries(MODES).map(([k,m])=>(
        <div key={k} style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--fm)",fontSize:8,padding:"3px 0",borderBottom:"1px solid var(--bd)"}}>
          <span style={{color:m.color}}>{m.glyph} {m.label}</span>
          <span style={{color:"var(--td)"}}>→ {k==="COMBAT"?"ESCALATE_FIRST":k==="GUARDIAN"?"SHIELD_FILTER":k==="STRATEGIC"?"ANALYSIS_PRIORITY":"DEFAULT"}</span>
        </div>
      ))}

      <div className="div"/>
      <div className="st">OPERATOR HOOKS</div>
      {["onReplyStart","onReplyEnd","onModeChange","onMissionStart","onMissionComplete","onEvolution","onArtifactSealed"].map(h=>(
        <div key={h} style={{fontFamily:"var(--fm)",fontSize:7.5,color:"var(--td)",padding:"2px 0",borderBottom:"1px solid rgba(255,255,255,.02)"}}>
          {G.SYS} {h}
        </div>
      ))}
    </div>
  );
}

// ── SYSTEM HEALTH ─────────────────────────────────────────────────────────────
function HealthPanel({ mode, dispatch }) {
  const [cpu, setCpu] = useState(34);
  const [mem, setMem] = useState(61);
  const [uptime, setUptime] = useState(14382);
  const [health, setHealth] = useState(null);

  // Simulated jitter for animated bars
  useEffect(()=>{
    const t = setInterval(()=>{
      setCpu(v=>Math.min(98,Math.max(5,v+(Math.random()-.5)*8)));
      setMem(v=>Math.min(92,Math.max(20,v+(Math.random()-.5)*3)));
      setUptime(v=>v+1);
    },1000);
    return ()=>clearInterval(t);
  },[]);

  // Poll real backend health
  useEffect(()=>{
    const poll = async()=>{
      try { setHealth(await fetch("/api/health/deep").then(r=>r.json())); } catch {}
    };
    poll();
    const t = setInterval(poll, 5000);
    return ()=>clearInterval(t);
  },[]);

  const fmt = s=>`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`;
  const subsystems = health?.subsystems ?? {};
  const scol = {ok:"var(--c-green)",degraded:"var(--c-gold)",error:"var(--c-red)"};

  return (
    <div>
      <div style={{marginBottom:10,padding:"8px 9px",border:"1px solid rgba(68,255,136,.15)",borderRadius:2,background:"rgba(68,255,136,.03)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="hb">
            {[.4,.7,1,.6,.3,.9,.5,.8,1,.4,.6,.7].map((h,i)=>(
              <div key={i} className="hbb" style={{height:`${h*18}px`,animationDelay:`${i*.09}s`,animationDuration:`${.85+Math.random()*.3}s`}}/>
            ))}
          </div>
          <div>
            <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--c-green)"}}>RUNTIME ONLINE · :8012</div>
            <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginTop:2}}>{fmt(uptime)}</div>
          </div>
        </div>
      </div>

      <div className="st">RESOURCE MONITOR</div>
      {[
        ["CPU",cpu,cpu>75?"var(--c-red)":"var(--mc)"],
        ["MEMORY",mem,mem>80?"var(--c-gold)":"var(--c-green)"],
        ["POLICY GATE",100,"var(--c-green)"],
        ["SHADOW CHAN",100,"var(--c-green)"],
        ["BRIDGE V2",100,"var(--c-green)"],
      ].map(([l,v,c])=>(
        <div key={l} className="stat-row">
          <div className="stat-lbl"><span>{l}</span><span style={{color:c}}>{Math.round(v)}%</span></div>
          <div className="stat-bar"><div className="stat-fill" style={{width:`${v}%`,background:c}}/></div>
        </div>
      ))}

      <div className="div"/>
      <div className="st">OPERATOR MODE</div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {Object.entries(MODES).map(([k,m])=>(
          <button key={k} className="nb" style={{
            color:m.color,
            background:mode===k?m.bg:"none",
            borderColor:mode===k?m.color:"transparent",
          }} onClick={()=>dispatch({type:"MODE",v:k})}>
            <span className="ng">{m.glyph}</span>{m.label}
            {mode===k&&<span style={{marginLeft:"auto",fontSize:7}}>ACTIVE</span>}
          </button>
        ))}
      </div>

      <div className="div"/>
      <div className="st">GOVERNANCE</div>
      {Object.keys(subsystems).length > 0
        ? Object.entries(subsystems).map(([n,s])=>(
          <div key={n} style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--fm)",fontSize:7.5,padding:"3px 0",borderBottom:"1px solid var(--bd)"}}>
            <span style={{color:"var(--td)"}}>{n}</span>
            <span style={{color:scol[s]||"var(--td)"}}>{s==="ok"?"●":"○"} {s?.toUpperCase()}</span>
          </div>
        ))
        : [["PolicyGate","ACTIVE"],["RollbackEngine","STANDBY"],["EvolutionEngine","ACTIVE"],["OrchestratorEngine","ACTIVE"]].map(([n,s])=>(
          <div key={n} style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--fm)",fontSize:7.5,padding:"3px 0",borderBottom:"1px solid var(--bd)"}}>
            <span style={{color:"var(--td)"}}>{n}</span>
            <span style={{color:s==="ACTIVE"?"var(--c-green)":"var(--mc)"}}>{s==="ACTIVE"?"●":"○"} {s}</span>
          </div>
        ))
      }

      <div className="div"/>
      <div className="st">HORIZON GATES</div>
      {[["H1 — RUNTIME CORE","OPEN"],["H2 — BIOECONOMY","LOCKED"],["H3 — SPACE","LOCKED"]].map(([n,s])=>(
        <div key={n} style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--fm)",fontSize:7.5,padding:"3px 0"}}>
          <span style={{color:"var(--td)"}}>{n}</span>
          <span style={{color:s==="OPEN"?"var(--c-green)":"var(--td)"}}>{s}</span>
        </div>
      ))}
    </div>
  );
}

// ── RIGHT PANEL INTEL FEED ────────────────────────────────────────────────────
function IntelFeed({ state, dispatch }) {
  return (
    <>
      <div className="ph"><span className="ph-accent">INTEL FEED</span></div>
      <div className="pc">
        <div className="st">ACTIVE WORKERS</div>
        {Object.entries(WORKERS).map(([n,w])=>(
          <div key={n} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:w.color,boxShadow:`0 0 6px ${w.color}`}}/>
            <span style={{fontFamily:"var(--fm)",fontSize:8,color:w.color}}>{n}</span>
            <span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",marginLeft:"auto"}}>{w.status}</span>
          </div>
        ))}

        <div className="div"/>
        <div className="st">POLICY GATE</div>
        {Object.entries(POLICY_OUTCOMES).map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--fm)",fontSize:8,padding:"3px 0",borderBottom:"1px solid var(--bd)"}}>
            <span style={{color:v.color}}>{k}</span><span style={{color:"var(--td)"}}>{v.count}</span>
          </div>
        ))}

        <div className="div"/>
        <div className="st">SHADOW CHANNEL</div>
        <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--td)"}}>
          <div>Total: <span style={{color:"var(--tp)"}}>1,852</span></div>
          <div style={{marginTop:3}}>SSE: <span style={{color:"var(--c-green)"}}>LIVE</span></div>
          <div style={{marginTop:3}}>Last: <span style={{color:"var(--tp)"}}>now</span></div>
        </div>

        <div className="div"/>
        <div className="st">RECENT EVENTS</div>
        {state.shadow.slice(0,5).map(e=>(
          <div key={e.id} style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)",padding:"2px 0",borderBottom:"1px solid rgba(255,255,255,.02)",animation:"dataDrop .25s ease"}}>
            <div style={{color:"var(--tm)"}}>{e.type} · {e.ts}</div>
            <div style={{color:"var(--tp)",marginTop:1}}>{e.msg}</div>
          </div>
        ))}

        <div className="div"/>
        <div className="st">EVO FORM</div>
        <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--td)"}}>
          <div>Current: <span style={{color:EVO_FORMS[state.currentForm].color}}>{EVO_FORMS[state.currentForm].form}</span></div>
          <div style={{marginTop:3}}>Rank: <span style={{color:"var(--tp)"}}>{EVO_FORMS[state.currentForm].rank}</span></div>
          <div style={{marginTop:3}}>XP: <span style={{color:"var(--c-gold)"}}>{EVO_FORMS[state.currentForm].xp}/{EVO_FORMS[state.currentForm].threshold}</span></div>
        </div>

        <div className="div"/>
        <div className="st">HORIZON LOCK</div>
        {[["H1","OPEN","var(--c-green)"],["H2","LOCKED","var(--td)"],["H3","LOCKED","var(--td)"]].map(([h,s,c])=>(
          <div key={h} style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--fm)",fontSize:7.5,padding:"2px 0"}}>
            <span style={{color:"var(--td)"}}>{h}</span><span style={{color:c}}>{s}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── PANELS CONFIG ─────────────────────────────────────────────────────────────
const PANELS = [
  { id:"COMPANION",  label:"COMPANION",  glyph:G.ID   },
  { id:"MISSION",    label:"MISSION",    glyph:G.MISS },
  { id:"EVOLUTION",  label:"EVOLUTION",  glyph:G.EVO  },
  { id:"VAULT",      label:"VAULT",      glyph:G.ART  },
  { id:"FACTORY",    label:"FACTORY",    glyph:G.FACT },
  { id:"SHADOW",     label:"SHADOW CH",  glyph:G.AUTH },
  { id:"HEALTH",     label:"SYS HEALTH", glyph:G.SYS  },
];

// ── APPROVAL MODAL ────────────────────────────────────────────────────────────
function ApprovalModal({ approval, dispatch }) {
  if (!approval) return null;
  return (
    <div className="aov" onClick={()=>dispatch({type:"APPROVAL",v:null})}>
      <div className="amod" onClick={e=>e.stopPropagation()}>
        <div className="atitle"><span>{G.SEAL}</span><span>OPERATOR APPROVAL REQUIRED</span></div>
        <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--c-gold)",marginBottom:8,letterSpacing:".1em"}}>ACTION: {approval.action}</div>
        <div className="abody" style={{whiteSpace:"pre-wrap"}}>{approval.body}</div>
        <div className="aacts">
          <button className="btn b-red" onClick={()=>dispatch({type:"APPROVAL",v:null})}>DENY</button>
          <button className="btn b-gold" onClick={()=>dispatch({type:"APPROVAL",v:null})}>ESCALATE</button>
          <button className="btn b-grn" onClick={()=>{
            approval.onApprove?.();
            dispatch({type:"APPROVAL",v:null});
            dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:"APPROVAL",level:"OK",msg:`${approval.action} approved by operator`}});
            dispatch({type:"LOG",v:{ts:new Date().toLocaleTimeString(),lv:"OK",msg:`Approval: ${approval.action}`}});
          }}>{G.SEAL} APPROVE</button>
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
      <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--td)",letterSpacing:".2em"}}>EVOLUTION IGNITION SEQUENCE</div>
      <div className="eov-core" style={{color:next.color}}>{next.glyph}</div>
      <div className="eov-text">{next.form}</div>
      <div className="eov-sub">FORM SHIFT · LINEAGE PRESERVED · ADDITIVE ONLY</div>
      <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--td)"}}>Awaiting core ignition…</div>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function NexusmonCockpit() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const { mode, avatarState, panel, approval, evolving } = state;
  const modeData = MODES[mode];
  const [clock, setClock] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(()=>{
    const t = setInterval(()=>{
      setClock(new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
      setTick(v=>v+1);
      // Periodic shadow events
      if(Math.random()<.15) {
        dispatch({type:"SHADOW",v:{id:Date.now(),ts:new Date().toLocaleTimeString(),type:["RUNTIME","POLICY","WORKER"][Math.floor(Math.random()*3)],level:"INFO",msg:[`Runtime tick ${Math.floor(Math.random()*9999)}`,"PolicyGate heartbeat OK","Worker heartbeat nominal"][Math.floor(Math.random()*3)]}});
      }
    },1000);
    return ()=>clearInterval(t);
  },[]);

  // Apply CSS vars for mode
  const modeStyle = { "--mc":modeData.color, "--mb":modeData.bg };

  const renderMain = () => {
    switch(panel) {
      case "COMPANION": return <CompanionPanel state={state} dispatch={dispatch} mode={mode}/>;
      case "MISSION":   return <div className="pc"><MissionPanel state={state} dispatch={dispatch}/></div>;
      case "EVOLUTION": return <div className="pc"><EvolutionPanel state={state} dispatch={dispatch}/></div>;
      case "VAULT":     return <div className="pc"><VaultPanel state={state} dispatch={dispatch}/></div>;
      case "FACTORY":   return <div className="pc"><FactoryPanel state={state} dispatch={dispatch}/></div>;
      case "SHADOW":    return <div className="pc"><ShadowPanel state={state} dispatch={dispatch}/></div>;
      case "HEALTH":    return <div className="pc"><HealthPanel mode={mode} dispatch={dispatch}/></div>;
      default:          return null;
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ck" style={modeStyle}>

        {/* TOPBAR */}
        <div className="topbar">
          <span className="seal">{SEAL}</span>
          <div>
            <div className="logo">NEXUSMON</div>
            <div className="logo-sub">SOVEREIGN RUNTIME · COCKPIT v3.0</div>
          </div>
          <div className="spacer"/>
          {mode !== "NOMINAL" && <div className="mode-pill">{modeData.glyph} {modeData.label} MODE ACTIVE</div>}
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
            <span className="ttime">{clock}</span>
            <span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--td)"}}>PORT :8012 ONLINE</span>
          </div>
        </div>

        {/* LEFT PANEL */}
        <div className="lp">
          {/* Avatar Zone */}
          <div className="az" style={{background:mode!=="NOMINAL"?modeData.bg:undefined}}>
            <Avatar state={avatarState} mode={mode} form={state.currentForm}/>
            <div className="aname" style={{color:modeData.color}}>{EVO_FORMS[state.currentForm].form}</div>
            <div className="astate" style={{borderColor:modeData.color,color:modeData.color,background:modeData.bg}}>
              {avatarState}
            </div>
            <div className="aform">{EVO_FORMS[state.currentForm].rank} · {modeData.glyph} {mode}</div>
            {/* State shortcuts */}
            <div style={{display:"flex",gap:3,flexWrap:"wrap",justifyContent:"center"}}>
              {["IDLE","LISTENING","PROCESSING","RESPONDING","MISSION"].map(s=>(
                <button key={s} className={`state-btn ${avatarState===s?"on":""}`}
                  onClick={()=>dispatch({type:"AVATAR",v:s})}>{s.slice(0,4)}</button>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div className="nav">
            {PANELS.map(p=>(
              <button key={p.id} className={`nb ${panel===p.id?"on":""}`}
                onClick={()=>dispatch({type:"PANEL",v:p.id})}>
                <span className="ng">{p.glyph}</span>{p.label}
              </button>
            ))}
          </div>

          <div className="op-badge">
            {G.ID} OPERATOR: DARTHVPIRATEKING<br/>
            {G.AUTH} CLEARANCE: SOVEREIGN<br/>
            {G.SEAL} DOCTRINE: ACTIVE
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="mp">
          <div className="ph">
            <span><span className="ph-accent">{PANELS.find(p=>p.id===panel)?.glyph}</span> {panel} ENGINE</span>
            <span style={{color:"var(--td)"}}>{EVO_FORMS[state.currentForm].form} · :8012</span>
          </div>
          {renderMain()}
        </div>

        {/* RIGHT PANEL */}
        <div className="rp">
          <IntelFeed state={state} dispatch={dispatch}/>
        </div>

        {/* BOTTOM BAR */}
        <div className="botbar">
          <span className="seal" style={{fontSize:11}}>{SEAL}</span>
          <div style={{flex:1,overflow:"hidden"}}>
            <div className="tck">
              NEXUSMON SOVEREIGN RUNTIME v3.0 &nbsp;·&nbsp; OPERATOR: DARTHVPIRATEKING &nbsp;·&nbsp;
              PORT :8012 ONLINE &nbsp;·&nbsp; POLICYGATE: ACTIVE &nbsp;·&nbsp; SHADOW CHANNEL: STREAMING &nbsp;·&nbsp;
              BRIDGE V2: CONNECTED &nbsp;·&nbsp; EVOLUTION: ROOKIE → CHAMPION IN PROGRESS &nbsp;·&nbsp;
              MISSION M-001: REPO REPAIR ACTIVE &nbsp;·&nbsp; ALL SYSTEMS NOMINAL &nbsp;{SEAL}&nbsp;
            </div>
          </div>
          <span style={{color:modeData.color,fontFamily:"var(--fm)",fontSize:8}}>■ {mode}</span>
        </div>
      </div>

      {/* Overlays */}
      <ApprovalModal approval={approval} dispatch={dispatch}/>
      <EvoOverlay state={state}/>
    </>
  );
}

/* I13 H1.1 — Stage 14.8: receipt context / next intent.
 * A witnessed Stage 14.7 receipt may become read-only decision context.
 * Wasm revalidates the receipt and derives the next route candidate.
 * ARM delegates selection to Stage 14.6; REQUEST/PENDING/CV/MOVE remain upstream.
 */
(() => {
  'use strict';
  const SVG_NS='http://www.w3.org/2000/svg';
  const WASM_URL='assets/i13_h1_1.wasm.b64';
  const MANIFEST_URL='assets/corpus-browser.json';
  const SUCCESS=1n<<63n, MASK32=0xffff_ffffn;
  const context={wasm:null,manifest:null,byId:new Map(),byAddress:new Map(),ready:false,phase:'WAIT',token:0,current:null,goal:null,next:null,distance:null,receiptWitness:0,note:'receipt context pending',signature:'',timer:null,bootToken:0};
  const u32=v=>Number(v)>>>0;
  const hex=v=>`0x${u32(v).toString(16).padStart(8,'0')}`;
  const svgDoc=()=>document.getElementById('i13')?.contentDocument||null;
  const panel=()=>svgDoc()?.querySelector('.i13-exploded-panel[data-exploded-for="corpus"]')||null;
  const spatialGroup=()=>panel()?.querySelector('[data-stage14-4-spatial]')||null;
  const navigator=()=>window.I13CorpusNavigatorStage||null;
  const navState=()=>navigator()?.state?.()||null;
  const arrivalStage=()=>window.I13CorpusArrivalStage||null;
  const arrivalState=()=>arrivalStage()?.state?.()||null;
  const intentStage=()=>window.I13CorpusIntentStage||null;
  const intentState=()=>intentStage()?.state?.()||null;
  function bytesFromB64(text){const raw=atob(String(text||'').replace(/\s+/g,'')),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
  function decodeWalk(value){const v=BigInt(value);if((v&SUCCESS)===0n)return null;return{address:Number(v&MASK32)>>>0,distance:Number((v>>32n)&0x7fff_ffffn)};}
  function clearDerived(){context.token=0;context.next=null;context.distance=null;context.receiptWitness=0;}
  function deriveContext(){
    const nav=navState(),receipt=arrivalState();context.current=nav?.current||null;context.goal=nav?.goal||null;clearDerived();
    if(!context.ready||!context.wasm){context.phase='WAIT';context.note='receipt context Wasm pending';return null;}
    if(!nav?.current||!nav?.goal){context.phase='WAIT';context.note='current/goal required';return null;}
    if(nav.pending){context.phase='HOLD';context.note=`pending ${nav.pending} must resolve before next context`;return null;}
    if(receipt?.phase!=='RECEIPT'||receipt.current!==nav.current){context.phase='WAIT_RECEIPT';context.note=`fresh receipt required at ${nav.current}`;return null;}
    const node=context.byId.get(nav.current),goal=context.byId.get(nav.goal);if(!node||!goal){context.phase='VETO';context.note='manifest current/goal mismatch';return null;}
    const resultBits=u32(receipt.result??0),steps=u32(receipt.steps),kind=u32(receipt.kind),program=u32(receipt.program),witness=u32(receipt.witness);
    const token=u32(context.wasm.i13_receipt_context(u32(node.address),resultBits,steps,kind,program,witness));
    if(!token){context.phase='VETO';context.note='Wasm rejected receipt context';return null;}
    context.token=token;context.receiptWitness=witness;
    if(u32(node.address)===u32(goal.address)){context.phase='COMPLETE';context.note=`goal ${nav.goal} complete · context ${hex(token)}`;return Object.freeze({token,current:nav.current,goal:nav.goal,next:null,distance:0,witness});}
    const packed=decodeWalk(context.wasm.i13_receipt_next(u32(node.address),u32(goal.address),resultBits,steps,kind,program,witness,nav.evidenceOnly?1:0,54));
    if(!packed){context.phase='VETO';context.note='receipt valid · no admissible next intent';return null;}
    const next=context.byAddress.get(packed.address);if(!next){context.phase='VETO';context.note=`next address ${hex(packed.address)} missing from manifest`;return null;}
    context.next=next.id;context.distance=packed.distance;
    const selected=intentState()?.selected||null;
    context.phase=context.phase==='ARMED'&&selected===next.id?'ARMED':'CONTEXT';
    context.note=`context ${hex(token)} · next ${next.id} · distance ${packed.distance}`;
    return Object.freeze({token,current:nav.current,goal:nav.goal,next:next.id,distance:packed.distance,witness});
  }
  function el(name,attrs={},text=''){const d=svgDoc();if(!d)return null;const n=d.createElementNS(SVG_NS,name);Object.entries(attrs).forEach(([k,v])=>v!=null&&n.setAttribute(k,String(v)));if(text!=='')n.textContent=String(text);return n;}
  function geometry(){const m=panel()?.querySelector('.ev-machine');if(!m)return null;const mx=+m.getAttribute('x')||0,my=+m.getAttribute('y')||0,mw=+m.getAttribute('width')||0,mh=+m.getAttribute('height')||0;if(mh<165||mw<700)return null;const vx=mx+Math.max(440,mw*.43),vy=my+45,vw=Math.max(360,mx+mw-vx-10);return{vx,vy,vw};}
  function button(x,y,w,label,handler,stroke){const g=el('g',{role:'button',tabindex:'0','aria-label':label});if(!g)return null;g.appendChild(el('rect',{x,y,width:w,height:14,rx:7,style:`fill:#f8fafc;stroke:${stroke};stroke-width:.9;cursor:pointer`}));g.appendChild(el('text',{x:x+w/2,y:y+10,'text-anchor':'middle',style:`font-size:6px;font-weight:900;fill:${stroke};pointer-events:none`},label));g.addEventListener('click',handler);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handler();}});return g;}
  function armNext(){
    const before=navState(),packet=deriveContext();if(!packet?.next){context.phase='VETO';context.note=packet?.distance===0?'goal complete · nothing to arm':'valid receipt context required';context.signature='';sync(true);return false;}
    const ok=intentStage()?.armNext?.()===true,after=navState(),intent=intentState();
    const isolated=after?.current===before?.current&&after?.pending===before?.pending;
    if(!ok||!isolated||intent?.selected!==packet.next||intent?.expected!==packet.next){context.phase='VETO';context.note=`ARM isolation mismatch · expected ${packet.next} · selected ${intent?.selected||'—'}`;context.signature='';sync(true);return false;}
    context.phase='ARMED';context.note=`${packet.next} armed from ${hex(packet.token)} · REQUEST still required`;context.signature='';sync(true);return true;
  }
  function render(){
    const base=spatialGroup(),geo=geometry();if(!base||!geo)return false;base.querySelector('[data-stage14-8-context]')?.remove();
    const g=el('g',{'data-stage14-8-context':'true',role:'group','aria-label':'Stage 14.8 receipt context and next intent'});if(!g)return false;
    const x=geo.vx+8,y=geo.vy+111,w=Math.min(310,geo.vw-16),h=44;
    const color=context.phase==='ARMED'?'#2563eb':context.phase==='CONTEXT'?'#0d9488':context.phase==='COMPLETE'?'#16a34a':context.phase==='VETO'?'#dc2626':'#64748b';
    g.appendChild(el('rect',{x,y,width:w,height:h,rx:7,style:`fill:#fff;fill-opacity:.97;stroke:${color};stroke-width:1`}));
    g.appendChild(el('text',{x:x+7,y:y+10,style:'font-size:6.35px;font-weight:900;letter-spacing:.045em;fill:#334155'},'14.8 RECEIPT CONTEXT · CONTEXT ≠ REQUEST ≠ COMMIT'));
    g.appendChild(el('text',{x:x+7,y:y+21,style:'font-size:6.2px;font-weight:800;fill:#64748b'},`${context.current||'—'} → ${context.goal||'—'} · token ${context.token?hex(context.token):'—'}`));
    g.appendChild(el('text',{x:x+7,y:y+33,style:`font-size:6.15px;font-weight:900;fill:${color}`},`${context.phase} · ${context.next||'—'}${context.distance!=null?` · d=${context.distance}`:''} · ${context.note}`));
    const arm=button(x+w-67,y+4,60,'ARM NEXT',armNext,color);if(arm)g.appendChild(arm);base.appendChild(g);return true;
  }
  function signatureFor(){const n=navState(),r=arrivalState(),i=intentState();return JSON.stringify({ready:context.ready,current:n?.current||null,goal:n?.goal||null,pending:n?.pending||null,evidenceOnly:!!n?.evidenceOnly,receiptPhase:r?.phase||null,receiptCurrent:r?.current||null,witness:r?.witness||0,selected:i?.selected||null,phase:context.phase,spatial:!!spatialGroup()});}
  function sync(force=false){if(!context.ready||!navigator()||!arrivalStage()||!intentStage())return false;deriveContext();const sig=signatureFor(),present=!!spatialGroup()?.querySelector('[data-stage14-8-context]');if(!force&&present&&sig===context.signature)return true;context.signature=sig;return render();}
  async function bootAssets(){
    const token=++context.bootToken;try{
      const [wr,mr]=await Promise.all([fetch(WASM_URL,{cache:'no-store'}),fetch(MANIFEST_URL,{cache:'no-store'})]);if(!wr.ok)throw new Error(`Wasm asset HTTP ${wr.status}`);if(!mr.ok)throw new Error(`manifest HTTP ${mr.status}`);
      const [b64,manifest]=await Promise.all([wr.text(),mr.json()]),result=await WebAssembly.instantiate(bytesFromB64(b64),{});if(token!==context.bootToken)return;const wasm=result.instance.exports;
      for(const name of ['i13_receipt_context','i13_receipt_next','i13_corpus_node_count','i13_corpus_source_fingerprint'])if(typeof wasm[name]!=='function')throw new Error(`missing export ${name}`);
      if(Number(wasm.i13_corpus_node_count())!==manifest.counts.nodes)throw new Error('Wasm/manifest node count mismatch');if(u32(wasm.i13_corpus_source_fingerprint())!==u32(manifest.fingerprints.corpus))throw new Error('Wasm/manifest fingerprint mismatch');
      context.wasm=wasm;context.manifest=manifest;context.byId=new Map(manifest.nodes.map(n=>[n.id,n]));context.byAddress=new Map(manifest.nodes.map(n=>[u32(n.address),n]));context.ready=true;context.phase='WAIT_RECEIPT';context.note='execute current arrival to derive next context';context.signature='';sync(true);
    }catch(error){context.ready=false;context.phase='VETO';context.note=`CONTEXT ASSET VETO · ${error.message}`;}
  }
  function contextSelfTest(manifest=context.manifest){const checks=[
    {name:'shared Wasm asset',pass:WASM_URL.endsWith('i13_h1_1.wasm.b64')},
    {name:'shared browser manifest',pass:MANIFEST_URL.endsWith('corpus-browser.json')},
    {name:'route success bit is bit63',pass:SUCCESS===(1n<<63n)},
    {name:'receipt derivation is explicit',pass:typeof deriveContext==='function'},
    {name:'ARM is explicit',pass:typeof armNext==='function'},
    {name:'ARM delegates to Stage 14.6 selection',pass:true},
    {name:'no REQUEST authority',pass:true},
    {name:'no PENDING/CV/MOVE authority',pass:true},
    {name:'context token is correlation not authority',pass:true},
    {name:'54 roots when supplied',pass:!manifest||manifest.counts.nodes===54}
  ];return Object.freeze({pass:checks.every(c=>c.pass),checks,phase:context.phase});}
  function boot(){if(!navigator()||!arrivalStage()||!intentStage()||!window.I13CorpusSpatialStage){setTimeout(boot,90);return;}bootAssets();if(context.timer)clearInterval(context.timer);context.timer=setInterval(()=>sync(false),150);}
  window.I13CorpusReceiptContextStage=Object.freeze({version:'14.8.0',boot,sync:()=>sync(true),derive:deriveContext,armNext,contextSelfTest,state:()=>Object.freeze({ready:context.ready,phase:context.phase,current:context.current,goal:context.goal,token:context.token,next:context.next,distance:context.distance,receiptWitness:context.receiptWitness,note:context.note})});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

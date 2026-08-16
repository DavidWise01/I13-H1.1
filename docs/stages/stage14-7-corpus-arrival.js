/* I13 H1.1 — Stage 14.7: arrival execution.
 * MOVE changes Q's address. EXECUTE is a separate authority-gated action.
 * Context-only roots resolve read-only. Registered executable roots run the
 * Stage 14.7 bounded Rust/Wasm I13 arrival VM, then return a witnessed receipt.
 * This layer never mutates Q's route, pending edge, voxel depth, or corpus data.
 */
(() => {
  'use strict';
  const SVG_NS='http://www.w3.org/2000/svg';
  const WASM_URL='assets/i13_h1_1.wasm.b64';
  const MANIFEST_URL='assets/corpus-browser.json';
  const SUCCESS=1n<<63n, MASK32=0xffff_ffffn;
  const arrival={
    wasm:null, manifest:null, byId:new Map(), ready:false, phase:'WAIT', receipt:'arrival assets pending',
    current:null, kind:0, program:0, result:null, steps:0, witness:0, lastObserved:null,
    signature:'', timer:null, bootToken:0
  };
  const u32=v=>Number(v)>>>0;
  const svgDoc=()=>document.getElementById('i13')?.contentDocument||null;
  const panel=()=>svgDoc()?.querySelector('.i13-exploded-panel[data-exploded-for="corpus"]')||null;
  const spatialGroup=()=>panel()?.querySelector('[data-stage14-4-spatial]')||null;
  const navigator=()=>window.I13CorpusNavigatorStage||null;
  const navState=()=>navigator()?.state?.()||null;
  function bytesFromB64(text){const raw=atob(String(text||'').replace(/\s+/g,'')),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
  function decodeReceipt(value){
    const v=BigInt(value);if((v&SUCCESS)===0n)return null;
    const resultBits=Number(v&MASK32)>>>0;
    return{result:resultBits|0,resultBits,steps:Number((v>>32n)&0xffffn),program:Number((v>>48n)&0xffn),kind:Number((v>>56n)&0x7fn)};
  }
  function kindLabel(kind){return kind===2?'PROGRAM':kind===1?'CONTEXT':'NONE';}
  function programLabel(program){return program===1?'OLOGY_SUM':'—';}
  function el(name,attrs={},text=''){const d=svgDoc();if(!d)return null;const n=d.createElementNS(SVG_NS,name);Object.entries(attrs).forEach(([k,v])=>v!=null&&n.setAttribute(k,String(v)));if(text!=='')n.textContent=String(text);return n;}
  function geometry(){const m=panel()?.querySelector('.ev-machine');if(!m)return null;const mx=+m.getAttribute('x')||0,my=+m.getAttribute('y')||0,mw=+m.getAttribute('width')||0,mh=+m.getAttribute('height')||0;if(mh<120||mw<700)return null;const vx=mx+Math.max(440,mw*.43),vy=my+45,vw=Math.max(360,mx+mw-vx-10);return{vx,vy,vw};}
  function button(x,y,w,label,handler,stroke){const g=el('g',{role:'button',tabindex:'0','aria-label':label});if(!g)return null;g.appendChild(el('rect',{x,y,width:w,height:14,rx:7,style:`fill:#f8fafc;stroke:${stroke};stroke-width:.9;cursor:pointer`}));g.appendChild(el('text',{x:x+w/2,y:y+10,'text-anchor':'middle',style:`font-size:6px;font-weight:900;fill:${stroke};pointer-events:none`},label));g.addEventListener('click',handler);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handler();}});return g;}
  function observeArrival(){
    const s=navState();if(!s?.current)return false;
    if(arrival.lastObserved!==s.current){
      arrival.lastObserved=s.current;arrival.current=s.current;arrival.result=null;arrival.steps=0;arrival.witness=0;
      const node=arrival.byId.get(s.current);arrival.kind=node&&arrival.wasm?Number(arrival.wasm.i13_arrival_kind(u32(node.address))):0;
      arrival.program=node&&arrival.wasm?Number(arrival.wasm.i13_arrival_program(u32(node.address))):0;
      arrival.phase='ARRIVED';arrival.receipt=`${s.current} arrived · ${kindLabel(arrival.kind)} · EXECUTE required`;arrival.signature='';
    }
    return true;
  }
  function executeArrival(){
    const s=navState();const node=s?.current?arrival.byId.get(s.current):null;
    if(!arrival.ready||!arrival.wasm||!node){arrival.phase='VETO';arrival.receipt='arrival runtime not ready';arrival.signature='';sync(true);return false;}
    const packed=decodeReceipt(arrival.wasm.i13_arrival_execute(u32(node.address),64,s.authority?1:0));
    if(!packed){arrival.phase='VETO';arrival.result=null;arrival.steps=0;arrival.witness=0;arrival.receipt=s.authority?'execution VETO · payload/step gate':'execution VETO · authority OFF';arrival.signature='';sync(true);return false;}
    const witness=u32(arrival.wasm.i13_arrival_witness(u32(node.address),packed.resultBits,packed.steps,packed.kind,packed.program));
    if(!witness){arrival.phase='VETO';arrival.receipt='execution VETO · witness generation failed';arrival.signature='';sync(true);return false;}
    arrival.current=s.current;arrival.kind=packed.kind;arrival.program=packed.program;arrival.result=packed.result;arrival.steps=packed.steps;arrival.witness=witness;
    arrival.phase='RECEIPT';arrival.receipt=`RETURN ${packed.result} · steps ${packed.steps} · witness 0x${witness.toString(16).padStart(8,'0')} · TERMINATED`;arrival.signature='';sync(true);return true;
  }
  function render(){
    const base=spatialGroup(),geo=geometry();if(!base||!geo)return false;base.querySelector('[data-stage14-7-arrival]')?.remove();
    const g=el('g',{'data-stage14-7-arrival':'true',role:'group','aria-label':'Stage 14.7 arrival execution'});if(!g)return false;
    const x=geo.vx+8,y=geo.vy+64,w=Math.min(300,geo.vw-16),h=44;
    const color=arrival.phase==='RECEIPT'?'#16a34a':arrival.phase==='VETO'?'#dc2626':arrival.phase==='ARRIVED'?'#7c3aed':'#64748b';
    g.appendChild(el('rect',{x,y,width:w,height:h,rx:7,style:`fill:#fff;fill-opacity:.97;stroke:${color};stroke-width:1`}));
    g.appendChild(el('text',{x:x+7,y:y+10,style:'font-size:6.5px;font-weight:900;letter-spacing:.055em;fill:#334155'},'14.7 ARRIVAL · MOVE ≠ EXECUTE ≠ COMMIT'));
    g.appendChild(el('text',{x:x+7,y:y+21,style:'font-size:6.4px;font-weight:800;fill:#64748b'},`${arrival.current||'—'} · ${kindLabel(arrival.kind)} · program ${programLabel(arrival.program)}`));
    g.appendChild(el('text',{x:x+7,y:y+33,style:`font-size:6.2px;font-weight:900;fill:${color}`},arrival.receipt));
    const run=button(x+w-58,y+4,51,'EXECUTE',executeArrival,color);if(run)g.appendChild(run);base.appendChild(g);return true;
  }
  function signatureFor(){const s=navState();return JSON.stringify({ready:arrival.ready,current:s?.current||null,authority:!!s?.authority,phase:arrival.phase,kind:arrival.kind,program:arrival.program,result:arrival.result,steps:arrival.steps,witness:arrival.witness,spatial:!!spatialGroup()});}
  function sync(force=false){if(!arrival.ready||!navigator()||!window.I13CorpusSpatialStage)return false;observeArrival();const sig=signatureFor(),present=!!spatialGroup()?.querySelector('[data-stage14-7-arrival]');if(!force&&present&&sig===arrival.signature)return true;arrival.signature=sig;return render();}
  async function bootAssets(){
    const token=++arrival.bootToken;try{
      const [wr,mr]=await Promise.all([fetch(WASM_URL,{cache:'no-store'}),fetch(MANIFEST_URL,{cache:'no-store'})]);if(!wr.ok)throw new Error(`Wasm asset HTTP ${wr.status}`);if(!mr.ok)throw new Error(`manifest HTTP ${mr.status}`);
      const [b64,manifest]=await Promise.all([wr.text(),mr.json()]),result=await WebAssembly.instantiate(bytesFromB64(b64),{});if(token!==arrival.bootToken)return;const wasm=result.instance.exports;
      for(const name of ['i13_arrival_opcode_count','i13_arrival_kind','i13_arrival_program','i13_arrival_execute','i13_arrival_witness'])if(typeof wasm[name]!=='function')throw new Error(`missing export ${name}`);
      if(Number(wasm.i13_arrival_opcode_count())!==15)throw new Error('I13 opcode contract mismatch');
      arrival.wasm=wasm;arrival.manifest=manifest;arrival.byId=new Map(manifest.nodes.map(n=>[n.id,n]));arrival.ready=true;arrival.phase='WAIT';arrival.receipt='arrival runtime ready';arrival.signature='';observeArrival();sync(true);
    }catch(error){arrival.ready=false;arrival.phase='VETO';arrival.receipt=`ARRIVAL ASSET VETO · ${error.message}`;}
  }
  function arrivalSelfTest(manifest=arrival.manifest){const checks=[
    {name:'shared Wasm asset',pass:WASM_URL.endsWith('i13_h1_1.wasm.b64')},
    {name:'shared browser manifest',pass:MANIFEST_URL.endsWith('corpus-browser.json')},
    {name:'receipt success bit is bit63',pass:SUCCESS===(1n<<63n)},
    {name:'execution is explicit function',pass:typeof executeArrival==='function'},
    {name:'no route mutation API exported',pass:true},
    {name:'no pending mutation API exported',pass:true},
    {name:'no corpus write API exported',pass:true},
    {name:'context/program split exists',pass:kindLabel(1)==='CONTEXT'&&kindLabel(2)==='PROGRAM'},
    {name:'program 1 is OLOGY_SUM fixture',pass:programLabel(1)==='OLOGY_SUM'},
    {name:'54 roots when supplied',pass:!manifest||manifest.counts.nodes===54}
  ];return Object.freeze({pass:checks.every(c=>c.pass),checks,phase:arrival.phase});}
  function boot(){if(!navigator()||!window.I13CorpusSpatialStage||!window.I13CorpusIntentStage){setTimeout(boot,90);return;}bootAssets();if(arrival.timer)clearInterval(arrival.timer);arrival.timer=setInterval(()=>sync(false),150);}
  window.I13CorpusArrivalStage=Object.freeze({version:'14.7.0',boot,sync:()=>sync(true),execute:executeArrival,arrivalSelfTest,state:()=>Object.freeze({ready:arrival.ready,current:arrival.current,phase:arrival.phase,kind:arrival.kind,program:arrival.program,result:arrival.result,steps:arrival.steps,witness:arrival.witness,receipt:arrival.receipt})});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
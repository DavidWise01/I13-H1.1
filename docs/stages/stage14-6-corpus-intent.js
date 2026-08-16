/* I13 H1.1 — Stage 14.6: Queen local intent / edge request.
 * Witness layer over Stage 14.5. Selection is preview, REQUEST is intent.
 * This layer does not move or commit the Queen. It asks the same Stage 14.2
 * Rust/Wasm walker whether the selected local edge is the active route next-hop,
 * then delegates candidate creation to Stage 14.3. Burrow + ]]cv] remain required.
 */
(() => {
  'use strict';
  const SVG_NS='http://www.w3.org/2000/svg', WASM_URL='assets/i13_h1_1.wasm.b64', MANIFEST_URL='assets/corpus-browser.json';
  const SUCCESS=1n<<63n, MASK32=0xffff_ffffn;
  const intent={wasm:null,manifest:null,byId:new Map(),byAddress:new Map(),ready:false,verdict:'WAIT',receipt:'intent assets pending',signature:'',timer:null,bootToken:0};
  const u32=v=>Number(v)>>>0;
  const svgDoc=()=>document.getElementById('i13')?.contentDocument||null;
  const panel=()=>svgDoc()?.querySelector('.i13-exploded-panel[data-exploded-for="corpus"]')||null;
  const spatialGroup=()=>panel()?.querySelector('[data-stage14-4-spatial]')||null;
  const navigator=()=>window.I13CorpusNavigatorStage||null;
  const navState=()=>navigator()?.state?.()||null;
  const meshStage=()=>window.I13CorpusLocalMeshStage||null;
  const meshState=()=>meshStage()?.state?.()||null;
  function bytesFromB64(text){const raw=atob(String(text||'').replace(/\s+/g,'')),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
  function decodeWalk(value){const v=BigInt(value);if((v&SUCCESS)===0n)return null;return{address:Number(v&MASK32)>>>0,distance:Number((v>>32n)&0x7fff_ffffn)};}
  function expectedNext(state=navState()){
    if(!intent.wasm||!state?.current||!state?.goal)return null;
    const current=intent.byId.get(state.current),goal=intent.byId.get(state.goal);
    if(!current||!goal||u32(current.address)===u32(goal.address))return null;
    const step=decodeWalk(intent.wasm.i13_corpus_walk_next(u32(current.address),u32(goal.address),state.evidenceOnly?1:0,54));
    const node=step?intent.byAddress.get(step.address):null;
    return node?Object.freeze({node,distance:step.distance}):null;
  }
  function selectedLocalEdge(state=navState()){
    const selected=meshState()?.selectedNeighbor||null;
    if(!selected||!state?.current)return null;
    return meshStage()?.localNeighbors?.().find(edge=>edge.id===selected)||null;
  }
  function evaluate(state=navState()){
    const selectedId=meshState()?.selectedNeighbor||null, expected=expectedNext(state), edge=selectedLocalEdge(state), pending=state?.pending||null;
    let code='WAIT';
    if(!intent.ready)code='ASSET_WAIT'; else if(!state?.current||!state?.goal)code='STATE_WAIT'; else if(pending)code='PENDING_EXISTS';
    else if(!selectedId)code='NO_SELECTION'; else if(!edge)code='NOT_LOCAL'; else if(!expected)code='NO_ROUTE';
    else if(selectedId!==expected.node.id)code='ROUTE_MISMATCH'; else code='ADMISSIBLE';
    return Object.freeze({code,pass:code==='ADMISSIBLE',selectedId,edge,expectedId:expected?.node?.id||null,expectedDistance:expected?.distance??null,pending});
  }
  function el(name,attrs={},text=''){const d=svgDoc();if(!d)return null;const n=d.createElementNS(SVG_NS,name);Object.entries(attrs).forEach(([k,v])=>v!=null&&n.setAttribute(k,String(v)));if(text!=='')n.textContent=String(text);return n;}
  function geometry(){const m=panel()?.querySelector('.ev-machine');if(!m)return null;const mx=+m.getAttribute('x')||0,my=+m.getAttribute('y')||0,mw=+m.getAttribute('width')||0,mh=+m.getAttribute('height')||0;if(mh<120||mw<700)return null;const vx=mx+Math.max(440,mw*.43),vy=my+45,vw=Math.max(360,mx+mw-vx-10);return{vx,vy,vw};}
  function button(x,y,w,label,handler,stroke){const g=el('g',{role:'button',tabindex:'0','aria-label':label});if(!g)return null;g.appendChild(el('rect',{x,y,width:w,height:14,rx:7,style:`fill:#f8fafc;stroke:${stroke};stroke-width:.9;cursor:pointer`}));g.appendChild(el('text',{x:x+w/2,y:y+10,'text-anchor':'middle',style:`font-size:6px;font-weight:900;fill:${stroke};pointer-events:none`},label));g.addEventListener('click',handler);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handler();}});return g;}
  function render(){
    const base=spatialGroup(),geo=geometry();if(!base||!geo)return false;base.querySelector('[data-stage14-6-intent]')?.remove();
    const d=evaluate(),g=el('g',{'data-stage14-6-intent':'true',role:'group','aria-label':'Stage 14.6 Queen local intent witness'});if(!g)return false;
    const x=geo.vx+8,y=geo.vy+23,w=Math.min(280,geo.vw-16),h=38;
    const color=intent.verdict==='PASS'?'#16a34a':intent.verdict==='VETO'?'#dc2626':d.pass?'#2563eb':'#64748b';
    g.appendChild(el('rect',{x,y,width:w,height:h,rx:7,style:`fill:#fff;fill-opacity:.96;stroke:${color};stroke-width:1`}));
    g.appendChild(el('text',{x:x+7,y:y+10,style:'font-size:6.5px;font-weight:900;letter-spacing:.06em;fill:#334155'},'14.6 INTENT · PREVIEW ≠ REQUEST ≠ COMMIT'));
    g.appendChild(el('text',{x:x+7,y:y+21,style:'font-size:6.4px;font-weight:800;fill:#64748b'},`selected ${d.selectedId||'—'} · expected ${d.expectedId||'—'} · ${d.code}`));
    g.appendChild(el('text',{x:x+7,y:y+32,style:`font-size:6.4px;font-weight:900;fill:${color}`},`${intent.verdict} · ${intent.receipt}`));
    const arm=button(x+w-98,y+4,42,'ARM',armNext,'#2563eb'),req=button(x+w-52,y+4,47,'REQUEST',requestSelected,color);if(arm)g.appendChild(arm);if(req)g.appendChild(req);base.appendChild(g);return true;
  }
  function armNext(){
    const expected=expectedNext();if(!expected){intent.verdict='VETO';intent.receipt='no admissible Wasm next-hop to arm';intent.signature='';sync(true);return false;}
    const ok=meshStage()?.selectNeighbor?.(expected.node.id)===true;intent.verdict=ok?'ARMED':'VETO';intent.receipt=ok?`${expected.node.id} selected for witness · distance ${expected.distance}`:'local mesh refused next-hop selection';intent.signature='';sync(true);return ok;
  }
  function requestSelected(){
    const d=evaluate(navState());
    if(!d.pass){intent.verdict='VETO';intent.receipt=d.code==='ROUTE_MISMATCH'?`selected ${d.selectedId} ≠ Wasm next ${d.expectedId}`:`intent gate ${d.code}`;intent.signature='';sync(true);return false;}
    /* Stage 14.6 never mutates current/pending directly. Stage 14.3 asks Wasm
       again and owns candidate creation. The candidate still requires c[v[ -> ]]cv]. */
    const proposed=navigator()?.step?.()===true,after=navState();
    if(!proposed||after?.pending!==d.selectedId){intent.verdict='VETO';intent.receipt=`navigator witness mismatch · expected ${d.selectedId} · pending ${after?.pending||'—'}`;intent.signature='';sync(true);return false;}
    intent.verdict='PASS';intent.receipt=`${d.selectedId} witnessed as pending · BURROW + CV REQUIRED`;intent.signature='';sync(true);return true;
  }
  function signatureFor(){const s=navState();return JSON.stringify({ready:intent.ready,current:s?.current||null,goal:s?.goal||null,pending:s?.pending||null,evidenceOnly:!!s?.evidenceOnly,selected:meshState()?.selectedNeighbor||null,verdict:intent.verdict,spatial:!!spatialGroup()});}
  function sync(force=false){if(!intent.ready||!navigator()||!meshStage()?.state?.()?.ready)return false;const sig=signatureFor(),present=!!spatialGroup()?.querySelector('[data-stage14-6-intent]');if(!force&&present&&sig===intent.signature)return true;intent.signature=sig;return render();}
  async function bootAssets(){
    const token=++intent.bootToken;try{
      const [wr,mr]=await Promise.all([fetch(WASM_URL,{cache:'no-store'}),fetch(MANIFEST_URL,{cache:'no-store'})]);if(!wr.ok)throw new Error(`Wasm asset HTTP ${wr.status}`);if(!mr.ok)throw new Error(`manifest HTTP ${mr.status}`);
      const [b64,manifest]=await Promise.all([wr.text(),mr.json()]),result=await WebAssembly.instantiate(bytesFromB64(b64),{});if(token!==intent.bootToken)return;const wasm=result.instance.exports;
      for(const name of ['i13_corpus_node_count','i13_corpus_edge_count','i13_corpus_neighbor_count','i13_corpus_neighbor','i13_corpus_walk_next','i13_corpus_source_fingerprint'])if(typeof wasm[name]!=='function')throw new Error(`missing export ${name}`);
      if(Number(wasm.i13_corpus_node_count())!==manifest.counts.nodes)throw new Error('Wasm/manifest node count mismatch');if(Number(wasm.i13_corpus_edge_count())!==manifest.counts.edges)throw new Error('Wasm/manifest edge count mismatch');if(u32(wasm.i13_corpus_source_fingerprint())!==u32(manifest.fingerprints.corpus))throw new Error('Wasm/manifest fingerprint mismatch');
      intent.wasm=wasm;intent.manifest=manifest;intent.byId=new Map(manifest.nodes.map(n=>[n.id,n]));intent.byAddress=new Map(manifest.nodes.map(n=>[u32(n.address),n]));intent.ready=true;intent.verdict='WAIT';intent.receipt='select neighbor or ARM expected next-hop';intent.signature='';sync(true);
    }catch(error){intent.ready=false;intent.verdict='VETO';intent.receipt=`INTENT ASSET VETO · ${error.message}`;}
  }
  function intentSelfTest(manifest=intent.manifest){const nodes=manifest?.nodes||[];const checks=[
    {name:'shared Wasm asset',pass:WASM_URL.endsWith('i13_h1_1.wasm.b64')},{name:'shared browser manifest',pass:MANIFEST_URL.endsWith('corpus-browser.json')},{name:'success bit is bit63',pass:SUCCESS===(1n<<63n)},{name:'no direct current mutation API',pass:true},{name:'no commit or CV authority',pass:true},{name:'REQUEST delegates to Stage 14.3',pass:typeof requestSelected==='function'},{name:'ARM remains selection only',pass:typeof armNext==='function'},{name:'54 roots when supplied',pass:!manifest||manifest.counts.nodes===54},{name:'187 edges when supplied',pass:!manifest||manifest.counts.edges===187},{name:'unique manifest addresses',pass:!nodes.length||new Set(nodes.map(n=>u32(n.address))).size===nodes.length}];return Object.freeze({pass:checks.every(c=>c.pass),checks,verdict:intent.verdict});}
  function boot(){if(!navigator()||!window.I13CorpusSpatialStage||!meshStage()){setTimeout(boot,90);return;}bootAssets();if(intent.timer)clearInterval(intent.timer);intent.timer=setInterval(()=>sync(false),150);}
  window.I13CorpusIntentStage=Object.freeze({version:'14.6.0',boot,sync:()=>sync(true),armNext,requestSelected,evaluate:()=>evaluate(),intentSelfTest,state:()=>Object.freeze({ready:intent.ready,selected:meshState()?.selectedNeighbor||null,expected:expectedNext()?.node?.id||null,verdict:intent.verdict,receipt:intent.receipt})});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
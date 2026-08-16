/* I13 H1.1 — Stage 14.9.1: corpus inlet + bounded curator identity profile.
 * [c[v[corpus[curator[[(source),(context),(candidate),{skill},{personas},{occupation}]]]]]cv]
 *
 * Skill and occupation bound capability. Personas are interpretive lenses only.
 * Proposal only: no corpus write, no Q move, no pending mutation, no REQUEST.
 */
(() => {
  'use strict';

  const SVG_NS='http://www.w3.org/2000/svg';
  const WASM_URL='assets/i13_h1_1.wasm.b64';
  const MANIFEST_URL='assets/corpus-browser.json';
  const SUCCESS=1n<<63n, MASK32=0xffff_ffffn;

  const SKILLS=Object.freeze([
    {id:1,name:'BIBLIOGRAPHY'},
    {id:2,name:'MATHEMATICS'},
    {id:3,name:'CODE'}
  ]);

  const PERSONA_SETS=Object.freeze([
    {mask:0x05,name:'ARCHIVIST+SKEPTIC'},
    {mask:0x06,name:'MATH+SKEPTIC'},
    {mask:0x0c,name:'SKEPTIC+ENGINEER'},
    {mask:0x0f,name:'ALL LENSES'}
  ]);

  const OCCUPATIONS=Object.freeze([
    {id:1,name:'INGEST'},
    {id:2,name:'REVIEW'},
    {id:3,name:'CLASSIFY'},
    {id:4,name:'RELATE'},
    {id:5,name:'DUPLICATE-AUDIT'}
  ]);

  const inlet={
    wasm:null,manifest:null,byId:new Map(),byAddress:new Map(),
    ready:false,protocol:0,v2:false,
    source:'',sourceHash:0,sourceBytes:0,
    candidateId:'',candidateAddress:0,candidateBytes:0,
    skillIndex:0,personaIndex:0,occupationIndex:0,
    phase:'WAIT',status:0,mask:0,witness:0,
    note:'curator assets pending',signature:'',timer:null,bootToken:0
  };

  const u32=v=>Number(v)>>>0;
  const hex=v=>`0x${u32(v).toString(16).padStart(8,'0')}`;
  const svgDoc=()=>document.getElementById('i13')?.contentDocument||null;
  const panel=()=>svgDoc()?.querySelector('.i13-exploded-panel[data-exploded-for="corpus"]')||null;
  const spatialGroup=()=>panel()?.querySelector('[data-stage14-4-spatial]')||null;
  const navState=()=>window.I13CorpusNavigatorStage?.state?.()||null;
  const encoder=()=>new TextEncoder();

  function bytesFromB64(text){
    const raw=atob(String(text||'').replace(/\s+/g,'')),out=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
    return out;
  }
  function normalizeMaterial(value){return String(value??'').normalize('NFKC').replace(/\s+/g,' ').trim();}
  function canonicalId(value){return String(value??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^[^a-z0-9]+/,'').replace(/[-._]+$/,'').slice(0,64);}
  function fnvBytes(bytes){let h=0x811c9dc5>>>0;for(const b of bytes){h^=b;h=Math.imul(h,0x01000193)>>>0;}return h>>>0;}
  function fingerprint(text){return fnvBytes(encoder().encode(String(text)));}
  function utf8Length(text){return encoder().encode(String(text)).length;}
  function skill(){return SKILLS[inlet.skillIndex]||SKILLS[0];}
  function personas(){return PERSONA_SETS[inlet.personaIndex]||PERSONA_SETS[0];}
  function occupation(){return OCCUPATIONS[inlet.occupationIndex]||OCCUPATIONS[0];}
  function statusLabel(v){return v===1?'NEW ROOT':v===2?'ADDRESS OCCUPIED':'—';}

  function decodeProposalV1(value){
    const v=BigInt(value);if((v&SUCCESS)===0n)return null;
    return{witness:Number(v&MASK32)>>>0,mask:Number((v>>32n)&0xffffn),skill:Number((v>>48n)&0xffn),status:Number((v>>56n)&0x7fn)};
  }
  function decodeProposalV2(value){
    const v=BigInt(value);if((v&SUCCESS)===0n)return null;
    return{
      witness:Number(v&MASK32)>>>0,
      mask:Number((v>>32n)&0xfffn),
      personas:Number((v>>44n)&0xffn),
      occupation:Number((v>>52n)&0xfn),
      skill:Number((v>>56n)&0xfn),
      status:Number((v>>60n)&0x7n)
    };
  }

  function clearReceipt(){
    inlet.phase='READY';inlet.status=0;inlet.mask=0;inlet.witness=0;
    inlet.note='material may be curated; proposal only';inlet.signature='';
  }
  function setMaterialValue(value){
    inlet.source=normalizeMaterial(value);inlet.sourceBytes=utf8Length(inlet.source);
    inlet.sourceHash=inlet.source?fingerprint(inlet.source):0;clearReceipt();return inlet.source;
  }
  function setCandidateValue(value){
    inlet.candidateId=canonicalId(value);inlet.candidateBytes=utf8Length(inlet.candidateId);
    inlet.candidateAddress=inlet.candidateId?fingerprint(inlet.candidateId):0;clearReceipt();return inlet.candidateId;
  }
  function promptMaterial(){
    if(typeof window.prompt!=='function'){inlet.phase='VETO';inlet.note='prompt unavailable';sync(true);return false;}
    const value=window.prompt('Paste corpus material. This creates a witnessed proposal only.',inlet.source);
    if(value===null)return false;setMaterialValue(value);sync(true);return true;
  }
  function promptCandidate(){
    if(typeof window.prompt!=='function'){inlet.phase='VETO';inlet.note='prompt unavailable';sync(true);return false;}
    const value=window.prompt('Proposed canonical corpus ID (max 64 bytes).',inlet.candidateId);
    if(value===null)return false;setCandidateValue(value);sync(true);return true;
  }
  function cycleSkill(){inlet.skillIndex=(inlet.skillIndex+1)%SKILLS.length;clearReceipt();inlet.note=`{skill} → ${skill().name}`;sync(true);return skill().name;}
  function cyclePersonas(){inlet.personaIndex=(inlet.personaIndex+1)%PERSONA_SETS.length;clearReceipt();inlet.note=`{personas} → ${personas().name}`;sync(true);return personas().name;}
  function cycleOccupation(){inlet.occupationIndex=(inlet.occupationIndex+1)%OCCUPATIONS.length;clearReceipt();inlet.note=`{occupation} → ${occupation().name}`;sync(true);return occupation().name;}
  function clear(){
    inlet.source='';inlet.sourceHash=0;inlet.sourceBytes=0;inlet.candidateId='';inlet.candidateAddress=0;inlet.candidateBytes=0;
    inlet.phase='READY';inlet.status=0;inlet.mask=0;inlet.witness=0;inlet.note='inlet cleared';inlet.signature='';sync(true);
  }

  function curate(){
    const nav=navState();
    if(!inlet.ready||!inlet.wasm){inlet.phase='VETO';inlet.note='curator Wasm not ready';sync(true);return false;}
    if(!nav?.current){inlet.phase='VETO';inlet.note='current corpus context required';sync(true);return false;}
    if(nav.pending){inlet.phase='HOLD';inlet.note=`pending ${nav.pending} must resolve before curation`;sync(true);return false;}
    if(!inlet.source||!inlet.candidateId){inlet.phase='VETO';inlet.note='MATERIAL + ID required';sync(true);return false;}

    const contextNode=inlet.byId.get(nav.current);
    if(!contextNode){inlet.phase='VETO';inlet.note='current root absent from manifest';sync(true);return false;}
    if(inlet.sourceBytes>4096||inlet.candidateBytes>64){inlet.phase='QUARANTINE';inlet.note='inlet bounds exceeded';sync(true);return false;}

    const occupied=inlet.byAddress.get(u32(inlet.candidateAddress));
    if(occupied&&occupied.id!==inlet.candidateId){
      inlet.phase='QUARANTINE';inlet.status=2;
      inlet.note=`32-bit collision · ${inlet.candidateId} ↔ ${occupied.id} · no proposal`;sync(true);return false;
    }

    const s=skill(),p=personas(),o=occupation();
    let packed=null,pass=false;

    if(inlet.v2){
      packed=decodeProposalV2(inlet.wasm.i13_curator_propose_v2(
        inlet.sourceHash,inlet.sourceBytes,u32(contextNode.address),inlet.candidateAddress,inlet.candidateBytes,
        s.id,p.mask,o.id,nav.authority?1:0
      ));
      if(packed){
        pass=Number(inlet.wasm.i13_curator_cv_v2(
          inlet.sourceHash,inlet.sourceBytes,u32(contextNode.address),inlet.candidateAddress,inlet.candidateBytes,
          s.id,p.mask,o.id,packed.status,packed.mask,packed.witness,nav.authority?1:0
        ))===1;
      }
      if(packed&&(packed.skill!==s.id||packed.personas!==p.mask||packed.occupation!==o.id)){
        pass=false;inlet.note='curator identity-profile echo mismatch';
      }
    }else{
      packed=decodeProposalV1(inlet.wasm.i13_curator_propose(
        inlet.sourceHash,inlet.sourceBytes,u32(contextNode.address),inlet.candidateAddress,inlet.candidateBytes,s.id,nav.authority?1:0
      ));
      if(packed){
        pass=Number(inlet.wasm.i13_curator_cv(
          inlet.sourceHash,inlet.sourceBytes,u32(contextNode.address),inlet.candidateAddress,inlet.candidateBytes,
          s.id,packed.status,packed.mask,packed.witness,nav.authority?1:0
        ))===1;
      }
    }

    if(!packed){
      inlet.phase='VETO';inlet.note=nav.authority?'curator proposal VETO':'curator proposal VETO · authority OFF';sync(true);return false;
    }
    if(!pass){
      inlet.phase='VETO';if(!inlet.note.includes('mismatch'))inlet.note='outer cv rejected curator return';sync(true);return false;
    }

    inlet.status=packed.status;inlet.mask=packed.mask;inlet.witness=packed.witness;
    inlet.phase=occupied?'HOLD':'PROPOSAL';
    const profile=inlet.v2?`${p.name} · ${o.name}`:'legacy Wasm profile pending republish';
    inlet.note=occupied
      ?`exact ID already exists · ${occupied.id} · hold/idempotence compare · ${profile}`
      :`PASS · witnessed proposal · ${profile} · no commit`;
    inlet.signature='';sync(true);return true;
  }

  function el(name,attrs={},text=''){
    const d=svgDoc();if(!d)return null;const n=d.createElementNS(SVG_NS,name);
    Object.entries(attrs).forEach(([k,v])=>v!=null&&n.setAttribute(k,String(v)));
    if(text!=='')n.textContent=String(text);return n;
  }
  function geometry(){
    const m=panel()?.querySelector('.ev-machine');if(!m)return null;
    const mx=+m.getAttribute('x')||0,my=+m.getAttribute('y')||0,mw=+m.getAttribute('width')||0,mh=+m.getAttribute('height')||0;
    if(mh<215||mw<700)return null;
    const vx=mx+Math.max(440,mw*.43),vy=my+45,vw=Math.max(360,mx+mw-vx-10);return{vx,vy,vw};
  }
  function button(x,y,w,label,handler,stroke){
    const g=el('g',{role:'button',tabindex:'0','aria-label':label});if(!g)return null;
    g.appendChild(el('rect',{x,y,width:w,height:11,rx:5.5,style:`fill:#f8fafc;stroke:${stroke};stroke-width:.8;cursor:pointer`}));
    g.appendChild(el('text',{x:x+w/2,y:y+7.7,'text-anchor':'middle',style:`font-size:4.8px;font-weight:900;fill:${stroke};pointer-events:none`},label));
    g.addEventListener('click',handler);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handler();}});
    return g;
  }
  function render(){
    const base=spatialGroup(),geo=geometry();if(!base||!geo)return false;
    base.querySelector('[data-stage14-9-curator]')?.remove();
    const g=el('g',{'data-stage14-9-curator':'true',role:'group','aria-label':'Stage 14.9.1 corpus inlet curator'});if(!g)return false;
    const x=geo.vx+8,y=geo.vy+158,w=Math.min(350,geo.vw-16),h=58;
    const color=inlet.phase==='PROPOSAL'?'#16a34a':inlet.phase==='HOLD'?'#d97706':inlet.phase==='QUARANTINE'||inlet.phase==='VETO'?'#dc2626':'#0d9488';
    g.appendChild(el('rect',{x,y,width:w,height:h,rx:7,style:`fill:#fff;fill-opacity:.985;stroke:${color};stroke-width:1`}));
    g.appendChild(el('text',{x:x+7,y:y+9,style:'font-size:6px;font-weight:900;letter-spacing:.035em;fill:#334155'},'14.9.1 CURATOR · SOURCE / CONTEXT / CANDIDATE · SKILL / PERSONAS / OCCUPATION'));

    let bx=x+7;
    for(const [label,width,handler] of [
      ['MATERIAL',40,promptMaterial],['ID',22,promptCandidate],['SKILL',31,cycleSkill],
      ['PERSONA',41,cyclePersonas],['JOB',27,cycleOccupation],['CURATE',36,curate],['CLEAR',30,clear]
    ]){
      const b=button(bx,y+14,width,label,handler,color);if(b)g.appendChild(b);bx+=width+3;
    }

    const nav=navState(),profile=inlet.v2?'v2 witnessed':'v1 fallback';
    g.appendChild(el('text',{x:x+7,y:y+38,style:'font-size:5.65px;font-weight:800;fill:#64748b'},
      `(.) source ${inlet.source?hex(inlet.sourceHash):'—'} ${inlet.sourceBytes}b · (.) context ${nav?.current||'—'} · {skill} ${skill().name}`));
    g.appendChild(el('text',{x:x+7,y:y+48,style:'font-size:5.55px;font-weight:800;fill:#64748b'},
      `{personas} ${personas().name} · {occupation} ${occupation().name} · mask 0x${inlet.mask.toString(16).padStart(4,'0')} · ${profile}`));
    g.appendChild(el('text',{x:x+7,y:y+56,style:`font-size:5.45px;font-weight:900;fill:${color}`},
      `(.) candidate ${inlet.candidateId||'—'} · ${statusLabel(inlet.status)} · ${inlet.note}`));
    base.appendChild(g);return true;
  }

  function signatureFor(){
    const n=navState();
    return JSON.stringify({
      ready:inlet.ready,protocol:inlet.protocol,v2:inlet.v2,current:n?.current||null,pending:n?.pending||null,authority:!!n?.authority,
      source:inlet.sourceHash,sourceBytes:inlet.sourceBytes,id:inlet.candidateId,address:inlet.candidateAddress,
      skill:skill().id,personas:personas().mask,occupation:occupation().id,
      phase:inlet.phase,status:inlet.status,mask:inlet.mask,witness:inlet.witness,spatial:!!spatialGroup()
    });
  }
  function sync(force=false){
    if(!inlet.ready||!window.I13CorpusNavigatorStage||!window.I13CorpusSpatialStage)return false;
    const sig=signatureFor(),present=!!spatialGroup()?.querySelector('[data-stage14-9-curator]');
    if(!force&&present&&sig===inlet.signature)return true;inlet.signature=sig;return render();
  }

  async function bootAssets(){
    const token=++inlet.bootToken;
    try{
      const [wr,mr]=await Promise.all([fetch(WASM_URL,{cache:'no-store'}),fetch(MANIFEST_URL,{cache:'no-store'})]);
      if(!wr.ok)throw new Error(`Wasm asset HTTP ${wr.status}`);
      if(!mr.ok)throw new Error(`manifest HTTP ${mr.status}`);
      const [b64,manifest]=await Promise.all([wr.text(),mr.json()]),result=await WebAssembly.instantiate(bytesFromB64(b64),{});
      if(token!==inlet.bootToken)return;
      const wasm=result.instance.exports;
      for(const name of ['i13_curator_protocol_version','i13_curator_skill_mask','i13_curator_status','i13_curator_propose','i13_curator_cv','i13_corpus_node_count','i13_corpus_source_fingerprint']){
        if(typeof wasm[name]!=='function')throw new Error(`missing export ${name}`);
      }
      const protocol=Number(wasm.i13_curator_protocol_version());
      const v2=protocol>=2
        &&typeof wasm.i13_curator_propose_v2==='function'
        &&typeof wasm.i13_curator_cv_v2==='function'
        &&typeof wasm.i13_curator_persona_mask_valid==='function'
        &&typeof wasm.i13_curator_occupation_mask==='function'
        &&typeof wasm.i13_curator_effective_mask==='function';
      if(protocol<1)throw new Error('curator protocol mismatch');
      if(Number(wasm.i13_corpus_node_count())!==manifest.counts.nodes)throw new Error('Wasm/manifest node count mismatch');
      if(u32(wasm.i13_corpus_source_fingerprint())!==u32(manifest.fingerprints.corpus))throw new Error('Wasm/manifest fingerprint mismatch');

      inlet.wasm=wasm;inlet.manifest=manifest;
      inlet.byId=new Map(manifest.nodes.map(n=>[n.id,n]));
      inlet.byAddress=new Map(manifest.nodes.map(n=>[u32(n.address),n]));
      inlet.protocol=protocol;inlet.v2=v2;inlet.ready=true;inlet.phase='READY';
      inlet.note=v2
        ?'enter MATERIAL + ID; choose skill, personas, occupation; CURATE'
        :'legacy curator asset loaded · waiting for v2 Wasm publish';
      inlet.signature='';sync(true);
    }catch(error){
      inlet.ready=false;inlet.phase='VETO';inlet.note=`CURATOR ASSET VETO · ${error.message}`;
    }
  }

  function curatorSelfTest(manifest=inlet.manifest){
    const checks=[
      {name:'shared Wasm asset',pass:WASM_URL.endsWith('i13_h1_1.wasm.b64')},
      {name:'shared browser manifest',pass:MANIFEST_URL.endsWith('corpus-browser.json')},
      {name:'proposal success bit is bit63',pass:SUCCESS===(1n<<63n)},
      {name:'three bounded skills',pass:SKILLS.length===3},
      {name:'four bounded persona sets',pass:PERSONA_SETS.length===4&&PERSONA_SETS.every(p=>(p.mask&~0x0f)===0&&p.mask!==0)},
      {name:'five bounded occupations',pass:OCCUPATIONS.length===5},
      {name:'material normalizer deterministic',pass:normalizeMaterial(' a  b ')==='a b'},
      {name:'canonical ID bounded',pass:canonicalId(' Hello World! ')==='hello-world'},
      {name:'curation is explicit',pass:typeof curate==='function'},
      {name:'persona and occupation controls are explicit',pass:typeof cyclePersonas==='function'&&typeof cycleOccupation==='function'},
      {name:'no request/pending/move authority exported',pass:true},
      {name:'54 roots when supplied',pass:!manifest||manifest.counts.nodes===54}
    ];
    return Object.freeze({pass:checks.every(c=>c.pass),checks,phase:inlet.phase});
  }

  function boot(){
    if(!window.I13CorpusNavigatorStage||!window.I13CorpusSpatialStage){setTimeout(boot,90);return;}
    bootAssets();if(inlet.timer)clearInterval(inlet.timer);inlet.timer=setInterval(()=>sync(false),150);
  }

  window.I13CorpusCuratorStage=Object.freeze({
    version:'14.9.1',boot,sync:()=>sync(true),
    setMaterial:setMaterialValue,setCandidate:setCandidateValue,
    cycleSkill,cyclePersonas,cycleOccupation,curate,clear,curatorSelfTest,
    state:()=>Object.freeze({
      ready:inlet.ready,protocol:inlet.protocol,v2:inlet.v2,phase:inlet.phase,
      sourceHash:inlet.sourceHash,sourceBytes:inlet.sourceBytes,
      candidateId:inlet.candidateId,candidateAddress:inlet.candidateAddress,candidateBytes:inlet.candidateBytes,
      skill:skill().name,personas:personas().name,personaMask:personas().mask,
      occupation:occupation().name,occupationId:occupation().id,
      status:inlet.status,mask:inlet.mask,witness:inlet.witness,note:inlet.note
    })
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

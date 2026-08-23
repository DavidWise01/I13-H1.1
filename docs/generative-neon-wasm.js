/* I13 generative neon presentation layer for WASM-facing workbench surfaces.
 * Visual authority only: no VM, WASM, corpus, navigation, or mutation calls.
 */
(() => {
  'use strict';
  if (window.I13Neon) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.id = 'i13-neon-field';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {position:'fixed',inset:'54px 0 0',width:'100%',height:'calc(100% - 54px)',pointerEvents:'none',zIndex:'2500',opacity:reduced?'.16':'.42',mixBlendMode:'screen'});
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const palettes = {
    WASM1:['#53f7ff','#7d8dff'], WASM2:['#b889ff','#50f7cf'],
    GFX:['#ff67c8','#65f7ff'], CORTEX:['#ff8275','#b98aff'],
    CORPUS:['#63ffd1','#ffe18c'], MAIN:['#65f4ff','#b58aff']
  };
  let points=[],last=performance.now(),frames=0;
  function suite(){try{return window.I13MainSuite?.state?.().suite||'MAIN'}catch(_){return'MAIN'}}
  function resize(){const d=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);const count=Math.max(28,Math.min(110,Math.round(r.width*r.height/18000)));points=Array.from({length:count},()=>({x:Math.random()*r.width,y:Math.random()*r.height,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,p:Math.random()*6.283}))}
  function decorateRuntime(){try{const frame=document.getElementById('i13-suite-runtime'),doc=frame?.contentDocument,obj=doc?.getElementById('i13'),svg=obj?.contentDocument;if(!svg||svg.getElementById('i13-generative-neon-style'))return;const s=svg.createElementNS('http://www.w3.org/2000/svg','style');s.id='i13-generative-neon-style';s.textContent='.i13-exploded-panel[data-exploded-for="wasm1"],.i13-exploded-panel[data-exploded-for="wasm2"]{filter:drop-shadow(0 0 7px #54eaff) drop-shadow(0 0 14px #9b73ff)} .i13-exploded-panel[data-exploded-for="gfx"]{filter:drop-shadow(0 0 8px #ff66ca)}';svg.documentElement.appendChild(s)}catch(_){}}
  function draw(now){const w=canvas.clientWidth,h=canvas.clientHeight,[a,b]=palettes[suite()]||palettes.MAIN;ctx.clearRect(0,0,w,h);for(const p of points){if(!reduced){p.x=(p.x+p.vx+w)%w;p.y=(p.y+p.vy+h)%h;p.p+=.012}const pulse=.55+.45*Math.sin(p.p+now*.001);ctx.fillStyle=a;ctx.globalAlpha=.18*pulse;ctx.beginPath();ctx.arc(p.x,p.y,1.2+.9*pulse,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){const p=points[i],q=points[j],dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy);if(d<105){ctx.strokeStyle=i%2?a:b;ctx.globalAlpha=(1-d/105)*.08;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}}ctx.globalAlpha=1;frames++;if(now-last>1500){decorateRuntime();last=now;frames=0}requestAnimationFrame(draw)}
  addEventListener('resize',resize);resize();requestAnimationFrame(draw);
  window.I13Neon=Object.freeze({version:'1.0.0',selfTest:()=>Object.freeze({pass:!!ctx&&canvas.isConnected&&points.length>=28,reducedMotion:reduced,points:points.length,visualOnly:true})});
})();

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';
import { palindromeWasm } from './palindrome-wasm.js';

const $=s=>document.querySelector(s),host=$('#view'),scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x02040a,.035);
const camera=new THREE.PerspectiveCamera(48,host.clientWidth/host.clientHeight,.1,100);camera.position.set(0,7.5,15);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;scene.add(new THREE.HemisphereLight(0xa8efff,0x12071b,2.4));
const light=new THREE.PointLight(0xffd16b,55,30);light.position.set(0,6,5);scene.add(light);
const grid=new THREE.GridHelper(20,20,0x29425d,0x152235);grid.position.y=-3;scene.add(grid);
const nodes=[],linePoints=[];for(let i=0;i<11;i++){const up=i<=5,step=up?i:10-i,x=(i-5)*1.05,y=step*.62-1.8,z=Math.sin(i*.8)*1.15,node=new THREE.Mesh(new THREE.IcosahedronGeometry(.28,1),new THREE.MeshStandardMaterial({color:up?0x61edff:0xff6b9a,emissive:up?0x174b59:0x541529,roughness:.3}));node.position.set(x,y,z);scene.add(node);nodes.push(node);linePoints.push(node.position)}
scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints),new THREE.LineBasicMaterial({color:0xffd16b})));
const qec=new THREE.Group();qec.position.set(0,-.5,-5.2);for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++){const q=new THREE.Mesh(new THREE.SphereGeometry(.2,16,10),new THREE.MeshStandardMaterial({color:0x74eeff,emissive:0x123d54}));q.position.set(x*.8,y*.8,0);qec.add(q)}for(let x=-1;x<1;x++)for(let y=-1;y<1;y++){const a=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.22),new THREE.MeshStandardMaterial({color:(x+y)&1?0xff6b9a:0xffd16b}));a.position.set((x+.5)*.8,(y+.5)*.8,.12);qec.add(a)}scene.add(qec);
let wasm;palindromeWasm().then(g=>{wasm=g;$('#wasm').textContent='PASS · '+g.bytes.length+' B';$('#wasm').className='pass'});
const origin=0x49313337|0;function keyFor(i){let x=(0x9e3779b9^(i+1)*0x45d9f3b)|0;x^=x>>>16;x=Math.imul(x,0x45d9f3b);return x^(x>>>16)}
$('#rounds').oninput=()=>$('#rv').value=$('#rounds').value;
$('#n').oninput=()=>{$('#nv').value=$('#n').value;const n=+$('#n').value,logExponent=91*Math.log10(362880),mantissa=Math.log10(n*n);$('#capacity').textContent='log10(exp) ≈ '+logExponent.toFixed(3)+'; ×'+mantissa.toFixed(3)};
$('#run').onclick=()=>{if(!wasm)return;const rounds=+$('#rounds').value,keys=Array.from({length:rounds},(_,i)=>keyFor(i));let state=origin;$('#phase').textContent='FORWARD';for(const k of keys)state=wasm.step(state,k);const apex=state;$('#state').textContent='0x'+(apex>>>0).toString(16).padStart(8,'0');setTimeout(()=>{for(let i=keys.length-1;i>=0;i--)state=wasm.step(state,keys[i]);const pass=state===origin;$('#phase').textContent=pass?'RETURNED TO 0':'FAULT';$('#identity').textContent=pass?'PASS · I':'FAIL';$('#identity').className=pass?'pass':'fail';$('#done').textContent=rounds+' ↑ + '+rounds+' ↓';$('#state').textContent='0x'+(state>>>0).toString(16).padStart(8,'0')},350)};
const clock=new THREE.Clock();function animate(){const t=clock.getElapsedTime();nodes.forEach((n,i)=>{n.rotation.x=t*.4+i;n.rotation.y=t*.3});qec.children.forEach((n,i)=>n.position.z=.15*Math.sin(t*2+i));qec.rotation.z=.08*Math.sin(t*.4);controls.update();renderer.render(scene,camera);requestAnimationFrame(animate)}animate();
window.addEventListener('resize',()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)});

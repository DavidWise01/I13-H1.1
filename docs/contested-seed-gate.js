import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';
import { instantiateGate } from './contested-seed-wasm.js';

const $=s=>document.querySelector(s),host=$('#viewport'),scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x02040a,.038);
const camera=new THREE.PerspectiveCamera(46,host.clientWidth/host.clientHeight,.1,100);camera.position.set(0,8.5,13);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,0,0);
scene.add(new THREE.HemisphereLight(0x9defff,0x100718,2.2));
const key=new THREE.PointLight(0xffd36b,55,30);key.position.set(0,6,3);scene.add(key);
const grid=new THREE.GridHelper(18,18,0x274764,0x142334);grid.position.y=-2.2;scene.add(grid);
const boundary=new THREE.Mesh(new THREE.TorusGeometry(4.2,.075,16,160),new THREE.MeshBasicMaterial({color:0xb6f7ff,transparent:true,opacity:.58}));boundary.rotation.x=Math.PI/2;scene.add(boundary);
const shell=new THREE.Mesh(new THREE.SphereGeometry(4.18,48,24),new THREE.MeshPhysicalMaterial({color:0x6eeaff,transparent:true,opacity:.055,roughness:.12,transmission:.7,side:THREE.DoubleSide}));scene.add(shell);
const spectrumLabels=['0','1','2','3','4','5','6','7','8','9','10','11','M','S','T','H'];
const spectrum=new THREE.Group();
spectrumLabels.forEach((label,index)=>{const angle=index/16*Math.PI*2,node=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(index/16,.9,.62)}));node.position.set(Math.cos(angle)*5.35,Math.sin(angle)*5.35,0);node.userData.label=label;spectrum.add(node)});
scene.add(spectrum);
const leftMat=new THREE.MeshStandardMaterial({color:0x65ecff,emissive:0x123e52,roughness:.32,metalness:.5}),rightMat=new THREE.MeshStandardMaterial({color:0xff648f,emissive:0x511326,roughness:.34,metalness:.35}),agents=[];
for(let side=0;side<2;side++)for(let i=0;i<5;i++){const geometry=side===0?new THREE.BoxGeometry(.72,.72,.72):new THREE.TetrahedronGeometry(.62),mesh=new THREE.Mesh(geometry,side===0?leftMat:rightMat),angle=(i-2)*.43;mesh.position.set((side===0?-1:1)*(2.3+Math.cos(angle)*1.6),Math.sin(angle)*2.8,i%2?.7:-.7);mesh.userData={side,origin:mesh.position.clone(),phase:i*.7};scene.add(mesh);agents.push(mesh)}
const core=new THREE.Mesh(new THREE.OctahedronGeometry(.82),new THREE.MeshPhysicalMaterial({color:0xffd36b,emissive:0x6a4300,emissiveIntensity:1.4,roughness:.1,metalness:.15,transmission:.45}));scene.add(core);scene.add(new THREE.PointLight(0xffd36b,30,8));
let wasm,preferred=0;const log=m=>{$('#log').textContent+='\n'+m;$('#log').scrollTop=$('#log').scrollHeight},setPreferred=v=>{preferred=v;$('#hash').classList.toggle('active',v===0);$('#at').classList.toggle('active',v===1)};
$('#hash').onclick=()=>setPreferred(0);$('#at').onclick=()=>setPreferred(1);
function sync(){const left=+$('#left').value,right=+$('#right').value;$('#lv').value=left;$('#rv').value=right;$('#contest').textContent=left+' | '+right;agents.forEach((agent,index)=>agent.visible=index<5?index<left:index-5<right)}
$('#left').oninput=sync;$('#right').oninput=sync;
$('#resolve').onclick=()=>{if(!wasm)return;const left=+$('#left').value,right=+$('#right').value,resolution=wasm.resolve(left,right,preferred);if(resolution===2){$('#winner').textContent='BLOCKED';$('#exclusive').textContent='NO COOPERATION';$('#exclusive').className='fail';core.material.color.set(0x4b5360);log('WASM · one side absent → communication blocked');return}const seed=resolution===0?'#':'@';$('#winner').textContent=seed;$('#exclusive').textContent='OPEN · ONE';$('#exclusive').className='pass';core.material.color.set(resolution===0?0x65ecff:0xff648f);log('WASM · cooperation open → '+seed)};
$('#reset').onclick=()=>{$('#left').value=5;$('#right').value=5;setPreferred(0);$('#winner').textContent='—';$('#exclusive').textContent='—';core.material.color.set(0xffd36b);sync();log('RESET · 5 | 5')};
instantiateGate().then(gate=>{wasm=gate;$('#runtime').textContent='WASM · '+gate.binary.length+' B';$('#runtime').className='pass';const checks=[[5,5,0,0],[5,5,1,1],[5,4,1,0],[4,5,0,1],[0,5,0,2],[5,0,1,2]],passed=checks.every(([l,r,p,w])=>wasm.resolve(l,r,p)===w);log('SELF-TEST · '+(passed?'6/6 PASS':'FAIL'));if(!passed)$('#runtime').className='fail'});
const clock=new THREE.Clock();function animate(){const t=clock.getElapsedTime();agents.forEach(agent=>{agent.rotation.x+=.006;agent.rotation.y+=.009;if(agent.userData.side===1)agent.position.z=agent.userData.origin.z+Math.sin(t*1.6+agent.userData.phase)*.5});core.rotation.x=t*.35;core.rotation.y=t*.55;boundary.rotation.z=t*.035;spectrum.rotation.z=-t*.018;controls.update();renderer.render(scene,camera);requestAnimationFrame(animate)}
window.addEventListener('resize',()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)});sync();animate();

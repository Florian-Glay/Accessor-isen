import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import modelUrl from './assets/sans.glb?url';

const container = document.querySelector('#viewer');
const loaderLabel = document.querySelector('#loader');
const fallback = document.querySelector('#fallback');
const hint = document.querySelector('#dragHint');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
camera.position.set(0, 0, 10);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.17;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xeaf8ff, 0x344149, 2.35));
const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(5, 7, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0x76f7df, 2.6); rim.position.set(-5, 1, -4); scene.add(rim);
const group = new THREE.Group(); scene.add(group);
let model, yaw = -.42, targetYaw = yaw, lastTime = performance.now(), dragging = false, pointerX = 0, hasInteracted = false;
const idleDelay = 5000;

new GLTFLoader().load(modelUrl, gltf => {
  model = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(model); const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3()); const scale = 4.15 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(scale); model.position.sub(center.multiplyScalar(scale));
  group.add(model); loaderLabel.remove();
}, undefined, () => { loaderLabel.remove(); fallback.hidden = false; });

function resize() { const {width,height} = container.getBoundingClientRect(); camera.aspect=width/height; camera.updateProjectionMatrix(); renderer.setSize(width,height,false); }
addEventListener('resize', resize); resize();
function markAction() { hasInteracted = true; lastTime=performance.now(); if (hint) hint.style.opacity='0'; }
container.addEventListener('pointerdown', e => { dragging=true; pointerX=e.clientX; container.setPointerCapture(e.pointerId); markAction(); });
container.addEventListener('pointermove', e => { if(!dragging) return; targetYaw += (e.clientX-pointerX)*.012; pointerX=e.clientX; markAction(); });
container.addEventListener('pointerup', () => dragging=false);
container.addEventListener('pointercancel', () => dragging=false);

function animate(now) {
  requestAnimationFrame(animate);
  const shouldAutoRotate = !hasInteracted || now-lastTime > idleDelay;
  if (shouldAutoRotate && !dragging) { targetYaw += .0045; if (hint) hint.style.opacity='1'; }
  yaw += (targetYaw-yaw) * .11;
  group.rotation.y = yaw;
  group.rotation.z = Math.PI;
  group.rotation.x = -.08 + Math.sin(now*.00045)*.018;
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

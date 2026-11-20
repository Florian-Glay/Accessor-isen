import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import modelUrl from './assets/Sans.glb?url';
import { createController } from './controller-animation.js';

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
let model, controller, animationTime = 0, previousFrame = performance.now(), yaw = -.25, targetYaw = yaw, lastTime = performance.now(), dragging = false, pointerX = 0, hasInteracted = false;
const idleDelay = 5000;

new GLTFLoader().load(modelUrl, gltf => {
  controller = createController(gltf.scene);
  model = controller.root;
  group.add(model); loaderLabel.remove();
}, undefined, () => { loaderLabel.remove(); fallback.hidden = false; });

function resize() {
  const {width,height} = container.getBoundingClientRect();
  if (!width || !height) return;
  camera.aspect = width / height;
  // Reserve enough room for the exploded assembly, even when rotated sideways.
  const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect);
  const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov);
  const isPhone = width <= 700;
  // Change 0.88 to zoom more (< 0.88) or less (> 0.88) on phones.
  const phoneZoom = isPhone ? 0.64 : 0.45;
  camera.position.z = Math.max(isPhone ? 8.8 : 10, (3.4 / Math.sin(limitingHalfFov)) * phoneZoom);
  camera.updateProjectionMatrix();
  renderer.setSize(width,height,false);
}
new ResizeObserver(resize).observe(container);
addEventListener('resize', resize); resize();
function markAction() { hasInteracted = true; lastTime=performance.now(); if (hint) hint.style.opacity='0'; }
container.addEventListener('pointerdown', e => { dragging=true; pointerX=e.clientX; container.setPointerCapture(e.pointerId); markAction(); });
container.addEventListener('pointermove', e => { if(!dragging) return; targetYaw += (e.clientX-pointerX)*.012; pointerX=e.clientX; markAction(); });
container.addEventListener('pointerup', () => dragging=false);
container.addEventListener('pointercancel', () => dragging=false);

function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min((now-previousFrame)/1000,.05);
  previousFrame = now;
  const shouldAutoRotate = !hasInteracted || now-lastTime > idleDelay;
  animationTime += delta;
  if (shouldAutoRotate && !dragging && hint) hint.style.opacity='1';
  controller?.update(animationTime);
  yaw += (targetYaw-yaw) * .11;
  group.rotation.y = yaw;
  group.rotation.z = 0;
  group.rotation.x = 0;
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

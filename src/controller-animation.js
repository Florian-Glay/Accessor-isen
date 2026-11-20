import * as THREE from 'three';

// Reassemble the supplied CAD parts into the orange/ivory video reference.
export function createController(source) {
  const root = new THREE.Group();
  const parts = [];
  const materials = {
    shell: new THREE.MeshStandardMaterial({ color: '#f47732', roughness: .38 }),
    core: new THREE.MeshStandardMaterial({ color: '#eeeae2', roughness: .48 }),
    controls: new THREE.MeshStandardMaterial({ color: '#343940', roughness: .58 }),
  };
  function add(geometry, material, offset, motion, name) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.copy(offset);
    root.add(mesh);
    parts.push({mesh, home: offset.clone(), motion});
    return mesh;
  }
  source.updateMatrixWorld(true);
  const handles = source.getObjectByName('PoigneesS');
  const core = source.getObjectByName('PontCentral');
  const coreGeometry = core.geometry.clone().applyMatrix4(core.matrixWorld);
  coreGeometry.computeBoundingBox();
  const center = coreGeometry.boundingBox.getCenter(new THREE.Vector3());
  const transform = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
  // CAD face lies in XY, with its outward normal facing -Z.
  transform.premultiply(new THREE.Matrix4().makeRotationX(Math.PI));
  transform.premultiply(new THREE.Matrix4().makeScale(.019, .019, .019));
  coreGeometry.applyMatrix4(transform);
  add(coreGeometry, materials.core, new THREE.Vector3(), new THREE.Vector3(), 'core');
  const geometry = handles.geometry.clone().applyMatrix4(handles.matrixWorld);
  const triangles = geometry.index ? geometry.toNonIndexed() : geometry;
  const positions = triangles.getAttribute('position');
  for (const side of [-1, 1]) {
    const vertices = [];
    for (let i = 0; i < positions.count; i += 3) {
      const x = (positions.getX(i) + positions.getX(i+1) + positions.getX(i+2))/3;
      if ((x < center.x ? -1 : 1) !== side) continue;
      for (let j=0;j<3;j++) vertices.push(positions.getX(i+j),positions.getY(i+j),positions.getZ(i+j));
    }
    const half = new THREE.BufferGeometry();
    half.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
    half.applyMatrix4(transform); half.computeVertexNormals();
    add(half, materials.shell, new THREE.Vector3(), new THREE.Vector3(side*.85,0,0), side<0?'left-shell':'right-shell');
  }
  for (const [name, x, side] of [['Joytstick',-1.26,-1],['XYAB',1.26,1]]) {
    const part = source.getObjectByName(name);
    const g = part.geometry.clone();
    g.computeBoundingBox();
    const c = g.boundingBox.getCenter(new THREE.Vector3());
    g.translate(-c.x,-c.y,-c.z);
    g.rotateX(Math.PI); g.scale(.019,.019,.019);
    add(g, materials.controls, new THREE.Vector3(x,-0.22,.16), new THREE.Vector3(side*.85,.12,.85), name);
  }
  root.rotation.x = -.48;
  root.rotation.z = -.12;
  const smooth = x => { x=THREE.MathUtils.clamp(x,0,1); return x*x*(3-2*x); };
  return {root, update(time) {
    const t = time % 14;
    const explode = smooth((t-2)/1.5)*(1-smooth((t-6)/1.5));
    const joystick = smooth((t-9)/1)*(1-smooth((t-12)/1));
    for (const {mesh,home,motion} of parts) {
      mesh.position.copy(home).addScaledVector(motion,explode);
      if(mesh.name==='Joytstick') mesh.position.addScaledVector(new THREE.Vector3(-.3,.1,1),joystick);
    }
  }};
}

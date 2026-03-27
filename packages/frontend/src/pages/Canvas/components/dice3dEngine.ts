import * as CANNON from "cannon-es";
import * as THREE from "three";

// ── Types ───────────────────────────────────────────────────
interface DieResult {
  type: string;
  value: number;
}

interface DieInstance {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  die: BuiltDie;
  type: string;
}

interface BuiltDie {
  mesh: THREE.Mesh;
  faceNormals?: THREE.Vector3[];
  values?: number[];
  d4Vertices?: THREE.Vector3[];
  d4Values?: number[];
  physShape: CANNON.Shape;
}

interface Engine {
  rollDice: (tray: string[], onSettle: (results: DieResult[]) => void) => void;
  dispose: () => void;
}

// ── Color Palette ───────────────────────────────────────────
const DIE_COLORS: Record<string, { bg: string; text: string }> = {
  d4: { bg: "#fcd4dc", text: "#9b1b30" },
  d6: { bg: "#d4e4fc", text: "#1a4d8f" },
  d8: { bg: "#d4f5d4", text: "#1a6b1a" },
  d10: { bg: "#fcefd4", text: "#b37400" },
  d12: { bg: "#e4d4f5", text: "#5b1a99" },
  d20: { bg: "#fcdcc8", text: "#b34700" },
};

// ── Texture Helpers ─────────────────────────────────────────
function createNumberTexture(
  num: number,
  color: { bg: string; text: string },
  textCanvasY?: number | null,
): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color.bg;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = color.text;
  ctx.lineWidth = 24;
  ctx.strokeRect(12, 12, size - 24, size - 24);
  const fontSize = num >= 10 ? 200 : 260;
  ctx.font = `900 ${fontSize}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color.text;
  ctx.fillText(String(num), size / 2, textCanvasY ?? size / 2);
  return new THREE.CanvasTexture(c);
}

function createPentagonTexture(
  num: number,
  color: { bg: string; text: string },
): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color.bg;
  ctx.fillRect(0, 0, size, size);
  const cr = 0.45;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const px = (0.5 + cr * Math.cos(a)) * size;
    const py = (1 - (0.5 + cr * Math.sin(a))) * size;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = color.text;
  ctx.lineWidth = 10;
  ctx.stroke();
  const fontSize = num >= 10 ? 140 : 180;
  ctx.font = `900 ${fontSize}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color.text;
  ctx.fillText(String(num), size / 2, size / 2);
  return new THREE.CanvasTexture(c);
}

function createD4FaceTexture(
  labels: number[],
  color: { bg: string; text: string },
): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color.bg;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = color.text;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(13, 240);
  ctx.lineTo(243, 240);
  ctx.lineTo(128, 18);
  ctx.closePath();
  ctx.stroke();
  const positions = [
    [95, 175],
    [162, 175],
    [128, 105],
  ];
  ctx.font = "900 72px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color.text;
  for (let i = 0; i < 3; i++) {
    ctx.fillText(String(labels[i]), positions[i][0], positions[i][1]);
  }
  return new THREE.CanvasTexture(c);
}

// ── Geometry Helpers ────────────────────────────────────────
function computeOutwardNormals(
  posAttr: THREE.BufferAttribute,
  numFaces: number,
  vertsPerFace: number,
): THREE.Vector3[] {
  const normals: THREE.Vector3[] = [];
  for (let f = 0; f < numFaces; f++) {
    const i = f * vertsPerFace;
    const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, i);
    const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
    const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2);
    const normal = new THREE.Vector3()
      .crossVectors(new THREE.Vector3().subVectors(v1, v0), new THREE.Vector3().subVectors(v2, v0))
      .normalize();
    const center = v0.clone().add(v1).add(v2).divideScalar(3);
    if (normal.dot(center) < 0) normal.negate();
    normals.push(normal);
  }
  return normals;
}

const TRI_UVS = [0.05, 0.05, 0.95, 0.05, 0.5, 0.92];

function pentagonUVs(): number[] {
  const cx = 0.5,
    cy = 0.5,
    r = 0.45;
  const p: number[] = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    p.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  return [
    p[0],
    p[1],
    p[2],
    p[3],
    p[4],
    p[5],
    p[0],
    p[1],
    p[4],
    p[5],
    p[6],
    p[7],
    p[0],
    p[1],
    p[6],
    p[7],
    p[8],
    p[9],
  ];
}

function assignFaceUVs(uvArr: Float32Array, startVert: number, trisPerFace: number) {
  const base = startVert * 2;
  const src = trisPerFace === 1 ? TRI_UVS : pentagonUVs();
  for (let i = 0; i < src.length; i++) uvArr[base + i] = src[i];
}

function geomToConvex(threeGeom: THREE.BufferGeometry): CANNON.ConvexPolyhedron {
  const pos = threeGeom.getAttribute("position") as THREE.BufferAttribute;
  const uniqueVerts: CANNON.Vec3[] = [];
  const keyToIdx = new Map<string, number>();
  const faces: number[][] = [];

  for (let i = 0; i < pos.count; i += 3) {
    const face: number[] = [];
    for (let j = 0; j < 3; j++) {
      const x = pos.getX(i + j),
        y = pos.getY(i + j),
        z = pos.getZ(i + j);
      const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
      if (!keyToIdx.has(key)) {
        keyToIdx.set(key, uniqueVerts.length);
        uniqueVerts.push(new CANNON.Vec3(x, y, z));
      }
      face.push(keyToIdx.get(key)!);
    }
    faces.push(face);
  }
  return new CANNON.ConvexPolyhedron({ vertices: uniqueVerts, faces });
}

// ── D10 Custom Geometry ─────────────────────────────────────
function createD10Geometry(radius: number): THREE.BufferGeometry {
  const cos36 = Math.cos((36 * Math.PI) / 180);
  const H = radius * 0.9,
    h = (H * (1 - cos36)) / (1 + cos36),
    r = radius * 1.05;
  const top = [0, H, 0],
    bot = [0, -H, 0];
  const upper: number[][] = [],
    lower: number[][] = [];
  for (let i = 0; i < 5; i++) {
    const a1 = (i * 72 * Math.PI) / 180;
    const a2 = ((i * 72 + 36) * Math.PI) / 180;
    upper.push([r * Math.cos(a1), h, r * Math.sin(a1)]);
    lower.push([r * Math.cos(a2), -h, r * Math.sin(a2)]);
  }
  const v: number[] = [];
  for (let i = 0; i < 5; i++) {
    const ni = (i + 1) % 5;
    v.push(...top, ...lower[i], ...upper[i]);
    v.push(...top, ...upper[ni], ...lower[i]);
  }
  for (let i = 0; i < 5; i++) {
    const ni = (i + 1) % 5;
    v.push(...bot, ...upper[ni], ...lower[ni]);
    v.push(...bot, ...lower[i], ...upper[ni]);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  return geom;
}

function createD10ConvexShape(radius: number): CANNON.ConvexPolyhedron {
  const cos36 = Math.cos((36 * Math.PI) / 180);
  const H = radius * 0.9,
    h = (H * (1 - cos36)) / (1 + cos36),
    r = radius * 1.05;
  const verts: CANNON.Vec3[] = [new CANNON.Vec3(0, H, 0), new CANNON.Vec3(0, -H, 0)];
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 * Math.PI) / 180;
    verts.push(new CANNON.Vec3(r * Math.cos(a), h, r * Math.sin(a)));
  }
  for (let i = 0; i < 5; i++) {
    const a = ((i * 72 + 36) * Math.PI) / 180;
    verts.push(new CANNON.Vec3(r * Math.cos(a), -h, r * Math.sin(a)));
  }
  const faces: number[][] = [];
  for (let i = 0; i < 5; i++) {
    const ni = (i + 1) % 5;
    faces.push([0, 7 + i, 2 + i]);
    faces.push([0, 2 + ni, 7 + i]);
    faces.push([1, 7 + i, 2 + ni]);
    faces.push([1, 2 + ni, 7 + ni]);
  }
  return new CANNON.ConvexPolyhedron({ vertices: verts, faces });
}

// ── Die Builders ────────────────────────────────────────────
function buildD4(color: { bg: string; text: string }): BuiltDie {
  const g = new THREE.TetrahedronGeometry(1.4, 0);
  const geom = g.toNonIndexed();
  geom.clearGroups();
  const pos = geom.getAttribute("position") as THREE.BufferAttribute;

  const uniquePos: THREE.Vector3[] = [];
  const keyToIdx = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    if (!keyToIdx.has(key)) {
      keyToIdx.set(key, uniquePos.length);
      uniquePos.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
    }
  }
  const vertexValues = [1, 2, 3, 4];

  const uvs = new Float32Array(pos.count * 2);
  const materials: THREE.MeshStandardMaterial[] = [];
  for (let f = 0; f < 4; f++) {
    const base = f * 3;
    const labels: number[] = [];
    for (let j = 0; j < 3; j++) {
      const vi = base + j;
      const key = `${pos.getX(vi).toFixed(4)},${pos.getY(vi).toFixed(4)},${pos.getZ(vi).toFixed(4)}`;
      labels.push(vertexValues[keyToIdx.get(key)!]);
    }
    uvs[base * 2] = 0.05;
    uvs[base * 2 + 1] = 0.05;
    uvs[(base + 1) * 2] = 0.95;
    uvs[(base + 1) * 2 + 1] = 0.05;
    uvs[(base + 2) * 2] = 0.5;
    uvs[(base + 2) * 2 + 1] = 0.92;
    geom.addGroup(base, 3, f);
    materials.push(
      new THREE.MeshStandardMaterial({
        map: createD4FaceTexture(labels, color),
        side: THREE.DoubleSide,
      }),
    );
  }
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  const mesh = new THREE.Mesh(geom, materials);
  mesh.castShadow = true;

  return { mesh, d4Vertices: uniquePos, d4Values: vertexValues, physShape: geomToConvex(g) };
}

function buildPolyDie(
  baseGeom: THREE.BufferGeometry,
  sides: number,
  trisPerFace: number,
  color: { bg: string; text: string },
): BuiltDie & { physShape: CANNON.Shape } {
  const geom = baseGeom.index ? baseGeom.toNonIndexed() : baseGeom;
  geom.clearGroups();
  const pos = geom.getAttribute("position") as THREE.BufferAttribute;
  const vpf = trisPerFace * 3;
  const uvs = new Float32Array(pos.count * 2);
  for (let f = 0; f < sides; f++) {
    const start = f * vpf;
    assignFaceUVs(uvs, start, trisPerFace);
    geom.addGroup(start, vpf, f);
  }
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  const values = Array.from({ length: sides }, (_, i) => i + 1);
  const mats = values.map(
    (v) =>
      new THREE.MeshStandardMaterial({
        map: createNumberTexture(v, color, 338),
        side: THREE.DoubleSide,
      }),
  );
  const mesh = new THREE.Mesh(geom, mats);
  mesh.castShadow = true;
  const faceNormals = computeOutwardNormals(pos, sides, vpf);
  return { mesh, faceNormals, values, physShape: geomToConvex(baseGeom) };
}

function buildD6(color: { bg: string; text: string }): BuiltDie {
  const geom = new THREE.BoxGeometry(1.6, 1.6, 1.6);
  const values = [2, 5, 1, 6, 3, 4];
  const mats = values.map(
    (v) => new THREE.MeshStandardMaterial({ map: createNumberTexture(v, color, null) }),
  );
  const mesh = new THREE.Mesh(geom, mats);
  mesh.castShadow = true;
  const faceNormals = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];
  return { mesh, faceNormals, values, physShape: new CANNON.Box(new CANNON.Vec3(0.8, 0.8, 0.8)) };
}

function buildD10(color: { bg: string; text: string }): BuiltDie {
  const radius = 1.1;
  const geomRaw = createD10Geometry(radius);
  const geom = geomRaw.index ? geomRaw.toNonIndexed() : geomRaw;
  geom.clearGroups();
  const pos = geom.getAttribute("position") as THREE.BufferAttribute;
  const vpf = 6;
  const sides = 10;
  const uvs = new Float32Array(pos.count * 2);

  for (let f = 0; f < sides; f++) {
    const start = f * vpf;
    const verts: THREE.Vector3[] = [];
    for (let i = 0; i < vpf; i++) {
      verts.push(new THREE.Vector3(pos.getX(start + i), pos.getY(start + i), pos.getZ(start + i)));
    }
    const center = new THREE.Vector3();
    for (const v of verts) center.add(v);
    center.divideScalar(vpf);

    const e1 = new THREE.Vector3().subVectors(verts[1], verts[0]);
    const e2 = new THREE.Vector3().subVectors(verts[2], verts[0]);
    const normal = new THREE.Vector3().crossVectors(e1, e2).normalize();
    if (normal.dot(center) < 0) normal.negate();

    const worldUp = new THREE.Vector3(0, 1, 0);
    const upOnFace = worldUp
      .clone()
      .sub(normal.clone().multiplyScalar(worldUp.dot(normal)))
      .normalize();
    const rightOnFace = new THREE.Vector3().crossVectors(upOnFace, normal).normalize();

    const pts2d = verts.map((v) => {
      const d = new THREE.Vector3().subVectors(v, center);
      return [d.dot(rightOnFace), d.dot(upOnFace)];
    });

    let maxR = 0;
    for (const [x, y] of pts2d) {
      const r = Math.sqrt(x * x + y * y);
      if (r > maxR) maxR = r;
    }

    for (let i = 0; i < vpf; i++) {
      uvs[(start + i) * 2] = 0.5 + (pts2d[i][0] / maxR) * 0.45;
      uvs[(start + i) * 2 + 1] = 0.5 + (pts2d[i][1] / maxR) * 0.45;
    }
    geom.addGroup(start, vpf, f);
  }

  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  const values = Array.from({ length: sides }, (_, i) => i + 1);
  const mats = values.map(
    (v) =>
      new THREE.MeshStandardMaterial({
        map: createNumberTexture(v, color, null),
        side: THREE.DoubleSide,
      }),
  );
  const mesh = new THREE.Mesh(geom, mats);
  mesh.castShadow = true;
  const faceNormals = computeOutwardNormals(pos, sides, vpf);
  return { mesh, faceNormals, values, physShape: createD10ConvexShape(radius) };
}

function buildD12(color: { bg: string; text: string }): BuiltDie {
  const g = new THREE.DodecahedronGeometry(1.2, 0);
  const geom = g.toNonIndexed();
  geom.clearGroups();
  const pos = geom.getAttribute("position") as THREE.BufferAttribute;
  const vpf = 9;
  const sides = 12;
  const uvs = new Float32Array(pos.count * 2);

  const pentUV: number[][] = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    pentUV.push([0.5 + 0.45 * Math.cos(a), 0.5 + 0.45 * Math.sin(a)]);
  }

  for (let f = 0; f < sides; f++) {
    const start = f * vpf;
    const verts: THREE.Vector3[] = [];
    for (let i = 0; i < vpf; i++) {
      verts.push(new THREE.Vector3(pos.getX(start + i), pos.getY(start + i), pos.getZ(start + i)));
    }

    const unique: THREE.Vector3[] = [];
    const vertIdxMap: number[] = [];
    for (let i = 0; i < vpf; i++) {
      let found = -1;
      for (let j = 0; j < unique.length; j++) {
        if (verts[i].distanceTo(unique[j]) < 0.001) {
          found = j;
          break;
        }
      }
      if (found === -1) {
        found = unique.length;
        unique.push(verts[i].clone());
      }
      vertIdxMap.push(found);
    }

    const center = new THREE.Vector3();
    for (const v of unique) center.add(v);
    center.divideScalar(unique.length);

    const e1 = new THREE.Vector3().subVectors(verts[1], verts[0]);
    const e2 = new THREE.Vector3().subVectors(verts[2], verts[0]);
    const normal = new THREE.Vector3().crossVectors(e1, e2).normalize();
    if (normal.dot(center) < 0) normal.negate();

    const tangent = new THREE.Vector3().subVectors(unique[0], center).normalize();
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

    const angles = unique.map((v) => {
      const d = new THREE.Vector3().subVectors(v, center);
      return Math.atan2(d.dot(bitangent), d.dot(tangent));
    });
    const order = unique.map((_, i) => i).sort((a, b) => angles[a] - angles[b]);

    const uniqueToUV: number[][] = new Array(unique.length);
    for (let i = 0; i < order.length; i++) uniqueToUV[order[i]] = pentUV[i];

    for (let i = 0; i < vpf; i++) {
      const uv = uniqueToUV[vertIdxMap[i]];
      uvs[(start + i) * 2] = uv[0];
      uvs[(start + i) * 2 + 1] = uv[1];
    }
    geom.addGroup(start, vpf, f);
  }

  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();

  const values = Array.from({ length: sides }, (_, i) => i + 1);
  const mats = values.map(
    (v) =>
      new THREE.MeshStandardMaterial({
        map: createPentagonTexture(v, color),
        side: THREE.DoubleSide,
      }),
  );
  const mesh = new THREE.Mesh(geom, mats);
  mesh.castShadow = true;
  const faceNormals = computeOutwardNormals(pos, sides, vpf);
  return { mesh, faceNormals, values, physShape: geomToConvex(g) };
}

function createDie(type: string): BuiltDie {
  const dc = DIE_COLORS[type];
  switch (type) {
    case "d4":
      return buildD4(dc);
    case "d6":
      return buildD6(dc);
    case "d8": {
      const g = new THREE.OctahedronGeometry(1.2, 0);
      return { ...buildPolyDie(g, 8, 1, dc), physShape: geomToConvex(g) };
    }
    case "d10":
      return buildD10(dc);
    case "d12":
      return buildD12(dc);
    case "d20": {
      const g = new THREE.IcosahedronGeometry(1.1, 0);
      return { ...buildPolyDie(g, 20, 1, dc), physShape: geomToConvex(g) };
    }
    default:
      return buildD6(dc ?? DIE_COLORS.d6);
  }
}

// ── Read Top Face ───────────────────────────────────────────
function readDieValue(body: CANNON.Body, die: BuiltDie): number {
  const q = new THREE.Quaternion(
    body.quaternion.x,
    body.quaternion.y,
    body.quaternion.z,
    body.quaternion.w,
  );
  if (die.d4Vertices) {
    let bestY = -Infinity,
      bestIdx = 0;
    for (let i = 0; i < die.d4Vertices.length; i++) {
      const v = die.d4Vertices[i].clone().applyQuaternion(q);
      if (v.y > bestY) {
        bestY = v.y;
        bestIdx = i;
      }
    }
    return die.d4Values![bestIdx];
  }
  const up = new THREE.Vector3(0, 1, 0);
  let best = -Infinity,
    idx = 0;
  for (let i = 0; i < die.faceNormals!.length; i++) {
    const d = die.faceNormals![i].clone().applyQuaternion(q).dot(up);
    if (d > best) {
      best = d;
      idx = i;
    }
  }
  return die.values![idx];
}

// ── Engine ──────────────────────────────────────────────────
export function createEngine(canvas: HTMLCanvasElement, width: number, height: number): Engine {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x313244);

  const frustumSize = 16;
  const aspect = width / height;
  const camera = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    100,
  );
  camera.position.set(0, 12, 10);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x45475a }),
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Physics
  const world = new CANNON.World();
  world.gravity.set(0, -30, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  (world.solver as CANNON.GSSolver).iterations = 20;

  const floorPhysMat = new CANNON.Material("floor");
  const dicePhysMat = new CANNON.Material("dice");
  world.addContactMaterial(
    new CANNON.ContactMaterial(floorPhysMat, dicePhysMat, {
      friction: 0.4,
      restitution: 0.35,
    }),
  );
  world.addContactMaterial(
    new CANNON.ContactMaterial(dicePhysMat, dicePhysMat, {
      friction: 0.3,
      restitution: 0.4,
    }),
  );

  const floorBody = new CANNON.Body({ mass: 0, material: floorPhysMat });
  floorBody.addShape(new CANNON.Plane());
  floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(floorBody);

  function addWallBody(sx: number, sy: number, sz: number, x: number, y: number, z: number) {
    const b = new CANNON.Body({ mass: 0, material: floorPhysMat });
    b.addShape(new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2)));
    b.position.set(x, y, z);
    world.addBody(b);
  }
  addWallBody(30, 20, 4, 0, 10, -10.5);
  addWallBody(30, 20, 4, 0, 10, 10.5);
  addWallBody(4, 20, 24, -14, 10, 0);
  addWallBody(4, 20, 24, 14, 10, 0);
  addWallBody(32, 4, 24, 0, 18, 0);

  // State
  let activeDice: DieInstance[] = [];
  let settleInterval: ReturnType<typeof setInterval> | null = null;
  let animFrameId: number | null = null;
  let disposed = false;

  const clock = new THREE.Clock();
  function animate() {
    if (disposed) return;
    animFrameId = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 1 / 30);
    world.step(1 / 60, dt, 3);
    for (const { mesh, body } of activeDice) {
      mesh.position.copy(body.position as unknown as THREE.Vector3);
      mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
    }
    renderer.render(scene, camera);
  }
  animate();

  function clearPhysicsDice() {
    if (settleInterval) {
      clearInterval(settleInterval);
      settleInterval = null;
    }
    for (const { mesh, body } of activeDice) {
      scene.remove(mesh);
      world.removeBody(body);
    }
    activeDice = [];
  }

  function rollDice(tray: string[], onSettle: (results: DieResult[]) => void) {
    clearPhysicsDice();
    if (tray.length === 0) return;

    for (let i = 0; i < tray.length; i++) {
      const type = tray[i];
      const die = createDie(type);
      scene.add(die.mesh);

      const body = new CANNON.Body({
        mass: 1,
        material: dicePhysMat,
        linearDamping: 0.3,
        angularDamping: 0.3,
      });
      body.addShape(die.physShape);
      body.position.set(
        (Math.random() - 0.5) * 2,
        4 + Math.random() * 2 + i * 0.3,
        (Math.random() - 0.5) * 1.5,
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 10;
      body.velocity.set(Math.cos(angle) * speed, -3 - Math.random() * 2, Math.sin(angle) * speed);
      body.angularVelocity.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
      );
      world.addBody(body);
      activeDice.push({ mesh: die.mesh, body, die, type });
    }

    let checks = 0;
    settleInterval = setInterval(() => {
      checks++;
      const settled = activeDice.every(({ body }) => {
        const v = body.velocity,
          av = body.angularVelocity;
        return (
          v.x * v.x + v.y * v.y + v.z * v.z < 0.01 && av.x * av.x + av.y * av.y + av.z * av.z < 0.01
        );
      });
      if (settled || checks > 120) {
        clearInterval(settleInterval!);
        settleInterval = null;
        const results = activeDice.map(({ body, die, type }) => ({
          type,
          value: readDieValue(body, die),
        }));
        onSettle(results);
      }
    }, 50);
  }

  function dispose() {
    disposed = true;
    clearPhysicsDice();
    if (animFrameId != null) cancelAnimationFrame(animFrameId);
    renderer.dispose();
  }

  return { rollDice, dispose };
}

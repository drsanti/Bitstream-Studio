/**
 * CSS3DCardViewer.jsx
 *
 * Renders CSS3D cards in 3D space — each card embeds a live
 * Three.js WebGL scene directly on its surface (NOT a screen overlay).
 *
 * Dependencies:
 *   npm install three
 *
 * Usage (built-in demo):
 *   <CSS3DCardViewer />
 *
 * Usage (custom cards):
 *   <CSS3DCardViewer cards={myCards} />
 *
 * Card shape:
 *   {
 *     title:       string,
 *     subtitle:    string,
 *     accentColor: string,           // hex, e.g. '#42e8ff'
 *     footerLeft:  string,
 *     footerRight: string,
 *     position:    [x, y, z],        // CSS3D world position (units = CSS px)
 *     rotation:    [rx, ry, rz],     // Euler radians
 *     cameraZ:     number,           // inner camera distance (default 4)
 *     fov:         number,           // inner camera FOV (default 55)
 *     setupScene:  (scene, camera, renderer) => (time: number) => void
 *                  // set up your Three.js scene, return an animation callback
 *   }
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { OrbitControls }              from 'three/examples/jsm/controls/OrbitControls.js';

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────── */
const CARD_W      = 540;   // inner canvas width  (CSS px)
const CARD_H      = 300;   // inner canvas height (CSS px)
const STYLE_ID    = 'css3d-card-viewer-styles';

/* ─────────────────────────────────────────────────────────────────
   CARD STYLES  (injected once into <head>)
───────────────────────────────────────────────────────────────── */
const CARD_CSS = `
.cvr-card {
  width: ${CARD_W}px;
  background: rgba(14,19,28,.95);
  border: 1px solid rgba(48,54,61,.85);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(66,232,255,.06), 0 24px 60px rgba(0,0,0,.6);
  position: relative;
}
.cvr-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--cvr-accent, #42e8ff88), transparent);
}
.cvr-header {
  padding: 13px 18px 11px;
  border-bottom: 1px solid rgba(48,54,61,.7);
  display: flex; align-items: center; gap: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}
.cvr-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.cvr-title {
  font-size: 13px; font-weight: 700; letter-spacing: .04em;
  color: #e6edf3;
}
.cvr-sub {
  font-size: 11px; color: #8b949e; margin-top: 2px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}
.cvr-canvas {
  display: block;
  width: ${CARD_W}px !important;
  height: ${CARD_H}px !important;
}
.cvr-footer {
  padding: 9px 18px;
  font-size: 11px; color: #8b949e;
  border-top: 1px solid rgba(48,54,61,.6);
  display: flex; justify-content: space-between;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}
.cvr-live-dot {
  display: inline-block;
  width: 6px; height: 6px; border-radius: 50%;
  background: #5ee89a; margin-right: 5px; vertical-align: middle;
  animation: cvrPulse 1.5s ease-in-out infinite;
}
@keyframes cvrPulse { 0%,100%{opacity:.4;} 50%{opacity:1;} }
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CARD_CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────────────────────────
   buildCardElement  — creates the HTML card div + embedded canvas
───────────────────────────────────────────────────────────────── */
function buildCardElement({ title, subtitle, accentColor, footerLeft, footerRight }) {
  const color = accentColor || '#42e8ff';

  const card = document.createElement('div');
  card.className = 'cvr-card';
  card.style.setProperty('--cvr-accent', color + '88');

  // Header
  const header = document.createElement('div');
  header.className = 'cvr-header';
  header.innerHTML = `
    <div class="cvr-dot" style="background:${color};box-shadow:0 0 8px ${color}88"></div>
    <div>
      <div class="cvr-title">${title}</div>
      ${subtitle ? `<div class="cvr-sub">${subtitle}</div>` : ''}
    </div>`;
  card.appendChild(header);

  // Canvas — this is where the WebGL scene renders ON the card
  const canvas = document.createElement('canvas');
  canvas.className  = 'cvr-canvas';
  canvas.width      = CARD_W;
  canvas.height     = CARD_H;
  card.appendChild(canvas);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'cvr-footer';
  footer.innerHTML = `
    <span><span class="cvr-live-dot"></span>${footerLeft || 'WebGL live'}</span>
    <span>${footerRight || 'Three.js'}</span>`;
  card.appendChild(footer);

  return { card, canvas };
}

/* ─────────────────────────────────────────────────────────────────
   DEFAULT DEMO CARDS
───────────────────────────────────────────────────────────────── */

/** Scene 1 — Icosahedron + orbiting particle ring */
function setupScene1(scene, camera) {
  camera.position.z = 4;
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  const l1 = new THREE.PointLight(0x42e8ff, 3, 20); l1.position.set(3,2,3); scene.add(l1);
  const l2 = new THREE.PointLight(0xb88cff, 2, 15); l2.position.set(-3,-2,2); scene.add(l2);

  const ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 1),
    new THREE.MeshStandardMaterial({ color:0x42e8ff, emissive:0x1a4455, roughness:.3, metalness:.7 })
  );
  scene.add(ico);

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.12, 1),
    new THREE.MeshBasicMaterial({ color:0x42e8ff, wireframe:true, transparent:true, opacity:.25 })
  );
  scene.add(wire);

  const rPos = new Float32Array(80*3);
  for(let i=0;i<80;i++){
    const a=(i/80)*Math.PI*2, r=2+(Math.random()-.5)*.4;
    rPos[i*3]=Math.cos(a)*r; rPos[i*3+1]=(Math.random()-.5)*.5; rPos[i*3+2]=Math.sin(a)*r;
  }
  const rGeo = new THREE.BufferGeometry();
  rGeo.setAttribute('position', new THREE.BufferAttribute(rPos,3));
  const ring = new THREE.Points(rGeo, new THREE.PointsMaterial({color:0x42e8ff,size:.04,transparent:true,opacity:.7}));
  scene.add(ring);

  return (t) => {
    ico.rotation.x = wire.rotation.x = t * .42;
    ico.rotation.y = wire.rotation.y = t * .55;
    ring.rotation.y = t * .30;
    l1.position.x = Math.sin(t*.8)*3.5;
    l1.position.z = Math.cos(t*.8)*3.5;
  };
}

/** Scene 2 — Torus Knot with three orbiting colored point lights */
function setupScene2(scene, camera) {
  camera.position.z = 4;
  scene.add(new THREE.AmbientLight(0xffffff, 0.2));
  const l1 = new THREE.PointLight(0x5ee89a, 3.5, 18); l1.position.set(4,3,3);  scene.add(l1);
  const l2 = new THREE.PointLight(0xf0a84a, 2.5, 14); l2.position.set(-4,-2,2); scene.add(l2);
  const l3 = new THREE.PointLight(0x42e8ff, 2.0, 14); l3.position.set(0,4,-2);  scene.add(l3);

  const tk = new THREE.Mesh(
    new THREE.TorusKnotGeometry(.9, .28, 120, 16),
    new THREE.MeshStandardMaterial({ color:0x5ee89a, emissive:0x0d3320, roughness:.2, metalness:.85 })
  );
  scene.add(tk);

  const tkw = new THREE.Mesh(
    new THREE.TorusKnotGeometry(.92, .285, 80, 10),
    new THREE.MeshBasicMaterial({ color:0x5ee89a, wireframe:true, transparent:true, opacity:.15 })
  );
  scene.add(tkw);

  return (t) => {
    tk.rotation.x = tkw.rotation.x = t * .28;
    tk.rotation.y = tkw.rotation.y = t * .40;
    l1.position.x = Math.sin(t*.6)*4; l1.position.z = Math.cos(t*.6)*4;
    l2.position.x = Math.cos(t*.5)*4; l2.position.z = Math.sin(t*.5)*4;
  };
}

/** Scene 3 — Solar system with orbiting planets */
function setupScene3(scene, camera) {
  camera.position.z = 5;
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const sun_l = new THREE.PointLight(0xffffff, 4, 20); scene.add(sun_l);
  const l2    = new THREE.PointLight(0xb88cff, 2, 15); l2.position.set(4,3,3); scene.add(l2);

  const star = new THREE.Mesh(
    new THREE.SphereGeometry(.45, 24, 24),
    new THREE.MeshStandardMaterial({color:0xffd080,emissive:0xffa020,emissiveIntensity:.8,roughness:.3})
  );
  scene.add(star);

  const PLANETS = [
    { r:1.0, s:.14, c:0x5eb8f5, sp:1.20, tilt:.10 },
    { r:1.5, s:.20, c:0x5ee89a, sp:.80,  tilt:.30 },
    { r:2.1, s:.16, c:0xb88cff, sp:.50,  tilt:-.20 },
    { r:2.7, s:.12, c:0xf0a84a, sp:.30,  tilt:.15 },
  ];
  const pivots = PLANETS.map(({ r, s, c, tilt }) => {
    const pivot = new THREE.Object3D();
    pivot.rotation.z = tilt;
    scene.add(pivot);

    pivot.add(new THREE.Mesh(
      new THREE.TorusGeometry(r, .012, 2, 80),
      new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:.22})
    ));

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(s, 16, 16),
      new THREE.MeshStandardMaterial({
        color: c,
        emissive: new THREE.Color(c).multiplyScalar(.15),
        roughness:.5, metalness:.4
      })
    );
    planet.position.x = r;
    pivot.add(planet);
    return pivot;
  });

  return (t) => {
    star.rotation.y = t * .3;
    pivots.forEach((p, i) => { p.rotation.y = t * PLANETS[i].sp; });
  };
}

export const DEFAULT_CARDS = [
  {
    title:       'Scene 1 · Icosahedron',
    subtitle:    'MeshStandardMaterial · PointLight · particle ring',
    accentColor: '#42e8ff',
    footerRight: 'Three.js r128+',
    position:    [-620, 0, -80],
    rotation:    [0,  0.38, 0],
    setupScene:  setupScene1,
  },
  {
    title:       'Scene 2 · Torus Knot',
    subtitle:    'Dynamic lighting · emissive material · orbiting lights',
    accentColor: '#5ee89a',
    footerRight: 'Three.js r128+',
    position:    [0, 0, 0],
    rotation:    [0, 0, 0],
    setupScene:  setupScene2,
  },
  {
    title:       'Scene 3 · Orbital System',
    subtitle:    'Hierarchical pivot groups · multiple meshes · star light',
    accentColor: '#b88cff',
    footerRight: 'Three.js r128+',
    position:    [620, 0, -80],
    rotation:    [0, -0.38, 0],
    setupScene:  setupScene3,
  },
];

/* ─────────────────────────────────────────────────────────────────
   CSS3DCardViewer  — main component
───────────────────────────────────────────────────────────────── */
export default function CSS3DCardViewer({
  cards      = DEFAULT_CARDS,
  background = '#0d1117',
  cameraPos  = [0, 80, 1300],
  style      = {},
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    ensureStyles();

    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    /* ── Shared main camera ── */
    const mainCamera = new THREE.PerspectiveCamera(50, W / H, 1, 6000);
    mainCamera.position.set(...cameraPos);

    /* ── CSS3D renderer ── */
    const css3d      = new CSS3DRenderer();
    const css3dScene = new THREE.Scene();
    css3d.setSize(W, H);
    container.appendChild(css3d.domElement);

    /* ── OrbitControls on CSS3D dom element ── */
    const controls = new OrbitControls(mainCamera, css3d.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance   = 300;
    controls.maxDistance   = 4000;
    controls.target.set(0, 0, 0);

    /* ── Build each card ── */
    const instances = cards.map((cardDef) => {
      const {
        position    = [0, 0, 0],
        rotation    = [0, 0, 0],
        cameraZ     = 4,
        fov         = 55,
        setupScene,
      } = cardDef;

      // HTML card with embedded canvas
      const { card, canvas } = buildCardElement(cardDef);

      // CSS3D object wraps the HTML card
      const obj = new CSS3DObject(card);
      obj.position.set(...position);
      obj.rotation.set(...rotation);
      css3dScene.add(obj);

      // Dedicated WebGL renderer targeting the canvas inside the card
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(CARD_W, CARD_H);
      renderer.setClearColor(0x080d14, 1);

      // Inner scene + camera
      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(fov, CARD_W / CARD_H, 0.1, 500);
      camera.position.z = cameraZ;

      // Let the card definition set up its own Three.js scene
      const onUpdate = (setupScene?.(scene, camera, renderer)) || (() => {});

      return { renderer, scene, camera, onUpdate };
    });

    /* ── Animation loop ── */
    const clock = new THREE.Clock();
    let raf;

    function loop() {
      raf = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();

      controls.update();

      instances.forEach(({ renderer, scene, camera, onUpdate }) => {
        onUpdate(t);                        // user animation callback
        renderer.render(scene, camera);     // render this card's inner scene
      });

      css3d.render(css3dScene, mainCamera); // position the cards in 3D space
    }
    loop();

    /* ── Resize ── */
    const onResize = () => {
      const w = container.clientWidth  || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      css3d.setSize(w, h);
      mainCamera.aspect = w / h;
      mainCamera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      instances.forEach(({ renderer }) => renderer.dispose());
      if (container.contains(css3d.domElement)) {
        container.removeChild(css3d.domElement);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{
        width:    '100%',
        height:   '100%',
        overflow: 'hidden',
        background,
        ...style,
      }}
    />
  );
}

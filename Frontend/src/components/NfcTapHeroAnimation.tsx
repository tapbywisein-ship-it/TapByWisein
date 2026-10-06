import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';

export const NfcTapHeroAnimation: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !mountRef.current || !haloRef.current) return;
    
    const canvas = canvasRef.current;
    const halo = haloRef.current;
    const stageEl = mountRef.current;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      console.error("WebGL not supported", e);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    const world = new THREE.Group();
    scene.add(world);

    /* ---------------- lights ---------------- */
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-8, 14, 12);
    scene.add(key);
    
    const fill = new THREE.DirectionalLight(0xe2e6ee, 0.5); // silver tint
    fill.position.set(12, 2, 8);
    scene.add(fill);
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    /* ---------------- helpers ---------------- */
    function rrShape(w: number, h: number, r: number) {
      const s = new THREE.Shape(), x = -w/2, y = -h/2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI/2, 0, false);
      s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI/2, false);
      s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI/2, Math.PI, false);
      s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI*1.5, false);
      return s;
    }
    
    function rrPlane(w: number, h: number, r: number) {
      const g = new THREE.ShapeGeometry(rrShape(w, h, r), 48);
      const p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w/2) / w, (p.getY(i) + h/2) / h);
      return g;
    }
    
    function canvasTex(c: HTMLCanvasElement) {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    }
    
    function radialTex(stops: [number, string][], size = 256) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const x = c.getContext('2d')!;
      const g = x.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      stops.forEach(([o, col]) => g.addColorStop(o, col));
      x.fillStyle = g;
      x.fillRect(0, 0, size, size);
      return canvasTex(c);
    }
    
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeOutBack = (t: number) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

    /* ---------------- phone ---------------- */
    const PW = 7.15, PH = 13.9, PD = 0.62;
    const phone = new THREE.Group();
    world.add(phone);
    const PHONE_POS = new THREE.Vector3(2.3, -0.6, 0), PHONE_RY = -0.22;
    phone.position.copy(PHONE_POS);
    phone.rotation.y = PHONE_RY;

    const bodyGeo = new THREE.ExtrudeGeometry(rrShape(PW - 0.24, PH - 0.24, 0.98), { depth: PD, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 10, curveSegments: 40 });
    bodyGeo.center();
    bodyGeo.computeBoundingBox();
    const FRONT = bodyGeo.boundingBox!.max.z;
    const titanium = new THREE.MeshPhysicalMaterial({ color: 0x343A40, metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.2, envMapIntensity: 1.1 });
    phone.add(new THREE.Mesh(bodyGeo, titanium));

    // side buttons
    const btnMat = titanium.clone();
    btnMat.roughness = 0.25;
    [[-PW/2 - 0.06, 3.6, 1.2], [-PW/2 - 0.06, 2.0, 1.0], [PW/2 + 0.06, 2.8, 1.8]].forEach(([x, y, h]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, h, 0.3), btnMat);
      b.position.set(x, y, 0);
      phone.add(b);
    });

    const glassBlack = new THREE.Mesh(rrPlane(PW - 0.26, PH - 0.26, 0.9), new THREE.MeshPhysicalMaterial({ color: 0x030304, roughness: 0.08, metalness: 0, clearcoat: 1 }));
    glassBlack.position.z = FRONT + 0.001;
    phone.add(glassBlack);

    // the live screen
    const SW = 6.72, SH = 13.44, SCALE = 0.55, CW = 720, CH = 1440;
    const sc = document.createElement('canvas');
    sc.width = CW * SCALE;
    sc.height = CH * SCALE;
    const sx = sc.getContext('2d')!;
    const screenTex = canvasTex(sc);
    const screen = new THREE.Mesh(rrPlane(SW, SH, 0.86), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
    screen.position.z = FRONT + 0.003;
    phone.add(screen);

    // glass reflections
    const reflect = new THREE.Mesh(rrPlane(PW - 0.26, PH - 0.26, 0.9), new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.05, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 0.9 }));
    reflect.position.z = FRONT + 0.006;
    phone.add(reflect);

    // back glass
    const back = new THREE.Mesh(rrPlane(PW - 0.26, PH - 0.26, 0.9), new THREE.MeshPhysicalMaterial({ color: 0x2b2e34, roughness: 0.55, metalness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.5 }));
    back.position.z = -FRONT - 0.001;
    back.rotation.y = Math.PI;
    phone.add(back);

    // camera plateau
    const bumpGeo = new THREE.ExtrudeGeometry(rrShape(3.0, 3.0, 0.78), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 6, curveSegments: 32 });
    bumpGeo.center();
    const bump = new THREE.Mesh(bumpGeo, new THREE.MeshPhysicalMaterial({ color: 0x1f2126, roughness: 0.18, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 }));
    const BUMP = new THREE.Vector3(1.75, 4.95, -FRONT - 0.09);
    bump.position.copy(BUMP);
    phone.add(bump);
    const ringMat = new THREE.MeshPhysicalMaterial({ color: 0x495057, metalness: 1, roughness: 0.22 });
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x05060a, metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0, iridescence: 0.6, iridescenceIOR: 1.6 });
    [[0.62, 0.62], [-0.62, 0.62], [0.62, -0.62]].forEach(([lx, ly]) => {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.6, 0.2, 48), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(BUMP.x + lx, BUMP.y + ly, BUMP.z - 0.14);
      phone.add(ring);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.45, 48), lensMat);
      glass.rotation.y = Math.PI;
      glass.position.set(BUMP.x + lx, BUMP.y + ly, BUMP.z - 0.245);
      phone.add(glass);
    });
    const flash = new THREE.Mesh(new THREE.CircleGeometry(0.16, 32), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.4 }));
    flash.rotation.y = Math.PI;
    flash.position.set(BUMP.x - 0.62, BUMP.y - 0.62, BUMP.z - 0.14);
    phone.add(flash);

    // soft floor shadow
    const shadowTex = radialTex([[0, 'rgba(33,37,41,0.25)'], [0.5, 'rgba(33,37,41,0.08)'], [1, 'rgba(33,37,41,0)']]);
    const phoneShadow = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 }));
    phoneShadow.rotation.x = -Math.PI/2;
    phoneShadow.position.set(PHONE_POS.x, PHONE_POS.y - PH/2 - 0.9, 0);
    world.add(phoneShadow);

    /* ---------------- card ---------------- */
    const KW = 7.6, KH = 4.8;
    const card = new THREE.Group();
    world.add(card);
    const cardGeo = new THREE.ExtrudeGeometry(rrShape(KW - 0.05, KH - 0.05, 0.4), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.025, bevelSegments: 4, curveSegments: 24 });
    cardGeo.center();
    cardGeo.computeBoundingBox();
    const CFRONT = cardGeo.boundingBox!.max.z;

    // brushed grain as a roughness map
    const brush = document.createElement('canvas');
    brush.width = 64; brush.height = 1024;
    { 
      const b = brush.getContext('2d')!;
      for (let y = 0; y < 1024; y++) { 
        const v = 70 + Math.random() * 60; 
        b.fillStyle = `rgb(${v},${v},${v})`; 
        b.fillRect(0, y, 64, 1); 
      } 
    }
    const brushTex = new THREE.CanvasTexture(brush);
    brushTex.wrapS = brushTex.wrapT = THREE.RepeatWrapping;
    brushTex.repeat.set(1, 0.35);

    // Bright Silver Material
    const metal = new THREE.MeshPhysicalMaterial({
      color: 0xFAFBFC, metalness: 1, roughness: 0.65, roughnessMap: brushTex,
      anisotropy: 0.85, anisotropyRotation: Math.PI/2,
      iridescence: 0.15, iridescenceIOR: 1.45, iridescenceThicknessRange: [180, 520],
      clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 1.25
    });
    const edgeMaterial = new THREE.MeshPhysicalMaterial({ color: 0xDEE2E6, metalness: 0.9, roughness: 0.28, clearcoat: 1, envMapIntensity: 1.2 });
    const cardMesh = new THREE.Mesh(cardGeo, [metal, edgeMaterial]);
    card.add(cardMesh);

    // printed face - Back
    const bc = document.createElement('canvas');
    bc.width = 1520; bc.height = 960;
    {
      const x = bc.getContext('2d')!;
      const g = x.createLinearGradient(560, 200, 960, 700); 
      g.addColorStop(0, '#60A5FA'); 
      g.addColorStop(1, '#2563EB'); 
      x.fillStyle = g;
      
      x.beginPath(); x.roundRect(540, 250, 440, 120, 60); x.fill();
      x.beginPath(); x.roundRect(698, 250, 124, 440, 62); x.fill();
      
      x.fillStyle = '#6C757D'; 
      x.font = '600 44px "Inter", sans-serif'; 
      x.textAlign = 'center';
      if ('letterSpacing' in x) (x as any).letterSpacing = '6px';
      x.fillText('TAP TO CONNECT', 760, 810);
      if ('letterSpacing' in x) (x as any).letterSpacing = '0px';
    }
    const backPrint = new THREE.Mesh(new THREE.PlaneGeometry(KW, KH), new THREE.MeshStandardMaterial({ map: canvasTex(bc), transparent: true, roughness: 0.45, metalness: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    backPrint.rotation.y = Math.PI; 
    backPrint.position.z = -CFRONT - 0.002; 
    card.add(backPrint);

    // printed face - Front
    const pc = document.createElement('canvas');
    pc.width = 1520; pc.height = 960;
    {
      const x = pc.getContext('2d')!;
      x.fillStyle = '#212529'; // Graphite text
      x.font = '800 70px "Inter", sans-serif'; 
      x.fillText('Tap', 76, 132);
      const tw = x.measureText('Tap').width;
      x.font = '500 70px "Inter", sans-serif'; 
      x.fillStyle = '#495057';
      x.fillText('ByWisein', 76 + tw + 2, 132);
      
      // Blue NFC Logo
      x.save(); 
      x.translate(1360, 58); 
      x.scale(4.2, 4.2); 
      x.strokeStyle = '#2563EB'; 
      x.lineWidth = 2.2; 
      x.lineCap = 'round';
      x.stroke(new Path2D('M6 8.5a5 5 0 0 1 0 7 M9.5 6a9 9 0 0 1 0 12 M13 3.5a13 13 0 0 1 0 17')); 
      x.restore();
      
      x.fillStyle = '#212529'; 
      x.font = '800 150px "Inter", sans-serif'; 
      x.fillText('Santhosh', 70, 740);
      x.fillStyle = '#495057'; 
      x.font = '600 40px "Inter", monospace';
      if ('letterSpacing' in x) (x as any).letterSpacing = '16px';
      x.fillText('FOUNDER', 76, 840);
      if ('letterSpacing' in x) (x as any).letterSpacing = '0px';
      x.font = '600 34px "Inter", sans-serif'; 
      x.fillStyle = '#6C757D'; 
      x.textAlign = 'right'; 
      x.fillText('tapbywisein.com', 1444, 840);
    }
    const print = new THREE.Mesh(new THREE.PlaneGeometry(KW, KH), new THREE.MeshStandardMaterial({ map: canvasTex(pc), transparent: true, roughness: 0.55, metalness: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    print.position.z = CFRONT + 0.002;
    card.add(print);

    /* ---------------- tap effects (Blue Pulse) ---------------- */
    const ringGeo = new THREE.RingGeometry(0.96, 1, 128);
    const waves = [0, 1, 2].map(() => {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x3B82F6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, toneMapped: false }));
      m.renderOrder = 10;
      world.add(m);
      return m;
    });
    
    // Controlled elegant blue flash
    const flare = new THREE.Sprite(new THREE.SpriteMaterial({ 
      map: radialTex([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(96,165,250,0.9)'], [0.45, 'rgba(59,130,246,0.3)'], [1, 'rgba(29,78,216,0)']]), 
      blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true, opacity: 0, toneMapped: false 
    }));
    flare.renderOrder = 11;
    world.add(flare);

    const rim = new THREE.PointLight(0x60A5FA, 0, 22, 1.2);
    world.add(rim);

    // Elegant subtle particles
    const N = 30, pPos = new Float32Array(N * 3), pCol = new Float32Array(N * 3), pVel = new Float32Array(N * 3), pLife = new Float32Array(N);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const dot = radialTex([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(96,165,250,0.8)'], [1, 'rgba(59,130,246,0)']], 64);
    const sparks = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.25, map: dot, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false }));
    sparks.renderOrder = 12;
    sparks.visible = false;
    world.add(sparks);

    const contact = new THREE.Vector3();
    function updateContact() { 
      contact.set(0, 5.4, -FRONT - 0.4); 
      phone.localToWorld(contact); 
      world.worldToLocal(contact); 
    }
    
    function burst() {
      updateContact();
      sparks.visible = true;
      for (let i = 0; i < N; i++) {
        pPos.set([contact.x + (Math.random() - .5) * 4, contact.y + 0.9, contact.z - 0.3], i * 3);
        const a = 0.25 + Math.random() * (Math.PI - 0.5), s = 2 + Math.random() * 4;
        pVel.set([Math.cos(a) * s, Math.sin(a) * s + 1.5, (Math.random() - .5) * 2], i * 3);
        pLife[i] = 0.6 + Math.random() * 0.8;
      }
    }

    /* ---------------- choreography state ---------------- */
    phone.updateMatrixWorld(true);
    const toWorld = (x: number, y: number, z: number) => { 
      const v = new THREE.Vector3(x, y, z); 
      phone.localToWorld(v); 
      return world.worldToLocal(v); 
    };
    
    // Tucked closer to the phone so it doesn't overlap left text or get clipped by the canvas
    const REST = new THREE.Vector3(-2.6, -4.2, 4.2);
    const REST_R = new THREE.Euler(-0.42, 0.52, 0.16);
    const CARD_Z = -FRONT - 0.37;
    const TARGET = toWorld(0, 5.35, CARD_Z);
    const TARGET_R = new THREE.Euler(0, PHONE_RY, -0.05);
    const path = new THREE.CatmullRomCurve3([REST, new THREE.Vector3(-1.8, 2.2, 5.6), new THREE.Vector3(0.5, 10.2, 3.2), toWorld(0, 9.2, CARD_Z), TARGET], false, 'centripetal');
    const back2 = new THREE.CatmullRomCurve3([TARGET, toWorld(-1.5, 4.2, CARD_Z - 3.2), new THREE.Vector3(-3.2, 0.4, 2.2), new THREE.Vector3(-3.0, -3.0, 4.0), REST], false, 'centripetal');
    
    const S = { lock: 1, islandW: 0, islandC: 0, prog: 0, check: 0, reveal: 0, ring: 0, avatar: 0, letters: 0, role: 0, chips: 0, rule: 0, rows: 0, save: 0, fill: 0, added: 0, pf: 1 };
    const C = { ret: 0, t: 0, spin: 0, float: 1, jolt: 0, rim: 0, bump: 0, glow: 0 };
    
    const KF = {
      idle:   { az: 0.08, el: 0.05, r: 44, tx: -1.0, ty: -0.5, tz: 0 },
      travel: { az: 0.55, el: 0.16, r: 46, tx: 0.4,  ty: 2.0,  tz: 0 },
      tap:    { az: 2.25, el: 0.12, r: 40, tx: 2.2,  ty: 0.3,  tz: 0 },
      island: { az: 0.2,  el: 0.06, r: 37, tx: 0.6,  ty: 0.0,  tz: 0 },
      prof:   { az: 0.1,  el: 0.04, r: 39, tx: -0.2, ty: -0.9, tz: 0 }
    };
    const cam = { ...KF.idle };

    // GSAP Timeline
    const tl = gsap.timeline({ repeat: -1, defaults: { immediateRender: false } });
    
    tl.addLabel('go', 1.0)
      .to(C, { float: 0, duration: 0.5, ease: 'power2.out' }, 'go')
      .to(C, { t: 1, duration: 1.75, ease: 'power2.inOut' }, 'go')
      .to(C, { spin: Math.PI * 2, duration: 1.2, ease: 'power2.inOut' }, 'go+=0.05')
      .to(cam, { ...KF.travel, duration: 0.9, ease: 'power2.inOut' }, 'go')
      .to(cam, { ...KF.tap, duration: 1.3, ease: 'power2.inOut' }, 'go+=0.7')

      .addLabel('tap', 'go+=1.75')
      .call(burst, null, 'tap')
      .fromTo(C, { jolt: 1 }, { jolt: 0, duration: 0.7, ease: 'power2.out' }, 'tap')
      .fromTo(C, { bump: 0 }, { bump: 1, duration: 0.1, ease: 'power1.out', yoyo: true, repeat: 1 }, 'tap')
      .fromTo(C, { glow: 0 }, { glow: 1, duration: 0.14, ease: 'power2.out' }, 'tap')
      .to(C, { glow: 0, duration: 1.1, ease: 'power2.out' }, 'tap+=0.14')
      .fromTo(C, { rim: 0 }, { rim: 1, duration: 0.2 }, 'tap')
      .to(C, { rim: 0, duration: 1.6, ease: 'power2.inOut' }, 'tap+=0.8');
      
    waves.forEach((w, i) => {
      tl.fromTo(w.scale, { x: .3, y: .3, z: .3 }, { x: 7, y: 7, z: 7, duration: 1.6, ease: 'expo.out' }, `tap+=${i * 0.13}`)
        .fromTo(w.material, { opacity: 0.95 }, { opacity: 0, duration: 1.6, ease: 'power2.out' }, `tap+=${i * 0.13}`);
    });
    
    tl.to(S, { islandW: 1, duration: 0.6, ease: 'back.out(1.5)' }, 'tap+=0.05')
      .to(S, { islandC: 1, duration: 0.25 }, 'tap+=0.25')
      .to(S, { prog: 1, duration: 1.45, ease: 'power1.inOut' }, 'tap+=0.3')
      .to(S, { check: 1, duration: 0.25 }, 'tap+=1.75')
      .to(cam, { ...KF.island, duration: 1.3, ease: 'power3.inOut' }, 'tap+=0.6')
      .to(C, { ret: 1, duration: 1.7, ease: 'power2.inOut' }, 'tap+=1.1')
      .set(C, { t: 0, ret: 0 }, 'tap+=2.8')
      .to(C, { float: 1, duration: 0.8 }, 'tap+=2.3')

      .addLabel('back', 'tap+=2.2')
      .to(cam, { ...KF.prof, duration: 1.5, ease: 'power3.inOut' }, 'back')
      .to(S, { islandC: 0, duration: 0.15 }, 'back')
      .to(S, { islandW: 0, duration: 0.45, ease: 'power3.inOut' }, 'back+=0.1')

      .addLabel('rev', 'back+=0.3')
      .to(S, { reveal: 1, duration: 1.0, ease: 'power2.inOut' }, 'rev')
      .to(S, { lock: 0, duration: 0.6 }, 'rev+=0.15')
      .to(S, { ring: 1, duration: 1.0, ease: 'power2.inOut' }, 'rev+=0.3')
      .to(S, { avatar: 1, duration: 0.7, ease: 'back.out(2)' }, 'rev+=0.35')
      .to(S, { letters: 8, duration: 0.7, ease: 'none' }, 'rev+=0.5')
      .to(S, { role: 1, duration: 0.4 }, 'rev+=0.8')
      .to(S, { chips: 4, duration: 0.5, ease: 'none' }, 'rev+=0.9')
      .to(S, { rule: 1, duration: 0.6, ease: 'power2.inOut' }, 'rev+=1.0')
      .to(S, { rows: 3, duration: 0.6, ease: 'none' }, 'rev+=1.1')
      .to(S, { save: 1, duration: 0.4 }, 'rev+=1.35')

      .addLabel('save', 'rev+=2.0')
      .to(S, { fill: 1, duration: 0.6, ease: 'power2.inOut' }, 'save')
      .to(S, { added: 1, duration: 0.35 }, 'save+=0.45')
      .fromTo(C, { rim: 0 }, { rim: 0.55, duration: 0.3, yoyo: true, repeat: 1 }, 'save+=0.5')

      .addLabel('out', 'save+=2.6')
      .to(S, { pf: 0, duration: 0.5 }, 'out')
      .to(S, { lock: 1, duration: 0.6 }, 'out+=0.2')
      .to(cam, { ...KF.idle, duration: 1.4, ease: 'power2.inOut' }, 'out');

    /* ---------------- screen UI (2D canvas) ---------------- */
    const ICONS = [
      'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
      'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 7l-10 6L2 7',
      'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 2a2 2 0 1 0 0 4a2 2 0 1 0 0-4z',
      'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z M2 12h20 M12 2a15 15 0 0 1 0 20 M12 2a15 15 0 0 0 0 20'
    ].map(d => new Path2D(d));
    const NFC = new Path2D('M6 8.5a5 5 0 0 1 0 7 M9.5 6a9 9 0 0 1 0 12 M13 3.5a13 13 0 0 1 0 17');
    const CHECK = new Path2D('M5 12.5l4.5 4.5L19 7.5');
    
    function rr(x: number, y: number, w: number, h: number, r: number) { 
      sx.beginPath(); 
      sx.roundRect(x, y, w, h, r); 
    }

    // Pre-cache expensive gradients for buttery smooth rendering
    const lockGradient = sx.createRadialGradient(360, -80, 0, 360, -80, 1500);
    lockGradient.addColorStop(0, '#1E293B'); lockGradient.addColorStop(0.42, '#0e1426'); lockGradient.addColorStop(1, '#06070a');

    const pfGradient = sx.createRadialGradient(360, 0, 0, 360, 0, 560);
    pfGradient.addColorStop(0, 'rgba(59,130,246,.4)'); pfGradient.addColorStop(0.55, 'rgba(29,78,216,.08)'); pfGradient.addColorStop(1, 'rgba(29,78,216,0)');

    const avatarGradient = sx.createLinearGradient(-90, -90, 90, 90); 
    avatarGradient.addColorStop(0, '#FFFFFF'); avatarGradient.addColorStop(1, '#DEE2E6');

    const saveButtonGradient = sx.createLinearGradient(40, 0, 680, 0); 
    saveButtonGradient.addColorStop(0, '#1D4ED8'); saveButtonGradient.addColorStop(1, '#60A5FA');

    function drawScreen(time: number) {
      const x = sx;
      x.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      x.globalAlpha = 1; x.fillStyle = '#07080b'; x.fillRect(0, 0, CW, CH);

      // lock screen
      if (S.lock > 0.001) {
        x.globalAlpha = S.lock;
        x.fillStyle = lockGradient; x.fillRect(0, 0, CW, CH);
        x.textAlign = 'center'; x.fillStyle = '#94A3B8'; x.font = '500 32px "Inter", sans-serif'; x.fillText('Tuesday, 29 September', 360, 250);
        x.fillStyle = '#F8F9FA'; x.font = '700 196px "Inter", sans-serif'; x.fillText('9:41', 360, 440);
        
        const k = (time % 2.2) / 2.2;
        x.strokeStyle = `rgba(59,130,246,${0.45 * (1 - k)})`; x.lineWidth = 2;
        x.beginPath(); x.arc(360, 1150, 52 + k * 34, 0, Math.PI * 2); x.stroke();
        x.fillStyle = 'rgba(59,130,246,.16)'; x.beginPath(); x.arc(360, 1150, 52, 0, Math.PI * 2); x.fill();
        x.save(); x.translate(360 - 26, 1150 - 26); x.scale(2.2, 2.2); x.strokeStyle = '#60A5FA'; x.lineWidth = 2; x.lineCap = 'round'; x.stroke(NFC); x.restore();
        
        x.fillStyle = '#CBD5E1'; x.font = '500 29px "Inter", sans-serif';
        x.fillText('Hold a Tap card near', 360, 1262); x.fillText('the top of your phone', 360, 1302);
      }

      // profile
      if (S.reveal > 0.001 && S.pf > 0.001) {
        x.save();
        x.beginPath(); x.arc(360, -20, S.reveal * 1700, 0, Math.PI * 2); x.clip();
        x.globalAlpha = S.pf;
        x.fillStyle = '#0c0d10'; x.fillRect(0, 0, CW, CH);
        x.fillStyle = pfGradient; x.fillRect(0, 0, CW, 600);

        // avatar
        const ax = 360, ay = 330;
        x.lineWidth = 7; x.lineCap = 'round';
        const rg = x.createLinearGradient(ax - 110, ay - 110, ax + 110, ay + 110); rg.addColorStop(0, '#60A5FA'); rg.addColorStop(1, '#2563EB');
        x.strokeStyle = rg; x.beginPath(); x.arc(ax, ay, 108, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * S.ring); if (S.ring > 0.001) x.stroke();
        const as = Math.max(0, S.avatar);
        if (as > 0.001) {
          x.save(); x.translate(ax, ay); x.scale(as, as);
          x.fillStyle = avatarGradient; x.beginPath(); x.arc(0, 0, 90, 0, Math.PI * 2); x.fill();
          x.fillStyle = '#212529'; x.font = '700 80px "Inter", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('S', 0, 4);
          x.restore(); x.textBaseline = 'alphabetic';
        }
        
        // name
        x.font = '700 64px "Inter", sans-serif'; x.textAlign = 'left';
        const word = 'Santhosh', total = x.measureText(word).width; let cx = 360 - total / 2;
        for (let i = 0; i < word.length; i++) {
          const p = easeOutCubic(clamp(S.letters - i)); const w = x.measureText(word[i]).width;
          if (p > 0) { x.globalAlpha = S.pf * p; x.fillStyle = '#FFFFFF'; x.fillText(word[i], cx, 540 + (1 - p) * 38); }
          cx += w;
        }
        x.globalAlpha = S.pf * S.role; x.textAlign = 'center'; x.fillStyle = '#94A3B8'; x.font = '500 30px "Inter", sans-serif';
        x.fillText('Founder · TapByWisein', 360, 592 + (1 - S.role) * 12);

        // action chips
        for (let i = 0; i < 4; i++) {
          const p = clamp(S.chips - i); if (p <= 0) continue;
          const s = easeOutBack(p), cxx = 360 + (i - 1.5) * 112;
          x.globalAlpha = S.pf * clamp(p * 2);
          x.save(); x.translate(cxx, 690); x.scale(s, s);
          rr(-44, -44, 88, 88, 26); x.fillStyle = '#1e293b'; x.fill(); x.strokeStyle = '#334155'; x.lineWidth = 2; x.stroke();
          x.translate(-20, -20); x.scale(1.66, 1.66); x.strokeStyle = '#F8F9FA'; x.lineWidth = 2; x.lineJoin = 'round'; x.stroke(ICONS[i]);
          x.restore();
        }
        
        // divider
        x.globalAlpha = S.pf; x.fillStyle = '#334155'; const rw = 640 * S.rule; x.fillRect(360 - rw / 2, 790, rw, 2);
        
        // rows
        const rows = [['Met at', 'Founders Meetup · Hyderabad'], ['Connected via', 'NFC tap'], ['Profile', 'tapbywisein.com']];
        rows.forEach(([k, v], i) => {
          const p = easeOutCubic(clamp(S.rows - i)); if (p <= 0) return;
          const y = 866 + i * 74, dx = (1 - p) * -24;
          x.globalAlpha = S.pf * p;
          x.textAlign = 'left'; x.fillStyle = '#94A3B8'; x.font = '500 28px "Inter", sans-serif'; x.fillText(k, 44 + dx, y);
          x.textAlign = 'right'; x.fillStyle = '#F8F9FA'; x.font = '600 28px "Inter", sans-serif'; x.fillText(v, 676 + dx, y);
        });
        
        // save button
        if (S.save > 0.001) {
          const by = 1262 + (1 - S.save) * 24;
          x.globalAlpha = S.pf * S.save;
          rr(40, by, 640, 104, 30); x.fillStyle = '#1e293b'; x.fill(); x.strokeStyle = '#334155'; x.lineWidth = 2; x.stroke();
          if (S.fill > 0) {
            x.save(); rr(40, by, 640, 104, 30); x.clip();
            x.fillStyle = saveButtonGradient; x.fillRect(40, by, 640 * S.fill, 104); x.restore();
          }
          x.textAlign = 'center'; x.font = '600 31px "Inter", sans-serif'; x.fillStyle = '#ffffff';
          x.globalAlpha = S.pf * S.save * (1 - S.added); x.fillText('Save contact', 360, by + 63 - S.added * 16);
          if (S.added > 0) {
            x.globalAlpha = S.pf * S.added;
            const ty = by + 63 + (1 - S.added) * 16;
            x.fillText('Added to connections', 382, ty);
            x.save(); x.translate(190, ty - 30); x.scale(1.5, 1.5); x.strokeStyle = '#fff'; x.lineWidth = 3; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(CHECK); x.restore();
          }
        }
        x.restore();
      }

      // Dynamic Island
      x.globalAlpha = 1;
      const iw = lerp(232, 640, S.islandW), ih = lerp(70, 144, S.islandW), ix = (CW - iw) / 2, iy = 28;
      rr(ix, iy, iw, ih, ih / 2); x.fillStyle = '#000'; x.fill();
      if (S.islandC > 0.001) {
        x.globalAlpha = S.islandC;
        const cy = iy + ih / 2;
        const mg = x.createLinearGradient(ix + 30, cy - 30, ix + 124, cy + 30);
        mg.addColorStop(0, '#F8F9FA'); mg.addColorStop(0.45, '#CED4DA'); mg.addColorStop(0.6, '#F8F9FA'); mg.addColorStop(1, '#ADB5BD');
        rr(ix + 30, cy - 30, 94, 60, 10); x.fillStyle = mg; x.fill();
        x.textAlign = 'left'; x.fillStyle = '#6C757D'; x.font = '500 24px "Inter", sans-serif'; x.fillText('TapByWisein', ix + 146, cy - 8);
        x.fillStyle = '#ffffff'; x.font = '600 30px "Inter", sans-serif'; x.fillText(S.check > 0.5 ? "Santhosh's card" : 'Reading card…', ix + 146, cy + 28);
        const rx = ix + iw - 62;
        x.lineWidth = 6; x.strokeStyle = '#343A40'; x.beginPath(); x.arc(rx, cy, 24, 0, Math.PI * 2); x.stroke();
        x.strokeStyle = '#3B82F6'; x.lineCap = 'round'; x.beginPath(); x.arc(rx, cy, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * S.prog); if (S.prog > 0.001) x.stroke();
        if (S.check > 0) {
          x.save(); x.globalAlpha = S.islandC * S.check; x.translate(rx - 16, cy - 16); x.scale(1.35, 1.35);
          x.strokeStyle = '#fff'; x.lineWidth = 3.2; x.lineJoin = 'round'; x.stroke(CHECK); x.restore();
        }
      }
      
      // home indicator
      x.globalAlpha = 0.55; rr(260, CH - 30, 200, 10, 5); x.fillStyle = '#ffffff'; x.fill();
      x.globalAlpha = 1;
      screenTex.needsUpdate = true;
    }

    /* ---------------- sizing, pointer, loop ---------------- */
    let aspect = 1;
    let resizeObserver: ResizeObserver | null = null;
    
    function resize() {
      if (!canvas) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false); 
      aspect = w / h; 
      camera.aspect = aspect; 
      camera.updateProjectionMatrix();
    }
    resize(); 
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const pointer = { x: 0, y: 0 };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const handlePointerMove = (e: PointerEvent) => { 
      pointer.x = e.clientX / window.innerWidth - 0.5; 
      pointer.y = e.clientY / window.innerHeight - 0.5; 
    };
    if (!reduce) window.addEventListener('pointermove', handlePointerMove);

    const eRest = new THREE.Vector3(REST_R.x, REST_R.y, REST_R.z), eTarget = new THREE.Vector3(TARGET_R.x, TARGET_R.y, TARGET_R.z), eTmp = new THREE.Vector3();
    const look = new THREE.Vector3(), camPos = new THREE.Vector3();

    // GSAP perfectly synchronized render loop for buttery smooth framerates
    function frame(time: number, deltaTime: number) {
      const dt = Math.min(0.05, deltaTime / 1000); 

      // card along its arc
      const returning = C.ret > 0;
      card.position.copy(returning ? back2.getPoint(clamp(C.ret)) : path.getPoint(clamp(C.t)));
      card.position.y += Math.sin(time * 1.25) * 0.3 * C.float - C.bump * 0.14;
      eTmp.copy(eRest).lerp(eTarget, returning ? 1 - C.ret : C.t);
      card.rotation.set(eTmp.x + Math.sin(time * 0.9) * 0.06 * C.float, eTmp.y + C.spin + Math.sin(time * 0.6) * 0.08 * C.float, eTmp.z + Math.sin(time * 0.75) * 0.04 * C.float);

      // phone reacts to the tap
      phone.position.y = PHONE_POS.y + Math.sin(time * 70) * 0.05 * C.jolt;
      phone.rotation.z = Math.sin(time * 52) * 0.006 * C.jolt;

      // effects
      updateContact();
      rim.position.set(contact.x, contact.y + 1.5, contact.z - 4); 
      rim.intensity = C.rim * 40;
      
      flare.position.copy(contact); 
      flare.material.opacity = C.glow * 0.65; 
      const fs = 3 + C.glow * 5; 
      flare.scale.set(fs, fs, 1);
      
      waves.forEach(w => { 
        w.position.copy(contact); 
        w.quaternion.copy(camera.quaternion); 
      });
      
      for (let i = 0; i < N; i++) {
        if (pLife[i] > 0) {
          pLife[i] -= dt / 1.3;
          pVel[i * 3] *= 0.965; pVel[i * 3 + 1] = pVel[i * 3 + 1] * 0.965 - dt * 2.2; pVel[i * 3 + 2] *= 0.965;
          pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
        }
        const a = clamp(pLife[i]);
        pCol[i * 3] = 0.55 * a; pCol[i * 3 + 1] = 0.72 * a; pCol[i * 3 + 2] = 1.0 * a;
      }
      pGeo.attributes.position.needsUpdate = true; 
      pGeo.attributes.color.needsUpdate = true;
      
      if (haloRef.current) {
        haloRef.current.style.setProperty('--pulse', Math.max(C.rim, C.glow).toFixed(3));
      }

      // camera
      const k = Math.max(1, 0.95 / aspect);
      const az = cam.az + Math.sin(time * 0.23) * 0.012, el = cam.el + Math.cos(time * 0.19) * 0.008, r = cam.r * k;
      look.set(cam.tx, cam.ty, cam.tz);
      camPos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(r).add(look);
      camera.position.copy(camPos); 
      camera.lookAt(look);

      // pointer parallax
      world.rotation.y += (pointer.x * 0.16 - world.rotation.y) * 0.05;
      world.rotation.x += (pointer.y * 0.08 - world.rotation.x) * 0.05;

      drawScreen(time);
      renderer.render(scene, camera);
    }
    
    // start loop synchronously with GSAP for absolute perfect framerates
    gsap.ticker.add(frame);
    if (canvasRef.current) canvasRef.current.style.opacity = '1';

    return () => {
      gsap.ticker.remove(frame);
      tl.kill();
      tl.kill();
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      
      // Cleanup WebGL contexts to prevent memory leaks
      renderer.dispose();
      bodyGeo.dispose();
      titanium.dispose();
      bumpGeo.dispose();
      cardGeo.dispose();
      metal.dispose();
      edgeMaterial.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div 
      className={`relative w-full h-[500px] lg:h-[650px] overflow-visible ${className}`} 
      ref={mountRef}
      aria-label="3D cinematic animation: a TapByWisein premium metal card taps the back of a phone, lighting up with a blue NFC signal and connecting."
    >
      <div 
        ref={haloRef} 
        className="absolute left-[18%] right-[-6%] top-[8%] bottom-[4%] rounded-full pointer-events-none transition-transform"
        style={{
          background: 'radial-gradient(closest-side, rgba(59,130,246,0.18), rgba(59,130,246,0.06) 55%, transparent)',
          opacity: 'calc(0.55 + var(--pulse, 0) * 0.45)', 
          transform: 'scale(calc(1 + var(--pulse, 0) * 0.08))'
        }}
      />
      <canvas 
        ref={canvasRef} 
        className="absolute top-[-90px] bottom-[-40px] left-[-16px] lg:left-[-180px] right-[-16px] lg:right-[-80px] w-[calc(100%+32px)] lg:w-[calc(100%+260px)] h-[calc(100%+130px)] block opacity-0 transition-opacity duration-1000 pointer-events-none" 
      />
    </div>
  );
};

export default NfcTapHeroAnimation;

/* Palco 3D da abertura (Three.js)
   - painel com a foto de cena, curvo, com borda luminosa
   - três fachos de luz coloridos (cones volumétricos)
   - poeira flutuando na luz, chão do palco com anéis
   - formas 3D orbitando; tudo reage ao mouse e à rolagem */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('palco3d');
const secao = document.getElementById('inicio');
const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

function semWebGL() { document.documentElement.classList.add('sem-3d'); }

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { semWebGL(); }

if (renderer) iniciar();

function iniciar() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const cena = new THREE.Scene();
  cena.fog = new THREE.FogExp2(0x090a12, 0.045);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.3, 10);

  const palco = new THREE.Group();
  cena.add(palco);

  /* ---- Painel com a foto ---- */
  const geo = new THREE.PlaneGeometry(3.1, 3.97, 48, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, -(x * x) * 0.09);            // leve curvatura
  }
  geo.computeVertexNormals();
  const foto = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
  const painel = new THREE.Group();
  painel.add(foto);

  // borda luminosa (gradiente coral → ciano) atrás do painel
  const bordaMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTempo: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTempo;
      void main(){
        vec2 d = abs(vUv - 0.5) * 2.0;
        float borda = smoothstep(0.80, 0.97, max(d.x * 1.0, d.y * 1.0)) * (1.0 - smoothstep(0.97, 1.0, max(d.x, d.y)));
        float t = vUv.x * 0.6 + vUv.y * 0.4 + sin(uTempo * 0.6) * 0.2;
        vec3 cor = mix(vec3(1.0, 0.36, 0.29), vec3(0.43, 0.89, 1.0), clamp(t, 0.0, 1.0));
        gl_FragColor = vec4(cor, borda * 0.9);
      }`,
  });
  const borda = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 4.37), bordaMat);
  borda.position.z = -0.35;
  painel.add(borda);
  // o painel com a foto saiu: a roda de trabalhos (HTML) ocupa o centro do palco

  /* ---- Fachos de luz ---- */
  const fachoMat = (cor) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uCor: { value: new THREE.Color(cor) }, uForca: { value: 0.3 } },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      uniform vec3 uCor; uniform float uForca;
      void main(){
        float centro = pow(abs(dot(vN, vV)), 1.6);
        float a = pow(vUv.y, 1.4) * centro * uForca;
        gl_FragColor = vec4(uCor, a);
      }`,
  });
  const fachos = [];
  [[0xff5d4a, -2.2, 0.32], [0x6fe3ff, 0.2, 0.0], [0xffc65c, 2.4, -0.3]].forEach(([cor, x, inc]) => {
    const g = new THREE.ConeGeometry(1.9, 8, 64, 1, true);
    g.translate(0, -4, 0);                      // ápice no topo (origem)
    const m = new THREE.Mesh(g, fachoMat(cor));
    m.position.set(x, 4.6, -1.2);
    m.rotation.z = inc;
    m.userData = { base: inc, fase: Math.random() * 6.28 };
    fachos.push(m);
    palco.add(m);
  });

  /* ---- Chão do palco ---- */
  const chao = new THREE.Group();
  chao.position.y = -2.45;
  chao.rotation.x = -Math.PI / 2;
  [1.4, 2.2, 3.1, 4.2].forEach((r, i) => {
    const anel = new THREE.Mesh(
      new THREE.RingGeometry(r, r + 0.015, 128),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x6fe3ff : 0xff5d4a, transparent: true, opacity: 0.35 - i * 0.06, depthWrite: false }));
    chao.add(anel);
  });
  const poca = new THREE.Mesh(new THREE.CircleGeometry(3.6, 64), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; void main(){ float d = distance(vUv, vec2(0.5)); float a = smoothstep(0.5, 0.0, d) * 0.35; gl_FragColor = vec4(1.0, 0.55, 0.4, a); }`,
  }));
  chao.add(poca);
  palco.add(chao);

  /* ---- Poeira na luz ---- */
  const N = innerWidth < 760 ? 380 : 800;
  const pts = new Float32Array(N * 3), vel = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pts[i * 3] = (Math.random() - 0.5) * 9;
    pts[i * 3 + 1] = (Math.random() - 0.5) * 7;
    pts[i * 3 + 2] = (Math.random() - 0.5) * 5;
    vel[i] = 0.002 + Math.random() * 0.006;
  }
  const geoP = new THREE.BufferGeometry();
  geoP.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const ponto = document.createElement('canvas'); ponto.width = ponto.height = 64;
  const ctx = ponto.getContext('2d');
  const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
  const poeira = new THREE.Points(geoP, new THREE.PointsMaterial({
    size: 0.06, map: new THREE.CanvasTexture(ponto), transparent: true, opacity: 0.75,
    depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe3c4,
  }));
  palco.add(poeira);

  /* ---- Formas 3D orbitando ---- */
  const formas = [];
  [[new THREE.IcosahedronGeometry(0.38, 0), 0xff5d4a, 2.6, 0], [new THREE.TorusGeometry(0.32, 0.09, 16, 48), 0x6fe3ff, 2.9, 2.1], [new THREE.OctahedronGeometry(0.3, 0), 0xffc65c, 2.4, 4.2]]
    .forEach(([g, cor, raio, fase]) => {
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: cor, wireframe: true, transparent: true, opacity: 0.9 }));
      m.userData = { raio, fase };
      formas.push(m);
      palco.add(m);
    });

  /* ---- Enquadramento por tamanho de tela ---- */
  function enquadrar() {
    const w = secao.clientWidth, hgt = secao.clientHeight;
    renderer.setSize(w, hgt, false);
    camera.aspect = w / hgt;
    camera.updateProjectionMatrix();
    palco.position.z = camera.aspect > 1.15 ? 0 : -1.5;
    palco.scale.setScalar(camera.aspect > 1.15 ? 0.78 : camera.aspect > 0.8 ? 0.7 : 0.6);
    alinhar();
  }
  // centraliza luz e chão exatamente sob a roda de trabalhos (posição real no DOM)
  function alinhar() {
    const roda = document.getElementById('carrossel');
    if (!roda) return;
    const r = roda.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    if (!r.width || !c.width) return;
    const nx = ((r.left + r.width / 2 - c.left) / c.width) * 2 - 1;
    const ny = -(((r.top + r.height * 0.42 - c.top) / c.height) * 2 - 1);
    const dist = 10 - palco.position.z;
    const meiaAltura = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
    palco.position.x = nx * meiaAltura * camera.aspect;
    palco.position.y = ny * meiaAltura;
  }
  setTimeout(() => { enquadrar(); desenhar(); }, 400);
  document.fonts?.ready.then(() => { enquadrar(); desenhar(); });
  enquadrar();
  addEventListener('resize', () => { enquadrar(); desenhar(); });

  /* ---- Interação ---- */
  const alvo = { x: 0, y: 0 }, atual = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    alvo.x = (e.clientX / innerWidth) * 2 - 1;
    alvo.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  let rolagem = 0;
  addEventListener('scroll', () => { rolagem = Math.min(1, scrollY / Math.max(1, secao.offsetHeight)); }, { passive: true });

  /* ---- Laço ---- */
  const relogio = new THREE.Clock();
  let visivel = true, rodando = false;
  const entrada = { t: reduz ? 1 : 0 };

  function atualizar(dt, t) {
    if (entrada.t < 1) entrada.t = Math.min(1, entrada.t + dt / 1.8);
    const e = 1 - Math.pow(1 - entrada.t, 3);   // ease-out

    atual.x += (alvo.x - atual.x) * 0.05;
    atual.y += (alvo.y - atual.y) * 0.05;

    painel.rotation.y = (1 - e) * -1.3 + atual.x * 0.35 + rolagem * 0.9;
    painel.rotation.x = atual.y * 0.12 + rolagem * 0.25;
    painel.position.y = Math.sin(t * 0.8) * 0.08 - rolagem * 0.6;
    painel.position.z = (1 - e) * -3 - rolagem * 2.5;
    painel.scale.setScalar(0.8 + e * 0.2);
    bordaMat.uniforms.uTempo.value = t;

    fachos.forEach((f, i) => {
      f.rotation.z = f.userData.base + Math.sin(t * 0.5 + f.userData.fase) * 0.18;
      f.material.uniforms.uForca.value = (0.22 + Math.sin(t * 1.3 + i) * 0.05) * e;
    });
    chao.rotation.z = t * 0.05;

    const p = geoP.attributes.position.array;
    for (let i = 0; i < N; i++) {
      p[i * 3 + 1] += vel[i];
      p[i * 3] += Math.sin(t + i) * 0.0015;
      if (p[i * 3 + 1] > 3.5) p[i * 3 + 1] = -3.5;
    }
    geoP.attributes.position.needsUpdate = true;

    formas.forEach((m) => {
      const a = t * 0.35 + m.userData.fase;
      m.position.set(Math.cos(a) * m.userData.raio * 1.65, 1.2 + Math.sin(a * 1.3) * 1.6, -2.8 + Math.sin(a) * 1.2);
      m.rotation.x += dt * 0.6; m.rotation.y += dt * 0.9;
    });

    camera.position.x = atual.x * 0.4;
    camera.position.y = 0.3 - atual.y * 0.25;
    camera.lookAt(0, 0.3, 0);
  }

  function desenhar() { renderer.render(cena, camera); }

  function quadro() {
    if (!visivel || document.hidden) { rodando = false; return; }
    const dt = Math.min(relogio.getDelta(), 0.05);
    atualizar(dt, relogio.elapsedTime);
    desenhar();
    requestAnimationFrame(quadro);
  }
  function ligar() { if (!rodando) { rodando = true; relogio.getDelta(); requestAnimationFrame(quadro); } }

  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) ligar(); }).observe(secao);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ligar(); });

  // com "menos movimento" no sistema a entrada fica sem giro (entrada.t = 1), mas a luz continua viva
  ligar();
}

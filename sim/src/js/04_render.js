// ============================================================
//  描画（低解像度レンダリング → ドット風の後処理）
// ============================================================
const R = {
  renderer: null, scene: null, camera: null, rt: null, post: null, postMat: null,
  pixel: 3, lw: 0, lh: 0, w: 0, h: 0,
  sun: null, hemi: null, amb: null, water: null, clouds: [], rain: null, snow: null,
  matLambert: null, matGlow: null, matIcon: null, texTiles: null, texIcons: null,
  opts: { tilt: 0.8, outline: 1, quality: 'mid', shadows: true },
  sunDir: new THREE.Vector3(),
};
const Cam = { tx: 36, tz: 24, zoom: 1.4, yaw: Math.PI / 4, yawT: Math.PI / 4, rot: 0, pitch: 0.62, viewH: 26, dist: 90, shake: 0 };

function initRender(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  R.renderer = renderer;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#a8d8f0');
  scene.fog = new THREE.Fog('#a8d8f0', 140, 260);
  R.scene = scene;
  R.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 400);

  // ライト
  R.hemi = new THREE.HemisphereLight('#cfe8ff', '#6a8a50', 0.9); scene.add(R.hemi);
  R.sun = new THREE.DirectionalLight('#fff4e0', 1.6);
  R.sun.castShadow = true;
  R.sun.shadow.mapSize.set(2048, 2048);
  const sc = R.sun.shadow.camera; sc.left = -60; sc.right = 60; sc.top = 60; sc.bottom = -60; sc.near = 1; sc.far = 260;
  R.sun.shadow.bias = -0.0008; R.sun.shadow.normalBias = 0.02;
  scene.add(R.sun); scene.add(R.sun.target);

  // 共通マテリアル
  R.matLambert = new THREE.MeshLambertMaterial({ vertexColors: true });
  R.matGlow = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
  R.matGlowBase = []; // 夜の明るさ用
  R.texIcons = canvasTex(makeIconAtlas());
  R.matIcon = new THREE.MeshLambertMaterial({ map: R.texIcons, transparent: false, alphaTest: 0.5 });
  R.texBubbles = canvasTex(makeBubbleAtlas());

  // 水面
  makeWater();
  makeClouds();
  makeWeatherFx();
  makeFarScenery();

  // 後処理
  R.postMat = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(1, 1) },
      tilt: { value: 0.8 }, outline: { value: 1 }, depthRange: { value: 399 }, bloom: { value: 0.25 },
      grade: { value: new THREE.Vector3(1, 1, 1) }, sat: { value: 1.08 }, vig: { value: 0.35 }, flash: { value: 0 }
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
      precision highp float;
      uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 res; uniform float tilt; uniform float outline;
      uniform float depthRange; uniform float bloom; uniform vec3 grade; uniform float sat; uniform float vig; uniform float flash;
      varying vec2 vUv;
      float D(vec2 u){ return texture2D(tDepth, u).x; }
      vec3 C(vec2 u){ return texture2D(tColor, u).rgb; }
      void main(){
        vec2 px = 1.0 / res;
        vec2 uv = (floor(vUv * res) + 0.5) * px;
        vec3 col = C(uv);
        float t = smoothstep(0.2, 0.52, abs(uv.y - 0.52)) * tilt;
        if (t > 0.02) {
          vec3 acc = col; float w = 1.0;
          for (int i = 0; i < 8; i++) { float a = float(i) * 0.7853981; vec2 o = vec2(cos(a), sin(a)) * px * t * 2.2; acc += C(uv + o); w += 1.0; }
          for (int i = 0; i < 6; i++) { float a = float(i) * 1.0471975 + 0.5; vec2 o = vec2(cos(a), sin(a)) * px * t * 4.0; acc += C(uv + o); w += 1.0; }
          col = acc / w;
        }
        if (outline > 0.5) {
          float d = D(uv);
          float dn = max(max(D(uv + vec2(px.x, 0.)) - d, D(uv - vec2(px.x, 0.)) - d), max(D(uv + vec2(0., px.y)) - d, D(uv - vec2(0., px.y)) - d));
          if (dn * depthRange > 0.45 && d < 0.999) col *= 0.58;
        }
        if (bloom > 0.0) {
          vec3 b = vec3(0.);
          for (int i = 0; i < 8; i++) { float a = float(i) * 0.7853981; vec2 o = vec2(cos(a), sin(a)) * px * 2.5;
            vec3 s = C(uv + o); b += max(s - 0.72, 0.0); }
          col += b * bloom * 0.5;
        }
        float l = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(vec3(l), col, sat) * grade;
        vec2 q = vUv - 0.5; col *= 1.0 - dot(q, q) * vig;
        col = mix(col, vec3(1.0), flash);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false
  });
  R.postScene = new THREE.Scene();
  R.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), R.postMat);
  quad.frustumCulled = false;
  R.postScene.add(quad);
  resizeRender();
  window.addEventListener('resize', resizeRender);
}
function canvasTex(c) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function pixelScaleFor(h) {
  const q = R.opts.quality;
  const target = q === 'high' ? 420 : q === 'low' ? 250 : 320;
  return Math.max(1, Math.round(h / target));
}
function resizeRender() {
  const w = window.innerWidth, h = window.innerHeight;
  R.w = w; R.h = h;
  R.renderer.setSize(w, h, false);
  R.renderer.domElement.style.width = w + 'px'; R.renderer.domElement.style.height = h + 'px';
  R.pixel = pixelScaleFor(h);
  const lw = Math.max(64, Math.floor(w / R.pixel)), lh = Math.max(64, Math.floor(h / R.pixel));
  R.lw = lw; R.lh = lh;
  if (R.rt) { R.rt.dispose(); R.rt.depthTexture.dispose(); }
  const dt = new THREE.DepthTexture(lw, lh); dt.type = THREE.UnsignedIntType;
  R.rt = new THREE.WebGLRenderTarget(lw, lh, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, depthTexture: dt });
  R.rt.texture.colorSpace = THREE.SRGBColorSpace;
  R.postMat.uniforms.tColor.value = R.rt.texture;
  R.postMat.uniforms.tDepth.value = dt;
  R.postMat.uniforms.res.value.set(lw, lh);
  updateCamera(true);
}
function setQuality(q) { R.opts.quality = q; resizeRender(); }

// ---------- カメラ ----------
function updateCamera(force) {
  const c = R.camera;
  const aspect = R.w / Math.max(1, R.h);
  Cam.yaw += (Cam.yawT - Cam.yaw) * (force ? 1 : 0.18);
  if (Math.abs(Cam.yawT - Cam.yaw) < 0.0005) Cam.yaw = Cam.yawT;
  const halfH = Cam.viewH / Cam.zoom / 2;
  c.top = halfH; c.bottom = -halfH; c.left = -halfH * aspect; c.right = halfH * aspect;
  c.near = 1; c.far = 400;
  // ピクセルにそろえる（ちらつき防止）
  const pw = (2 * halfH) / R.lh;
  const sy = Math.sin(Cam.yaw), cy = Math.cos(Cam.yaw);
  const rx = cy, rz = -sy;              // 右
  const fx = -sy, fz = -cy;             // 奥
  let a = Cam.tx * rx + Cam.tz * rz, b = Cam.tx * fx + Cam.tz * fz;
  if (Cam.yaw === Cam.yawT) { a = Math.round(a / pw) * pw; b = Math.round(b / (pw / Math.sin(Cam.pitch))) * (pw / Math.sin(Cam.pitch)); }
  let tx = rx * a + fx * b, tz = rz * a + fz * b;
  if (Cam.shake > 0) { tx += (Math.random() - 0.5) * Cam.shake; tz += (Math.random() - 0.5) * Cam.shake; }
  const cp = Math.cos(Cam.pitch), sp = Math.sin(Cam.pitch);
  c.position.set(tx + sy * cp * Cam.dist, sp * Cam.dist, tz + cy * cp * Cam.dist);
  c.lookAt(tx, 0, tz);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  R.postMat.uniforms.depthRange.value = c.far - c.near;
}
function rotateCam(d) { Cam.rot = (Cam.rot + d + 4) % 4; Cam.yawT += d * Math.PI / 2; Sound.se('tab'); }
function clampCam() {
  Cam.tx = clamp(Cam.tx, -4, W + 4); Cam.tz = clamp(Cam.tz, -4, H + 4);
  Cam.zoom = clamp(Cam.zoom, 0.55, 4.5);
}
function panCam(dxPix, dyPix) {
  // 画面のピクセル移動 → 地面の移動
  const halfH = Cam.viewH / Cam.zoom / 2;
  const wpp = (2 * halfH) / R.h;
  const sy = Math.sin(Cam.yaw), cy = Math.cos(Cam.yaw);
  const rx = cy, rz = -sy, fx = -sy, fz = -cy;
  const k = 1 / Math.sin(Cam.pitch);
  Cam.tx -= (rx * dxPix - fx * dyPix * k) * wpp;
  Cam.tz -= (rz * dxPix - fz * dyPix * k) * wpp;
  clampCam();
}
const _ray = new THREE.Raycaster(), _v2 = new THREE.Vector2(), _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _hit = new THREE.Vector3();
function screenToGround(sx, sy, y) {
  _v2.set(sx / R.w * 2 - 1, -(sy / R.h) * 2 + 1);
  _ray.setFromCamera(_v2, R.camera);
  _plane.constant = -(y || 0);
  if (!_ray.ray.intersectPlane(_plane, _hit)) return null;
  return { x: _hit.x, z: _hit.z };
}
const _pv = new THREE.Vector3();
function worldToScreen(x, y, z) {
  _pv.set(x, y, z).project(R.camera);
  return { x: (_pv.x + 1) / 2 * R.w, y: (1 - _pv.y) / 2 * R.h, vis: _pv.z < 1 && _pv.z > -1 };
}

// ---------- 水・雲・天気 ----------
function makeWater() {
  const geo = new THREE.PlaneGeometry(520, 520, 1, 1); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, deep: { value: new THREE.Color('#2f8fc0') }, shallow: { value: new THREE.Color('#5cc8e0') }, bg: { value: new THREE.Color('#a8d8f0') }, night: { value: 0 }, center: { value: new THREE.Vector2(W / 2, H / 2) } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform float time; uniform vec3 deep; uniform vec3 shallow; uniform vec3 bg; uniform float night; uniform vec2 center;
      varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec2 p = floor(vW.xz * 4.0) / 4.0;
        float dx = max(max(-p.x, p.x - ${W}.0), 0.0), dz = max(max(-p.y, p.y - ${H}.0), 0.0);
        float far = length(vec2(dx, dz));
        vec3 c = mix(shallow, deep, smoothstep(0.0, 14.0, far));
        float w = sin(p.x * 0.9 + time * 1.3) + sin(p.y * 1.1 - time * 1.1) + sin((p.x + p.y) * 0.5 + time * 0.7);
        if (w > 2.1) c = mix(c, vec3(1.0), 0.55);
        else if (w > 1.5) c *= 1.08;
        float s = h(p + floor(time * 2.0));
        if (s > 0.996) c = mix(c, vec3(1.0), 0.8 * (1.0 - night * 0.6));
        c *= mix(1.0, 0.32, night);
        c = mix(c, bg, smoothstep(40.0, 110.0, far));
        gl_FragColor = vec4(c, 1.0);
      }`
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(W / 2, -0.22, H / 2);
  m.receiveShadow = false;
  R.water = m; R.scene.add(m);
}
function makeClouds() {
  // 影だけ落とす雲（画面はふさがない）
  const mat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    const n = rndi(4, 7);
    for (let k = 0; k < n; k++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(rnd(2, 4), 1.5, rnd(2, 3.5)), mat);
      b.position.set(rnd(-3, 3), 0, rnd(-2, 2)); b.castShadow = true; g.add(b);
    }
    g.position.set(rnd(-20, W + 20), 22, rnd(-20, H + 20));
    g.userData.v = rnd(0.4, 0.8);
    R.clouds.push(g); R.scene.add(g);
  }
}
function makeWeatherFx() {
  const mk = (n, col, size) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = rnd(-30, 30); pos[i * 3 + 1] = rnd(0, 30); pos[i * 3 + 2] = rnd(-30, 30); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.Points(geo, new THREE.PointsMaterial({ color: col, size, sizeAttenuation: false, transparent: true, opacity: 0.8, fog: false }));
    m.visible = false; m.frustumCulled = false; R.scene.add(m); return m;
  };
  R.rain = mk(1600, '#c8e4ff', 2);
  R.snow = mk(1200, '#ffffff', 3);
  // 花火・紙吹雪用
  R.fx = mk(1, '#ffffff', 2); // ダミー
}
function makeFarScenery() {
  // 遠くの島と山（雰囲気）
  const mb = new ModelBuilder();
  const rng = mulberry32(99);
  const isl = [[-46, -30, 18], [W + 40, -24, 14], [-40, H + 30, 12], [W + 50, H + 40, 20], [W / 2 + 10, -60, 26], [W / 2 - 60, H + 60, 16]];
  for (const [x, z, s] of isl) {
    mb.cyl(x, -0.6, z, s, s * 0.9, 1.0, '#e8d098', 10);
    for (let k = 0; k < 4; k++) {
      const r = s * (0.7 - k * 0.15);
      mb.cyl(x + (rng() - 0.5) * 3, 0.4 + k * s * 0.18, z + (rng() - 0.5) * 3, r, r * 0.8, s * 0.2, ['#5aa04a', '#4a9040', '#3e8038', '#367030'][k], 9);
    }
  }
  const m = mb.build(); m.receiveShadow = false; m.castShadow = false;
  R.scene.add(m);
}

// ---------- 時間と光 ----------
const _c1 = new THREE.Color(), _c2 = new THREE.Color(), _c3 = new THREE.Color();
function lerpCol(a, b, t) { return _c3.set(a).lerp(_c2.set(b), t); }
function updateLighting(minute, weather, season, dtReal) {
  const h = minute / 60;
  const rise = [5.6, 5.0, 5.8, 6.5][season], set = [18.2, 19.0, 17.6, 17.0][season];
  // 0=夜 1=昼
  let day = h < rise - 0.8 ? 0 : h < rise + 0.8 ? smooth((h - (rise - 0.8)) / 1.6) : h < set - 0.8 ? 1 : h < set + 0.9 ? 1 - smooth((h - (set - 0.8)) / 1.7) : 0;
  const golden = Math.max(0, 1 - Math.abs(h - (set - 0.2)) / 1.3) + Math.max(0, 1 - Math.abs(h - (rise + 0.2)) / 1.1) * 0.7;
  const wdim = { sun: 1, cloud: 0.72, rain: 0.55, snow: 0.7, fog: 0.62, typhoon: 0.38 }[weather] || 1;
  RT.nightF = 1 - day; RT.dayLight = day;
  // 太陽の向き
  const t = clamp((h - rise) / (set - rise), 0, 1);
  const az = lerp(-1.2, 1.2, t), el = Math.sin(t * Math.PI) * 0.95 + 0.25;
  const sx = Math.sin(az) * 60, sz = -Math.cos(az) * 30 - 30, syy = el * 70 + 10;
  if (day < 0.05) { R.sunDir.set(-20, 60, -40); } else R.sunDir.set(sx, syy, sz);
  R.sun.position.set(Cam.tx + R.sunDir.x, R.sunDir.y, Cam.tz + R.sunDir.z);
  R.sun.target.position.set(Cam.tx, 0, Cam.tz);
  const sunCol = lerpCol('#fff1dc', '#ffa060', clamp(golden, 0, 1) * 0.9).clone();
  const moon = new THREE.Color('#7d8fd0');
  R.sun.color.copy(sunCol.lerp(moon, 1 - day));
  R.sun.intensity = lerp(0.35, 1.5, day) * (0.55 + 0.45 * wdim);
  R.hemi.color.copy(lerpCol('#3a4a8a', '#d2ecff', day));
  R.hemi.groundColor.copy(lerpCol('#141c30', '#7a8a58', day));
  R.hemi.intensity = lerp(0.6, 1.25, day) * (0.75 + 0.25 * wdim);
  // 空・霧の色
  let bg = lerpCol('#0c1430', '#a8d8f0', day).clone();
  bg.lerp(_c1.set('#f0a080'), clamp(golden, 0, 1) * 0.55 * day + golden * 0.25 * (1 - day));
  if (weather !== 'sun') bg.lerp(_c1.set(RT.nightF > 0.5 ? '#202430' : '#b8c0c8'), 1 - wdim + 0.1);
  R.scene.background.copy(bg);
  R.scene.fog.color.copy(bg);
  const fogNear = weather === 'fog' ? 60 : weather === 'typhoon' ? 90 : 140;
  R.scene.fog.near += (fogNear - R.scene.fog.near) * 0.05; R.scene.fog.far = R.scene.fog.near + (weather === 'fog' ? 50 : 120);
  R.water.material.uniforms.bg.value.copy(bg);
  R.water.material.uniforms.night.value = RT.nightF * 0.85;
  R.water.material.uniforms.time.value += dtReal;
  // 色調
  const g = R.postMat.uniforms.grade.value;
  g.set(1 + golden * 0.06, 1, 1 - golden * 0.05);
  if (RT.nightF > 0) { g.x *= 1 - RT.nightF * 0.08; g.z *= 1 + RT.nightF * 0.1; }
  R.postMat.uniforms.sat.value = weather === 'fog' ? 0.8 : weather === 'rain' || weather === 'typhoon' ? 0.9 : 1.1;
  R.postMat.uniforms.bloom.value = 0.18 + RT.nightF * 0.9;
  R.postMat.uniforms.tilt.value = R.opts.tilt;
  R.postMat.uniforms.outline.value = R.opts.outline;
  // 夜の光
  const glow = clamp(RT.nightF * 1.3, 0, 1);
  GlowMat().uniforms.night.value = glow;
  // 雲
  for (const cl of R.clouds) {
    cl.position.x += cl.userData.v * dtReal * (weather === 'typhoon' ? 6 : 1);
    if (cl.position.x > W + 50) { cl.position.x = -50; cl.position.z = rnd(-10, H + 10); }
    cl.visible = (weather === 'cloud' || weather === 'rain' || weather === 'snow') && cl.userData.v > 0.55;
  }
  // 雨・雪
  R.rain.visible = weather === 'rain' || weather === 'typhoon';
  R.snow.visible = weather === 'snow';
  const sd = R.sunDir;
  R.sun.shadow.camera.updateProjectionMatrix();
  for (const P of [R.rain, R.snow]) {
    if (!P.visible) continue;
    P.position.set(Cam.tx, 0, Cam.tz);
    const a = P.geometry.attributes.position, arr = a.array;
    const isSnow = P === R.snow, wind = weather === 'typhoon' ? 18 : 2;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] -= dtReal * (isSnow ? 3 : 32);
      arr[i] += dtReal * (isSnow ? Math.sin(arr[i + 1] + i) * 0.8 : wind);
      if (arr[i + 1] < 0) { arr[i + 1] = 30; arr[i] = rnd(-30, 30); arr[i + 2] = rnd(-30, 30); }
      if (arr[i] > 30) arr[i] -= 60;
    }
    a.needsUpdate = true;
  }
}

function renderFrame() {
  const r = R.renderer;
  r.setRenderTarget(R.rt);
  r.render(R.scene, R.camera);
  r.setRenderTarget(null);
  r.render(R.postScene, R.postCam);
}

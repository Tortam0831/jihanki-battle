// ============================================================
//  サウンド（WebAudio で全部その場で作る）
// ============================================================
const Sound = {
  ctx: null, master: null, bgmGain: null, seGain: null, noiseBuf: null, pulse25: null, pulse12: null,
  vol: { bgm: 0.45, se: 0.7 }, cur: null, song: null, step: 0, nextT: 0, timer: null, lastSe: {},
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
    this.bgmGain = c.createGain(); this.bgmGain.gain.value = this.vol.bgm; this.bgmGain.connect(this.master);
    this.seGain = c.createGain(); this.seGain.gain.value = this.vol.se; this.seGain.connect(this.master);
    // ちょっとだけ響き（ディレイ）
    this.delay = c.createDelay(); this.delay.delayTime.value = 0.27;
    this.fb = c.createGain(); this.fb.gain.value = 0.22;
    this.wet = c.createGain(); this.wet.gain.value = 0.25;
    this.delay.connect(this.fb); this.fb.connect(this.delay); this.delay.connect(this.wet); this.wet.connect(this.bgmGain);
    const n = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, n, n);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.pulse25 = this.makePulse(0.25); this.pulse12 = this.makePulse(0.125);
    if (this.want) { const w = this.want; this.want = null; this.bgm(w); }
  },
  makePulse(duty) {
    const N = 32, re = new Float32Array(N), im = new Float32Array(N);
    for (let k = 1; k < N; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return this.ctx.createPeriodicWave(re, im);
  },
  setVol(kind, v) {
    this.vol[kind] = v;
    if (!this.ctx) return;
    (kind === 'bgm' ? this.bgmGain : this.seGain).gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  },
  freq(name) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(name); if (!m) return 440;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const midi = (parseInt(m[3]) + 1) * 12 + base;
    return 440 * Math.pow(2, (midi - 69) / 12);
  },
  tone(t, f, dur, type, vol, dest, opt) {
    const c = this.ctx; opt = opt || {};
    const o = c.createOscillator(), g = c.createGain();
    if (type === 'p25') o.setPeriodicWave(this.pulse25); else if (type === 'p12') o.setPeriodicWave(this.pulse12); else o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (opt.slide) o.frequency.exponentialRampToValueAtTime(opt.slide, t + dur);
    if (opt.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.1); l.stop(t + dur + 0.1); }
    const a = opt.a || 0.006, r = opt.r || Math.min(0.12, dur * 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol * (opt.sus || 0.7), t + Math.max(a, dur - r));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + r);
    o.connect(g); g.connect(dest || this.seGain);
    if (opt.send) g.connect(this.delay);
    o.start(t); o.stop(t + dur + r + 0.02);
  },
  noise(t, dur, vol, hp, lp, dest, opt) {
    const c = this.ctx; opt = opt || {};
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const g = c.createGain(); let node = s;
    if (hp) { const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; node.connect(f); node = f; }
    if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(lp, t); if (opt.lpTo) f.frequency.exponentialRampToValueAtTime(opt.lpTo, t + dur); node.connect(f); node = f; }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (opt.a || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g); g.connect(dest || this.seGain);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  se(name) {
    if (!this.ctx || this.vol.se <= 0) return;
    const now = this.ctx.currentTime;
    if (this.lastSe[name] && now - this.lastSe[name] < 0.05) return;
    this.lastSe[name] = now;
    const t = now + 0.01, F = n => this.freq(n);
    switch (name) {
      case 'click': this.tone(t, F('E6'), 0.03, 'square', 0.08); break;
      case 'tab': this.tone(t, F('A5'), 0.03, 'p25', 0.08); this.tone(t + 0.03, F('E6'), 0.03, 'p25', 0.06); break;
      case 'open': this.tone(t, F('C5'), 0.05, 'p25', 0.1); this.tone(t + 0.05, F('G5'), 0.07, 'p25', 0.1); break;
      case 'close': this.tone(t, F('G5'), 0.05, 'p25', 0.08); this.tone(t + 0.05, F('C5'), 0.07, 'p25', 0.08); break;
      case 'place':
        this.noise(t, 0.08, 0.25, 0, 900); this.tone(t, F('C3'), 0.08, 'triangle', 0.4, null, { slide: 60 });
        this.tone(t + 0.06, F('E6'), 0.05, 'p25', 0.07); this.tone(t + 0.1, F('B6'), 0.06, 'p25', 0.06); break;
      case 'paint': this.tone(t, F('G4') * (0.95 + Math.random() * 0.1), 0.03, 'triangle', 0.15); break;
      case 'demolish': this.noise(t, 0.35, 0.35, 0, 1500, null, { lpTo: 200 }); this.tone(t, 120, 0.3, 'square', 0.12, null, { slide: 40 }); break;
      case 'error': this.tone(t, 160, 0.12, 'square', 0.12); this.tone(t + 0.13, 120, 0.16, 'square', 0.12); break;
      case 'coin': this.tone(t, F('B5'), 0.06, 'square', 0.1); this.tone(t + 0.06, F('E6'), 0.18, 'square', 0.1); break;
      case 'money': for (let i = 0; i < 3; i++) this.tone(t + i * 0.05, F(['E6', 'G6', 'C7'][i]), 0.06, 'p25', 0.08); break;
      case 'chime': // ピンポンパンポーン
        ['F5', 'A5', 'C6', 'F6'].forEach((n, i) => this.tone(t + i * 0.32, F(n), 0.5, 'sine', 0.22, null, { r: 0.3 })); break;
      case 'chime2':
        ['F6', 'C6', 'A5', 'F5'].forEach((n, i) => this.tone(t + i * 0.32, F(n), 0.5, 'sine', 0.2, null, { r: 0.3 })); break;
      case 'levelup':
        ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => this.tone(t + i * 0.07, F(n), 0.12, 'p25', 0.12));
        this.tone(t + 0.45, F('C6'), 0.5, 'p25', 0.12, null, { vib: true }); this.tone(t + 0.45, F('E5'), 0.5, 'triangle', 0.2); break;
      case 'combo':
        ['G5', 'C6', 'E6', 'G6', 'C7'].forEach((n, i) => this.tone(t + i * 0.05, F(n), 0.1, 'p12', 0.1)); break;
      case 'notify': this.tone(t, F('A5'), 0.06, 'sine', 0.15); this.tone(t + 0.08, F('D6'), 0.12, 'sine', 0.15); break;
      case 'bad': this.tone(t, F('E4'), 0.12, 'p25', 0.1); this.tone(t + 0.13, F('C4'), 0.2, 'p25', 0.1); break;
      case 'jet': this.noise(t, 2.2, 0.12, 200, 2500, null, { a: 0.6, lpTo: 600 }); break;
      case 'prop': this.noise(t, 1.6, 0.08, 100, 900, null, { a: 0.4 }); this.tone(t, 70, 1.4, 'sawtooth', 0.03); break;
      case 'land': this.noise(t, 0.12, 0.12, 2000, 6000); break;
      case 'talk': this.tone(t, F('C5') * (1 + Math.random() * 0.2), 0.025, 'p25', 0.05); break;
      case 'stamp': this.noise(t, 0.1, 0.4, 0, 600); this.tone(t, 90, 0.1, 'triangle', 0.4); break;
      case 'firework': this.tone(t, 300, 0.6, 'sine', 0.05, null, { slide: 1200 }); this.noise(t + 0.6, 0.8, 0.3, 0, 3000, null, { lpTo: 300 }); break;
      case 'train': for (let i = 0; i < 4; i++) this.noise(t + i * 0.25, 0.12, 0.12, 200, 1200); break;
      case 'shutter': this.noise(t, 0.05, 0.3, 1000, 0); this.noise(t + 0.08, 0.05, 0.25, 1000, 0); break;
    }
  },
  // ---------- BGM ----------
  bgm(name) {
    if (!this.ctx) { this.want = name; return; }
    if (this.cur === name) return;
    this.cur = name; this.song = SONGS[name] ? compileSong(SONGS[name]) : null; this.step = 0;
    this.nextT = this.ctx.currentTime + 0.1;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 30);
  },
  tick() {
    if (!this.song || !this.ctx || this.vol.bgm <= 0) { if (this.ctx) this.nextT = this.ctx.currentTime + 0.05; return; }
    const S = this.song, sd = 60 / S.bpm / 4;
    while (this.nextT < this.ctx.currentTime + 0.15) {
      const st = this.step % S.len, t = this.nextT;
      for (const ev of S.events[st] || []) {
        if (ev.drum) {
          if (ev.drum === 'k') { this.tone(t, 150, 0.09, 'sine', 0.35, this.bgmGain, { slide: 45 }); }
          else if (ev.drum === 's') { this.noise(t, 0.12, 0.14, 1200, 0, this.bgmGain); }
          else if (ev.drum === 'h') { this.noise(t, 0.03, 0.05, 6000, 0, this.bgmGain); }
        } else {
          this.tone(t, ev.f, ev.len * sd * 0.92, ev.inst, ev.vol, this.bgmGain, { send: ev.send, vib: ev.vib, sus: ev.sus });
        }
      }
      this.nextT += sd; this.step++;
    }
  }
};

// 曲データ：コード進行＋メロディ
const CHORDS = {
  C: ['C', 'E', 'G'], Am: ['A', 'C', 'E'], F: ['F', 'A', 'C'], G: ['G', 'B', 'D'], Em: ['E', 'G', 'B'], Dm: ['D', 'F', 'A'],
  E: ['E', 'G#', 'B'], D: ['D', 'F#', 'A'], Bb: ['Bb', 'D', 'F'], G7: ['G', 'B', 'F'], Fm: ['F', 'Ab', 'C'], A: ['A', 'C#', 'E'], Bm: ['B', 'D', 'F#']
};
const SONGS = {
  title: {
    bpm: 92, chords: 'F G Em Am Dm G C C',
    mel: 'C5.2 F5.2 A5.4 G5.2 F5.2 | E5.2 D5.2 G5.4 r.4 D5.2 E5.2 | G5.4 E5.2 B4.2 E5.4 G5.2 A5.2 | A5.8 E5.4 C5.4 | D5.2 F5.2 A5.4 C6.4 A5.2 G5.2 | G5.4 F5.2 E5.2 D5.4 B4.4 | C5.2 E5.2 G5.4 C6.4 B5.2 G5.2 | C6.12 r.4',
    lead: 'p25', arp: true, drums: 'soft', bassPat: 'long'
  },
  day: {
    bpm: 116, chords: 'C Am F G F G C C',
    mel: 'E5.2 G5.2 C6.4 B5.2 G5.2 E5.4 | A5.4 G5.2 E5.2 C5.4 D5.4 | F5.2 A5.2 C6.4 A5.2 F5.2 G5.4 | G5.6 r.2 D5.2 E5.2 F5.2 G5.2 | A5.4 G5.2 F5.2 E5.4 F5.4 | G5.4 F5.2 E5.2 D5.4 G4.4 | E5.2 D5.2 C5.4 E5.2 G5.2 C6.4 | C6.8 r.8',
    mel2: 'C6.2 B5.2 A5.4 G5.2 E5.2 G5.4 | A5.2 B5.2 C6.4 E5.4 r.4 | F5.2 G5.2 A5.4 C6.2 A5.2 F5.4 | D5.4 G5.4 B5.4 D6.4 | C6.4 A5.2 F5.2 C5.4 F5.4 | D5.2 E5.2 F5.2 G5.2 B5.4 D6.4 | C6.2 G5.2 E5.4 G5.2 E5.2 D5.4 | C5.8 r.8',
    lead: 'p25', arp: true, drums: 'pop', bassPat: 'bounce'
  },
  day2: {
    bpm: 104, chords: 'F C Dm Bb F C Bb C',
    mel: 'A5.4 C6.2 A5.2 G5.4 F5.4 | E5.2 F5.2 G5.4 C5.8 | D5.2 E5.2 F5.4 A5.4 D6.4 | D6.4 C6.2 Bb5.2 A5.4 F5.4 | A5.2 Bb5.2 C6.4 F6.4 C6.4 | C6.2 Bb5.2 A5.2 G5.2 E5.4 C5.4 | D5.2 F5.2 Bb5.4 D6.2 C6.2 Bb5.4 | C6.12 r.4',
    lead: 'p12', arp: true, drums: 'pop', bassPat: 'walk'
  },
  night: {
    bpm: 80, chords: 'Am F C G F Em Dm E',
    mel: 'E5.6 A5.2 C6.4 B5.4 | A5.8 F5.8 | G5.6 E5.2 C5.4 E5.4 | D5.12 r.4 | C5.4 F5.4 A5.4 C6.4 | B5.6 G5.2 E5.8 | F5.4 E5.4 D5.4 C5.4 | B4.12 r.4',
    lead: 'triangle', arp: true, drums: 'none', bassPat: 'long', soft: true
  },
  event: {
    bpm: 136, chords: 'C F G C Am F G C',
    mel: 'G5.2 G5.2 C6.2 G5.2 E5.2 G5.2 C6.4 | A5.2 A5.2 C6.2 A5.2 F5.2 A5.2 C6.4 | B5.2 B5.2 D6.2 B5.2 G5.2 B5.2 D6.4 | C6.4 G5.4 C6.8 | E6.2 E6.2 D6.2 C6.2 B5.2 A5.2 G5.4 | F5.2 G5.2 A5.2 C6.2 F6.4 E6.2 D6.2 | D6.2 C6.2 B5.2 A5.2 G5.2 A5.2 B5.4 | C6.8 G5.4 C6.4',
    lead: 'p25', arp: true, drums: 'march', bassPat: 'bounce'
  },
  ending: {
    bpm: 76, chords: 'F G Em Am Dm G C C F G Em Am Dm G C C',
    mel: 'C5.2 F5.2 A5.4 G5.2 F5.2 | E5.2 D5.2 G5.4 r.4 D5.2 E5.2 | G5.4 E5.2 B4.2 E5.4 G5.2 A5.2 | A5.8 E5.4 C5.4 | D5.2 F5.2 A5.4 C6.4 A5.2 G5.2 | G5.4 F5.2 E5.2 D5.4 B4.4 | C5.2 E5.2 G5.4 C6.4 B5.2 G5.2 | C6.12 r.4 | A5.4 C6.4 F6.4 E6.2 D6.2 | D6.4 B5.4 G5.8 | G5.4 B5.4 E6.4 D6.2 C6.2 | C6.8 A5.8 | A5.4 F5.4 D5.4 F5.4 | G5.4 B5.4 D6.4 F6.4 | E6.4 C6.4 G5.4 E5.4 | C6.16',
    lead: 'p25', arp: true, drums: 'soft', bassPat: 'long'
  },
  space: {
    bpm: 100, chords: 'Am Em F C Dm Am Bb E',
    mel: 'A5.4 E6.4 C6.4 B5.4 | G5.4 B5.4 E6.8 | F5.4 A5.4 C6.4 F6.4 | E6.8 G5.8 | F5.4 A5.4 D6.4 F6.4 | E6.4 C6.4 A5.8 | Bb5.4 D6.4 F6.4 D6.4 | E6.12 r.4',
    lead: 'p12', arp: true, drums: 'soft', bassPat: 'long'
  }
};
function compileSong(S) {
  const F = n => Sound.freq(n);
  const chords = S.chords.split(/\s+/);
  const len = chords.length * 16;
  const events = new Array(len).fill(0).map(() => []);
  const addMel = (str, vol, inst, offsetBars, octShift) => {
    let st = (offsetBars || 0) * 16;
    for (const tok of str.replace(/\|/g, ' ').split(/\s+/).filter(Boolean)) {
      const [n, l] = tok.split('.'); const L = parseInt(l) || 2;
      if (n !== 'r' && st < len) {
        let f = F(n); if (octShift) f *= Math.pow(2, octShift);
        events[st].push({ f, len: L, inst, vol, send: true, vib: L >= 6, sus: 0.6 });
      }
      st += L;
    }
  };
  const melVol = S.soft ? 0.09 : 0.075;
  addMel(S.mel, melVol, S.lead);
  // 2周目のメロディがあれば交互に…今回は簡単に：mel2 は 1オクターブ下のハモリとして重ねる
  if (S.mel2) { /* 長さ2倍にする */ }
  chords.forEach((ch, bi) => {
    const notes = CHORDS[ch] || CHORDS.C, b0 = bi * 16;
    const root = notes[0];
    // ベース
    const bv = S.soft ? 0.16 : 0.2;
    if (S.bassPat === 'long') {
      events[b0].push({ f: F(root + '2'), len: 8, inst: 'triangle', vol: bv });
      events[b0 + 8].push({ f: F(notes[2] + '2'), len: 8, inst: 'triangle', vol: bv * 0.9 });
    } else if (S.bassPat === 'walk') {
      [root + '2', notes[1] + '2', notes[2] + '2', notes[1] + '2'].forEach((n, i) => events[b0 + i * 4].push({ f: F(n), len: 3, inst: 'triangle', vol: bv }));
    } else {
      [0, 4, 6, 8, 12, 14].forEach((s, i) => events[b0 + s].push({ f: F((i % 3 === 1 ? notes[2] : root) + (i === 3 ? '3' : '2')), len: 2, inst: 'triangle', vol: bv }));
    }
    // アルペジオ
    if (S.arp) {
      const seq = [notes[0] + '4', notes[1] + '4', notes[2] + '4', notes[1] + '4'];
      for (let s = 0; s < 16; s += 2) events[b0 + s].push({ f: F(seq[(s / 2) % 4]), len: 1.5, inst: 'p12', vol: S.soft ? 0.035 : 0.03 });
    }
    // ドラム
    for (let s = 0; s < 16; s++) {
      const d = S.drums;
      if (d === 'pop') { if (s === 0 || s === 8 || s === 10) events[b0 + s].push({ drum: 'k' }); if (s === 4 || s === 12) events[b0 + s].push({ drum: 's' }); if (s % 2 === 0) events[b0 + s].push({ drum: 'h' }); }
      if (d === 'soft') { if (s === 0) events[b0 + s].push({ drum: 'k' }); if (s % 4 === 2) events[b0 + s].push({ drum: 'h' }); }
      if (d === 'march') { if (s % 4 === 0) events[b0 + s].push({ drum: 'k' }); if (s === 4 || s === 12 || s === 14) events[b0 + s].push({ drum: 's' }); if (s % 2 === 1) events[b0 + s].push({ drum: 'h' }); }
    }
  });
  if (S.mel2) {
    // mel2 があれば曲を2倍にして後半に入れる
    const ev2 = events.map(e => e.filter(x => !x.send || x.inst !== S.lead).slice());
    const all = events.concat(ev2);
    const tmp = { events: all, len: len * 2 };
    let st = len;
    for (const tok of S.mel2.replace(/\|/g, ' ').split(/\s+/).filter(Boolean)) {
      const [n, l] = tok.split('.'); const L = parseInt(l) || 2;
      if (n !== 'r' && st < len * 2) all[st].push({ f: F(n), len: L, inst: S.lead, vol: melVol, send: true, vib: L >= 6, sus: 0.6 });
      st += L;
    }
    return { bpm: S.bpm, len: tmp.len, events: tmp.events };
  }
  return { bpm: S.bpm, len, events };
}

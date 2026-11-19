/* ══════════════════════════════════════════════════════════════════
   RITNOME — our conga groove, as a small player any page can show.
   Three congas: tumba (low, the pulse on every beat), conga (middle,
   heel-tip-slap pattern) and quinto (high, the dembow accents and the
   rolls). Every sound is made here from the shape of a drum skin — no
   recordings. The same groove as Cognitivo Gym's Ritnome station.

   RITNOME.mount(el, {bpm, lang})  draws the drums + a "touch to play" button in el
   RITNOME.set(bpm)                plays at another speed (lands on the next note)
   RITNOME.stop()                  stops the drums (call it when leaving the screen)
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var SR = 44100, actx = null, master = null, BUF = null;
  var F0 = [178, 233, 311];
  var MODES = [[1.00,1.00,1.0],[1.59,.55,.55],[2.14,.32,.40],[2.30,.22,.35],[2.65,.14,.28],[2.92,.09,.22]];
  var KIND = {open:{dur:.55,dec:.20}, slap:{dur:.22,dec:.045}, tip:{dur:.08,dec:.018}, heel:{dur:.09,dec:.022}};
  var seed = 7; function rnd(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647 }

  function bandNoise(n, f0, q){
    var out = new Float32Array(n), w = 2*Math.PI*f0/SR, al = Math.sin(w)/(2*q), b0 = al, b2 = -al, a0 = 1+al, a1 = -2*Math.cos(w), a2 = 1-al, x1=0,x2=0,y1=0,y2=0;
    for (var i = 0; i < n; i++){ var x = rnd()*2-1, y = (b0*x + b2*x2 - a1*y1 - a2*y2)/a0; x2=x1; x1=x; y2=y1; y1=y; out[i]=y }
    return out;
  }
  function makeStroke(d, kind, variant){
    var k = KIND[kind], n = Math.floor(SR*k.dur), y = new Float32Array(n), f0 = F0[d]*(1+(variant-.5)*.008), i;
    for (var m = 0; m < MODES.length; m++){
      var r = MODES[m][0], a = MODES[m][1], tau = k.dec*MODES[m][2], ph = rnd()*6.28;
      for (i = 0; i < n; i++){ var t = i/SR; ph += 2*Math.PI*f0*r*(1+.06*Math.exp(-t/.015))/SR; y[i] += a*Math.sin(ph)*Math.exp(-t/tau) }
    }
    for (i = 0; i < n; i++) y[i] *= 1-Math.exp(-(i/SR)/.0012);
    var nm, amp, fc, td;
    if (kind === 'slap'){ nm=.06; amp=2.4; fc=3000; td=.012; for (i = 0; i < n; i++) y[i] *= .8 }
    else if (kind === 'open'){ nm=.02; amp=.5; fc=1800; td=.004 }
    else { nm=.015; amp=.4; fc=1300; td=.003 }
    var m2 = Math.floor(SR*nm), nz = bandNoise(m2, fc, .8);
    for (i = 0; i < m2 && i < n; i++) y[i] += nz[i]*amp*Math.exp(-(i/SR)/td);
    if (kind === 'tip') for (i = 0; i < n; i++) y[i] *= .35;
    if (kind === 'heel') for (i = 0; i < n; i++) y[i] *= .45;
    var b = actx.createBuffer(1, n, SR); b.getChannelData(0).set(y); return b;
  }
  function audio(){
    if (actx) return true;
    try {
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return false;
      actx = new A();
      var comp = actx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
      master = actx.createGain(); master.gain.value = .55; master.connect(comp); comp.connect(actx.destination);
      BUF = {}; ['open','slap','tip','heel'].forEach(function(k){ BUF[k] = [0,1,2].map(function(d){ return [makeStroke(d,k,.2), makeStroke(d,k,.8)] }) });
      return true;
    } catch(e){ actx = null; return false }
  }

  // ── The groove, one bar (16 sixteenths) at a time; a .5 position is a 32nd (rolls) ──
  var TUMBAO = [[0,'heel',.7],[2,'tip',.6],[4,'slap',.9],[6,'tip',.6],[8,'heel',.7],[10,'tip',.6],[12,'open',.85],[14,'open',.85]];
  function barEvents(k){
    var ev = [], last = k % 4 === 3;
    for (var q = 0; q < 4; q++) if (!(last && q === 3)) ev.push([q*4, 0, 'open', .95]);
    TUMBAO.forEach(function(e){ if (!(last && e[0] >= 12)) ev.push([e[0], 1, e[1], e[2]]) });
    [3,6,11,14].forEach(function(p){ if (!(last && p >= 12)) ev.push([p, 2, 'slap', .75]) });
    if (k % 2 === 1 && !last){ ev.push([15, 2, 'open', .55]); ev.push([15.5, 2, 'slap', .65]) }
    if (last) for (var i = 0; i < 8; i++) ev.push([12 + i*.5, [2,2,2,1,1,1,0,0][i], i % 2 ? 'slap' : 'open', .4 + .6*i/7]);
    return ev;
  }

  var bpm = 90, running = false, step = 0, nextTime = 0, timer = null, bar = [], ui = null;
  function play(d, kind, vel, when){
    var s = actx.createBufferSource(), g = actx.createGain();
    s.buffer = BUF[kind][d][rnd() < .5 ? 0 : 1]; g.gain.value = vel*(.93 + rnd()*.12);
    s.connect(g); g.connect(master); s.start(when);
    setTimeout(function(){ flash(d, kind) }, Math.max(0, (when - actx.currentTime)*1000));
  }
  function schedule(){
    while (nextTime < actx.currentTime + .12){
      var inBar = step % 16; if (inBar === 0) bar = barEvents(Math.floor(step/16));
      var st = 60/bpm/4, t = nextTime;
      bar.forEach(function(e){ if (e[0] >= inBar && e[0] < inBar+1) play(e[1], e[2], e[3], t + (e[0]-inBar)*st) });
      if (inBar % 4 === 0) (function(b, when){ setTimeout(function(){ dot(b) }, Math.max(0, (when - actx.currentTime)*1000)) })(inBar/4, t);
      nextTime += st; step++;
    }
  }
  function start(){
    if (!audio()) return;
    if (actx.state === 'suspended') actx.resume();
    running = true; step = 0; nextTime = actx.currentTime + .08; schedule(); timer = setInterval(schedule, 25); paint();
  }
  function stop(){ running = false; clearInterval(timer); timer = null; dot(-1); paint() }

  // ── What the page shows ──
  var SVG = '<svg viewBox="0 0 200 250" aria-hidden="true"><ellipse class="rn-ring" cx="100" cy="40" rx="62" ry="16" fill="none" stroke="#ffcc33" stroke-width="4"/>' +
    '<path d="M48 44 C40 110 52 170 66 236 L134 236 C148 170 160 110 152 44 Z" fill="#a0522d"/><path d="M58 44 C52 110 62 170 74 236 L86 236 C78 170 70 110 74 44 Z" fill="#c8743f" opacity=".7"/>' +
    '<path d="M48 44 C40 110 52 170 66 236 L134 236 C148 170 160 110 152 44 Z" fill="none" stroke="#5c2c12" stroke-width="3"/><rect x="44" y="40" width="112" height="12" rx="5" fill="#d9a441" stroke="#7a5414" stroke-width="2"/>' +
    '<path d="M46 120 Q100 132 154 120" fill="none" stroke="#d9a441" stroke-width="7"/><path d="M58 206 Q100 216 142 206" fill="none" stroke="#d9a441" stroke-width="7"/>' +
    '<g fill="#7a5414"><circle cx="56" cy="46" r="3"/><circle cx="78" cy="47" r="3"/><circle cx="100" cy="47" r="3"/><circle cx="122" cy="47" r="3"/><circle cx="144" cy="46" r="3"/></g>' +
    '<ellipse class="rn-head" cx="100" cy="40" rx="54" ry="13" fill="#f1dcb0" stroke="#7a5414" stroke-width="3"/></svg>';
  var CSS = '.rn{display:flex;flex-direction:column;align-items:center;gap:10px}' +
    '.rn-drums{display:flex;align-items:flex-end;justify-content:center;gap:14px}' +
    '.rn-drum svg{display:block;height:auto;transform-origin:50% 100%;transition:transform .06s ease-out}' +
    '.rn-drum:nth-child(1) svg{width:78px}.rn-drum:nth-child(2) svg{width:68px}.rn-drum:nth-child(3) svg{width:58px}' +
    '.rn-drum.hit svg{transform:scale(1.07,.93)}.rn-drum .rn-head{transition:fill .06s}.rn-drum.hit .rn-head{fill:#fff3cf}.rn-drum.slap .rn-head{fill:#fff}' +
    '.rn-drum .rn-ring{opacity:0;transform-origin:100px 40px}.rn-drum.hit .rn-ring{animation:rnRing .4s ease-out}' +
    '@keyframes rnRing{0%{opacity:.9;transform:scale(.6)}100%{opacity:0;transform:scale(1.6)}}' +
    '.rn-dots{display:flex;gap:8px}.rn-dots i{width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.14)}.rn-dots i.on{background:#ffcc33;box-shadow:0 0 10px rgba(255,204,51,.8)}.rn-dots i:first-child.on{background:#fff}' +
    '.rn-play{width:100%;max-width:320px;padding:15px;border-radius:999px;border:0;background:#ffcc33;color:#1a0f08;font:900 1rem Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;box-shadow:0 6px 24px rgba(255,204,51,.3)}' +
    '.rn-play.on{background:transparent;color:#ffcc33;border:2px solid #ffcc33;box-shadow:none}' +
    '@media (prefers-reduced-motion:reduce){.rn-drum svg,.rn-drum .rn-head{transition:none}.rn-drum.hit .rn-ring{animation:none}.rn-drum.hit svg{transform:none}}';
  var W = { es:{ play:'▶ Toca para tocar', stop:'■ Parar' }, en:{ play:'▶ Touch to play', stop:'■ Stop' } };
  var lang = 'es';
  function flash(d, kind){
    if (!running || !ui || kind === 'tip') return;
    var c = ui.drums[d]; c.classList.remove('hit','slap'); void c.offsetWidth; c.classList.add('hit'); if (kind === 'slap') c.classList.add('slap');
    setTimeout(function(){ c.classList.remove('hit','slap') }, 90);
  }
  function dot(b){ if (!ui) return; for (var i = 0; i < 4; i++) ui.dots[i].classList.toggle('on', i === b) }
  function paint(){ if (!ui) return; ui.btn.classList.toggle('on', running); ui.btn.textContent = W[lang][running ? 'stop' : 'play'] }
  function mount(el, o){
    o = o || {}; lang = o.lang === 'en' ? 'en' : 'es';
    if (o.bpm) set(o.bpm);
    if (!document.getElementById('rn-css')){ var s = document.createElement('style'); s.id = 'rn-css'; s.textContent = CSS; document.head.appendChild(s) }
    el.innerHTML = '<div class="rn"><div class="rn-drums">' + [0,1,2].map(function(){ return '<div class="rn-drum">' + SVG + '</div>' }).join('') +
      '</div><div class="rn-dots"><i></i><i></i><i></i><i></i></div><button type="button" class="rn-play"></button></div>';
    ui = { drums: el.querySelectorAll('.rn-drum'), dots: el.querySelectorAll('.rn-dots i'), btn: el.querySelector('.rn-play') };
    ui.btn.addEventListener('click', function(){ running ? stop() : start() });
    paint();
  }
  function set(v){ bpm = Math.max(40, Math.min(200, Math.round(+v || 90))) }
  window.RITNOME = { mount: mount, set: set, stop: stop, get running(){ return running }, get bpm(){ return bpm } };
  document.addEventListener('visibilitychange', function(){ if (document.hidden && running) stop() });   // never drums in a hidden tab
})();

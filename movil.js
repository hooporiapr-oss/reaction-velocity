/* ══════════════════════════════════════════════════════════════════
   REACTION SPEED (built as Home Base) and SWIPE IT — what they share.
   Same file in reaction-velocity and cognitivo-gym-paradiso.

   Ways in:
     • a Reaction Velocity code (vreaction.com sign-in) or a Cognitivo Gym
       code: the games sit on that hub, on any device — tablet or phone;
     • a Reaction Mobile code (mobile.html): phones only, upright only,
       with their own hub (mobile-hub.html).
   Every run records the device it was played on ('tablet' or 'phone'),
   and My Progress and personal bests compare like with like — a reach
   across a tablet is never compared with a thumb-flick on a phone.

   Every run saves to its own board, vr_mobile_standings (game_key
   'home-base' or 'swipe-it'), so phone BPM never mixes with the tablet
   games. A player's own runs give My Progress and the personal best —
   never other kids.

   Each game page sets window.MOVIL = { game:'home-base', title:'Home Base' }
   before loading this file, and calls MOVIL.* below.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var M = window.MOVIL = window.MOVIL || {};
  var SB_URL = 'https://sdaphocueugzfvjovuxd.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYXBob2N1ZXVnemZ2am92dXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MjQyMDgsImV4cCI6MjA5OTIwMDIwOH0.pDAzf4P6dD9eNEBlnP95SdF5BI-R84-Rdc0vKzYcn7M';
  var TABLE = 'vr_mobile_standings';
  var H = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY };
  M.SB_URL = SB_URL; M.SB_KEY = SB_KEY; M.TABLE = TABLE;
  function ss0(k){ try { return sessionStorage.getItem(k) || '' } catch(e){ return '' } }
  // Which sign-in: a Reaction Mobile code wins if both are present on this device.
  M.mode = ss0('rm-gate-pass') === '1' ? 'mobile' : ss0('reaction-velocity-gate-pass') === '1' ? 'rv' : ss0('ritnome-gate-pass') === '1' ? 'gym' : '';
  var K = M.mode === 'mobile' ? { hub: 'mobile-hub.html', school: 'rm-school', cat: 'rm-category' }
        : M.mode === 'gym'    ? { hub: 'dynamic-hub.html', school: 'ritnome-school', cat: 'ritnome-category' }      // Cognitivo Gym
        :                       { hub: 'reaction-velocity.html', school: 'reaction-velocity-school', cat: 'reaction-velocity-category' };
  M.HUB = K.hub;

  function ss(k){ try { return sessionStorage.getItem(k) || '' } catch(e){ return '' } }
  M.school = function(){ return ss(K.school) };
  M.category = function(){ return ss(K.cat) };
  M.plain = function(){ return ss('gym-plain') === '1' };

  /* ── who may play: a Reaction Mobile code, on a phone ── */
  M.isPhone = function(){
    var coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches;
    var shortSide = Math.min(screen.width || innerWidth, screen.height || innerHeight);
    return !!coarse && shortSide <= 540;
  };
  M.guard = function(){
    var g = document.getElementById('mv-guard');
    if (!g) {
      g = document.createElement('div'); g.id = 'mv-guard';
      g.style.cssText = 'position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;flex-direction:column;gap:14px;padding:28px;text-align:center;background:#000;color:#fff;font:800 1.1rem Arial,sans-serif';
      document.body.appendChild(g);
    }
    if (M.mode !== 'mobile') { g.style.display = 'none'; return true }   // Reaction Velocity code: any device, any way up
    if (!M.isPhone()) {
      g.innerHTML = '<div style="font-size:3rem">📱</div><div>Reaction Mobile is made for phones.</div><div style="font-size:.85rem;color:#9fb3c8;font-weight:700">Open it on a phone. On a tablet, play Reaction Speed at vreaction.com.</div>';
      g.style.display = 'flex'; return false;
    }
    if (innerWidth > innerHeight) {
      g.innerHTML = '<div style="font-size:3rem">↻</div><div>Turn your phone upright</div>';
      g.style.display = 'flex'; return false;
    }
    g.style.display = 'none'; return true;
  };
  function reGuard(){ if (document.body) M.guard() }
  addEventListener('resize', reGuard); addEventListener('orientationchange', reGuard);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reGuard); else reGuard();

  /* ── sounds: a short tone for a hit, a low buzz for a miss ── */
  var ac = null;
  function tone(hz, ms, type, vol){
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'sine'; o.frequency.value = hz;
      g.gain.setValueAtTime(vol || .18, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + ms / 1000);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + ms / 1000);
    } catch(e){}
  }
  M.hitSound = function(){ tone(660, 120, 'sine', .2) };
  M.tick = function(accent){ tone(accent ? 1320 : 880, 45, 'square', accent ? .07 : .04) };   // the beat: a higher click on the first beat
  M.missSound = function(){ tone(110, 220, 'square', .08) };
  M.unlock = function(){ tone(1, 10, 'sine', .0001) };
  M.vibrate = function(ms){ try { navigator.vibrate && navigator.vibrate(ms) } catch(e){} };

  M.bpm = function(ms){ return ms > 0 ? Math.round(60000 / ms) : 0 };
  M.esc = function(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') };

  /* ── this player's own past runs (loaded as a run starts, so it is not in them yet) ── */
  M.past = null;
  M.device = function(){ return M.isPhone() ? 'phone' : 'tablet' };
  M.loadPast = function(name){
    M.past = null;
    var n = String(name || '').trim(); if (!n) return Promise.resolve(null);
    var url = SB_URL + '/rest/v1/' + TABLE + '?select=bpm,hits,misses,logged_at&hidden=is.false&game_key=eq.' + M.game +
      '&device=eq.' + M.device() + '&school_name=eq.' + encodeURIComponent(M.school()) + '&player_name=ilike.' + encodeURIComponent(n.replace(/[*%,()]/g, '')) + '&order=admin_id.asc';
    return fetch(url, { headers: H }).then(function(r){ return r.ok ? r.json() : null })
      .then(function(x){ M.past = Array.isArray(x) ? x : null; return M.past }).catch(function(){ return null });
  };

  M.save = function(name, bpm, hits, misses, avgMs){
    return fetch(SB_URL + '/rest/v1/' + TABLE, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, H),
      body: JSON.stringify({ game_key: M.game, device: M.device(), player_name: String(name).trim().slice(0, 20), school_name: M.school() || null,
        bpm: bpm, hits: hits, misses: misses, avg_ms: avgMs || null })
    }).catch(function(){});
  };

  /* Personal best line for the end screen, from M.past */
  M.bestHtml = function(now, lang){
    var es = lang === 'es';
    if (!M.past || !(now > 0)) return '';
    var prev = -1; M.past.forEach(function(r){ var v = +r.bpm || 0; if (v > prev) prev = v });
    var big = 'font-size:1.15rem;font-weight:900;letter-spacing:.06em;color:#ffd35a;text-shadow:0 0 18px rgba(255,211,90,.6)';
    var small = 'font-size:.82rem;color:#c8ccd4;margin-top:3px';
    if (prev <= 0) return '<div style="' + big + '">⭐ ' + (es ? 'PRIMERA MARCA' : 'FIRST MARK SET') + '</div><div style="' + small + '">' + now + ' BPM — ' + (es ? 'la que hay que superar la próxima vez' : 'the one to beat next time') + '</div>';
    if (now > prev) return '<div style="' + big + '">⭐ ' + (es ? '¡NUEVO RÉCORD PERSONAL!' : 'NEW PERSONAL BEST!') + '</div><div style="' + small + '">' + now + ' BPM · ' + (es ? 'tu mejor era ' : 'your best was ') + prev + '</div>';
    return '<div style="' + small + '">' + (es ? 'Tu mejor: ' : 'Your best: ') + prev + ' BPM</div>';
  };

  /* My Progress: this run added to the player's past runs, as a line */
  M.progressSvg = function(now, lang){
    var es = lang === 'es';
    var pts = (M.past || []).filter(function(r){ return +r.bpm > 0 }).map(function(r){ return +r.bpm });
    if (now > 0) pts.push(now);
    pts = pts.slice(-20);
    if (pts.length < 2) return '<div style="color:#8fa0b4;font-size:.82rem;text-align:center;padding:10px">' + (es ? 'Juega otra vez para empezar tu línea de progreso.' : 'Play again to start your progress line.') + '</div>';
    var mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts);
    var lo = Math.max(0, Math.floor((mn - 10) / 10) * 10), hi = Math.ceil((mx + 10) / 10) * 10;
    var W = 340, Hh = 160, L = 34, R = 10, T = 12, B = 20;
    var X = function(i){ return L + (W - L - R) * i / (pts.length - 1) }, Y = function(v){ return T + (Hh - T - B) * (hi - v) / (hi - lo) };
    var s = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" style="width:100%;height:auto;display:block">';
    var step = Math.max(10, Math.ceil((hi - lo) / 4 / 10) * 10);
    for (var y = lo; y <= hi; y += step) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(y) + '" y2="' + Y(y) + '" stroke="rgba(255,255,255,.08)"/><text x="' + (L - 6) + '" y="' + (Y(y) + 4) + '" fill="#8fa0b4" font-size="10" text-anchor="end">' + y + '</text>';
    s += '<polyline fill="none" stroke="#00e5ff" stroke-width="2.5" stroke-linejoin="round" points="' + pts.map(function(v, i){ return X(i).toFixed(1) + ',' + Y(v).toFixed(1) }).join(' ') + '"/>';
    pts.forEach(function(v, i){ var last = i === pts.length - 1; s += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="' + (last ? 5.5 : 3.5) + '" fill="' + (last ? '#ffd35a' : '#00e5ff') + '"/>' });
    s += '<text x="' + L + '" y="' + (Hh - 4) + '" fill="#8fa0b4" font-size="10">' + (es ? 'inicio' : 'first') + '</text><text x="' + (W - R) + '" y="' + (Hh - 4) + '" fill="#8fa0b4" font-size="10" text-anchor="end">' + (es ? 'hoy' : 'today') + '</text>';
    return s + '</svg>';
  };

  // No sign-in on this device: back to the code box.
  if (!M.mode) location.replace('index.html');
  // Every "← THE HUB" link goes to the hub of the sign-in used.
  function hubLinks(){
    document.querySelectorAll('a[href="mobile-hub.html"]').forEach(function(a){ a.setAttribute('href', M.HUB) });
    // Cognitivo Gym's Fortress has its own file name
    if (M.mode === 'gym') document.querySelectorAll('a[href="vr-fortress.html"]').forEach(function(a){ a.setAttribute('href', 'dynamic-memory-the-fortress.html') });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hubLinks); else hubLinks();
})();

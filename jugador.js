/* ══════════════════════════════════════════════════════════════════
   THE PLAYER — one name, entered once, used by every game.

   The hub asks "Who's playing?" once per visit, before any game opens:
     • if this device played before:  ☑ Same player: <name>   [Continue]
       untick the box to type a new player's name instead;
     • first time on this device: just the name box.
   Every game then opens with that name already in: its name box is
   hidden and shows "👤 <name>". Scores save under that name, and under
   the school and age group of the code used at sign-in.
   "New player" (on the hub, and in each game) goes back to the hub's
   question with the box unticked.

   Same file in cognitivo-gym-paradiso and reaction-velocity. Each page
   sets window.JUGADOR before loading it:
     modo      'hub' or 'juego'
     hub       the hub page to go back to
     escuela   sessionStorage key holding the school of the sign-in
     categoria sessionStorage key holding its age group
     tablas    standings tables whose saved runs get the age group
     aqui      true: "Next player" / "New player" ask for the next name
               right in the game, instead of going back to the hub
     lista     {url, key}: "Who's playing?" adds a dropdown, A to Z, of every
               player already saved at this school and age group in the
               tablas above (the names the standings already show)
   Names stay on this device only (localStorage) — nothing new is sent
   anywhere except the age group on each saved run.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var C = window.JUGADOR || {};
  var HUB = C.hub || 'index.html';
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch(e){ return '' } }
  function ss(k, v){ try { if (v === undefined) return sessionStorage.getItem(k) || ''; sessionStorage.setItem(k, v) } catch(e){ return '' } }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

  var nombre = ls('gym-player');
  var listo = ss('gym-player-ok') === '1' && !!nombre;
  var categoria = C.categoria ? ss(C.categoria) : '';
  var escuela = C.escuela ? ss(C.escuela) : '';
  var original = window.fetch;

  /* The players already saved at this school and age group, A to Z.
     Runs saved before age groups were recorded (no age group) count too.
     Hidden or deleted runs (standings admin) are left out. Asked once per page. */
  var jugadores = null;
  function lista(cb){
    if (jugadores) return cb(jugadores);
    var L = C.lista;
    if (!L || !L.url || !L.key || !escuela || !original || !C.tablas || !C.tablas.length) return cb([]);
    var q = '?select=player_name&hidden=is.false&school_name=eq.' + encodeURIComponent(escuela) +
            (categoria ? '&or=' + encodeURIComponent('(category.eq."' + categoria.replace(/"/g, '') + '",category.is.null)') : '');
    var h = { headers: { apikey: L.key, Authorization: 'Bearer ' + L.key } };
    Promise.all(C.tablas.map(function(t){
      return original.call(window, L.url + '/rest/v1/' + t + q, h)
        .then(function(r){ return r.ok ? r.json() : [] }).catch(function(){ return [] });
    })).then(function(todas){
      var vistos = {}, out = [];
      todas.forEach(function(filas){ (filas || []).forEach(function(f){
        var n = String(f && f.player_name || '').trim(), k = n.toLowerCase();
        if (n && !vistos[k]) { vistos[k] = 1; out.push(n) }
      }) });
      out.sort(function(a, b){ return a.localeCompare(b, 'es', { sensitivity: 'base' }) });
      jugadores = out; cb(out);
    }).catch(function(){ cb([]) });
  }

  /* Every run saved to a standings table carries the sign-in's age group. */
  if (C.tablas && C.tablas.length && window.fetch) {
    window.fetch = function(url, op){
      try {
        var u = String(url && url.url || url);
        var m = u.match(/\/rest\/v1\/([a-z0-9_]+)(\?|$)/);
        if (m && C.tablas.indexOf(m[1]) !== -1 && op && String(op.method).toUpperCase() === 'POST' && typeof op.body === 'string') {
          var b = JSON.parse(op.body);
          if (b && typeof b === 'object' && !Array.isArray(b) && !('category' in b)) {
            b.category = ss(C.categoria) || null;
            op = Object.assign({}, op, { body: JSON.stringify(b) });
          }
        }
      } catch(e){}
      return original.call(this, url, op);
    };
  }

  var css = document.createElement('style');
  css.textContent =
    '#jg-capa{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,4,10,.92);font-family:Arial,sans-serif}' +
    '#jg-caja{width:100%;max-width:400px;background:#0b1420;border:2px solid rgba(0,229,255,.45);border-radius:20px;padding:26px 22px;text-align:center;color:#fff;box-shadow:0 0 50px rgba(0,229,255,.25)}' +
    '#jg-caja h2{margin:0 0 4px;font-size:1.5rem;font-weight:900;letter-spacing:.06em;text-transform:uppercase}' +
    '#jg-caja .jg-sub{color:#8fb3c8;font-size:.8rem;letter-spacing:.06em;margin-bottom:18px}' +
    '#jg-caja label.jg-si{display:flex;align-items:center;justify-content:center;gap:10px;padding:14px;border-radius:14px;background:rgba(0,229,255,.08);border:1.5px solid rgba(0,229,255,.35);font-size:1.05rem;font-weight:800;cursor:pointer;margin-bottom:12px}' +
    '#jg-caja label.jg-si input{width:22px;height:22px;accent-color:#00e5ff}' +
    '#jg-caja input.jg-nom{width:100%;padding:14px;border-radius:14px;border:2px solid rgba(0,229,255,.4);background:rgba(255,255,255,.06);color:#fff;font-size:1.05rem;text-align:center;box-sizing:border-box;margin-bottom:12px}' +
    '#jg-caja input.jg-nom:focus{outline:none;border-color:#00e5ff}' +
    '#jg-caja button{width:100%;height:56px;border:none;border-radius:16px;background:linear-gradient(135deg,#00e5ff,#0091ff);color:#031018;font-size:1.05rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}' +
    '#jg-caja select.jg-lista{width:100%;padding:14px;border-radius:14px;border:2px solid rgba(0,229,255,.6);background:#0b1420;color:#fff;font-size:1.05rem;font-weight:800;text-align:center;box-sizing:border-box;margin-bottom:8px}' +
    '#jg-caja select.jg-lista option{background:#0b1420;color:#fff}' +
    '#jg-caja .jg-o{color:#8fb3c8;font-size:.75rem;letter-spacing:.08em;margin:2px 0 8px}' +
    '#jg-caja .jg-err{color:#ff8a8a;font-size:.82rem;min-height:1.1em;margin:-4px 0 8px}' +
    '#jg-chip{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9000;display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:999px;background:rgba(0,10,20,.85);border:1.5px solid rgba(0,229,255,.45);color:#fff;font:800 .85rem Arial,sans-serif;white-space:nowrap;max-width:calc(100% - 24px)}' +
    '#jg-chip span{overflow:hidden;text-overflow:ellipsis}' +
    '#jg-chip button{border:none;border-radius:999px;padding:7px 12px;background:#00e5ff;color:#031018;font:900 .72rem Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}' +
    '.jg-como{display:inline-flex;align-items:center;gap:10px;margin:10px auto;padding:10px 16px;border-radius:999px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.2);color:#fff;font:800 .95rem Arial,sans-serif}' +
    '.jg-como a{color:#00e5ff;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;text-decoration:none}';
  document.head.appendChild(css);

  function grupo(){
    return [escuela, categoria].filter(Boolean).join(' · ');
  }

  function guardar(n){
    nombre = n.slice(0, 20);
    ls('gym-player', nombre);
    ss('gym-player-ok', '1');
    ss('hoop-player-name', nombre);     // the four-quarter Final Score reads this one
    listo = true;
  }

  /* ── the hub: "Who's playing?" before any game ── */
  var alListo = null;      // in a game with aqui: what to do once the next name is in
  function preguntar(nuevo){
    var vieja = document.getElementById('jg-capa'); if (vieja) vieja.remove();
    var hay = !!nombre;
    var capa = document.createElement('div'); capa.id = 'jg-capa';
    capa.innerHTML = '<div id="jg-caja" role="dialog" aria-modal="true" aria-labelledby="jg-t">' +
      '<h2 id="jg-t">Who’s playing?</h2>' +
      '<div class="jg-sub">' + esc(grupo() || 'Every game will use this name') + '</div>' +
      (hay ? '<label class="jg-si"><input type="checkbox" id="jg-mismo"' + (nuevo ? '' : ' checked') + '> Same player: ' + esc(nombre) + '</label>' : '') +
      '<select class="jg-lista" id="jg-lista" aria-label="Choose a player" style="display:none"></select>' +
      '<div class="jg-o" id="jg-o" style="display:none">— or a new player —</div>' +
      '<input class="jg-nom" id="jg-nom" maxlength="20" autocomplete="off" placeholder="New player name">' +
      '<div class="jg-err" id="jg-err"></div>' +
      '<button type="button" id="jg-ok">Continue →</button></div>';
    document.body.appendChild(capa);
    var mismo = document.getElementById('jg-mismo'), campo = document.getElementById('jg-nom');
    var sel = document.getElementById('jg-lista'), o = document.getElementById('jg-o'), hayLista = false;
    function ver(){
      var otro = !(mismo && mismo.checked);
      campo.style.display = otro ? 'block' : 'none';
      sel.style.display = o.style.display = (otro && hayLista) ? 'block' : 'none';
      if (otro && !hayLista) campo.focus();
    }
    if (mismo) mismo.addEventListener('change', ver);
    ver();
    lista(function(ns){
      if (!ns.length || !document.body.contains(capa)) return;
      sel.innerHTML = '<option value="">Choose a player</option>' + ns.map(function(n){ return '<option value="' + esc(n) + '">' + esc(n) + '</option>' }).join('');
      hayLista = true; ver();
    });
    sel.addEventListener('change', function(){ if (sel.value) { campo.value = ''; document.getElementById('jg-err').textContent = '' } });
    campo.addEventListener('input', function(){ if (campo.value) sel.value = '' });
    function seguir(){
      if (mismo && mismo.checked) { guardar(nombre) }
      else if (sel.value) { guardar(sel.value) }
      else {
        var n = campo.value.trim();
        if (!n) { document.getElementById('jg-err').textContent = hayLista ? 'Choose a player or type a new name' : 'Type the player’s name'; campo.focus(); return }
        // a typed name already on the list keeps the list's spelling
        if (jugadores) jugadores.forEach(function(x){ if (x.toLowerCase() === n.toLowerCase()) n = x });
        guardar(n);
        if (jugadores && jugadores.indexOf(n) === -1) { jugadores.push(n); jugadores.sort(function(a, b){ return a.localeCompare(b, 'es', { sensitivity: 'base' }) }) }
      }
      capa.remove();
      if (C.modo === 'hub') chip(); else if (alListo) alListo();
    }
    document.getElementById('jg-ok').addEventListener('click', seguir);
    campo.addEventListener('keydown', function(e){ if (e.key === 'Enter') seguir() });
  }
  function chip(){
    var c = document.getElementById('jg-chip');
    if (!c) { c = document.createElement('div'); c.id = 'jg-chip'; document.body.appendChild(c) }
    c.innerHTML = '<span>👤 ' + esc(nombre) + (categoria ? ' · ' + esc(categoria) : '') + '</span><button type="button" id="jg-otro">New player</button>';
    document.getElementById('jg-otro').onclick = function(){ preguntar(true) };
  }

  /* ── a game: the name is already in ── */
  function enJuego(){
    var campo = document.getElementById('playerNameInputMain');
    if (!campo || !listo) return;                       // no name yet: the game works as before
    campo.value = nombre;
    campo.style.display = 'none';
    var como = document.createElement('div'); como.className = 'jg-como';
    como.innerHTML = '<span>👤 ' + esc(nombre) + '</span><a href="' + esc(HUB) + '?nuevo=1">New player</a>';
    campo.parentNode.insertBefore(como, campo.nextSibling);
    // aqui: the next player's name is asked right here; the game then
    // opens on its start screen for them, as if just arrived from the hub.
    alListo = function(){
      campo.value = nombre;
      como.querySelector('span').textContent = '👤 ' + nombre;
      campo.dispatchEvent(new Event('input', { bubbles: true }));
    };
    if (C.aqui) como.querySelector('a').addEventListener('click', function(e){ e.preventDefault(); preguntar(true) });
    // Some games empty the name box between rounds; it is put back before any tap reaches the game.
    document.addEventListener('pointerdown', function(){ if (!campo.value) campo.value = nombre }, true);
    document.addEventListener('click', function(e){
      if (!campo.value) campo.value = nombre;
      // "Next player" now means a new player at the hub's question.
      if (e.target.closest && e.target.closest('#nextPlayerBtn')) {
        if (C.aqui) { preguntar(true); return }          // the game's own button takes it back to its start screen
        e.stopPropagation(); e.preventDefault();
        location.href = HUB + '?nuevo=1';
      }
    }, true);
  }

  function arrancar(){
    if (C.modo === 'hub') {
      var nuevo = /[?&]nuevo=1/.test(location.search);
      if (nuevo) { try { history.replaceState(null, '', location.pathname) } catch(e){} }
      if (!listo || nuevo) preguntar(nuevo); else chip();
    } else {
      enJuego();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();

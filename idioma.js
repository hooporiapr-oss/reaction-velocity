/* ══════════════════════════════════════════════════════════════════
   LANGUAGE for the start screens of Reactific and The Fortress.
   Opens in Spanish; the ES / EN buttons switch it. The choice is
   remembered on this device under 'rs-lang' — the same choice as
   Reaction Speed and Swipe It, so all four games follow it.

   The games keep writing their own (English) words; this file turns the
   start screen's words into Spanish as they appear, and puts the English
   back when EN is chosen. Same file in reaction-velocity and
   cognitivo-gym-paradiso.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var ES = {
    '← Exit':'← Salir', '⛶ Fullscreen':'⛶ Pantalla completa', 'New player':'Nuevo jugador',
    'Speed':'Velocidad', 'Chain speed':'Velocidad de la cadena',
    '⚡ Play Reaction Speed first':'⚡ Juega Reaction Speed primero',
    '⚡ Play Ritnome BPM first':'⚡ Juega Ritnome BPM primero',
    'your Reaction Speed · − / + or type any speed':'tu Reaction Speed · − / + o escribe cualquier velocidad',
    'no Reaction Speed yet — play it first':'aún no hay Reaction Speed — juégalo primero',
    'your speed comes from Reaction Speed':'tu velocidad viene de Reaction Speed',
    'no Reaction Speed yet — 90 BPM to start · − / + or type any speed':'aún no hay Reaction Speed — 90 BPM para empezar · − / + o escribe cualquier velocidad',
    'Targets: normal':'Objetivos: normales', 'Targets: big':'Objetivos: grandes',
    'Balls: normal':'Balones: normales', 'Balls: big':'Balones: grandes',
    'Tones: on':'Tonos: sí', 'Tones: off':'Tonos: no',
    '🔴 START · TAP ONLY ON RED':'🔴 EMPEZAR · TOCA SOLO EN ROJO', '▶ START':'▶ EMPEZAR',
    '🔴 START · SWIPE ONLY THE RED':'🔴 EMPEZAR · DESLIZA SOLO EL ROJO',
    '📈 MY PROGRESS':'📈 MI PROGRESO', '🏆 THE STANDINGS':'🏆 LA CLASIFICACIÓN',
    'Reaction Velocity · To The Beat of the Ritnome':'Reaction Velocity · Al ritmo del Ritnome',
    'Moving target, colors flash to the Ritnome — tap ONLY on RED. 10 reds.':'Objetivo en movimiento, los colores cambian al ritmo del Ritnome — toca SOLO el ROJO. 10 rojos.',
    'Moving arrow, colors flash to the Ritnome — swipe ONLY the RED, the way it points. 10 reds.':'Flecha en movimiento, los colores cambian al ritmo del Ritnome — desliza SOLO la ROJA, hacia donde apunta. 10 rojos.',
    'Reaction Velocity · The 2-1-2 Zone':'Reaction Velocity · La zona 2-1-2',
    'Cognitivo Gym · The 2-1-2 Zone':'Cognitivo Gym · La zona 2-1-2',
    'Watch the chain light up inside the key — one ball per beat, at your speed — then repeat it back. Every round adds one more ball; one wrong tap ends the run.':
      'Mira la cadena encenderse dentro de la llave — un balón por pulso, a tu velocidad — y repítela. Cada ronda suma un balón; un toque equivocado termina la partida.',
    'Your best final score: ':'Tu mejor puntuación final: '
  };
  var PATTERNS = [
    [/^Each ball lights for ([\d.]+) s · one ball per beat at (\d+) BPM\. Repeat it back at your own pace\.$/, 'Cada balón se enciende $1 s · un balón por pulso a $2 BPM. Repítela a tu ritmo.'],
    [/^Your best on the (\d+) Ritnome: $/, 'Tu mejor en el Ritnome a $1: '],
    [/^(\d+) taps$/, '$1 toques']
  ];
  var KEY = 'rs-lang';
  var lang = 'es'; try { if (localStorage.getItem(KEY) === 'en') lang = 'en' } catch(e){}
  var orig = new WeakMap();      // node → its English words

  function toES(en){
    var t = en.trim(); if (!t) return null;
    if (Object.prototype.hasOwnProperty.call(ES, t)) return en.replace(t, ES[t]);
    for (var i = 0; i < PATTERNS.length; i++) if (PATTERNS[i][0].test(t)) return en.replace(t, t.replace(PATTERNS[i][0], PATTERNS[i][1]));
    return null;
  }
  function doNode(n){
    if (n.nodeType !== 3) return;
    if (n.parentNode && n.parentNode.closest && n.parentNode.closest('.game-switcher, .vrr-logo')) return;   // game names stay as they are
    var cur = n.nodeValue, was = orig.get(n);
    if (lang === 'es') {
      if (was != null && toES(was) === cur) return;           // already done
      var es = toES(cur); if (es == null) return;
      orig.set(n, cur); if (es !== cur) n.nodeValue = es;
    } else if (was != null && cur !== was && cur === toES(was)) { n.nodeValue = was }   // only real changes (no endless rewrites)
  }
  function doTree(root){
    if (!root) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) doNode(n);
    root.querySelectorAll('[placeholder]').forEach(function(e){
      if (e.dataset.phEn == null) e.dataset.phEn = e.placeholder;
      e.placeholder = (lang === 'es' && e.dataset.phEn === 'Your name') ? 'Tu nombre' : e.dataset.phEn;
    });
  }
  function roots(){ return document.querySelectorAll('.rx-intro') }
  function apply(){
    document.documentElement.lang = lang;
    roots().forEach(doTree);
    document.querySelectorAll('[data-lang]').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-lang') === lang) });
    if (typeof window.onIdioma === 'function') try { window.onIdioma(lang) } catch(e){}
  }
  window.IDIOMA = { get lang(){ return lang }, set: function(l){ lang = l === 'en' ? 'en' : 'es'; try { localStorage.setItem(KEY, lang) } catch(e){} apply() } };

  function start(){
    document.querySelectorAll('[data-lang]').forEach(function(b){ b.addEventListener('click', function(){ window.IDIOMA.set(b.getAttribute('data-lang')) }) });
    var busy = false;
    var mo = new MutationObserver(function(){ if (busy) return; busy = true; try { roots().forEach(doTree) } finally { busy = false } });
    roots().forEach(function(r){ mo.observe(r, { subtree: true, childList: true, characterData: true }) });
    apply();
    setTimeout(apply, 0);      // after the game and jugador.js have written their words
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

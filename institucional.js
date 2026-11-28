/* Institutional glue for the vreaction games (Ritnome desk launch).
   Does nothing unless movil.js decided institutional mode (window.RITNOME_INST).
   Then: no player name (one station, participants take turns), senior preset applied,
   and participation reported through the institutional script — never to the athlete database.
   Page config: window.INSTITUCIONAL = { endId, bpmId, preset: function(){} } set before this script. */
(function(){
  if (!window.RITNOME_INST) return;
  var C = window.INSTITUCIONAL || {};
  var $ = function(i){ return document.getElementById(i) };
  // shared script, loaded only in institutional mode
  var s = document.createElement('script'); s.src = 'https://institutional.ritnome.com/ritnome-institutional.js'; s.defer = true; document.head.appendChild(s);
  function prep(){
    var ni = $('playerNameInputMain');
    if (ni) { ni.value = 'Participante'; ni.style.display = 'none'; ni.dispatchEvent(new Event('input', { bubbles: true })); }
    document.querySelectorAll('.jg-como, #nextPlayerBtn, .intro-back').forEach(function(e){ e.style.display = 'none' });
    try { if (typeof C.preset === 'function') C.preset(); } catch(e){}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(prep, 0) }); else setTimeout(prep, 0);
  var games = 0, swipes = 0, lastBpm = 0, R = null;
  document.addEventListener('pointerup', function(){ swipes++ }, true);
  function watchEnd(){
    var end = $(C.endId || 'end'); if (!end) return;
    new MutationObserver(function(){
      if (end.hidden) return;
      games++;
      var b = parseInt((($(C.bpmId) || {}).textContent || ''), 10); if (b > 0) lastBpm = b;
      if (R) R.checkpoint({});
    }).observe(end, { attributes: true, attributeFilter: ['hidden'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchEnd); else watchEnd();
  document.addEventListener('ritnome:ready', function(){
    R = window.RitnomeInstitutional; if (!R || R.mode !== 'active') { R = null; return; }
    R.collect = function(){ var o = { games_completed: games, interactions: swipes }; if (lastBpm) o.personal_bpm = lastBpm; return o; };
    R.start({ mode: 'individual' });
  });
})();

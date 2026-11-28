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
  // the setting a result was achieved at (so progress compares like with like): comfort mode, or the speed box
  function setting(){ try { if (typeof C.setting === 'function') return String(C.setting()).slice(0, 40); var sp = $('bpmInput'); if (sp && sp.value) return 'bpm' + sp.value; return document.documentElement.classList.contains('comfort') ? 'comfort' : 'default'; } catch(e){ return 'default'; } }
  document.addEventListener('pointerup', function(){ swipes++ }, true);
  function watchEnd(){
    var end = $(C.endId || 'end'); if (!end) return;
    var shown = typeof C.endTest === 'function' ? C.endTest : function(e){ return !e.hidden }, was = false;
    new MutationObserver(function(){
      var now = !!shown(end); var rise = now && !was; was = now; if (!rise) return;
      games++;
      var b = parseInt((($(C.bpmId) || {}).textContent || ''), 10); if (b > 0) lastBpm = b;
      if (R) { R.checkpoint({}); var pr = { setting: setting(), result: { bpm: b > 0 ? b : 0 } }; if (b > 0) pr.personal_bpm = b; R.progress(pr); }
    }).observe(end, { attributes: true, attributeFilter: [C.endAttr || 'hidden'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchEnd); else watchEnd();
  document.addEventListener('ritnome:ready', function(){
    R = window.RitnomeInstitutional; if (!R || R.mode !== 'active') { R = null; return; }
    R.collect = function(){ var o = { games_completed: games, interactions: swipes }; if (lastBpm) o.personal_bpm = lastBpm; return o; };
    R.start({ mode: C.mode || 'individual' });
  });
})();

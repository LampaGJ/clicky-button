'use strict';

/**
 * Optional progressive enhancement for exported clicky buttons. Pure CSS
 * (see U1/U2) already handles press/toggle motion with zero JS; this module
 * only adds the full symmetric press-and-release bounce that always
 * completes even on a tap faster than --press-duration — an animation-based
 * effect that cannot be expressed in pure CSS. Never required.
 *
 * Matches `e.animationName.startsWith('clicky-transform-cycle')` (a PREFIX
 * match, not `===`) because the scoping mechanism (see opts.scope) suffixes
 * keyframe names with a hash of the scope string.
 *
 * @param {ParentNode} [root=document] — root to query within. The default
 *   parameter is evaluated at call time, so `document` is never touched at
 *   import time (this file is safe to import under bare Node).
 */
function enhanceClickyButtons(root = document) {
  root.querySelectorAll('.clicky-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.add('toggle-did-interact');
    }, { once: true });
  });

  // Full press cycle on pointerdown. Reflow trick ensures rapid re-clicks
  // restart the animation cleanly from 0%. Keep .clicky-press applied while
  // the mouse is still over the button so the post-animation hover-lift
  // doesn't engage and visibly "rise" after the press completes.
  root.querySelectorAll('.clicky-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      btn.classList.remove('clicky-press');
      void btn.offsetWidth;
      btn.classList.add('clicky-press');
    });
    btn.addEventListener('pointerleave', () => {
      btn.classList.remove('clicky-press');
    });
    btn.addEventListener('animationend', e => {
      if (e.animationName.startsWith('clicky-transform-cycle') && !btn.matches(':hover')) {
        btn.classList.remove('clicky-press');
      }
    });
  });
}

// Same logic, as a standalone self-invoking script string for the export
// ZIP (see app.js's downloadZip) — no import/export syntax, so it can be
// dropped in via a plain <script> tag.
const clickyEnhancerJs = `'use strict';

function enhanceClickyButtons(root = document) {
  root.querySelectorAll('.clicky-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.add('toggle-did-interact');
    }, { once: true });
  });

  root.querySelectorAll('.clicky-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      btn.classList.remove('clicky-press');
      void btn.offsetWidth;
      btn.classList.add('clicky-press');
    });
    btn.addEventListener('pointerleave', () => {
      btn.classList.remove('clicky-press');
    });
    btn.addEventListener('animationend', e => {
      if (e.animationName.startsWith('clicky-transform-cycle') && !btn.matches(':hover')) {
        btn.classList.remove('clicky-press');
      }
    });
  });
}

enhanceClickyButtons(document);
`;

export { enhanceClickyButtons, clickyEnhancerJs };

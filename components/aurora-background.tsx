/* ============================================================================
   Two animated radial gradients drifting behind everything. Atmosphere only —
   .aurora is fixed, pointer-events none, mix-blend-mode chosen per theme so
   it never harms text contrast. CSS handles the animation; nothing dynamic.
   ============================================================================ */

export function AuroraBackground() {
  return <div className="aurora" aria-hidden />;
}

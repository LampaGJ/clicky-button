import { z } from 'zod';

// Mirrors lib/clicky-button.js's @typedef {object} ClickyConfig (post-#24 sync) with the richer
// contract (ranges/enums) that a plain typeof-check can't express — per D1, this lives in test/
// only; Zod never ships as a lib/ runtime dependency. Every key in defaultClickyConfig must appear
// here exactly once (see validation.test.js's key-set equality assertion).

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: 'expected a 6-digit hex color' });
const pct0to100 = z.number().min(0).max(100);

export const ClickyConfigSchema = z.object({
  // Container & grid
  containerWidth: z.number().int().min(1),
  containerHeight: z.number().int().min(1),
  btnCount: z.number().int().min(1),
  btnLabels: z.string(),
  gridDirection: z.enum(['row', 'column']),
  gridWrap: z.enum(['wrap', 'nowrap']),
  gridGap: z.number().min(0),
  gridJustify: z.enum(['center', 'flex-start', 'flex-end', 'space-between', 'space-around']),
  gridAlign: z.enum(['center', 'flex-start', 'flex-end', 'stretch']),

  // Segmented housing (issue #36) / tri-state radio group (issue #37)
  housingLayout: z.enum(['separate', 'segmented']),
  segmentDividerWidth: z.number().min(0),
  groupLabel: z.string(),

  // Shape & typography
  radiusRatio: pct0to100,
  // Per-corner radius override (issue #35) — null = uniform radiusRatio path.
  radiusCorners: z.strictObject({
    tl: pct0to100,
    tr: pct0to100,
    br: pct0to100,
    bl: pct0to100,
  }).nullable(),
  chromeRadiusRatio: pct0to100,
  // Parallelogram skew (issue #34) — deg; clamp range pinned by expert
  // commentary on issue #34 (beyond ~18-20° the tan() housing-width term
  // dominates and adjacent grid buttons start overlapping).
  skewAngle: z.number().min(-18).max(18),
  faceColor: hex,
  textColor: hex,
  fontSizeRatio: z.number().min(0),
  fontWeight: z.string(),
  letterSpacing: z.number(),

  // Depth geometry
  wallHRatio: pct0to100,
  pressDepthRatio: pct0to100,

  // Button wall (moving side of the keycap)
  useButtonWallColor: z.boolean(),
  buttonWallColor: hex,
  buttonWallShadowAlpha: pct0to100,
  buttonWallShadowEdgeRatio: pct0to100,
  buttonWallGradientSpread: pct0to100,

  // Button cavity (static housing slot)
  useCavityWallColor: z.boolean(),
  cavityWallColor: hex,
  cavityWallShadowAlpha: pct0to100,
  cavityWallShadowEdgeRatio: pct0to100,
  cavityWallGradientSpread: pct0to100,

  // Face shadows / rim highlight
  insetDepthRatio: pct0to100,
  insetBlurRatio: pct0to100,
  insetAlphaTop: pct0to100,
  insetAlphaBot: pct0to100,
  topHighlight: z.boolean(),
  highlightColor: hex,
  highlightOpacity: pct0to100,
  rimHeightRatio: pct0to100,
  faceEdgeAlpha: pct0to100,

  // Press/toggle face color + darken
  usePressColor: z.boolean(),
  pressColor: hex,
  useToggleColor: z.boolean(),
  toggleColor: hex,
  pressDarken: pct0to100,

  // Ambient shadow
  ambientIntensity: pct0to100,
  ambientBlurMult: z.number().min(0),
  ambientYMult: z.number().min(0),
  ambientPressReduction: pct0to100,

  // Chrome bevel frame
  frameEnabled: z.boolean(),
  frameWidth: z.number().min(0),
  frameColorHi: hex,
  frameColor: hex,
  frameColorLo: hex,
  frameBevelAlpha: pct0to100,
  frameBevelWidth: z.number().min(0),

  // Mode & timing
  mode: z.enum(['click', 'toggle', 'radio']),
  speedFactor: z.number().min(-2).max(0), // log10 multiplier
  duration: z.number().min(0),
  pressDuration: z.number().min(0),
  easingPreset: z.enum([
    'bouncy', 'snappy', 'soft', 'linear',
    'red', 'brown', 'blue', 'black', 'clear', 'topre', 'buckling',
    'custom',
  ]),
  overshoot: z.boolean(),
  // Cubic-bezier x-constraint is a CSS spec rule (x in [0,1]); y is unbounded
  // (the 'bouncy' preset itself uses bzY1: 1.56) — do not clamp y.
  bzX1: z.number().min(0).max(1),
  bzY1: z.number(),
  bzX2: z.number().min(0).max(1),
  bzY2: z.number(),
  toggleHeightRatio: z.number().min(-100).max(100),

  // Border & focus
  borderWidth: z.number().min(0),
  borderColor: hex,
  borderStyle: z.enum(['solid', 'dashed', 'dotted']),
  focusColor: hex,
  focusSize: z.number().min(0),
  focusStyle: z.enum(['tint', 'glow', 'outline', 'none']),
  hoverLift: z.number().min(0),
  textWrap: z.boolean(),

  // Per-property animation timing
  shadowAnimDelay: z.number().min(0).max(45),
  colorAnimDelay: z.number().min(0).max(45),

  // Icon (Material Symbols glyph)
  iconName: z.string(),
  iconPosition: z.enum(['left', 'right']),
  iconScale: z.number().min(0),
  iconGap: z.number().min(0),
  iconUseColor: z.boolean(),
  iconColor: hex,
  iconFill: z.boolean(),

  // Edge-pinned icon layout (issue #30)
  iconPlacement: z.enum(['inline', 'edge']),
  iconInset: z.number().min(0),

  // Inline SVG icon (issue #31)
  iconSvg: z.string().regex(/^$|^\s*<svg[\s>]/i, { error: 'must be inline <svg> markup or empty' }),

  // Realism pack (#7a specular hotspot, #7c contact shadow)
  specularAlpha: pct0to100,
  lightAngleX: pct0to100,
  lightAngleY: pct0to100,
  specularSize: pct0to100,
  contactIntensity: pct0to100,

  // Per-button variants (issue #29) — v1: color + icon family only.
  variants: z.record(
    z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: 'variant keys are label slugs' }),
    z.strictObject({
      faceColor: z.string().optional(),
      textColor: z.string().optional(),
      iconName:  z.string().optional(),
      iconColor: z.string().optional(),
      // Per-segment tri-state latch accent (issue #37).
      toggleColor: z.string().optional(),
    }),
  ).default({}),
});

/** @typedef {import('zod').infer<typeof ClickyConfigSchema>} ClickyConfigParsed */

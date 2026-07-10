# Collage Dimensions: Vocabulary, Taxonomies, and a Worked Example

Use this when decoding a reference or calibrating a JSON spec. Correct, specific terminology is what makes a spec reproducible on nano-banana-2. "Soft paper look" is weaker than "matte uncoated paper field with fine fiber grain, cut-outs at 50 lpi halftone, 6px drop shadow at 30 percent opacity". Reach for the specific name. No em dashes in any output you produce from this.

## Table of contents

1. Medium and craft
2. Color field
3. Halftone and element treatment
4. Cut, edge, and drop shadow
5. Composition and depth
6. The idea (concept per scene)
7. Label and typography
8. Mood vocabulary
9. Named collage looks
10. Worked example

---

## 1. Medium and craft

Name the craft precisely, because each one prompts differently:

- **Layered paper-cut**: discrete paper shapes stacked with visible edges and shadows between layers.
- **Halftone print collage**: elements carry a printed-dot pattern, magazine or risograph feel, often black-and-white pieces on a flat color field.
- **Stop-motion graphic**: paper or card elements shot frame by frame, slight imperfection and handmade jitter.
- **Mixed collage**: torn paper, cut paper, printed scraps, and flat shapes combined.
- **Flat vector pretending to be paper**: clean digital shapes with faux paper texture; call this out, it lacks real fiber and edge variance.

The signature editorial look the creator wants is usually halftone print collage on a flat bold color field, with clean machine-cut edges and a soft drop shadow lifting each piece.

## 2. Color field

The background is one strong even color with no shading. Capture:

- **background_hex**: the exact dominant field color.
- **evenness**: perfectly flat, or a subtle vignette or gradient.
- **paper_grain**: none (pure digital flat), fine uncoated-paper fiber, visible tooth, or risograph mottle.

The flat field is what makes the cut-outs pop. Get the hex right; generators drift on saturated fields.

## 3. Halftone and element treatment

Halftone is the printed-dot pattern that gives elements their craft texture. Describe:

- **Density / frequency**: coarse (large visible dots, ~25 to 45 lpi feel) vs fine (~65 to 85 lpi, near-continuous).
- **Dot shape**: round, square, or line-screen.
- **Tonality**: black-and-white halftone, single-color halftone, or duotone.
- **Coverage**: full element, or halftone only in the shadow areas with flat highlights.

Coarse dots read as bold and graphic; fine dots read as premium and restrained.

## 4. Cut, edge, and drop shadow

What makes a piece read as a distinct object sitting on the field:

- **Cut edge**: crisp machine-cut (clean vector outline), hand-cut (slight wobble), or torn (rough fibrous edge).
- **Outline**: none, thin keyline, or white paper border around the cut shape.
- **Drop shadow**: give offset (for example 6px down-right), softness (hard, soft, or diffuse), and opacity (for example 25 to 35 percent). The shadow distance implies how far the layer floats above the field.

State each element's shadow separately when layers float at different heights.

## 5. Composition and depth

- **Layout**: centered, rule of thirds, asymmetric with counterweight, radial.
- **Depth layers**: foreground pieces over midground over the flat field. Name what sits on what.
- **Negative space**: how much empty field, and where, since the assembly motion uses the empty field as its starting state.
- **Balance**: symmetrical, weighted with negative-space counterbalance.

## 6. The idea (concept per scene)

Each scene carries one concept or visual pun, not just decoration. The idea is the memorable part and the thing to protect across variations. Examples of idea types: a literal metaphor (a figure conducting the scene), a pun (a "bright idea" lightbulb), a process (lift-off, knockout, uphill climb). When decoding, state the idea in one sentence so a variation can keep the style and swap only the idea.

## 7. Label and typography

Labels are burned in at generation by nano-banana-2, never overlaid afterward. Capture:

- **content**: the 2 to 4 word scene label.
- **font_character**: grotesque sans, geometric sans, condensed, serif, hand-lettered.
- **weight and case**: bold, black, all-caps, tracked-out.
- **placement**: lower third, top-left, baseline-aligned to an element.
- **treatment**: solid flat color, knockout (field shows through letters), halftone-filled, slight letterpress deboss.

If labels degrade across rerolls, increase `nbGenerations` or simplify the label; do not switch to the overlay tool.

## 8. Mood vocabulary

Premium and restrained, bold and graphic, playful and witty, editorial and aspirational, retro-print nostalgic, clean and modern. Tie the mood to the technique that produces it: fine halftone plus flat desaturated field reads premium; coarse dots plus saturated field reads bold and playful.

## 9. Named collage looks

- **Editorial halftone collage**: flat bold field, fine black-and-white halftone cut-outs, crisp machine cut, soft low-opacity drop shadow, one sharp idea, restrained label. The default premium look.
- **Risograph collage**: limited 2 to 3 ink palette, visible misregistration, mottled grain, coarse dots, playful.
- **Torn-paper collage**: rough fibrous torn edges, layered scraps, tactile and handmade, warmer mood.
- **Bauhaus / geometric paper**: flat primary shapes, hard cut, minimal halftone, strong negative space, modernist.
- **Vintage magazine cut-out**: aged paper grain, slightly yellowed, mixed printed scraps, nostalgic.

## 10. Worked example

The level of completeness to aim for. (A hypothetical editorial collage frame, used only to show calibration.)

### Breakdown

**Medium and craft.** Halftone print collage on a flat color field. Black-and-white cut-out elements carry a fine printed-dot pattern, machine-cut with clean edges, each lifted off the field by a soft low-opacity drop shadow. Premium editorial print-craft, not flat digital.

**Color field.** A single flat cobalt field (#1F3FB0), perfectly even, with a fine uncoated-paper fiber grain that keeps it from looking pure digital.

**Elements and cut.** A central halftone hand (fine round-dot screen, ~70 lpi, black-and-white) holding a small cut-out chess king. The hand has a crisp machine-cut edge with a thin white paper keyline and a 6px soft drop shadow at 30 percent opacity, floating clearly above the field. The chess king is solid black halftone, sharper shadow, sitting closer to the hand layer.

**Composition and depth.** Rule-of-thirds, hand and king placed slightly right of center, generous cobalt negative space to the left for the label. Two depth layers over the field: hand over field, king over hand.

**Idea.** The decisive move. A single hand making the winning play, the whole scene built around that one beat.

**Label.** "THE BIG DECISION" lower-left, geometric sans, black weight, all-caps, tracked out, knockout so the cobalt field shows through the letters.

**Mood.** Premium, composed, quietly bold. Comes from the fine halftone plus the restrained single-color field plus the crisp cut.

### Generic prompt

Halftone print collage on a flat even cobalt field with fine uncoated-paper grain. A central black-and-white halftone cut-out of a hand, fine round-dot screen, crisp machine-cut edge with a thin white paper keyline and a soft 6px drop shadow at low opacity floating above the field, holds a small solid-black cut-out chess king sitting just above the hand layer. Composition on rule-of-thirds, hand and king right of center, generous cobalt negative space to the left. Burned-in label "THE BIG DECISION" lower-left in a geometric black all-caps sans, tracked out, knockout so the field shows through the letters. Flat even lighting, premium editorial print-craft, no gloss, no gradient on the field. Vertical 9:16.

### JSON spec

```json
{
  "medium": "halftone print collage",
  "craft_style": "editorial halftone collage on flat color field",
  "aspect_ratio": "9:16",
  "style_signature": "flat cobalt field, fine black-and-white halftone cut-outs, crisp machine cut with white keyline, soft low-opacity drop shadow, single sharp idea, restrained knockout label",
  "color_field": {
    "background_hex": "#1F3FB0",
    "evenness": "perfectly flat, no gradient",
    "paper_grain": "fine uncoated-paper fiber"
  },
  "elements": [
    {
      "what": "hand holding a chess king",
      "role": "primary subject",
      "halftone": "fine round-dot, ~70 lpi, black-and-white",
      "cut_edge": "crisp machine-cut with thin white paper keyline",
      "drop_shadow": "6px down-right, soft, 30 percent opacity",
      "color_treatment": "black-and-white halftone",
      "placement": "right of center, on the right thirds line"
    },
    {
      "what": "chess king",
      "role": "secondary, the decisive piece",
      "halftone": "solid black, minimal dot",
      "cut_edge": "crisp machine-cut",
      "drop_shadow": "3px, sharper, 35 percent opacity, sits closer to hand layer",
      "color_treatment": "solid black",
      "placement": "held above the hand"
    }
  ],
  "palette_hex": ["#1F3FB0", "#0A0A0A", "#FFFFFF"],
  "composition": {
    "layout": "rule of thirds",
    "depth_layers": "field, then hand over field, then king over hand",
    "negative_space": "generous cobalt space to the left for the label",
    "balance": "asymmetric, weighted right, balanced by left negative space"
  },
  "idea": "the decisive move, the whole scene built around one winning play",
  "label": {
    "present": "yes",
    "content": "THE BIG DECISION",
    "font_character": "geometric sans",
    "weight": "black, all-caps, tracked out",
    "placement": "lower-left in the negative space",
    "treatment": "knockout, cobalt field shows through the letters"
  },
  "mood": "premium, composed, quietly bold",
  "references_era": "contemporary editorial print-collage",
  "negative_prompt": "no gloss, no gradient on the field, no soft photographic blur, no 3D render, no flat digital vector without halftone, no oversaturation, no busy background"
}
```

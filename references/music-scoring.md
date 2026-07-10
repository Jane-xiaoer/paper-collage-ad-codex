# Music Scoring for Paper-Collage Ads

## Core rule

Treat music as a second storyteller, not a continuous background loop. Build a cue map from the locked scene timings and write one musical job per scene. Do not stretch or loop a short stock cue across a longer film unless the loop point is musically invisible and lands on a planned boundary.

## Score map

Create a table before choosing or generating music:

| Scene role | Musical job | Useful palette |
| --- | --- | --- |
| Pain joke | Establish comic tension and escalation | pizzicato, woodblock, muted bass, paper ticks |
| Product entrance | Give the product a recognizable two- or three-note motif | marimba, plucked synth, light brass pop |
| Capability proof | Add rhythmic layers while leaving the speech band open | brushed kit, hand percussion, short bass notes |
| Trust/privacy | Drop density and create a dry comic pause | bassoon or clarinet stab, single paper click, near-silence |
| Resolution/CTA | Return the product motif in a warmer register | glockenspiel, soft chord, restrained closing chime |

Mark exact cue points at every scene start, visual landing, joke reversal and CTA. The music does not need to hit every cut. Prioritize four to eight meaningful events across a short ad.

## Suitable sound world

For editorial paper collage, prefer tactile and slightly theatrical instrumentation:

- pizzicato strings, marimba, toy piano or muted plucks;
- brushed snare, woodblock, finger snaps and recorded paper percussion;
- warm muted bass with short notes;
- clarinet, bassoon or small brass accents for dry humor;
- a simple brand motif that can return at the end.

Avoid generic corporate ukulele, dense cinematic trailer drums, constant four-on-the-floor kick, bright lead vocals and busy melodies under narration.

## Sourcing strategies

Choose in this order:

1. **Bespoke cue:** generate or commission one instrumental at the final duration with the scene map embedded in the prompt.
2. **Stem-based construction:** obtain rhythm, bass and melodic stems; mute or thin layers under narration and add them at scene transitions.
3. **Section assembly:** generate or license five compatible sections in the same key, tempo and palette, then join them with short musical transitions.
4. **Stock cue edit:** use only when its phrase boundaries already align with the film. Cut on musical phrases, not arbitrary seconds.

When generating, request instrumental only, no vocals, no lead melody during speech, a clean ending and enough headroom. Generate at least two candidates: one drier and more comic, one warmer and more premium.

## Candidate analysis

Measure the candidate before committing:

- exact duration and whether it loops;
- phrase boundaries, silences and hard stops;
- energy at each scene boundary;
- density in the 1 to 4 kHz speech range;
- whether the final cadence resolves cleanly.

If the `music-to-video` skill is available, use its `analyze-beatgrid.py` once as the canonical structural analysis. On non-rhythmic music, trust energy, silence and phrase changes rather than an imposed BPM grid.

Reject a cue when it repeats the same energy block throughout, restarts visibly before the film ends or competes with the narrator.

## Mix and ducking

Use voice-triggered sidechain compression instead of a single fixed music level. The bundled `scripts/assemble.mjs` enables this through the production manifest:

```json
{
  "musicVolume": 0.1,
  "ducking": {
    "enabled": true,
    "threshold": 0.025,
    "ratio": 6,
    "attackMs": 20,
    "releaseMs": 280
  }
}
```

Aim for roughly 4 to 7 dB of reduction while narration is active. Keep release long enough that the bed returns naturally after each sentence. Automate additional dips before punchlines and brief rises during visual-only holds.

Use sound effects as punctuation, not replacement music. Keep the product motif, music accents and paper effects in one rhythmic family.

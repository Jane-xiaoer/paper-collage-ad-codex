#!/usr/bin/env node

// PREFERRED Phase 5 narration route: real voice via ElevenLabs multilingual (Chinese
// supported), replacing the robotic macOS `say` fallback. Manifest-driven, one clean
// 48 kHz WAV per line, durations measured so picture timing can be locked.
//
//   export ELEVENLABS_API_KEY=...
//   node narrate-elevenlabs.mjs --manifest voice-manifest.json --outdir assets/voice-final
//
// Manifest:
// {
//   "voiceId": "XB0fDUnXU5powFXDhCwa",   // optional; default Lily (clear female, zh)
//   "modelId": "eleven_multilingual_v2", // optional
//   "settings": { "stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": true },
//   "lines": [ { "id": "01", "text": "又一个打不开的文件。" } ]
// }
// Requires ffmpeg on PATH for the 48 kHz WAV conversion.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(m) { console.error(`narrate-elevenlabs: ${m}`); process.exit(1); }
function arg(name, fb = null) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fb; }

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) fail("set ELEVENLABS_API_KEY in the environment");

const manifestArg = arg("--manifest");
const outdirArg = arg("--outdir", "assets/voice-final");
if (!manifestArg) fail("usage: narrate-elevenlabs.mjs --manifest voice.json --outdir dir");
const manifest = JSON.parse(fs.readFileSync(path.resolve(manifestArg), "utf8"));
const voiceId = manifest.voiceId || "XB0fDUnXU5powFXDhCwa"; // Lily, clear female, handles Chinese
const modelId = manifest.modelId || "eleven_multilingual_v2";
const settings = manifest.settings || { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true };
const lines = manifest.lines || [];
if (!lines.length) fail("manifest has no lines");

const outdir = path.resolve(outdirArg);
fs.mkdirSync(outdir, { recursive: true });

function probeDuration(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return Number((r.stdout || "0").trim());
}

const summary = [];
for (const line of lines) {
  const id = String(line.id);
  console.log(`[${id}] «${line.text}»`);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": API_KEY },
    body: JSON.stringify({ text: line.text, model_id: modelId, voice_settings: settings }),
  });
  if (!res.ok) fail(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const mp3 = path.join(outdir, `${id}.mp3`);
  fs.writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
  const wav = path.join(outdir, `${id}.wav`);
  const conv = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp3, "-ar", "48000", "-ac", "1", wav]);
  if (conv.status !== 0) fail(`ffmpeg wav conversion failed for ${id}`);
  fs.rmSync(mp3);
  const dur = probeDuration(wav);
  console.log(`  -> ${wav}  ${dur.toFixed(2)}s`);
  summary.push({ id, duration: dur });
}
console.log("\nvoice durations:", JSON.stringify(summary));

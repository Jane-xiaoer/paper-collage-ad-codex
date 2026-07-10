#!/usr/bin/env node

// PREFERRED Phase 5 narration route for CHINESE: native voice via MiniMax T2A
// (speech-02-hd). Beats ElevenLabs for Mandarin and needs no paid-voice unlock.
// Manifest-driven, one 48 kHz WAV per line, per-line emotion, durations measured.
//
//   export MINIMAX_API_KEY=...                      # MINIMAX_GROUP_ID is optional
//   node narrate-minimax.mjs --manifest voice-manifest.json --outdir assets/voice-final
//
// Manifest:
// {
//   "model": "speech-02-hd",
//   "voiceId": "Chinese (Mandarin)_Warm_Girl",
//   "speed": 1.0, "vol": 1.0, "pitch": 0,
//   "lines": [ { "id": "01", "text": "又一个打不开的文件。", "emotion": "neutral" } ]
// }
// Domestic endpoint (api.minimaxi.chat) — do NOT route this through a foreign proxy.
// Requires ffmpeg for the 48 kHz WAV conversion.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(m) { console.error(`narrate-minimax: ${m}`); process.exit(1); }
function arg(name, fb = null) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fb; }

const API_KEY = process.env.MINIMAX_API_KEY;
if (!API_KEY) fail("set MINIMAX_API_KEY in the environment");
const GROUP_ID = process.env.MINIMAX_GROUP_ID;
const API_URL = GROUP_ID
  ? `https://api.minimaxi.chat/v1/t2a_v2?GroupId=${encodeURIComponent(GROUP_ID)}`
  : "https://api.minimaxi.chat/v1/t2a_v2";

const manifestArg = arg("--manifest");
const outdirArg = arg("--outdir", "assets/voice-final");
if (!manifestArg) fail("usage: narrate-minimax.mjs --manifest voice.json --outdir dir");
const m = JSON.parse(fs.readFileSync(path.resolve(manifestArg), "utf8"));
const model = m.model || "speech-02-hd";
const voiceId = m.voiceId || "Chinese (Mandarin)_Warm_Girl";
const lines = m.lines || [];
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
  console.log(`[${id}] «${line.text}»  (${line.emotion || "neutral"})`);
  const payload = {
    model, text: line.text, stream: false,
    voice_setting: {
      voice_id: line.voiceId || voiceId,
      speed: Number(line.speed ?? m.speed ?? 1.0),
      vol: Number(line.vol ?? m.vol ?? 1.0),
      pitch: Number(line.pitch ?? m.pitch ?? 0),
      emotion: line.emotion || "neutral",
    },
    audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
  };
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (result.base_resp?.status_code !== 0) fail(`MiniMax error: ${result.base_resp?.status_msg || JSON.stringify(result).slice(0, 300)}`);
  const mp3 = path.join(outdir, `${id}.mp3`);
  fs.writeFileSync(mp3, Buffer.from(result.data.audio, "hex"));
  const wav = path.join(outdir, `${id}.wav`);
  const conv = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp3, "-ar", "48000", "-ac", "1", wav]);
  if (conv.status !== 0) fail(`ffmpeg wav conversion failed for ${id}`);
  fs.rmSync(mp3);
  const dur = probeDuration(wav);
  console.log(`  -> ${wav}  ${dur.toFixed(2)}s`);
  summary.push({ id, duration: dur });
}
console.log("\nvoice durations:", JSON.stringify(summary));

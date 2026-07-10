#!/usr/bin/env node

// Generate one local IndexTTS-2 MLX narration WAV per storyboard line.
// Consumes only a local speaker .npz; no voice audio is uploaded to a service.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(message) {
  console.error(`narrate-indextts2: ${message}`);
  process.exit(1);
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) fail(`${command} failed with exit code ${result.status}`);
}

const manifestArg = arg("--manifest");
if (!manifestArg) fail("usage: narrate-indextts2.mjs --manifest voice.indextts2.json");

const manifestPath = path.resolve(manifestArg);
const base = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const resolveConfigPath = (value) => path.isAbsolute(value) ? value : path.resolve(base, value);
const runtimeDir = resolveConfigPath(
  manifest.runtimeDir ||
  process.env.PAPER_COLLAGE_TTS_HOME ||
  path.join(os.homedir(), ".local/share/paper-collage-ad/mlx-indextts")
);
const modelDir = resolveConfigPath(
  manifest.modelDir ||
  process.env.INDEXTTS_MODEL_DIR ||
  path.join(runtimeDir, "models/mlx-indextts2-standard-fp16")
);
const speaker = path.resolve(base, manifest.speaker || "../assets/voice-model/speaker-v2.npz");
const outputDir = path.resolve(base, manifest.outputDir || "../assets/voice-final");
const lines = manifest.lines || [];

if (!fs.existsSync(runtimeDir)) fail(`runtime not found: ${runtimeDir}`);
if (!fs.existsSync(modelDir)) fail(`model not found: ${modelDir}`);
if (!fs.existsSync(speaker)) fail(`private speaker file not found: ${speaker}`);
if (!lines.length) fail("manifest has no narration lines");

fs.mkdirSync(outputDir, { recursive: true });

for (const [index, line] of lines.entries()) {
  const id = String(line.id ?? index + 1).replace(/[^a-zA-Z0-9_-]/g, "-");
  if (!line.text) fail(`line ${id} has no text`);

  const raw = path.join(outputDir, `${id}.raw.wav`);
  const output = path.join(outputDir, `${id}.wav`);
  const emotion = line.emotion ?? manifest.emotion ?? "calm:0.70,happy:0.20,surprised:0.10";
  const emoAlpha = Number(line.emoAlpha ?? manifest.emoAlpha ?? 0.55);
  const diffusionSteps = Number(line.diffusionSteps ?? manifest.diffusionSteps ?? 20);
  const speed = Number(line.speed ?? manifest.speed ?? 1.03);
  const seed = Number(line.seed ?? 2100 + index);
  const memoryLimit = Number(line.memoryLimit ?? manifest.memoryLimit ?? 20);

  console.log(`[${id}] ${line.text}`);
  run("uv", [
    "run", "mlx-indextts", "generate",
    "-m", modelDir,
    "-r", speaker,
    "-t", line.text,
    "-o", raw,
    "--emotion", emotion,
    "--emo-alpha", String(emoAlpha),
    "--diffusion-steps", String(diffusionSteps),
    "--speed", String(speed),
    "--seed", String(seed),
    "--memory-limit", String(memoryLimit)
  ], { cwd: runtimeDir });

  run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", raw,
    "-ar", "48000", "-ac", "1", output
  ]);
  fs.rmSync(raw, { force: true });
  console.log(`  -> ${output}`);
}

console.log(`Generated ${lines.length} local narration file(s) in ${outputDir}`);

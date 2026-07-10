#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(message) {
  console.error(`assemble: ${message}`);
  process.exit(1);
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function probeDuration(file) {
  const result = spawnSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file
  ], { encoding: "utf8" });
  if (result.status !== 0) fail(`cannot probe ${file}`);
  return Number(result.stdout.trim());
}

const manifestArg = arg("--manifest");
const outputArg = arg("--output");
if (!manifestArg || !outputArg) fail("usage: assemble.mjs --manifest manifest.json --output video.mp4");

const manifestPath = path.resolve(manifestArg);
const base = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const scenes = manifest.scenes || [];
if (!scenes.length) fail("manifest has no scenes");

const width = Number(manifest.width || 1920);
const height = Number(manifest.height || 1080);
const fps = Number(manifest.fps || 30);
const crf = Number(manifest.crf || 18);
const voiceGain = Number(manifest.voiceGain || 1.1);
const musicVolume = Number(manifest.musicVolume || 0.1);
const targetLufs = Number(manifest.targetLufs || -16);
const truePeak = Number(manifest.truePeak || -1.5);
const ducking = manifest.ducking || {};
const duckingEnabled = ducking.enabled !== false;
const duckThreshold = Number(ducking.threshold || 0.025);
const duckRatio = Number(ducking.ratio || 6);
const duckAttack = Number(ducking.attackMs || 20);
const duckRelease = Number(ducking.releaseMs || 280);
const totalDuration = scenes.reduce((sum, scene) => sum + Number(scene.duration), 0);

const resolveFile = (value) => path.resolve(base, value);
const args = ["-y", "-loglevel", "error"];
const videoInputs = [];
const voiceInputs = [];
const sfxInputs = [];

for (const scene of scenes) {
  const file = resolveFile(scene.video);
  if (!fs.existsSync(file)) fail(`missing scene video: ${file}`);
  args.push("-i", file);
  videoInputs.push({ file, scene, index: videoInputs.length });
}

for (const scene of scenes) {
  if (!scene.voice) continue;
  const file = resolveFile(scene.voice);
  if (!fs.existsSync(file)) fail(`missing voice: ${file}`);
  const index = args.filter((value) => value === "-i").length;
  args.push("-i", file);
  voiceInputs.push({ index, scene });
}

let musicInput = null;
if (manifest.music) {
  const file = resolveFile(manifest.music);
  if (!fs.existsSync(file)) fail(`missing music: ${file}`);
  const index = args.filter((value) => value === "-i").length;
  args.push("-stream_loop", "-1", "-i", file);
  musicInput = { index };
}

let sceneOffset = 0;
for (const scene of scenes) {
  for (const sfx of scene.sfx || []) {
    const file = resolveFile(sfx.file);
    if (!fs.existsSync(file)) fail(`missing sound effect: ${file}`);
    const index = args.filter((value) => value === "-i").length;
    args.push("-i", file);
    sfxInputs.push({ index, at: sceneOffset + Number(sfx.at || 0), volume: Number(sfx.volume || 0.2) });
  }
  sceneOffset += Number(scene.duration);
}

const filters = [];
for (const { file, scene, index } of videoInputs) {
  const sourceDuration = Number(scene.sourceDuration || probeDuration(file));
  const duration = Number(scene.duration);
  filters.push(
    `[${index}:v]scale=${width}:${height},setpts=PTS*${duration}/${sourceDuration},` +
    `fps=${fps},trim=duration=${duration},setpts=PTS-STARTPTS[v${index}]`
  );
}
filters.push(`${videoInputs.map(({ index }) => `[v${index}]`).join("")}concat=n=${scenes.length}:v=1:a=0[video]`);

const voiceLabels = [];
sceneOffset = 0;
let voiceNumber = 0;
for (const scene of scenes) {
  if (scene.voice) {
    const { index } = voiceInputs[voiceNumber];
    const delay = Math.round((sceneOffset + Number(scene.voiceStart || 0.35)) * 1000);
    const label = `voice${voiceNumber}`;
    filters.push(
      `[${index}:a]highpass=f=70,loudnorm=I=-18:TP=-2:LRA=7,volume=${voiceGain},` +
      `adelay=delays=${delay}:all=1[${label}]`
    );
    voiceLabels.push(`[${label}]`);
    voiceNumber += 1;
  }
  sceneOffset += Number(scene.duration);
}

if (musicInput) {
  filters.push(
    `[${musicInput.index}:a]atrim=0:${totalDuration},volume=${musicVolume},` +
    `afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, totalDuration - 2)}:d=2[music_raw]`
  );
}

const audioLabels = [];
if (voiceLabels.length) {
  if (voiceLabels.length === 1) {
    filters.push(`${voiceLabels[0]}anull[voices]`);
  } else {
    filters.push(`${voiceLabels.join("")}amix=inputs=${voiceLabels.length}:duration=longest:dropout_transition=0[voices]`);
  }

  if (musicInput && duckingEnabled) {
    filters.push("[voices]asplit=2[voices_mix][voices_key]");
    filters.push(
      `[music_raw][voices_key]sidechaincompress=threshold=${duckThreshold}:ratio=${duckRatio}:` +
      `attack=${duckAttack}:release=${duckRelease}[music]`
    );
    audioLabels.push("[voices_mix]", "[music]");
  } else {
    audioLabels.push("[voices]");
    if (musicInput) audioLabels.push("[music_raw]");
  }
} else if (musicInput) {
  audioLabels.push("[music_raw]");
}

sfxInputs.forEach(({ index, at, volume }, number) => {
  const delay = Math.round(at * 1000);
  filters.push(`[${index}:a]volume=${volume},adelay=delays=${delay}:all=1[sfx${number}]`);
  audioLabels.push(`[sfx${number}]`);
});

const hasAudio = audioLabels.length > 0;
if (hasAudio) {
  filters.push(
    `${audioLabels.join("")}amix=inputs=${audioLabels.length}:duration=longest:dropout_transition=0,` +
    `loudnorm=I=${targetLufs}:TP=${truePeak}:LRA=9,apad=pad_dur=${totalDuration},` +
    `atrim=0:${totalDuration}[audio]`
  );
}

const output = path.resolve(outputArg);
fs.mkdirSync(path.dirname(output), { recursive: true });
args.push("-filter_complex", filters.join(";"), "-map", "[video]");
if (hasAudio) args.push("-map", "[audio]");
args.push(
  "-t", String(totalDuration), "-r", String(fps),
  "-c:v", "libx264", "-preset", "medium", "-crf", String(crf),
  "-pix_fmt", "yuv420p"
);
if (hasAudio) args.push("-c:a", "aac", "-b:a", "256k");
args.push("-movflags", "+faststart", output);

const render = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (render.status !== 0) fail("ffmpeg render failed");

const probe = spawnSync("ffprobe", [
  "-v", "error",
  "-show_entries", "stream=index,codec_name,codec_type,duration,nb_frames,width,height,r_frame_rate",
  "-of", "json", output
], { encoding: "utf8" });
if (probe.status !== 0) fail("ffprobe validation failed");
const metadata = JSON.parse(probe.stdout);
const video = metadata.streams.find((stream) => stream.codec_type === "video");
const audio = metadata.streams.find((stream) => stream.codec_type === "audio");
if (!video) fail("render has no video stream");
if (video.codec_name !== "h264") fail(`unexpected video codec: ${video.codec_name}`);
if (video.width !== width || video.height !== height) fail("video dimensions do not match manifest");
if (Math.abs(Number(video.duration) - totalDuration) > 0.08) fail("video duration does not match manifest");
if (Math.abs(Number(video.nb_frames) - Math.round(totalDuration * fps)) > 2) fail("video frame count does not match manifest");
if (hasAudio && (!audio || audio.codec_name !== "aac" || Math.abs(Number(audio.duration) - totalDuration) > 0.08)) {
  fail("audio stream does not match manifest");
}

console.log(`rendered and verified: ${output}`);
console.log(`${width}x${height}, ${fps}fps, ${totalDuration.toFixed(3)}s, ${video.nb_frames} frames`);

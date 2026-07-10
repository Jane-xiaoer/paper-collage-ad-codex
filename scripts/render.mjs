#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(message) {
  console.error(`render: ${message}`);
  process.exit(1);
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const manifestArg = arg("--manifest");
const outputArg = arg("--output");
if (!manifestArg || !outputArg) fail("usage: render.mjs --manifest manifest.json --output video.mp4");

const manifestPath = path.resolve(manifestArg);
const base = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const width = Number(manifest.width || 1920);
const height = Number(manifest.height || 1080);
const fps = Number(manifest.fps || 30);
const crf = Number(manifest.crf || 17);
const scenes = manifest.scenes || [];
if (!scenes.length) fail("manifest has no scenes");

const allowedTransitions = new Set([
  "fade", "fadeblack", "fadewhite", "slideleft", "slideright", "slideup", "slidedown",
  "smoothleft", "smoothright", "smoothup", "smoothdown", "squeezeh", "squeezev", "wipeleft", "wiperight"
]);

const inputs = [];
for (const scene of scenes) {
  const image = path.resolve(base, scene.image);
  if (!fs.existsSync(image)) fail(`missing image: ${image}`);
  inputs.push("-i", image);
}

const audioPath = manifest.audio ? path.resolve(base, manifest.audio) : null;
if (audioPath && !fs.existsSync(audioPath)) fail(`missing audio: ${audioPath}`);
if (audioPath) inputs.push("-i", audioPath);

const filters = [];
for (let i = 0; i < scenes.length; i += 1) {
  const scene = scenes[i];
  const transitionDuration = i < scenes.length - 1 ? Number(scene.transitionDuration ?? 0.4) : 0;
  const frames = Math.ceil((Number(scene.duration) + transitionDuration) * fps);
  const zoomPerFrame = Number(scene.zoomPerFrame ?? 0.00016);
  const maxZoom = Number(scene.maxZoom ?? 1.02);
  filters.push(
    `[${i}:v]scale=${width}:${height},` +
    `zoompan=z='min(zoom+${zoomPerFrame},${maxZoom})':` +
    `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
    `d=${frames}:s=${width}x${height}:fps=${fps},setsar=1,setpts=PTS-STARTPTS[v${i}]`
  );
}

let current = "v0";
let offset = 0;
for (let i = 1; i < scenes.length; i += 1) {
  offset += Number(scenes[i - 1].duration);
  const previous = scenes[i - 1];
  const transition = previous.transition || "fade";
  if (!allowedTransitions.has(transition)) fail(`unsupported transition: ${transition}`);
  const transitionDuration = Number(previous.transitionDuration ?? 0.4);
  const output = i === scenes.length - 1 ? "video" : `x${i}`;
  filters.push(`[${current}][v${i}]xfade=transition=${transition}:duration=${transitionDuration}:offset=${offset}[${output}]`);
  current = output;
}

if (scenes.length === 1) {
  filters.push(`[v0]format=yuv420p[video]`);
} else {
  filters[filters.length - 1] = filters[filters.length - 1].replace("[video]", ",format=yuv420p[video]");
}

const totalDuration = scenes.reduce((sum, scene) => sum + Number(scene.duration), 0);
const outputPath = path.resolve(outputArg);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const args = [
  "-y", "-loglevel", "error", ...inputs,
  "-filter_complex", filters.join(";"),
  "-map", "[video]"
];
if (audioPath) args.push("-map", `${scenes.length}:a`);
args.push(
  "-t", String(totalDuration), "-r", String(fps),
  "-c:v", "libx264", "-preset", "slow", "-crf", String(crf),
  "-profile:v", "high", "-pix_fmt", "yuv420p"
);
if (audioPath) args.push("-c:a", "aac", "-b:a", "192k");
args.push("-movflags", "+faststart", outputPath);

const render = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (render.status !== 0) fail("ffmpeg failed");

const probe = spawnSync("ffprobe", [
  "-v", "error", "-show_entries", "stream=index,codec_name,duration,nb_frames,width,height,r_frame_rate",
  "-of", "json", outputPath
], { encoding: "utf8" });
if (probe.status !== 0) fail("ffprobe failed");

const metadata = JSON.parse(probe.stdout);
const video = metadata.streams.find((stream) => stream.width);
const audio = metadata.streams.find((stream) => !stream.width);
if (!video) fail("render has no video stream");
if (video.width !== width || video.height !== height) fail("video dimensions do not match manifest");
if (Math.abs(Number(video.duration) - totalDuration) > 0.08) fail(`video duration ${video.duration} does not match ${totalDuration}`);
if (audioPath && (!audio || Math.abs(Number(audio.duration) - totalDuration) > 0.08)) fail("audio duration does not match video");
const expectedFrames = Math.round(totalDuration * fps);
if (Math.abs(Number(video.nb_frames) - expectedFrames) > 2) fail(`video has ${video.nb_frames} frames, expected ${expectedFrames}`);

console.log(`rendered ${outputPath}`);
console.log(`verified ${width}x${height} ${fps}fps ${totalDuration.toFixed(3)}s ${video.nb_frames} frames`);

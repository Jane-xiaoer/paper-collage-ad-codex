#!/usr/bin/env node

// Deterministic local layered "stop-motion" animator for one paper-collage scene.
//
// Turns a flattened keyframe that you have split into cut-out layers into a scene
// MP4: elements slide in from the edges with stepped stop-motion cadence, then the
// untouched finished frame crossfades over the assembled result for a clean final
// hold. No image-to-video model required. Consumes the same prepared-assets model as
// render.mjs and produces a scene MP4 that assemble.mjs can stitch.
//
//   node layer-animate.mjs --manifest layer-manifest.json --output renders/scene-01.mp4
//
// Manifest (one scene per file):
// {
//   "width": 1920, "height": 1080, "fps": 30, "crf": 18,
//   "duration": 6,
//   "background": "assets/layers/s1-field.png",   // empty paper field, full frame
//   "finalFrame": "assets/keyframes/scene-01.png", // flattened finished frame, full frame
//   "finalHold": 1.2,        // seconds to hold the finished frame at the end
//   "fadeDuration": 0.5,     // crossfade length into the finished frame
//   "steps": 8,              // stop-motion quantization of every entrance
//   "layers": [
//     { "image": "assets/layers/s1-hand.png", "from": "left",
//       "x": 640, "y": 300, "startAt": 0.3, "travel": 1.0 }
//   ]
// }
//
// Each layer image must be a transparent PNG cut-out that already includes its own
// soft drop shadow, sized/placed so that (x, y) is its final top-left on the canvas.
// "from" is the edge it enters from: left | right | top | bottom | none.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(message) {
  console.error(`layer-animate: ${message}`);
  process.exit(1);
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const manifestArg = arg("--manifest");
const outputArg = arg("--output");
if (!manifestArg || !outputArg) {
  fail("usage: layer-animate.mjs --manifest layer-manifest.json --output scene.mp4");
}

const manifestPath = path.resolve(manifestArg);
const base = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const width = Number(manifest.width || 1920);
const height = Number(manifest.height || 1080);
const fps = Number(manifest.fps || 30);
const crf = Number(manifest.crf || 18);
const duration = Number(manifest.duration);
if (!duration || duration <= 0) fail("manifest needs a positive duration");
const steps = Math.max(1, Number(manifest.steps || 8));
const finalHold = Number(manifest.finalHold ?? 1.2);
const fadeDuration = Number(manifest.fadeDuration ?? 0.5);
const layers = manifest.layers || [];

const resolveFile = (value) => path.resolve(base, value);

const backgroundFile = manifest.background ? resolveFile(manifest.background) : null;
if (!backgroundFile || !fs.existsSync(backgroundFile)) fail("missing background field image");
const finalFile = manifest.finalFrame ? resolveFile(manifest.finalFrame) : null;
if (!finalFile || !fs.existsSync(finalFile)) fail("missing finalFrame image");

// Crossfade into the finished frame during the last finalHold seconds.
const fadeStart = Math.max(0, duration - finalHold);
if (fadeStart + fadeDuration > duration + 0.001) {
  fail("finalHold is longer than the scene; reduce finalHold or fadeDuration");
}

// Build ffmpeg inputs: background, each layer, then the final frame. All are stills
// looped for the full duration so overlay expressions have frames at every timestamp.
const inputs = ["-loop", "1", "-t", String(duration), "-i", backgroundFile];
for (const layer of layers) {
  const file = resolveFile(layer.image);
  if (!fs.existsSync(file)) fail(`missing layer image: ${file}`);
  inputs.push("-loop", "1", "-t", String(duration), "-i", file);
}
inputs.push("-loop", "1", "-t", String(duration), "-i", finalFile);
const finalIndex = layers.length + 1;

// Stepped entrance expression for one axis. Off-screen before startAt, quantized
// travel to the final coordinate, then held. `w`/`h` inside overlay = overlay size.
function steppedExpr(startAt, travel, finalCoord, offEdgeExpr, sign) {
  const s = Number(startAt || 0);
  const tv = Math.max(0.0001, Number(travel ?? 1.0));
  // progress quantized into `steps` stop-motion notches
  const q = `floor((t-${s})/${tv}*${steps})/${steps}`;
  // position = offEdge + q * (final - offEdge)
  const moving = `(${offEdgeExpr})+${q}*((${finalCoord})-(${offEdgeExpr}))`;
  return `if(lt(t,${s}),${offEdgeExpr},if(gt(t,${s}+${tv}),${finalCoord},${moving}))`;
}

const filters = [];
filters.push(`[0:v]scale=${width}:${height},fps=${fps},trim=duration=${duration},setpts=PTS-STARTPTS[bg]`);

layers.forEach((layer, i) => {
  filters.push(`[${i + 1}:v]format=rgba,fps=${fps}[ly${i}]`);
});

filters.push(
  `[${finalIndex}:v]scale=${width}:${height},format=rgba,` +
  `fade=t=in:st=${fadeStart}:d=${fadeDuration}:alpha=1,` +
  `fps=${fps},trim=duration=${duration},setpts=PTS-STARTPTS[final]`
);

let current = "bg";
layers.forEach((layer, i) => {
  const fx = Number(layer.x || 0);
  const fy = Number(layer.y || 0);
  const from = (layer.from || "none").toLowerCase();
  let xExpr = String(fx);
  let yExpr = String(fy);
  if (from === "left") {
    xExpr = steppedExpr(layer.startAt, layer.travel, fx, "0-w", -1);
  } else if (from === "right") {
    xExpr = steppedExpr(layer.startAt, layer.travel, fx, `${width}`, 1);
  } else if (from === "top") {
    yExpr = steppedExpr(layer.startAt, layer.travel, fy, "0-h", -1);
  } else if (from === "bottom") {
    yExpr = steppedExpr(layer.startAt, layer.travel, fy, `${height}`, 1);
  } else if (from !== "none") {
    fail(`unsupported "from" for a layer: ${from} (use left|right|top|bottom|none)`);
  }
  const out = `o${i}`;
  // Single-quote the expressions so their commas/colons are literal to ffmpeg.
  filters.push(`[${current}][ly${i}]overlay=x='${xExpr}':y='${yExpr}':eof_action=repeat[${out}]`);
  current = out;
});

// Composite the finished frame (alpha fading in) over the assembled result.
filters.push(`[${current}][final]overlay=x=0:y=0:format=auto,format=yuv420p[video]`);

const outputPath = path.resolve(outputArg);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const args = [
  "-y", "-loglevel", "error", ...inputs,
  "-filter_complex", filters.join(";"),
  "-map", "[video]",
  "-t", String(duration), "-r", String(fps),
  "-c:v", "libx264", "-preset", "slow", "-crf", String(crf),
  "-profile:v", "high", "-pix_fmt", "yuv420p",
  "-movflags", "+faststart", outputPath
];

const render = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (render.status !== 0) fail("ffmpeg failed");

const probe = spawnSync("ffprobe", [
  "-v", "error", "-show_entries", "stream=index,codec_name,codec_type,duration,nb_frames,width,height,r_frame_rate",
  "-of", "json", outputPath
], { encoding: "utf8" });
if (probe.status !== 0) fail("ffprobe failed");
const metadata = JSON.parse(probe.stdout);
const video = metadata.streams.find((stream) => stream.codec_type === "video");
if (!video) fail("render has no video stream");
if (video.codec_name !== "h264") fail(`unexpected video codec: ${video.codec_name}`);
if (video.width !== width || video.height !== height) fail("video dimensions do not match manifest");
if (Math.abs(Number(video.duration) - duration) > 0.08) fail(`video duration ${video.duration} does not match ${duration}`);
const expectedFrames = Math.round(duration * fps);
if (Math.abs(Number(video.nb_frames) - expectedFrames) > 2) fail(`video has ${video.nb_frames} frames, expected ${expectedFrames}`);

console.log(`rendered and verified: ${outputPath}`);
console.log(`${width}x${height}, ${fps}fps, ${duration.toFixed(3)}s, ${video.nb_frames} frames, ${layers.length} layers`);

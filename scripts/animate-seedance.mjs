#!/usr/bin/env node

// PREFERRED "更精致" Phase 4 animation route: Seedance via Volcengine Ark (Doubao).
// Higher-fidelity image-to-video than jimeng. Bearer-token auth (no SigV4).
// Manifest-driven, async submit + poll + download + probe. Behind Clash/TUN, export
// HTTPS_PROXY to the local proxy so node's fetch reaches ark.cn-beijing.volces.com.
//
//   export ARK_API_KEY=...
//   HTTPS_PROXY=http://127.0.0.1:7890 node animate-seedance.mjs --manifest anim.json --outdir renders
//
// Manifest:
// {
//   "model": "doubao-seedance-1-0-pro-250528",
//   "scenes": [
//     { "id": "scene-02", "image": "assets/keyframes/scene-02.jpg",
//       "prompt": "定格动画质感，快门叶片缓缓旋转张开，卡片依次向外摊开",
//       "ratio": "16:9", "duration": 5, "resolution": "1080p" }
//   ]
// }
// Seedance reads shot params from the text tail as flags; this script appends them.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(m) { console.error(`animate-seedance: ${m}`); process.exit(1); }
function arg(name, fb = null) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fb; }

const KEY = process.env.ARK_API_KEY;
if (!KEY) fail("set ARK_API_KEY in the environment");
const BASE = process.env.ARK_BASE || "https://ark.cn-beijing.volces.com/api/v3";

const manifestArg = arg("--manifest");
const outdirArg = arg("--outdir", "renders");
const limit = Number(arg("--limit", "0"));
if (!manifestArg) fail("usage: animate-seedance.mjs --manifest anim.json --outdir dir [--limit N]");
const manifestPath = path.resolve(manifestArg);
const base = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const model = manifest.model || "doubao-seedance-1-0-pro-250528";
const outdir = path.resolve(outdirArg);
fs.mkdirSync(outdir, { recursive: true });
let scenes = manifest.scenes || [];
if (limit > 0) scenes = scenes.slice(0, limit);
if (!scenes.length) fail("manifest has no scenes");

async function submit(scene) {
  const img = path.resolve(base, scene.image);
  if (!fs.existsSync(img)) fail(`missing image: ${img}`);
  const b64 = fs.readFileSync(img).toString("base64");
  const ratio = scene.ratio || "16:9";
  const dur = scene.duration || 5;
  const resolution = scene.resolution || "1080p";
  const text = `${scene.prompt}  --resolution ${resolution} --ratio ${ratio} --duration ${dur} --camerafixed false`;
  const res = await fetch(`${BASE}/contents/generations/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${KEY}` },
    body: JSON.stringify({ model, content: [
      { type: "text", text },
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}` } },
    ] }),
  });
  const data = await res.json();
  if (!res.ok || !data.id) fail(`submit ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data.id;
}

async function poll(id, maxMs = 420000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const res = await fetch(`${BASE}/contents/generations/tasks/${id}`, {
      headers: { "Authorization": `Bearer ${KEY}` },
    });
    const data = await res.json();
    const status = data.status;
    process.stdout.write(`  status=${status}\n`);
    if (status === "succeeded") {
      const url = data.content?.video_url;
      if (url) return url;
      fail("succeeded but no video_url");
    } else if (status === "failed" || status === "canceled") {
      fail(`task ${status}: ${JSON.stringify(data.error || data).slice(0, 300)}`);
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
  fail("timed out");
}

const results = [];
for (const scene of scenes) {
  const id = scene.id || path.basename(scene.image).replace(/\.[^.]+$/, "");
  console.log(`\n[${id}] submitting seedance ${model}`);
  const taskId = await submit(scene);
  console.log(`  task=${taskId}`);
  const url = await poll(taskId);
  const out = path.join(outdir, `${id}.mp4`);
  fs.writeFileSync(out, Buffer.from(await (await fetch(url)).arrayBuffer()));
  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height,duration,nb_frames", "-of", "json", out], { encoding: "utf8" });
  const meta = JSON.parse(probe.stdout || "{}").streams?.find((s) => s.width) || {};
  console.log(`  saved ${out}  ${meta.width}x${meta.height} ${Number(meta.duration || 0).toFixed(2)}s`);
  results.push({ id, out });
  await new Promise((r) => setTimeout(r, 3000));
}
console.log(`\ndone: ${results.length} clip(s)`);

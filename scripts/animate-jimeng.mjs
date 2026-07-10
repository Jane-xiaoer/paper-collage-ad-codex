#!/usr/bin/env node

// PREFERRED Phase 4 animation route: real image-to-video via 即梦 (Volcengine Jimeng).
// Turns each finished paper-collage keyframe into a short model-animated clip (paper
// elements settling, a shutter rotating open, cards fanning out) instead of a flat
// camera push. Self-contained: manual Volcengine SigV4 signing, no SDK dependency.
//
//   export JIMENG_ACCESS_KEY=... JIMENG_SECRET_KEY=...
//   node animate-jimeng.mjs --manifest anim-manifest.json --outdir renders [--limit N]
//
// Manifest:
// {
//   "reqKey": "jimeng_ti2v_v30_pro",   // optional
//   "aspectRatio": "16:9",             // 16:9 -> 1920x1088
//   "scenes": [
//     { "id": "scene-01", "image": "assets/keyframes/scene-01.jpg",
//       "prompt": "纸片文件轻轻晃动，问号缓缓浮动，镜头极缓推近", "frames": 121 }
//   ]
// }
// frames: 121 = 5s, 241 = 10s. Output: <outdir>/<id>.mp4 (downloaded + probed).

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

function fail(m) { console.error(`animate-jimeng: ${m}`); process.exit(1); }
function arg(name, fb = null) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fb; }

const HOST = "visual.volcengineapi.com";
const REGION = "cn-north-1";
const SERVICE = "cv";

const AK = process.env.JIMENG_ACCESS_KEY;
const SK = process.env.JIMENG_SECRET_KEY;
if (!AK || !SK) fail("set JIMENG_ACCESS_KEY and JIMENG_SECRET_KEY in the environment");

const hmac = (k, d) => crypto.createHmac("sha256", k).update(d).digest();
const sha256hex = (d) => crypto.createHash("sha256").update(d).digest("hex");

function signedHeaders(action, body) {
  const xdate = new Date().toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[-:]/g, "");
  const shortDate = xdate.slice(0, 8);
  const query = `Action=${action}&Version=2022-08-31`; // Action < Version, already sorted
  const payloadHash = sha256hex(body);
  const canonicalHeaders =
    `content-type:application/json\nhost:${HOST}\nx-content-sha256:${payloadHash}\nx-date:${xdate}\n`;
  const signed = "content-type;host;x-content-sha256;x-date";
  const canonicalRequest = ["POST", "/", query, canonicalHeaders, signed, payloadHash].join("\n");
  const scope = `${shortDate}/${REGION}/${SERVICE}/request`;
  const stringToSign = ["HMAC-SHA256", xdate, scope, sha256hex(canonicalRequest)].join("\n");
  const kDate = hmac(SK, shortDate);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, "request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  return {
    "Content-Type": "application/json",
    "Host": HOST,
    "X-Date": xdate,
    "X-Content-Sha256": payloadHash,
    "Authorization": `HMAC-SHA256 Credential=${AK}/${scope}, SignedHeaders=${signed}, Signature=${signature}`,
  };
}

async function callApi(action, payload) {
  const body = JSON.stringify(payload);
  const headers = signedHeaders(action, body);
  const res = await fetch(`https://${HOST}/?${action === "CVSync2AsyncSubmitTask" ? "Action=CVSync2AsyncSubmitTask" : "Action=CVSync2AsyncGetResult"}&Version=2022-08-31`, {
    method: "POST", headers, body,
  });
  return res.json();
}

async function submit(reqKey, imageBase64, prompt, frames, aspect) {
  const data = await callApi("CVSync2AsyncSubmitTask", {
    req_key: reqKey, binary_data_base64: [imageBase64], prompt: prompt || "",
    seed: -1, frames, aspect_ratio: aspect,
  });
  if (data.code !== 10000) {
    const err = data.ResponseMetadata?.Error;
    fail(`submit failed: ${data.code} ${data.message || ""} ${err ? err.Code + " " + err.Message : ""}`);
  }
  return data.data.task_id;
}

async function poll(reqKey, taskId, maxMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const data = await callApi("CVSync2AsyncGetResult", { req_key: reqKey, task_id: taskId });
    if (data.code !== 10000 && data.ResponseMetadata?.Error) fail(`poll error: ${data.ResponseMetadata.Error.Message}`);
    const status = data.data?.status;
    process.stdout.write(`  status=${status}\n`);
    if (status === "done" || status === "Success") {
      const url = data.data?.video_url || data.data?.resp_data?.[0];
      if (url) return url;
    } else if (["not_found", "expired", "failed"].includes(status)) {
      fail(`task ${status}`);
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
  fail("timed out waiting for video");
}

const manifestArg = arg("--manifest");
const outdirArg = arg("--outdir", "renders");
const limit = Number(arg("--limit", "0"));
if (!manifestArg) fail("usage: animate-jimeng.mjs --manifest anim.json --outdir renders [--limit N]");
const manifestPath = path.resolve(manifestArg);
const base = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const reqKey = manifest.reqKey || "jimeng_ti2v_v30_pro";
const aspect = manifest.aspectRatio || "16:9";
const outdir = path.resolve(outdirArg);
fs.mkdirSync(outdir, { recursive: true });

let scenes = manifest.scenes || [];
if (limit > 0) scenes = scenes.slice(0, limit);
if (!scenes.length) fail("manifest has no scenes");

const results = [];
for (const scene of scenes) {
  const img = path.resolve(base, scene.image);
  if (!fs.existsSync(img)) fail(`missing image: ${img}`);
  const id = scene.id || path.basename(scene.image).replace(/\.[^.]+$/, "");
  console.log(`\n[${id}] submitting (${scene.frames || 121}f, ${aspect})`);
  const b64 = fs.readFileSync(img).toString("base64");
  const taskId = await submit(reqKey, b64, scene.prompt, scene.frames || 121, aspect);
  console.log(`  task=${taskId}`);
  const url = await poll(reqKey, taskId);
  const out = path.join(outdir, `${id}.mp4`);
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(out, buf);
  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height,duration,nb_frames", "-of", "json", out], { encoding: "utf8" });
  const meta = JSON.parse(probe.stdout || "{}").streams?.find((s) => s.width) || {};
  console.log(`  saved ${out}  ${meta.width}x${meta.height} ${Number(meta.duration || 0).toFixed(2)}s`);
  results.push({ id, out, ...meta });
  await new Promise((r) => setTimeout(r, 3000)); // QPS spacing
}
console.log(`\ndone: ${results.length} clip(s)`);

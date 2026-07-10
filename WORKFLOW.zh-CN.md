# Paper Collage Ad for Codex：完整工作流

这份手册从零开始说明如何把一个产品制作成剪纸 / 编辑拼贴风格广告，直到输出经过检查的 MP4。流程适合 OpenAI Codex Desktop 和 CLI，也可以手动运行仓库里的 Bash、Node 与 FFmpeg 工具。

## 先理解四类内容

| 内容 | 安装或准备次数 | 默认位置 |
| --- | --- | --- |
| `paper-collage-ad` skill | 每台电脑一次 | `~/.codex/skills/paper-collage-ad/` |
| FFmpeg、Node 等基础工具 | 每台电脑一次 | 系统 PATH |
| IndexTTS-2 MLX 与模型 | 只有使用声音克隆时，每台 Apple Silicon Mac 一次 | `~/.local/share/paper-collage-ad/mlx-indextts/` |
| 品牌素材、参考声音、声纹、分镜和成片 | 每个广告项目分别准备 | `<project>/assets/`、`<project>/renders/` |

仓库不包含参考声音、声纹、模型权重、品牌素材或成片。IndexTTS-2 是可选模块；使用普通 TTS、真人录音或无旁白广告时不需要安装。

## 整体流程

```text
安装 skill 与依赖
  → 建立项目目录
  → 收集真实品牌素材
  → 写创意、脚本和分镜
  → 用户确认脚本
  → 锁定第一张剪纸风格图
  → 生成全部关键帧
  → 逐场景制作动画
  → 生成并选择旁白
  → 根据旁白锁定镜头时长
  → 配音乐与动作音效
  → 合成最终 MP4
  → 画面、声音和流级质检
  → 交付并保留可修改工程
```

## 0. 安装 Codex skill

全局安装：

```bash
git clone https://github.com/Jane-xiaoer/paper-collage-ad-codex.git \
  ~/.codex/skills/paper-collage-ad
```

只在某个项目中安装：

```bash
mkdir -p <project>/.codex/skills
git clone https://github.com/Jane-xiaoer/paper-collage-ad-codex.git \
  <project>/.codex/skills/paper-collage-ad
```

约定：

```bash
SKILL_DIR="$HOME/.codex/skills/paper-collage-ad"
PROJECT="/absolute/path/to/ad-project"
```

重新打开 Codex 任务后，使用类似提示词触发：

```text
使用 paper-collage-ad，根据这个产品目录制作一条 45 秒、有趣但不过度吵闹的剪纸广告。先给我确认脚本和分镜，再开始生成画面。
```

## 1. 检查基础依赖

macOS 安装基础工具：

```bash
brew install ffmpeg node
bash "$SKILL_DIR/scripts/check-deps.sh"
```

核心检查必须通过：

- `ffmpeg`
- `ffprobe`
- Node.js 18 或更高版本
- Bash

`uv`、`hf` 和 `uvx` 只在本地声音克隆或音轨分离时需要。

## 2. 建立广告项目

不要把品牌素材和生成结果放进 skill 目录。为每条广告建立独立项目：

```bash
mkdir -p "$PROJECT"/{manifests,renders}
mkdir -p "$PROJECT/assets"/{brand,screenshots,keyframes,layers,voice-reference,voice-model,voice-raw,voice-final,audio,sfx,music}
test -e "$PROJECT/.gitignore" || \
  cp "$SKILL_DIR/examples/project.gitignore" "$PROJECT/.gitignore"
```

建议结构：

```text
<project>/
  brief.md
  script.md
  storyboard.json
  manifests/
    prompts.json
    animation.json
    voice.indextts2.json
    production-manifest.json
  assets/
    brand/
    screenshots/
    keyframes/
    layers/
    voice-reference/
    voice-model/
    voice-raw/
    voice-final/
    music/
    sfx/
    audio/
  renders/
    scene-01.mp4
    contact-sheet.jpg
    final.mp4
```

## 3. 锁定产品简报

先从产品目录和用户资料中提取，缺失时再询问：

- 产品解决什么问题。
- 主要受众是谁，在什么平台观看。
- 必须出现的产品事实、限制和 CTA。
- 真实 Logo、应用图标、界面截图、字体和品牌色。
- 横版 `16:9`、竖版 `9:16` 或其他比例。
- 语言、目标时长和发布渠道。
- 是否可以使用 Seedance、其他视频 API 或只做本地动画。
- 是否使用真人录音、普通 TTS 或授权声音克隆。

把结论写进 `<project>/brief.md`。不得让图像模型凭空创造 Logo、产品界面或功能事实。

## 4. 创意、脚本和分镜：必须先确认

### 4.1 确定一个贯穿全片的视觉隐喻

用一句话说明：谁想做什么、被什么阻挡、产品怎样介入，以及整条片子的物理世界是什么。

适合剪纸广告的隐喻示例：

- 多工具混乱 → 交通堵塞。
- 文件处理 → 纸片工厂流水线。
- 自动化协作 → 纸片舞台或乐团。
- 多种能力集中 → 行李箱或工具箱。

只选一个主要隐喻，不要每一镜换一个世界。

### 4.2 写完整旁白和对白

遵循以下原则：

- 前五秒出现不寻常的动作、问题或笑点。
- 画面展示功能，旁白负责情绪和推进，不朗读功能清单。
- 每场一个主要动作、一个信息和一个笑点。
- 旁白使用能说出口的短句，不使用论文式长句。
- 最后一场只保留一个 CTA，并至少停留一秒。

### 4.3 建立分镜

复制模板：

```bash
cp "$SKILL_DIR/examples/storyboard.json" "$PROJECT/storyboard.json"
```

每个场景至少填写：

- `role`：剧情作用。
- `idea`：该场唯一要表达的意思。
- `action`：真正发生的纸片动作。
- `voice`：完整旁白。
- `joke`：笑点或反转。
- `label`：2–4 个词的短标题。
- `durationDraft`：暂定时长。

同时把易读版本写入 `<project>/script.md`：

```text
场景编号 · 暂定时长 · 画面 · 动作 · 旁白/对白 · 音效 · 转场
```

### 4.4 脚本闸门

把以下三项交给用户确认：

1. 一句话核心戏剧动作。
2. 完整时间码分镜。
3. 完整旁白和对白。

在收到明确确认前，不生成关键帧、声音或视频。改脚本比重做五个镜头便宜得多。

## 5. 设计剪纸视觉系统

阅读：

```text
references/collage-dimensions.md
references/prompt-patterns.md
```

先固定以下参数：

- 背景纸的颜色与纤维颗粒。
- 半色调圆点的大小、密度和颜色。
- 机器裁切、手工裁切或撕纸边缘。
- 白色纸边宽度。
- 阴影方向、距离、柔度和透明度。
- 品牌强调色只能出现在哪里。
- 标题字体、位置与留白。
- 禁止出现的材质和错误。

典型剪纸系统：

```text
米白色无涂布纸背景
细密黑白圆点半色调
清晰机器裁切边缘
窄暖白纸边
向右下偏移的柔和低透明阴影
品牌色只用于功能重点
平光、正面俯拍、无科技渐变、无塑料 3D
```

## 6. 生成剪纸关键帧

### 6.1 第一张风格锚点

先只生成第一场，建议一次生成 3–4 个版本。检查：

- 是否像真实分层纸片，而不是带纹理的扁平矢量图。
- 品牌色、Logo 和界面是否准确。
- 角色和道具是否足够大，动作是否一眼可读。
- 阴影是否统一。
- 是否有足够留白放短标题。
- 中文、文件格式和网址是否畸形。

只在第一张通过后继续生成后续场景。

### 6.2 后续场景的参考顺序

每次按固定顺序提供：

1. 已确认的第一张风格锚点。
2. 上一个场景。
3. 官方 Logo、图标或产品图片。
4. 当前场景对应的真实界面截图。

每次重新写完整材质描述。图像模型不会自动记住上一个提示词。

把提示词清单保存为：

```bash
cp "$SKILL_DIR/examples/prompts.json" "$PROJECT/manifests/prompts.json"
```

最终关键帧放在：

```text
<project>/assets/keyframes/scene-01.png
<project>/assets/keyframes/scene-02.png
...
```

生成全部关键帧后制作联系表，一次检查人物、纸张、阴影、品牌色和构图连续性。

## 7. 选择动画路线

每个场景单独输出 MP4。这样后面可以独立调整节奏，而不必全片重新生成。

### 路线 A：Seedance 图生视频

适合：文件飞入、纸张自然碰撞、角色运动、物理混乱和原生拟音。

动画清单示例：

```json
{
  "model": "<available-seedance-model>",
  "scenes": [
    {
      "id": "scene-01",
      "image": "../assets/keyframes/scene-01.png",
      "prompt": "纸片角色依次从画面边缘滑入，落地时阴影轻轻回弹。纸张摩擦声、两次轻敲声。固定镜头，不变形，不新增文字。",
      "ratio": "16:9",
      "duration": 5,
      "resolution": "1080p"
    }
  ]
}
```

运行：

```bash
export ARK_API_KEY="<user-key>"
node "$SKILL_DIR/scripts/animate-seedance.mjs" \
  --manifest "$PROJECT/manifests/animation.json" \
  --outdir "$PROJECT/renders"
```

模型名称和权限以使用者账号实际开通的服务为准。动画提示词同时描述动作和声音。避免要求模型完成精确 Logo、网址或 UI 字符动画。

### 路线 B：HyperFrames 本地精确动画

适合：Logo 局部旋转、界面逐行出现、文本动画、精确节奏和无需视频 API Key 的制作。

先生成真实的纸张背景和透明纸片 PNG，再用 HTML + GSAP 编排，不要只用 CSS 渐变假装纸张。

```bash
npx hyperframes@latest init scene-01 --example warm-grain --non-interactive --resolution landscape
npx hyperframes snapshot scene-01 --at 1.0,2.5,4.5 -o "$PROJECT/renders/scene-01-snaps"
npx hyperframes render scene-01 -o "$PROJECT/renders/scene-01.mp4"
```

起始模板：`examples/hyperframes-logo-composition.html`。

### 路线 C：本地透明 PNG 分层动画

适合：纸片从上下左右滑入、定格步进节奏和最终关键帧锁定。

先把场景拆成：

- 空纸背景。
- 每个带透明通道和自身阴影的纸片元素。
- 未切割的完整最终关键帧。

复制并修改清单：

```bash
cp "$SKILL_DIR/examples/layer-manifest.json" "$PROJECT/manifests/scene-01-layers.json"
node "$SKILL_DIR/scripts/layer-animate.mjs" \
  --manifest "$PROJECT/manifests/scene-01-layers.json" \
  --output "$PROJECT/renders/scene-01.mp4"
```

尽量从一开始就生成独立透明元素。不要把压平的 JPG 粗略抠成矩形图层，否则容易留下背景残片和断裂阴影。

### 路线 D：静态关键帧兜底

没有视频模型或分层资产时，使用轻微推镜和场景转场：

```bash
cp "$SKILL_DIR/examples/render-manifest.json" "$PROJECT/manifests/render-manifest.json"
node "$SKILL_DIR/scripts/render.mjs" \
  --manifest "$PROJECT/manifests/render-manifest.json" \
  --output "$PROJECT/renders/keyframe-cut.mp4"
```

这条路线可交付，但视觉上仍接近动态幻灯片，应作为兜底。

### 推荐混合方案

- 自然、混乱和物理动作：Seedance。
- Logo、UI、网址和精确文字：HyperFrames。
- 简单纸片进场：本地分层动画。
- 无其他工具时：静态关键帧兜底。

## 8. 制作旁白

先生成旁白，再确定最终镜头长度。每个场景单独保存一条 WAV。

### 路线 A：本地声音克隆，Apple Silicon

采用 IndexTTS-2 MLX。只克隆本人声音或已取得明确授权的声音。

#### 8.1 首次安装，整台电脑只需一次

如果没有 `uv` 和 `hf`：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
uv tool install "huggingface_hub[cli]"
```

安装 TTS 运行时和模型：

```bash
bash "$SKILL_DIR/scripts/setup-indextts2-mlx.sh"
```

默认位置：

```text
~/.local/share/paper-collage-ad/mlx-indextts/
  models/mlx-indextts2-standard-fp16/
```

模型较大，但只需下载一次。仓库本身不保存模型。

#### 8.2 每个声音准备一次参考录音

把 6–12 秒清晰、单人、无音乐、少混响的录音放在：

```text
<project>/assets/voice-reference/reference.wav
```

如果声音位于用户有权使用的视频中，可先分离：

```bash
bash "$SKILL_DIR/scripts/extract-reference-voice.sh" \
  "<authorized-video.mp4>" \
  "$PROJECT/assets/voice-reference/extracted"
```

从分离结果中人工选择干净片段，不要把整条带音乐的广告音轨直接用于克隆。

#### 8.3 生成私人声纹

```bash
bash "$SKILL_DIR/scripts/prepare-indextts2-voice.sh" \
  "$PROJECT/assets/voice-reference/reference.wav" \
  "$PROJECT/assets/voice-model/speaker-v2.npz" \
  --i-have-permission
```

`.npz` 是本地预计算的说话人条件文件，不是可以公开分享的普通配置。它和参考声音都不得提交到 GitHub。

#### 8.4 生成分镜旁白

```bash
cp "$SKILL_DIR/examples/voice-manifest.indextts2.json" \
  "$PROJECT/manifests/voice.indextts2.json"
```

编辑清单中的：

- `speaker`
- `outputDir`
- 每句 `text`
- `emotion`
- `emoAlpha`
- `speed`
- `seed`

运行：

```bash
node "$SKILL_DIR/scripts/narrate-indextts2.mjs" \
  --manifest "$PROJECT/manifests/voice.indextts2.json"
```

输出：

```text
<project>/assets/voice-final/01.wav
<project>/assets/voice-final/02.wav
...
```

每句建议生成 2–4 个种子版本，人工选择最自然的一条。情绪强度通常保持在 `0.45–0.65`，速度保持在 `1.00–1.06`。

### 路线 B：在线普通 TTS

不需要声音克隆时，可以使用仓库内的 MiniMax 或 ElevenLabs 适配器：

```bash
export MINIMAX_API_KEY="<user-key>"
node "$SKILL_DIR/scripts/narrate-minimax.mjs" \
  --manifest "$PROJECT/manifests/voice.json" \
  --outdir "$PROJECT/assets/voice-final"
```

或：

```bash
export ELEVENLABS_API_KEY="<user-key>"
node "$SKILL_DIR/scripts/narrate-elevenlabs.mjs" \
  --manifest "$PROJECT/manifests/voice.json" \
  --outdir "$PROJECT/assets/voice-final"
```

密钥只通过环境变量传入，不写入仓库。

### 路线 C：真人录音

直接把逐场景录音处理为 48 kHz 单声道 WAV，并按 `01.wav`、`02.wav` 的方式放入 `assets/voice-final/`。后续合成流程完全相同。

## 9. 根据旁白锁定时长

测量每条选中旁白的长度：

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 \
  "$PROJECT/assets/voice-final/01.wav"
```

每场推荐时长：

```text
选中旁白长度 + 0.7 到 1.5 秒
```

保留开口前、笑点后和最终画面阅读时间。如果节奏太赶：

1. 先延长画面。
2. 再精简旁白。
3. 最后才使用保留音高的轻微加速，尽量不要超过 `1.12x`。

不要直接把最终整片全局减速。独立调整每个场景。

## 10. 音乐与音效

### 10.1 音乐

在画面和旁白时长锁定后建立音乐提示表：

```text
时间段 · 剧情作用 · 强弱 · 乐器 · 是否为旁白让位 · 转折点
```

原则：

- 选择完整长度配乐或兼容分轨，不要明显循环三秒素材。
- 旁白出现时让音乐自动降低。
- 音乐应匹配故事语气，不要给轻巧剪纸画面配过度史诗音乐。
- 先提供 2–3 个候选，由用户用耳朵选择。

### 10.2 音效

只为有物理意义的动作配音：

- 纸片滑入：纸张摩擦、轻柔 whoosh。
- 元素落地：软 click 或 cardboard tap。
- 机器盖章：pop、thump。
- UI 完成：短促 ding。
- Logo 收尾：克制的纸张展开声和一记提示音。

Seedance 生成原生声音时，在视频提示词中明确写出声音。后期仍要检查响度并删除多余噪声。

## 11. 最终合成

复制生产清单：

```bash
cp "$SKILL_DIR/examples/production-manifest.json" \
  "$PROJECT/manifests/production-manifest.json"
```

为每场填写：

- 场景 MP4。
- 目标时长。
- 旁白 WAV。
- 旁白开始时间。
- 需要放置的音效与时间点。
- 背景音乐、淡入淡出和 ducking 参数。

运行：

```bash
node "$SKILL_DIR/scripts/assemble.mjs" \
  --manifest "$PROJECT/manifests/production-manifest.json" \
  --output "$PROJECT/renders/final.mp4"
```

合成器会独立调整场景、放置旁白和音效、循环或淡化音乐、标准化混音，并检查最终 H.264/AAC 流。

音频目标：

- 旁白始终是第一层。
- 综合响度约 `-16 LUFS`。
- True Peak 不高于约 `-1.5 dB`。
- 不出现爆音、静音断层或音乐压住人声。

## 12. 最终质检

### 12.1 技术检查

```bash
ffprobe -v error -show_streams -show_format \
  "$PROJECT/renders/final.mp4"
```

确认：

- 视频编码为 H.264。
- 音频编码为 AAC。
- 分辨率、FPS 和比例正确。
- 视频流与音频流覆盖完整时长。
- 文件从头到尾可播放。

### 12.2 画面检查

从每场中间提取一帧制作联系表，检查：

- 无黑帧、矩形背景残片和粗糙抠图边缘。
- 纸片阴影方向一致。
- 人物、道具和品牌色连续。
- Logo、网址和 UI 没有变形或拼写错误。
- 没有播放器界面、红色箭头、水印或生成模型的额外文字。
- CTA 至少清晰停留一秒。

### 12.3 声音检查

必须由人实际听完：

- 中文发音正确。
- 声音没有机械拖长、吞字或突然换音色。
- 笑点前后有停顿。
- 音效与动作对齐。
- 音乐不过响，结束自然。

容器合法不等于成片合格。必须同时做技术检查、画面检查和人耳检查。

## 13. 修改、交付与隐私

### 修改原则

- 节奏问题：独立调整对应场景，不全局减速。
- Logo/UI 问题：改用 HyperFrames 或精确叠加，不反复要求视频模型保持局部不动。
- 粗糙切边：重新生成透明元素或精修遮罩，不用整张扁平图硬抠。
- 配音问题：重新选择种子和情绪，不直接把不自然的声音强行变速。
- 音乐问题：先换曲或重新做 cue，再调音量。

### 最终交付

至少交付：

- `renders/final.mp4`
- `renders/contact-sheet.jpg`
- `brief.md`
- `script.md`
- `storyboard.json`
- `manifests/prompts.json`
- `manifests/production-manifest.json`
- 已选关键帧
- 每场可编辑 MP4
- 已选旁白与最终混音

### 私人内容不得公开

不要提交：

- `.env` 和 API Key。
- `assets/voice-reference/`。
- `assets/voice-model/` 和任何 `.npz`。
- 未授权的音乐、字体和图片。
- 客户未公开的产品素材或工程。

发布 skill 或模板前运行：

```bash
bash "$SKILL_DIR/scripts/privacy-check.sh"
```

交付使用克隆声音的广告时，说明旁白由 AI 生成。

## 一条最短可跑通路线

```bash
# 1. 安装 skill
git clone https://github.com/Jane-xiaoer/paper-collage-ad-codex.git \
  ~/.codex/skills/paper-collage-ad

# 2. 设置路径并检查依赖
SKILL_DIR="$HOME/.codex/skills/paper-collage-ad"
PROJECT="$HOME/Desktop/my-paper-ad"
bash "$SKILL_DIR/scripts/check-deps.sh"

# 3. 建立项目
mkdir -p "$PROJECT"/{manifests,renders}
mkdir -p "$PROJECT/assets"/{brand,screenshots,keyframes,layers,voice-reference,voice-model,voice-final,music,sfx,audio}

# 4. 在 Codex 中要求先完成并确认 brief、script、storyboard

# 5. 生成并确认关键帧，逐场输出到 assets/keyframes/

# 6. 使用 Seedance、HyperFrames、分层动画或静态兜底生成 scene MP4

# 7. 可选：首次安装本地克隆 TTS
bash "$SKILL_DIR/scripts/setup-indextts2-mlx.sh"

# 8. 可选：使用者放入已授权的 reference.wav 后生成声纹与旁白
bash "$SKILL_DIR/scripts/prepare-indextts2-voice.sh" \
  "$PROJECT/assets/voice-reference/reference.wav" \
  "$PROJECT/assets/voice-model/speaker-v2.npz" \
  --i-have-permission
cp "$SKILL_DIR/examples/voice-manifest.indextts2.json" "$PROJECT/manifests/voice.indextts2.json"
node "$SKILL_DIR/scripts/narrate-indextts2.mjs" --manifest "$PROJECT/manifests/voice.indextts2.json"

# 9. 配置生产清单并合成
cp "$SKILL_DIR/examples/production-manifest.json" "$PROJECT/manifests/production-manifest.json"
node "$SKILL_DIR/scripts/assemble.mjs" \
  --manifest "$PROJECT/manifests/production-manifest.json" \
  --output "$PROJECT/renders/final.mp4"

# 10. 检查最终文件
ffprobe -v error -show_streams -show_format "$PROJECT/renders/final.mp4"
```

最短路线中的第 4–6 步仍需要创意判断和图像/视频生成工具参与；脚本负责把可重复的动画、配音、合成和验证步骤固定下来。

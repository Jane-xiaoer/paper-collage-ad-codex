# Paper Collage Ad for Codex

一个适合在 OpenAI Codex 中运行的完整剪纸 / 编辑拼贴广告制作 skill。从创意、脚本、分镜和关键帧开始，继续完成动画、旁白、音乐、音效、合成与 MP4 质检。

> Codex edition: `1.0.0`
>
> Skill name: `paper-collage-ad`
>
> Primary runtime: OpenAI Codex desktop / CLI

## 安装到 Codex

全局安装，供当前用户的所有 Codex 项目使用：

```bash
git clone https://github.com/Jane-xiaoer/paper-collage-ad-codex.git \
  ~/.codex/skills/paper-collage-ad
```

项目内安装，只供当前项目使用：

```bash
mkdir -p .codex/skills
git clone https://github.com/Jane-xiaoer/paper-collage-ad-codex.git \
  .codex/skills/paper-collage-ad
```

重新启动 Codex 或开启新任务后，可以直接说：

```text
用 paper-collage-ad 给这个产品制作一条有趣的 45 秒剪纸广告。
```

Codex 会读取根目录的 `SKILL.md`，并按需调用 `references/`、`examples/` 和 `scripts/`。

## 能完成什么

- 从产品资料提炼一个贯穿全片的视觉隐喻。
- 输出等待确认的脚本、对白和时间码分镜。
- 使用真实品牌资产生成风格锁定的剪纸关键帧。
- 使用 Seedance、HyperFrames、分层 PNG 或 FFmpeg 完成动画。
- 使用普通 TTS，或在本地通过 IndexTTS-2 MLX 克隆已获授权的声音。
- 添加音乐、纸张拟音和动作音效，最后输出经过流级验证的 H.264/AAC MP4。

## 基础依赖

macOS：

```bash
brew install ffmpeg node
bash scripts/check-deps.sh
```

只使用静态关键帧、分层动画和最终合成时，不需要任何 API Key。Seedance、即梦、MiniMax 和 ElevenLabs 属于可选通道，各自需要用户自己的服务权限。

## 声音克隆：IndexTTS-2 MLX

本仓库指定的本地声音克隆方案是 [solar2ain/mlx-indextts](https://github.com/solar2ain/mlx-indextts) 的 IndexTTS-2 MLX 实现，适合 Apple Silicon Mac。它支持零样本声音克隆和情绪控制。

仓库不会附带任何人的声音、声纹或模型权重。安装脚本只把第三方运行时和模型下载到本机：

```text
~/.local/share/paper-collage-ad/mlx-indextts/
  models/mlx-indextts2-standard-fp16/
```

安装运行时：

```bash
bash scripts/setup-indextts2-mlx.sh
```

在广告项目中建立私人声音目录：

```text
<project>/
  assets/
    voice-reference/
      reference.wav       # 使用者自行放入，建议 6–12 秒清晰单人语音
    voice-model/
      speaker-v2.npz      # 本地生成，不提交 Git
    voice-final/
      01.wav              # 本地生成的分镜旁白
```

先用已获授权的参考声音生成本地声纹：

```bash
bash scripts/prepare-indextts2-voice.sh \
  "<project>/assets/voice-reference/reference.wav" \
  "<project>/assets/voice-model/speaker-v2.npz" \
  --i-have-permission
```

复制并修改旁白清单：

```bash
cp examples/voice-manifest.indextts2.json \
  "<project>/manifests/voice.indextts2.json"
```

生成每个场景的 48 kHz WAV：

```bash
node scripts/narrate-indextts2.mjs \
  --manifest "<project>/manifests/voice.indextts2.json"
```

所有参考声音和声纹都留在使用者自己的项目路径。不要把 `voice-reference/`、`voice-model/` 或生成的私人旁白提交到公开仓库。只能克隆本人声音或已经获得明确授权的声音，并在交付物中说明旁白由 AI 生成。

新项目可以直接采用仓库提供的隐私忽略模板：

```bash
cp examples/project.gitignore "<project>/.gitignore"
```

## 目录

```text
SKILL.md                 Codex 主工作流
agents/openai.yaml       Codex 展示信息与默认提示词
references/              分镜、视觉、动画、声音、音乐和质检说明
examples/                可复制的 JSON / HTML 清单与模板
scripts/                 可执行的动画、TTS、混音、渲染与验证工具
```

## 隐私与密钥

- 不包含作者的参考声音、声纹、品牌素材或项目成片。
- 不包含 API Key；可选服务只从环境变量读取密钥。
- `.gitignore` 默认排除常见声音资产、模型、渲染结果和 `.env` 文件。
- 运行公开发布前，建议执行：`bash scripts/privacy-check.sh`。

## License

本 skill 的原创内容采用 MIT License。第三方模型、运行时、字体、音乐、素材和 API 分别遵循其自身许可证与服务条款。IndexTTS-2 模型权重不会被复制进本仓库。

# SKYRA AI

Sovereign orchestration platform for **photorealistic AI image and video
production**. You give SKYRA a plain-language brief; the **AI Director** turns
it into a complete, validated production plan (scenes, characters, camera,
lighting, audio), and the **Production Engine** drives that plan through the
generation pipeline.

SKYRA is model-neutral by design: every generation engine sits behind a
provider interface, so quality can improve over time by swapping engines —
never by rewriting the platform.

> **What SKYRA is, honestly.** SKYRA is the *orchestration and quality layer*,
> not a from-scratch foundation model. It does not — and realistically cannot —
> out-train Midjourney/Flux or Kling/Veo at the raw model level; that takes
> industrial GPU clusters and research teams. What it *can* do is build a
> first-class product on top of best-in-class engines plus SKYRA's own
> planning, prompt design, continuity, and quality control. That is exactly how
> leading AI-media products are built.

## Status

| Layer | State |
|-------|-------|
| Monorepo + workspaces | ✅ clean, installs from a single root |
| Types & schemas (Zod) | ✅ full `ProductionPlan` contract |
| AI provider layer | ✅ generic router + `local` (offline) and `openai` providers |
| **AI Director → real plan** | ✅ produces a **validated, populated** plan (scenes, characters, audio) |
| Production Engine | ✅ iterates real scenes (dry-run; asset generation is the next layer) |
| **Image generation** | ✅ per-scene stills written to disk (`mock` offline; `openai` / `replicate` real) |
| Video / voice / lip-sync | ⏳ not yet wired |

Runs fully offline with **no API keys**: the `local` planner writes a complete
plan and the `mock` image engine writes real viewable placeholder images.

## Quickstart

```bash
npm install
npm run dev        # runs the demo brief through Director + Production Engine
npm run typecheck  # strict TypeScript, no errors
```

`npm run dev` prints a complete `ProductionPlan` (4 populated scenes for the
demo brief), generates a still for each scene that needs one, and writes the
files under `storage/output/<projectId>/`.

## Generate real photoreal images

```bash
cp .env.example .env
# Fastest if you already have an OpenAI key:
SKYRA_IMAGE_PROVIDER=openai
OPENAI_API_KEY=sk-...
# Best photoreal humans (FLUX):
# SKYRA_IMAGE_PROVIDER=replicate
# REPLICATE_API_TOKEN=r8_...
```

Then `npm run dev` — each scene's `visualPrompt` is sent to the engine and the
resulting image is saved. No code changes; the engine is chosen by env.

## Use a real model for planning

```bash
cp .env.example .env
# in .env:
SKYRA_AI_PROVIDER=openai
SKYRA_AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```

The Director asks the model for the plan as JSON and validates it against
`ProductionPlanSchema`. If the model's output is invalid, it falls back to the
offline plan so the pipeline never breaks.

## Architecture

```
brief (text)
   │
   ▼
AIDirector            asks a provider for a plan, validates it with Zod
   │                  (falls back to a complete offline plan in dev)
   ▼
ProductionPlan        typed, validated: scenes, characters, camera, audio
   │
   ▼
ProductionEngine      iterates scenes → (next) drives generation per scene
   │
   ▼
AIProviderRouter      selects the engine by name: local | openai | (future) image/video engines
```

## Layout

```
packages/
  ai/                 generic AI provider layer
    src/provider.ts        AIProvider interface + message/response types
    src/router.ts          AIProviderRouter (register/select by name)
    src/development-provider.ts   offline provider (no key)
    src/openai-provider.ts        OpenAI chat adapter
  types/
    src/production.ts   Zod schemas: ProductionPlan, Scene, Character, AudioPlan
services/
  orchestrator/
    src/index.ts        entrypoint / demo
    src/director/ai-director.ts   brief → validated ProductionPlan
    src/workflows/production/production-engine.ts   executes the plan
    src/types/workflow.ts         re-exports the shared schemas
```

## Roadmap

**Generation layer (the real gap to close)**
- [x] Image engine adapter (photoreal stills) behind an `ImageProvider`
- [ ] Video engine adapter (text/image-to-video) behind a `VideoProvider`
- [ ] Voice / TTS + accurate lip-sync for the avatar scenes
- [ ] Music & sound design
- [ ] Render/stitch scenes into 16:9 and 9:16 masters (ffmpeg)

**Platform**
- [ ] Persist projects & assets (DB + object storage)
- [ ] Async job queue for long video jobs
- [ ] HTTP API + auth around the orchestrator
- [ ] Per-scene quality control pass (upscale / face-restore)

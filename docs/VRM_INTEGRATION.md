# VRM Integration Guide

Technical documentation for StreamAvatar's VRM/GLB model integration.

## Quick Start

```bash
npm run dev
# Load a VRM from the UI → Settings → Import Custom Model
```

## URL Configuration

Configure avatars via URL for OBS scene presets:

```
/view?avatar=cat&color=ff6b35&bg=chroma-green&scale=1.2
```

| Parameter | Values | Default |
|-----------|--------|---------|
| `avatar` | pill, sphere, boxy, cat, ghost, emoji, custom | pill |
| `color` | Hex (no #): `ff6b35` | Theme default |
| `bg` | transparent, chroma-green, chroma-blue, dark, light | transparent |
| `scale` | 0.5 - 3.0 | 1.0 |
| `idle` | true, false | true |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    MediaPipe                        │
│              (52 ARKit Blendshapes)                 │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              vrmTrackingBridge.ts                   │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │ ARKit→VRM   │  │  Viseme    │  │  Emotion    │  │
│  │   Mapping   │  │  Analyzer  │  │  Detection  │  │
│  └─────────────┘  └────────────┘  └─────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              CustomModelAvatar.tsx                  │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │   Spring    │  │   Model    │  │ Expression  │  │
│  │   Bones     │  │ Normalizer │  │  Manager    │  │
│  └─────────────┘  └────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Expression Mapping

### ARKit → VRM Visemes

| ARKit Input | VRM Expression | Formula |
|-------------|----------------|---------|
| `jawOpen` | `Aa` | `jawOpen * 1.2` |
| `mouthSmile*` | `Ee`, `Happy` | `(L + R) / 2 * 1.2` |
| `mouthPucker` | `Ou` | `pucker * 1.2` |
| `mouthFunnel` | `Oh` | `funnel * 0.8 + jawOpen * 0.3` |
| `mouthStretch*` | `Ih` | `stretch * 0.8` |

### Emotion Detection

| Combination | VRM Expression |
|-------------|----------------|
| `browDown + noseSneer` | Angry |
| `mouthFrown` | Sad |
| `eyeWide + browInnerUp` | Surprised |
| `mouthSmile` | Happy |

## Spring Bones

VRM models with `VRM_secondaryAnimation` extension get physics simulation:

- **Hair** – Natural sway with head movement
- **Clothes** – Fabric physics with gravity
- **Accessories** – Pendant, ribbon animations

Physics are updated automatically in `vrm.update(delta)`.

## Model Normalization

Imported models are auto-normalized:

1. **Center** – Model centered at origin, feet at Y=0
2. **Scale** – Scaled to 2.0 units tall
3. **Rotation** – Z-up models rotated to Y-up

See `modelNormalizer.ts` for implementation.

## Security

### URL Validation

- Blob URLs: Always allowed (local files)
- HTTPS: Required for remote URLs
- Domain whitelist: GitHub, S3, Sketchfab, VRoid Hub
- SSRF prevention: Private network ranges blocked

### Data Privacy

- All processing is 100% local
- No face data transmitted
- No biometric storage
- GDPR compliant by design

## Troubleshooting

### Model doesn't load

1. Check console for validation errors
2. Ensure file is valid VRM/GLB
3. Try smaller file (<50MB)

### Spring Bones not working

1. Verify model has `VRM_secondaryAnimation`
2. Check console for "Spring Bones: Yes"
3. VRoid models always have spring bones

### Expressions not working

1. Model needs VRM expression blendshapes
2. Check console for expression count
3. Use VRoid Studio or UniVRM for setup

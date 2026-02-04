# StreamAvatar: Hybrid Neural Architecture Blueprint

## 1. Overview
StreamAvatar implementa un pipeline de producción virtual híbrido que combina gráficos vectoriales tradicionales (Mallas VRM) con técnicas emergentes de **Gráficos Neuronales** (3D Gaussian Splatting).

## 2. Decoupled Pipeline (AHA! Architecture)
Siguiendo los principios del paper *AHA! (Animating Human Avatars)*, el sistema separa la síntesis de movimiento de la representación visual.

```mermaid
graph TD
    A[Webcam/Microphone] --> B[Motion Signal Layer]
    B --> B1[MediaPipe: Face Landmarker]
    B --> B2[Formant Analyzer: FFT-based Visemes]
    
    B1 --> C[Animation Controller]
    B2 --> C
    
    D[Assets: VRM / 3DGS] --> E[Visual Asset Layer]
    
    C --> F[Hybrid Composition Engine]
    E --> F
    
    F --> G[Render: WebGL / WebGPU]
    G --> H[Output: OBS Virtual Camera]
```

## 3. Data-Driven Standardization (VRM)
Utilizamos el estándar VRM para desacoplar la geometría de la lógica de animación. Esto permite que cualquier modelo humanoide sea animado instantáneamente mediante el `Retargeting Bridge` que mapea señales ARKit a expresiones VRM.

## 4. Performance Optimization (TaoAvatar Style)
- **Lazy Loading**: Los activos pesados (3DGS) solo se cargan bajo demanda.
- **Worker-based Tracking**: La inferencia de IA ocurre fuera del hilo principal usando `SharedArrayBuffer`.
- **LRU Cache**: Gestión inteligente de memoria en IndexedDB para activos volumétricos.

---
*Este documento forma parte del dossier de arquitectura para la solicitud de fondos públicos 2026.*

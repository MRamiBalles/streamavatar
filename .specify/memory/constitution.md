# StreamAvatar Project Constitution

> **Status:** INVIOLABLE  
> **Version:** 1.0  
> **Compliance:** ISO 42001 A.3.2 (Roles) • GDPR Art. 25 (Privacy by Design) • EU AI Act

---

## 1. Privacy Shield (Sovereignty First)

**Definición:** Todo procesamiento de datos biométricos (imágenes de cámara, audio, blendshapes) debe ocurrir estrictamente dentro del cliente (navegador/dispositivo del usuario).

| Regla | Descripción |
|-------|-------------|
| **Zero Exfiltration** | Ningún dato de tracking (facial, corporal, audio) puede salir del `localhost` |
| **Local Processing** | Todo procesamiento de inferencia (MediaPipe, Three.js physics) ocurre 100% en cliente |
| **No Telemetry** | No se permite recolección de datos de uso sin consentimiento explícito Opt-in |

> [!CAUTION]
> Cualquier PR que introduzca transmisión de datos biométricos a servidores externos será rechazado automáticamente.

---

## 2. Performance Guard (OBS Compatibility)

**Definición:** La aplicación debe mantener la fluidez necesaria para la "presencia social" en tiempo real.

| Métrica | Límite | Justificación |
|---------|--------|---------------|
| **Idle CPU** | ≤ 5% | No afectar juegos/OBS cuando la pestaña está en segundo plano |
| **Active FPS** | ≥ 60 FPS | Hardware de gama media (GTX 1060 / Apple M1) |
| **E2E Latency** | < 100ms | Cámara → Avatar para evitar disonancia cognitiva |

> [!IMPORTANT]
> Cualquier caída por debajo de 30 FPS debe activar automáticamente modos de degradación visual (LOD).

---

## 3. Architecture Decoupling (Clean Architecture)

**Definición:** Separación estricta entre la lógica de percepción (Tracking) y la visualización (Rendering).

```
┌─────────────────┐     Event Bus     ┌─────────────────┐
│  Tracking Core  │ ←───────────────→ │  Render Engine  │
│   (MediaPipe)   │   SharedArrayBuf  │   (Three.js)    │
└─────────────────┘                   └─────────────────┘
```

| Regla | Descripción |
|-------|-------------|
| **Event Bus Isolation** | Tracking y Rendering nunca se importan directamente entre sí |
| **Worker-based ML** | Inferencia de IA ocurre fuera del hilo principal |
| **Dependency Ban** | Prohibido introducir dependencias que requieran backends propietarios |

---

## 4. Data Sovereignty (Legal)

**Definición:** El usuario es el único propietario de su configuración y modelos.

| Principio | Implementación |
|-----------|----------------|
| **User Ownership** | Modelos VRM y configuraciones pertenecen exclusivamente al usuario |
| **Local-first** | Persistencia en IndexedDB/FileSystem API |
| **Open Formats** | Exportación en `.vrm`, `.glb`, `.json` sin encriptación propietaria |
| **No Vendor Lock-in** | El sistema no debe ofuscar ni bloquear acceso a archivos locales |

---

## 5. Constitutional Enforcement

Este documento es la **fuente de verdad**. Cualquier Pull Request que viole estos principios:

1. Debe ser rechazado en Code Review
2. Requiere aprobación explícita de Code Owners para excepciones documentadas
3. Las excepciones deben registrarse en `ARCHITECTURE_DECISIONS.md`

---

*Documento fundacional para la solicitud de fondos públicos NLnet/Spain Audiovisual Hub 2026.*

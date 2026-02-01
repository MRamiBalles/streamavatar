# TDR-007: Sistema de Identidades Virtuales y Presets

**Fecha:** 2026-02-01  
**Estado:** Aprobado

## Contexto
StreamAvatar requería una forma de permitir a los usuarios no solo usar modelos pre-fabricados (VRM/GLB), sino crear sus propias identidades visuales desde cero y guardar configuraciones específicas ("Fashion Sets") para intercambiarlas durante un stream.

## Decisión
Implementar un **Motor de Composición Basado en Partes** y un sistema de **Serialization de Presets** en el Store global.

### Arquitectura de Datos
- **AvatarPart:** Representa una primitiva geométrica con transformaciones (PRS) y metadatos de visibilidad.
- **AvatarPreset:** Captura una "instantánea" del estado completo del avatar (tipo, partes, colores, escala).

### Renderizado (CompositeAvatar)
Se ha creado un renderizador que itera sobre la jerarquía de piezas. La lógica clave es la **Inyección Selectiva de Animación**:
- Las piezas marcadas como `head` o con ID que contiene "head" reciben automáticamente la rotación del Head Tracking.
- Las piezas marcadas como `body` reciben la escala de la respiración procedural.

## Consecuencias
- **Persistencia:** Los avatares creados se guardan en `localStorage` vía Zustand.
- **Flexibilidad:** El usuario puede mezclar modelos VRM con piezas geométricas adicionales si lo desea (futura expansión).
- **Rendimiento:** El uso de primitivas de `@react-three/drei` asegura que el compositor sea extremadamente ligero y apto para navegadores móviles.

## Consideraciones de Seguridad
- Los presets solo guardan metadatos y URLs relativas o locales (ObjectURL).
- No se guarda información biométrica en los presets, solo los resultados de las transformaciones visuales.

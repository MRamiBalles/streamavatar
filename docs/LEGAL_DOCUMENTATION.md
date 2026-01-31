# StreamAvatar - Documentación Legal

## 1. Introducción

Este documento establece el marco legal aplicable a StreamAvatar, una aplicación web de streaming de avatares 3D con tecnología de seguimiento facial y análisis de audio.

---

## 2. Política de Privacidad

### 2.1 Datos Recopilados

StreamAvatar procesa los siguientes tipos de datos:

| Categoría | Tipo de Dato | Procesamiento | Almacenamiento |
|-----------|--------------|---------------|----------------|
| Biométrico | Imagen facial (vídeo) | Local en navegador | No almacenado |
| Biométrico | Parámetros faciales | Local en navegador | No almacenado |
| Audio | Frecuencias de micrófono | Local en navegador | No almacenado |
| Configuración | Preferencias de usuario | localStorage | Dispositivo del usuario |
| Streaming | Claves RTMP | localStorage | Dispositivo del usuario |

### 2.2 Procesamiento de Datos Biométricos

#### 2.2.1 Bajo el Reglamento General de Protección de Datos (GDPR)

Los datos faciales constituyen **datos biométricos** según el Artículo 9 del GDPR, clasificados como categoría especial de datos personales.

**Base legal aplicable:**
- **Consentimiento explícito** (Art. 9.2.a): El usuario activa voluntariamente la cámara mediante acción afirmativa.
- **Procesamiento exclusivamente local**: Los datos nunca abandonan el dispositivo del usuario.

**Cumplimiento garantizado mediante:**
1. Solicitud explícita de permisos del navegador antes de acceder a la cámara
2. Procesamiento íntegramente en el dispositivo del usuario (edge computing)
3. No transmisión de datos biométricos a servidores externos
4. No almacenamiento persistente de imágenes o parámetros faciales

#### 2.2.2 Bajo la California Consumer Privacy Act (CCPA/CPRA)

La CPRA clasifica los datos biométricos como **información personal sensible**.

**Cumplimiento:**
- No venta ni compartición de datos biométricos
- Procesamiento limitado al propósito declarado (animación de avatar)
- Derecho del consumidor a optar por no usar la funcionalidad

### 2.3 Derechos del Usuario

Los usuarios tienen derecho a:

| Derecho | Descripción | Implementación |
|---------|-------------|----------------|
| Acceso | Conocer qué datos se procesan | Configuración visible en la app |
| Supresión | Eliminar sus datos | "Restablecer valores" en Ajustes |
| Portabilidad | Exportar configuración | "Exportar configuración" en Ajustes |
| Limitación | Desactivar funcionalidades | Botones de desactivar cámara/micrófono |
| Oposición | No usar características biométricas | Uso opcional de tracking |

### 2.4 Retención de Datos

- **Datos biométricos:** No retenidos. Procesados frame a frame y descartados inmediatamente.
- **Configuración de usuario:** Almacenada indefinidamente en localStorage hasta que el usuario la elimine.
- **Claves de streaming:** Almacenadas localmente. El usuario es responsable de su seguridad.

---

## 3. Términos de Servicio

### 3.1 Descripción del Servicio

StreamAvatar proporciona herramientas para:
- Crear y personalizar avatares 3D
- Animar avatares mediante seguimiento facial
- Aplicar efectos de audio reactivo
- Configurar destinos de streaming

### 3.2 Requisitos de Uso

El usuario debe:
1. Ser mayor de 13 años (o edad mínima de consentimiento digital en su jurisdicción)
2. Proporcionar consentimiento informado para uso de cámara y micrófono
3. No utilizar la aplicación para contenido ilegal, difamatorio o que infrinja derechos de terceros
4. Ser propietario o tener licencia de los modelos 3D que importe

### 3.3 Propiedad Intelectual

#### 3.3.1 Contenido de StreamAvatar
- Los avatares predeterminados son propiedad de StreamAvatar
- El código fuente está sujeto a la licencia del proyecto
- Las marcas comerciales de terceros (Twitch, YouTube) pertenecen a sus respectivos propietarios

#### 3.3.2 Contenido del Usuario
- El usuario retiene todos los derechos sobre modelos 3D importados
- El usuario es responsable de tener las licencias necesarias para modelos de terceros
- StreamAvatar no reclama propiedad sobre contenido creado por el usuario

### 3.4 Limitación de Responsabilidad

StreamAvatar se proporciona "TAL CUAL" sin garantías de ningún tipo.

No nos responsabilizamos de:
- Interrupciones en el servicio de streaming
- Pérdida de configuraciones almacenadas localmente
- Uso indebido de claves de streaming por terceros
- Compatibilidad con todos los navegadores o dispositivos
- Contenido transmitido por el usuario a plataformas de terceros

### 3.5 Indemnización

El usuario acuerda indemnizar a StreamAvatar frente a reclamaciones derivadas de:
- Uso de modelos 3D sin licencia apropiada
- Contenido transmitido que viole leyes o derechos de terceros
- Uso indebido de la funcionalidad de streaming

---

## 4. Cumplimiento de Accesibilidad

### 4.1 Estándares Aplicados

StreamAvatar busca cumplir con:
- **WCAG 2.1 Nivel AA** para contenido web
- **Section 508** para accesibilidad federal (EE.UU.)

### 4.2 Características de Accesibilidad

| Característica | Implementación |
|----------------|----------------|
| Navegación por teclado | Todos los controles son accesibles |
| Contraste de color | Ratio mínimo 4.5:1 |
| Etiquetas ARIA | Componentes shadcn/ui incluyen ARIA |
| Tamaño de texto | Mínimo 14px, escalable |

### 4.3 Limitaciones Conocidas

- El canvas 3D tiene accesibilidad limitada para lectores de pantalla
- El seguimiento facial requiere capacidad visual del usuario
- Los indicadores de audio pueden requerir adaptación para usuarios sordos

---

## 5. Cookies y Tecnologías de Seguimiento

### 5.1 Tecnologías Utilizadas

| Tecnología | Propósito | Tipo |
|------------|-----------|------|
| localStorage | Guardar preferencias | Esencial |
| WebGL | Renderizado 3D | Esencial |
| Web Workers | Procesamiento en segundo plano | Esencial |

### 5.2 Cookies de Terceros

StreamAvatar no utiliza cookies de terceros ni servicios de análisis externos en su versión base.

**Nota:** Las plataformas de streaming (Twitch, YouTube) a las que el usuario transmita pueden aplicar sus propias políticas de cookies.

---

## 6. Marco Regulatorio por Jurisdicción

### 6.1 Unión Europea (GDPR)

- **Controlador de datos:** No aplicable (procesamiento exclusivamente local)
- **Procesador de datos:** No aplicable
- **Transferencias internacionales:** No aplica (datos no abandonan el dispositivo)
- **Evaluación de Impacto (DPIA):** Recomendada pero de bajo riesgo dado el procesamiento local

### 6.2 Estados Unidos

- **CCPA/CPRA (California):** Cumplimiento mediante procesamiento local
- **BIPA (Illinois):** Consentimiento obtenido antes de procesamiento biométrico
- **COPPA:** Servicio no dirigido a menores de 13 años

### 6.3 Otras Jurisdicciones

| País | Regulación | Cumplimiento |
|------|------------|--------------|
| Brasil | LGPD | Procesamiento local, consentimiento |
| Canadá | PIPEDA | Procesamiento local, propósito declarado |
| Australia | Privacy Act | Procesamiento local, transparencia |
| Japón | APPI | Procesamiento local |

---

## 7. Seguridad de Datos

### 7.1 Medidas Técnicas

- **HTTPS:** Toda comunicación cifrada en tránsito
- **Procesamiento local:** Datos biométricos nunca transmitidos
- **Sin base de datos:** Sin almacenamiento centralizado de datos de usuario
- **Claves de streaming:** Responsabilidad del usuario (almacenadas localmente)

### 7.2 Notificación de Brechas

Dado que StreamAvatar no almacena datos de usuario en servidores, el riesgo de brechas es mínimo. En caso de vulnerabilidad en el código que pudiera afectar la seguridad del usuario, se notificará mediante:
- Actualización de la aplicación
- Comunicado en el repositorio del proyecto

---

## 8. Cambios en la Política

Esta política puede actualizarse para reflejar cambios en:
- Funcionalidades de la aplicación
- Requisitos legales aplicables
- Mejores prácticas de la industria

La fecha de última actualización se indicará al inicio del documento.

---

## 9. Contacto

Para consultas relacionadas con privacidad o aspectos legales:
- **Email:** [Insertar email de contacto]
- **Formulario:** [Insertar URL si aplica]

---

**Última actualización:** Enero 2026

---

## Anexo A: Consentimiento Informado para Procesamiento Biométrico

Al activar la cámara en StreamAvatar, el usuario reconoce y acepta que:

1. Sus rasgos faciales serán procesados para animar un avatar virtual
2. El procesamiento ocurre exclusivamente en su dispositivo
3. Ningún dato facial es transmitido a servidores externos
4. Puede desactivar el seguimiento facial en cualquier momento
5. Sus datos no serán vendidos ni compartidos con terceros

Este consentimiento puede revocarse en cualquier momento desactivando la cámara o cerrando la aplicación.

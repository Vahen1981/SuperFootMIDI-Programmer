# SuperFoot MIDI Programmer

Aplicación web (React + Vite) para configurar el pedalero **SuperFoot MIDI**: define el comportamiento de cada **banco** (10) y de cada **pedal** verde (A–H) por banco, y sincroniza la configuración con el hardware mediante **MIDI System Exclusive (SysEx)**.

---

## Requisitos

- Navegador con **Web MIDI API** y permiso para **SysEx** (p. ej. Chrome, Edge, Opera).
- El dispositivo debe aparecer como **“SuperFoot MIDI”** en los puertos MIDI de entrada y salida.
- Conexión USB (u otro enlace que exponga el dispositivo al navegador como puerto MIDI).

---

## Características principales

| Área | Descripción |
|------|-------------|
| **Estado del dispositivo** | Indicador en línea / desconectado según la presencia del puerto SuperFoot MIDI. |
| **Bancos** | 10 bancos seleccionables con los botones **Up / Dwn**; LED azul indica el banco activo. |
| **Tipos de banco** | Pantalla **Configure Banks** para asignar a cada banco uno de los modos disponibles (ver tabla abajo). |
| **Presets por pedal** | Cada pedal A–H tiene un popup según el tipo de banco: Program Change, CC, notas, etc. Los cambios se guardan en memoria de la app hasta que se envíen al dispositivo. |
| **Programar** | Envía la configuración actual de la app al hardware (SysEx fragmentado). |
| **Fábrica** | Envía la configuración de fábrica definida en código al hardware. |
| **Idioma** | Español / inglés con botón de cambio; el idioma inicial se toma del navegador (`es` → español; cualquier otro → inglés), salvo preferencia guardada en `localStorage`. |
| **Progreso** | Barras de progreso durante el envío de datos al dispositivo y durante la carga desde el dispositivo; aviso de no desconectar el cable en esas operaciones. |

---

## Tipos de configuración de banco (comportamiento)

Cada banco tiene un **código de tipo** (byte) y **8 presets** (uno por pedal A–H). Cada preset ocupa **7 bytes** en el protocolo; el significado depende del tipo de banco.

| Código | Nombre (UI) | Comportamiento resumido |
|--------|-------------|-------------------------|
| `0x00` | Program Change (Presets control) | Envío de **Program Change** MIDI; se configuran canal, número de programa, etc. |
| `0x01` | CC Latch (On / Off) | **Control Change** con comportamiento tipo *latch* (encendido/apagado). |
| `0x02` | Multiples CC Latch (On / Off) | Varios mensajes CC con latch. |
| `0x03` | CC (CC controllers with always the same value) | CC con valor fijo u homogéneo según la plantilla del preset. |
| `0x04` | Notes (Send single notes or chords) | Envío de **notas** o **acordes** según la configuración del preset. |

### Cambiar el tipo de un banco

Al cambiar el tipo en **Configure Banks**, la app advierte que **se pierden los presets actuales de ese banco** y se sustituyen por los **valores por defecto** asociados a ese tipo (plantillas en `BankTemp.js` / datos equivalentes).

Los cambios en popups de pedales y en tipos de banco viven en la **memoria de la aplicación** (`banksData` + `presetsData`) hasta que el usuario pulse **Program** o **Factory** para escribir en el dispositivo.

---

## Cómo se comunica con el dispositivo (MIDI SysEx)

### Identificador de fabricante

Los mensajes SysEx relevantes usan cabecera:

- `F0` — inicio SysEx  
- `74 6F 71` — bytes de fabricante / identidad del producto  
- Byte de **comando** (ver abajo)  
- … datos …  
- `F7` — fin SysEx  

### Comandos (constantes en `midiUtils.js`)

| Valor | Constante | Uso |
|-------|-----------|-----|
| `0x40` | `REQUEST_DATA` | La app **pide** al dispositivo que envíe la configuración guardada. |
| `0x4A` | `SAVE_DATA` | La app **envía** la configuración para guardar en el dispositivo. |

### Solicitud de datos (`REQUEST_DATA`)

Tras conectar (y al resincronizar), la app envía un mensaje corto:

`F0 74 6F 71 40 F7`

El dispositivo responde con la carga útil de **570 bytes** (ver payload más abajo), ya sea:

- **Legado:** un único SysEx de **576 bytes** (`F0` + cabecera + 570 bytes de datos + `F7`), o  
- **Por fragmentos:** **11 mensajes** con la misma estructura de fragmento que en `SAVE_DATA`, pero con byte de comando **`REQUEST_DATA` (`0x40`)** en lugar de `SAVE_DATA`. El último fragmento puede ser más corto (solo los bytes que faltan; sin relleno con ceros).

La app ensambla los fragmentos, rellena `banksData` y `presetsData`, y actualiza la interfaz.

### Envío de configuración (`SAVE_DATA`)

La carga útil siempre son **570 bytes**:

- **10 bytes:** tipo de cada banco (bancos 1…10).  
- **560 bytes:** 10 bancos × 8 pedales × 7 bytes = presets.

Ese bloque se envía en **11 mensajes SysEx** separados **500 ms** entre cada envío (tras el primero), para mejorar compatibilidad en entornos limitados (p. ej. algunos Android).

Estructura de **cada** mensaje de fragmento (salvo longitud del último):

| Offset | Contenido |
|--------|-----------|
| 0 | `F0` |
| 1–3 | `74 6F 71` |
| 4 | `4A` (`SAVE_DATA`) |
| 5 | Número total de fragmentos (`11`) |
| 6 | Índice del fragmento actual (`0` … `10`) |
| 7 … | Hasta **56 bytes** de payload; el último fragmento lleva solo los bytes restantes (p. ej. 10 bytes). |
| último | `F7` |

### Resumen del flujo de datos

1. Conexión → solicitud `REQUEST_DATA` → la app muestra progreso de **carga** → llegan datos → se pintan bancos y presets.  
2. El usuario edita en la web → datos solo en RAM del navegador.  
3. **Program** → envío fragmentado `SAVE_DATA` con progreso → confirmación de éxito.  
4. **Factory** → mismo mecanismo de envío, pero con la matriz `FACTORY_SETTINGS` + `BANK_TYPES` de fábrica.

---

## Desarrollo

```bash
npm install
npm run dev    # servidor de desarrollo
npm run build  # compilación para producción
npm run lint   # ESLint
```

La salida estática queda en `dist/` tras `npm run build`.

---

## Nota sobre firmware

El firmware del SuperFoot MIDI debe entender el protocolo anterior: **recepción y emisión por fragmentos** con los mismos tamaños y comandos, y opcionalmente seguir admitiendo el **mensaje único de 576 bytes** en la respuesta a `REQUEST_DATA` para compatibilidad con versiones antiguas de la app o del dispositivo.

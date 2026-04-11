export const SAVE_DATA = 0x4A
/** Cantidad de fragmentos SysEx para SAVE_DATA / REQUEST_DATA por chunks (11 mensajes). */
export const SAVE_DATA_CHUNK_COUNT = 11
/** Máximo de bytes de datos por fragmento; el último lleva solo el resto del payload de 570 bytes. */
export const SAVE_DATA_BYTES_PER_CHUNK = 56
/** 10 bancos + 560 bytes de presets + 2 bytes expression. */
export const SAVE_DATA_PAYLOAD_LENGTH = 572

export const REQUEST_DATA = 0x40
export const TYPE_PC = 0x0C
export const TYPE_CC = 0x0B
export const TYPE_NOTE = 0x09
export const LATCH = 0x01
export const NON_LATCH = 0x00
export const GREEN_PEDALS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export const formatHex = (bytes) => bytes.map((b) => `0x${Number(b).toString(16).toUpperCase().padStart(2, '0')}`)

/**
 * SysEx SAVE_DATA fragmentado: cabecera + hasta 56 bytes de datos + F7 (el último fragmento es más corto).
 */
export const buildSaveDataChunkSysex = (payload572, chunkIndex) => {
  if (!payload572 || payload572.length !== SAVE_DATA_PAYLOAD_LENGTH) {
    throw new Error(`SAVE_DATA payload must be ${SAVE_DATA_PAYLOAD_LENGTH} bytes`)
  }
  if (chunkIndex < 0 || chunkIndex >= SAVE_DATA_CHUNK_COUNT) {
    throw new Error(`chunkIndex must be 0 … ${SAVE_DATA_CHUNK_COUNT - 1}`)
  }
  const offset = chunkIndex * SAVE_DATA_BYTES_PER_CHUNK
  const dataLen = Math.min(SAVE_DATA_BYTES_PER_CHUNK, SAVE_DATA_PAYLOAD_LENGTH - offset)
  const msg = new Array(7 + dataLen + 1)
  msg[0] = 0xf0
  msg[1] = 0x74
  msg[2] = 0x6f
  msg[3] = 0x71
  msg[4] = SAVE_DATA
  msg[5] = SAVE_DATA_CHUNK_COUNT
  msg[6] = chunkIndex
  for (let i = 0; i < dataLen; i++) {
    msg[7 + i] = payload572[offset + i]
  }
  msg[7 + dataLen] = 0xf7
  return msg
}

/**
 * Valida un SysEx entrante de respuesta a REQUEST_DATA (byte 4 = REQUEST_DATA).
 */
export const parseRequestDataSysexChunk = (data) => {
  if (!data || data.length < 9) return null
  const len = data.length
  if (data[0] !== 0xf0 || data[len - 1] !== 0xf7) return null
  if (data[1] !== 0x74 || data[2] !== 0x6f || data[3] !== 0x71) return null
  if (data[4] !== REQUEST_DATA) return null
  const totalChunks = data[5]
  const chunkIndex = data[6]
  if (totalChunks < 1 || chunkIndex < 0 || chunkIndex >= totalChunks) return null
  const raw =
    data instanceof Uint8Array
      ? data.subarray(7, len - 1)
      : Uint8Array.from(Array.prototype.slice.call(data, 7, len - 1))
  const payload = new Uint8Array(raw)
  const offset = chunkIndex * SAVE_DATA_BYTES_PER_CHUNK
  
  if (payload.length > SAVE_DATA_BYTES_PER_CHUNK) return null // Relax strict length check incase firmware misreports length during upgrade.
  return { chunkIndex, totalChunks, payload }
}

export const mergeRequestDataChunkPayloads = (chunksMap, totalChunks) => {
  if (totalChunks < 1) return null
  const out = new Uint8Array(SAVE_DATA_PAYLOAD_LENGTH)
  for (let i = 0; i < totalChunks; i++) {
    const p = chunksMap.get(i)
    if (!p) continue // allow missing chunks by leaving their space as 0
    const off = i * SAVE_DATA_BYTES_PER_CHUNK
    const lenToSet = Math.min(p.length, SAVE_DATA_PAYLOAD_LENGTH - off)
    if (lenToSet > 0) {
      out.set(p.subarray(0, lenToSet), off)
    }
  }
  return out
}

export const sendSysexRequest = (midiOutput, request) => {
  if (!request) return
  if (!midiOutput) {
    console.warn('No MIDI output disponible para enviar Sysex')
    return
  }
  try {
    midiOutput.send(request)
    console.log('Sysex enviado (dec):', request)
    console.log('Sysex enviado (hex):', formatHex(request))
  } catch (error) {
    console.error('Error enviando Sysex:', error)
  }
}

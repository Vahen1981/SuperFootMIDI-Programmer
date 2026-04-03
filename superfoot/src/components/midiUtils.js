export const SAVE_DATA = 0x01
export const TYPE_PC = 0x0C
export const TYPE_CC = 0x0B
export const TYPE_NOTE = 0x09
export const LATCH = 0x01
export const NON_LATCH = 0x00
export const GREEN_PEDALS = ['A','B','C','D','E','F','G','H']

export const formatHex = (bytes) => bytes.map((b) => `0x${Number(b).toString(16).toUpperCase().padStart(2, '0')}`)

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

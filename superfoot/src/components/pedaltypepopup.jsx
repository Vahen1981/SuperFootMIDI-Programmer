import { useState } from 'react'

const SAVE_DATA = 0x01
const TYPE_PC = 0x0C
const TYPE_CC = 0x0B
const TYPE_NOTE = 0x09
const LATCH = 0x01
const NON_LATCH =0x00
const GREEN_PEDALS = ['A','B','C','D','E','F','G','H']

export const PedalTypePopup = ({ isOpen, onClose, pedal, bank, type, midiOutput }) => {
  const [midiChannel, setMidiChannel] = useState(1)
  const [programChange, setProgramChange] = useState(0)
  const [ccNumber, setCcNumber] = useState(0)
  const [ccLatchNumber, setCcLatchNumber] = useState(0)
  const [ccValue, setCcValue] = useState(0)

  const [firstCC, setFirstCC] = useState('empty')
  const [secondCC, setSecondCC] = useState('empty')
  const [thirdCC, setThirdCC] = useState('empty')

  const [note1, setNote1] = useState('empty')
  const [note2, setNote2] = useState('empty')
  const [note3, setNote3] = useState('empty')
  const [note4, setNote4] = useState('empty')

  const [oct1, setOct1] = useState("3")
  const [oct2, setOct2] = useState("3")
  const [oct3, setOct3] = useState("3")
  const [oct4, setOct4] = useState("3")

  if (!isOpen) return null

  const onOverlayClick = () => {
    onClose()
  }

  const onPopupClick = (e) => {
    e.stopPropagation()
  }

  const buildPopupRequest = () => {
    const bankIndex = Number(bank) > 0 ? Number(bank) - 1 : 0
    const pedalIndex = GREEN_PEDALS.indexOf(pedal)
    const midiChannelIndex = Math.max(0, Math.min(15, midiChannel - 1))

    if (type === 'Program Change (Presets control)') {
      const request = [
        0xF0,
        0x74,
        0x6F,
        0x71,
        SAVE_DATA,
        bankIndex,
        pedalIndex,
        TYPE_PC,
        midiChannelIndex,
        0x00, // se ignorará en el dispositivo
        programChange,
        0x00, //se ignorará en el dispositivo
        0x00, //se ignorará en el dispositivo
        0x00, //se ignorará en el dispositivo
        0xF7, //se ignorará en el dispositivo
      ]
      return request
    }

    if (type === 'CC (CC controllers with always the same value)') {
      const request = [
        0xF0,
        0x74,
        0x6F,
        0x71,
        SAVE_DATA,
        bankIndex,
        pedalIndex,
        TYPE_CC,
        midiChannelIndex,
        NON_LATCH,
        0x00, //byte que se ignorará en el dispositivo ya que solo envía 1 controlador
        ccNumber,
        ccValue,
        0x00, //se ignorará en el dispositivo
        0xF7,
      ]
      return request
    }

    if (type === 'CC Latch (On /Off)') {
      const request = [
        0xF0,
        0x74,
        0x6F,
        0x71,
        SAVE_DATA,
        bankIndex,
        pedalIndex,
        TYPE_CC,
        midiChannelIndex,
        LATCH,
        0x01,
        ccLatchNumber,
        0x00,
        0x00,
        0xF7,
      ]
      return request
    }

    if (type === 'Multiples CC Latch (On / Off)') {
      const latchControllers = [firstCC, secondCC, thirdCC]
      const activeControllers = latchControllers
        .filter((c) => c !== 'empty')
        .map((c) => Number(c))
      const controllerCount = Math.max(0, Math.min(3, activeControllers.length))
      const controllerBytes = [...activeControllers, ...Array(3 - controllerCount).fill(0x00)]

      const request = [
        0xF0,
        0x74,
        0x6F,
        0x71,
        SAVE_DATA,
        bankIndex,
        pedalIndex,
        TYPE_CC,
        midiChannelIndex,
        LATCH,
        controllerCount,  //número real de controladores, no índice (si es solo 1 controlador se envía 0x01, no 0x00)
        ...controllerBytes,
        0xF7,
      ]
      return request
    }

    if (type === 'Notes (Send single notes or chords)') {
      const noteToNumber = (note) => {
        if (note === 'empty') return -1
        const index = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(note)
        return index
      }
      const octToNumber = (oct) => {
        const index = ['-2', '-1', '0', '1', '2', '3', '4', '5', '6', '7'].indexOf(oct)
        return index
      }
      const noteNumber = (note, oct) => {
        const n = noteToNumber(note)
        const o = octToNumber(oct)
        if (n === -1) return -1
        return n + (o * 12)
      }

      const rawNotes = [
        noteNumber(note1, oct1),
        noteNumber(note2, oct2),
        noteNumber(note3, oct3),
        noteNumber(note4, oct4),
      ]
      const selectedNotes = rawNotes.filter((n) => n >= 0)
      const noteCount = selectedNotes.length
      const paddedNotes = [...selectedNotes, ...Array(4 - noteCount).fill(0x00)]

      const request = [
        0xF0,
        0x74,
        0x6F,
        0x71,
        SAVE_DATA,
        bankIndex,
        pedalIndex,
        TYPE_NOTE,
        midiChannelIndex,
        noteCount, //se envía el número real (no índice), si es solo 1 nota se envía 0x01 (no 0x00)
        ...paddedNotes,
        0xF7,
      ]
      return request
    }

    return null
  }

  const formatHex = (bytes) => bytes.map((b) => `0x${Number(b).toString(16).toUpperCase().padStart(2, '0')}`)

  const sendSysexRequest = (request) => {
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

  const handleClose = () => {
    onClose()
  }

  const handleSet = () => {
    const request = buildPopupRequest()
    if (request) {
      sendSysexRequest(request)
    } else {
      console.log('Popup request: tipo no soportado', type)
    }
    onClose()
  }

  const programChangeContent = (
    <div style={{ marginTop: '16px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>MIDI Channel (1-16)</label>
        <select
          value={midiChannel}
          onChange={(e) => setMidiChannel(Number(e.target.value))}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Program Change Number (0-127)</label>
        <select
          value={programChange}
          onChange={(e) => setProgramChange(Number(e.target.value))}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          {Array.from({ length: 128 }, (_, i) => i).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  )

  const ccContent = (
    <div style={{ marginTop: '16px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>MIDI Channel (1-16)</label>
        <select
          value={midiChannel}
          onChange={(e) => setMidiChannel(Number(e.target.value))}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>CC Number (0-127)</label>
        <select
          value={ccNumber}
          onChange={(e) => setCcNumber(Number(e.target.value))}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          {Array.from({ length: 128 }, (_, i) => i).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>CC Value (0-127)</label>
        <select
          value={ccValue}
          onChange={(e) => setCcValue(Number(e.target.value))}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          {Array.from({ length: 128 }, (_, i) => i).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  )

  const ccLatchContent = (
    <div style={{ marginTop: '16px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>MIDI Channel (1-16)</label>
        <select
          value={midiChannel}
          onChange={(e) => setMidiChannel(Number(e.target.value))}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>CC Latch Number (0-127)</label>
        <select
          value={ccLatchNumber}
          onChange={(e) => setCcLatchNumber(Number(e.target.value))}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          {Array.from({ length: 128 }, (_, n) => n).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  )

  const multipleCcContent = (
    <div style={{ marginTop: '16px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>MIDI Channel (1-16)</label>
        <select
          value={midiChannel}
          onChange={(e) => setMidiChannel(Number(e.target.value))}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {[1, 2, 3].map((i) => {
        const stateValue = i === 1 ? firstCC : i === 2 ? secondCC : thirdCC
        const setStateValue = i === 1 ? setFirstCC : i === 2 ? setSecondCC : setThirdCC
        const disabled = i === 1 ? false : (i === 2 ? firstCC === 'empty' : secondCC === 'empty')
        const valueLabel = i === 1 ? '1st' : i === 2 ? '2nd' : '3rd'

        return (
          <div key={i} style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>{`CC ${valueLabel} Number (0-127)`}</label>
            <select
              value={stateValue}
              disabled={disabled}
              onChange={(e) => {
                const value = e.target.value
                setStateValue(value)
                if (value === 'empty') {
                  if (i === 1) {
                    setSecondCC('empty'); setThirdCC('empty')
                  }
                  if (i === 2) {
                    setThirdCC('empty')
                  }
                }
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="empty">empty</option>
              {Array.from({ length: 128 }, (_, j) => j).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )

  const notes = ['empty', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octaves = ['-2', '-1', '0', '1', '2', '3', '4', '5', '6', '7']

  const notesContent = (
    <div style={{ marginTop: '16px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>MIDI Channel (1-16)</label>
        <select
          value={midiChannel}
          onChange={(e) => setMidiChannel(Number(e.target.value))}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {[1, 2, 3, 4].map((i) => {
        const noteState = i === 1 ? note1 : i === 2 ? note2 : i === 3 ? note3 : note4
        const setNoteState = i === 1 ? setNote1 : i === 2 ? setNote2 : i === 3 ? setNote3 : setNote4
        const octState = i === 1 ? oct1 : i === 2 ? oct2 : i === 3 ? oct3 : oct4
        const setOctState = i === 1 ? setOct1 : i === 2 ? setOct2 : i === 3 ? setOct3 : setOct4
        const noteDisabled = i === 1 ? false : (i === 2 ? note1 === 'empty' : i === 3 ? note2 === 'empty' : note3 === 'empty')
        const octaveDisabled = noteState === 'empty'

        return (
          <div key={i} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Note {i}</label>
                <select
                  value={noteState}
                  disabled={noteDisabled}
                  onChange={(e) => {
                    const value = e.target.value
                    setNoteState(value)
                    if (i === 1 && value === 'empty') {
                      setNote2('empty'); setOct2(0); setNote3('empty'); setOct3(0); setNote4('empty'); setOct4(0)
                    }
                    if (i === 2 && value === 'empty') {
                      setNote3('empty'); setOct3(0); setNote4('empty'); setOct4(0)
                    }
                    if (i === 3 && value === 'empty') {
                      setNote4('empty'); setOct4(0)
                    }
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                >
                  {notes.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div style={{ width: '120px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Octave</label>
                <select
                  value={octState}
                  disabled={octaveDisabled || (i !== 1 && noteDisabled)}
                  onChange={(e) => setOctState(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                >
                  {octaves.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )


  const typeText = 
    type === 'Program Change (Presets control)' ? programChangeContent
    : type === 'CC (CC controllers with always the same value)' ? ccContent
    : type === 'CC Latch (On /Off)' ? ccLatchContent
    : type === 'Multiples CC Latch (On / Off)' ? multipleCcContent
    : type === 'Notes (Send single notes or chords)' ? notesContent
    : <p style={{ marginTop: '16px', fontSize: '16px', color: '#333' }}>{`Este es un popup de tipo ${type}`}</p>

  return (
    <div className='banktype-overlay' onClick={onOverlayClick}>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>{`Pedal ${pedal} - Bank ${bank}`}</h2>
        <p style={{ opacity: 0.75, fontWeight: 500 }}><strong>Tipo de banco:</strong> {type}</p>
        {typeText}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', gap: '12px' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={handleClose}>Close</button>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={handleSet}>Set</button>
        </div>
      </div>
    </div>
  )
}

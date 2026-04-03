import { useState, useEffect } from 'react'
import { SAVE_DATA, TYPE_NOTE, GREEN_PEDALS, sendSysexRequest } from './midiUtils'
import { presetsData } from '../backend/datatransfer'

export const NotesPopup = ({ isOpen, onClose, pedal, bank, type, midiOutput }) => {
  const [midiChannel, setMidiChannel] = useState(1)
  const [note1, setNote1] = useState('empty')
  const [note2, setNote2] = useState('empty')
  const [note3, setNote3] = useState('empty')
  const [note4, setNote4] = useState('empty')
  const [oct1, setOct1] = useState("3")
  const [oct2, setOct2] = useState("3")
  const [oct3, setOct3] = useState("3")
  const [oct4, setOct4] = useState("3")

  useEffect(() => {
    if (isOpen && bank && pedal) {
      const bankIndex = Number(bank) > 0 ? Number(bank) - 1 : 0
      const pedalIndex = GREEN_PEDALS.indexOf(pedal)
      
      if (presetsData && presetsData[bankIndex] && presetsData[bankIndex][pedalIndex]) {
        const payload = presetsData[bankIndex][pedalIndex]
        setMidiChannel(payload[1] + 1)
        
        const noteCount = payload[2]
        
        const getNoteState = (byteVal, countRequired, countActual) => {
          if (countActual < countRequired || byteVal === 0x7F) return { note: 'empty', oct: '3' }
          const octIndex = Math.floor(byteVal / 12)
          const noteIndex = byteVal % 12
          const notesStr = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
          const octsStr = ['-2', '-1', '0', '1', '2', '3', '4', '5', '6', '7']
          return {
            note: notesStr[noteIndex] || 'empty',
            oct: octsStr[octIndex] || '3'
          }
        }
        
        const n1 = getNoteState(payload[3], 1, noteCount)
        const n2 = getNoteState(payload[4], 2, noteCount)
        const n3 = getNoteState(payload[5], 3, noteCount)
        const n4 = getNoteState(payload[6], 4, noteCount)
        
        setNote1(n1.note); setOct1(n1.oct)
        setNote2(n2.note); setOct2(n2.oct)
        setNote3(n3.note); setOct3(n3.oct)
        setNote4(n4.note); setOct4(n4.oct)
      }
    }
  }, [isOpen, bank, pedal])

  if (!isOpen) return null

  const onOverlayClick = () => onClose()
  const onPopupClick = (e) => e.stopPropagation()

  const handleSet = () => {
    const bankIndex = Number(bank) > 0 ? Number(bank) - 1 : 0
    const pedalIndex = GREEN_PEDALS.indexOf(pedal)
    const midiChannelIndex = Math.max(0, Math.min(15, midiChannel - 1))

    const noteToNumber = (note) => {
      if (note === 'empty') return -1
      return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(note)
    }
    const octToNumber = (oct) => {
      return ['-2', '-1', '0', '1', '2', '3', '4', '5', '6', '7'].indexOf(String(oct))
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
    const paddedNotes = [...selectedNotes, ...Array(4 - noteCount).fill(0x7F)]

    if (presetsData && presetsData[bankIndex] && presetsData[bankIndex][pedalIndex]) {
      presetsData[bankIndex][pedalIndex][1] = midiChannelIndex
      presetsData[bankIndex][pedalIndex][2] = noteCount
      presetsData[bankIndex][pedalIndex][3] = paddedNotes[0]
      presetsData[bankIndex][pedalIndex][4] = paddedNotes[1]
      presetsData[bankIndex][pedalIndex][5] = paddedNotes[2]
      presetsData[bankIndex][pedalIndex][6] = paddedNotes[3]
      console.log(`Updated presetsData[bank: ${bankIndex}][pedal: ${pedalIndex}]`, presetsData[bankIndex][pedalIndex])
    }
    
    onClose()
  }

  const notes = ['empty', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octaves = ['-2', '-1', '0', '1', '2', '3', '4', '5', '6', '7']

  return (
    <div className='banktype-overlay' onClick={onOverlayClick}>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>{`Pedal ${pedal} - Bank ${bank}`}</h2>
        <p style={{ opacity: 0.75, fontWeight: 500 }}><strong>Tipo de banco:</strong> {type}</p>
        
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
                      onChange={(e) => setOctState(e.target.value)}
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

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', gap: '12px' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={onClose}>Close</button>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={handleSet}>Set</button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useId } from 'react'
import './banktype.css'
import { SAVE_DATA, TYPE_NOTE, GREEN_PEDALS, sendSysexRequest } from '../midi/midiUtils'
import { presetsData } from '../../backend/datatransfer'
import { calculateChord, detectChord } from '../../backend/chordcalculator.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

export const NotesPopup = ({ isOpen, onClose, pedal, bank, type, midiOutput, onSetWarning }) => {
  const { t } = useLanguage()
  const rowId = useId()
  const [midiChannel, setMidiChannel] = useState(1)
  const [note1, setNote1] = useState('empty')
  const [note2, setNote2] = useState('empty')
  const [note3, setNote3] = useState('empty')
  const [note4, setNote4] = useState('empty')
  const [oct1, setOct1] = useState("3")
  const [oct2, setOct2] = useState("3")
  const [oct3, setOct3] = useState("3")
  const [oct4, setOct4] = useState("3")
  const [rootNote, setRootNote] = useState("C")
  const [chordType, setChordType] = useState("major")
  const [buildMethod, setBuildMethod] = useState("chordBuilder")
  const [currentInfo, setCurrentInfo] = useState({ channel: 1, notes: [] })

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

        const activeNotes = []
        if (n1.note !== 'empty') activeNotes.push(`${n1.note}${n1.oct}`)
        if (n2.note !== 'empty') activeNotes.push(`${n2.note}${n2.oct}`)
        if (n3.note !== 'empty') activeNotes.push(`${n3.note}${n3.oct}`)
        if (n4.note !== 'empty') activeNotes.push(`${n4.note}${n4.oct}`)
        
        setCurrentInfo({
          channel: payload[1] + 1,
          notes: activeNotes.length > 0 ? activeNotes : ['None']
        })
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

    const rawNotes = buildMethod === 'chordBuilder'
      ? calculateChord(rootNote, chordType)
      : [
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
  const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const chordTypes = ['major', 'minor', 'dominant', 'minor7', 'major7', 'dim', 'half-diminished', 'diminished', 'augmented']

  return (
    <div className='banktype-overlay' onClick={onOverlayClick}>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>{`${t('popup.pedal')} ${pedal} - ${t('popup.bank')} ${bank}`}</h2>
        <p className='subtitle' style={{ paddingTop: '5px', borderTop: '1px solid #6b6b6bff', marginBottom: '20px', textAlign: 'right' }}>{t('notes.title')}</p>
        
        <div className='popup-fields'>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px',opacity: 1, marginBottom: '10px', border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '12px', padding: '10px 20px 10px 20px', background: 'rgba(255, 255, 255, 0.5)'  }}>
            <div className='popup-field-row' style={{ margin: 0, flex: '1 1 auto' }}>
              <label htmlFor='notes-popup-midi-channel' style={{ whiteSpace: 'nowrap', flex: '0 0 auto', minWidth: 'auto', marginRight: '10px' }}>{t('popup.midiChannel')}</label>
              <select
                id='notes-popup-midi-channel'
                className='popup-field-select'
                value={midiChannel}
                onChange={(e) => setMidiChannel(Number(e.target.value))}
                style={{ flex: '0 1 80px' }}
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'flex-end', flex: '0 0 auto' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="buildMethod" 
                  value="chordBuilder" 
                  checked={buildMethod === 'chordBuilder'} 
                  onChange={() => setBuildMethod('chordBuilder')} 
                />
                {t('notes.chordBuilder')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="buildMethod" 
                  value="noteByNote" 
                  checked={buildMethod === 'noteByNote'} 
                  onChange={() => setBuildMethod('noteByNote')} 
                />
                {t('notes.noteByNote')}
              </label>
            </div>
          </div>

          <div className='chord-builder-container' style={{ opacity: buildMethod !== 'chordBuilder' ? 0.5 : 1, marginBottom: '10px', border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '12px', padding: '10px 20px 10px 20px', background: 'rgba(255, 255, 255, 0.5)' }}>
            <div className='popup-note-row' style={{ flexWrap: 'nowrap', marginBottom: 0}}>
              <label className='popup-note-label' style={{ flex: '0 0 auto', minWidth: '40px' }}>{t('notes.root')}</label>
              <select
                className='popup-field-select--note'
                value={rootNote}
                style={{ flex: 1, minWidth: 0 }}
                disabled={buildMethod !== 'chordBuilder'}
                onChange={(e) => {
                  const value = e.target.value
                  setRootNote(value)
                }}>
                {rootNotes.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <label className='popup-octave-label' style={{ flex: '0 0 auto', minWidth: 'auto', marginLeft: '5px' }}>{t('notes.type')}</label>
              <select
                className='popup-field-select--note'
                value={chordType}
                style={{ flex: 1, minWidth: 0 }}
                disabled={buildMethod !== 'chordBuilder'}
                onChange={(e) => {
                  const value = e.target.value
                  setChordType(value)
                }}>
                {chordTypes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 250px', opacity: buildMethod !== 'noteByNote' ? 0.5 : 1, border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '12px', padding: '20px', background: 'rgba(255, 255, 255, 0.5)' }}>
              {[1, 2, 3, 4].map((i) => {
              const noteState = i === 1 ? note1 : i === 2 ? note2 : i === 3 ? note3 : note4
              const setNoteState = i === 1 ? setNote1 : i === 2 ? setNote2 : i === 3 ? setNote3 : setNote4
              const octState = i === 1 ? oct1 : i === 2 ? oct2 : i === 3 ? oct3 : oct4
              const setOctState = i === 1 ? setOct1 : i === 2 ? setOct2 : i === 3 ? setOct3 : setOct4
              const noteDisabled = buildMethod !== 'noteByNote' || (i === 1 ? false : (i === 2 ? note1 === 'empty' : i === 3 ? note2 === 'empty' : note3 === 'empty'))
              const octaveDisabled = buildMethod !== 'noteByNote' || noteState === 'empty'
              const noteSelectId = `${rowId}-note-${i}`
              const octSelectId = `${rowId}-oct-${i}`

              return (
                <div key={i} className='popup-note-row' style={{ flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
                  <label className='popup-note-label' htmlFor={noteSelectId} style={{ flex: '0 0 auto', minWidth: 'auto' }}>{t('notes.note')} {i}</label>
                  <select
                    id={noteSelectId}
                    className='popup-field-select--note'
                    // style={{ flex: '0 1 85px', minWidth: '85px' }}
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
                  >
                    {notes.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <label className='popup-octave-label' htmlFor={octSelectId} style={{ flex: '0 0 auto', minWidth: 'auto', marginLeft: '10px' }}>{t('notes.octave')}</label>
                  <select
                    id={octSelectId}
                    className='popup-field-select--octave'
                    // style={{ flex: '0 1 65px', minWidth: '65px' }}
                    value={octState}
                    disabled={octaveDisabled || (i !== 1 && noteDisabled)}
                    onChange={(e) => setOctState(e.target.value)}
                  >
                    {octaves.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              )})}
            </div>

            <div style={{ flex: '1 1 200px', border: '3px solid #3f3f3fff', borderRadius: '12px', padding: '20px', background: 'rgba(0, 0, 0, 1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '3px 3px 5px rgba(0, 0, 0, 0.5)' }}>
              <p style={{ marginTop: 0, marginBottom: '15px', fontSize: '14px', fontWeight: '800',textAlign: 'center', color: '#007bff', borderBottom: '1px solid #007bff', paddingBottom: '10px' }}>{t('popup.currentSettings')}</p>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'left', alignItems: 'center'}}>
                <p style={{ fontWeight: 600, color: '#007bff', marginRight: '10px'}}>{t('notes.chord')}: </p>
                <p style={{ background: '#007bff', padding: '3px 4px', borderRadius: '5px', fontSize: '14px', fontWeight: '800', width: '100%', textAlign: 'center' }}>{detectChord(currentInfo?.notes).replace('undetected', '-')}</p>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'left'}}>
                <p style={{ fontWeight: 600, color: '#007bff', marginRight: '10px'}}>{t('popup.bank')}:</p>
                <p style={{ float: 'right', color: '#007bff', fontWeight: '800' }}>{bank}</p>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'left'}}>
                <p style={{ fontWeight: 600, color: '#007bff', marginRight: '10px'}}>{t('popup.pedal')}:</p>
                <p style={{ float: 'right', color: '#007bff', fontWeight: '800' }}>{pedal}</p>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'left'}}>
                <p style={{ fontWeight: 600, color: '#007bff', marginRight: '10px'}}>{t('popup.midiChannel')}:</p>
                <p style={{ float: 'right', color: '#007bff', fontWeight: '800' }}>{currentInfo?.channel || '-'}</p>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', width: '100%', border: 'solid 1px rgba(0, 47, 100, 1)', borderRadius: '10px', justifyContent: 'center', padding: '10px 0'}}>
                  {currentInfo?.notes?.map((n, idx) => (
                    <span key={idx} style={{ background: '#007bff', padding: '3px 4px', borderRadius: '5px', fontSize: '14px', fontWeight: '800', margin: '0 5px' }}>{n}</span>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between',  marginTop: '40px', gap: '12px' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={onClose}>{t('popup.close')}</button>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={() => onSetWarning ? onSetWarning(handleSet) : handleSet()}>{t('popup.set')}</button>
        </div>
      </div>
    </div>
  )
}

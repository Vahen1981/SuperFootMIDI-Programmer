import { useState, useEffect } from 'react'
import './banktype.css'
import { SAVE_DATA, TYPE_CC, GREEN_PEDALS, NON_LATCH, sendSysexRequest } from './midiUtils'
import { presetsData } from '../backend/datatransfer'

export const CcPopup = ({ isOpen, onClose, pedal, bank, type, midiOutput, onSetWarning }) => {
  const [midiChannel, setMidiChannel] = useState(1)
  const [ccNumber, setCcNumber] = useState(0)
  const [ccValue, setCcValue] = useState(0)

  useEffect(() => {
    if (isOpen && bank && pedal) {
      const bankIndex = Number(bank) > 0 ? Number(bank) - 1 : 0
      const pedalIndex = GREEN_PEDALS.indexOf(pedal)
      
      if (presetsData && presetsData[bankIndex] && presetsData[bankIndex][pedalIndex]) {
        const payload = presetsData[bankIndex][pedalIndex]
        setMidiChannel(payload[1] + 1)
        setCcNumber(payload[4])
        setCcValue(payload[5])
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

    if (presetsData && presetsData[bankIndex] && presetsData[bankIndex][pedalIndex]) {
      presetsData[bankIndex][pedalIndex][1] = midiChannelIndex
      presetsData[bankIndex][pedalIndex][4] = ccNumber
      presetsData[bankIndex][pedalIndex][5] = ccValue
      
      console.log(`Updated presetsData[bank: ${bankIndex}][pedal: ${pedalIndex}]`, presetsData[bankIndex][pedalIndex])
    }
    
    onClose()
  }

  return (
    <div className='banktype-overlay' onClick={onOverlayClick}>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>{`Pedal ${pedal} - Bank ${bank}`}</h2>
        <p className='subtitle' style={{ paddingTop: '5px', borderTop: '1px solid #6b6b6bff', marginBottom: '40px', textAlign: 'right' }}>Control Change</p>
        
        <div className='popup-fields'>
          <div className='popup-field-row'>
            <label htmlFor='cc-popup-midi-channel'>MIDI Channel (1-16)</label>
            <select
              id='cc-popup-midi-channel'
              className='popup-field-select'
              value={midiChannel}
              onChange={(e) => setMidiChannel(Number(e.target.value))}
            >
              {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className='popup-field-row'>
            <label htmlFor='cc-popup-cc-number'>CC Number (0-127)</label>
            <select
              id='cc-popup-cc-number'
              className='popup-field-select'
              value={ccNumber}
              onChange={(e) => setCcNumber(Number(e.target.value))}
            >
              {Array.from({ length: 128 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className='popup-field-row'>
            <label htmlFor='cc-popup-cc-value'>CC Value (0-127)</label>
            <select
              id='cc-popup-cc-value'
              className='popup-field-select'
              value={ccValue}
              onChange={(e) => setCcValue(Number(e.target.value))}
            >
              {Array.from({ length: 128 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', gap: '12px' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={onClose}>Close</button>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={() => onSetWarning ? onSetWarning(handleSet) : handleSet()}>Set</button>
        </div>
      </div>
    </div>
  )
}

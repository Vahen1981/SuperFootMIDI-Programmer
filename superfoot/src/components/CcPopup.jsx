import { useState, useEffect } from 'react'
import { SAVE_DATA, TYPE_CC, GREEN_PEDALS, NON_LATCH, sendSysexRequest } from './midiUtils'
import { presetsData } from '../backend/datatransfer'

export const CcPopup = ({ isOpen, onClose, pedal, bank, type, midiOutput }) => {
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

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', gap: '12px' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={onClose}>Close</button>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={handleSet}>Set</button>
        </div>
      </div>
    </div>
  )
}

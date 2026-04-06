import { useState, useEffect } from 'react'
import './banktype.css'
import { SAVE_DATA, TYPE_PC, GREEN_PEDALS, sendSysexRequest } from './midiUtils'
import { presetsData } from '../backend/datatransfer'
import { useLanguage } from '../context/LanguageContext.jsx'

export const ProgramChangePopup = ({ isOpen, onClose, pedal, bank, type, midiOutput, onSetWarning }) => {
  const { t } = useLanguage()
  const [midiChannel, setMidiChannel] = useState(1)
  const [programChange, setProgramChange] = useState(0)

  useEffect(() => {
    if (isOpen && bank && pedal) {
      const bankIndex = Number(bank) > 0 ? Number(bank) - 1 : 0
      const pedalIndex = GREEN_PEDALS.indexOf(pedal)
      
      if (presetsData && presetsData[bankIndex] && presetsData[bankIndex][pedalIndex]) {
        const payload = presetsData[bankIndex][pedalIndex]
        setMidiChannel(payload[1] + 1)
        setProgramChange(payload[3])
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
      presetsData[bankIndex][pedalIndex][3] = programChange
      
      console.log(`Updated presetsData[bank: ${bankIndex}][pedal: ${pedalIndex}]`, presetsData[bankIndex][pedalIndex])
    }
    
    onClose()
  }

  return (
    <div className='banktype-overlay' onClick={onOverlayClick}>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>{`${t('popup.pedal')} ${pedal} - ${t('popup.bank')} ${bank}`}</h2>
        <p className='subtitle' style={{ paddingTop: '5px', borderTop: '1px solid #6b6b6bff', marginBottom: '40px', textAlign: 'right' }}>{t('pc.title')}</p>
        <div className='popup-fields'>
          <div className='popup-field-row'>
            <label htmlFor='pc-popup-midi-channel'>{t('popup.midiChannel')}</label>
            <select
              id='pc-popup-midi-channel'
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
            <label htmlFor='pc-popup-program-number'>{t('pc.pcNumber')}</label>
            <select
              id='pc-popup-program-number'
              className='popup-field-select'
              value={programChange}
              onChange={(e) => setProgramChange(Number(e.target.value))}
            >
              {Array.from({ length: 128 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', gap: '12px' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={onClose}>{t('popup.close')}</button>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={() => onSetWarning ? onSetWarning(handleSet) : handleSet()}>{t('popup.set')}</button>
        </div>
      </div>
    </div>
  )
}

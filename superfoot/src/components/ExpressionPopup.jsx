import { useState, useEffect } from 'react'
import './banktype.css'
import { expressionData } from '../backend/datatransfer'
import { useLanguage } from '../context/LanguageContext.jsx'

export const ExpressionPopup = ({ isOpen, onClose }) => {
  const { t } = useLanguage()
  const [midiChannel, setMidiChannel] = useState(1)
  const [ccNumber, setCcNumber] = useState(7)

  useEffect(() => {
    if (isOpen) {
      if (expressionData && expressionData.length >= 2) {
        setMidiChannel(expressionData[0] + 1)
        setCcNumber(expressionData[1])
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const onOverlayClick = () => onClose()
  const onPopupClick = (e) => e.stopPropagation()

  const handleSet = () => {
    const midiChannelIndex = Math.max(0, Math.min(15, midiChannel - 1))

    if (expressionData && expressionData.length >= 2) {
      expressionData[0] = midiChannelIndex
      expressionData[1] = ccNumber
      
      console.log(`Updated expressionData`, expressionData)
    }
    
    onClose()
  }

  return (
    <div className='banktype-overlay' onClick={onOverlayClick}>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>{t('expression.title')}</h2>
        <p className='subtitle' style={{ paddingTop: '5px', borderTop: '1px solid #6b6b6bff', marginBottom: '40px', textAlign: 'right' }}>{t('expression.title')}</p>
        <div className='popup-fields'>
          <div className='popup-field-row'>
            <label htmlFor='exp-popup-midi-channel'>{t('popup.midiChannel')}</label>
            <select
              id='exp-popup-midi-channel'
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
            <label htmlFor='exp-popup-cc-number'>{t('expression.ccNumber')}</label>
            <select
              id='exp-popup-cc-number'
              className='popup-field-select'
              value={ccNumber}
              onChange={(e) => setCcNumber(Number(e.target.value))}
            >
              {Array.from({ length: 128 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', gap: '12px' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={onClose}>{t('popup.close')}</button>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={handleSet}>{t('popup.set')}</button>
        </div>
      </div>
    </div>
  )
}

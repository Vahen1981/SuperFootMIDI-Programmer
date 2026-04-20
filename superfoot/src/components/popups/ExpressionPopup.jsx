import { useState, useEffect } from 'react'
import './banktype.css'
import { expressionData } from '../../backend/datatransfer'
import { useLanguage } from '../../context/LanguageContext.jsx'

export const ExpressionPopup = ({ isOpen, onClose, midiOutput }) => {
  const { t } = useLanguage()
  const [midiChannel, setMidiChannel] = useState(1)
  const [ccNumber, setCcNumber] = useState(7)
  const [isCalibrating, setIsCalibrating] = useState(false)

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

  const handleCalibrate = () => {
    if (midiOutput && midiOutput.state === 'connected') {
      try {
        const calibSysex = [0xF0, 0x74, 0x6F, 0x71, 0x42, 0xF7]
        midiOutput.send(calibSysex)
        console.log('Sent calibration requested sysex')
      } catch (error) {
        console.error('Failed to send calibration sysex:', error)
      }
    }
    setIsCalibrating(true)
  }

  const handleCloseCalibrate = () => {
    setIsCalibrating(false)
  }

  return (
    <div className='banktype-overlay' onClick={onOverlayClick}>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>{isCalibrating ? t('expression.calibTitle') : t('expression.title')}</h2>
        <p className='subtitle' style={{ paddingTop: '5px', borderTop: '1px solid #6b6b6bff', marginBottom: '40px', textAlign: 'right' }}>
          {isCalibrating ? t('expression.calibTitle') : t('expression.title')}
        </p>

        {isCalibrating ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: '#111', textAlign: 'left', lineHeight: '1.5' }}>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '10px' }}>{t('expression.calibStep1')}</li>
              <li style={{ marginBottom: '10px' }}>{t('expression.calibStep2')}</li>
            </ul>
            <p style={{ fontStyle: 'italic', color: '#b30000', fontWeight: 'bold' }}>{t('expression.calibCancel')}</p>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
              <button style={{ padding: '10px 30px', borderRadius: '8px' }} onClick={handleCloseCalibrate}>
                {t('expression.calibClose')}
              </button>
            </div>
          </div>
        ) : (
          <>
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

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <button style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#d15e21', color: 'white' }} onClick={handleCalibrate}>
            {t('expression.calibrateBtn')}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', gap: '12px' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={onClose}>{t('popup.close')}</button>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={handleSet}>{t('popup.set')}</button>
        </div>
        </>
        )}
      </div>
    </div>
  )
}

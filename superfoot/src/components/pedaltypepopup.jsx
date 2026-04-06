import { useState, useId } from 'react'
import './banktype.css'
import { ProgramChangePopup } from './ProgramChangePopup'
import { CcPopup } from './CcPopup'
import { CcLatchPopup } from './CcLatchPopup'
import { MultiplesCcLatchPopup } from './MultiplesCcLatchPopup'
import { NotesPopup } from './NotesPopup'
import { useLanguage } from '../context/LanguageContext.jsx'

export const PedalTypePopup = (props) => {
  const { t } = useLanguage()
  const { type, isOpen, onClose } = props
  const [warningOpen, setWarningOpen] = useState(false)
  const [hideWarningChecked, setHideWarningChecked] = useState(false)
  const hideWarningId = useId()

  if (!isOpen && !warningOpen) return null

  const handleSetWarning = (setFn) => {
    // Execute the save function immediately
    setFn()

    const hideWarning = localStorage.getItem('hideSetWarning') === 'true'
    if (!hideWarning) {
      setWarningOpen(true)
    }
  }

  const handleConfirmWarning = () => {
    if (hideWarningChecked) {
      localStorage.setItem('hideSetWarning', 'true')
    }
    setWarningOpen(false)
  }

  const extendedProps = { ...props, onSetWarning: handleSetWarning }

  const renderPopup = () => {
    switch (type) {
      case 'Program Change (Presets control)':
        return <ProgramChangePopup {...extendedProps} />
      case 'CC (CC controllers with always the same value)':
        return <CcPopup {...extendedProps} />
      case 'CC Latch (On /Off)':
        return <CcLatchPopup {...extendedProps} />
      case 'Multiples CC Latch (On / Off)':
        return <MultiplesCcLatchPopup {...extendedProps} />
      case 'Notes (Send single notes or chords)':
        return <NotesPopup {...extendedProps} />
      default:
        return (
          <div className='banktype-overlay' onClick={props.onClose}>
            <div className='banktype-popup' onClick={(e) => e.stopPropagation()}>
              <h2>{`${t('popup.pedal')} ${props.pedal} - ${t('popup.bank')} ${props.bank}`}</h2>
              <p style={{ opacity: 0.75, fontWeight: 500 }}><strong>{t('banktype.title')}:</strong> {type}</p>
              <p style={{ marginTop: '16px', fontSize: '16px', color: '#333' }}>
                {`Este es un popup de tipo ${type}`}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', gap: '12px' }}>
                <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={props.onClose}>{t('popup.close')}</button>
                <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={() => handleSetWarning(props.onClose)}>{t('popup.set')}</button>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      {renderPopup()}

      {warningOpen && (
        <div className="warning-overlay" style={{ zIndex: 3000 }}>
          <div className="warning-popup">
            <h3>{t('write.title')}</h3>
            <p dangerouslySetInnerHTML={{__html: t('write.desc') + '<br/><br/>' + t('write.warning')}}></p>
            <div className='popup-warning-checkbox-row'>
              <input
                id={hideWarningId}
                type='checkbox'
                checked={hideWarningChecked}
                onChange={(e) => setHideWarningChecked(e.target.checked)}
              />
              <label htmlFor={hideWarningId}>{t('write.dontShow')}</label>
            </div>
            <div className="warning-actions">
              <button className="confirm-btn" onClick={handleConfirmWarning}>{t('write.ok')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


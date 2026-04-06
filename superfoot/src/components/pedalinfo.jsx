import { useLanguage } from '../context/LanguageContext.jsx'

export const PedalInfo = ({ isOpen, onClose, pedal, bank, type }) => {
  const { t } = useLanguage()
  if (!isOpen) return null

  return (
    <div className='banktype-overlay' onClick={onClose}>
      <div className='banktype-popup' onClick={(e) => e.stopPropagation()}>
        <h2>{`${t('popup.pedal')} ${pedal} - ${t('popup.bank')} ${bank}`}</h2>
        <p style={{ marginTop: '15px', fontSize: '16px', lineHeight: '1.5' }}>
          <strong>{t('banktype.title')}:</strong> {type}
        </p>
        <button onClick={onClose}>{t('popup.close')}</button>
      </div>
    </div>
  )
}

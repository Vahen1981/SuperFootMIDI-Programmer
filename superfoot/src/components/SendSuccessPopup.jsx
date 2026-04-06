import './banktype.css'
import './confirmPopups.css'
import { useLanguage } from '../context/LanguageContext.jsx'

export const SendSuccessPopup = ({ isOpen, onAccept }) => {
  const { t } = useLanguage()
  if (!isOpen) return null

  const onPopupClick = (e) => e.stopPropagation()

  return (
    <div className='banktype-overlay' style={{ zIndex: 1150 }}>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>{t('success.title')}</h2>
        <p style={{ marginBottom: '24px', lineHeight: 1.5, color: '#333', fontSize: '17px' }}>
          {t('success.desc')}
        </p>
        <div className='send-success-popup-actions'>
          <button type='button' onClick={onAccept}>
            {t('success.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}

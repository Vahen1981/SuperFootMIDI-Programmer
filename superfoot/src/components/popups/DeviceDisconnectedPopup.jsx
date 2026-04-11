import './banktype.css'
import { useLanguage } from '../../context/LanguageContext.jsx'

export const DeviceDisconnectedPopup = ({ isOpen, onAccept }) => {
  const { t } = useLanguage()
  if (!isOpen) return null

  const onPopupClick = (e) => e.stopPropagation()

  return (
    <div className='banktype-overlay'>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>{t('disconnect.title')}</h2>
        <p style={{ marginBottom: '24px', lineHeight: 1.5, color: '#333', fontSize: '17px' }} dangerouslySetInnerHTML={{ __html: t('disconnect.desc') }}>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type='button' onClick={onAccept}>
            {t('disconnect.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}

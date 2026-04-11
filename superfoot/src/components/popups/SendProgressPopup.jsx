import './banktype.css'
import './confirmPopups.css'
import { useLanguage } from '../../context/LanguageContext.jsx'

export const SendProgressPopup = ({
  isOpen,
  title,
  sentChunks,
  totalChunks,
  variant = 'send',
}) => {
  const { t } = useLanguage()
  if (!isOpen) return null

  const onPopupClick = (e) => e.stopPropagation()
  const pct = totalChunks > 0 ? Math.min(100, Math.round((sentChunks / totalChunks) * 100)) : 0

  const labelKey = variant === 'receive' ? 'progress.labelReceived' : 'progress.labelSent'
  const label = t(labelKey)
    .replace('{current}', String(sentChunks))
    .replace('{total}', String(totalChunks))
    .replace('{pct}', String(pct))

  return (
    <div className='banktype-overlay' style={{ zIndex: 1155 }}>
      <div className='banktype-popup send-progress-popup' onClick={onPopupClick}>
        <h2>{title}</h2>
        {variant === 'receive' ? (
          <>
            <p className='send-progress-description'>{t('progress.descReceive')}</p>
            <p className='send-progress-disconnect-warning'>{t('progress.warnDisconnect')}</p>
          </>
        ) : (
          <>
            <p className='send-progress-description'>{t('progress.descSend')}</p>
            <p className='send-progress-disconnect-warning'>{t('progress.warnDisconnect')}</p>
          </>
        )}
        <div
          className='send-progress-bar-wrap'
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          role='progressbar'
        >
          <div className='send-progress-bar-fill' style={{ width: `${pct}%` }} />
        </div>
        <p className='send-progress-label'>{label}</p>
      </div>
    </div>
  )
}

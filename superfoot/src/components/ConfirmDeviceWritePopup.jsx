import { useState, useEffect, useId } from 'react'
import './banktype.css'
import './confirmPopups.css'

export const ConfirmDeviceWritePopup = ({
  isOpen,
  onCancel,
  onConfirm,
  title,
  children,
  acknowledgeLabel,
}) => {
  const [acknowledged, setAcknowledged] = useState(false)
  const acknowledgeId = useId()

  useEffect(() => {
    if (!isOpen) setAcknowledged(false)
  }, [isOpen])

  if (!isOpen) return null

  const onPopupClick = (e) => e.stopPropagation()

  return (
    <div className='banktype-overlay' style={{ zIndex: 1100 }}>
      <div className='banktype-popup confirm-device-popup' onClick={onPopupClick}>
        <h2>{title}</h2>
        <div className='confirm-device-body'>{children}</div>
        <div className='confirm-device-ack-row'>
          <input
            id={acknowledgeId}
            type='checkbox'
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <label htmlFor={acknowledgeId}>{acknowledgeLabel}</label>
        </div>
        <div className='confirm-device-actions'>
          <button type='button' className='confirm-device-btn-secondary' onClick={onCancel}>
            Cancelar
          </button>
          <button type='button' disabled={!acknowledged} onClick={onConfirm}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

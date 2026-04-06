import './banktype.css'
import './confirmPopups.css'

export const SendSuccessPopup = ({ isOpen, onAccept }) => {
  if (!isOpen) return null

  const onPopupClick = (e) => e.stopPropagation()

  return (
    <div className='banktype-overlay' style={{ zIndex: 1150 }}>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>Envío correcto</h2>
        <p style={{ marginBottom: '24px', lineHeight: 1.5, color: '#333', fontSize: '17px' }}>
          Sus cambios se enviaron correctamente al dispositivo.
        </p>
        <div className='send-success-popup-actions'>
          <button type='button' onClick={onAccept}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

import './banktype.css'

export const DeviceDisconnectedPopup = ({ isOpen, onAccept }) => {
  if (!isOpen) return null

  const onPopupClick = (e) => e.stopPropagation()

  return (
    <div className='banktype-overlay'>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>SuperFoot MIDI desconectado</h2>
        <p style={{ marginBottom: '24px', lineHeight: 1.5, color: '#333', fontSize: '17px' }}>
          El dispositivo <strong>SuperFoot MIDI</strong> está desconectado o no está disponible. Por
          eso la aplicación no puede enviar ni aplicar ningún cambio en el dispositivo.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type='button' onClick={onAccept}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

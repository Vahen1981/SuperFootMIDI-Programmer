export const PedalInfo = ({ isOpen, onClose, pedal, bank, type }) => {
  if (!isOpen) return null

  return (
    <div className='banktype-overlay' onClick={onClose}>
      <div className='banktype-popup' onClick={(e) => e.stopPropagation()}>
        <h2>{`Pedal ${pedal} - Bank ${bank}`}</h2>
        <p style={{ marginTop: '15px', fontSize: '16px', lineHeight: '1.5' }}>
          <strong>Tipo de banco:</strong> {type}
        </p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

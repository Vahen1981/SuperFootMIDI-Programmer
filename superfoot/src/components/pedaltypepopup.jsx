import { ProgramChangePopup } from './ProgramChangePopup'
import { CcPopup } from './CcPopup'
import { CcLatchPopup } from './CcLatchPopup'
import { MultiplesCcLatchPopup } from './MultiplesCcLatchPopup'
import { NotesPopup } from './NotesPopup'

export const PedalTypePopup = (props) => {
  const { type, isOpen } = props

  if (!isOpen) return null

  switch (type) {
    case 'Program Change (Presets control)':
      return <ProgramChangePopup {...props} />
    case 'CC (CC controllers with always the same value)':
      return <CcPopup {...props} />
    case 'CC Latch (On /Off)':
      return <CcLatchPopup {...props} />
    case 'Multiples CC Latch (On / Off)':
      return <MultiplesCcLatchPopup {...props} />
    case 'Notes (Send single notes or chords)':
      return <NotesPopup {...props} />
    default:
      return (
        <div className='banktype-overlay' onClick={props.onClose}>
          <div className='banktype-popup' onClick={(e) => e.stopPropagation()}>
            <h2>{`Pedal ${props.pedal} - Bank ${props.bank}`}</h2>
            <p style={{ opacity: 0.75, fontWeight: 500 }}><strong>Tipo de banco:</strong> {type}</p>
            <p style={{ marginTop: '16px', fontSize: '16px', color: '#333' }}>
              {`Este es un popup de tipo ${type}`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', gap: '12px' }}>
              <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={props.onClose}>Close</button>
              <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={props.onClose}>Set</button>
            </div>
          </div>
        </div>
      )
  }
}

import './banktype.css'

const options = [
  'Program Change (Presets control)',
  'CC Latch (On /Off)',
  'Multiples CC Latch (On / Off)',
  'CC (CC controllers with always the same value)',
  'Notes (Send single notes or chords)'
]

export const BankType = ({ isOpen, onClose, bankTypes, setBankTypes }) => {
  if (!isOpen) return null

  const handleChange = (index, value) => {
    const newBankTypes = [...bankTypes]
    newBankTypes[index] = value
    setBankTypes(newBankTypes)
  }

  return (
    <div className="banktype-overlay">
      <div className="banktype-popup">
        <h2>Bank Types</h2>
        <div className="banktype-list">
          {bankTypes.map((type, index) => (
            <div key={index} className="banktype-item">
              <label>Bank {index + 1}:</label>
              <select
                value={type}
                onChange={(e) => handleChange(index, e.target.value)}
              >
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
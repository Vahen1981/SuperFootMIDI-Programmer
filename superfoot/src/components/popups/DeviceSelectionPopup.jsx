import { useState, useEffect } from 'react'
import './banktype.css'
import { useLanguage } from '../../context/LanguageContext.jsx'

export const DeviceSelectionPopup = ({ isOpen, midiAccess, onConnect, onCancel }) => {
  const { t } = useLanguage()
  const [inputs, setInputs] = useState([])
  const [outputs, setOutputs] = useState([])
  const [selectedInput, setSelectedInput] = useState('')
  const [selectedOutput, setSelectedOutput] = useState('')

  useEffect(() => {
    if (isOpen && midiAccess) {
      const inputsArray = Array.from(midiAccess.inputs.values())
      const outputsArray = Array.from(midiAccess.outputs.values())
      setInputs(inputsArray)
      setOutputs(outputsArray)
      if (inputsArray.length > 0 && !selectedInput) {
        setSelectedInput(inputsArray[0].id)
      }
      if (outputsArray.length > 0 && !selectedOutput) {
        setSelectedOutput(outputsArray[0].id)
      }
    }
  }, [isOpen, midiAccess])

  if (!isOpen) return null

  const onPopupClick = (e) => e.stopPropagation()

  const handleConnect = () => {
    onConnect(selectedInput, selectedOutput)
  }

  const noDevices = inputs.length === 0 && outputs.length === 0

  return (
    <div className='banktype-overlay'>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>{t('selectDevice.title')}</h2>
        <p style={{ marginBottom: '24px', lineHeight: 1.5, color: '#333', fontSize: '15px' }} dangerouslySetInnerHTML={{ __html: t('selectDevice.desc') }}>
        </p>
        
        {noDevices ? (
          <p style={{ color: 'red', marginBottom: '20px' }}>{t('selectDevice.noDevices')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: 'bold' }}>{t('selectDevice.inputLabel')}</label>
              <select 
                value={selectedInput} 
                onChange={(e) => setSelectedInput(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="" disabled>{t('selectDevice.select')}</option>
                {inputs.map(input => (
                  <option key={input.id} value={input.id}>{input.name || `Port ${input.id}`}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: 'bold' }}>{t('selectDevice.outputLabel')}</label>
              <select 
                value={selectedOutput} 
                onChange={(e) => setSelectedOutput(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="" disabled>{t('selectDevice.select')}</option>
                {outputs.map(output => (
                  <option key={output.id} value={output.id}>{output.name || `Port ${output.id}`}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button type='button' onClick={handleConnect} disabled={!selectedInput || !selectedOutput}>
            {t('selectDevice.connect')}
          </button>
          {onCancel && (
            <button type='button' onClick={onCancel} style={{ backgroundColor: '#aaa' }}>
              {t('selectDevice.cancel')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

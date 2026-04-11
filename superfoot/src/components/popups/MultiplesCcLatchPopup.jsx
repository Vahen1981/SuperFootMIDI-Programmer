import { useState, useEffect } from 'react'
import './banktype.css'
import { SAVE_DATA, TYPE_CC, GREEN_PEDALS, LATCH, sendSysexRequest } from '../midi/midiUtils'
import { presetsData } from '../../backend/datatransfer'
import { useLanguage } from '../../context/LanguageContext.jsx'

export const MultiplesCcLatchPopup = ({ isOpen, onClose, pedal, bank, type, midiOutput, onSetWarning }) => {
  const { t } = useLanguage()
  const [midiChannel, setMidiChannel] = useState(1)
  const [firstCC, setFirstCC] = useState('empty')
  const [secondCC, setSecondCC] = useState('empty')
  const [thirdCC, setThirdCC] = useState('empty')

  useEffect(() => {
    if (isOpen && bank && pedal) {
      const bankIndex = Number(bank) > 0 ? Number(bank) - 1 : 0
      const pedalIndex = GREEN_PEDALS.indexOf(pedal)
      
      if (presetsData && presetsData[bankIndex] && presetsData[bankIndex][pedalIndex]) {
        const payload = presetsData[bankIndex][pedalIndex]
        setMidiChannel(payload[1] + 1)
        
        const count = payload[3]
        setFirstCC(count >= 1 && payload[4] !== 0x7F ? payload[4] : 'empty')
        setSecondCC(count >= 2 && payload[5] !== 0x7F ? payload[5] : 'empty')
        setThirdCC(count >= 3 && payload[6] !== 0x7F ? payload[6] : 'empty')
      }
    }
  }, [isOpen, bank, pedal])

  if (!isOpen) return null

  const onOverlayClick = () => onClose()
  const onPopupClick = (e) => e.stopPropagation()

  const handleSet = () => {
    const bankIndex = Number(bank) > 0 ? Number(bank) - 1 : 0
    const pedalIndex = GREEN_PEDALS.indexOf(pedal)
    const midiChannelIndex = Math.max(0, Math.min(15, midiChannel - 1))

    const latchControllers = [firstCC, secondCC, thirdCC]
    const activeControllers = latchControllers
      .filter((c) => c !== 'empty')
      .map((c) => Number(c))
    const controllerCount = Math.max(0, Math.min(3, activeControllers.length))
    const controllerBytes = [...activeControllers, ...Array(3 - controllerCount).fill(0x7F)]

    if (presetsData && presetsData[bankIndex] && presetsData[bankIndex][pedalIndex]) {
      presetsData[bankIndex][pedalIndex][1] = midiChannelIndex
      presetsData[bankIndex][pedalIndex][3] = controllerCount
      presetsData[bankIndex][pedalIndex][4] = controllerBytes[0]
      presetsData[bankIndex][pedalIndex][5] = controllerBytes[1]
      presetsData[bankIndex][pedalIndex][6] = controllerBytes[2]
      
      console.log(`Updated presetsData[bank: ${bankIndex}][pedal: ${pedalIndex}]`, presetsData[bankIndex][pedalIndex])
    }
    
    onClose()
  }

  return (
    <div className='banktype-overlay' onClick={onOverlayClick}>
      <div className='banktype-popup' onClick={onPopupClick}>
        <h2>{`${t('popup.pedal')} ${pedal} - ${t('popup.bank')} ${bank}`}</h2>
        <p className='subtitle' style={{ paddingTop: '5px', borderTop: '1px solid #6b6b6bff', marginBottom: '40px', textAlign: 'right' }}>{t('mcc.title')}</p>
        
        <div className='popup-fields'>
          <div className='popup-field-row'>
            <label htmlFor='mccl-popup-midi-channel'>{t('popup.midiChannel')}</label>
            <select
              id='mccl-popup-midi-channel'
              className='popup-field-select'
              value={midiChannel}
              onChange={(e) => setMidiChannel(Number(e.target.value))}
            >
              {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {[1, 2, 3].map((i) => {
            const stateValue = i === 1 ? firstCC : i === 2 ? secondCC : thirdCC
            const setStateValue = i === 1 ? setFirstCC : i === 2 ? setSecondCC : setThirdCC
            const disabled = i === 1 ? false : (i === 2 ? firstCC === 'empty' : secondCC === 'empty')
            const valueLabel = i === 1 ? '1' : i === 2 ? '2' : '3'
            const selectId = `mccl-popup-cc-${i}`

            return (
              <div key={i} className='popup-field-row'>
                <label htmlFor={selectId}>{`${t('mcc.message')} ${valueLabel}`}</label>
                <select
                  id={selectId}
                  className='popup-field-select'
                  value={stateValue}
                  disabled={disabled}
                  onChange={(e) => {
                    const value = e.target.value
                    setStateValue(value)
                    if (value === 'empty') {
                      if (i === 1) { setSecondCC('empty'); setThirdCC('empty') }
                      if (i === 2) { setThirdCC('empty') }
                    }
                  }}
                >
                  <option value="empty">empty</option>
                  {Array.from({ length: 128 }, (_, j) => j).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', gap: '12px' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={onClose}>{t('popup.close')}</button>
          <button style={{ flex: 1, padding: '10px', borderRadius: '8px' }} onClick={() => onSetWarning ? onSetWarning(handleSet) : handleSet()}>{t('popup.set')}</button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import './banktype.css'
import { banksData, presetsData } from '../../backend/datatransfer.js'
import {
  PC_BANK_TEMP,
  CC_LATCH_BANK_TEMP,
  CC_MULTI_BANK_TEMP,
  CC_NON_LATCH_BANK_TEMP,
  NOTES_BANK_TEMP
} from '../../data/BankTemp.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

const options = [
  'Program Change (Presets control)',
  'CC Latch (On /Off)',
  'Multiples CC Latch (On / Off)',
  'CC (CC controllers with always the same value)',
  'Notes (Send single notes or chords)'
]

const optionToByte = {
  'Program Change (Presets control)': 0x00,
  'CC Latch (On /Off)': 0x01,
  'Multiples CC Latch (On / Off)': 0x02,
  'CC (CC controllers with always the same value)': 0x03,
  'Notes (Send single notes or chords)': 0x04
}

const optionToDefaultData = {
  'Program Change (Presets control)': PC_BANK_TEMP,
  'CC Latch (On /Off)': CC_LATCH_BANK_TEMP,
  'Multiples CC Latch (On / Off)': CC_MULTI_BANK_TEMP,
  'CC (CC controllers with always the same value)': CC_NON_LATCH_BANK_TEMP,
  'Notes (Send single notes or chords)': NOTES_BANK_TEMP
}

export const BankType = ({ isOpen, onClose, bankTypes, setBankTypes }) => {
  const { t } = useLanguage()
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, index: null, value: null })

  if (!isOpen) return null

  const handleSelectChange = (index, value) => {
    if (bankTypes[index] === value) return
    setConfirmModal({ isOpen: true, index, value })
  }

  const handleConfirm = () => {
    const { index, value } = confirmModal
    
    // Update local UI state
    const newBankTypes = [...bankTypes]
    newBankTypes[index] = value
    setBankTypes(newBankTypes)
    
    // Update global state
    banksData[index] = optionToByte[value]
    // Use deep copy to prevent mutating the template
    presetsData[index] = JSON.parse(JSON.stringify(optionToDefaultData[value]))

    setConfirmModal({ isOpen: false, index: null, value: null })
  }

  const handleCancel = () => {
    setConfirmModal({ isOpen: false, index: null, value: null })
  }

  return (
    <div className="banktype-overlay">
      <div className="banktype-popup">
        <h2>{t('banktype.title')}</h2>
        <div className="banktype-list">
          {bankTypes.map((type, index) => (
            <div key={index} className="banktype-item">
              <label>{t('popup.bank')} {index + 1}:</label>
              <select
                value={type}
                onChange={(e) => handleSelectChange(index, e.target.value)}
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
        <button onClick={onClose}>{t('popup.close')}</button>
      </div>

      {confirmModal.isOpen && (
        <div className="warning-overlay">
          <div className="warning-popup">
            <h3>{t('banktype.warningTitle')}</h3>
            <p>
              {t('banktype.warningDesc')}
            </p>
            <div className="warning-actions">
              <button className="confirm-btn" onClick={handleConfirm}>{t('banktype.accept')}</button>
              <button className="cancel-btn" onClick={handleCancel}>{t('banktype.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
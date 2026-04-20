import { useState, useEffect, useRef } from 'react'
import './midimonitor.css'
import { useLanguage } from '../../context/LanguageContext.jsx'

export const MidiMonitor = ({ isOpen, onClose, midiInput }) => {
  const { t } = useLanguage()
  const [messages, setMessages] = useState([])
  const contentRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !midiInput) return

    const handleMidiMessage = (event) => {
      const data = event.data
      const now = new Date()
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now
        .getMilliseconds()
        .toString()
        .padStart(3, '0')}`

      let type = 'Other'
      let channel = '-'
      let number = '-'
      let value = '-'
      let typeClass = 'type-other'

      const status = data[0]

      if (status >= 0x80 && status <= 0x8F) {
        type = 'Note Off'
        channel = (status & 0x0F) + 1
        number = data[1]
        value = data[2]
        typeClass = 'type-note-off'
      } else if (status >= 0x90 && status <= 0x9F) {
        type = data[2] === 0 ? 'Note Off' : 'Note On'
        channel = (status & 0x0F) + 1
        number = data[1]
        value = data[2]
        typeClass = data[2] === 0 ? 'type-note-off' : 'type-note-on'
      } else if (status >= 0xB0 && status <= 0xBF) {
        type = 'CC'
        channel = (status & 0x0F) + 1
        number = data[1]
        value = data[2]
        typeClass = 'type-cc'
      } else if (status >= 0xC0 && status <= 0xCF) {
        type = 'PC'
        channel = (status & 0x0F) + 1
        number = data[1]
        typeClass = 'type-pc'
      } else if (status === 0xF0) {
        type = 'SysEx'
        typeClass = 'type-sysex'
      } else if (status === 0xFE) {
        // Ignore Active Sensing to avoid noise unless it's rare
        return
      }

      const hex = Array.from(data)
        .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
        .join(' ')

      const newMessage = {
        id: Date.now() + Math.random(),
        time,
        type,
        channel,
        number,
        value,
        hex,
        typeClass
      }

      setMessages((prev) => {
        const updated = [...prev, newMessage]
        if (updated.length > 100) return updated.slice(updated.length - 100)
        return updated
      })
    }

    midiInput.addEventListener('midimessage', handleMidiMessage)
    return () => {
      midiInput.removeEventListener('midimessage', handleMidiMessage)
    }
  }, [isOpen, midiInput])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [messages])

  if (!isOpen) return null

  const onOverlayClick = () => onClose()
  const onPopupClick = (e) => e.stopPropagation()

  return (
    <div className="midimonitor-overlay" onClick={onOverlayClick}>
      <div className="midimonitor-popup" onClick={onPopupClick}>
        <div className="midimonitor-header">
          <h2>{t('monitor.title')}</h2>
          <div className="midimonitor-actions">
            <button className="monitor-btn clear" onClick={() => setMessages([])}>
              {t('monitor.clear')}
            </button>
            <button className="monitor-btn" onClick={onClose}>
              {t('popup.close')}
            </button>
          </div>
        </div>

        <div className="midimonitor-content" ref={contentRef}>
          <table className="monitor-table">
            <thead>
              <tr>
                <th>{t('monitor.time')}</th>
                <th>{t('monitor.type')}</th>
                <th>{t('monitor.channel')}</th>
                <th>{t('monitor.number')}</th>
                <th>{t('monitor.value')}</th>
                <th>{t('monitor.hex')}</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id} className="monitor-row">
                  <td className="cell-time">{msg.time}</td>
                  <td className={`cell-type ${msg.typeClass}`}>{msg.type}</td>
                  <td className="cell-channel">{msg.channel}</td>
                  <td className="cell-num">{msg.number}</td>
                  <td className="cell-val">{msg.value}</td>
                  <td className="cell-hex">{msg.hex}</td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#444', padding: '40px' }}>
                    Waiting for MIDI messages...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

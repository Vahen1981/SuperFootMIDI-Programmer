import { useState, useEffect, useCallback, useRef } from 'react'
import '../layout/interface.css'
import '../layout/leds.css'
import '../layout/pedals.css'
import { BankType } from '../popups/banktype.jsx'
import { PedalTypePopup } from '../popups/pedaltypepopup.jsx'
import { DeviceSelectionPopup } from '../popups/DeviceSelectionPopup.jsx'
import { ConfirmDeviceWritePopup } from '../popups/ConfirmDeviceWritePopup.jsx'
import { SendSuccessPopup } from '../popups/SendSuccessPopup.jsx'
import { SendProgressPopup } from '../popups/SendProgressPopup.jsx'
import { ExpressionPopup } from '../popups/ExpressionPopup.jsx'
import { MidiMonitor } from '../popups/MidiMonitor.jsx'
import { banksData, presetsData, expressionData } from '../../backend/datatransfer'
import logo from '../../assets/logo.png'
import logowhite from '../../assets/logo-white.png'
import ledRojo from '../../assets/ledRojo.png'
import ledVerde from '../../assets/ledVerde.png'
import {
  REQUEST_DATA,
  SAVE_DATA_CHUNK_COUNT,
  SAVE_DATA_PAYLOAD_LENGTH,
  buildSaveDataChunkSysex,
  mergeRequestDataChunkPayloads,
  parseRequestDataSysexChunk,
  sendSysexRequest,
} from '../midi/midiUtils.js'
import { BANK_TYPES, FACTORY_SETTINGS, EXPRESSION_SETTINGS } from '../../data/factory.js'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useDeviceDetect } from '../../hooks/useDeviceDetect.js'


const SAVE_DATA_CHUNK_INTERVAL_MS = 500



const USE_FACTORY_DATA = false // Change to true to use factory.js data instead of incoming SysEx
const greenPedals = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const clearSuperFootInputListeners = (midiAccess, customMidiInputId) => {
  if (!midiAccess) return
  try {
    for (const input of midiAccess.inputs.values()) {
      const isSuperFootName = input.name && input.name.toLowerCase().includes('superfoot midi')
      const isCustomInput = customMidiInputId && input.id === customMidiInputId
      if (!isSuperFootName && !isCustomInput) continue
      try {
        input.onmidimessage = null
      } catch {
        /* puerto ya inválido */
      }
    }
  } catch {
    /* MIDIAccess inestable durante hot-unplug */
  }
}

export const Interface = () => {
  const { t, language, toggleLanguage } = useLanguage()
  const { isMobile, isLandscape } = useDeviceDetect()
  const [activeGreen, setActiveGreen] = useState(null)
  const [counter, setCounter] = useState(0)
  const [upPressed, setUpPressed] = useState(false)
  const [downPressed, setDownPressed] = useState(false)
  const [pressedPedal, setPressedPedal] = useState(null)
  const [isBankTypeOpen, setIsBankTypeOpen] = useState(false)
  const [isExpressionOpen, setIsExpressionOpen] = useState(false)
  const [isMidiMonitorOpen, setIsMidiMonitorOpen] = useState(false)

  const bankTypeName = (code) => {
    switch (code) {
      case 0x00:
        return 'Program Change (Presets control)'
      case 0x01:
        return 'CC Latch (On /Off)'
      case 0x02:
        return 'Multiples CC Latch (On / Off)'
      case 0x03:
        return 'CC (CC controllers with always the same value)'
      case 0x04:
        return 'Notes (Send single notes or chords)'
      default:
        return 'Program Change (Presets control)'
    }
  }

  const [bankTypes, setBankTypes] = useState(
    Array.from(banksData).slice(0, 10).map((code) => bankTypeName(code))
  )
  const [isDeviceOnline, setIsDeviceOnline] = useState(false)
  const [midiInitialized, setMidiInitialized] = useState(false)
  const [disconnectWarningOpen, setDisconnectWarningOpen] = useState(false)
  const [programConfirmOpen, setProgramConfirmOpen] = useState(false)
  const [factoryConfirmOpen, setFactoryConfirmOpen] = useState(false)
  const [sendSuccessOpen, setSendSuccessOpen] = useState(false)
  const [sendProgressOpen, setSendProgressOpen] = useState(false)
  const [sendProgressSent, setSendProgressSent] = useState(0)
  const [sendProgressTitleKey, setSendProgressTitleKey] = useState('progress.titleSendingProgram')
  const [receiveProgressOpen, setReceiveProgressOpen] = useState(false)
  const [receiveProgressCount, setReceiveProgressCount] = useState(0)
  const [customMidiInputId, setCustomMidiInputId] = useState('')
  const [customMidiOutputId, setCustomMidiOutputId] = useState('')
  const initialDisconnectShownRef = useRef(false)
  const saveDataSendSessionRef = useRef(0)
  const receiveProgressRef = useRef({
    open: () => {},
    close: () => {},
    setCount: () => {},
  })
  receiveProgressRef.current = {
    open: () => {
      setReceiveProgressOpen(true)
      setReceiveProgressCount(0)
    },
    close: () => setReceiveProgressOpen(false),
    setCount: (n) => setReceiveProgressCount(n),
  }

  const [pedalInfoOpen, setPedalInfoOpen] = useState(false)
  const [selectedPedalInfo, setSelectedPedalInfo] = useState(null)
  const [midiOutput, setMidiOutput] = useState(null)
  const [midiInput, setMidiInput] = useState(null)

  const midiAccessRef = useRef(null)
  const sysexSessionRef = useRef(0)

  const getSuperFootMidiOutput = useCallback((midiAccess) => {
    if (customMidiOutputId) {
      const output = midiAccess.outputs.get(customMidiOutputId)
      if (output && output.state === 'connected') return output
    }
    for (const output of midiAccess.outputs.values()) {
      if (!output.name || !output.name.toLowerCase().includes('superfoot midi')) continue
      if (output.state !== 'connected') continue
      return output
    }
    return null
  }, [customMidiOutputId])

  const isSuperFootMidiPresent = useCallback((midiAccess) => {
    if (customMidiInputId && customMidiOutputId) {
      const input = midiAccess.inputs.get(customMidiInputId)
      const output = midiAccess.outputs.get(customMidiOutputId)
      if (input?.state === 'connected' && output?.state === 'connected') return true
    }
    for (const input of midiAccess.inputs.values()) {
      if (!input.name || !input.name.toLowerCase().includes('superfoot midi')) continue
      if (input.state === 'connected') return true
    }
    for (const output of midiAccess.outputs.values()) {
      if (!output.name || !output.name.toLowerCase().includes('superfoot midi')) continue
      if (output.state === 'connected') return true
    }
    return false
  }, [customMidiInputId, customMidiOutputId])

  const scanMidiDevices = useCallback((midiAccess) => {
    const output = getSuperFootMidiOutput(midiAccess)
    const found = isSuperFootMidiPresent(midiAccess)
    const online = !!found
    if (!output) {
      clearSuperFootInputListeners(midiAccess, customMidiInputId)
    }
    setIsDeviceOnline((prev) => (prev === online ? prev : online))
    setMidiOutput((prev) => (prev === output ? prev : output))
  }, [getSuperFootMidiOutput, isSuperFootMidiPresent, customMidiInputId])

  useEffect(() => {
    let cancelled = false
    let debounceRaf = null

    const runScan = () => {
      if (cancelled || !midiAccessRef.current) return
      scanMidiDevices(midiAccessRef.current)
    }

    const scheduleScan = () => {
      if (debounceRaf != null) cancelAnimationFrame(debounceRaf)
      debounceRaf = requestAnimationFrame(() => {
        debounceRaf = requestAnimationFrame(() => {
          debounceRaf = null
          runScan()
        })
      })
    }

    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API is not supported in this browser.')
      setMidiInitialized(true)
      return undefined
    }

    navigator
      .requestMIDIAccess({ sysex: true })
      .then((midiAccess) => {
        if (cancelled) return
        midiAccessRef.current = midiAccess
        runScan()
        setMidiInitialized(true)
        midiAccess.onstatechange = () => scheduleScan()
      })
      .catch((error) => {
        console.error('MIDI access error:', error)
        if (!cancelled) setMidiInitialized(true)
      })

    return () => {
      cancelled = true
      if (debounceRaf != null) cancelAnimationFrame(debounceRaf)
      const access = midiAccessRef.current
      if (access) {
        access.onstatechange = null
        midiAccessRef.current = null
      }
    }
  }, [scanMidiDevices])

  const deviceReady = Boolean(isDeviceOnline && midiOutput)

  const warnIfDisconnected = useCallback(() => {
    if (deviceReady) return false
    setDisconnectWarningOpen(true)
    return true
  }, [deviceReady])

  useEffect(() => {
    if (!midiInitialized || initialDisconnectShownRef.current) return
    initialDisconnectShownRef.current = true
    if (!isDeviceOnline || !midiOutput) {
      setDisconnectWarningOpen(true)
    }
  }, [midiInitialized, isDeviceOnline, midiOutput])

  /** Fuerza nuevo ciclo listener + REQUEST_DATA al volver a conectar tras estar offline. */
  const [deviceDataSyncKey, setDeviceDataSyncKey] = useState(0)
  const prevDeviceReadyRef = useRef(false)
  const hadDeviceReadyOnceRef = useRef(false)

  useEffect(() => {
    const ready = Boolean(
      isDeviceOnline && midiOutput && midiOutput.state === 'connected'
    )
    const wasReady = prevDeviceReadyRef.current

    if (ready) {
      if (hadDeviceReadyOnceRef.current && !wasReady) {
        setDeviceDataSyncKey((k) => k + 1)
      }
      hadDeviceReadyOnceRef.current = true
    }
    prevDeviceReadyRef.current = ready
  }, [isDeviceOnline, midiOutput])

  useEffect(() => {
    if (!midiOutput || !isDeviceOnline) return
    if (midiOutput.state !== 'connected') return

    const midiAccess = midiAccessRef.current
    if (!midiAccess) return

    const session = ++sysexSessionRef.current
    let foundInput = null
    const requestDataChunkMap = new Map()

    const applyDevicePayload572 = (payload) => {
      if (payload.length !== SAVE_DATA_PAYLOAD_LENGTH) return
      if (!USE_FACTORY_DATA) {
        let index = 0
        for (let i = 0; i < 10; i++) banksData[i] = payload[index++]

        for (let b = 0; b < 10; b++) {
          for (let p = 0; p < 8; p++) {
            for (let d = 0; d < 7; d++) {
              presetsData[b][p][d] = payload[index++]
            }
          }
        }

        expressionData[0] = payload[index++]
        expressionData[1] = payload[index++]

        setBankTypes(Array.from(banksData).slice(0, 10).map((code) => bankTypeName(code)))
        console.log('Sysex payload loaded correctly into banksData, presetsData and expressionData.')
      } else {
        console.log('Received Sysex but skipped parsing because USE_FACTORY_DATA is true. Using factory logic.')
      }
    }

    for (const input of midiAccess.inputs.values()) {
      const isSuperFootName = input.name && input.name.toLowerCase().includes('superfoot midi')
      const isCustomInput = customMidiInputId && input.id === customMidiInputId
      if (!isSuperFootName && !isCustomInput) continue
      if (input.state !== 'connected') continue
      foundInput = input
      input.onmidimessage = (event) => {
        if (session !== sysexSessionRef.current) return
        const data = event.data

        // Ignore non-Sysex messages (e.g. Active Sense 0xFE, Clock 0xF8, etc.)
        if (data.length < 3 || data[0] < 0xF0) return

        if (
          data.length === 578 &&
          data[0] === 0xf0 &&
          data[1] === 0x74 &&
          data[2] === 0x6f &&
          data[3] === 0x71
        ) {
          requestDataChunkMap.clear()
          receiveProgressRef.current.setCount(SAVE_DATA_CHUNK_COUNT)

          applyDevicePayload572(new Uint8Array(data.subarray(5, 5 + SAVE_DATA_PAYLOAD_LENGTH)))
          if (window._sysexLoadTimeout) clearTimeout(window._sysexLoadTimeout)
          return
        }

        const parsed = parseRequestDataSysexChunk(data)
        if (!parsed) {
          console.warn('Chunk missed parsing valids. Length:', data.length)
          return
        }
        
        console.log(`Received chunk ${parsed.chunkIndex + 1}/${parsed.totalChunks}. Payload length: ${parsed.payload.length}`)
        
        requestDataChunkMap.set(parsed.chunkIndex, parsed.payload)
        receiveProgressRef.current.setCount(requestDataChunkMap.size)

        const total = SAVE_DATA_CHUNK_COUNT // force to expect our defined chunks

        if (window._sysexLoadTimeout) clearTimeout(window._sysexLoadTimeout)
        window._sysexLoadTimeout = setTimeout(() => {
          if (requestDataChunkMap.size > 0 && requestDataChunkMap.size < total) {
            console.warn('Timeout! Assembling payload with missing chunks...')
            const merged = mergeRequestDataChunkPayloads(requestDataChunkMap, total)
            requestDataChunkMap.clear()
            receiveProgressRef.current.close()
            if (merged) applyDevicePayload572(merged)
          }
        }, 1500)

        if (requestDataChunkMap.size < total) return
        for (let i = 0; i < total; i++) {
          if (!requestDataChunkMap.has(i)) return
        }

        if (window._sysexLoadTimeout) clearTimeout(window._sysexLoadTimeout)

        const merged = mergeRequestDataChunkPayloads(requestDataChunkMap, total)
        if (!merged) {
          console.warn('No se pudo ensamblar REQUEST_DATA en 572 bytes.')
          return
        }
        requestDataChunkMap.clear()
        receiveProgressRef.current.close()
        applyDevicePayload572(merged)
      }
      setMidiInput(foundInput)
      break
    }

    const requestSysex = [0xf0, 0x74, 0x6f, 0x71, REQUEST_DATA, 0xf7]
    const outputForSend = midiOutput
    setTimeout(() => {
      if (session !== sysexSessionRef.current) return
      if (!outputForSend || outputForSend.state !== 'connected') return
      try {
        outputForSend.send(requestSysex)
        receiveProgressRef.current.open()
        console.log(
          'Sent data request upon connection:',
          requestSysex.map((b) => '0x' + b.toString(16).toUpperCase().padStart(2, '0'))
        )
      } catch (error) {
        console.error('Failed to send data request:', error)
      }
    }, 0)

    return () => {
      sysexSessionRef.current++
      receiveProgressRef.current.close()
      try {
        if (foundInput) foundInput.onmidimessage = null
      } catch {
        /* ignore */
      }
    }
  }, [midiOutput, isDeviceOnline, deviceDataSyncKey, customMidiInputId])

  useEffect(() => {
    if (!isDeviceOnline) setMidiInput(null)
  }, [isDeviceOnline])

  const setGreenPedal = (led) => {
    setActiveGreen(led)
  }

  const onPedalPress = (pedal) => setPressedPedal(pedal)
  const onPedalRelease = () => setPressedPedal(null)

  const handleGreenPedalClick = (pedal) => {
    if (warnIfDisconnected()) return
    setGreenPedal(pedal)
    openPedalInfo(pedal)
  }

  const sendSaveDataPayloadInChunks = useCallback(
    async (payloadData, { onComplete } = {}) => {
      if (!midiOutput) return false
      if (payloadData.length !== SAVE_DATA_PAYLOAD_LENGTH) {
        console.error('SAVE_DATA payload length:', payloadData.length, 'expected', SAVE_DATA_PAYLOAD_LENGTH)
        return false
      }
      const session = ++saveDataSendSessionRef.current
      for (let i = 0; i < SAVE_DATA_CHUNK_COUNT; i++) {
        if (session !== saveDataSendSessionRef.current) return false
        if (!midiOutput || midiOutput.state !== 'connected') return false
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, SAVE_DATA_CHUNK_INTERVAL_MS))
        }
        if (session !== saveDataSendSessionRef.current) return false
        if (!midiOutput || midiOutput.state !== 'connected') return false
        try {
          const chunk = buildSaveDataChunkSysex(payloadData, i)
          sendSysexRequest(midiOutput, chunk)
          setSendProgressSent(i + 1)
        } catch (error) {
          console.error('Error sending SAVE_DATA chunk', i, error)
          return false
        }
      }
      console.log('SAVE_DATA Sysex (chunked) sent to SuperFoot MIDI successfully!')
      onComplete?.()
      return true
    },
    [midiOutput]
  )

  const onProgramButtonClick = () => {
    if (warnIfDisconnected()) return
    setProgramConfirmOpen(true)
  }

  const onFactoryButtonClick = () => {
    if (warnIfDisconnected()) return
    setFactoryConfirmOpen(true)
  }

  const handleProgramConfirm = () => {
    setProgramConfirmOpen(false)
    setReceiveProgressOpen(false)
    if (warnIfDisconnected()) return
    const banksFlat = Array.from(banksData)
    const presetsFlat = presetsData.flat(2)
    const expressionFlat = Array.from(expressionData)
    const payloadData = [...banksFlat, ...presetsFlat, ...expressionFlat]
    if (payloadData.length !== SAVE_DATA_PAYLOAD_LENGTH) {
      console.error('SAVE_DATA payload length:', payloadData.length, 'expected', SAVE_DATA_PAYLOAD_LENGTH)
      return
    }
    setSendProgressTitleKey('progress.titleSendingProgram')
    setSendProgressSent(0)
    setSendProgressOpen(true)
    void sendSaveDataPayloadInChunks(payloadData, {
      onComplete: () => {
        setSendProgressOpen(false)
        setSendSuccessOpen(true)
      },
    }).then((ok) => {
      if (!ok) setSendProgressOpen(false)
    })
  }

  const handleFactoryConfirm = () => {
    setFactoryConfirmOpen(false)
    setReceiveProgressOpen(false)
    if (warnIfDisconnected()) return
    const factoryBanksFlat = [...BANK_TYPES]
    const factoryPresetsFlat = FACTORY_SETTINGS.flat(2)
    const factoryExpressionFlat = [...EXPRESSION_SETTINGS]
    const payloadData = [...factoryBanksFlat, ...factoryPresetsFlat, ...factoryExpressionFlat]
    if (payloadData.length !== SAVE_DATA_PAYLOAD_LENGTH) {
      console.error('SAVE_DATA payload length:', payloadData.length, 'expected', SAVE_DATA_PAYLOAD_LENGTH)
      return
    }
    setSendProgressTitleKey('progress.titleSendingFactory')
    setSendProgressSent(0)
    setSendProgressOpen(true)
    void sendSaveDataPayloadInChunks(payloadData, {
      onComplete: () => {
        setSendProgressOpen(false)
        setSendSuccessOpen(true)
      },
    }).then((ok) => {
      if (!ok) setSendProgressOpen(false)
    })
  }

  const openPedalInfo = (pedal) => {
    setSelectedPedalInfo({
      pedal,
      bank: counter + 1,
      type: bankTypes[counter],
    })
    setPedalInfoOpen(true)
  }

  const nextCounter = () => {
    setCounter((value) => (value + 1) % 10)
    setActiveGreen(null)
  }
  const prevCounter = () => {
    setCounter((value) => (value + 9) % 10)
    setActiveGreen(null)
  }

  const onUpDownStart = (e) => {
    if (e && e.cancelable) e.preventDefault()
    if (warnIfDisconnected()) return
    setUpPressed(true)
    onPedalPress('Up')
    nextCounter()
  }

  const onUpDownEnd = (e) => {
    if (e && e.cancelable) e.preventDefault()
    setUpPressed(false)
    onPedalRelease()
  }

  const onDownDownStart = (e) => {
    if (e && e.cancelable) e.preventDefault()
    if (warnIfDisconnected()) return
    setDownPressed(true)
    onPedalPress('Dwn')
    prevCounter()
  }

  const onDownDownEnd = (e) => {
    if (e && e.cancelable) e.preventDefault()
    setDownPressed(false)
    onPedalRelease()
  }

  const currentBlue = counter + 1 // 0 => led1, 9 => led10

  if (isMobile && !isLandscape) {
    return (
      <div className="rotate-warning">
        <img src={logowhite} className="rotate-warning-logo" alt="SuperFootMIDI" />
        <h2 className="rotate-warning-text">Por favor gire su teléfono para poder visualizar bien la app</h2>
        <div className="rotate-phone-icon"></div>
      </div>
    )
  }

  return (
    <div className={`main-container ${(isMobile && isLandscape) ? 'mobile-mode' : ''}`}>
      <div className='header'>
        
        <div className='header-logo'>
          <img src={logo} className='logo-image' />
        </div>

        <div className='header-right'>
          <div className='device-status'>
            <img
              src={isDeviceOnline ? ledVerde : ledRojo}
              alt={isDeviceOnline ? 'LED online' : 'LED offline'}
              className='status-led'
            />
            <span className='status-text'>{isDeviceOnline ? t('interface.online') : t('interface.offline')}</span>
          </div>
          <button className='language-button' onClick={toggleLanguage}>
            {language === 'en' ? 'EN / ES' : 'ES / EN'}
          </button>
          <div className='buttons-container'>
            <button
              className='bank-button'
              onClick={() => {
                if (warnIfDisconnected()) return
                setIsBankTypeOpen(true)
              }}
            >
              {t('interface.setBanks')}
            </button>
            <button
              className='bank-button'
              onClick={() => {
                if (warnIfDisconnected()) return
                setIsExpressionOpen(true)
              }}
            >
              {t('interface.expression')}
            </button>
            <button className='bank-button' onClick={onProgramButtonClick}>
              {t('interface.program')}
            </button>
            <button className='bank-button' onClick={onFactoryButtonClick}>
              {t('interface.factory')}
            </button>
            <button className='bank-button' onClick={() => setIsMidiMonitorOpen(true)}>
              {t('interface.midiMonitor')}
            </button>
          </div>
        </div>
      </div>

      <div id='superfoot-img-container'>
        {Array.from({ length: 10 }, (_, index) => {
          const ledId = `led${index + 1}`
          const isActive = currentBlue === index + 1
          return (
            <div
              key={ledId}
              id={ledId}
              className={`led-azul ${isActive ? 'led-visible' : 'led-hidden'}`}>
            </div>
          )
        })}

        {greenPedals.map((letter) => {
          const ledId = `led${letter}`
          const isActive = activeGreen === letter
          return (
            <div
              key={ledId}
              id={ledId}
              className={`led-verde ${isActive ? 'led-visible' : 'led-hidden'}`}
            />
          )
        })}

        <div
          id='ledUp'
          className={`led-rojo ${upPressed ? 'led-visible' : 'led-hidden'}`}
        />
        <div
          id='ledDwn'
          className={`led-rojo ${downPressed ? 'led-visible' : 'led-hidden'}`}
        />

        <div
          className={`pedals-top ${pressedPedal === 'A' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalA'
          onClick={() => handleGreenPedalClick('A')}
          onMouseDown={() => {
            if (warnIfDisconnected()) return
            onPedalPress('A')
          }}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => {
            if (warnIfDisconnected()) return
            onPedalPress('A')
          }}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-top ${pressedPedal === 'B' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalB'
          onClick={() => handleGreenPedalClick('B')}
          onMouseDown={() => {
            if (warnIfDisconnected()) return
            onPedalPress('B')
          }}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => {
            if (warnIfDisconnected()) return
            onPedalPress('B')
          }}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-top ${pressedPedal === 'C' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalC'
          onClick={() => handleGreenPedalClick('C')}
          onMouseDown={() => {
            if (warnIfDisconnected()) return
            onPedalPress('C')
          }}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => {
            if (warnIfDisconnected()) return
            onPedalPress('C')
          }}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-top ${pressedPedal === 'D' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalD'
          onClick={() => handleGreenPedalClick('D')}
          onMouseDown={() => {
            if (warnIfDisconnected()) return
            onPedalPress('D')
          }}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => {
            if (warnIfDisconnected()) return
            onPedalPress('D')
          }}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'E' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalE'
          onClick={() => handleGreenPedalClick('E')}
          onMouseDown={() => {
            if (warnIfDisconnected()) return
            onPedalPress('E')
          }}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => {
            if (warnIfDisconnected()) return
            onPedalPress('E')
          }}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'F' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalF'
          onClick={() => handleGreenPedalClick('F')}
          onMouseDown={() => {
            if (warnIfDisconnected()) return
            onPedalPress('F')
          }}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => {
            if (warnIfDisconnected()) return
            onPedalPress('F')
          }}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'G' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalG'
          onClick={() => handleGreenPedalClick('G')}
          onMouseDown={() => {
            if (warnIfDisconnected()) return
            onPedalPress('G')
          }}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => {
            if (warnIfDisconnected()) return
            onPedalPress('G')
          }}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'H' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalH'
          onClick={() => handleGreenPedalClick('H')}
          onMouseDown={() => {
            if (warnIfDisconnected()) return
            onPedalPress('H')
          }}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => {
            if (warnIfDisconnected()) return
            onPedalPress('H')
          }}
          onTouchEnd={onPedalRelease}
        />

        <div
          className={`pedals-top ${pressedPedal === 'Up' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalUp'
          onMouseDown={onUpDownStart}
          onMouseUp={onUpDownEnd}
          onMouseLeave={onUpDownEnd}
          onTouchStart={onUpDownStart}
          onTouchEnd={onUpDownEnd}
        />

        <div
          className={`pedals-bottom ${pressedPedal === 'Dwn' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalDwn'
          onMouseDown={onDownDownStart}
          onMouseUp={onDownDownEnd}
          onMouseLeave={onDownDownEnd}
          onTouchStart={onDownDownStart}
          onTouchEnd={onDownDownEnd}
        />
      </div>

      <PedalTypePopup
        key={selectedPedalInfo ? `${selectedPedalInfo.pedal}-${selectedPedalInfo.bank}` : 'none'}
        isOpen={pedalInfoOpen}
        onClose={() => setPedalInfoOpen(false)}
        pedal={selectedPedalInfo?.pedal}
        bank={selectedPedalInfo?.bank}
        type={selectedPedalInfo?.type}
        midiOutput={midiOutput}
      />

      <BankType
        isOpen={isBankTypeOpen}
        onClose={() => setIsBankTypeOpen(false)}
        bankTypes={bankTypes}
        setBankTypes={setBankTypes}
      />

      <ExpressionPopup
        isOpen={isExpressionOpen}
        onClose={() => setIsExpressionOpen(false)}
        midiOutput={midiOutput}
      />

      <DeviceSelectionPopup
        isOpen={disconnectWarningOpen}
        midiAccess={midiAccessRef.current}
        onConnect={(inputId, outputId) => {
          setCustomMidiInputId(inputId)
          setCustomMidiOutputId(outputId)
          setDisconnectWarningOpen(false)
          if (midiAccessRef.current) {
             const output = midiAccessRef.current.outputs.get(outputId)
             const input = midiAccessRef.current.inputs.get(inputId)
             const online = output?.state === 'connected' && input?.state === 'connected'
             setIsDeviceOnline(online)
             setMidiOutput(output || null)
          }
        }}
        onCancel={() => setDisconnectWarningOpen(false)}
      />

      <ConfirmDeviceWritePopup
        isOpen={programConfirmOpen}
        onCancel={() => setProgramConfirmOpen(false)}
        onConfirm={handleProgramConfirm}
        title={t("confirm.program.title")}
        acknowledgeLabel={t("confirm.ack")}
      >
        <p dangerouslySetInnerHTML={{ __html: t("confirm.program.p1") }}></p>
        <p dangerouslySetInnerHTML={{ __html: t("confirm.program.p2") }}></p>
      </ConfirmDeviceWritePopup>

      <ConfirmDeviceWritePopup
        isOpen={factoryConfirmOpen}
        onCancel={() => setFactoryConfirmOpen(false)}
        onConfirm={handleFactoryConfirm}
        title={t("confirm.factory.title")}
        acknowledgeLabel={t("confirm.ack")}
      >
        <p dangerouslySetInnerHTML={{ __html: t("confirm.factory.p1") }}></p>
        <p dangerouslySetInnerHTML={{ __html: t("confirm.factory.p2") }}></p>
      </ConfirmDeviceWritePopup>

      <SendProgressPopup
        isOpen={sendProgressOpen || receiveProgressOpen}
        title={
          sendProgressOpen ? t(sendProgressTitleKey) : t('progress.titleLoading')
        }
        sentChunks={sendProgressOpen ? sendProgressSent : receiveProgressCount}
        totalChunks={SAVE_DATA_CHUNK_COUNT}
        variant={sendProgressOpen ? 'send' : 'receive'}
      />

      <SendSuccessPopup isOpen={sendSuccessOpen} onAccept={() => setSendSuccessOpen(false)} />

      <MidiMonitor
        isOpen={isMidiMonitorOpen}
        onClose={() => setIsMidiMonitorOpen(false)}
        midiInput={midiInput}
      />
    </div>
  )
}


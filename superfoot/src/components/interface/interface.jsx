import { useState, useEffect, useCallback, useRef } from 'react'
import './interface.css'
import './leds.css'
import './pedals.css'
import { BankType } from '../banktype.jsx'
import { PedalTypePopup } from '../pedaltypepopup.jsx'
import { DeviceDisconnectedPopup } from '../DeviceDisconnectedPopup.jsx'
import { ConfirmDeviceWritePopup } from '../ConfirmDeviceWritePopup.jsx'
import { SendSuccessPopup } from '../SendSuccessPopup.jsx'
import { banksData, presetsData } from '../../backend/datatransfer'
import logo from '../../assets/logo.png'
import ledRojo from '../../assets/ledRojo.png'
import ledVerde from '../../assets/ledVerde.png'
import { SAVE_DATA, REQUEST_DATA } from '../midiUtils.js'
import { BANK_TYPES, FACTORY_SETTINGS } from '../../data/factory.js'



const USE_FACTORY_DATA = false // Change to true to use factory.js data instead of incoming SysEx
const greenPedals = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const clearSuperFootInputListeners = (midiAccess) => {
  if (!midiAccess) return
  try {
    for (const input of midiAccess.inputs.values()) {
      if (!input.name || !input.name.toLowerCase().includes('superfoot midi')) continue
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
  const [activeGreen, setActiveGreen] = useState(null)
  const [counter, setCounter] = useState(0)
  const [upPressed, setUpPressed] = useState(false)
  const [downPressed, setDownPressed] = useState(false)
  const [pressedPedal, setPressedPedal] = useState(null)
  const [isBankTypeOpen, setIsBankTypeOpen] = useState(false)

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
  const initialDisconnectShownRef = useRef(false)

  const [pedalInfoOpen, setPedalInfoOpen] = useState(false)
  const [selectedPedalInfo, setSelectedPedalInfo] = useState(null)
  const [midiOutput, setMidiOutput] = useState(null)

  const midiAccessRef = useRef(null)
  const sysexSessionRef = useRef(0)

  const getSuperFootMidiOutput = (midiAccess) => {
    for (const output of midiAccess.outputs.values()) {
      if (!output.name || !output.name.toLowerCase().includes('superfoot midi')) continue
      if (output.state !== 'connected') continue
      return output
    }
    return null
  }

  const isSuperFootMidiPresent = (midiAccess) => {
    for (const input of midiAccess.inputs.values()) {
      if (!input.name || !input.name.toLowerCase().includes('superfoot midi')) continue
      if (input.state === 'connected') return true
    }
    for (const output of midiAccess.outputs.values()) {
      if (!output.name || !output.name.toLowerCase().includes('superfoot midi')) continue
      if (output.state === 'connected') return true
    }
    return false
  }

  const scanMidiDevices = useCallback((midiAccess) => {
    const output = getSuperFootMidiOutput(midiAccess)
    const found = isSuperFootMidiPresent(midiAccess)
    const online = !!found
    if (!output) {
      clearSuperFootInputListeners(midiAccess)
    }
    setIsDeviceOnline((prev) => (prev === online ? prev : online))
    setMidiOutput((prev) => (prev === output ? prev : output))
  }, [])

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
    let midiInput = null

    for (const input of midiAccess.inputs.values()) {
      if (!input.name || !input.name.toLowerCase().includes('superfoot midi')) continue
      if (input.state !== 'connected') continue
      midiInput = input
      input.onmidimessage = (event) => {
        if (session !== sysexSessionRef.current) return
        const data = event.data
        if (
          data.length === 576 &&
          data[0] === 0xf0 &&
          data[1] === 0x74 &&
          data[2] === 0x6f &&
          data[3] === 0x71
        ) {
          if (!USE_FACTORY_DATA) {
            let index = 5
            for (let i = 0; i < 10; i++) banksData[i] = data[index++]

            for (let b = 0; b < 10; b++) {
              for (let p = 0; p < 8; p++) {
                for (let d = 0; d < 7; d++) {
                  presetsData[b][p][d] = data[index++]
                }
              }
            }

            setBankTypes(Array.from(banksData).slice(0, 10).map((code) => bankTypeName(code)))
            console.log('Sysex payload loaded correctly into banksData and presetsData.')
          } else {
            console.log('Received Sysex but skipped parsing because USE_FACTORY_DATA is true. Using factory logic.')
          }
        }
      }
      break
    }

    const requestSysex = [0xf0, 0x74, 0x6f, 0x71, REQUEST_DATA, 0xf7]
    const outputForSend = midiOutput
    setTimeout(() => {
      if (session !== sysexSessionRef.current) return
      if (!outputForSend || outputForSend.state !== 'connected') return
      try {
        outputForSend.send(requestSysex)
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
      try {
        if (midiInput) midiInput.onmidimessage = null
      } catch {
        /* ignore */
      }
    }
  }, [midiOutput, isDeviceOnline, deviceDataSyncKey])

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

  const sendProgramSysexToDevice = useCallback(() => {
    if (!midiOutput) return false
    const banksFlat = Array.from(banksData)
    const presetsFlat = presetsData.flat(2)
    const programRequest = [
      0xf0, 0x74, 0x6f, 0x71, SAVE_DATA,
      ...banksFlat,
      ...presetsFlat,
      0xf7,
    ]
    try {
      midiOutput.send(programRequest)
      console.log('Program Sysex sent to SuperFoot MIDI successfully!')
      console.log('Payload array (dec):', programRequest)
      const requestHex = programRequest.map((byte) =>
        `0x${Number(byte).toString(16).toUpperCase().padStart(2, '0')}`
      )
      console.log('Payload array (hex):', requestHex)
      return true
    } catch (error) {
      console.error('Error sending Program Sysex:', error)
      return false
    }
  }, [midiOutput])

  const sendFactorySysexToDevice = useCallback(() => {
    if (!midiOutput) return false
    const factoryBanksFlat = [...BANK_TYPES]
    const factoryPresetsFlat = FACTORY_SETTINGS.flat(2)
    const factoryProgramRequest = [
      0xf0, 0x74, 0x6f, 0x71, SAVE_DATA,
      ...factoryBanksFlat,
      ...factoryPresetsFlat,
      0xf7,
    ]
    try {
      midiOutput.send(factoryProgramRequest)
      console.log('FACTORY RESET Sysex sent to SuperFoot MIDI successfully!')
      console.log('Payload array (dec):', factoryProgramRequest)
      const requestHex = factoryProgramRequest.map((byte) =>
        `0x${Number(byte).toString(16).toUpperCase().padStart(2, '0')}`
      )
      console.log('Payload array (hex):', requestHex)
      return true
    } catch (error) {
      console.error('Error sending Factory Reset Sysex:', error)
      return false
    }
  }, [midiOutput])

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
    if (warnIfDisconnected()) return
    if (sendProgramSysexToDevice()) setSendSuccessOpen(true)
  }

  const handleFactoryConfirm = () => {
    setFactoryConfirmOpen(false)
    if (warnIfDisconnected()) return
    if (sendFactorySysexToDevice()) setSendSuccessOpen(true)
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

  const onUpDownStart = () => {
    if (warnIfDisconnected()) return
    setUpPressed(true)
    onPedalPress('Up')
    nextCounter()
  }

  const onUpDownEnd = () => {
    setUpPressed(false)
    onPedalRelease()
  }

  const onDownDownStart = () => {
    if (warnIfDisconnected()) return
    setDownPressed(true)
    onPedalPress('Dwn')
    prevCounter()
  }

  const onDownDownEnd = () => {
    setDownPressed(false)
    onPedalRelease()
  }

  const currentBlue = counter + 1 // 0 => led1, 9 => led10

  return (
    <div className='main-container'>
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
            <span className='status-text'>{isDeviceOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div className='buttons-container'>
            <button
              className='bank-button'
              onClick={() => {
                if (warnIfDisconnected()) return
                setIsBankTypeOpen(true)
              }}
            >
              Set Banks
            </button>
            <button className='bank-button' onClick={onProgramButtonClick}>
              Program
            </button>
            <button className='bank-button' onClick={onFactoryButtonClick}>
              Factory
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

      <DeviceDisconnectedPopup
        isOpen={disconnectWarningOpen}
        onAccept={() => setDisconnectWarningOpen(false)}
      />

      <ConfirmDeviceWritePopup
        isOpen={programConfirmOpen}
        onCancel={() => setProgramConfirmOpen(false)}
        onConfirm={handleProgramConfirm}
        title='Confirmar envío al dispositivo'
        acknowledgeLabel='Entiendo que con esto modificaré los presets actualmente presentes en mi dispositivo'
      >
        <p>
          Si continúa, se enviarán al dispositivo <strong>SuperFoot MIDI</strong> todos los cambios que
          haya realizado en esta aplicación web.
        </p>
        <p>
          Eso <strong>reemplazará en el dispositivo</strong> los bancos y presets según lo que tenga
          ahora en la app: todo lo que haya modificado aquí sustituirá la configuración correspondiente
          en el hardware.
        </p>
      </ConfirmDeviceWritePopup>

      <ConfirmDeviceWritePopup
        isOpen={factoryConfirmOpen}
        onCancel={() => setFactoryConfirmOpen(false)}
        onConfirm={handleFactoryConfirm}
        title='Restaurar ajustes de fábrica'
        acknowledgeLabel='Entiendo que con esto modificaré los presets actualmente presentes en mi dispositivo'
      >
        <p>
          Si continúa, se enviará al dispositivo <strong>SuperFoot MIDI</strong> la configuración de{' '}
          <strong>fábrica</strong>.
        </p>
        <p>
          <strong>Todos los bancos y todos los presets</strong> volverán a los valores predeterminados de
          fábrica, reemplazando por completo la configuración que esté guardada actualmente en el
          dispositivo.
        </p>
      </ConfirmDeviceWritePopup>

      <SendSuccessPopup isOpen={sendSuccessOpen} onAccept={() => setSendSuccessOpen(false)} />
    </div>
  )
}


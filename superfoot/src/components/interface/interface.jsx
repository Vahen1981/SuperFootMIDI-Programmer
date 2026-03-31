import { useState, useEffect, useCallback } from 'react'
import './interface.css'
import './leds.css'
import './pedals.css'
import { BankType } from '../banktype.jsx'
import { PedalTypePopup } from '../pedaltypepopup.jsx'
import { banksData, presetsData } from '../../backend/datatransfer'
import logo from '../../assets/logo.png'
import ledRojo from '../../assets/ledRojo.png'
import ledVerde from '../../assets/ledVerde.png'

const REQUEST_DATA = 0x00
const greenPedals = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

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

  const [pedalInfoOpen, setPedalInfoOpen] = useState(false)
  const [selectedPedalInfo, setSelectedPedalInfo] = useState(null)
  const [midiOutput, setMidiOutput] = useState(null)

  const getSuperFootMidiOutput = (midiAccess) => {
    for (const output of midiAccess.outputs.values()) {
      if (output.name && output.name.toLowerCase().includes('superfoot midi')) return output
    }
    return null
  }

  const isSuperFootMidiPresent = (midiAccess) => {
    for (const input of midiAccess.inputs.values()) {
      if (input.name && input.name.toLowerCase().includes('superfoot midi')) return true
    }
    for (const output of midiAccess.outputs.values()) {
      if (output.name && output.name.toLowerCase().includes('superfoot midi')) return true
    }
    return false
  }

  const scanMidiDevices = useCallback((midiAccess) => {
    const output = getSuperFootMidiOutput(midiAccess)
    const found = isSuperFootMidiPresent(midiAccess)
    setIsDeviceOnline(!!found)
    setMidiOutput(output)
  }, [])

  useEffect(() => {
    let midiAccessRef = null

    const updateDeviceState = () => {
      if (!midiAccessRef) return
      scanMidiDevices(midiAccessRef)
    }

    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({ sysex: true })
        .then((midiAccess) => {
          midiAccessRef = midiAccess
          scanMidiDevices(midiAccess)
          console.log('Presets data loaded:', presetsData)

          midiAccess.onstatechange = () => updateDeviceState()
        })
        .catch((error) => {
          console.error('MIDI access error:', error)
        })
    } else {
      console.warn('Web MIDI API is not supported in this browser.')
    }

    return () => {
      if (midiAccessRef) {
        midiAccessRef.onstatechange = null
      }
    }
  }, [scanMidiDevices])

  const setGreenPedal = (led) => {
    setActiveGreen(led)
  }

  const onPedalPress = (pedal) => setPressedPedal(pedal)
  const onPedalRelease = () => setPressedPedal(null)

  const buildPedalRequest = (pedal) => {
    const pedalIndex = greenPedals.indexOf(pedal)
    if (pedalIndex === -1) return null

    const requestBytes = [
      0xF0,
      0x74,
      0x6F,
      0x71,
      REQUEST_DATA,
      counter,
      pedalIndex,
      0xF7,
    ]

    const requestHex = requestBytes.map((byte) => `0x${byte.toString(16).toUpperCase().padStart(2, '0')}`)
    console.log('Pedal press request (hex):', requestHex)

    if (midiOutput) {
      try {
        midiOutput.send(requestBytes)
        console.log('Sysex sent to SuperFoot MIDI:', requestHex)
      } catch (error) {
        console.error('Error sending Sysex message:', error)
      }
    } else {
      console.warn('No SuperFoot MIDI output device available - message not sent')
    }

    return requestBytes
  }

  const handleGreenPedalClick = (pedal) => {
    setGreenPedal(pedal)
    openPedalInfo(pedal)
    buildPedalRequest(pedal)
  }

  const handleProgramClick = () => {
    console.log('Program button clicked')
    if (!midiOutput) {
      console.warn('No SuperFoot MIDI output device available for Program action')
      return
    }

    // Ejemplo de Sysex de Program (ajusta bytes según tu protocolo plataforma)
    const programRequest = [0xF0, 0x74, 0x6F, 0x71, REQUEST_DATA, counter, 0x01, 0xF7]

    try {
      midiOutput.send(programRequest)
      console.log('Program Sysex sent to SuperFoot MIDI:', programRequest)
    } catch (error) {
      console.error('Error sending Program Sysex:', error)
    }
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
    setUpPressed(true)
    onPedalPress('Up')
    nextCounter()
  }

  const onUpDownEnd = () => {
    setUpPressed(false)
    onPedalRelease()
  }

  const onDownDownStart = () => {
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
          <span className='status-text'>{isDeviceOnline ? 'Device online' : 'Device offline'}</span>
        </div>
        <button className='bank-button' onClick={() => setIsBankTypeOpen(true)}>Set Banks</button>
        <button className='bank-button' onClick={() => handleProgramClick()}>Program</button>
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
          onMouseDown={() => onPedalPress('A')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('A')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-top ${pressedPedal === 'B' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalB'
          onClick={() => handleGreenPedalClick('B')}
          onMouseDown={() => onPedalPress('B')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('B')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-top ${pressedPedal === 'C' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalC'
          onClick={() => handleGreenPedalClick('C')}
          onMouseDown={() => onPedalPress('C')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('C')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-top ${pressedPedal === 'D' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalD'
          onClick={() => handleGreenPedalClick('D')}
          onMouseDown={() => onPedalPress('D')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('D')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'E' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalE'
          onClick={() => handleGreenPedalClick('E')}
          onMouseDown={() => onPedalPress('E')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('E')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'F' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalF'
          onClick={() => handleGreenPedalClick('F')}
          onMouseDown={() => onPedalPress('F')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('F')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'G' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalG'
          onClick={() => handleGreenPedalClick('G')}
          onMouseDown={() => onPedalPress('G')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('G')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'H' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalH'
          onClick={() => handleGreenPedalClick('H')}
          onMouseDown={() => onPedalPress('H')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('H')}
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
    </div>
  )
}


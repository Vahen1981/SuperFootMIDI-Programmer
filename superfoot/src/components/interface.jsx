import { useState } from 'react'
import './interface.css'
import './leds.css'
import './pedals.css'
import { BankType } from './banktype.jsx'

const greenPedals = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export const Interface = () => {
  const [activeGreen, setActiveGreen] = useState(null)
  const [counter, setCounter] = useState(0)
  const [upPressed, setUpPressed] = useState(false)
  const [downPressed, setDownPressed] = useState(false)
  const [pressedPedal, setPressedPedal] = useState(null)
  const [isBankTypeOpen, setIsBankTypeOpen] = useState(false)
  const [bankTypes, setBankTypes] = useState(Array(10).fill('CC Latch (On /Off)'))

  const setGreenPedal = (led) => {
    setActiveGreen(led)
  }

  const onPedalPress = (pedal) => setPressedPedal(pedal)
  const onPedalRelease = () => setPressedPedal(null)

  const nextCounter = () => setCounter((value) => (value + 1) % 10)
  const prevCounter = () => setCounter((value) => (value + 9) % 10)

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
        <button onClick={() => setIsBankTypeOpen(true)}>Bank Types</button>
        Counter: {counter}
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
          onClick={() => setGreenPedal('A')}
          onMouseDown={() => onPedalPress('A')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('A')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-top ${pressedPedal === 'B' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalB'
          onClick={() => setGreenPedal('B')}
          onMouseDown={() => onPedalPress('B')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('B')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-top ${pressedPedal === 'C' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalC'
          onClick={() => setGreenPedal('C')}
          onMouseDown={() => onPedalPress('C')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('C')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-top ${pressedPedal === 'D' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalD'
          onClick={() => setGreenPedal('D')}
          onMouseDown={() => onPedalPress('D')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('D')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'E' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalE'
          onClick={() => setGreenPedal('E')}
          onMouseDown={() => onPedalPress('E')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('E')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'F' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalF'
          onClick={() => setGreenPedal('F')}
          onMouseDown={() => onPedalPress('F')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('F')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'G' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalG'
          onClick={() => setGreenPedal('G')}
          onMouseDown={() => onPedalPress('G')}
          onMouseUp={onPedalRelease}
          onMouseLeave={onPedalRelease}
          onTouchStart={() => onPedalPress('G')}
          onTouchEnd={onPedalRelease}
        />
        <div
          className={`pedals-bottom ${pressedPedal === 'H' ? 'pedal-visible' : 'pedal-hidden'}`}
          id='pedalH'
          onClick={() => setGreenPedal('H')}
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

      <BankType
        isOpen={isBankTypeOpen}
        onClose={() => setIsBankTypeOpen(false)}
        bankTypes={bankTypes}
        setBankTypes={setBankTypes}
      />
    </div>
  )
}


import { Interface } from './components/interface/interface.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import './App.css'

function App() {

  return (
    <LanguageProvider>
      <Interface />
    </LanguageProvider>
  )
}

export default App

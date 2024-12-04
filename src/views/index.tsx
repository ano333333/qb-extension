import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../tailwind.css'
import IndexApp from './IndexApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IndexApp/>
  </StrictMode>,
)

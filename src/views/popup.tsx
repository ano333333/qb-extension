import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../tailwind.css'
import PopupApp from './PopupApp.tsx'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
    <PopupApp />
    </StrictMode>,
  )
}

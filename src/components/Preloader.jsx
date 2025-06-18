// src/components/Preloader.jsx
import { useEffect, useState } from 'react'

export default function Preloader() {
  const [hide, setHide] = useState(false)

  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => setHide(true), 1000) // espera antes de ocultar
    }
    window.addEventListener('load', handleLoad)
    return () => window.removeEventListener('load', handleLoad)
  }, [])

  if (hide) return null

  return (
    <div
      id="preloader"
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999] animate-fade-out"
    >
      <img src="/img/logo.png" alt="E360 Logo" className="w-32 h-auto animate-pulse" />
    </div>
  )
}
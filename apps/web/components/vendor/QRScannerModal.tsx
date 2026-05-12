'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera, CameraOff, KeyRound } from 'lucide-react'

type Props = {
  isOpen: boolean
  expectedOrderId: string
  onClose: () => void
  onConfirm: () => void
  onError: (msg: string) => void
}

export default function QRScannerModal({ isOpen, expectedOrderId, onClose, onConfirm, onError }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const confirmedRef = useRef(false)
  const [cameraFailed, setCameraFailed] = useState(false)
  const [manualCode, setManualCode] = useState('')

  useEffect(() => {
    if (!isOpen) return

    confirmedRef.current = false
    setCameraFailed(false)

    const id = 'qr-reader'
    const scanner = new Html5Qrcode(id)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (confirmedRef.current) return
          confirmedRef.current = true
          scanner.stop().catch(() => {})
          handleDecoded(decoded.trim())
        },
        () => {},
      )
      .catch(() => setCameraFailed(true))

    return () => {
      scanner.stop().catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  function handleDecoded(decoded: string) {
    if (decoded !== expectedOrderId) {
      onError('El código QR no corresponde a este pedido')
      onClose()
      return
    }
    onConfirm()
    onClose()
  }

  function handleManualSubmit() {
    if (!manualCode.trim()) return
    handleDecoded(manualCode.trim())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-vendor" />
            <h2 className="font-display font-bold text-text-primary text-base">
              Escanear código del estudiante
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-background">
            <X size={18} />
          </button>
        </div>

        {/* Camera scanner or fallback */}
        {cameraFailed ? (
          <div className="p-5 flex flex-col items-center gap-3">
            <CameraOff size={32} className="text-text-secondary" />
            <p className="text-sm font-body text-text-secondary text-center">
              No se pudo acceder a la cámara. Ingresa el código manualmente.
            </p>
          </div>
        ) : (
          <div id="qr-reader" className="w-full" />
        )}

        {/* Manual fallback */}
        <div className="px-4 pb-4 pt-2 border-t border-border">
          <p className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1">
            <KeyRound size={12} /> Ingresar código manualmente
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="ID del pedido"
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm font-body text-text-primary focus:outline-none focus:border-vendor"
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
            />
            <button
              onClick={handleManualSubmit}
              className="bg-vendor text-white px-4 py-2 rounded-xl text-sm font-display font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

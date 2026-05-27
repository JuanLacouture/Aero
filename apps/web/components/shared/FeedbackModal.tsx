'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

type FormErrors = { subject?: string; message?: string; general?: string }

export function FeedbackModal({ open, onClose }: Props) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  if (!open) return null

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!subject.trim()) errs.subject = 'Título requerido'
    else if (subject.trim().length > 255) errs.subject = 'Máximo 255 caracteres'
    if (!message.trim()) errs.message = 'Cuéntanos más'
    else if (message.trim().length > 2000) errs.message = 'Máximo 2000 caracteres'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleClose() {
    setSubject('')
    setMessage('')
    setErrors({})
    setDone(false)
    onClose()
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    setErrors({})

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(typeof err.error === 'string' ? err.error : 'Error al enviar')
      }

      setDone(true)
      setTimeout(() => handleClose(), 1500)
    } catch (e) {
      setErrors({ general: e instanceof Error ? e.message : 'Error al enviar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={handleClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        className="bg-white rounded-t-3xl p-5 pb-10 max-w-lg mx-auto w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-text-primary text-lg">Deja tu feedback</h2>
          <button onClick={handleClose} className="p-1.5 rounded-full bg-background">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle size={40} className="text-success" />
            <p className="font-display font-semibold text-text-primary">¡Gracias por tu feedback!</p>
            <p className="text-sm font-body text-text-secondary">Tu mensaje fue enviado con éxito.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Título del feedback *"
                maxLength={255}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-primary"
              />
              {errors.subject && <p className="text-error text-xs mt-1 font-body">{errors.subject}</p>}
            </div>

            <div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="De qué es el feedback: cuéntanos..."
                rows={5}
                maxLength={2000}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-primary resize-none"
              />
              <p className="text-right text-xs text-text-disabled mt-0.5">{message.length}/2000</p>
              {errors.message && <p className="text-error text-xs mt-1 font-body">{errors.message}</p>}
            </div>

            {errors.general && (
              <p className="text-error text-sm font-body">{errors.general}</p>
            )}

            <div className="flex gap-3 mt-1">
              <button
                onClick={handleClose}
                className="flex-1 border border-border text-text-secondary rounded-button py-3.5 font-display font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-primary text-white rounded-button py-3.5 font-display font-semibold text-sm disabled:opacity-60 flex items-center justify-center"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Enviar'
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

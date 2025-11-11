'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast, ToastContainer, ToastType } from '@/components/ui/toast'

interface ToastData {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, description?: string, duration?: number) => void
  success: (message: string, description?: string) => void
  error: (message: string, description?: string) => void
  info: (message: string, description?: string) => void
  warning: (message: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback(
    (type: ToastType, message: string, description?: string, duration: number = 5000) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: ToastData = { id, type, message, description, duration }
      setToasts((prev) => [...prev, newToast])
    },
    []
  )

  const success = useCallback(
    (message: string, description?: string) => showToast('success', message, description),
    [showToast]
  )

  const error = useCallback(
    (message: string, description?: string) => showToast('error', message, description, 7000),
    [showToast]
  )

  const info = useCallback(
    (message: string, description?: string) => showToast('info', message, description),
    [showToast]
  )

  const warning = useCallback(
    (message: string, description?: string) => showToast('warning', message, description),
    [showToast]
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

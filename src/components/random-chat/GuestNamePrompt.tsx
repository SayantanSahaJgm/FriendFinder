"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { getOrCreateGuestName, generateGuestName } from '@/utils/guestNames'

export default function GuestNamePrompt({ onSaved }: { onSaved?: (name: string) => void }) {
  const [name, setName] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const existing = localStorage.getItem('guestUsername')
      if (!existing) {
        // Generate a fun guest name
        const guestName = getOrCreateGuestName()
        setName(guestName)
        setVisible(true)
      }
    } catch (e) {
      // ignore storage access issues
      setVisible(false)
    }
  }, [])

  const save = () => {
    const trimmed = (name || '').trim()
    if (!trimmed) {
      toast.error('Please enter a name or generate a new one')
      return
    }

    try {
      localStorage.setItem('guestUsername', trimmed)
      // Keep random-chat anon name in sync for RandomChatContext
      try { localStorage.setItem('randomChatAnonName', trimmed) } catch (e) {}
      setVisible(false)
      toast.success(`Welcome, ${trimmed}!`)
      onSaved?.(trimmed)
    } catch (e) {
      console.error('Failed to save guest name', e)
      toast.error('Unable to save name locally')
    }
  }

  const regenerate = () => {
    const newName = generateGuestName()
    setName(newName)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Anonymous Name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Chat anonymously! We've generated a fun name for you, or customize it however you like.
            </p>
            <Input 
              value={name} 
              onChange={(e: any) => setName(e.target.value)} 
              placeholder="e.g. HappyPanda123"
              className="text-center text-lg font-semibold"
            />
            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={regenerate}>
                🎲 Generate New
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setVisible(false); toast('You can set a name anytime') }}>
                  Skip
                </Button>
                <Button onClick={save} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  Start Chatting
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

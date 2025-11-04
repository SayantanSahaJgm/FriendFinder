"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function GuestNamePrompt({ onSaved }: { onSaved?: (name: string) => void }) {
  const [name, setName] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const existing = localStorage.getItem('randomChatAnonName')
      if (!existing) {
        // show prompt to collect a friendly display name
        setVisible(true)
        // try to seed with a short id
        const seed = `Guest${Math.random().toString(36).substr(2,4)}`
        setName(seed)
      }
    } catch (e) {
      // ignore storage access issues
      setVisible(false)
    }
  }, [])

  const save = () => {
    const trimmed = (name || '').trim()
    if (!trimmed) {
      toast.error('Please enter a name or cancel')
      return
    }

    try {
      localStorage.setItem('randomChatAnonName', trimmed)
      setVisible(false)
      toast.success('Guest name saved')
      onSaved?.(trimmed)
    } catch (e) {
      console.error('Failed to save guest name', e)
      toast.error('Unable to save name locally')
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle>Choose a Guest Name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">You can chat anonymously — choose a temporary display name to show to strangers.</p>
            <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. SunnyCat" />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setVisible(false); toast('You can set a name later from settings') }}>Skip</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

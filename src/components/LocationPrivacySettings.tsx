"use client"

import { useEffect, useState } from 'react'

interface FriendItem {
  userId: string
  username: string
  profilePicture?: string | null
}

export default function LocationPrivacySettings({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locationSharing, setLocationSharing] = useState(true)
  const [friends, setFriends] = useState<FriendItem[]>([])
  const [visibleTo, setVisibleTo] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/settings/location')
        const data = await res.json()
        if (!mounted) return
        if (data?.success) {
          setLocationSharing(!!data.settings?.locationSharing)
          setFriends(data.friends || [])
          const mapState: Record<string, boolean> = {}
          ;(data.settings?.locationVisibleTo || []).forEach((id: string) => (mapState[id] = true))
          setVisibleTo(mapState)
        }
      } catch (err) {
        console.error('Failed to load settings', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const toggleFriend = (id: string) => {
    setVisibleTo(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const visibleIds = Object.keys(visibleTo).filter(k => visibleTo[k])
      const res = await fetch('/api/settings/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationSharing, locationVisibleTo: visibleIds }),
      })
      const data = await res.json()
      if (data?.success) {
        if (onSaved) onSaved()
        onClose()
      } else {
        console.error('Save failed', data)
      }
    } catch (err) {
      console.error('Error saving settings', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6 z-70">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Location Sharing</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Control who can see your live location.</p>

        {loading ? (
          <div className="py-6 text-center">Loading...</div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Share my location</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Turn this off to stop sharing your location with friends</p>
              </div>
              <label className="inline-flex items-center">
                <input type="checkbox" className="sr-only" checked={locationSharing} onChange={() => setLocationSharing(s => !s)} />
                <div className={`w-11 h-6 rounded-full ${locationSharing ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              </label>
            </div>

            <div>
              <p className="font-medium text-gray-900 dark:text-white">Allow specific friends</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">If empty, your location is visible to all friends (when sharing is on)</p>

              <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50 dark:bg-gray-700">
                {friends.length === 0 ? (
                  <p className="text-sm text-gray-500">You have no friends yet.</p>
                ) : (
                  friends.map(f => (
                    <label key={f.userId} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                      <input type="checkbox" checked={!!visibleTo[f.userId]} onChange={() => toggleFriend(f.userId)} />
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">{f.username}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

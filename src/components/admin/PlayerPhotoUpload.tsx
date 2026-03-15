'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  playerId: number
  playerSlug: string | null
  currentPhotoUrl: string | null
  playerName: string
  teamColor: string
}

export function PlayerPhotoUpload({ playerId, playerSlug, currentPhotoUrl, playerName, teamColor }: Props) {
  const supabase  = createClient()
  const router    = useRouter()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [preview,   setPreview]   = useState<string | null>(currentPhotoUrl)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true); setError(null); setSuccess(false)

    try {
      // Upload to Supabase Storage
      const ext      = file.name.split('.').pop()
      const filename = `${playerSlug ?? playerId}.${ext}`
      const path     = `players/${filename}`

      const { error: uploadErr } = await supabase.storage
        .from('player-photos')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadErr) throw uploadErr

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('player-photos')
        .getPublicUrl(path)

      // Save URL to player record
      const { error: updateErr } = await supabase
        .from('players')
        .update({ photo_url: publicUrl })
        .eq('id', playerId)

      if (updateErr) throw updateErr

      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
      setPreview(currentPhotoUrl)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Remove this photo?')) return
    setUploading(true)
    await supabase.from('players').update({ photo_url: null }).eq('id', playerId)
    setPreview(null)
    setUploading(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Photo preview */}
      <div
        onClick={() => fileRef.current?.click()}
        className="w-16 h-16 rounded-full overflow-hidden bg-rink-700 border-2 border-white/10 hover:border-ice/50 cursor-pointer transition-colors flex items-center justify-center relative group">
        {preview ? (
          <>
            <img src={preview} alt={playerName} className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] font-black text-white uppercase tracking-wider">Change</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[18px]" style={{ color: teamColor + '80' }}>+</span>
            <span className="text-[9px] text-dim uppercase tracking-wider">Photo</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-[9px] text-white animate-pulse">...</span>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {error   && <div className="text-[10px] text-red-400 text-center max-w-[80px]">{error}</div>}
      {success && <div className="text-[10px] text-green-400">Saved!</div>}

      {preview && !uploading && (
        <button onClick={handleRemove}
          className="text-[9px] text-dim hover:text-red-400 transition-colors uppercase tracking-wider">
          Remove
        </button>
      )}
    </div>
  )
}
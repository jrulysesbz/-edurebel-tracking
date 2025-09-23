// src/pages/check.tsx
import { useEffect, useState } from 'react'

type Health = { ok: boolean; urlOk: boolean; keyOk: boolean }
type DbCheck = { ok: boolean; rows?: number; sample?: any; error?: string }

export default function Check() {
  const [health, setHealth] = useState<Health | null>(null)
  const [db, setDb] = useState<DbCheck | null>(null)

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setHealth)
    fetch('/api/db-check').then(r => r.json()).then(setDb)
  }, [])

  return (
    <main style={{padding: 24, fontFamily: 'ui-sans-serif, system-ui'}}>
      <h1>Supabase Health</h1>
      <pre>{JSON.stringify(health, null, 2)}</pre>
      <h2>DB Check (students)</h2>
      <pre>{JSON.stringify(db, null, 2)}</pre>
    </main>
  )
}

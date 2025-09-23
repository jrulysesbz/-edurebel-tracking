'use client'
import { useEffect, useMemo, useState } from 'react'

type Student = {
  id: string
  first_name: string
  last_name: string
  class_id: string | null
  school_id: string | null
}
type Option = { id: string; name: string; school_id?: string | null }

type EditState = {
  [id: string]: {
    first_name: string
    last_name: string
    class_id: string | null
    school_id: string | null
    dirty: boolean
  }
}

export default function StudentsPage() {
  const [rows, setRows] = useState<Student[]>([])
  const [classes, setClasses] = useState<Option[]>([])
  const [schools, setSchools] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [schoolId, setSchoolId]   = useState('')
  const [classId, setClassId]     = useState('')

  const [editing, setEditing] = useState<EditState>({})

  const classNameById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of classes) m[c.id] = c.name
    return m
  }, [classes])

  async function loadAll() {
    setLoading(true); setErr(null)
    try {
      const [sRes, cRes, schRes] = await Promise.all([
        fetch('/api/students', { cache:'no-store' }),
        fetch('/api/classes',  { cache:'no-store' }),
        fetch('/api/schools',  { cache:'no-store' }),
      ])
      const sJ = await sRes.json()
      const cJ = await cRes.json()
      const schJ = await schRes.json()
      if (!sJ.ok) throw new Error(sJ.error || 'Failed to load students')
      if (!cJ.ok) throw new Error(cJ.error || 'Failed to load classes')
      if (!schJ.ok) throw new Error(schJ.error || 'Failed to load schools')
      setRows(sJ.rows || [])
      setClasses(cJ.rows || [])
      setSchools(schJ.rows || [])
      if (!schoolId && schJ.rows?.length) setSchoolId(schJ.rows[0].id)
      if (!classId && cJ.rows?.length) setClassId(cJ.rows[0].id)
    } catch (e:any) {
      setErr(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { loadAll() }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        class_id:   classId || null,
        school_id:  schoolId || null,
      }),
    })
    const j = await res.json()
    if (!j.ok) { setErr(j.error || 'Create failed'); return }
    setFirstName(''); setLastName('')
    await loadAll()
  }

  function startEdit(s: Student) {
    setEditing(prev => ({
      ...prev,
      [s.id]: {
        first_name: s.first_name,
        last_name: s.last_name,
        class_id: s.class_id,
        school_id: s.school_id,
        dirty: false
      }
    }))
  }
  function cancelEdit(id: string) {
    setEditing(prev => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }
  function changeField(id: string, field: keyof Omit<Student,'id'>, value: any) {
    setEditing(prev => ({
      ...prev,
      [id]: { ...(prev[id]!), [field]: value, dirty: true }
    }))
  }
  async function saveEdit(id: string) {
    const e = editing[id]
    if (!e) return
    setErr(null)
    const res = await fetch('/api/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...e }),
    })
    const j = await res.json()
    if (!j.ok) { setErr(j.error || 'Update failed'); return }
    cancelEdit(id)
    await loadAll()
  }
  async function onDelete(id: string) {
    setErr(null)
    const res = await fetch(`/api/students?id=${encodeURIComponent(id)}`, { method:'DELETE' })
    const j = await res.json()
    if (!j.ok) { setErr(j.error || 'Delete failed'); return }
    await loadAll()
  }

  return (
    <div style={{ padding: 16, maxWidth: 920, margin: '0 auto' }}>
      <h1>Students</h1>

      <form onSubmit={onCreate} style={{ display:'grid', gap:12, marginBottom:24 }}>
        <div style={{ display:'grid', gap:6 }}>
          <label>First name</label>
          <input value={firstName} onChange={e=>setFirstName(e.target.value)} required />
        </div>
        <div style={{ display:'grid', gap:6 }}>
          <label>Last name</label>
          <input value={lastName} onChange={e=>setLastName(e.target.value)} required />
        </div>
        <div style={{ display:'grid', gap:6 }}>
          <label>School</label>
          <select value={schoolId} onChange={e=>setSchoolId(e.target.value)}>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ display:'grid', gap:6 }}>
          <label>Class</label>
          <select value={classId} onChange={e=>setClassId(e.target.value)}>
            {classes
              .filter(c => !schoolId || c.school_id === schoolId)
              .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button type="submit">Add Student</button>
      </form>

      {loading && <div>Loading…</div>}
      {err && <div style={{ color:'crimson' }}>Error: {err}</div>}

      {!loading && !err && (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', borderBottom:'1px solid #ddd', padding:8 }}>First</th>
              <th style={{ textAlign:'left', borderBottom:'1px solid #ddd', padding:8 }}>Last</th>
              <th style={{ textAlign:'left', borderBottom:'1px solid #ddd', padding:8 }}>School</th>
              <th style={{ textAlign:'left', borderBottom:'1px solid #ddd', padding:8 }}>Class</th>
              <th style={{ textAlign:'left', borderBottom:'1px solid #ddd', padding:8 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const e = editing[r.id]
              const schOptions = schools
              const classOptions = classes.filter(c => !e?.school_id || c.school_id === e.school_id)
              return (
                <tr key={r.id}>
                  <td style={{ borderBottom:'1px solid #eee', padding:8 }}>
                    {e ? (
                      <input value={e.first_name} onChange={ev=>changeField(r.id,'first_name', ev.target.value)} />
                    ) : r.first_name}
                  </td>
                  <td style={{ borderBottom:'1px solid #eee', padding:8 }}>
                    {e ? (
                      <input value={e.last_name} onChange={ev=>changeField(r.id,'last_name', ev.target.value)} />
                    ) : r.last_name}
                  </td>
                  <td style={{ borderBottom:'1px solid #eee', padding:8 }}>
                    {e ? (
                      <select value={e.school_id ?? ''} onChange={ev=>changeField(r.id,'school_id', ev.target.value || null)}>
                        <option value="">—</option>
                        {schOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    ) : (schools.find(s => s.id === r.school_id)?.name || '—')}
                  </td>
                  <td style={{ borderBottom:'1px solid #eee', padding:8 }}>
                    {e ? (
                      <select value={e.class_id ?? ''} onChange={ev=>changeField(r.id,'class_id', ev.target.value || null)}>
                        <option value="">—</option>
                        {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    ) : (r.class_id ? (classNameById[r.class_id] || r.class_id) : '—')}
                  </td>
                  <td style={{ borderBottom:'1px solid #eee', padding:8, whiteSpace:'nowrap' }}>
                    {e ? (
                      <>
                        <button onClick={() => saveEdit(r.id)} disabled={!e.dirty}>Save</button>{' '}
                        <button onClick={() => cancelEdit(r.id)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(r)}>Edit</button>{' '}
                        <button onClick={() => onDelete(r.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

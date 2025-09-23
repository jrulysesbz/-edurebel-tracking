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

export default function StudentsPage() {
  const [rows, setRows] = useState<Student[]>([])
  const [classes, setClasses] = useState<Option[]>([])
  const [schools, setSchools] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // create form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [classId, setClassId] = useState('')

  // inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [eFirst, setEFirst] = useState('')
  const [eLast, setELast] = useState('')
  const [eSchool, setESchool] = useState('')
  const [eClass, setEClass] = useState('')
  const [saving, setSaving] = useState(false)

  const classNameById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of classes) m[c.id] = c.name
    return m
  }, [classes])

  async function loadAll() {
    setLoading(true); setErr(null)
    try {
      const [sRes, cRes, schRes] = await Promise.all([
        fetch('/api/students', { cache: 'no-store' }),
        fetch('/api/classes',  { cache: 'no-store' }),
        fetch('/api/schools',  { cache: 'no-store' }),
      ])
      const [sJ, cJ, schJ] = await Promise.all([sRes.json(), cRes.json(), schRes.json()])
      if (!sJ.ok) throw new Error(sJ.error || 'Failed to load students')
      if (!cJ.ok) throw new Error(cJ.error || 'Failed to load classes')
      if (!schJ.ok) throw new Error(schJ.error || 'Failed to load schools')
      setRows(sJ.rows || [])
      setClasses(cJ.rows || [])
      setSchools(schJ.rows || [])
      if (!schoolId && schJ.rows?.length) setSchoolId(schJ.rows[0].id)
      if (!classId && cJ.rows?.length) setClassId(cJ.rows[0].id)
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { loadAll() }, [])

  // ---------- CREATE ----------
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
    loadAll()
  }

  // ---------- DELETE ----------
  async function onDelete(id: string) {
    setErr(null)
    const res = await fetch(`/api/students?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const j = await res.json()
    if (!j.ok) { setErr(j.error || 'Delete failed'); return }
    if (editingId === id) cancelEdit()
    loadAll()
  }

  // ---------- EDIT ----------
  function startEdit(s: Student) {
    setEditingId(s.id)
    setEFirst(s.first_name || '')
    setELast(s.last_name || '')
    setESchool(s.school_id || '')
    setEClass(s.class_id || '')
  }
  function cancelEdit() {
    setEditingId(null)
    setEFirst(''); setELast(''); setESchool(''); setEClass('')
    setSaving(false)
  }
  useEffect(() => {
    // when selected school in edit changes, ensure class belongs to that school
    if (!editingId) return
    const valid = classes.filter(c => !eSchool || c.school_id === eSchool)
    if (eClass && !valid.find(v => v.id === eClass)) {
      setEClass(valid[0]?.id || '')
    }
  }, [eSchool, classes, editingId, eClass])

  async function saveEdit() {
    if (!editingId) return
    setSaving(true); setErr(null)
    const body: Record<string, any> = {
      id: editingId,
      first_name: eFirst.trim(),
      last_name:  eLast.trim(),
      class_id:   eClass || null,
      school_id:  eSchool || null,
    }
    const res = await fetch('/api/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const j = await res.json()
    setSaving(false)
    if (!j.ok) { setErr(j.error || 'Update failed'); return }
    cancelEdit()
    loadAll()
  }

  // ---------- RENDER ----------
  return (
    <div style={{ padding: 16, maxWidth: 960, margin: '0 auto' }}>
      <h1>Students</h1>

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label>First name</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <label>Last name</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <label>School</label>
          <select value={schoolId} onChange={e => setSchoolId(e.target.value)}>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <label>Class</label>
          <select value={classId} onChange={e => setClassId(e.target.value)}>
            {classes
              .filter(c => !schoolId || c.school_id === schoolId)
              .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button type="submit">Add Student</button>
      </form>

      {loading && <div>Loading…</div>}
      {err && <div style={{ color: 'crimson', marginBottom: 12 }}>Error: {err}</div>}

      {!loading && !err && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>School</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Class</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const inEdit = editingId === r.id
              return (
                <tr key={r.id}>
                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                    {!inEdit ? (
                      <span>{r.last_name}, {r.first_name}</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={eLast}
                          onChange={e => setELast(e.target.value)}
                          placeholder="Last"
                          style={{ width: 140 }}
                          required
                        />
                        <input
                          value={eFirst}
                          onChange={e => setEFirst(e.target.value)}
                          placeholder="First"
                          style={{ width: 140 }}
                          required
                        />
                      </div>
                    )}
                  </td>

                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                    {!inEdit ? (
                      r.school_id
                        ? (schools.find(s => s.id === r.school_id)?.name || r.school_id)
                        : '—'
                    ) : (
                      <select value={eSchool} onChange={e => setESchool(e.target.value)}>
                        <option value="">—</option>
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    )}
                  </td>

                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                    {!inEdit ? (
                      r.class_id ? (classNameById[r.class_id] || r.class_id) : '—'
                    ) : (
                      <select value={eClass} onChange={e => setEClass(e.target.value)}>
                        <option value="">—</option>
                        {classes
                          .filter(c => !eSchool || c.school_id === eSchool)
                          .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )}
                  </td>

                  <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                    {!inEdit ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => startEdit(r)}>Edit</button>
                        <button type="button" onClick={() => onDelete(r.id)}>Delete</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={saveEdit} disabled={saving}>
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" onClick={cancelEdit} disabled={saving}>Cancel</button>
                      </div>
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

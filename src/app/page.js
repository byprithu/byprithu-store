'use client'
export default function Page() { return <AppRoot /> }

import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/firebase'
import {
  collection, addDoc, getDocs, doc, updateDoc,
  onSnapshot, query, orderBy, setDoc, getDoc
} from 'firebase/firestore'

// ── constants ────────────────────────────────────────────────────
const IG_HANDLE = 'byprithu'
const IG_URL    = `https://www.instagram.com/${IG_HANDLE}/`
const SIZES     = ['A4 (21×29.7 cm)', 'A3 (29.7×42 cm)', 'A2 (42×59.4 cm)', 'Custom']
const EMOJIS    = ['🎨','🖼','🌺','🦋','⭐','🎭','🌸','🔥','🌙','🦚']
const COLORS    = ['#fce4ec','#f3e5f5','#e8eaf6','#e1f5fe','#e8f5e9','#fff8e1','#fbe9e7','#fff3e0']

const DEFAULT_POSTERS = [
  { id: 'p1', title: 'Vintage Sunset',  size: 'A4', price: '₹299', emoji: '🌅', bg: '#fff3e0' },
  { id: 'p2', title: 'Botanical Bloom', size: 'A3', price: '₹499', emoji: '🌿', bg: '#e8f5e9' },
  { id: 'p3', title: 'Cosmic Dreams',   size: 'A4', price: '₹349', emoji: '🌌', bg: '#ede7f6' },
  { id: 'p4', title: 'Retro Waves',     size: 'A3', price: '₹449', emoji: '🌊', bg: '#e3f2fd' },
  { id: 'p5', title: 'Midnight City',   size: 'A4', price: '₹329', emoji: '🏙', bg: '#e8eaf6' },
]

// ── helpers ──────────────────────────────────────────────────────
function genOrderId() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'BP-' + Array.from({length:6}, () => c[Math.floor(Math.random()*c.length)]).join('')
}
function encodeParam(p) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(p)))) } catch { return '' }
}
function decodeParam(s) {
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))) } catch { return null }
}

// ── style tokens ─────────────────────────────────────────────────
const T = {
  card:    { background:'#fff', border:'1.5px solid #efefef', borderRadius:12, padding:14 },
  label:   { fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#c0c0c0', marginBottom:10, display:'block' },
  inp:     (err) => ({ width:'100%', padding:'9px 11px', border: err?'1.5px solid #dc2743':'1.5px solid #e0e0e0', borderRadius:8, fontSize:14, fontFamily:'inherit', boxSizing:'border-box', background:'#fff', outline:'none' }),
  divider: { height:1, background:'#f0f0f0', margin:'18px 0' },
  igBtn:   { padding:'10px 18px', border:'none', borderRadius:9, background:'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7, fontFamily:'inherit' },
  ghost:   (extra={}) => ({ padding:'9px 14px', border:'1.5px solid #e5e5e5', borderRadius:8, background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', color:'#444', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6, ...extra }),
  badge:   (s) => ({ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, background: s==='done'?'#e8f5e9':s==='cancelled'?'#fce4ec':'#fff0f2', color: s==='done'?'#2e7d32':s==='cancelled'?'#c62828':'#dc2743' }),
}

// ════════════════════════════════════════════════════════════════
// SELLER DASHBOARD
// ════════════════════════════════════════════════════════════════
function SellerDashboard() {
  const [tab,      setTab]      = useState('share')
  const [posters,  setPosters]  = useState(DEFAULT_POSTERS)
  const [selected, setSelected] = useState(null)
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [copied,   setCopied]   = useState(false)
  const [adding,   setAdding]   = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [newP,     setNewP]     = useState({ title:'', size:'A4 (21×29.7 cm)', price:'', emoji:'🎨', bg:'#fce4ec' })
  const [expanded, setExpanded] = useState(null)
  const [baseUrl,  setBaseUrl]  = useState('')
  const [dbOk,     setDbOk]     = useState(true)

  // base url
  useEffect(() => { setBaseUrl(window.location.origin + window.location.pathname) }, [])

  // load posters from firebase
  useEffect(() => {
    ;(async () => {
      try {
        const snap = await getDocs(collection(db, 'posters'))
        if (!snap.empty) {
          setPosters(snap.docs.map(d => ({ ...d.data(), id: d.id })))
        } else {
          // seed default posters
          for (const p of DEFAULT_POSTERS) {
            await setDoc(doc(db, 'posters', p.id), p)
          }
        }
      } catch { setDbOk(false) }
    })()
  }, [])

  // real-time orders listener
  useEffect(() => {
    let unsub
    try {
      const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'))
      unsub = onSnapshot(q, snap => {
        setOrders(snap.docs.map(d => ({ ...d.data(), _id: d.id })))
        setLoading(false)
      }, () => setLoading(false))
    } catch { setLoading(false) }
    return () => unsub && unsub()
  }, [])

  async function addPoster() {
    if (!newP.title.trim() || !newP.price.trim()) return
    setSaving(true)
    const p = { ...newP, size: newP.size.split(' ')[0], created_at: Date.now() }
    try {
      const ref = await addDoc(collection(db, 'posters'), p)
      const saved = { ...p, id: ref.id }
      setPosters(prev => [...prev, saved])
      setSelected(saved)
    } catch { alert('Could not save poster. Check Firebase connection.') }
    setSaving(false)
    setAdding(false)
    setNewP({ title:'', size:'A4 (21×29.7 cm)', price:'', emoji:'🎨', bg:'#fce4ec' })
  }

  async function markStatus(docId, status) {
    try {
      await updateDoc(doc(db, 'orders', docId), { status })
    } catch { alert('Could not update order status.') }
  }

  const link      = selected && baseUrl ? `${baseUrl}?poster=${encodeParam(selected)}` : null
  const newCount  = orders.filter(o => o.status === 'new').length

  function copyLink() {
    if (!link) return
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  function shareIG() {
    if (!link) return
    const msg = `Hi! Here's your order form for the poster 👇\n${link}`
    navigator.clipboard.writeText(msg)
      .then(() => window.open('https://www.instagram.com/direct/inbox/', '_blank'))
      .catch(() => window.open('https://www.instagram.com/direct/inbox/', '_blank'))
  }
  function shareWA() {
    if (!link) return
    window.open(`https://wa.me/?text=${encodeURIComponent(`Hi! Here's your order form 👇\n${link}`)}`, '_blank')
  }

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", maxWidth:580, margin:'0 auto', padding:'24px 16px 80px' }}>

      {/* header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:15, flexShrink:0 }}>bp</div>
        <div>
          <div style={{ fontWeight:800, fontSize:17, color:'#111' }}>byprithu</div>
          <div style={{ fontSize:12, color:'#aaa' }}>Seller dashboard · @byprithu</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          {dbOk
            ? <span style={{ fontSize:11, background:'#e8f5e9', color:'#2e7d32', border:'1px solid #c8e6c9', borderRadius:20, padding:'3px 9px', fontWeight:700 }}>🔥 Firebase live</span>
            : <span style={{ fontSize:11, background:'#fff3e0', color:'#e65100', border:'1px solid #ffe0b2', borderRadius:20, padding:'3px 9px', fontWeight:700 }}>⚠ Offline</span>
          }
          <span style={{ fontSize:11, background:'#fff0f2', color:'#c0234b', border:'1px solid #f5b3c0', borderRadius:20, padding:'3px 10px', fontWeight:700 }}>SELLER</span>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display:'flex', borderBottom:'1.5px solid #f0f0f0', marginBottom:24 }}>
        {[['share','📤  Share link'], ['orders', newCount > 0 ? `📦  Orders (${newCount} new)` : '📦  Orders']].map(([key,lbl]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding:'9px 18px', background:'none', border:'none', borderBottom: tab===key?'2.5px solid #dc2743':'2.5px solid transparent', color: tab===key?'#dc2743':'#999', fontWeight: tab===key?700:500, fontSize:13, cursor:'pointer', fontFamily:'inherit', marginBottom:'-1.5px' }}>{lbl}</button>
        ))}
      </div>

      {/* ── SHARE TAB ── */}
      {tab === 'share' && <>
        <span style={T.label}>1 — Pick the poster they asked about</span>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(128px,1fr))', gap:10, marginBottom:20 }}>
          {posters.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} style={{ ...T.card, border: selected?.id===p.id?'2px solid #dc2743':'1.5px solid #efefef', background: selected?.id===p.id?'#fff8f9':'#fff', cursor:'pointer' }}>
              <div style={{ width:'100%', aspectRatio:'3/4', borderRadius:8, background:p.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, marginBottom:8 }}>{p.emoji}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#111', marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
              <div style={{ fontSize:11, color:'#aaa' }}>{p.size} · {p.price}</div>
              {selected?.id===p.id && <div style={{ marginTop:5, fontSize:11, color:'#dc2743', fontWeight:700 }}>✓ Selected</div>}
            </div>
          ))}
          <div onClick={() => setAdding(true)} style={{ border:'1.5px dashed #e0e0e0', borderRadius:12, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:130, gap:6, color:'#ccc', fontSize:13 }}>
            <div style={{ fontSize:24 }}>+</div><div>Add poster</div>
          </div>
        </div>

        {/* add poster form */}
        {adding && (
          <div style={{ ...T.card, marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>New poster</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div><div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Title *</div><input value={newP.title} onChange={e=>setNewP(p=>({...p,title:e.target.value}))} placeholder="Poster name" style={T.inp()} /></div>
              <div><div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Price *</div><input value={newP.price} onChange={e=>setNewP(p=>({...p,price:e.target.value}))} placeholder="₹299" style={T.inp()} /></div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Size</div>
              <select value={newP.size} onChange={e=>setNewP(p=>({...p,size:e.target.value}))} style={{ width:'100%', padding:'9px 11px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:14, fontFamily:'inherit' }}>{SIZES.map(s=><option key={s}>{s}</option>)}</select>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>Icon</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {EMOJIS.map(e=><div key={e} onClick={()=>setNewP(p=>({...p,emoji:e}))} style={{ width:32, height:32, borderRadius:7, border: newP.emoji===e?'2px solid #dc2743':'1px solid #e5e5e5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, cursor:'pointer' }}>{e}</div>)}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>Card colour</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {COLORS.map(bg=><div key={bg} onClick={()=>setNewP(p=>({...p,bg}))} style={{ width:24, height:24, borderRadius:'50%', background:bg, border: newP.bg===bg?'2.5px solid #dc2743':'1.5px solid #ddd', cursor:'pointer' }} />)}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={addPoster} disabled={saving} style={{ flex:1, padding:'9px 0', background: saving?'#e0a0aa':'#dc2743', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{saving?'Saving…':'Save poster'}</button>
              <button onClick={()=>setAdding(false)} style={{ padding:'9px 16px', background:'transparent', color:'#aaa', border:'1.5px solid #e5e5e5', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* generated link */}
        {selected && (
          <div style={{ marginTop:4 }}>
            <span style={T.label}>2 — Share this link</span>
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fff8f9', border:'1.5px solid #f5b3c0', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
              <div style={{ width:34, height:46, borderRadius:6, background:selected.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{selected.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'#111' }}>{selected.title}</div>
                <div style={{ fontSize:12, color:'#aaa' }}>{selected.size} · {selected.price}</div>
              </div>
            </div>
            <div style={{ background:'#f7f7f7', border:'1px solid #ebebeb', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#555', fontFamily:'monospace', wordBreak:'break-all', marginBottom:12, lineHeight:1.7 }}>{link||'Loading…'}</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
              <button onClick={copyLink} style={T.ghost()}>{copied?'✓ Copied!':'📋 Copy link'}</button>
              <button onClick={shareIG}  style={T.igBtn}>📩 Instagram DM</button>
              <button onClick={shareWA}  style={T.ghost({ borderColor:'#c8e6c9', color:'#2e7d32' })}>💬 WhatsApp</button>
            </div>
            <div style={{ fontSize:12, color:'#bbb', lineHeight:1.8 }}>Link <strong style={{ color:'#888' }}>never changes</strong> even when you update the site. Orders saved to Firebase — visible on all your devices instantly.</div>
          </div>
        )}
      </>}

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && <>
        {loading ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'#bbb', fontSize:14 }}>Loading orders…</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
            <div style={{ fontWeight:700, fontSize:15, color:'#333', marginBottom:6 }}>No orders yet</div>
            <div style={{ fontSize:13, color:'#aaa' }}>Once a customer submits the form, their order appears here in real time.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {orders.map(o => (
              <div key={o._id} style={{ ...T.card, cursor:'pointer' }} onClick={()=>setExpanded(expanded===o._id?null:o._id)}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:48, borderRadius:6, background:o.poster?.bg||'#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{o.poster?.emoji||'🖼'}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3, flexWrap:'wrap' }}>
                      <span style={{ fontWeight:700, fontSize:14, color:'#111' }}>{o.name}</span>
                      <span style={T.badge(o.status)}>{o.status==='done'?'Done':o.status==='cancelled'?'Cancelled':'New'}</span>
                    </div>
                    <div style={{ fontSize:12, color:'#888' }}>{o.poster?.title} · {o.poster?.size} · {o.poster?.price}</div>
                    <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{o.id} · {o.date}</div>
                  </div>
                  <div style={{ fontSize:16, color:'#ddd' }}>{expanded===o._id?'▲':'▼'}</div>
                </div>

                {expanded===o._id && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f0f0f0' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px', fontSize:13, marginBottom:10 }}>
                      {[['Name',o.name],['Email',o.email],['Phone',o.phone],['Pincode',o.pin],['City',o.city],['State',o.state],['Country',o.country],['Size',o.size]].map(([k,v])=>(
                        <div key={k}><span style={{ color:'#aaa' }}>{k}: </span><span style={{ color:'#111', fontWeight:600 }}>{v||'—'}</span></div>
                      ))}
                    </div>
                    <div style={{ fontSize:13, marginBottom:6 }}><span style={{ color:'#aaa' }}>Address: </span><span style={{ color:'#111', fontWeight:600 }}>{[o.addr1,o.addr2].filter(Boolean).join(', ')}</span></div>
                    {o.notes && <div style={{ fontSize:13, marginBottom:12 }}><span style={{ color:'#aaa' }}>Notes: </span><span style={{ color:'#111' }}>{o.notes}</span></div>}
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <button onClick={e=>{e.stopPropagation();markStatus(o._id,'done')}}      style={T.ghost({ color:'#2e7d32', borderColor:'#c8e6c9' })}>✓ Mark done</button>
                      <button onClick={e=>{e.stopPropagation();markStatus(o._id,'new')}}       style={T.ghost()}>↩ Mark new</button>
                      <button onClick={e=>{e.stopPropagation();markStatus(o._id,'cancelled')}} style={T.ghost({ color:'#c62828', borderColor:'#ffcdd2' })}>✕ Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// CUSTOMER ORDER FORM
// ════════════════════════════════════════════════════════════════
function CustomerForm({ poster }) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', addr1:'', addr2:'', city:'', state:'', pin:'', country:'India', size: poster?.size||'A4 (21×29.7 cm)', notes:'' })
  const [errors,  setErrors]  = useState({})
  const [orderId, setOrderId] = useState(null)
  const [busy,    setBusy]    = useState(false)

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  function validate() {
    const req = ['name','email','phone','addr1','city','state','pin']
    const e = {}
    req.forEach(k => { if (!form[k].trim()) e[k]=true })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    if (!validate() || busy) return
    setBusy(true)
    const id = genOrderId()
    const order = {
      id, ...form, poster,
      status: 'new',
      date: new Date().toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }),
      created_at: Date.now(),
    }
    try {
      await addDoc(collection(db, 'orders'), order)
      setOrderId(id)
    } catch {
      alert('Could not place order. Please try again.')
    }
    setBusy(false)
  }

  if (orderId) return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", maxWidth:440, margin:'0 auto', padding:'60px 16px', textAlign:'center' }}>
      <div style={{ width:64, height:64, borderRadius:'50%', background:'#e8f5e9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:28 }}>✓</div>
      <div style={{ fontSize:22, fontWeight:800, color:'#111', marginBottom:8 }}>Order placed!</div>
      <div style={{ display:'inline-block', background:'#fff8f9', border:'2px dashed #f5b3c0', borderRadius:10, padding:'12px 32px', margin:'10px 0 20px' }}>
        <div style={{ fontSize:11, color:'#aaa', marginBottom:4, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>Your order ID</div>
        <div style={{ fontSize:28, fontWeight:800, color:'#dc2743', letterSpacing:'0.12em' }}>{orderId}</div>
      </div>
      <div style={{ fontSize:14, color:'#888', lineHeight:1.8, marginBottom:28 }}>Save this ID for reference.<br/>Prithu will confirm your order on Instagram shortly.</div>
      <button onClick={()=>window.open(IG_URL,'_blank')} style={T.igBtn}>Back to @{IG_HANDLE} on Instagram</button>
    </div>
  )

  const field = (k, placeholder, type='text') => (
    <input type={type} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={placeholder} style={{ ...T.inp(errors[k]), width:'100%' }} />
  )

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", maxWidth:460, margin:'0 auto', padding:'24px 16px 60px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:13 }}>bp</div>
        <div><div style={{ fontWeight:800, fontSize:16, color:'#111' }}>byprithu</div><div style={{ fontSize:12, color:'#aaa' }}>Poster store · Order form</div></div>
      </div>

      {poster && (
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fff8f9', border:'1.5px solid #f5b3c0', borderRadius:10, padding:'10px 14px', marginBottom:22 }}>
          <div style={{ width:32, height:44, borderRadius:5, background:poster.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{poster.emoji}</div>
          <div><div style={{ fontWeight:700, fontSize:14, color:'#111' }}>Ordering: {poster.title}</div><div style={{ fontSize:12, color:'#aaa' }}>{poster.size} · {poster.price}</div></div>
        </div>
      )}

      <span style={T.label}>Your details</span>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
        {field('name','Full name')}
        {field('email','Email address','email')}
        {field('phone','Phone number','tel')}
      </div>

      <div style={T.divider} />
      <span style={T.label}>Delivery address</span>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
        {field('addr1','Flat / House no., Street')}
        {field('addr2','Area, Landmark (optional)')}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>{field('city','City')}{field('state','State')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>{field('pin','Pincode')}{field('country','Country')}</div>
      </div>

      <div style={T.divider} />
      <span style={T.label}>Size and notes</span>
      <div style={{ marginBottom:10 }}>
        <select value={form.size} onChange={e=>set('size',e.target.value)} style={{ width:'100%', padding:'9px 11px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:14, fontFamily:'inherit' }}>
          {SIZES.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Frame preference, quantity, any special request…" rows={3}
        style={{ width:'100%', padding:'9px 11px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:14, fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', marginBottom:18 }} />

      {Object.keys(errors).length>0 && (
        <div style={{ background:'#fff5f5', border:'1px solid #fbb', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#c0234b', marginBottom:12 }}>Fill in all required fields before submitting.</div>
      )}

      <button onClick={submit} disabled={busy} style={{ width:'100%', padding:13, background: busy?'#e0a0aa':'#dc2743', border:'none', color:'#fff', fontSize:15, fontWeight:700, borderRadius:10, cursor: busy?'not-allowed':'pointer', fontFamily:'inherit' }}>
        {busy ? 'Placing order…' : 'Place order →'}
      </button>
      <div style={{ fontSize:12, color:'#ccc', textAlign:'center', marginTop:10 }}>Your details are shared only with @{IG_HANDLE}</div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════
function AppRoot() {
  const [mode,   setMode]   = useState(null)
  const [poster, setPoster] = useState(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('poster')
    if (p) { const d = decodeParam(p); setPoster(d); setMode('customer') }
    else setMode('seller')
  }, [])

  if (!mode) return null
  if (mode === 'customer') return <CustomerForm poster={poster} />
  return <SellerDashboard />
}

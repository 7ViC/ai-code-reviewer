import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (s) => {
  if (s >= 80) return '#10b981'
  if (s >= 60) return '#f59e0b'
  return '#ef4444'
}

const severityColor = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981',
  info: '#06b6d4',
}

const severityEmoji = {
  critical: '🚨',
  high: '🔴',
  medium: '🟡',
  low: '🟢',
  info: 'ℹ️',
}

const categoryIcon = {
  architecture: '🏗️',
  security: '🔒',
  scalability: '📈',
  logic: '🧠',
  style: '✨',
}

const SAMPLE_DIFF = `--- a/auth.py
+++ b/auth.py
@@ -0,0 +1,20 @@
+import sqlite3
+
+def authenticate_user(username, password):
+    conn = sqlite3.connect('users.db')
+    cursor = conn.cursor()
+    # WARNING: This is intentionally vulnerable for demo purposes
+    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
+    cursor.execute(query)
+    user = cursor.fetchone()
+    conn.close()
+    return user
+
+def get_user_data(user_id):
+    conn = sqlite3.connect('users.db')
+    cursor = conn.cursor()
+    cursor.execute(f"SELECT * FROM users WHERE id={user_id}")
+    data = cursor.fetchall()
+    return data  # Returns raw DB rows with no sanitization`

// ─── Components ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: `${scoreColor(score)}20`,
      border: `1px solid ${scoreColor(score)}60`,
      borderRadius: 8, padding: '4px 12px',
      color: scoreColor(score), fontWeight: 700,
      fontFamily: 'monospace', fontSize: 14,
    }}>
      {score}/100
    </div>
  )
}

function IssueCard({ issue }) {
  const [open, setOpen] = useState(false)
  const color = severityColor[issue.severity] || '#64748b'
  return (
    <div style={{
      border: `1px solid ${color}30`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, marginBottom: 10,
      background: '#10101a', overflow: 'hidden',
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '12px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <span style={{ fontSize: 16 }}>{severityEmoji[issue.severity]}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase',
          background: `${color}20`, padding: '2px 8px', borderRadius: 4 }}>
          {issue.severity}
        </span>
        <span style={{ fontSize: 11, color: '#64748b', background: '#161624',
          padding: '2px 8px', borderRadius: 4 }}>
          {categoryIcon[issue.category]} {issue.category}
        </span>
        <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{issue.title}</span>
        <span style={{ color: '#64748b', fontSize: 18 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #1e1e30' }}>
          {issue.file && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 10, fontFamily: 'monospace' }}>
              📄 {issue.file}{issue.line ? `:${issue.line}` : ''}
            </div>
          )}
          <p style={{ marginTop: 10, fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
            {issue.explanation}
          </p>
          <div style={{ marginTop: 12, background: '#161624', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#06b6d4', fontWeight: 700, marginBottom: 6 }}>
              💡 SUGGESTION
            </div>
            <p style={{ fontSize: 13, color: '#e2e8f0' }}>{issue.suggestion}</p>
          </div>
          {issue.example_code && (
            <pre style={{
              marginTop: 12, background: '#0d0d1a', border: '1px solid #1e1e30',
              borderRadius: 8, padding: 16, overflowX: 'auto',
              fontSize: 12, fontFamily: 'monospace', color: '#c9d1e0', lineHeight: 1.8,
            }}>{issue.example_code}</pre>
          )}
        </div>
      )}
    </div>
  )
}

function ReviewDetail({ review, onClose }) {
  if (!review) return null
  const criticals = review.issues?.filter(i => i.severity === 'critical').length || 0
  const highs = review.issues?.filter(i => i.severity === 'high').length || 0

  return (
    <div style={{
      background: '#10101a', border: '1px solid #1e1e30', borderRadius: 14,
      padding: 28, height: '100%', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace', marginBottom: 6 }}>
            {review.repo || 'Manual Review'} {review.pr_number ? `#${review.pr_number}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScoreBadge score={review.overall_score} />
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
              background: review.mode === 'strict' ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)',
              color: review.mode === 'strict' ? '#fca5a5' : '#a78bfa',
              border: `1px solid ${review.mode === 'strict' ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)'}`,
              textTransform: 'uppercase',
            }}>
              {review.mode || 'standard'} mode
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
              background: review.approved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: review.approved ? '#6ee7b7' : '#fca5a5',
              border: `1px solid ${review.approved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              {review.approved ? '✅ Approved' : '❌ Changes Requested'}
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #1e1e30', color: '#64748b',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13,
          }}>✕ Close</button>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Issues', value: review.issues?.length || 0, color: '#06b6d4' },
          { label: 'Critical', value: criticals, color: '#ef4444' },
          { label: 'High', value: highs, color: '#f97316' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: '#161624', border: '1px solid #1e1e30',
            borderRadius: 10, padding: '12px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{
        background: '#161624', border: '1px solid #1e1e30',
        borderRadius: 10, padding: 16, marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, marginBottom: 8,
          textTransform: 'uppercase', letterSpacing: '0.05em' }}>📋 Summary</div>
        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{review.summary}</p>
      </div>

      {/* Issues */}
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 12,
        textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        🔍 Issues ({review.issues?.length || 0})
      </div>
      {review.issues?.length === 0 && (
        <div style={{ textAlign: 'center', color: '#10b981', padding: 32, fontSize: 16 }}>
          🎉 No significant issues found!
        </div>
      )}
      {review.issues?.map((issue, i) => (
        <IssueCard key={i} issue={issue} />
      ))}
    </div>
  )
}

function ManualReviewPanel({ onResult }) {
  const [diff, setDiff] = useState(SAMPLE_DIFF)
  const [title, setTitle] = useState('Add user authentication')
  const [mode, setMode] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    if (!diff.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await api.manualReview({ diff, title, mode })
      onResult(result)
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Review failed')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    background: '#161624', border: '1px solid #1e1e30', borderRadius: 8,
    color: '#e2e8f0', padding: '10px 14px', width: '100%', fontSize: 14,
    fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div style={{ background: '#10101a', border: '1px solid #1e1e30', borderRadius: 14, padding: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#06b6d4' }}>
        ⚡ Manual Review
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>PR Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={inp} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Mode</label>
        <select value={mode} onChange={e => setMode(e.target.value)}
          style={{ ...inp, cursor: 'pointer' }}>
          <option value="standard">🔵 Standard (Senior Engineer)</option>
          <option value="strict">🔴 Strict (Principal Engineer)</option>
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>
          Code Diff <span style={{ color: '#475569' }}>(paste a git diff)</span>
        </label>
        <textarea
          value={diff}
          onChange={e => setDiff(e.target.value)}
          rows={10}
          style={{ ...inp, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
        />
      </div>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>
          ⚠️ {error}
        </div>
      )}
      <button
        onClick={run}
        disabled={loading || !diff.trim()}
        style={{
          width: '100%', padding: '12px',
          background: loading ? '#1e1e30' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          border: 'none', borderRadius: 10, color: 'white',
          fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s',
        }}
      >
        {loading ? '🔄 Analyzing with Gemini...' : '🚀 Run AI Review'}
      </button>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [reviews, setReviews] = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('history') // 'history' | 'manual'
  const [loading, setLoading] = useState(true)

  const fetchReviews = useCallback(async () => {
    try {
      const data = await api.getReviews(20)
      setReviews(data)
    } catch (e) {
      console.error('Failed to load reviews:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const handleManualResult = (result) => {
    setSelected(result)
    setTab('history')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090f' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1e1e30',
        background: 'rgba(16,16,26,0.95)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>AI Code Reviewer</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Powered by Google Vertex AI · Gemini</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'history', label: '📋 Review History' },
              { id: 'manual', label: '⚡ Manual Review' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: tab === t.id ? 'rgba(124,58,237,0.2)' : 'transparent',
                color: tab === t.id ? '#a78bfa' : '#64748b',
              }}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={fetchReviews} style={{
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
            color: '#06b6d4', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13,
          }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>
        {tab === 'manual' ? (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <ManualReviewPanel onResult={handleManualResult} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
            {/* Sidebar list */}
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 14 }}>
                Recent Reviews ({reviews.length})
              </div>
              {loading && (
                <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>
                  Loading reviews...
                </div>
              )}
              {!loading && reviews.length === 0 && (
                <div style={{
                  background: '#10101a', border: '1px solid #1e1e30', borderRadius: 12,
                  padding: 32, textAlign: 'center', color: '#64748b',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>No reviews yet</div>
                  <div style={{ fontSize: 13 }}>Open a PR on a connected repo, or use Manual Review to test.</div>
                </div>
              )}
              {reviews.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelected(r)}
                  style={{
                    background: selected?.id === r.id ? '#161624' : '#10101a',
                    border: `1px solid ${selected?.id === r.id ? '#7c3aed60' : '#1e1e30'}`,
                    borderRadius: 12, padding: '14px 16px', marginBottom: 10,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                      {r.repo || 'Manual'} {r.pr_number ? `#${r.pr_number}` : ''}
                    </div>
                    <ScoreBadge score={r.overall_score} />
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                    {r.summary?.slice(0, 80)}...
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      background: r.mode === 'strict' ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)',
                      color: r.mode === 'strict' ? '#fca5a5' : '#a78bfa',
                      textTransform: 'uppercase',
                    }}>{r.mode || 'standard'}</span>
                    <span style={{ fontSize: 10, color: '#475569' }}>
                      {r.issues?.length || 0} issues
                    </span>
                    {r.approved
                      ? <span style={{ fontSize: 10, color: '#10b981' }}>✅ Approved</span>
                      : <span style={{ fontSize: 10, color: '#ef4444' }}>❌ Changes</span>
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* Detail panel */}
            <div>
              {selected
                ? <ReviewDetail review={selected} onClose={() => setSelected(null)} />
                : (
                  <div style={{
                    background: '#10101a', border: '1px solid #1e1e30', borderRadius: 14,
                    padding: 60, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>👈</div>
                    <div style={{ color: '#64748b', fontSize: 15 }}>
                      Select a review from the list, or run a Manual Review to get started.
                    </div>
                  </div>
                )
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

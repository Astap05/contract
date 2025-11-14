import React, { useMemo, useState } from 'react'
import { StatsData, StatsPanel } from './StatsPanel'
import { ProcessFlow } from './ProcessFlow'

interface ManualDemoPanelProps {
  denom: string
  onDenomChange: (v: string) => void
}

export function ManualDemoPanel({ denom, onDenomChange }: ManualDemoPanelProps) {
  const [participants, setParticipants] = useState(5)
  const [totalTokens, setTotalTokens] = useState(50)
  const [amounts, setAmounts] = useState('10, 5, 15, 20, 0')
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState<StatsData | undefined>(undefined)

  const [registered, setRegistered] = useState(0)
  const [submitted, setSubmitted] = useState(0)
  const [validated, setValidated] = useState(0)
  const [claimed, setClaimed] = useState(0)

  const resetCounters = () => {
    setRegistered(0)
    setSubmitted(0)
    setValidated(0)
    setClaimed(0)
    setStats(undefined)
  }

  const handleLine = (line: string) => {
    if (line.includes('Зарегистрирован')) setRegistered((v) => v + 1)
    if (line.includes('Отправил задание')) setSubmitted((v) => v + 1)
    if (line.includes('валидировано')) setValidated((v) => v + 1)
    if (line.includes('Выплата')) setClaimed((v) => v + 1)

    if (line.includes('ИТОГО:')) {
      const distributMatch = line.match(/распределено (\d+) из (\d+)/)
      const reservedMatch = line.match(/зарезервировано (\d+)/i)
      const distributed = distributMatch ? Number(distributMatch[1]) : 0
      const total = distributMatch ? Number(distributMatch[2]) : totalTokens
      const reserved = reservedMatch ? Number(reservedMatch[1]) : total - distributed
      setStats({
        total_tokens: total,
        tokens_distributed: distributed,
        tokens_reserved: reserved,
        tokens_available: Math.max(total - reserved, 0),
        total_participants: participants,
        registered,
        task_submitted: submitted,
        validated,
        tokens_claimed: claimed,
      })
    }
  }

  const run = () => {
    const parsed = amounts
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => !Number.isNaN(v))
    setRunning(true)
    setLogs([])
    resetCounters()

    const url = new URL('http://localhost:8787/manual-demo')
    url.searchParams.set('participants', String(participants))
    url.searchParams.set('total', String(totalTokens))
    url.searchParams.set('denom', denom || 'utoken')
    if (parsed.length > 0) {
      url.searchParams.set('amounts', parsed.join(','))
    }

    const es = new EventSource(url.toString())
    es.onmessage = (e) => {
      try {
        const { line } = JSON.parse(e.data)
        setLogs((prev) => [...prev, line])
        handleLine(line)
      } catch {
        /* ignore */
      }
    }
    es.onerror = () => {
      es.close()
      setRunning(false)
    }
  }

  const processStats = useMemo(
    () =>
      stats || {
        total_tokens: totalTokens,
        tokens_distributed: 0,
        tokens_reserved: 0,
        tokens_available: totalTokens,
        total_participants: participants,
        registered,
        task_submitted: submitted,
        validated,
        tokens_claimed: claimed,
      },
    [stats, totalTokens, participants, registered, submitted, validated, claimed]
  )

  return (
    <>
      <div className="input-form">
        <div className="form-group">
          <label>
            <span className="label-text">Количество участников</span>
            <input
              type="number"
              min={1}
              max={100}
              value={participants}
              onChange={(e) => setParticipants(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              disabled={running}
            />
            <div className="input-hint">Минимум 1, максимум 100</div>
          </label>
        </div>
        <div className="form-group">
          <label>
            <span className="label-text">Общее количество токенов</span>
            <input
              type="number"
              min={1}
              value={totalTokens}
              onChange={(e) => setTotalTokens(Math.max(1, Number(e.target.value) || 1))}
              disabled={running}
            />
          </label>
        </div>
        <div className="form-group">
          <label>
            <span className="label-text">Деноминация</span>
            <input value={denom} onChange={(e) => onDenomChange(e.target.value)} disabled={running} />
          </label>
        </div>
        <div className="form-group">
          <label>
            <span className="label-text">Список выплат (через запятую)</span>
            <textarea
              rows={3}
              value={amounts}
              onChange={(e) => setAmounts(e.target.value)}
              disabled={running}
              style={{ background: '#0e1123', color: 'var(--text)', borderRadius: 10, border: '1px solid var(--border)', padding: 10 }}
            />
            <div className="input-hint">Например: 10,5,15,0 — соответствующие выплаты участникам</div>
          </label>
        </div>
        <button className="btn-primary" onClick={run} disabled={running}>
          {running ? 'Запуск...' : '🚀 Смоделировать ручное распределение'}
        </button>
      </div>

      <SectionDivider title="Статистика" />
      <StatsPanel stats={processStats} />

      <SectionDivider title="Процесс" />
      <ProcessFlow
        registered={registered}
        taskSubmitted={submitted}
        validated={validated}
        tokensClaimed={claimed}
        total={participants}
      />

      <SectionDivider title="Логи" />
      <pre className="logs">{logs.join('\n') || 'Логи появятся после запуска демо.'}</pre>
    </>
  )
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ margin: '24px 0 12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {title}
    </div>
  )
}



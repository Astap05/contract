import React from 'react'

interface StatsData {
  total_tokens?: number
  tokens_distributed?: number
  tokens_remaining?: number
  total_participants?: number
  registered?: number
  task_submitted?: number
  validated?: number
  tokens_claimed?: number
}

interface StatsPanelProps {
  stats?: StatsData
}

export function StatsPanel({ stats }: StatsPanelProps) {
  if (!stats) return null

  const {
    total_tokens = 0,
    tokens_distributed = 0,
    tokens_remaining = 0,
    total_participants = 0,
    registered = 0,
    task_submitted = 0,
    validated = 0,
    tokens_claimed = 0,
  } = stats

  const distributionPercent = total_tokens > 0 ? (tokens_distributed / total_tokens) * 100 : 0
  const participantsPercent = total_participants > 0 ? (tokens_claimed / total_participants) * 100 : 0

  return (
    <div className="stats-panel">
      <div className="stat-card">
        <div className="stat-label">Всего токенов</div>
        <div className="stat-value">{total_tokens.toLocaleString()}</div>
        <div className="stat-progress">
          <div className="stat-bar" style={{ width: '100%', background: 'var(--border)' }} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Распределено</div>
        <div className="stat-value primary">{tokens_distributed.toLocaleString()}</div>
        <div className="stat-progress">
          <div
            className="stat-bar primary"
            style={{
              width: `${distributionPercent}%`,
              background: 'var(--primary)',
            }}
          />
        </div>
        <div className="stat-percent">{distributionPercent.toFixed(1)}%</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Осталось</div>
        <div className="stat-value">{tokens_remaining.toLocaleString()}</div>
        <div className="stat-progress">
          <div
            className="stat-bar"
            style={{
              width: `${100 - distributionPercent}%`,
              background: 'var(--muted)',
            }}
          />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Всего участников</div>
        <div className="stat-value">{total_participants.toLocaleString()}</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Зарегистрировано</div>
        <div className="stat-value">{registered.toLocaleString()}</div>
        <div className="stat-progress">
          <div
            className="stat-bar"
            style={{
              width: total_participants > 0 ? `${(registered / total_participants) * 100}%` : '0%',
              background: '#4CAF50',
            }}
          />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Задания поданы</div>
        <div className="stat-value">{task_submitted.toLocaleString()}</div>
        <div className="stat-progress">
          <div
            className="stat-bar"
            style={{
              width: total_participants > 0 ? `${(task_submitted / total_participants) * 100}%` : '0%',
              background: '#FF9800',
            }}
          />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Валидировано</div>
        <div className="stat-value">{validated.toLocaleString()}</div>
        <div className="stat-progress">
          <div
            className="stat-bar"
            style={{
              width: total_participants > 0 ? `${(validated / total_participants) * 100}%` : '0%',
              background: '#2196F3',
            }}
          />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Токены получены</div>
        <div className="stat-value success">{tokens_claimed.toLocaleString()}</div>
        <div className="stat-progress">
          <div
            className="stat-bar success"
            style={{
              width: `${participantsPercent}%`,
              background: '#4CAF50',
            }}
          />
        </div>
        <div className="stat-percent">{participantsPercent.toFixed(1)}%</div>
      </div>
    </div>
  )
}


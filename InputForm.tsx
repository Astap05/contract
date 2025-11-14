import React from 'react'

interface InputFormProps {
  participants: number
  totalTokens: number
  denom: string
  onParticipantsChange: (v: number) => void
  onTotalTokensChange: (v: number) => void
  onDenomChange: (v: string) => void
  onRunDemo: () => void
  running?: boolean
}

export function InputForm({
  participants,
  totalTokens,
  denom,
  onParticipantsChange,
  onTotalTokensChange,
  onDenomChange,
  onRunDemo,
  running = false,
}: InputFormProps) {
  return (
    <div className="input-form">
      <div className="form-group">
        <label>
          <span className="label-text">Количество участников</span>
          <input
            type="number"
            min="1"
            max="1000"
            value={participants}
            onChange={(e) => {
              const v = Math.max(1, Math.min(1000, Number(e.target.value) || 1))
              onParticipantsChange(v)
            }}
            disabled={running}
          />
          <div className="input-hint">От 1 до 1000</div>
        </label>
      </div>

      <div className="form-group">
        <label>
          <span className="label-text">Всего токенов для распределения</span>
          <input
            type="number"
            min="1"
            max="10000"
            value={totalTokens}
            onChange={(e) => {
              const v = Math.max(1, Math.min(10000, Number(e.target.value) || 1))
              onTotalTokensChange(v)
            }}
            disabled={running}
          />
          <div className="input-hint">От 1 до 10000</div>
        </label>
      </div>

      <div className="form-group">
        <label>
          <span className="label-text">Деноминация токена</span>
          <input
            type="text"
            value={denom}
            onChange={(e) => onDenomChange(e.target.value)}
            placeholder="utoken"
            disabled={running}
          />
          <div className="input-hint">Например: utoken, uatom, uosmo</div>
        </label>
      </div>

      <div className="form-summary">
        <div className="summary-item">
          <span className="summary-label">Будет распределено:</span>
          <span className="summary-value">
            {Math.min(participants, totalTokens)} токенов
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">По 1 токену на участника</span>
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={onRunDemo}
        disabled={running || participants < 1 || totalTokens < 1}
      >
        {running ? 'Запуск...' : '🚀 Запустить демо'}
      </button>
    </div>
  )
}


import React from 'react'

interface ProcessFlowProps {
  registered: number
  taskSubmitted: number
  validated: number
  tokensClaimed: number
  total: number
}

export function ProcessFlow({
  registered,
  taskSubmitted,
  validated,
  tokensClaimed,
  total,
}: ProcessFlowProps) {
  const steps = [
    { label: 'Регистрация', count: registered, total },
    { label: 'Подача задания', count: taskSubmitted, total },
    { label: 'Валидация', count: validated, total },
    { label: 'Получение токена', count: tokensClaimed, total },
  ]

  return (
    <div className="process-flow">
      {steps.map((step, idx) => {
        const isActive = step.count > 0
        const percent = step.total > 0 ? (step.count / step.total) * 100 : 0

        return (
          <div key={idx} className={`process-step ${isActive ? 'active' : ''}`}>
            <div className="step-icon">
              {step.count > 0 ? '✓' : idx + 1}
            </div>
            <div className="step-label">{step.label}</div>
            <div className="step-label" style={{ marginTop: 4, fontSize: 12, fontWeight: 700 }}>
              {step.count} / {step.total}
            </div>
            {percent > 0 && (
              <div style={{ marginTop: 8, width: '100%', maxWidth: 80 }}>
                <div className="stat-progress">
                  <div
                    className="stat-bar"
                    style={{
                      width: `${percent}%`,
                      background: isActive ? 'var(--primary)' : 'var(--border)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


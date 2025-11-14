import React, { useEffect, useState } from 'react'
import { useWallet } from '../wallet/useWallet'
import { useContract } from '../wallet/useContract'
import { StatsPanel, StatsData } from './StatsPanel'
import { InputForm } from './InputForm'
import { ProcessFlow } from './ProcessFlow'
import { ManualDemoPanel } from './ManualDemoPanel'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3>{title}</h3>
      {children}
    </div>
  )
}

export default function App() {
  const [rpc, setRpc] = useState<string>('http://localhost:26657')
  const [chainId, setChainId] = useState<string>('localnet-1')
  const [contract, setContract] = useState<string>('')
  const [denom, setDenom] = useState<string>('utoken')

  const wallet = useWallet({ chainId, rpc })
  const { client, address } = wallet
  const contractApi = useContract({ client, contractAddress: contract, address })

  const connected = !!address
  const [demoParticipants, setDemoParticipants] = useState(10)
  const [demoTotal, setDemoTotal] = useState(10)
  const [demoRunning, setDemoRunning] = useState(false)
  const [autoStats, setAutoStats] = useState<StatsData | undefined>(undefined)
  const [autoCounts, setAutoCounts] = useState({ registered: 0, submitted: 0, validated: 0, claimed: 0 })
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto')

  useEffect(() => {
    if (contractApi.logs.length === 0) {
      setAutoStats(undefined)
      setAutoCounts({ registered: 0, submitted: 0, validated: 0, claimed: 0 })
      return
    }

    let registered = 0
    let submitted = 0
    let validated = 0
    let claimed = 0
    let distributed = 0

    contractApi.logs.forEach((line) => {
      if (line.includes('Зарегистрирован')) registered++
      if (line.includes('Отправил задание')) submitted++
      if (line.includes('валидировано')) validated++
      if (line.includes('Выплата:')) {
        claimed++
        const match = line.match(/Выплата: (\d+)/)
        if (match) {
          distributed += Number(match[1])
        } else {
          distributed += 1
        }
      }
      if (line.includes('ИТОГО:')) {
        const match = line.match(/распределено (\d+) из (\d+)/)
        if (match) {
          distributed = Number(match[1])
        }
      }
    })

    setAutoCounts({ registered, submitted, validated, claimed })
    setAutoStats({
      total_tokens: demoTotal,
      tokens_distributed: distributed,
      tokens_reserved: 0,
      tokens_available: Math.max(demoTotal - distributed, 0),
      total_participants: demoParticipants,
      registered,
      task_submitted: submitted,
      validated,
      tokens_claimed: claimed,
    })
  }, [contractApi.logs, demoParticipants, demoTotal])

  return (
    <div className="container">
      <h2 className="title">CosmWasm Token Distribution UI</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button
          className={activeTab === 'auto' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setActiveTab('auto')}
        >
          Автоматическое демо
        </button>
        <button
          className={activeTab === 'manual' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setActiveTab('manual')}
        >
          Ручное распределение
        </button>
      </div>

      {activeTab === 'auto' && (
        <>
          <Section title="Конфигурация">
            <div className="grid2">
              <label>RPC
                <input value={rpc} onChange={e => setRpc(e.target.value)} />
              </label>
              <label>Chain ID
                <input value={chainId} onChange={e => setChainId(e.target.value)} />
              </label>
              <label>Contract Address
                <input value={contract} onChange={e => setContract(e.target.value)} />
              </label>
              <label>Denom
                <input value={denom} onChange={e => setDenom(e.target.value)} />
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <button onClick={wallet.connectKeplr} disabled={wallet.connecting || connected}>
                {connected ? `Подключено: ${address}` : 'Подключить Keplr'}
              </button>
            </div>
          </Section>

          <Section title="Запросы (Query)">
            <div className="row">
              <button onClick={contractApi.getConfig}>get_config</button>
              <button onClick={() => address && contractApi.getParticipantStatus(address)}>get_participant_status (me)</button>
              <button onClick={contractApi.getStats}>get_stats</button>
            </div>
          </Section>

          <Section title="Действия участника">
            <div className="row">
              <button onClick={() => contractApi.register()}>register_participant</button>
              <button className="btn-outline" onClick={() => contractApi.submitTask(prompt('Описание задания') || null)}>submit_task</button>
              <button onClick={() => contractApi.claimReward()}>claim_reward</button>
            </div>
          </Section>

          <Section title="Действия администратора">
            <div className="row">
              <button onClick={() => {
                const p = prompt('Адрес участника для валидации')
                if (p) contractApi.validateTask(p)
              }}>validate_task</button>
              <button className="btn-outline" onClick={() => {
                const participant = prompt('Адрес участника для выплаты')
                const amount = prompt(`Сколько ${denom} одобрить участнику?`, '5')
                if (participant && amount) contractApi.approveDistribution(participant, amount)
              }}>approve_distribution</button>
              <button className="btn-outline" onClick={() => {
                const amount = prompt(`Сколько ${denom} отправить на контракт?`, '100')
                if (amount) contractApi.deposit(denom, amount)
              }}>deposit</button>
            </div>
          </Section>

          <Section title="📊 Демо: распределение токенов">
            <InputForm
              participants={demoParticipants}
              totalTokens={demoTotal}
              denom={denom}
              onParticipantsChange={setDemoParticipants}
              onTotalTokensChange={setDemoTotal}
              onDenomChange={setDenom}
              onRunDemo={() => {
                setDemoRunning(true)
                setAutoStats(undefined)
                contractApi.clearLogs()
                const url = `http://localhost:8787/demo-fast?participants=${demoParticipants}&total=${demoTotal}&denom=${encodeURIComponent(denom)}`
                const es = new EventSource(url)
                es.onmessage = (e) => {
                  try {
                    const { line } = JSON.parse(e.data)
                    contractApi.appendLog(line)
                  } catch {/* ignore */}
                }
                es.onerror = () => {
                  es.close()
                  setDemoRunning(false)
                }
              }}
              running={demoRunning}
            />
            <p className="hint" style={{ marginTop: 12 }}>
              💡 Демо выполняется на локальном сервере, логи также видны в терминале (npm run dev).
            </p>
          </Section>

          {autoStats && (
            <>
              <Section title="📈 Статистика распределения">
                <StatsPanel stats={autoStats} />
              </Section>
              <Section title="🔄 Процесс распределения">
                <ProcessFlow
                  registered={autoCounts.registered}
                  taskSubmitted={autoCounts.submitted}
                  validated={autoCounts.validated}
                  tokensClaimed={autoCounts.claimed}
                  total={demoParticipants}
                />
              </Section>
            </>
          )}

          <Section title="📝 Логи">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="hint">Всего записей: {contractApi.logs.length}</span>
              <button className="btn-outline" onClick={contractApi.clearLogs} style={{ padding: '6px 12px', fontSize: 12 }}>
                Очистить логи
              </button>
            </div>
            <pre className="logs">{contractApi.logs.join('\n') || 'Логи появятся здесь после запуска демо...'}</pre>
          </Section>
        </>
      )}

      {activeTab === 'manual' && (
        <Section title="Ручное распределение (Pocket Flow)">
          <ManualDemoPanel denom={denom} onDenomChange={setDenom} />
        </Section>
      )}
    </div>
  )
}



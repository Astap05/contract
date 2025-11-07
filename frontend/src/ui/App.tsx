import React, { useState, useEffect } from 'react'
import { useWallet } from '../wallet/useWallet'
import { useContract } from '../wallet/useContract'
import { StatsPanel } from './StatsPanel'
import { InputForm } from './InputForm'
import { ProcessFlow } from './ProcessFlow'

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
  const contractApi = useContract({ client, contractAddress: contract })

  const connected = !!address
  const [demoParticipants, setDemoParticipants] = useState(10)
  const [demoTotal, setDemoTotal] = useState(10)
  const [demoRunning, setDemoRunning] = useState(false)
  const [stats, setStats] = useState<any>(null)

  // Парсим статистику из логов в реальном времени
  useEffect(() => {
    if (contractApi.logs.length === 0) {
      setStats(null)
      return
    }

    let registered = 0
    let taskSubmitted = 0
    let validated = 0
    let tokensClaimed = 0
    let distributed = 0

    contractApi.logs.forEach((log) => {
      if (log.includes('Зарегистрирован')) registered++
      if (log.includes('Отправил задание')) taskSubmitted++
      if (log.includes('валидировано')) validated++
      if (log.includes('Выплата:')) {
        tokensClaimed++
        distributed++
      }
      if (log.includes('ИТОГО:')) {
        const match = log.match(/распределено (\d+) из (\d+)/)
        if (match) {
          distributed = parseInt(match[1])
        }
      }
    })

    if (registered > 0 || distributed > 0) {
      setStats({
        total_tokens: demoTotal,
        tokens_distributed: distributed,
        tokens_remaining: demoTotal - distributed,
        total_participants: demoParticipants,
        registered: Math.max(registered, demoParticipants),
        task_submitted: Math.max(taskSubmitted, demoParticipants),
        validated: Math.max(validated, demoParticipants),
        tokens_claimed: distributed,
      })
    }
  }, [contractApi.logs, demoTotal, demoParticipants])

  return (
    <div className="container">
      <h2 className="title">CosmWasm Token Distribution UI</h2>

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

      <Section title="Действия эмитента (issuer)">
        <div className="row">
          <button onClick={() => {
            const p = prompt('Адрес участника для валидации')
            if (p) contractApi.validateTask(p)
          }}>validate_task</button>
          <button className="btn-outline" onClick={() => {
            const amount = prompt(`Сколько ${denom} отправить на контракт?`, '100')
            if (amount) contractApi.deposit(denom, amount)
          }}>deposit</button>
        </div>
      </Section>

      <Section title="📊 Демо: Распределение токенов">
        <InputForm
          participants={demoParticipants}
          totalTokens={demoTotal}
          denom={denom}
          onParticipantsChange={setDemoParticipants}
          onTotalTokensChange={setDemoTotal}
          onDenomChange={setDenom}
          onRunDemo={() => {
            setDemoRunning(true)
            setStats(null)
            contractApi.clearLogs()
            const url = `http://localhost:8787/demo-fast?participants=${demoParticipants}&total=${demoTotal}&denom=${encodeURIComponent(denom)}`
            const es = new EventSource(url)
            es.onmessage = (e) => {
              try {
                const { line } = JSON.parse(e.data)
                contractApi.appendLog(line)
              } catch {}
            }
            es.onerror = () => {
              es.close()
              setDemoRunning(false)
            }
            es.onclose = () => setDemoRunning(false)
          }}
          running={demoRunning}
        />
        <p className="hint" style={{ marginTop: 12 }}>
          💡 Демо выполняется на локальном сервере, логи также видны в терминале (npm run dev).
        </p>
      </Section>

      {stats && (
        <>
          <Section title="📈 Статистика распределения">
            <StatsPanel stats={stats} />
          </Section>

          <Section title="🔄 Процесс распределения">
            <ProcessFlow
              registered={stats.registered || 0}
              taskSubmitted={stats.task_submitted || 0}
              validated={stats.validated || 0}
              tokensClaimed={stats.tokens_claimed || 0}
              total={stats.total_participants || 0}
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
    </div>
  )
}



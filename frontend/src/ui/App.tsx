import React, { useMemo, useState } from 'react'
import { useWallet } from '../wallet/useWallet'
import { useContract } from '../wallet/useContract'
import { runPrototypeDemo } from '../demo/prototype'

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

      <Section title="Демо как прототип (офлайн, без Keplr)">
        <div className="grid4">
          <label>Участников
            <input type="number" value={demoParticipants} onChange={e => setDemoParticipants(Number(e.target.value))} />
          </label>
          <label>Всего токенов
            <input type="number" value={demoTotal} onChange={e => setDemoTotal(Number(e.target.value))} />
          </label>
          <div />
          <button className="btn-outline" onClick={() => {
            const url = `http://localhost:8787/demo-fast?participants=${demoParticipants}&total=${demoTotal}&denom=${encodeURIComponent(denom)}`
            const es = new EventSource(url)
            es.onmessage = (e) => {
              try { const { line } = JSON.parse(e.data); contractApi.appendLog(line) } catch {}
            }
            es.onerror = () => es.close()
          }}>
            Запустить демо
          </button>
        </div>
        <p className="hint">Демо выполняется на локальном сервере, логи также видны в терминале (npm run dev).</p>
      </Section>

      <Section title="Логи">
        <pre className="logs">{contractApi.logs.join('\n')}</pre>
      </Section>
    </div>
  )
}



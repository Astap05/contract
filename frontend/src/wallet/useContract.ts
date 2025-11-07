import { useMemo, useState } from 'react'
import type { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'

export function useContract({ client, contractAddress }: { client: SigningCosmWasmClient | null; contractAddress: string }) {
  const [logs, setLogs] = useState<string[]>([])
  const push = (line: string) => setLogs(prev => [...prev.slice(-500), line])
  const appendLog = (line: string) => push(line)

  const run = async <T,>(f: () => Promise<T>, ok: (v: T) => void = () => {}) => {
    try {
      const res = await f()
      ok(res)
    } catch (e) {
      console.error(e)
      push(`Ошибка: ${(e as Error).message}`)
    }
  }

  const getConfig = () => run(async () => {
    if (!client || !contractAddress) throw new Error('Нет клиента/адреса контракта')
    const res = await client.queryContractSmart(contractAddress, { get_config: {} })
    push(`get_config → ${JSON.stringify(res)}`)
    return res
  })

  const getParticipantStatus = (participant: string) => run(async () => {
    if (!client || !contractAddress) throw new Error('Нет клиента/адреса контракта')
    const res = await client.queryContractSmart(contractAddress, { get_participant_status: { participant } })
    push(`get_participant_status(${participant}) → ${JSON.stringify(res)}`)
    return res
  })

  const getTaskInfo = (participant: string) => run(async () => {
    if (!client || !contractAddress) throw new Error('Нет клиента/адреса контракта')
    const res = await client.queryContractSmart(contractAddress, { get_task_info: { participant } })
    push(`get_task_info(${participant}) → ${JSON.stringify(res)}`)
    return res
  })

  const getStats = () => run(async () => {
    if (!client || !contractAddress) throw new Error('Нет клиента/адреса контракта')
    const res = await client.queryContractSmart(contractAddress, { get_stats: {} })
    push(`get_stats → ${JSON.stringify(res)}`)
    return res
  })

  const register = () => run(async () => {
    if (!client || !contractAddress) throw new Error('Нет клиента/адреса контракта')
    const res = await client.signAndBroadcast((await client.getSignerAddresses())[0], [{ typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract', value: { sender: (await client.getSignerAddresses())[0], contract: contractAddress, msg: new TextEncoder().encode(JSON.stringify({ register_participant: {} })), funds: [] } }], 'auto')
    push(`register_participant → tx ${res.transactionHash}`)
    return res
  })

  const submitTask = (description: string | null) => run(async () => {
    if (!client || !contractAddress) throw new Error('Нет клиента/адреса контракта')
    const msg = { submit_task: { description } }
    const res = await client.execute((await client.getSignerAddresses())[0], contractAddress, msg, 'auto')
    push(`submit_task → tx ${res.transactionHash}`)
    return res
  })

  const validateTask = (participant: string) => run(async () => {
    if (!client || !contractAddress) throw new Error('Нет клиента/адреса контракта')
    const msg = { validate_task: { participant } }
    const res = await client.execute((await client.getSignerAddresses())[0], contractAddress, msg, 'auto')
    push(`validate_task(${participant}) → tx ${res.transactionHash}`)
    return res
  })

  const claimReward = () => run(async () => {
    if (!client || !contractAddress) throw new Error('Нет клиента/адреса контракта')
    const msg = { claim_reward: {} }
    const res = await client.execute((await client.getSignerAddresses())[0], contractAddress, msg, 'auto')
    push(`claim_reward → tx ${res.transactionHash}`)
    return res
  })

  const deposit = (denom: string, amount: string) => run(async () => {
    if (!client || !contractAddress) throw new Error('Нет клиента/адреса контракта')
    const msg = { deposit: {} }
    const funds = [{ denom, amount }]
    const res = await client.execute((await client.getSignerAddresses())[0], contractAddress, msg, 'auto', undefined, funds)
    push(`deposit ${amount}${denom} → tx ${res.transactionHash}`)
    return res
  })

  const clearLogs = () => setLogs([])

  return {
    logs,
    appendLog,
    clearLogs,
    getConfig,
    getParticipantStatus,
    getTaskInfo,
    getStats,
    register,
    submitTask,
    validateTask,
    claimReward,
    deposit,
  }
}



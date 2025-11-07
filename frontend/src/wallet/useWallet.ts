import { useCallback, useEffect, useState } from 'react'
import { SigningCosmWasmClient, GasPrice } from '@cosmjs/cosmwasm-stargate'
import { OfflineSigner } from '@cosmjs/proto-signing'

declare global {
  interface Window {
    keplr?: any
    getOfflineSignerAuto?: (chainId: string) => Promise<OfflineSigner>
  }
}

export function useWallet({ chainId, rpc }: { chainId: string; rpc: string }) {
  const [address, setAddress] = useState<string>('')
  const [client, setClient] = useState<SigningCosmWasmClient | null>(null)
  const [connecting, setConnecting] = useState(false)

  const connectKeplr = useCallback(async () => {
    try {
      setConnecting(true)
      if (!window.keplr) throw new Error('Keplr не найден')
      await window.keplr.enable(chainId)
      const signer = await window.getOfflineSignerAuto!(chainId)
      const accounts = await signer.getAccounts()
      const addr = accounts[0]?.address
      if (!addr) throw new Error('Не удалось получить адрес')
      const c = await SigningCosmWasmClient.connectWithSigner(rpc, signer, {
        gasPrice: GasPrice.fromString('0.025ujunox'),
      })
      setClient(c)
      setAddress(addr)
    } catch (e) {
      console.error(e)
      alert((e as Error).message)
    } finally {
      setConnecting(false)
    }
  }, [chainId, rpc])

  useEffect(() => {
    setClient(null)
    setAddress('')
  }, [chainId, rpc])

  return { client, address, connecting, connectKeplr }
}



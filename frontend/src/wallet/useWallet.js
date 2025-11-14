import { useCallback, useEffect, useState } from 'react';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice } from '@cosmjs/stargate';
export function useWallet({ chainId, rpc }) {
    const [address, setAddress] = useState('');
    const [client, setClient] = useState(null);
    const [connecting, setConnecting] = useState(false);
    const connectKeplr = useCallback(async () => {
        try {
            setConnecting(true);
            if (!window.keplr)
                throw new Error('Keplr не найден');
            await window.keplr.enable(chainId);
            const signer = await window.getOfflineSignerAuto(chainId);
            const accounts = await signer.getAccounts();
            const addr = accounts[0]?.address;
            if (!addr)
                throw new Error('Не удалось получить адрес');
            const c = await SigningCosmWasmClient.connectWithSigner(rpc, signer, {
                gasPrice: GasPrice.fromString('0.025ujunox'),
            });
            setClient(c);
            setAddress(addr);
        }
        catch (e) {
            console.error(e);
            alert(e.message);
        }
        finally {
            setConnecting(false);
        }
    }, [chainId, rpc]);
    useEffect(() => {
        setClient(null);
        setAddress('');
    }, [chainId, rpc]);
    return { client, address, connecting, connectKeplr };
}

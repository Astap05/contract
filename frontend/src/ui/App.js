import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useWallet } from '../wallet/useWallet';
import { useContract } from '../wallet/useContract';
import { StatsPanel } from './StatsPanel';
import { InputForm } from './InputForm';
import { ProcessFlow } from './ProcessFlow';
import { ManualDemoPanel } from './ManualDemoPanel';
function Section({ title, children }) {
    return (_jsxs("div", { className: "card", style: { marginBottom: 16 }, children: [_jsx("h3", { children: title }), children] }));
}
export default function App() {
    const [rpc, setRpc] = useState('http://localhost:26657');
    const [chainId, setChainId] = useState('localnet-1');
    const [contract, setContract] = useState('');
    const [denom, setDenom] = useState('utoken');
    const wallet = useWallet({ chainId, rpc });
    const { client, address } = wallet;
    const contractApi = useContract({ client, contractAddress: contract, address });
    const connected = !!address;
    const [demoParticipants, setDemoParticipants] = useState(10);
    const [demoTotal, setDemoTotal] = useState(10);
    const [demoRunning, setDemoRunning] = useState(false);
    const [autoStats, setAutoStats] = useState(undefined);
    const [autoCounts, setAutoCounts] = useState({ registered: 0, submitted: 0, validated: 0, claimed: 0 });
    const [activeTab, setActiveTab] = useState('auto');
    useEffect(() => {
        if (contractApi.logs.length === 0) {
            setAutoStats(undefined);
            setAutoCounts({ registered: 0, submitted: 0, validated: 0, claimed: 0 });
            return;
        }
        let registered = 0;
        let submitted = 0;
        let validated = 0;
        let claimed = 0;
        let distributed = 0;
        contractApi.logs.forEach((line) => {
            if (line.includes('Зарегистрирован'))
                registered++;
            if (line.includes('Отправил задание'))
                submitted++;
            if (line.includes('валидировано'))
                validated++;
            if (line.includes('Выплата:')) {
                claimed++;
                const match = line.match(/Выплата: (\d+)/);
                if (match) {
                    distributed += Number(match[1]);
                }
                else {
                    distributed += 1;
                }
            }
            if (line.includes('ИТОГО:')) {
                const match = line.match(/распределено (\d+) из (\d+)/);
                if (match) {
                    distributed = Number(match[1]);
                }
            }
        });
        setAutoCounts({ registered, submitted, validated, claimed });
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
        });
    }, [contractApi.logs, demoParticipants, demoTotal]);
    return (_jsxs("div", { className: "container", children: [_jsx("h2", { className: "title", children: "CosmWasm Token Distribution UI" }), _jsxs("div", { style: { display: 'flex', gap: 12, marginBottom: 16 }, children: [_jsx("button", { className: activeTab === 'auto' ? 'btn-primary' : 'btn-outline', onClick: () => setActiveTab('auto'), children: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u0434\u0435\u043C\u043E" }), _jsx("button", { className: activeTab === 'manual' ? 'btn-primary' : 'btn-outline', onClick: () => setActiveTab('manual'), children: "\u0420\u0443\u0447\u043D\u043E\u0435 \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435" })] }), activeTab === 'auto' && (_jsxs(_Fragment, { children: [_jsxs(Section, { title: "\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F", children: [_jsxs("div", { className: "grid2", children: [_jsxs("label", { children: ["RPC", _jsx("input", { value: rpc, onChange: e => setRpc(e.target.value) })] }), _jsxs("label", { children: ["Chain ID", _jsx("input", { value: chainId, onChange: e => setChainId(e.target.value) })] }), _jsxs("label", { children: ["Contract Address", _jsx("input", { value: contract, onChange: e => setContract(e.target.value) })] }), _jsxs("label", { children: ["Denom", _jsx("input", { value: denom, onChange: e => setDenom(e.target.value) })] })] }), _jsx("div", { style: { marginTop: 12 }, children: _jsx("button", { onClick: wallet.connectKeplr, disabled: wallet.connecting || connected, children: connected ? `Подключено: ${address}` : 'Подключить Keplr' }) })] }), _jsx(Section, { title: "\u0417\u0430\u043F\u0440\u043E\u0441\u044B (Query)", children: _jsxs("div", { className: "row", children: [_jsx("button", { onClick: contractApi.getConfig, children: "get_config" }), _jsx("button", { onClick: () => address && contractApi.getParticipantStatus(address), children: "get_participant_status (me)" }), _jsx("button", { onClick: contractApi.getStats, children: "get_stats" })] }) }), _jsx(Section, { title: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430", children: _jsxs("div", { className: "row", children: [_jsx("button", { onClick: () => contractApi.register(), children: "register_participant" }), _jsx("button", { className: "btn-outline", onClick: () => contractApi.submitTask(prompt('Описание задания') || null), children: "submit_task" }), _jsx("button", { onClick: () => contractApi.claimReward(), children: "claim_reward" })] }) }), _jsx(Section, { title: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430", children: _jsxs("div", { className: "row", children: [_jsx("button", { onClick: () => {
                                        const p = prompt('Адрес участника для валидации');
                                        if (p)
                                            contractApi.validateTask(p);
                                    }, children: "validate_task" }), _jsx("button", { className: "btn-outline", onClick: () => {
                                        const participant = prompt('Адрес участника для выплаты');
                                        const amount = prompt(`Сколько ${denom} одобрить участнику?`, '5');
                                        if (participant && amount)
                                            contractApi.approveDistribution(participant, amount);
                                    }, children: "approve_distribution" }), _jsx("button", { className: "btn-outline", onClick: () => {
                                        const amount = prompt(`Сколько ${denom} отправить на контракт?`, '100');
                                        if (amount)
                                            contractApi.deposit(denom, amount);
                                    }, children: "deposit" })] }) }), _jsxs(Section, { title: "\uD83D\uDCCA \u0414\u0435\u043C\u043E: \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0442\u043E\u043A\u0435\u043D\u043E\u0432", children: [_jsx(InputForm, { participants: demoParticipants, totalTokens: demoTotal, denom: denom, onParticipantsChange: setDemoParticipants, onTotalTokensChange: setDemoTotal, onDenomChange: setDenom, onRunDemo: () => {
                                    setDemoRunning(true);
                                    setAutoStats(undefined);
                                    contractApi.clearLogs();
                                    const url = `http://localhost:8787/demo-fast?participants=${demoParticipants}&total=${demoTotal}&denom=${encodeURIComponent(denom)}`;
                                    const es = new EventSource(url);
                                    es.onmessage = (e) => {
                                        try {
                                            const { line } = JSON.parse(e.data);
                                            contractApi.appendLog(line);
                                        }
                                        catch { /* ignore */ }
                                    };
                                    es.onerror = () => {
                                        es.close();
                                        setDemoRunning(false);
                                    };
                                }, running: demoRunning }), _jsx("p", { className: "hint", style: { marginTop: 12 }, children: "\uD83D\uDCA1 \u0414\u0435\u043C\u043E \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F \u043D\u0430 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u043C \u0441\u0435\u0440\u0432\u0435\u0440\u0435, \u043B\u043E\u0433\u0438 \u0442\u0430\u043A\u0436\u0435 \u0432\u0438\u0434\u043D\u044B \u0432 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0435 (npm run dev)." })] }), autoStats && (_jsxs(_Fragment, { children: [_jsx(Section, { title: "\uD83D\uDCC8 \u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u044F", children: _jsx(StatsPanel, { stats: autoStats }) }), _jsx(Section, { title: "\uD83D\uDD04 \u041F\u0440\u043E\u0446\u0435\u0441\u0441 \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u044F", children: _jsx(ProcessFlow, { registered: autoCounts.registered, taskSubmitted: autoCounts.submitted, validated: autoCounts.validated, tokensClaimed: autoCounts.claimed, total: demoParticipants }) })] })), _jsxs(Section, { title: "\uD83D\uDCDD \u041B\u043E\u0433\u0438", children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, children: [_jsxs("span", { className: "hint", children: ["\u0412\u0441\u0435\u0433\u043E \u0437\u0430\u043F\u0438\u0441\u0435\u0439: ", contractApi.logs.length] }), _jsx("button", { className: "btn-outline", onClick: contractApi.clearLogs, style: { padding: '6px 12px', fontSize: 12 }, children: "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043B\u043E\u0433\u0438" })] }), _jsx("pre", { className: "logs", children: contractApi.logs.join('\n') || 'Логи появятся здесь после запуска демо...' })] })] })), activeTab === 'manual' && (_jsx(Section, { title: "\u0420\u0443\u0447\u043D\u043E\u0435 \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 (Pocket Flow)", children: _jsx(ManualDemoPanel, { denom: denom, onDenomChange: setDenom }) }))] }));
}

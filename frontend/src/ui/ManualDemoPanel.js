import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { StatsPanel } from './StatsPanel';
import { ProcessFlow } from './ProcessFlow';
export function ManualDemoPanel({ denom, onDenomChange }) {
    const [participants, setParticipants] = useState(5);
    const [totalTokens, setTotalTokens] = useState(50);
    const [amounts, setAmounts] = useState('10, 5, 15, 20, 0');
    const [running, setRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(undefined);
    const [registered, setRegistered] = useState(0);
    const [submitted, setSubmitted] = useState(0);
    const [validated, setValidated] = useState(0);
    const [claimed, setClaimed] = useState(0);
    const resetCounters = () => {
        setRegistered(0);
        setSubmitted(0);
        setValidated(0);
        setClaimed(0);
        setStats(undefined);
    };
    const handleLine = (line) => {
        if (line.includes('Зарегистрирован'))
            setRegistered((v) => v + 1);
        if (line.includes('Отправил задание'))
            setSubmitted((v) => v + 1);
        if (line.includes('валидировано'))
            setValidated((v) => v + 1);
        if (line.includes('Выплата'))
            setClaimed((v) => v + 1);
        if (line.includes('ИТОГО:')) {
            const distributMatch = line.match(/распределено (\d+) из (\d+)/);
            const reservedMatch = line.match(/зарезервировано (\d+)/i);
            const distributed = distributMatch ? Number(distributMatch[1]) : 0;
            const total = distributMatch ? Number(distributMatch[2]) : totalTokens;
            const reserved = reservedMatch ? Number(reservedMatch[1]) : total - distributed;
            setStats({
                total_tokens: total,
                tokens_distributed: distributed,
                tokens_reserved: reserved,
                tokens_available: Math.max(total - reserved, 0),
                total_participants: participants,
                registered,
                task_submitted: submitted,
                validated,
                tokens_claimed: claimed,
            });
        }
    };
    const run = () => {
        const parsed = amounts
            .split(',')
            .map((v) => Number(v.trim()))
            .filter((v) => !Number.isNaN(v));
        setRunning(true);
        setLogs([]);
        resetCounters();
        const url = new URL('http://localhost:8787/manual-demo');
        url.searchParams.set('participants', String(participants));
        url.searchParams.set('total', String(totalTokens));
        url.searchParams.set('denom', denom || 'utoken');
        if (parsed.length > 0) {
            url.searchParams.set('amounts', parsed.join(','));
        }
        const es = new EventSource(url.toString());
        es.onmessage = (e) => {
            try {
                const { line } = JSON.parse(e.data);
                setLogs((prev) => [...prev, line]);
                handleLine(line);
            }
            catch {
                /* ignore */
            }
        };
        es.onerror = () => {
            es.close();
            setRunning(false);
        };
    };
    const processStats = useMemo(() => stats || {
        total_tokens: totalTokens,
        tokens_distributed: 0,
        tokens_reserved: 0,
        tokens_available: totalTokens,
        total_participants: participants,
        registered,
        task_submitted: submitted,
        validated,
        tokens_claimed: claimed,
    }, [stats, totalTokens, participants, registered, submitted, validated, claimed]);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "input-form", children: [_jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("span", { className: "label-text", children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432" }), _jsx("input", { type: "number", min: 1, max: 100, value: participants, onChange: (e) => setParticipants(Math.max(1, Math.min(100, Number(e.target.value) || 1))), disabled: running }), _jsx("div", { className: "input-hint", children: "\u041C\u0438\u043D\u0438\u043C\u0443\u043C 1, \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C 100" })] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("span", { className: "label-text", children: "\u041E\u0431\u0449\u0435\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432" }), _jsx("input", { type: "number", min: 1, value: totalTokens, onChange: (e) => setTotalTokens(Math.max(1, Number(e.target.value) || 1)), disabled: running })] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("span", { className: "label-text", children: "\u0414\u0435\u043D\u043E\u043C\u0438\u043D\u0430\u0446\u0438\u044F" }), _jsx("input", { value: denom, onChange: (e) => onDenomChange(e.target.value), disabled: running })] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("span", { className: "label-text", children: "\u0421\u043F\u0438\u0441\u043E\u043A \u0432\u044B\u043F\u043B\u0430\u0442 (\u0447\u0435\u0440\u0435\u0437 \u0437\u0430\u043F\u044F\u0442\u0443\u044E)" }), _jsx("textarea", { rows: 3, value: amounts, onChange: (e) => setAmounts(e.target.value), disabled: running, style: { background: '#0e1123', color: 'var(--text)', borderRadius: 10, border: '1px solid var(--border)', padding: 10 } }), _jsx("div", { className: "input-hint", children: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: 10,5,15,0 \u2014 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 \u0432\u044B\u043F\u043B\u0430\u0442\u044B \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430\u043C" })] }) }), _jsx("button", { className: "btn-primary", onClick: run, disabled: running, children: running ? 'Запуск...' : '🚀 Смоделировать ручное распределение' })] }), _jsx(SectionDivider, { title: "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430" }), _jsx(StatsPanel, { stats: processStats }), _jsx(SectionDivider, { title: "\u041F\u0440\u043E\u0446\u0435\u0441\u0441" }), _jsx(ProcessFlow, { registered: registered, taskSubmitted: submitted, validated: validated, tokensClaimed: claimed, total: participants }), _jsx(SectionDivider, { title: "\u041B\u043E\u0433\u0438" }), _jsx("pre", { className: "logs", children: logs.join('\n') || 'Логи появятся после запуска демо.' })] }));
}
function SectionDivider({ title }) {
    return (_jsx("div", { style: { margin: '24px 0 12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }, children: title }));
}

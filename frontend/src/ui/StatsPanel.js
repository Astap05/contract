import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function StatsPanel({ stats }) {
    if (!stats)
        return null;
    const { total_tokens = 0, tokens_distributed = 0, tokens_reserved = 0, tokens_available = total_tokens, total_participants = 0, registered = 0, task_submitted = 0, validated = 0, tokens_claimed = 0, } = stats;
    const distributionPercent = total_tokens > 0 ? (tokens_distributed / total_tokens) * 100 : 0;
    const participantsPercent = total_participants > 0 ? (tokens_claimed / total_participants) * 100 : 0;
    const reservedPercent = total_tokens > 0 ? (tokens_reserved / total_tokens) * 100 : 0;
    const availablePercent = total_tokens > 0 ? (tokens_available / total_tokens) * 100 : 0;
    return (_jsxs("div", { className: "stats-panel", children: [_jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-label", children: "\u0412\u0441\u0435\u0433\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432" }), _jsx("div", { className: "stat-value", children: total_tokens.toLocaleString() }), _jsx("div", { className: "stat-progress", children: _jsx("div", { className: "stat-bar", style: { width: '100%', background: 'var(--border)' } }) })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-label", children: "\u0420\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u043E" }), _jsx("div", { className: "stat-value primary", children: tokens_distributed.toLocaleString() }), _jsx("div", { className: "stat-progress", children: _jsx("div", { className: "stat-bar primary", style: {
                                width: `${distributionPercent}%`,
                                background: 'var(--primary)',
                            } }) }), _jsxs("div", { className: "stat-percent", children: [distributionPercent.toFixed(1), "%"] })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-label", children: "\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C" }), _jsx("div", { className: "stat-value", children: tokens_available.toLocaleString() }), _jsx("div", { className: "stat-progress", children: _jsx("div", { className: "stat-bar", style: {
                                width: `${availablePercent}%`,
                                background: 'var(--muted)',
                            } }) })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-label", children: "\u0417\u0430\u0440\u0435\u0437\u0435\u0440\u0432\u0438\u0440\u043E\u0432\u0430\u043D\u043E" }), _jsx("div", { className: "stat-value", children: tokens_reserved.toLocaleString() }), _jsx("div", { className: "stat-progress", children: _jsx("div", { className: "stat-bar", style: {
                                width: `${reservedPercent}%`,
                                background: 'var(--muted)',
                            } }) })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-label", children: "\u0412\u0441\u0435\u0433\u043E \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432" }), _jsx("div", { className: "stat-value", children: total_participants.toLocaleString() })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-label", children: "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043E" }), _jsx("div", { className: "stat-value", children: registered.toLocaleString() }), _jsx("div", { className: "stat-progress", children: _jsx("div", { className: "stat-bar", style: {
                                width: total_participants > 0 ? `${(registered / total_participants) * 100}%` : '0%',
                                background: '#4CAF50',
                            } }) })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-label", children: "\u0417\u0430\u0434\u0430\u043D\u0438\u044F \u043F\u043E\u0434\u0430\u043D\u044B" }), _jsx("div", { className: "stat-value", children: task_submitted.toLocaleString() }), _jsx("div", { className: "stat-progress", children: _jsx("div", { className: "stat-bar", style: {
                                width: total_participants > 0 ? `${(task_submitted / total_participants) * 100}%` : '0%',
                                background: '#FF9800',
                            } }) })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-label", children: "\u0412\u0430\u043B\u0438\u0434\u0438\u0440\u043E\u0432\u0430\u043D\u043E" }), _jsx("div", { className: "stat-value", children: validated.toLocaleString() }), _jsx("div", { className: "stat-progress", children: _jsx("div", { className: "stat-bar", style: {
                                width: total_participants > 0 ? `${(validated / total_participants) * 100}%` : '0%',
                                background: '#2196F3',
                            } }) })] }), _jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-label", children: "\u0422\u043E\u043A\u0435\u043D\u044B \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u044B" }), _jsx("div", { className: "stat-value success", children: tokens_claimed.toLocaleString() }), _jsx("div", { className: "stat-progress", children: _jsx("div", { className: "stat-bar success", style: {
                                width: `${participantsPercent}%`,
                                background: '#4CAF50',
                            } }) }), _jsxs("div", { className: "stat-percent", children: [participantsPercent.toFixed(1), "%"] })] })] }));
}

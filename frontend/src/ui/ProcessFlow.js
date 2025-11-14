import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ProcessFlow({ registered, taskSubmitted, validated, tokensClaimed, total, }) {
    const steps = [
        { label: 'Регистрация', count: registered, total },
        { label: 'Подача задания', count: taskSubmitted, total },
        { label: 'Валидация', count: validated, total },
        { label: 'Получение токена', count: tokensClaimed, total },
    ];
    return (_jsx("div", { className: "process-flow", children: steps.map((step, idx) => {
            const isActive = step.count > 0;
            const percent = step.total > 0 ? (step.count / step.total) * 100 : 0;
            return (_jsxs("div", { className: `process-step ${isActive ? 'active' : ''}`, children: [_jsx("div", { className: "step-icon", children: step.count > 0 ? '✓' : idx + 1 }), _jsx("div", { className: "step-label", children: step.label }), _jsxs("div", { className: "step-label", style: { marginTop: 4, fontSize: 12, fontWeight: 700 }, children: [step.count, " / ", step.total] }), percent > 0 && (_jsx("div", { style: { marginTop: 8, width: '100%', maxWidth: 80 }, children: _jsx("div", { className: "stat-progress", children: _jsx("div", { className: "stat-bar", style: {
                                    width: `${percent}%`,
                                    background: isActive ? 'var(--primary)' : 'var(--border)',
                                } }) }) }))] }, idx));
        }) }));
}

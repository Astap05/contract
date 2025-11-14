export async function runPrototypeDemo(params) {
    const { participants, totalTokens, denom, log } = params;
    let contractBalance = totalTokens;
    log(`ДЕМО: развёрнут контракт, пополнено ${totalTokens} ${denom}`);
    for (let i = 0; i < participants; i++) {
        const participant = `demo${i + 1}`;
        let participantBalance = 0;
        log(`\n[${i + 1}/${participants}] Участник: ${participant}`);
        log(`  - Зарегистрирован`);
        log(`  - Отправил задание: task #${i}`);
        log(`  - Задание валидировано держателем эмиссии (issuer)`);
        // Псевдо-выплата
        if (contractBalance <= 0) {
            log(`  - Ошибка: на контракте закончились токены`);
            break;
        }
        const before = contractBalance;
        contractBalance -= 1;
        participantBalance += 1;
        log(`  - Выплата: 1 ${denom} отправлено ОТ контракта К ${participant}`);
        log(`    Баланс контракта: ${before} -> ${contractBalance} (−1)`);
        log(`    Баланс участника ${participant}: ${participantBalance}`);
        // Небольшая задержка для наглядности
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 30));
    }
    log(`\nИТОГО: распределено ${totalTokens - contractBalance} из ${totalTokens} ${denom}`);
}

import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())

// SSE helper
function sse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)
  return { send }
}

async function runDemo({ res, participants, total, denom, delay, amounts, manual }) {
  const { send } = sse(res)
  console.log(`[DEMO] start participants=${participants} total=${total} denom=${denom} manual=${manual}`)

  let contract = total
  let reserved = 0
  send({ line: `ДЕМО-сервер: развёрнут контракт, пополнено ${total} ${denom}` })

  for (let i = 0; i < participants; i++) {
    const p = `srv${i + 1}`
    send({ line: `\n[${i + 1}/${participants}] Участник: ${p}` })
    send({ line: `  - Зарегистрирован` })
    send({ line: `  - Отправил задание: task #${i}` })

    const amount = amounts?.[i] ?? 1
    if (amount <= 0) {
      send({ line: `  - Решение: выплат не будет` })
      continue
    }

    send({ line: `  - Задание валидировано держателем эмиссии (issuer)` })

    if (contract < amount) {
      send({ line: `  - Ошибка: недостаточно средств для выплаты ${amount} ${denom}` })
      break
    }

    if (manual) {
      send({ line: `  - Администратор одобрил выплату ${amount} ${denom}` })
    }

    const before = contract
    contract -= amount
    reserved += amount
    send({ line: `  - Выплата: ${amount} ${denom} отправлено ОТ контракта К ${p}` })
    send({ line: `    Баланс контракта: ${before} -> ${contract} (−${amount})` })
    console.log(`[DEMO] paid ${amount} ${denom} to ${p} | ${before} -> ${contract}`)
    if (delay > 0) await new Promise((r) => setTimeout(r, delay))
  }

  send({ line: `\nИТОГО: распределено ${total - contract} из ${total} ${denom}, зарезервировано ${reserved}` })
  res.end()
  console.log('[DEMO] done')
}

app.get('/demo', async (req, res) => {
  const participants = Number(req.query.participants || '10')
  const total = Number(req.query.total || participants)
  const denom = String(req.query.denom || 'utoken')
  const delay = Number(req.query.delay || '5') // ms
  await runDemo({ res, participants, total, denom, delay, manual: false })
})

// Быстрая версия без задержки
app.get('/demo-fast', async (req, res) => {
  const participants = Number(req.query.participants || '10')
  const total = Number(req.query.total || participants)
  const denom = String(req.query.denom || 'utoken')
  await runDemo({ res, participants, total, denom, delay: 0, manual: false })
})

app.get('/manual-demo', async (req, res) => {
  const participants = Number(req.query.participants || '5')
  const total = Number(req.query.total || '50')
  const denom = String(req.query.denom || 'utoken')
  const amountsRaw = String(req.query.amounts || '')
  const amountList = amountsRaw
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => !Number.isNaN(v) && v >= 0)

  await runDemo({
    res,
    participants,
    total,
    denom,
    delay: 0,
    amounts: amountList,
    manual: true,
  })
})

const port = process.env.PORT || 8787
app.listen(port, () => console.log(`Demo server running http://localhost:${port}`))



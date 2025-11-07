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

async function runDemo({ res, participants, total, denom, delay }) {
  const { send } = sse(res)
  console.log(`[DEMO] start participants=${participants} total=${total} denom=${denom} delay=${delay}`)

  let contract = total
  send({ line: `ДЕМО-сервер: развёрнут контракт, пополнено ${total} ${denom}` })

  for (let i = 0; i < participants; i++) {
    const p = `srv${i + 1}`
    send({ line: `\n[${i + 1}/${participants}] Участник: ${p}` })
    send({ line: `  - Зарегистрирован` })
    send({ line: `  - Отправил задание: task #${i}` })
    send({ line: `  - Задание валидировано держателем эмиссии (issuer)` })

    if (contract <= 0) {
      send({ line: `  - Ошибка: на контракте закончились токены` })
      break
    }
    const before = contract
    contract -= 1
    send({ line: `  - Выплата: 1 ${denom} отправлено ОТ контракта К ${p}` })
    send({ line: `    Баланс контракта: ${before} -> ${contract} (−1)` })
    console.log(`[DEMO] paid 1 ${denom} to ${p} | ${before} -> ${contract}`)
    if (delay > 0) await new Promise((r) => setTimeout(r, delay))
  }

  send({ line: `\nИТОГО: распределено ${total - contract} из ${total} ${denom}` })
  res.end()
  console.log('[DEMO] done')
}

app.get('/demo', async (req, res) => {
  const participants = Number(req.query.participants || '10')
  const total = Number(req.query.total || participants)
  const denom = String(req.query.denom || 'utoken')
  const delay = Number(req.query.delay || '5') // ms
  await runDemo({ res, participants, total, denom, delay })
})

// Быстрая версия без задержки
app.get('/demo-fast', async (req, res) => {
  const participants = Number(req.query.participants || '10')
  const total = Number(req.query.total || participants)
  const denom = String(req.query.denom || 'utoken')
  await runDemo({ res, participants, total, denom, delay: 0 })
})

const port = process.env.PORT || 8787
app.listen(port, () => console.log(`Demo server running http://localhost:${port}`))



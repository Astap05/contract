#!/usr/bin/env node
/**
 * Демонстрация интеграции Pocket Flow.
 */

import { createGraph, createNode, SharedStore } from './core.mjs'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import http from 'node:http'

const DEMO_SERVER = 'http://localhost:8787'

async function checkServer() {
  return new Promise((resolve) => {
    const req = http.request(`${DEMO_SERVER}/`, { method: 'GET' }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500)
    })
    req.on('error', () => resolve(false))
    req.end()
  })
}

async function runDemoSSE({ participants, total, denom, amounts }) {
  const url = new URL('/manual-demo', DEMO_SERVER)
  url.searchParams.set('participants', participants)
  url.searchParams.set('total', total)
  url.searchParams.set('denom', denom)
  if (amounts.length > 0) {
    url.searchParams.set('amounts', amounts.join(','))
  }

  const events = []

  await new Promise((resolve, reject) => {
    const req = http.request(url, (res) => {
      res.setEncoding('utf8')
      let buffer = ''
      res.on('data', (chunk) => {
        buffer += chunk
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          const dataLine = part
            .split('\n')
            .find((line) => line.startsWith('data: '))
          if (dataLine) {
            const payload = JSON.parse(dataLine.slice(6))
            events.push(payload.line)
          }
        }
      })
      res.on('end', resolve)
    })
    req.on('error', reject)
    req.end()
  })

  return events
}

const flow = createGraph((graph) => {
  graph
    .addNode(
      createNode('collect-input', 'Сбор параметров демо у пользователя', async (ctx) => {
        const rl = readline.createInterface({ input, output })
        const participants = Number(await rl.question('Сколько участников смоделировать? (по умолчанию 25) ')) || 25
        const totalTokens = Number(await rl.question('Сколько всего токенов? (по умолчанию 100) ')) || 100
        const denom = (await rl.question('Деноминация (по умолчанию utoken) ')) || 'utoken'
        const amountsLine = await rl.question('Выплаты (например "10,5,20,0"); пусто → равные? ')
        rl.write('\n')
        rl.close()

        const amounts = amountsLine
          .split(',')
          .map((v) => Number(v.trim()))
          .filter((v) => !Number.isNaN(v) && v >= 0)

        ctx.merge({ participants, totalTokens, denom, amounts })
        console.log(`→ Параметры: ${participants} участников, ${totalTokens} ${denom}`)
      })
    )
    .addNode(
      createNode('check-server', 'Проверка, что демо-сервер Pocket Flow запущен', async (ctx) => {
        const ok = await checkServer()
        if (!ok) {
          throw new Error(
            `Demo сервер не отвечает на ${DEMO_SERVER}. Запустите фронтенд командой "npm run dev" из каталога frontend.`
          )
        }
        console.log('→ Demo сервер доступен, продолжаем…')
      })
    )
    .addNode(
      createNode('run-distribution', 'Запуск демо процесса распределения токенов', async (ctx) => {
        const participants = ctx.read('participants')
        const totalTokens = ctx.read('totalTokens')
        const denom = ctx.read('denom')
        const amounts = ctx.read('amounts') ?? []

        console.log('→ Отправляем поток событий…')
        const logs = await runDemoSSE({ participants, total: totalTokens, denom, amounts })
        ctx.merge({ logs })
        console.log(`← Получено ${logs.length} событий.`)
      })
    )
    .addNode(
      createNode('summarize', 'Сбор итоговой статистики', async (ctx) => {
        const logs = ctx.read('logs') ?? []
        let distributed = 0
        let validated = 0
        for (const line of logs) {
          if (line.includes('валидировано')) validated += 1
          if (line.includes('Выплата:')) {
            const match = line.match(/Выплата: (\d+)/)
            if (match) distributed += Number(match[1])
          }
        }
        const totalTokens = ctx.read('totalTokens')
        ctx.merge({
          summary: {
            distributed,
            remaining: Math.max(totalTokens - distributed, 0),
            validated,
            logsSample: logs.slice(-5),
          },
        })
      })
    )

  graph.connect('collect-input', 'check-server')
  graph.connect('check-server', 'run-distribution')
  graph.connect('run-distribution', 'summarize')
})

async function main() {
  console.log('=== Pocket Flow Manual Distribution Demo ===')
  const initialStore = new SharedStore()
  const snapshots = await flow.execute({ entryPoints: ['collect-input'], store: initialStore })

  console.log('\n=== Итог ===')
  const summary = snapshots.summary ?? {}
  console.log(`Распределено токенов: ${summary.distributed ?? 0}`)
  console.log(`Осталось токенов:     ${summary.remaining ?? 0}`)
  console.log(`Валидировано заданий: ${summary.validated ?? 0}`)
  console.log('\nПоследние события:')
  for (const line of summary.logsSample ?? []) {
    console.log(` • ${line}`)
  }
  console.log('\nPocket Flow завершил сценарий ручного распределения. Подключайте агентов для анализа логов или выдачи рекомендаций.')
}

main().catch((err) => {
  console.error('Ошибка выполнения Pocket Flow:', err.message)
  process.exitCode = 1
})



#!/usr/bin/env node
// O medidor. Roda as tabelas e cospe os numeros que vao para o README.
//
//   node ferramentas/medidor.js              todas (sem os pesados)
//   node ferramentas/medidor.js tabela       quem ganha cada retangulo ate 26 casas, leves
//   node ferramentas/medidor.js pesados      8x3, 6x4 e 5x5
//   node ferramentas/medidor.js caixas       as caixas de fosforo do 3x3
//   node ferramentas/medidor.js maquina      a maquina aprendendo, 1000 sementes x 200 partidas
//   node ferramentas/medidor.js juiz         o juiz sem memoria contra o motor

import { tabela, resolve, PESADOS, caixas, aprendizado, juizNoInicio, juizEmTudo } from '../js/medidas.js'

const n = (x) => x.toLocaleString('pt-BR')
const pad = (s, w) => String(s).padStart(w)

function linha (l) {
  return `   ${pad(`${l.largura}x${l.altura}`, 4)}  ganham as ${l.ganha.padEnd(7)} em ${pad(l.dist, 2)} lances   ${pad(n(l.posicoes), 10)} posicoes`
}

function tabelaLeve () {
  console.log('\n== quem ganha cada retangulo (brancas comecam) ==')
  for (const l of tabela()) console.log(linha(l))
}

function tabelaPesados () {
  console.log('\n== os pesados ==')
  for (const [w, h] of PESADOS) {
    const t = Date.now()
    const l = resolve(w, h)
    console.log(`${linha(l)}   ${((Date.now() - t) / 1000).toFixed(1)} s`)
  }
}

function tabelaCaixas () {
  const c = caixas()
  console.log('\n== as caixas de fosforo do 3x3 (pretas na vez, alcancaveis, com lance) ==')
  console.log(`   sem juntar espelhos: ${c.semEspelho}`)
  console.log(`   juntando espelhos:   ${c.caixas}   por lance: ${Object.entries(c.porLance).map(([k, v]) => `lance ${k}: ${v}`).join(', ')}`)
  console.log(`   caixas com um lance so: ${c.deUmLance}`)
  console.log(`   contas: ${c.contas}, das quais ${c.ruins} sao de lances que perdem`)
  for (const d of c.desenhos) console.log(`     ${d}`)
}

function tabelaMaquina () {
  console.log('\n== a maquina aprendendo: 1000 sementes de 200 partidas ==')
  for (const l of aprendizado()) {
    console.log(`   contra o ${l.tipo.padEnd(9)} derrotas: min ${l.minimo}, max ${l.maximo}, media ${l.media.toFixed(3)}`)
    console.log(`      histograma: ${Object.entries(l.histograma).map(([k, v]) => `${k}:${v}`).join('  ')}`)
    console.log(`      contas boas jogadas fora: ${l.punidasBoas}   caixas visitadas: ${l.caixasVisitadas}`)
    console.log(`      ultima derrota mais tardia: partida ${l.ultimaDerrotaMax}   sementes sem derrota depois da 100a: ${l.semDerrotaDepois100}`)
  }
}

function tabelaJuiz () {
  console.log('\n== o juiz (minimax puro, sem memoria) contra o motor, no inicio ==')
  for (const l of juizNoInicio()) {
    console.log(`   ${pad(`${l.largura}x${l.altura}`, 4)}  motor: ${l.motor.padEnd(16)} juiz: ${l.juiz.padEnd(16)} ${l.concorda ? 'ok' : 'DIVERGE'}   ${pad(n(l.nosJuiz), 10)} nos x ${pad(n(l.posicoes), 7)} posicoes`)
  }
  console.log('\n== o juiz em todas as posicoes alcancaveis ==')
  for (const [w, h] of [[3, 3], [4, 3], [3, 4], [5, 3], [3, 5]]) {
    const r = juizEmTudo(w, h)
    console.log(`   ${w}x${h}  ${pad(n(r.posicoes), 6)} posicoes, ${r.divergencias} divergencias`)
  }
}

const partes = {
  tabela: tabelaLeve,
  pesados: tabelaPesados,
  caixas: tabelaCaixas,
  maquina: tabelaMaquina,
  juiz: tabelaJuiz
}

const pedido = process.argv[2]
if (!pedido) {
  for (const [nome, f] of Object.entries(partes)) if (nome !== 'pesados') f()
} else if (partes[pedido]) {
  partes[pedido]()
} else {
  console.error(`nao conheco "${pedido}". conheco: ${Object.keys(partes).join(', ')}`)
  process.exit(1)
}

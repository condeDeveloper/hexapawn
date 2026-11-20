// Os numeros do README, presos.

import test from 'node:test'
import assert from 'node:assert/strict'

import { tabela, caixas, aprendizado, juizNoInicio, juizEmTudo } from '../js/medidas.js'

const em = (lista, w, h) => lista.find((l) => l.largura === w && l.altura === h)

test('a tabela leve: quem ganha e em quantos lances', () => {
  const t = tabela()
  assert.equal(t.length, 26)
  const resumo = Object.fromEntries(t.map((l) => [`${l.largura}x${l.altura}`, `${l.ganha[0]}${l.dist}`]))
  assert.deepEqual(resumo, {
    '1x3': 'b1', '2x3': 'p2', '3x3': 'p6', '4x3': 'b5', '5x3': 'b7', '6x3': 'p8', '7x3': 'b9',
    '1x4': 'p2', '2x4': 'p6', '3x4': 'p8', '4x4': 'b11', '5x4': 'p14',
    '1x5': 'b3', '2x5': 'p6', '3x5': 'b11', '4x5': 'p16',
    '1x6': 'p4', '2x6': 'p10', '3x6': 'p14', '4x6': 'b21',
    '1x7': 'b5', '2x7': 'p10', '3x7': 'b19',
    '1x8': 'p6', '2x8': 'p14', '3x8': 'p22'
  })
})

test('com duas colunas as pretas ganham sempre, de 3 a 8 linhas', () => {
  for (let h = 3; h <= 8; h++) assert.equal(em(tabela(), 2, h).ganha, 'pretas')
})

test('a partida mais longa da tabela leve e o 3x8: 22 lances', () => {
  const t = tabela()
  const max = Math.max(...t.map((l) => l.dist))
  assert.equal(max, 22)
  assert.deepEqual(t.filter((l) => l.dist === max).map((l) => `${l.largura}x${l.altura}`), ['3x8'])
})

test('as posicoes guardadas, das menores as maiores', () => {
  const t = tabela()
  assert.equal(em(t, 3, 3).posicoes, 131)
  assert.equal(em(t, 4, 4).posicoes, 13855)
  assert.equal(em(t, 7, 3).posicoes, 439278)
  assert.equal(em(t, 4, 6).posicoes, 259792)
})

test('as caixas de fosforo: 19, nos lances 2, 4 e 6', () => {
  const c = caixas()
  assert.equal(c.caixas, 19)
  assert.deepEqual(c.porLance, { 2: 2, 4: 10, 6: 7 })
  assert.equal(c.semEspelho, 37)
  assert.equal(c.deUmLance, 2)
  assert.equal(c.desenhos.length, 19)
})

test('as contas: 47 no total, 17 de lances que perdem', () => {
  const c = caixas()
  assert.equal(c.contas, 47)
  assert.equal(c.ruins, 17)
  assert.equal(c.contas - c.ruins, 30)
})

test('a regra de Gardner nunca joga fora uma conta boa', () => {
  for (const l of aprendizado()) assert.equal(l.punidasBoas, 0, l.tipo)
})

test('por isso a maquina nunca perde mais de 17 vezes, e o maximo medido e 16', () => {
  const [esperto, aleatorio] = aprendizado()
  assert.ok(esperto.maximo <= caixas().ruins)
  assert.ok(aleatorio.maximo <= caixas().ruins)
  assert.equal(aleatorio.maximo, 16)
  assert.equal(aleatorio.minimo, 8)
})

test('contra o adversario esperto: sempre 9 ou 10 derrotas, 10 em 938 das 1000 sementes', () => {
  const [esperto] = aprendizado()
  assert.equal(esperto.tipo, 'esperto')
  assert.deepEqual(esperto.histograma, { 9: 62, 10: 938 })
  assert.equal(esperto.media, 9.938)
  assert.equal(esperto.caixasVisitadas, 14)
})

test('contra o aleatorio a media e 12,34 e todas as 19 caixas aparecem', () => {
  const [, aleatorio] = aprendizado()
  assert.equal(aleatorio.media, 12.34)
  assert.equal(aleatorio.caixasVisitadas, 19)
  assert.deepEqual(aleatorio.histograma, { 8: 2, 9: 12, 10: 75, 11: 174, 12: 316, 13: 224, 14: 127, 15: 50, 16: 20 })
  // Tudo somado, 22.278 contas jogadas fora nas 2000 sessoes, nenhuma boa.
  const [esperto] = aprendizado()
  assert.equal(Math.round(esperto.media * 1000 + aleatorio.media * 1000), 22278)
})

test('a ultima derrota pode cair na partida 200: o aprendizado nao tem prazo', () => {
  const [esperto, aleatorio] = aprendizado()
  assert.equal(esperto.ultimaDerrotaMax, 200)
  assert.equal(aleatorio.ultimaDerrotaMax, 200)
  assert.equal(esperto.semDerrotaDepois100, 678)
  assert.equal(aleatorio.semDerrotaDepois100, 414)
})

test('o juiz concorda no inicio dos 15 tabuleiros que alcanca', () => {
  const j = juizNoInicio()
  assert.equal(j.length, 15)
  for (const l of j) assert.ok(l.concorda, `${l.largura}x${l.altura}`)
})

test('no 4x4 a memoria corta 303 vezes: 4.197.973 nos contra 13.855 posicoes', () => {
  const l = em(juizNoInicio(), 4, 4)
  assert.equal(l.nosJuiz, 4197973)
  assert.equal(l.posicoes, 13855)
  assert.equal(Math.round(l.nosJuiz / l.posicoes), 303)
})

test('o juiz concorda em todas as posicoes de cinco tabuleiros', () => {
  for (const [w, h, n] of [[3, 3, 131], [4, 3, 1084], [3, 4, 755], [5, 3, 8348], [3, 5, 2522]]) {
    const r = juizEmTudo(w, h)
    assert.equal(r.posicoes, n, `${w}x${h}`)
    assert.equal(r.divergencias, 0, `${w}x${h}`)
  }
})

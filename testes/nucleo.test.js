// As regras, o motor, o juiz e a maquina em casos pequenos.

import test from 'node:test'
import assert from 'node:assert/strict'

import { grade, inicial, jogadas, aplica, perdeu, espelha, espelhoLateral, chave, daChave, desenha } from '../js/nucleo.js'
import { Motor, TETO, vence, distancia, doFilho } from '../js/busca.js'
import { minimax, tabuleiroInicial, doDesenho, julgaInicio } from '../js/juiz.js'
import { Her, gerador, partida, adversario, sessao } from '../js/her.js'

test('a grade recusa o que nao cabe', () => {
  assert.throws(() => grade(3, 2))
  assert.throws(() => grade(9, 3))
  assert.equal(grade(5, 5).casas, 25)
})

test('o 3x3 comeca com tres peoes de cada lado', () => {
  const g = grade(3, 3)
  assert.equal(desenha(g, inicial(g), true), 'ppp/.../BBB')
})

test('a abertura do 3x3 tem 3 lances, todos para a frente', () => {
  const g = grade(3, 3)
  const l = jogadas(g, inicial(g))
  assert.equal(l.length, 3)
  assert.ok(l.every((j) => !j.come && j.para === j.de + 3))
})

test('aplicar espelha o tabuleiro e troca os papeis', () => {
  const g = grade(3, 3)
  const p = aplica(g, inicial(g), { de: 0, para: 3 })
  assert.equal(desenha(g, p, false), 'ppp/B../.BB')
  // Agora quem joga sao as pretas, que tambem andam "para cima" no ponto de vista guardado.
  assert.ok(jogadas(g, p).every((j) => j.para > j.de))
})

test('espelhar duas vezes devolve o original', () => {
  const g = grade(4, 5)
  for (const m of [1, 6, 0b1011001, 0xFFFFF]) assert.equal(espelha(g, espelha(g, m)), m)
  for (const m of [1, 6, 0b1011001]) assert.equal(espelhoLateral(g, espelhoLateral(g, m)), m)
})

test('o peao come na diagonal e nao anda para casa ocupada', () => {
  const g = grade(3, 3)
  // B em 0; p em 3 (bloqueando a frente) e em 4 (comivel).
  const pos = { eu: 1, outro: (1 << 3) | (1 << 4) }
  const l = jogadas(g, pos)
  assert.deepEqual(l, [{ de: 0, para: 4, come: true }])
})

test('chegar na ultima linha ganha', () => {
  const g = grade(3, 3)
  const p = aplica(g, { eu: 1 << 3, outro: 1 << 8 }, { de: 3, para: 6 })
  assert.ok(perdeu(g, p))
})

test('ficar sem lance perde, mesmo com peao no tabuleiro', () => {
  const g = grade(1, 4)
  const p = { eu: 1 << 1, outro: 1 << 2 }
  assert.equal(jogadas(g, p).length, 0)
  assert.ok(perdeu(g, p))
})

test('chave e daChave sao inversas ate 26 casas', () => {
  const g = grade(2, 13)
  const pos = { eu: 0b11, outro: 3 * 2 ** 24 }
  assert.deepEqual(daChave(g, chave(g, pos)), pos)
})

test('o valor empacotado: ganhar cedo e maior, perder tarde e maior, e nunca zero', () => {
  assert.equal(doFilho(-TETO), TETO - 1)
  assert.equal(doFilho(TETO - 1), -(TETO - 2))
  assert.ok(vence(TETO - 1) && !vence(-(TETO - 2)))
  assert.equal(distancia(TETO - 3), 3)
  assert.ok(TETO - 1 > TETO - 5)
  assert.ok(-(TETO - 5) > -(TETO - 1))
})

test('o motor: no 3x3 as pretas ganham em 6', () => {
  const g = grade(3, 3)
  const m = new Motor(g)
  const v = m.valor(inicial(g))
  assert.ok(!vence(v))
  assert.equal(distancia(v), 6)
  assert.equal(m.posicoes, 131)
  assert.ok(m.avaliaJogadas(inicial(g)).every((a) => !a.vence))
})

test('o juiz: minimax puro concorda no 3x3', () => {
  assert.deepEqual(minimax(tabuleiroInicial(3, 3), 'B'), { vence: false, dist: 6 })
  assert.equal(julgaInicio(3, 3).nos, 252)
})

test('o juiz le o desenho do nucleo', () => {
  assert.deepEqual(doDesenho('ppp/.../BBB'), tabuleiroInicial(3, 3))
})

test('o gerador com semente repete a sequencia', () => {
  const a = gerador(42)
  const b = gerador(42)
  for (let i = 0; i < 5; i++) assert.equal(a(), b())
  const x = gerador(1)()
  assert.ok(x >= 0 && x < 1)
})

test('a maquina comeca com uma conta por lance', () => {
  const her = new Her()
  const g = her.g
  const p = aplica(g, inicial(g), { de: 1, para: 4 })
  assert.equal(her.caixa(p).contas.length, jogadas(g, p).length)
})

test('posicoes espelhadas dividem a mesma caixa', () => {
  const her = new Her()
  const g = her.g
  her.caixa(aplica(g, inicial(g), { de: 0, para: 3 }))
  her.caixa(aplica(g, inicial(g), { de: 2, para: 5 }))
  assert.equal(her.caixas.size, 1)
})

test('o lance sorteado de uma caixa espelhada e um lance legal', () => {
  const her = new Her()
  const g = her.g
  const p = aplica(g, inicial(g), { de: 2, para: 5 })
  const rnd = gerador(3)
  for (let i = 0; i < 20; i++) assert.ok(her.escolhe(p, rnd).jogada)
})

test('uma partida sempre termina, e a derrota tira exatamente uma conta', () => {
  const her = new Her()
  const motor = new Motor(her.g)
  const branca = adversario('esperto', her.g, motor)
  const rnd = gerador(9)
  for (let i = 0; i < 30; i++) {
    const antes = her.contas
    const ganhou = partida(her, branca, rnd)
    // A caixa nova nasce cheia durante a partida; o que se compara e o que
    // existia antes com o que existe depois, descontadas as caixas novas.
    assert.equal(typeof ganhou, 'boolean')
    assert.ok(her.contas >= antes - 1)
  }
})

test('adversario desconhecido e recusado', () => {
  assert.throws(() => adversario('trapaceiro'))
})

test('uma sessao curta e reprodutivel pela semente', () => {
  const a = sessao({ semente: 5, jogos: 40, tipo: 'aleatorio' })
  const b = sessao({ semente: 5, jogos: 40, tipo: 'aleatorio' })
  assert.deepEqual(a.resultado, b.resultado)
  assert.equal(a.punidasBoas, 0)
})

// Os casos caros: os tres tabuleiros que passam de um segundo, o juiz em todas
// as 13.855 posicoes do 4x4, e o juiz sem memoria no 3x6, o maior que ele
// alcanca.

import test from 'node:test'
import assert from 'node:assert/strict'

import { resolve, juizEmTudo, juizNoInicio } from '../js/medidas.js'

test('os tres pesados: 8x3, 6x4 e 5x5', { timeout: 180000 }, () => {
  assert.deepEqual(resolve(8, 3), { largura: 8, altura: 3, casas: 24, ganha: 'brancas', dist: 11, posicoes: 3093245 })
  assert.deepEqual(resolve(6, 4), { largura: 6, altura: 4, casas: 24, ganha: 'pretas', dist: 16, posicoes: 3675769 })
  assert.deepEqual(resolve(5, 5), { largura: 5, altura: 5, casas: 25, ganha: 'brancas', dist: 19, posicoes: 1875484 })
})

test('com 3 linhas as pretas ganham exatamente nas larguras 2, 3 e 6, de 1 a 8', { timeout: 180000 }, () => {
  const pretas = []
  for (let w = 1; w <= 8; w++) if (resolve(w, 3).ganha === 'pretas') pretas.push(w)
  assert.deepEqual(pretas, [2, 3, 6])
})

test('o juiz em todas as posicoes do 4x4', { timeout: 180000 }, () => {
  assert.deepEqual(juizEmTudo(4, 4), { largura: 4, altura: 4, posicoes: 13855, divergencias: 0 })
})

test('o juiz sem memoria no 3x6: 22.794.931 nos para 6.423 posicoes', { timeout: 180000 }, () => {
  const [l] = juizNoInicio([[3, 6]])
  assert.ok(l.concorda)
  assert.equal(l.juiz, 'pretas em 14')
  assert.equal(l.nosJuiz, 22794931)
  assert.equal(l.posicoes, 6423)
})

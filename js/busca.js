// Quem ganha, e em quantos lances.
//
// O hexapawn nao tem ciclo (todo lance avanca um peao), entao uma busca que
// desce com memoria resolve. O valor vai empacotado num inteiro so:
//
//   vitoria em d lances  ->  +(TETO - d)
//   derrota em d lances  ->  -(TETO - d)
//
// Assim "maior e melhor" vale direto: ganhar mais cedo e maior, perder mais
// tarde e maior. Nunca sai zero, porque o hexapawn nao empata; isso tambem
// afasta o -0 que um empate negado daria.

import { jogadas, aplica, chave } from './nucleo.js'

export const TETO = 1000

export const vence = (v) => v > 0
export const distancia = (v) => TETO - Math.abs(v)

// O valor de um lance, do ponto de vista de quem joga, a partir do valor do
// filho (do ponto de vista do outro).
export function doFilho (c) {
  return c < 0 ? -c - 1 : -c + 1
}

export class Motor {
  constructor (g) {
    this.g = g
    this.memo = new Map()
    this.nos = 0
  }

  valor (pos) {
    const k = chave(this.g, pos)
    const m = this.memo.get(k)
    if (m !== undefined) return m
    this.nos++
    let melhor
    if (pos.outro & this.g.linha0) {
      melhor = -TETO
    } else {
      const lista = jogadas(this.g, pos)
      if (lista.length === 0) melhor = -TETO
      else {
        melhor = -Infinity
        for (const j of lista) {
          const v = doFilho(this.valor(aplica(this.g, pos, j)))
          if (v > melhor) melhor = v
        }
      }
    }
    this.memo.set(k, melhor)
    return melhor
  }

  avaliaJogadas (pos) {
    return jogadas(this.g, pos).map((j) => {
      const v = doFilho(this.valor(aplica(this.g, pos, j)))
      return { jogada: j, valor: v, vence: vence(v), dist: distancia(v) }
    })
  }

  get posicoes () { return this.memo.size }
}

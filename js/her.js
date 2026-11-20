// HER, a maquina de caixas de fosforo do Martin Gardner (Scientific American,
// marco de 1962), jogando com as pretas, que sao o lado que ganha no 3x3.
//
// Uma caixa por posicao em que as pretas jogam, juntando as que sao espelho
// uma da outra. Cada caixa comeca com uma conta para cada lance possivel. Na
// vez da maquina, sorteia-se uma conta da caixa e joga-se o lance dela. Quando
// a maquina perde, a conta do ULTIMO lance que ela fez e jogada fora. Quando
// ganha, nada muda. Se a maquina chega numa caixa vazia, ela desiste: conta
// como derrota, e a conta que levou ate ali e jogada fora.
//
// O sorteio usa um gerador com semente (mulberry32), para a tabela do README
// sair igual em qualquer maquina.

import { grade, inicial, jogadas, aplica, perdeu, chave, espelhoLateral } from './nucleo.js'
import { Motor, vence, doFilho } from './busca.js'

export function gerador (semente) {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function espelhaCasa (g, i) {
  const r = Math.floor(i / g.largura)
  return r * g.largura + g.largura - 1 - (i % g.largura)
}

// A posicao canonica (a menor chave entre ela e o espelho) e se foi espelhada.
function canonica (g, pos) {
  const esp = { eu: espelhoLateral(g, pos.eu), outro: espelhoLateral(g, pos.outro) }
  const k1 = chave(g, pos)
  const k2 = chave(g, esp)
  return k2 < k1 ? { k: k2, espelhada: true } : { k: k1, espelhada: false }
}

export class Her {
  constructor (largura = 3, altura = 3) {
    this.g = grade(largura, altura)
    this.caixas = new Map()
  }

  caixa (pos) {
    const { k, espelhada } = canonica(this.g, pos)
    if (!this.caixas.has(k)) {
      // As contas guardam o lance no quadro canonico.
      const lances = jogadas(this.g, pos).map((j) => espelhada ? { de: espelhaCasa(this.g, j.de), para: espelhaCasa(this.g, j.para) } : { de: j.de, para: j.para })
      this.caixas.set(k, lances)
    }
    return { contas: this.caixas.get(k), espelhada }
  }

  // Sorteia um lance, ou devolve null para desistir.
  escolhe (pos, rnd) {
    const { contas, espelhada } = this.caixa(pos)
    if (contas.length === 0) return { jogada: null, contas, indice: -1 }
    const indice = Math.floor(rnd() * contas.length)
    const c = contas[indice]
    const de = espelhada ? espelhaCasa(this.g, c.de) : c.de
    const para = espelhada ? espelhaCasa(this.g, c.para) : c.para
    const jogada = jogadas(this.g, pos).find((j) => j.de === de && j.para === para)
    return { jogada, contas, indice, pos }
  }

  get contas () {
    let s = 0
    for (const c of this.caixas.values()) s += c.length
    return s
  }
}

// Os adversarios das brancas.
//   aleatorio: qualquer lance, sorteado.
//   esperto:   o lance que o motor diz que ganha (o mais rapido), e entre os
//              que perdem, qualquer um. Contra pretas perfeitas tudo perde, entao
//              ele so ganha quando a maquina erra; e ai ele nunca deixa passar.
export function adversario (tipo, g, motor) {
  if (tipo === 'aleatorio') return (pos, rnd) => { const l = jogadas(g, pos); return l[Math.floor(rnd() * l.length)] }
  if (tipo === 'esperto') {
    return (pos, rnd) => {
      const av = motor.avaliaJogadas(pos)
      const ganham = av.filter((a) => a.vence)
      if (ganham.length) {
        const melhor = Math.min(...ganham.map((a) => a.dist))
        const l = ganham.filter((a) => a.dist === melhor)
        return l[Math.floor(rnd() * l.length)].jogada
      }
      return av[Math.floor(rnd() * av.length)].jogada
    }
  }
  throw new Error(`adversario desconhecido: ${tipo}`)
}

// Uma partida. Devolve true se a maquina ganhou. `aoPunir(pos, jogada)` e
// chamado a cada conta jogada fora, com a posicao e o lance que ela fazia.
export function partida (her, branca, rnd, aoPunir = () => {}) {
  const g = her.g
  let pos = inicial(g)
  let ultima = null
  const pune = () => {
    if (!ultima) return
    aoPunir(ultima.pos, ultima.jogada)
    ultima.contas.splice(ultima.indice, 1)
  }
  for (let vezBrancas = true; ; vezBrancas = !vezBrancas) {
    if (perdeu(g, pos)) {
      const maquinaPerdeu = !vezBrancas
      if (maquinaPerdeu) pune()
      return !maquinaPerdeu
    }
    if (vezBrancas) {
      pos = aplica(g, pos, branca(pos, rnd))
    } else {
      const e = her.escolhe(pos, rnd)
      if (!e.jogada) {
        pune()
        return false
      }
      ultima = e
      pos = aplica(g, pos, e.jogada)
    }
  }
}

// Uma sessao de `jogos` partidas a partir de uma maquina nova.
export function sessao ({ semente, jogos, tipo }) {
  const her = new Her()
  const motor = new Motor(her.g)
  const branca = adversario(tipo, her.g, motor)
  const rnd = gerador(semente)
  let derrotas = 0
  let ultimaDerrota = 0
  let punidasBoas = 0
  const resultado = []
  // Confere, a cada conta jogada fora, se o lance dela perdia mesmo.
  const aoPunir = (pos, j) => {
    const v = doFilho(motor.valor(aplica(her.g, pos, j)))
    if (vence(v)) punidasBoas++
  }
  for (let i = 1; i <= jogos; i++) {
    const ganhou = partida(her, branca, rnd, aoPunir)
    resultado.push(ganhou)
    if (!ganhou) { derrotas++; ultimaDerrota = i }
  }
  return { derrotas, ultimaDerrota, punidasBoas, contasNoFim: her.contas, caixas: her.caixas.size, resultado }
}

export { vence }

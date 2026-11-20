// As tabelas do README, uma funcao por tabela. Resultado guardado: varios
// testes pedem a mesma tabela, e refazer era pagar duas vezes.

import { grade, inicial, jogadas, aplica, perdeu, chave, espelhoLateral, desenha } from './nucleo.js'
import { Motor, vence, distancia, doFilho } from './busca.js'
import { minimax, doDesenho, julgaInicio } from './juiz.js'
import { sessao } from './her.js'

const cache = new Map()
function guardado (nome, f) {
  if (!cache.has(nome)) cache.set(nome, f())
  return cache.get(nome)
}

// Os tabuleiros caros ficam fora da tabela leve: passam de um segundo cada.
export const PESADOS = [[8, 3], [6, 4], [5, 5]]
const ehPesado = (w, h) => PESADOS.some(([a, b]) => a === w && b === h)

export function resolve (w, h) {
  return guardado(`r${w}x${h}`, () => {
    const g = grade(w, h)
    const m = new Motor(g)
    const v = m.valor(inicial(g))
    return { largura: w, altura: h, casas: w * h, ganha: vence(v) ? 'brancas' : 'pretas', dist: distancia(v), posicoes: m.posicoes }
  })
}

// Tabela 1: quem ganha cada retangulo, ate 26 casas.
export function tabela ({ pesados = false } = {}) {
  const linhas = []
  for (let h = 3; h <= 8; h++) {
    for (let w = 1; w <= 8; w++) {
      if (w * h > 26) continue
      if (ehPesado(w, h) && !pesados) continue
      linhas.push(resolve(w, h))
    }
  }
  return linhas
}

// Tabela 2: as caixas de fosforo do 3x3. Todas as posicoes em que as pretas
// jogam, alcancaveis desde o inicio, contadas de varios jeitos.
export function caixas () {
  return guardado('caixas', () => {
    const g = grade(3, 3)
    const m = new Motor(g)
    const visto = new Set([chave(g, inicial(g))])
    const fila = [[inicial(g), 0]]
    const pretas = []
    for (let q = 0; q < fila.length; q++) {
      const [p, lance] = fila[q]
      const fim = perdeu(g, p)
      if (lance % 2 === 1) pretas.push({ p, lance, fim })
      if (fim) continue
      for (const j of jogadas(g, p)) {
        const f = aplica(g, p, j)
        const k = chave(g, f)
        if (!visto.has(k)) { visto.add(k); fila.push([f, lance + 1]) }
      }
    }
    const canon = (p) => Math.min(chave(g, p), chave(g, { eu: espelhoLateral(g, p.eu), outro: espelhoLateral(g, p.outro) }))
    const vivas = pretas.filter((x) => !x.fim)
    const unicas = new Map()
    for (const x of vivas) { const k = canon(x.p); if (!unicas.has(k)) unicas.set(k, x) }
    const porLance = {}
    let contas = 0
    let ruins = 0
    let deUmLance = 0
    for (const x of unicas.values()) {
      porLance[x.lance + 1] = (porLance[x.lance + 1] || 0) + 1
      const av = m.avaliaJogadas(x.p)
      contas += av.length
      ruins += av.filter((a) => !a.vence).length
      if (av.length === 1) deUmLance++
    }
    return {
      semEspelho: new Set(vivas.map((x) => chave(g, x.p))).size,
      caixas: unicas.size,
      porLance,
      deUmLance,
      contas,
      ruins,
      desenhos: [...unicas.values()].map((x) => desenha(g, x.p, false))
    }
  })
}

// Tabela 3: a maquina aprendendo, 1000 sementes de 200 partidas cada.
export function aprendizado (sementes = 1000, jogos = 200) {
  return guardado(`her${sementes}x${jogos}`, () => ['esperto', 'aleatorio'].map((tipo) => {
    const derrotas = []
    let ultimaMax = 0
    let punidasBoas = 0
    let caixasMax = 0
    let semDerrotaDepois100 = 0
    for (let s = 1; s <= sementes; s++) {
      const r = sessao({ semente: s, jogos, tipo })
      derrotas.push(r.derrotas)
      ultimaMax = Math.max(ultimaMax, r.ultimaDerrota)
      punidasBoas += r.punidasBoas
      caixasMax = Math.max(caixasMax, r.caixas)
      if (r.ultimaDerrota <= 100) semDerrotaDepois100++
    }
    const soma = derrotas.reduce((a, b) => a + b, 0)
    const hist = {}
    for (const d of derrotas) hist[d] = (hist[d] || 0) + 1
    return {
      tipo,
      sementes,
      jogos,
      minimo: Math.min(...derrotas),
      maximo: Math.max(...derrotas),
      media: soma / sementes,
      histograma: hist,
      ultimaDerrotaMax: ultimaMax,
      semDerrotaDepois100,
      punidasBoas,
      caixasVisitadas: caixasMax
    }
  }))
}

// Tabela 4: o juiz sem memoria contra o motor, no inicio de cada tabuleiro
// que ele alcanca.
export const ALCANCE_DO_JUIZ = [[1, 3], [1, 4], [1, 5], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [3, 3], [4, 3], [3, 4], [5, 3], [3, 5], [4, 4]]

export function juizNoInicio (lista = ALCANCE_DO_JUIZ) {
  return lista.map(([w, h]) => guardado(`j${w}x${h}`, () => {
    const motor = resolve(w, h)
    const j = julgaInicio(w, h)
    const ganhaJuiz = j.vence ? 'brancas' : 'pretas'
    return { largura: w, altura: h, motor: `${motor.ganha} em ${motor.dist}`, juiz: `${ganhaJuiz} em ${j.dist}`, concorda: ganhaJuiz === motor.ganha && j.dist === motor.dist, posicoes: motor.posicoes, nosJuiz: j.nos }
  }))
}

// Tabela 5: o juiz contra o motor em TODA posicao alcancavel.
export function juizEmTudo (w, h) {
  return guardado(`t${w}x${h}`, () => {
    const g = grade(w, h)
    const m = new Motor(g)
    const visto = new Set([chave(g, inicial(g))])
    const fila = [[inicial(g), true]]
    let divergencias = 0
    for (let q = 0; q < fila.length; q++) {
      const [p, vezBrancas] = fila[q]
      const v = m.valor(p)
      const j = minimax(doDesenho(desenha(g, p, vezBrancas)), vezBrancas ? 'B' : 'P')
      if (j.vence !== vence(v) || j.dist !== distancia(v)) divergencias++
      if (perdeu(g, p)) continue
      for (const lance of jogadas(g, p)) {
        const f = aplica(g, p, lance)
        const k = chave(g, f)
        if (!visto.has(k)) { visto.add(k); fila.push([f, !vezBrancas]) }
      }
    }
    return { largura: w, altura: h, posicoes: fila.length, divergencias }
  })
}

export { doFilho }

// As regras do hexapawn de Martin Gardner, generalizadas para qualquer
// retangulo de `largura` colunas por `altura` linhas.
//
// Cada lado comeca com uma fileira cheia de peoes na sua primeira linha. Na
// sua vez o peao anda uma casa para a frente, se ela estiver vazia, ou come na
// diagonal para a frente. Nao ha passo duplo nem en passant. Ganha quem:
//   - leva um peao ate a ultima linha, ou
//   - deixa o outro sem jogada (inclusive sem peao nenhum).
// Como todo lance avanca um peao, a partida sempre acaba, e nunca empata.
//
// A posicao e guardada do ponto de vista de quem esta na vez, que sempre anda
// "para cima" (da linha 0 para a linha altura-1). Depois de cada lance o
// tabuleiro e espelhado de cima para baixo e os papeis trocam. Isso faz a
// mesma regra servir os dois lados sem um `if` de cor em lugar nenhum.

export function grade (largura, altura) {
  if (largura < 1 || altura < 3) throw new Error('precisa de pelo menos 1 coluna e 3 linhas')
  const casas = largura * altura
  if (casas > 26) throw new Error('acima de 26 casas a chave passa de 2^53')
  const linha0 = (1 << largura) - 1
  // espelho[i] = a casa i vista do outro lado do tabuleiro
  const espelho = []
  for (let i = 0; i < casas; i++) {
    const r = Math.floor(i / largura)
    const c = i % largura
    espelho.push((altura - 1 - r) * largura + c)
  }
  return { largura, altura, casas, linha0, espelho, potencia: 2 ** casas }
}

export function inicial (g) {
  // Os meus peoes na linha 0; os dele na ultima linha, que do ponto de vista
  // dele e tambem a linha 0 depois do espelho. Guardo ja no meu ponto de vista.
  const meus = g.linha0
  const dele = g.linha0 * 2 ** (g.casas - g.largura)
  return { eu: meus, outro: dele }
}

export function espelha (g, m) {
  let r = 0
  for (let i = 0; i < g.casas; i++) if (m & (1 << i)) r |= 1 << g.espelho[i]
  return r
}

// Lances de quem esta na vez: { de, para, come }.
export function jogadas (g, pos) {
  const { eu, outro } = pos
  const lista = []
  const L = g.largura
  for (let i = 0; i < g.casas - L; i++) {
    if (!(eu & (1 << i))) continue
    const c = i % L
    const frente = i + L
    if (!((eu | outro) & (1 << frente))) lista.push({ de: i, para: frente, come: false })
    if (c > 0 && (outro & (1 << (frente - 1)))) lista.push({ de: i, para: frente - 1, come: true })
    if (c < L - 1 && (outro & (1 << (frente + 1)))) lista.push({ de: i, para: frente + 1, come: true })
  }
  return lista
}

// Aplica o lance e devolve a posicao do ponto de vista de quem joga a seguir.
export function aplica (g, pos, j) {
  const eu = (pos.eu & ~(1 << j.de)) | (1 << j.para)
  const outro = pos.outro & ~(1 << j.para)
  return { eu: espelha(g, outro), outro: espelha(g, eu) }
}

// Quem esta na vez ja perdeu? Perdeu se o outro chegou na linha 0 deste lado
// (que e a ultima linha dele), ou se nao tem lance.
export function perdeu (g, pos) {
  if (pos.outro & g.linha0) return true
  return jogadas(g, pos).length === 0
}

export const chave = (g, pos) => pos.eu + pos.outro * g.potencia
export const daChave = (g, k) => ({ eu: k % g.potencia, outro: Math.floor(k / g.potencia) })

// Espelho da esquerda para a direita, para contar posicoes a menos de simetria.
export function espelhoLateral (g, m) {
  let r = 0
  for (let i = 0; i < g.casas; i++) {
    if (!(m & (1 << i))) continue
    const linha = Math.floor(i / g.largura)
    const c = i % g.largura
    r |= 1 << (linha * g.largura + g.largura - 1 - c)
  }
  return r
}

// Desenho com as brancas (quem comecou) embaixo. `vezDasBrancas` diz de quem e
// o ponto de vista guardado.
export function desenha (g, pos, vezDasBrancas) {
  const brancas = vezDasBrancas ? pos.eu : espelha(g, pos.outro)
  const pretas = vezDasBrancas ? pos.outro : espelha(g, pos.eu)
  const linhas = []
  for (let r = g.altura - 1; r >= 0; r--) {
    let s = ''
    for (let c = 0; c < g.largura; c++) {
      const i = r * g.largura + c
      s += brancas & (1 << i) ? 'B' : pretas & (1 << i) ? 'p' : '.'
    }
    linhas.push(s)
  }
  return linhas.join('/')
}

// O juiz: minimax puro, sem memoria, sem espelho e sem mascara de bits.
//
// O tabuleiro e uma matriz de linhas, com 'B' (brancas, que sobem), 'P'
// (pretas, que descem) e '.'. A cor de quem joga e explicita. Nada aqui vem do
// nucleo nem da busca. O preco e ser exponencial: so alcanca tabuleiros
// pequenos, e a tabela diz onde ele parou.

function lances (tab, cor) {
  const altura = tab.length
  const largura = tab[0].length
  const passo = cor === 'B' ? 1 : -1
  const inimigo = cor === 'B' ? 'P' : 'B'
  const saida = []
  for (let r = 0; r < altura; r++) {
    for (let c = 0; c < largura; c++) {
      if (tab[r][c] !== cor) continue
      const r2 = r + passo
      if (r2 < 0 || r2 >= altura) continue
      if (tab[r2][c] === '.') saida.push([r, c, r2, c])
      for (const c2 of [c - 1, c + 1]) {
        if (c2 >= 0 && c2 < largura && tab[r2][c2] === inimigo) saida.push([r, c, r2, c2])
      }
    }
  }
  return saida
}

function move (tab, [r, c, r2, c2]) {
  const novo = tab.map((linha) => linha.slice())
  novo[r2][c2] = novo[r][c]
  novo[r][c] = '.'
  return novo
}

function chegou (tab, cor) {
  const alvo = cor === 'B' ? tab.length - 1 : 0
  return tab[alvo].includes(cor)
}

// { vence, dist } para quem esta na vez. Vitoria: a mais curta. Derrota: a
// mais longa.
export function minimax (tab, cor, contador) {
  if (contador) contador.nos++
  const outra = cor === 'B' ? 'P' : 'B'
  if (chegou(tab, outra)) return { vence: false, dist: 0 }
  const ls = lances(tab, cor)
  if (ls.length === 0) return { vence: false, dist: 0 }
  let ganha = Infinity
  let perde = -1
  for (const l of ls) {
    const f = minimax(move(tab, l), outra, contador)
    if (!f.vence) ganha = Math.min(ganha, f.dist + 1)
    else perde = Math.max(perde, f.dist + 1)
  }
  return ganha < Infinity ? { vence: true, dist: ganha } : { vence: false, dist: perde }
}

export function tabuleiroInicial (largura, altura) {
  const tab = []
  for (let r = 0; r < altura; r++) {
    tab.push(Array.from({ length: largura }, () => r === 0 ? 'B' : r === altura - 1 ? 'P' : '.'))
  }
  return tab
}

// Converte um desenho do nucleo ('ppp/.../BBB', de cima para baixo) para a
// matriz do juiz (linha 0 embaixo).
export function doDesenho (desenho) {
  return desenho.split('/').reverse().map((l) => [...l].map((ch) => ch === 'p' ? 'P' : ch))
}

export function julgaInicio (largura, altura) {
  const contador = { nos: 0 }
  const r = minimax(tabuleiroInicial(largura, altura), 'B', contador)
  return { ...r, nos: contador.nos }
}

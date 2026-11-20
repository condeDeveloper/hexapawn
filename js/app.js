// A pagina: voce joga com as brancas contra a HER (que aprende) ou contra o
// motor perfeito. Regras, motor e maquina sao os mesmos arquivos dos testes.

import { grade, inicial, jogadas, aplica, perdeu, espelha } from './nucleo.js'
import { Motor } from './busca.js'
import { Her, gerador } from './her.js'

const elTab = document.getElementById('tabuleiro')
const elEstado = document.getElementById('estado')
const elTamanho = document.getElementById('tamanho')
const elOponente = document.getElementById('oponente')
const elPlacar = document.getElementById('placar')
const elCaixas = document.getElementById('caixas')

let g, motor, pos, vezBrancas, escolhida, ultimaHer, acabou
let her = new Her()
const rnd = gerador(Date.now() % 100000)
const placar = { voce: 0, maquina: 0 }

function comeca () {
  const [w, h] = elTamanho.value.split('x').map(Number)
  if (!g || g.largura !== w || g.altura !== h) {
    g = grade(w, h)
    motor = new Motor(g)
  }
  // A HER so existe no 3x3, que e o tabuleiro de Gardner.
  elOponente.querySelector('[value=her]').disabled = !(w === 3 && h === 3)
  if (elOponente.value === 'her' && !(w === 3 && h === 3)) elOponente.value = 'motor'
  pos = inicial(g)
  vezBrancas = true
  escolhida = null
  ultimaHer = null
  acabou = false
  desenha()
}

// As casas do ponto de vista das brancas, linha de cima primeiro.
function brancasEPretas () {
  return vezBrancas ? [pos.eu, pos.outro] : [espelha(g, pos.outro), espelha(g, pos.eu)]
}

function desenha () {
  const [brancas, pretas] = brancasEPretas()
  elTab.style.gridTemplateColumns = `repeat(${g.largura}, 1fr)`
  elTab.innerHTML = ''
  const lista = vezBrancas && !acabou ? jogadas(g, pos) : []
  const origens = new Set(lista.map((j) => j.de))
  const destinos = new Map(lista.filter((j) => j.de === escolhida).map((j) => [j.para, j]))
  for (let r = g.altura - 1; r >= 0; r--) {
    for (let c = 0; c < g.largura; c++) {
      const i = r * g.largura + c
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'casa ' + ((r + c) % 2 ? 'escura' : 'clara')
      if (brancas & (1 << i)) b.classList.add('branca')
      else if (pretas & (1 << i)) b.classList.add('preta')
      if (i === escolhida) b.classList.add('escolhida')
      if (escolhida === null && origens.has(i)) b.classList.add('pode')
      if (destinos.has(i)) b.classList.add('alvo')
      b.setAttribute('aria-label', `casa ${String.fromCharCode(97 + c)}${r + 1}`)
      b.addEventListener('click', () => clique(i, destinos))
      elTab.appendChild(b)
    }
  }
  elPlacar.textContent = `Voce ${placar.voce} x ${placar.maquina} maquina`
  elCaixas.textContent = her.caixas.size ? `A HER tem ${her.caixas.size} caixas e ${her.contas} contas.` : 'A HER ainda nao abriu nenhuma caixa.'
}

function fim (brancasGanharam) {
  acabou = true
  if (brancasGanharam) {
    placar.voce++
    if (elOponente.value === 'her' && ultimaHer) ultimaHer.contas.splice(ultimaHer.indice, 1)
    elEstado.textContent = elOponente.value === 'her' ? 'Voce ganhou. A HER jogou fora a conta do ultimo lance dela.' : 'Voce ganhou.'
  } else {
    placar.maquina++
    elEstado.textContent = 'A maquina ganhou.'
  }
  desenha()
}

function confereFim () {
  if (!perdeu(g, pos)) return false
  // Quem esta na vez perdeu.
  fim(!vezBrancas)
  return true
}

function clique (i, destinos) {
  if (acabou || !vezBrancas) return
  if (destinos.has(i)) {
    pos = aplica(g, pos, destinos.get(i))
    vezBrancas = false
    escolhida = null
    if (confereFim()) return
    desenha()
    elEstado.textContent = 'A maquina pensa...'
    setTimeout(jogaMaquina, 400)
    return
  }
  escolhida = jogadas(g, pos).some((j) => j.de === i) && escolhida !== i ? i : null
  desenha()
}

function jogaMaquina () {
  if (elOponente.value === 'her') {
    const e = her.escolhe(pos, rnd)
    if (!e.jogada) {
      // Caixa vazia: a HER desiste, e a conta que a trouxe ate aqui sai.
      if (ultimaHer) ultimaHer.contas.splice(ultimaHer.indice, 1)
      ultimaHer = null
      acabou = true
      placar.voce++
      elEstado.textContent = 'A HER abriu uma caixa vazia e desistiu.'
      desenha()
      return
    }
    ultimaHer = e
    pos = aplica(g, pos, e.jogada)
  } else {
    const op = motor.avaliaJogadas(pos)
    op.sort((a, b) => b.valor - a.valor)
    pos = aplica(g, pos, op[0].jogada)
  }
  vezBrancas = true
  if (confereFim()) return
  const v = motor.avaliaJogadas(pos)
  const ganha = v.some((a) => a.vence)
  elEstado.textContent = `Sua vez. Com o melhor jogo dos dois, ${ganha ? 'voce ganha' : 'voce perde'} daqui.`
  desenha()
}

document.getElementById('reiniciar').addEventListener('click', comeca)
document.getElementById('esquecer').addEventListener('click', () => { her = new Her(); comeca() })
elTamanho.addEventListener('change', comeca)
elOponente.addEventListener('change', comeca)

comeca()
elEstado.textContent = 'Sua vez: voce joga com as brancas, de baixo para cima.'

# Hexapawn

O hexapawn de Martin Gardner resolvido em 29 retângulos, e a máquina de caixas de fósforo dele medida em 2.000 sessões. JavaScript puro, sem dependência nenhuma.

Cada lado começa com uma fileira de peões. O peão anda uma casa para a frente, se ela estiver vazia, ou come na diagonal para a frente. Ganha quem leva um peão à última linha ou deixa o outro sem lance. Como todo lance avança um peão, a partida sempre acaba, e nunca empata.

**Página jogável:** <https://condedeveloper.github.io/hexapawn/>, contra a máquina que aprende ou contra o motor perfeito.

---

## Os quatro achados

**1. A máquina de Gardner cabe em 19 caixas, com só 17 contas ruins.** Varrendo todas as posições alcançáveis em que as pretas jogam no 3×3, e juntando as que são espelho uma da outra, sobram **19**: 2 no segundo lance, 10 no quarto, 7 no sexto. Sem juntar espelhos seriam 37. As 19 caixas começam com **47 contas**, uma por lance, e só **17** são de lances que perdem.

**2. A regra de Gardner nunca joga fora uma conta boa, então a máquina nunca perde mais de 17 vezes.** Em 2.000 sessões de 200 partidas, **22.278** contas foram jogadas fora, e o motor conferiu cada uma: nenhuma era de lance ganhador. Como cada derrota tira uma conta ruim e só existem 17, a máquina não tem como perder uma 18ª vez. O máximo medido foi **16**, contra um adversário que joga ao acaso.

**3. Contra um adversário esperto, a máquina perde sempre 9 ou 10 vezes.** Esse adversário aproveita todo erro e, quando não há erro, joga ao acaso. Nas 1.000 sementes a máquina perdeu **10 vezes em 938** e 9 vezes nas outras 62, e só chegou a abrir 14 das 19 caixas. Contra o acaso foram de 8 a 16 derrotas, média 12,34. Nos dois casos houve semente em que a última derrota caiu na partida 200: o aprendizado acaba, mas não tem prazo.

**4. Com duas colunas, as pretas ganham sempre; com três linhas, só nas larguras 2, 3 e 6.** Dos 29 retângulos de até 26 casas, as pretas (que jogam em segundo) ganham todos os de largura 2, de 3 a 8 linhas. Na faixa de 3 linhas, de 1 a 8 colunas, ganham exatamente no 2×3, no 3×3 e no 6×3. A partida mais longa é a do **3×8**: as pretas ganham em **22** lances.

---

## A máquina

A **HER** (Hexapawn Educable Robot) joga com as pretas, que são o lado que ganha no 3×3. Tem uma caixa para cada posição em que joga, e cada caixa começa com uma conta para cada lance possível. Na vez dela sorteia-se uma conta. Quando ela perde, a conta do **último** lance que ela fez é jogada fora; quando ganha, nada muda. Se chega numa caixa vazia, desiste, e a conta que a levou até ali sai.

O número de caixas citado varia: a [Wikipedia](https://en.wikipedia.org/wiki/Hexapawn) fala em 24, e [Matthew Scroggs](https://www.mscroggs.co.uk/blog/52) conta 19. A varredura aqui dá 19, e o teste prende o 19.

### As caixas

| contagem | valor |
| --- | --- |
| posições das pretas, vivas, sem juntar espelhos | 37 |
| juntando espelhos (as caixas) | **19** |
| no 2º, 4º e 6º lance | 2, 10, 7 |
| caixas com um lance só | 2 |
| contas no começo | 47 |
| contas de lances que perdem | **17** |

### O aprendizado, em 1.000 sementes de 200 partidas

| adversário | derrotas mín. | máx. | média | caixas abertas | contas boas jogadas fora |
| --- | --- | --- | --- | --- | --- |
| esperto | 9 | 10 | 9,938 | 14 | 0 |
| aleatório | 8 | 16 | 12,34 | 19 | 0 |

Histograma contra o aleatório: 8 derrotas em 2 sementes, 9 em 12, 10 em 75, 11 em 174, 12 em 316, 13 em 224, 14 em 127, 15 em 50, 16 em 20.

Sementes sem nenhuma derrota depois da partida 100: 678 contra o esperto, 414 contra o aleatório.

---

## Quem ganha cada retângulo

As brancas começam. "p6" quer dizer que as pretas ganham em 6 lances com o melhor jogo dos dois; "b11", que as brancas ganham em 11.

| linhas \ colunas | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | b1 | p2 | p6 | b5 | b7 | p8 | b9 | b11 |
| 4 | p2 | p6 | p8 | b11 | p14 | p16 | | |
| 5 | b3 | p6 | b11 | p16 | b19 | | | |
| 6 | p4 | p10 | p14 | b21 | | | | |
| 7 | b5 | p10 | b19 | | | | | |
| 8 | p6 | p14 | p22 | | | | | |

A tabela para em 26 casas: acima disso a chave `eu + outro · 2^casas` passa de 2⁵³. Os três maiores (8×3, 6×4 e 5×5) guardam de 1,9 a 3,7 milhões de posições e ficam em `testes/pesados.test.js`.

### O juiz

`js/juiz.js` é minimax puro: matriz de letras, cor explícita, sem memória, sem espelho e sem máscara de bits, e sem importar nada do motor. Ele concorda no início de **15** tabuleiros, do 1×3 ao 4×4 e ao 3×6, e em **todas** as posições alcançáveis do 3×3, 4×3, 3×4, 5×3, 3×5 e 4×4 (13.855 no 4×4). Sem memória, ele paga caro: no 4×4 abre 4.197.973 nós onde o motor guarda 13.855 posições, **303 vezes** mais; no 3×6, 22.794.931 nós. Foi onde ele parou.

---

## O que as medidas me corrigiram

**Eu esperava 24 caixas.** É o número que eu tinha na cabeça para a máquina de Gardner. A varredura deu 19, e nenhum jeito natural de contar dá 24: sem juntar espelhos são 37, tirando as caixas de lance único são 17, contando as posições já perdidas são 34. Fui procurar e achei as duas contagens publicadas, 24 e 19. O teste prende o que foi medido.

**Os peões da página eram indistinguíveis.** Usei os símbolos ♙ e ♟, e na captura de tela do teste de navegador as duas cores saíram quase iguais, pequenas, no meio da casa. Trocados por discos com as cores do resto do acervo.

Não apostei por escrito antes de medir os retângulos, então a tabela não corrigiu nenhuma aposta minha.

---

## Como rodar

Node 20 ou mais novo. Sem dependência.

```bash
npm test                               # a suite inteira, pesados incluidos
npm run medir                          # as tabelas leves
node ferramentas/medidor.js pesados    # 8x3, 6x4 e 5x5
node ferramentas/medidor.js maquina    # a HER em 2000 sessoes
```

## Os arquivos

- `js/nucleo.js`: as regras, do ponto de vista de quem joga, com o tabuleiro espelhado a cada lance.
- `js/busca.js`: o motor, com memória e valor empacotado (ganhar cedo e perder tarde valem mais).
- `js/juiz.js`: minimax puro, sem compartilhar código com o motor.
- `js/her.js`: a máquina de caixas de fósforo e os dois adversários.
- `js/medidas.js`: as tabelas do README.
- `js/app.js`: a página jogável.
- `ferramentas/medidor.js`: imprime as tabelas.
- `testes/`: 38 testes, com os números do README presos.

## Licença

MIT.

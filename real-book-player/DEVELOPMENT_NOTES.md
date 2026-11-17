# Real Book Player — registro de desenvolvimento

**Atualizado em:** 17/11/2026  
**Repositório:** `celsomartins251/dicas-de-musica`  
**Aplicação:** `/real-book-player/`

## Decisões de arquitetura

- Aplicação web modular em HTML, CSS e JavaScript, hospedada no GitHub Pages.
- Biblioteca local com IndexedDB; PDFs, MIDI, MusicXML e correções permanecem no dispositivo.
- Leitor PDF baseado em PDF.js; renderização MusicXML baseada em OpenSheetMusicDisplay (OSMD).
- O motor de áudio inicial usa Web Audio API. Não representa ainda um sintetizador SoundFont nem um mixer de instrumentos.
- O Service Worker mantém cache próprio com prefixo `real-book-player-`. A ativação remove somente versões antigas desse cache, sem apagar caches de outros aplicativos publicados no mesmo domínio.
- Dependências de PDF.js e OSMD são carregadas de jsDelivr e guardadas pelo Service Worker depois do primeiro carregamento online bem-sucedido. A primeira utilização dessas bibliotecas exige conexão.

## Estado por fase

### Fase 1 — biblioteca e PDF

**Implementado no repositório**
- Estrutura separada em `index.html`, `css/app.css`, `js/app.js`, `js/musicxml-engine.js`, `sw.js` e manifesto PWA.
- Importação de PDFs, MIDI e MusicXML não compactado.
- Persistência local por IndexedDB, pesquisa, filtros e exclusão.
- Leitor PDF.js com paginação e zoom.

**Limitação:** o primeiro carregamento do PDF.js requer internet. Depois do carregamento, a biblioteca de recursos pode ser usada pelo cache do Service Worker. O funcionamento offline completo ainda precisa ser confirmado no Android WebView.

### Fase 2 — OMR, MusicXML e revisão

**Implementado**
- Importação de MusicXML `score-partwise`.
- Leitura de partes, compassos, notas, alturas, durações, armadura, fórmula de compasso, andamento e cifras harmônicas comuns.
- Conversão dos eventos MusicXML em eventos de reprodução.
- Renderização da partitura por OSMD.
- Revisão manual de altura, duração e cifras comuns.
- Correções persistidas localmente e exportação de MusicXML revisado.
- Arquivo sintético original em `samples/teste-omr.musicxml` para validar o fluxo sem depender de material protegido.

**Ainda não implementado:** o motor OMR não está incorporado ao Real Book Player. O painel OMR atual documenta uma ponte de teste para converter um PDF em outro aplicativo Android, exportar MusicXML não compactado e importar o resultado. Isso não é integração nativa nem processamento executado dentro desta aplicação.

**Decisão provisória de OMR:** o projeto público Sheet-Music-Recognition / score-reader descreve processamento local, exportação MusicXML/MIDI e licença Apache-2.0 para código e pesos; a documentação de uso Python requer Python 3.10/3.11 e Java 17+. O repositório aponta uma demonstração Android publicada como Music Sheets: Score Organizer. Como não foi localizada uma API JavaScript/WebView pública para incorporar o motor, a aplicação usa apenas o fluxo de exportação/importação como ponte. Não copiamos nem redistribuímos o motor ou o aplicativo de terceiros.

A alternativa Sheetscan executa HOMR no navegador via Pyodide, mas o projeto declara licença AGPL-3.0, download inicial de modelos em torno de 150 MB e limites conhecidos na leitura de bateria, tablatura e alguns símbolos de cifra. Não foi escolhida para incorporação nesta etapa.

### Fases 3 a 6 — planejadas

- **Fase 3:** sincronização visual do cursor com a reprodução e revisão mais completa.
- **Fase 4:** SoundFont/FluidSynth, piano, walking bass, bateria, mixer com canais e controles independentes, modos de execução.
- **Fase 5:** transposição, andamento em BPM, loops, contagem e modo improvisação.
- **Fase 6:** validação de funcionamento offline no Android WebView depois de baixar os recursos necessários.

## Testes executados nesta etapa

- Sintaxe JavaScript de `app.js` e `musicxml-engine.js`: compilação estática aprovada.
- Referências de elementos HTML usadas pelo JavaScript: todos os IDs encontrados.
- Estrutura de tags HTML: sem tags abertas ou fechamentos incompatíveis na verificação estática.
- Partitura sintética: 4 compassos, 13 notas, 4 cifras, 4/4 e 100 BPM; parser produziu 26 eventos note-on/note-off.
- Teste de edição: altura C4 alterada para C#4, duração alterada para 1,5 tempo e cifra Cmaj7 alterada para Dm7; o MusicXML resultante foi reprocessado e preservou as alterações. O parser também sinaliza quando a duração editada faz o compasso ultrapassar a fórmula de compasso.
- Teste de redivisão: o arquivo de teste passou de 1 para 16 divisões por semínima para representar a duração pontuada sem arredondamento.

**Não testado em dispositivo real:** abertura do site no Chrome do Galaxy Tab S10 Lite, reprodução audível no WebView/Kodular, renderização OSMD carregada do CDN, cache offline após primeiro acesso e precisão de um resultado OMR real. Os testes desta etapa são estáticos e de parser com uma partitura sintética, não uma validação de reconhecimento de PDF.

## Limitações conhecidas

- OMR interno ainda ausente; o aplicativo externo é apenas uma ponte.
- Importação MusicXML atual aceita `score-partwise` não compactado (`.musicxml` ou `.xml`); não lê contêineres compactados `.mxl` nem `score-timewise`.
- O parser cobre a notação comum, mas quiálteras, ornamentos, repetições complexas e algumas extensões de cifras exigem revisão especial.
- A tabela mostra até 250 notas por vez; a reprodução usa todos os eventos reconhecidos.
- A síntese atual usa onda triangular; não respeita ainda programas de instrumento, articulações, dinâmica completa ou timbres de piano/baixo/bateria.
- Não há ainda sincronização do cursor, acompanhamento, mixer independente, transposição, loop ou modo improvisação.

## Próximos passos de validação

1. Abrir a aplicação no Chrome do tablet, carregar a partitura sintética de teste, conferir a renderização, ouvir PLAY, testar pausa/parada/andamento e alterar uma nota e uma cifra.
2. Reabrir a aplicação sem conexão e verificar quais recursos continuam disponíveis após o primeiro carregamento online.
3. Converter uma única partitura que o usuário tenha direito de utilizar em MusicXML não compactado, importar e comparar manualmente cada nota, duração e cifra com o PDF original. Registrar erros antes de considerar qualquer taxa de precisão.
4. Só depois dessa validação decidir a incorporação nativa do OMR. Um motor Python/Java offline dentro do APK exige uma camada Android nativa ou serviço local; GitHub Pages e WebView sozinhos não executam o pacote Python/Java do computador.

## Direitos de uso

A partitura sintética de teste é material original criado para validação técnica. Para testes reais, importar apenas partituras próprias ou materiais cujo uso, conversão e armazenamento sejam autorizados pelo titular dos direitos.

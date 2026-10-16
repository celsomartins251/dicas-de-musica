/* =====================================================================
   ARQUIVO DE EDIÇÃO: preços, links, alunos e materiais ficam aqui. Troque textos, preços, links e alunos.
   Para adicionar algo, copie uma linha e mude os dados entre aspas.
   ===================================================================== */
const CONFIG = {
  nome: "Celso Martins · Escola de Música",
  whatsapp: "5517999999999",   // só números: 55 + DDD + número
  email: "contato@seudominio.com.br",

  heroTitulo: "Estude música com método. Toque com liberdade.",
  heroTexto: "Cursos, e-books e ferramentas de estudo para quem quer entender melhor o instrumento, desenvolver técnica e tocar com mais segurança.",
  formas: [
    { t: "Online", d: "Videoaulas e aplicativos de estudo" },
    { t: "Presencial", d: "Turmas e aulas com acompanhamento" },
    { t: "E-books", d: "Apostilas para consultar sempre" }
  ],

  /* link = página de pagamento (Hotmart, Kiwify, Mercado Pago...).
     Se deixar vazio, o botão abre o WhatsApp com a mensagem pronta. */
  cursos: [
    { nome: "Mestre das Cordas", tag: "Contrabaixo · Iniciante ao avançado", texto: "Caminho organizado para desenvolver técnica, conhecer o braço do instrumento e construir grooves com consciência.", preco: "R$ 69,90", link: "" },
    { nome: "Fundamentos do Violão", tag: "Violão · Iniciante", texto: "Acordes, ritmo, levadas e prática gradual para tocar músicas com mais confiança.", preco: "", link: "" }
  ],
  ebooks: [
    { nome: "Leitura Rítmica e Melódica", tag: "Partitura · Estudo progressivo", texto: "Leitura musical passo a passo, com exercícios organizados por nível.", preco: "", link: "" },
    { nome: "Arquitetura da Improvisação", tag: "Contrabaixo · Improvisação", texto: "Conceitos e exercícios para conectar escalas, arpejos e ideias musicais.", preco: "", link: "" }
  ],

  /* arquivo = HTML dentro da pasta "apps". O id liga o app ao acesso do aluno. */
  apps: [
    { id: "violao",   nome: "Mapa do Violão e Guitarra", tag: "Violão · Guitarra", texto: "Mapa interativo do braço do violão e da guitarra.", preco: "", link: "", arquivo: "apps/mapa-violao-guitarra.html" },
    { id: "baixo",    nome: "Mapa do Contrabaixo", tag: "Contrabaixo", texto: "Mapa interativo do braço do contrabaixo.", preco: "", link: "", arquivo: "apps/mapa-contrabaixo.html" },
    { id: "leitura",  nome: "Leitura Rítmica com Cifra", tag: "Ritmo · Leitura", texto: "Exercícios de leitura rítmica acompanhados de cifra.", preco: "", link: "", arquivo: "apps/leitura-ritmica.html" },
    { id: "acordes",  nome: "Dicionário de Acordes", tag: "Acordes", texto: "Consulta rápida de acordes.", preco: "", link: "", arquivo: "apps/dicionario-de-acordes.html" },
    { id: "levadas",  nome: "Estúdio de Levadas", tag: "Levadas · Prática", texto: "Estúdio para criar e estudar levadas.", preco: "", link: "", arquivo: "apps/estudio-de-levadas.html" },
    { id: "cadencia", nome: "Cadência Harmônica", tag: "Harmonia", texto: "Mapa harmônico interativo: campo harmônico, dominantes secundários, cadências II–V e subV.", preco: "", link: "", arquivo: "apps/cadencia-harmonica.html" },
    { id: "scoremaster", nome: "ScoreMaster Pro", tag: "Partituras", texto: "Biblioteca de partituras em PDF, com anotações, metrônomo e modo performance.", preco: "", link: "", arquivo: "apps/scoremaster-pro.html" },
    /* venda: false = aparece só na área de membros, não entra na vitrine de vendas.
       Para vender o afinador no futuro, apague a parte "venda: false," e coloque o preço. */
    { id: "afinador", nome: "Afinador Cromático", tag: "Afinação · Exclusivo para alunos", texto: "Afinador cromático para baixo, violão, guitarra e cavaquinho, usando o microfone do aparelho.", preco: "", link: "", venda: false, arquivo: "apps/afinador.html" }
  ],

  sobreTitulo: "Música se aprende com prática e direção.",
  sobreTexto: "Um espaço para reunir cursos, materiais didáticos e ferramentas que ajudam músicos a compreender a teoria, desenvolver técnica e aplicar o conhecimento no instrumento.",

  /* ---------- ALUNOS ----------
     tipo: "online", "presencial" ou "ambos"
     apps: ["todos"] libera tudo, ou liste os ids: ["violao","acordes"] */
  alunos: [
    { nome: "Aluno Exemplo", email: "aluno@exemplo.com", senha: "troque123", tipo: "ambos", apps: ["todos"] }
  ],

  /* ---------- AULAS ONLINE (cole o link do vídeo) ---------- */
  aulas: [
    { titulo: "Comece por aqui: orientação de estudo", texto: "Organize sua rotina e defina os próximos passos.", link: "" }
  ],
  /* ---------- AULAS PRESENCIAIS ---------- */
  presenciais: [
    { titulo: "Turma de exemplo", quando: "Terças e quintas, 19h", onde: "Endereço da escola" }
  ],
  /* ---------- MATERIAIS: acesso = "todos", "online" ou "presencial" ---------- */
  materiais: [
    { titulo: "Material de exemplo (PDF)", acesso: "todos", link: "" }
  ]
};
/* ===================================================================== */

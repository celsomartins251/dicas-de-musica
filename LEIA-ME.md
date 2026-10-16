# Dicas de Música — como publicar e editar

## Estrutura (suba tudo na raiz do repositório)
```
index.html      -> site (vitrine + login + área de membros). Não precisa editar.
config.js       -> ARQUIVO DE EDIÇÃO: preços, links de compra, alunos, aulas, materiais
.nojekyll       -> evita o Jekyll do GitHub mexer nos arquivos (pode ficar oculto)
apps/           -> os 8 aplicativos (um HTML cada)
```

## Publicar no GitHub Pages
1. No GitHub, abra o repositório (ou crie um novo, público).
2. Clique em **Add file > Upload files** e arraste o CONTEÚDO da pasta (index.html, config.js, .nojekyll e a pasta apps). Clique **Commit changes**.
   - Se o repositório já tem um index.html, ele será substituído. Guarde uma cópia antes.
3. Vá em **Settings > Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e **Save**.
4. Em 1–3 minutos o endereço aparece no topo da mesma tela.

## Editar preços e links (config.js)
No GitHub, clique em `config.js` > ícone do lápis > edite > **Commit changes**. O site atualiza em ~1 minuto.
- **Preço:** `preco: "R$ 49,90"` (vazio mostra "Consulte").
- **Link de compra:** `link: "https://pay.hotmart.com/..."`. Vazio = botão abre o WhatsApp.
- **WhatsApp e e-mail:** campos `whatsapp` e `email` no topo.
- **Novo curso/e-book/app:** copie uma linha inteira `{ ... },` e mude os textos.
- **Esconder um app da vitrine de vendas:** adicione `venda: false,` na linha dele.
- **Aluno:** em `alunos`, `apps: ["todos"]` ou só alguns ids, ex.: `["violao","acordes"]`.
- **Aulas e materiais:** blocos `aulas` e `materiais`, com `link` do vídeo ou PDF.
- **Trocar um aplicativo:** suba o novo HTML em `apps/` com o mesmo nome.
Cuidado com aspas e vírgulas: se o site ficar em branco, houve erro de digitação no config.js.

## Importante: segurança do login
O login atual confere e-mail e senha DENTRO do navegador, e as senhas ficam legíveis no config.js, que é público. Qualquer pessoa pode abrir o arquivo, ver todas as senhas, ou digitar o endereço de um app diretamente (ex.: .../apps/afinador.html). Serve para uso informal, não para proteger conteúdo pago. O GitHub Pages não oferece proteção real.
Para proteção real é preciso um serviço de login/assinatura (ex.: Memberstack, Firebase Auth, Supabase, ou uma plataforma de membros como Hotmart/Kiwify/Eduzz com área própria). Posso adaptar o site a um deles quando você escolher.
- Não coloque senhas reais de alunos no config.js enquanto isso.
- A conta "Aluno Exemplo / troque123" é só de demonstração: apague-a ou troque.

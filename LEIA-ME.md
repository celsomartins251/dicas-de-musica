# Dicas de Música — Área de Membros (Firebase + GitHub Pages)

Todos os arquivos ficam na RAIZ do repositório (sem pastas). Os aplicativos começam com `app-`.

## 1) Criar o Firebase (uma vez só, pode ser pelo celular)
1. console.firebase.google.com > Adicionar projeto (plano Spark, grátis).
2. Criação > Authentication > Começar > ativar "E-mail/senha".
3. Criação > Firestore Database > Criar banco de dados (modo produção).
4. Firestore > aba Regras > apagar tudo, colar o conteúdo de `firestore.rules` > Publicar.
5. Configurações do projeto (engrenagem) > Seus apps > ícone `</>` (Web) > registrar > copiar o `firebaseConfig`.
6. Editar `firebase-config.js` no GitHub e colar os valores entre aspas.
7. Authentication > Configurações > Domínios autorizados > adicionar `celsomartins251.github.io`.

## 2) Criar o seu acesso de professor
1. Authentication > Usuários > Adicionar usuário (seu e-mail e senha). Copie o "UID" dele.
2. Firestore > Iniciar coleção `teachers` > ID do documento = o UID > campo `name` (string) = seu nome.
3. Abra o site com `#professor` no final do endereço e entre.
4. No painel, clique "Cadastrar os 8 aplicativos da escola".

## 3) Alunos
Painel do professor > "Cadastrar aluno" (nome, e-mail, senha). Depois abra o aluno e adicione materiais.
Ao excluir um aluno, o acesso dele ao painel deixa de funcionar; para apagar também o login, exclua-o em Authentication > Usuários.

## Aviso de segurança
Login, alunos e materiais escritos no painel são protegidos pelo Firebase. Já os arquivos dos aplicativos (`app-*.html`) ficam públicos no GitHub Pages: quem souber o endereço direto consegue abrir. Não coloque conteúdo pago/sigiloso dentro desses arquivos.

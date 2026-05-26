# HRZN Sphere

CRM local da Horizon Interactive Studios para organizar clientes, contratos, tarefas, contas a pagar, recebimentos e controle financeiro em um workspace único.

## Estrutura do projeto

```txt
server.js
public/index.html
public/styles.css
public/app.js
workspace/*.json
workspace/uploads/
```

## Recursos disponíveis

- Login obrigatório antes de acessar os dados do workspace.
- Configuração inicial do primeiro administrador.
- Sessão protegida por cookie HttpOnly.
- Senhas armazenadas com hash via `crypto.scrypt`.
- Gestão de usuários em **Configurações**.
- Papéis básicos: Administrador, Gestor e Operador.
- Cadastro de clientes com status comercial.
- Contratos editáveis, geração de PDF e upload de arquivos.
- Financeiro com categorias, limites mensais, gráficos e alertas calculados localmente.
- Contas a pagar e valores a receber.
- Tarefas com status, prioridade, comentários, subtarefas e histórico de atualizações.
- Backup/exportação de dados estruturados e manifesto de arquivos enviados.
- Importação dos dados estruturados do workspace.
- Registro técnico de ações administrativas e alterações principais.
- Endpoint de saúde em `/api/health`.
- Headers básicos de segurança HTTP.

## Como rodar localmente

1. Instale o Node.js 18 ou superior.
2. Abra o terminal na pasta do projeto.
3. Instale as dependências:

```bash
npm install
```

4. Inicie o servidor:

```bash
npm start
```

5. Acesse no navegador:

```txt
http://localhost:3000
```

Na primeira execução, o sistema solicita a criação do administrador inicial.

## Scripts

```bash
npm start
npm run check
```

`npm run check` valida a sintaxe de `server.js` e `public/app.js`.

## Armazenamento local

Os dados ficam na pasta:

```txt
workspace/
```

Arquivos principais:

```txt
workspace/config.json          dados da empresa e identidade
workspace/clients.json         clientes, status comercial e anexos
workspace/contracts.json       contratos salvos
workspace/finance.json         categorias, gastos e limites
workspace/bills.json           contas a pagar
workspace/receivables.json     valores a receber
workspace/tasks.json           tarefas, status e prioridades
workspace/uploads/             arquivos enviados
workspace/users.json           usuários locais
workspace/sessions.json        sessões ativas
workspace/audit-log.json       histórico técnico de ações
```

`users.json`, `sessions.json` e `audit-log.json` são criados na primeira execução quando ainda não existirem.

## Observações técnicas

Esta versão roda localmente com persistência em JSON. Para uso público, multiempresa ou em produção, o caminho recomendado é migrar a persistência para banco relacional e mover os arquivos para storage externo.

Pontos recomendados antes de produção:

- PostgreSQL ou banco equivalente;
- separação real por empresa/workspace;
- controle de assinatura/cobrança;
- deploy em cloud;
- autenticação em dois fatores;
- storage externo para arquivos;
- revisão formal de segurança e LGPD;
- testes automatizados.

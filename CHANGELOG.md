# Changelog — HRZN Sphere

## 1.1.0

### Correções

- Corrigidas chamadas internas de configuração e clientes.
- Corrigida a criação de contratos no front-end.
- Corrigida a associação de uploads aos contratos no backend.
- Reforçada a validação de caminho para download de arquivos.

### Acesso e administração

- Adicionado login obrigatório para rotas de dados.
- Adicionada configuração inicial do primeiro administrador.
- Adicionadas sessões por cookie HttpOnly.
- Adicionado hash de senha com `crypto.scrypt`.
- Adicionado CRUD administrativo de usuários.
- Adicionados papéis: `admin`, `manager` e `member`.
- Adicionado endpoint `/api/health`.
- Adicionado registro técnico de ações em `audit-log.json`.

### Backup e operação

- Exportação inclui clientes, contratos, financeiro, contas a pagar, recebimentos e tarefas.
- Exportação inclui manifesto dos arquivos enviados.
- Importação restaura dados estruturados do workspace.
- Reset limpa os módulos principais do workspace, conforme opção escolhida.

### Interface

- Adicionada tela de login e configuração inicial.
- Adicionado chip do usuário logado e botão de saída.
- Adicionada gestão de usuários em Configurações.
- Ajustados textos de interface para uma comunicação mais direta e operacional.

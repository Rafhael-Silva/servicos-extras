# Roadmap - Serviços Extras

## Verificação de Identidade

### Objetivo

Aumentar a confiança e a segurança da plataforma através da verificação de identidade dos usuários, permitindo liberar funcionalidades conforme o nível de confiança da conta.

### Fluxo

* Adicionar upload de selfie durante o cadastro ou pelo perfil.
* Adicionar upload da foto do documento (RG ou CNH).
* Armazenar os arquivos no S3.
* Criar status da verificação de identidade.
* Criar tela administrativa para análise dos documentos.
* Permitir aprovar ou rejeitar a verificação.
* Exibir selo **"Identidade Verificada"** no perfil após aprovação.

### Status da identidade

* Não enviada
* Enviada
* Verificada
* Rejeitada

### Regras

* O envio da documentação não bloqueia o cadastro inicialmente.
* O usuário pode utilizar a plataforma enquanto a documentação estiver em análise.
* Somente usuários com status **"Verificada"** recebem o selo de identidade verificada.
* Caso a documentação seja rejeitada, o usuário poderá enviar novos documentos.

### Evolução da verificação

#### Fase inicial

* Análise manual dos documentos.
* Aprovação realizada por administradores.

#### Futuras melhorias

* Integração com API de verificação automática de identidade.
* Reconhecimento facial (selfie + documento).
* Validação automática de CPF.
* Filtro para exibir apenas usuários verificados.

---

## Painel Administrativo

### Objetivo

Centralizar toda a administração da plataforma em um painel exclusivo, evitando alterações diretas no código, banco de dados ou migrations para operações do dia a dia.

### Conta administrativa

Adicionar um novo tipo de conta no Auth Service:

* `ADMIN`

Essa conta terá acesso ao painel administrativo da plataforma.

### Funcionalidades previstas

* Gerenciar usuários.
* Gerenciar empresas.
* Gerenciar categorias.
* Gerenciar cargos/funções.
* Ativar ou desativar categorias.
* Ativar ou desativar cargos.
* Aprovar ou rejeitar verificações de identidade.
* Bloquear e desbloquear contas.
* Visualizar métricas da plataforma.
* Gerenciar futuras configurações do sistema.

---

## Configurações da Plataforma

### Objetivo

Permitir que regras de negócio possam ser alteradas diretamente pelo painel administrativo, evitando alterações no código, novas migrations e novas publicações da aplicação.

### Configurações previstas

#### Financeiro

* Percentual de comissão da plataforma.
* Valor mínimo para saque.
* Valor mínimo para publicação de vagas (caso exista futuramente).
* Taxas administrativas.

#### Publicação de vagas

* Categorias habilitadas.
* Cargos/Funções disponíveis.
* Limite de vagas por usuário.
* Limite de candidatos por vaga (se necessário).
* Regras para publicação.

#### Segurança

* Categorias que exigem identidade verificada.
* Categorias que exigem reconhecimento facial.
* Tempo de bloqueio após tentativas de login.
* Regras de antifraude.

#### Plataforma

* Manutenção da plataforma.
* Mensagens globais.
* Banners.
* Avisos.
* Categorias em destaque.

#### Usuários

* Alteração de permissões.
* Promoção de usuários para administradores.
* Gerenciamento de empresas.
* Gerenciamento de usuários.

#### Monitoramento

* Estatísticas de usuários.
* Estatísticas de vagas.
* Estatísticas de candidaturas.
* Relatórios administrativos.

---

## Evolução do Job Service

### Objetivo

Permitir que tanto **Pessoa Física** quanto **Empresa** publiquem vagas, mantendo toda a lógica relacionada às vagas centralizada no **Job Service**.

### Responsabilidades dos Microserviços

#### Auth Service

Responsável por:

* Autenticação.
* CPF ou CNPJ.
* Tipo da conta (`PERSON`, `COMPANY` ou `ADMIN`).
* Controle de acesso.
* Validação da idade do responsável.
* Recuperação de senha.
* Segurança da conta.

#### User Service

Responsável por:

* PersonProfile.
* CompanyProfile.
* Curriculum (apenas PersonProfile).

O User Service não deve conter regras relacionadas às vagas.

#### Job Service

Responsável por:

* Publicação de vagas.
* Categorias.
* Cargos/Funções.
* Processo seletivo.
* Regras para criação de vagas.
* Contratações.

---

## Publicação de vagas

### Regra geral

As vagas poderão ser publicadas por:

* Pessoa Física.
* Empresa.

A criação da vaga será vinculada ao **User**, independentemente do tipo da conta.

### Dados preenchidos automaticamente

Ao iniciar uma nova vaga, o sistema preencherá automaticamente:

* Nome da pessoa ou empresa.
* Foto ou logotipo.
* Cidade.
* Avaliações (quando implementadas).

O anunciante preencherá apenas as informações específicas da vaga:

* Cargo/Função.
* Valor.
* Data.
* Horário.
* Endereço.
* Benefícios (alimentação, transporte etc.).
* Observações.

---

## Categorias e Cargos

### Objetivo

Separar a área de atuação da função exercida.

### Exemplo

#### Hotelaria e Eventos

* Garçom
* Garçonete
* Recepcionista
* Camareira
* Cozinheiro
* Auxiliar de cozinha

#### Segurança

* Segurança de evento
* Controlador de acesso

#### Limpeza

* Faxineiro
* Auxiliar de limpeza

#### Serviços Domésticos

* Babá
* Cuidador de idosos
* Jardineiro

As vagas deverão referenciar o **cargo**, enquanto a **categoria** será utilizada para organização, filtros e regras da plataforma.

---

## Liberação Gradual de Categorias

### Primeira fase

Disponibilizar inicialmente categorias de menor risco:

* Hotelaria.
* Eventos.
* Restaurantes.
* Bares.
* Segurança para eventos.

### Objetivos

* Validar o produto.
* Reduzir riscos de fraude.
* Construir reputação da plataforma.
* Monetizar.

### Segunda fase

Após a implementação de mecanismos mais robustos de segurança:

* Reconhecimento facial.
* Validação automática de identidade.
* Processos antifraude.

Liberar categorias mais sensíveis:

* Babá.
* Cuidador de idosos.
* Serviços residenciais.
* Outras atividades que exijam maior nível de confiança.

---

## Princípios da Arquitetura

* Cada conta representa apenas um tipo (`PERSON`, `COMPANY` ou `ADMIN`).
* O Job Service será responsável por toda a lógica relacionada às vagas.
* O User Service fornecerá apenas os dados públicos do anunciante.
* O Auth Service será responsável pela autenticação e pela identidade da conta.
* A liberação de determinadas funcionalidades poderá depender do nível de verificação da identidade do usuário.
* Configurações operacionais da plataforma deverão ser realizadas pelo painel administrativo, evitando alterações no código e reduzindo a necessidade de novas migrations para mudanças de regras de negócio.

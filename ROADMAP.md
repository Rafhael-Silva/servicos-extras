# Roadmap - Serviços Extras

## Verificação de Identidade

**Objetivo**

Aumentar a confiança e a segurança da plataforma através da verificação manual da identidade dos usuários.

### Fluxo

- Adicionar upload de selfie durante o cadastro ou pelo perfil.
- Adicionar upload da foto do documento (RG ou CNH).
- Armazenar os arquivos no S3.
- Criar status da verificação de identidade.
- Criar tela administrativa para análise dos documentos.
- Permitir aprovar ou rejeitar a verificação.
- Exibir selo "Identidade Verificada" no perfil após aprovação.

### Status da identidade

- Não enviada
- Enviada
- Verificada
- Rejeitada

### Regras

- O envio da documentação não bloqueia o cadastro inicialmente.
- O usuário pode utilizar a plataforma enquanto a documentação estiver em análise.
- Somente usuários com status "Verificada" recebem o selo de identidade verificada.
- Caso a documentação seja rejeitada, o usuário poderá enviar novos documentos.

### Futuras melhorias

- Integração com API de verificação automática de identidade.
- Verificação facial (selfie + documento).
- Validação automática de CPF.
- Filtro para exibir apenas usuários verificados.
- Exigir verificação de identidade para determinadas funcionalidades da plataforma.
# Administração ZenatoCell

O painel está em **/admin**. Sem banco configurado, exibe somente o catálogo existente e instruções; não simula vendas, autenticação ou faturamento.

## Instalação

1. Crie um projeto em https://supabase.com/dashboard. Guarde a senha do banco em local seguro.
2. No SQL Editor, execute `supabase/migrations/001_admin.sql` uma vez em um projeto novo.
3. Execute `supabase/seed.sql`. Importa o catálogo atual com estoque zero. Repetir não sobrescreve alterações.
4. Em Authentication → Providers, desative novas inscrições públicas. Crie sua conta em Authentication → Users, confirmando o e-mail.
5. Execute no SQL Editor, substituindo o e-mail pela sua conta:

```sql
insert into public.members(user_id,email,role,active)
select id,email,'superadmin',true from auth.users
where email='SEU_EMAIL_AQUI'
on conflict(user_id) do update set role='superadmin',active=true;
```

6. Copie `.env.example` para `.env.local` e preencha a URL do projeto e a **publishable key** em Project Settings → API Keys. Nunca use service_role ou secret key no navegador.
7. Reinicie o servidor. Na Vercel configure essas mesmas duas variáveis e faça um novo deployment.
8. Entre em /admin, confira os produtos e registre o estoque inicial de cada item.

## Perfis

- **Superadmin:** gerencia toda a operação e libera/suspende contas.
- **Proprietário:** catálogo, fotos, estoque, pedidos e financeiro.
- **Funcionário:** consulta catálogo interno, movimenta estoque e confirma pedidos. Não registra pagamentos, estornos ou lançamentos financeiros.

As contas adicionais são criadas no Supabase Auth. O superadmin libera o UUID correspondente na aba Equipe. Não há cadastro público ou senha padrão. Revogar acesso no painel bloqueia as consultas e alterações no banco, mesmo com uma sessão ainda aberta.

## Produtos e estoque

A seção **Produtos** reúne cadastro, preço, publicação e saldo disponível. Os filtros permitem encontrar itens por condição e disponibilidade. Cada linha tem ações de **Cadastro**, **Estoque** e **Histórico**. Somente gestores editam o cadastro; a equipe autorizada pode registrar entradas e saídas com motivo.

O formulário de estoque usa quantidades positivas e uma escolha explícita entre entrada e saída. Mostra o saldo previsto e impede saídas acima do disponível, mantendo a verificação definitiva no banco. O histórico por produto consulta os últimos 100 registros daquele item; a aba Movimentações de estoque mostra os últimos 100 da operação.

Os seletores compartilham o componente AdminSelect, com SVG, menu adaptado ao espaço disponível, suporte a teclado e integração com os formulários.

## Pedidos, estoque e financeiro

Enviar um carrinho pelo WhatsApp **não confirma uma venda**. O proprietário registra o pedido após conversar com o cliente. Pedido pendente não baixa estoque; confirmar baixa as unidades em uma transação. Estoque insuficiente impede a confirmação completa. Registrar pagamento gera uma única entrada vinculada ao pedido. Cancelar repõe o estoque; cancelar um pedido pago também registra um estorno. As operações são protegidas contra repetição por bloqueio de registro e mudança de estado.

Os preços e custos dos itens são copiados para o pedido no servidor. Alterações futuras no produto não modificam a venda registrada. Valores são armazenados em centavos. Custos de aquisição não geram uma despesa automaticamente: registre o pagamento ao fornecedor em Financeiro para evitar dupla contagem. O saldo exibido é de lançamentos registrados, sem conciliação bancária ou apuração fiscal.

## Catálogo e fotos

A vitrine consulta os produtos publicados quando o banco está configurado. Sem configuração, mantém o catálogo original. Se o banco configurado falhar, a consulta acusa erro em vez de publicar dados antigos silenciosamente. O cadastro aceita imagens JPG, PNG e WebP até 5 MB. Remover uma foto retira a referência do produto; não apaga arquivos do Storage automaticamente. Desmarcar Publicar na loja oculta o produto e preserva histórico de vendas.

## Segurança e manutenção

RLS protege as tabelas; a vitrine recebe apenas campos públicos pela view store_products. Mutações passam por funções que validam o usuário no banco. O custo unitário faz parte do catálogo interno acessível à equipe autorizada; os lançamentos financeiros são exclusivos dos gestores. Nunca torne tabelas de pedidos ou membros públicas.

Antes de produção: execute a migração num ambiente de homologação, teste cada perfil com contas separadas, teste confirmação/cancelamento concorrentes, configure recuperação de senha no Supabase Auth e mantenha backups conforme o plano contratado. O código foi preparado sem credenciais: a integração real só pode ser validada depois de criar o projeto.

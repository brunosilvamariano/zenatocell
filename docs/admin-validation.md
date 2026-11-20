# Validação funcional do painel — 19/11/2026

## Resultado

67 verificações passaram em PostgreSQL efêmero (PGlite), sem conexão com dados de produção. TypeScript aprovado. A interface publicada foi conferida em uma sessão real de superadministrador, com leitura de dados e abertura/fechamento de formulários; não foram criadas vendas, receitas, despesas ou movimentações fictícias na loja real.

## Cobertura automatizada

- Catálogo público e dados internos separados; visitantes e usuários sem vínculo não acessam a operação.
- Cadastro e atualização de produto, saldo inicial zero, edição preservando estoque, publicação e ocultação da vitrine.
- Fotos obrigatórias e referências não vazias; preços e custos negativos bloqueados.
- Entradas e saídas de estoque, motivo obrigatório, bloqueio de saldo negativo e preservação do saldo após erro.
- Pedidos com itens obrigatórios, quantidades válidas e produtos existentes; preço e custo calculados no servidor e preservados como histórico.
- Pedido pendente não baixa estoque; confirmação baixa uma vez; pagamento gera um recebimento; cancelamento restitui estoque e, quando pago, gera estorno uma vez.
- Transições inválidas bloqueadas; itens duplicados não burlam saldo; falha no segundo item reverte toda a operação e não deixa movimentos parciais.
- Lançamentos financeiros em centavos; zero e valores negativos rejeitados.
- Funcionário não altera cadastro, não recebe acesso ao financeiro, não registra pagamento, não estorna venda paga e não altera permissões ou identidade.
- Proprietário mantém produtos e financeiro, mas não concede acessos. Superadministrador não pode suspender a própria conta. Conta suspensa perde acesso aos dados.
- Nome e logo públicos; somente gestores alteram a identidade e enviam arquivos no namespace permitido.

## Conferência da interface publicada

- Sessão real conectada com 30 produtos e zero unidades, pedidos e lançamentos registrados.
- Busca por iPhone 11 retornou o cadastro correspondente. Formulário carregou nome, preço, parcela, garantia e foto.
- Saída de uma unidade com saldo zero mostrou aviso e desabilitou confirmação.
- Formulário de pedido: quantidade três de um produto de R$ 2.399,00 resultou em R$ 7.197,00; adicionar e remover uma linha funcionou. Nenhum pedido foi salvo.
- Formulários de lançamento, equipe e identidade carregaram sem erros de console capturados na sessão.
- Tela de 390 px sem overflow horizontal; menu mobile abriu e fechou ao escolher Produtos; cards e seletor de condição conferidos. Emulação removida após o teste.

## Falhas encontradas e corrigidas

1. `save_product` aceitava requisição sem a propriedade `photos`, embora rejeitasse array vazio. Agora exige array com pelo menos uma string não vazia.
2. `create_order` aceitava `p_items` SQL NULL e criava pedido sem itens. Agora exige um array, além dos limites já existentes.

Correções em `supabase/migrations/003_product_validation.sql`, aplicadas no projeto Supabase existente, com resultado `Success. No rows returned`. A migração preserva dados e permissões; não altera as rotinas de pagamento nem o visual.

## Limites e preparação da entrega

Esta rodada não equivale a um ciclo de compra completo no Supabase real: upload persistente de fotos/logo, login de contas separadas de proprietário/funcionário, exportação CSV com dados reais e concorrência de confirmações não foram exercitados de ponta a ponta no ambiente hospedado. PGlite verifica SQL e políticas com identidades simuladas; não reproduz integralmente Supabase Auth, Storage, rede ou concorrência de múltiplas sessões.

Antes da entrega comercial: conferir o estoque real (todos os 30 produtos estavam com saldo zero), validar esses fluxos em homologação com contas próprias e aguardar a resolução do alerta de possível phishing no Google. O cadastro de clientes, os pedidos e o financeiro reais permaneceram intactos nesta rodada.
# 📊 Knowledge Base: Sistema de Dados Shopify - Blessy Sales Dashboard

## 🏗️ Arquitetura Geral dos Dados Shopify

### Fontes de Dados Configuráveis
O sistema possui uma configuração flexível de fonte de dados através da tabela `system_settings`:

```sql
-- Configuração atual: 'automatic' (usa dados automáticos do Shopify)
-- Alternativa: 'manual' (usa dados inseridos manualmente)
SELECT value FROM system_settings WHERE key = 'shopify_data_source'
```

### Fluxo de Dados Shopify
1. **Ingestão**: Dados brutos do Shopify são inseridos na `shopify_orders_ingest`
2. **Processamento**: Função `process_shopify_orders_gold_since()` transforma dados brutos em estrutura normalizada na `shopify_orders_gold`
3. **Consumo**: Funções especializadas extraem dados para dashboards e relatórios

## 🗃️ Estrutura das Tabelas

### 1. `shopify_orders_ingest` (Dados Brutos)
- **Propósito**: Armazenamento de dados JSON brutos recebidos do Shopify
- **Campos principais**:
  - `id`: ID único do pedido
  - `payload`: JSON completo do pedido do Shopify
  - `ingested_at`: Timestamp de ingestão
  - `file_name`: Origem do arquivo/processo

### 2. `shopify_orders_gold` (Dados Processados)
Tabela principal com dados normalizados e enriquecidos:

#### **Campos de Identificação**
- `id`: ID único do pedido
- `order_number`: Número do pedido visível
- `name`: Nome/código do pedido

#### **Campos Temporais (Fuso Horário: America/Sao_Paulo)**
- `created_at`: Data/hora de criação
- `updated_at`: Data/hora de atualização
- `cancelled_at`: Data/hora de cancelamento (se aplicável)

#### **Status e Estados**
- `financial_status`: Status financeiro ('paid', 'pending', etc.)
- `fulfillment_status`: Status de entrega
- `test`: Boolean indicando se é pedido de teste
- `cancel_reason`: Motivo do cancelamento

#### **Valores Financeiros (NUMERIC)**
- `total_price`: Valor total do pedido
- `subtotal_price`: Subtotal (sem frete/taxas)
- `total_line_items_price`: Valor total dos itens
- `total_discounts`: Total de descontos
- `shipping_amount`: Valor do frete

#### **Informações de Cupons e Descontos**
- `coupon_code`: Código do primeiro cupom aplicado
- `coupon_amount`: Valor do desconto do cupom
- `coupon_type`: Tipo do cupom
- `discount_codes`: JSON array com todos os cupons aplicados

#### **Dados do Cliente**
- `customer_id`: ID do cliente
- `customer_email`: Email do cliente
- `customer_phone`: Telefone
- `customer_first_name`: Primeiro nome
- `customer_last_name`: Sobrenome

#### **Dados de Entrega**
- `ship_city`: Cidade de entrega
- `ship_province`: Estado
- `ship_zip`: CEP
- `ship_country_code`: Código do país

#### **Marketing e UTMs**
- `utm_source`: Fonte da campanha
- `utm_medium`: Meio da campanha
- `utm_campaign`: Nome da campanha
- `utm_content`: Conteúdo da campanha
- `utm_term`: Termo da campanha
- `landing_site`: Site de entrada
- `referring_site`: Site de referência

#### **Informações de Pagamento**
- `payment_gateway`: Gateway de pagamento
- `payment_method_code`: Código do método
- `payment_installments`: Número de parcelas
- `payment_cc_brand`: Bandeira do cartão
- `payment_method_bucket`: Categoria ('Pix', 'Credit', 'Other')

#### **Dados Derivados**
- `items_count`: Quantidade total de itens
- `is_bundle`: Se é um bundle de produtos
- `channel_bucket`: Categoria do canal ('Ads', 'Organic', 'Referral', 'Direct/Other')

#### **Dados Estruturados (JSONB)**
- `items`: Array de itens do pedido
- `shipping_lines`: Array de informações de frete
- `discount_codes`: Array completo de cupons

## 🔧 Funções Principais para Extração de Dados

### 1. `get_shopify_precise_sales(start_date, end_date)`
**Função principal para cálculo de vendas Shopify**

#### **Lógica de Negócio**:
- Utiliza `current_total_price` do payload JSON (valor após devoluções)
- Filtra por fuso horário de São Paulo
- **Filtros aplicados**:
  - `test = false` (exclui pedidos de teste)
  - `financial_status = 'paid'` (apenas pedidos pagos)
  - `cancelled_at IS NULL` (exclui cancelados)

#### **Retorno**: 
```sql
TABLE(sale_date date, total_sales numeric)
```

#### **Uso no Dashboard**:
```sql
-- Total para um período
SELECT SUM(total_sales) FROM get_shopify_precise_sales('2025-09-01', '2025-09-17');
```

### 2. `get_dashboard_sales(start_date, end_date)`
**Função integradora para o dashboard principal**

#### **Comportamento baseado em `shopify_data_source`**:
- **'automatic'**: Usa `get_shopify_precise_sales()` para Shopify + `daily_sales` para outros canais
- **'manual'**: Usa apenas `daily_sales` para todos os canais

### 3. `compare_shopify_sales_debug(target_date)`
**Função para debugging de discrepâncias**

#### **Retorna**:
- `manual_value`: Valor inserido manualmente
- `automatic_value`: Valor calculado automaticamente
- `orders_count`: Quantidade de pedidos
- `difference`: Diferença entre manual e automático
- `difference_percent`: Percentual da diferença

### 4. `get_shopify_orders_debug(target_date)`
**Função para investigar pedidos específicos de um dia**

## 📊 Integração com Metas (Sales Targets)

### Canal Shopify
- **ID do Canal**: `ecd8abbc-8a9f-4844-aa7c-efef5489ec41`
- **Nome**: "Shopify"
- **Tipo**: Channel configurado na tabela `channels`

### Metas na Tabela `sales_targets`
```sql
-- Buscar meta do Shopify para um mês específico
SELECT target_amount 
FROM sales_targets 
WHERE channel_id = 'ecd8abbc-8a9f-4844-aa7c-efef5489ec41'
  AND year = 2025 
  AND month = 9;
```

### Cálculos de Performance
```sql
-- Performance atual vs meta
WITH shopify_sales AS (
  SELECT SUM(total_sales) as realized
  FROM get_shopify_precise_sales('2025-09-01', '2025-09-17')
),
target AS (
  SELECT target_amount
  FROM sales_targets 
  WHERE channel_id = 'ecd8abbc-8a9f-4844-aa7c-efef5489ec41'
    AND year = 2025 AND month = 9
)
SELECT 
  s.realized,
  t.target_amount,
  ((s.realized / t.target_amount) * 100) as performance_percent
FROM shopify_sales s, target t;
```

## 🎯 Social Media Sales (Integração Especializada)

### Tabelas Auxiliares
- **`social_media_coupons`**: Lista de cupons de redes sociais
- **`social_media_sales`**: Vendas históricas de redes sociais (dados legados)

### Função `get_social_media_sales_unified()`
Combina dados de `social_media_sales` e `shopify_orders_gold` filtrando por cupons de redes sociais.

## ⚠️ Pontos Críticos para Desenvolvimento

### 1. **Fuso Horário**
- **SEMPRE** usar `America/Sao_Paulo` para conversões
- Filtros de data devem considerar o fuso correto
- Exemplo: `DATE(created_at AT TIME ZONE 'America/Sao_Paulo')`

### 2. **Status de Pedidos**
- **Status incluídos**: `financial_status = 'paid'`
- **Status excluídos**: pedidos 'pending' (R$ 18.144,05 em Set/2025)
- **Pedidos de teste**: sempre excluídos (`test = false`)
- **Pedidos cancelados**: excluídos (`cancelled_at IS NULL`)

### 3. **Valores Financeiros**
- **Campo principal**: `current_total_price` (do JSON payload)
- **Alternativo**: `total_price` (da tabela gold)
- **Diferença**: `current_total_price` considera devoluções

### 4. **Configuração de Fonte de Dados**
```sql
-- Verificar fonte atual
SELECT value FROM system_settings WHERE key = 'shopify_data_source';

-- Alterar para automático
UPDATE system_settings 
SET value = 'automatic' 
WHERE key = 'shopify_data_source';
```

## 🔍 Debug e Troubleshooting

### Discrepâncias Comuns
1. **Diferença entre manual vs automático**: Usar `compare_shopify_sales_debug()`
2. **Pedidos não incluídos**: Verificar filtros de status
3. **Fuso horário**: Confirmar conversão para São Paulo
4. **Pedidos pending**: Decisão de negócio se incluir ou não

### Queries Úteis para Debug
```sql
-- Verificar status dos pedidos em um período
SELECT financial_status, COUNT(*), SUM(total_price)
FROM shopify_orders_gold 
WHERE DATE(created_at AT TIME ZONE 'America/Sao_Paulo') BETWEEN '2025-09-01' AND '2025-09-17'
GROUP BY financial_status;

-- Verificar pedidos de teste
SELECT COUNT(*), SUM(total_price)
FROM shopify_orders_gold 
WHERE test = true 
AND DATE(created_at AT TIME ZONE 'America/Sao_Paulo') BETWEEN '2025-09-01' AND '2025-09-17';
```

## 📈 Performance e Otimização

### Índices Recomendados
- `created_at` com timezone
- `financial_status`
- `test`
- `cancelled_at`

### Limitações Conhecidas
- Processamento em lote via `process_shopify_orders_gold_since()`
- Dependência do payload JSON para valores precisos
- Necessidade de sincronização entre ingest e gold

---

Este knowledge base fornece uma visão completa do sistema de dados Shopify, incluindo estruturas, funções, filtros e pontos críticos para desenvolvimento e manutenção do sistema.

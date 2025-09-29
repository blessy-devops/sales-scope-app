# Roadmap: Sistema de Metas - Evolução dos Subcanais

## 📋 Situação Atual (Setembro 2025)

### Problema Identificado
- **Duplicação de metas do Shopify:** As metas principais + subcanais estavam sendo somadas incorretamente no dashboard
- **Solução temporária implementada:** Filtrar apenas metas principais (`sub_channel_id IS NULL`) no cálculo global do dashboard

### Estrutura Atual
```
Canal Principal (Shopify)
├── Meta Principal: R$ 1.585.184,90 ← Usado no dashboard global
└── Subcanais:
    ├── Instagram BIO: R$ 78.000,00
    ├── Google Ads: R$ 50.000,00
    ├── Instagram Manychat: R$ 12.000,00
    └── Pinterest: R$ 5.000,00
```

## 🎯 Plano Futuro

### Fase 1: Transição (Próximos meses)
- [ ] Cadastrar **TODOS** os subcanais do Shopify
- [ ] Definir metas para cada subchanl baseadas na meta global atual
- [ ] Validar que a soma das metas dos subcanais = meta global

### Fase 2: Migração do Sistema
- [ ] **Remover metas principais** para canais que possuem subcanais
- [ ] **Meta global = soma automática das metas dos subcanais**
- [ ] Implementar validação: canal com subcanais não pode ter meta principal
- [ ] Atualizar dashboard para calcular meta global como soma dos subcanais

### Fase 3: Sistema Final
```
Canal Principal (Shopify) - Meta calculada automaticamente
├── Meta Calculada: R$ 145.000,00 (soma dos subcanais)
└── Subcanais:
    ├── Instagram BIO: R$ 78.000,00
    ├── Google Ads: R$ 50.000,00
    ├── Instagram Manychat: R$ 12.000,00
    └── Pinterest: R$ 5.000,00
```

## 🔧 Implementações Técnicas Necessárias

### Banco de Dados
```sql
-- Trigger para validar que canais com subcanais não tenham meta principal
-- Função para calcular meta global como soma dos subcanais
-- Constraint para evitar metas duplicadas
```

### Código
- **Dashboard (`src/pages/Index.tsx`):** Calcular meta global dinamicamente
- **Hook (`src/hooks/useTargets.ts`):** Função para calcular metas compostas
- **Interface de metas:** Desabilitar meta principal quando houver subcanais

## ⚠️ Validações Futuras
1. **Consistência:** Todos os subcanais devem ter metas definidas
2. **Integridade:** Canal com subcanais não pode ter meta principal
3. **Performance:** Cache das metas calculadas para evitar recálculos desnecessários

## 📅 Timeline Estimado
- **Q4 2025:** Cadastro completo dos subcanais
- **Q1 2026:** Migração do sistema de metas
- **Q2 2026:** Sistema final implementado

---
*Este documento será atualizado conforme o progresso da implementação.*
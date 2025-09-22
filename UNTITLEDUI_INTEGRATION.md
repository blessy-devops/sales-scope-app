# Integração UntitledUI - Sales Scope App

Este documento descreve a integração dos componentes UntitledUI no projeto Sales Scope App.

## 📦 Componentes Disponíveis

### Base Components

#### Button
Componente de botão com múltiplas variantes e tamanhos.

```tsx
import { Button } from '@/components/untitledui/base';

// Exemplos de uso
<Button size="sm" color="primary" iconLeading={Plus}>
  Primary Small
</Button>

<Button size="md" color="secondary" iconTrailing={Settings}>
  Secondary Medium
</Button>

<Button isLoading>
  Loading Button
</Button>
```

**Props:**
- `size`: "sm" | "md" | "lg" | "xl"
- `color`: "primary" | "secondary" | "tertiary" | "link-gray" | "link-color" | "primary-destructive" | "secondary-destructive" | "tertiary-destructive" | "link-destructive"
- `iconLeading`: Componente de ícone à esquerda
- `iconTrailing`: Componente de ícone à direita
- `isLoading`: Estado de carregamento
- `isDisabled`: Estado desabilitado

#### Input
Componente de input com suporte a ícones, tooltips e validação.

```tsx
import { Input } from '@/components/untitledui/base';

// Exemplos de uso
<Input
  label="Nome"
  placeholder="Digite seu nome"
  icon={User}
  hint="Este é um campo obrigatório"
  isRequired
/>

<Input
  label="Com Tooltip"
  placeholder="Campo com tooltip"
  tooltip="Este é um tooltip explicativo"
/>
```

**Props:**
- `size`: "sm" | "md"
- `label`: Texto do label
- `placeholder`: Texto placeholder
- `icon`: Componente de ícone
- `hint`: Texto de ajuda
- `tooltip`: Texto do tooltip
- `isRequired`: Campo obrigatório
- `isInvalid`: Estado de erro

#### Badge
Componente de badge com múltiplas variantes.

```tsx
import { Badge, BadgeWithDot, BadgeWithIcon, BadgeWithButton } from '@/components/untitledui/base';

// Badge básico
<Badge color="success">Success</Badge>

// Badge com dot
<BadgeWithDot color="success">Online</BadgeWithDot>

// Badge com ícone
<BadgeWithIcon color="brand" iconLeading={User}>User</BadgeWithIcon>

// Badge com botão de remoção
<BadgeWithButton 
  color="brand" 
  onButtonClick={() => alert('Removed!')}
  buttonLabel="Remove item"
>
  Removable Item
</BadgeWithButton>
```

**Props:**
- `type`: "pill-color" | "badge-color" | "badge-modern"
- `size`: "sm" | "md" | "lg"
- `color`: "gray" | "brand" | "error" | "warning" | "success" | "blue" | "purple" | etc.

## 🎨 Cores Disponíveis

### Badge Colors
- `gray` - Cinza neutro
- `brand` - Cor primária do tema
- `error` - Vermelho para erros
- `warning` - Amarelo para avisos
- `success` - Verde para sucesso
- `blue` - Azul
- `purple` - Roxo
- `pink` - Rosa
- `orange` - Laranja
- `indigo` - Índigo
- `gray-blue` - Azul acinzentado
- `blue-light` - Azul claro

## 📱 Tamanhos

### Button Sizes
- `sm` - Pequeno (padding: px-3 py-2)
- `md` - Médio (padding: px-3.5 py-2.5)
- `lg` - Grande (padding: px-4 py-2.5)
- `xl` - Extra grande (padding: px-4.5 py-3)

### Input Sizes
- `sm` - Pequeno (padding: px-3 py-2)
- `md` - Médio (padding: px-3.5 py-2.5)

### Badge Sizes
- `sm` - Pequeno (text-xs)
- `md` - Médio (text-sm)
- `lg` - Grande (text-sm, padding maior)

## 🚀 Como Usar

### 1. Importar os Componentes

```tsx
import { Button, Input, Badge } from '@/components/untitledui/base';
import { Plus, User, Settings } from 'lucide-react';
```

### 2. Usar nos Seus Componentes

```tsx
export const MyComponent = () => {
  return (
    <div className="space-y-4">
      <Button color="primary" iconLeading={Plus}>
        Adicionar Item
      </Button>
      
      <Input
        label="Email"
        placeholder="seu@email.com"
        icon={User}
        type="email"
      />
      
      <Badge color="success">Ativo</Badge>
    </div>
  );
};
```

## 📄 Exemplo Completo

Veja o arquivo `src/components/UntitledUIExample.tsx` para exemplos completos de uso de todos os componentes.

Para visualizar os exemplos, você pode:

1. Adicionar uma rota para a página de demo:
```tsx
// No seu router
import { UntitledUIDemo } from '@/pages/UntitledUIDemo';

// Adicionar a rota
<Route path="/untitledui-demo" element={<UntitledUIDemo />} />
```

2. Ou usar os componentes diretamente em suas páginas existentes.

## 🎯 Integração com o Projeto

Os componentes UntitledUI foram adaptados para funcionar com:

- **Tailwind CSS** - Usando as classes do seu projeto
- **Lucide React** - Para ícones (já instalado no projeto)
- **Sistema de Cores** - Compatível com o tema dark/light do projeto
- **TypeScript** - Totalmente tipado

## 🔧 Personalização

### Cores Customizadas

Você pode adicionar novas cores modificando o objeto `filledColors` em `src/components/untitledui/base/badge.tsx`:

```tsx
export const filledColors: Record<BadgeColors, { root: string; addon: string; addonButton: string }> = {
  // ... cores existentes
  'minha-cor': {
    root: "bg-blue-100 text-blue-800 ring-blue-200",
    addon: "text-blue-600",
    addonButton: "hover:bg-blue-200 text-blue-500 hover:text-blue-600",
  },
};
```

### Estilos Customizados

Os componentes usam a função `cn` do seu projeto para combinar classes CSS. Você pode sobrescrever estilos passando `className`:

```tsx
<Button className="bg-custom-color text-white hover:bg-custom-color/90">
  Botão Customizado
</Button>
```

## 📚 Próximos Passos

1. **Adicionar mais componentes** - Copiar outros componentes do UntitledUI conforme necessário
2. **Criar variantes específicas** - Adaptar componentes para casos de uso específicos do projeto
3. **Integrar com formulários** - Usar os inputs com react-hook-form
4. **Adicionar animações** - Integrar com framer-motion se necessário

## 🐛 Troubleshooting

### Problemas Comuns

1. **Ícones não aparecem**: Certifique-se de que o ícone está sendo importado do `lucide-react`
2. **Cores não funcionam**: Verifique se as classes CSS estão sendo aplicadas corretamente
3. **TypeScript errors**: Verifique se os tipos estão sendo importados corretamente

### Suporte

Para dúvidas ou problemas, consulte:
- Documentação original do UntitledUI
- Exemplos em `src/components/UntitledUIExample.tsx`
- Código fonte dos componentes em `src/components/untitledui/base/`

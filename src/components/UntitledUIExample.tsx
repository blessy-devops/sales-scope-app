import React from 'react';
import { Button, Input, Badge, BadgeWithDot, BadgeWithIcon, BadgeWithButton } from './untitledui/base';
import { Plus, Settings, User, Mail } from 'lucide-react';

export const UntitledUIExample = () => {
  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">UntitledUI Components Example</h2>
        <p className="text-muted-foreground">
          Exemplos de uso dos componentes UntitledUI adaptados para o seu projeto.
        </p>
      </div>

      {/* Buttons Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <Button size="sm" color="primary" iconLeading={Plus}>
            Primary Small
          </Button>
          <Button size="md" color="secondary" iconTrailing={Settings}>
            Secondary Medium
          </Button>
          <Button size="lg" color="tertiary">
            Tertiary Large
          </Button>
          <Button size="xl" color="primary-destructive">
            Destructive XL
          </Button>
          <Button color="link-color" iconLeading={User}>
            Link Button
          </Button>
          <Button isLoading>
            Loading Button
          </Button>
        </div>
      </div>

      {/* Inputs Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Inputs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Input
            label="Nome"
            placeholder="Digite seu nome"
            icon={User}
            hint="Este é um campo obrigatório"
            isRequired
          />
          <Input
            label="Email"
            placeholder="seu@email.com"
            icon={Mail}
            type="email"
            hint="Digite um email válido"
          />
          <Input
            label="Senha"
            placeholder="Digite sua senha"
            type="password"
            isRequired
          />
          <Input
            label="Com Tooltip"
            placeholder="Campo com tooltip"
            tooltip="Este é um tooltip explicativo"
          />
        </div>
      </div>

      {/* Badges Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Badges</h3>
        <div className="space-y-6">
          {/* Basic Badges */}
          <div>
            <h4 className="text-lg font-medium text-foreground mb-3">Basic Badges</h4>
            <div className="flex flex-wrap gap-2">
              <Badge color="gray">Gray</Badge>
              <Badge color="brand">Brand</Badge>
              <Badge color="success">Success</Badge>
              <Badge color="warning">Warning</Badge>
              <Badge color="error">Error</Badge>
              <Badge color="blue">Blue</Badge>
              <Badge color="purple">Purple</Badge>
            </div>
          </div>

          {/* Badge Sizes */}
          <div>
            <h4 className="text-lg font-medium text-foreground mb-3">Badge Sizes</h4>
            <div className="flex flex-wrap items-center gap-2">
              <Badge size="sm" color="brand">Small</Badge>
              <Badge size="md" color="brand">Medium</Badge>
              <Badge size="lg" color="brand">Large</Badge>
            </div>
          </div>

          {/* Badge Types */}
          <div>
            <h4 className="text-lg font-medium text-foreground mb-3">Badge Types</h4>
            <div className="flex flex-wrap gap-2">
              <Badge type="pill-color" color="brand">Pill Color</Badge>
              <Badge type="badge-color" color="brand">Badge Color</Badge>
              <Badge type="badge-modern" color="gray">Badge Modern</Badge>
            </div>
          </div>

          {/* Badges with Dots */}
          <div>
            <h4 className="text-lg font-medium text-foreground mb-3">Badges with Dots</h4>
            <div className="flex flex-wrap gap-2">
              <BadgeWithDot color="success">Online</BadgeWithDot>
              <BadgeWithDot color="warning">Away</BadgeWithDot>
              <BadgeWithDot color="error">Offline</BadgeWithDot>
              <BadgeWithDot color="brand">Active</BadgeWithDot>
            </div>
          </div>

          {/* Badges with Icons */}
          <div>
            <h4 className="text-lg font-medium text-foreground mb-3">Badges with Icons</h4>
            <div className="flex flex-wrap gap-2">
              <BadgeWithIcon color="success" iconLeading={User}>User</BadgeWithIcon>
              <BadgeWithIcon color="brand" iconTrailing={Settings}>Settings</BadgeWithIcon>
              <BadgeWithIcon color="warning" iconLeading={Mail}>Email</BadgeWithIcon>
            </div>
          </div>

          {/* Badges with Buttons */}
          <div>
            <h4 className="text-lg font-medium text-foreground mb-3">Badges with Buttons</h4>
            <div className="flex flex-wrap gap-2">
              <BadgeWithButton 
                color="brand" 
                onButtonClick={() => alert('Removed!')}
                buttonLabel="Remove item"
              >
                Removable Item
              </BadgeWithButton>
              <BadgeWithButton 
                color="gray" 
                onButtonClick={() => alert('Deleted!')}
                buttonLabel="Delete item"
              >
                Deletable Item
              </BadgeWithButton>
            </div>
          </div>
        </div>
      </div>

      {/* Usage in Context */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Usage in Context</h3>
        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h4 className="text-lg font-medium text-card-foreground">Sales Dashboard</h4>
              <BadgeWithDot color="success">Live</BadgeWithDot>
            </div>
            <div className="flex gap-2">
              <Button size="sm" color="secondary" iconLeading={Settings}>
                Settings
              </Button>
              <Button size="sm" color="primary" iconLeading={Plus}>
                Add Sale
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 border rounded-lg bg-background">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Sales</span>
                <Badge color="success">+12%</Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">R$ 45,230</p>
            </div>
            
            <div className="p-4 border rounded-lg bg-background">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Orders</span>
                <Badge color="brand">+8%</Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">1,234</p>
            </div>
            
            <div className="p-4 border rounded-lg bg-background">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Customers</span>
                <Badge color="warning">-2%</Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">892</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Input
              label="Search Orders"
              placeholder="Search by order ID, customer name..."
              icon={User}
            />
            <div className="flex flex-wrap gap-2">
              <BadgeWithButton 
                color="brand" 
                onButtonClick={() => alert('Filter removed')}
                buttonLabel="Remove filter"
              >
                Status: Completed
              </BadgeWithButton>
              <BadgeWithButton 
                color="gray" 
                onButtonClick={() => alert('Filter removed')}
                buttonLabel="Remove filter"
              >
                Date: Last 30 days
              </BadgeWithButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

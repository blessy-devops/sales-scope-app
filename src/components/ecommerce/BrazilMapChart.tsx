// src/components/ecommerce/BrazilMapChart.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Info } from 'lucide-react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { cn } from '@/lib/utils';

// GeoJSON do Brasil
const geoUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

interface StateData {
  state: string;
  name: string;
  sales: number;
  percentage: number;
}

interface BrazilMapChartProps {
  data: StateData[];
  className?: string;
}

export const BrazilMapChart: React.FC<BrazilMapChartProps> = ({ data, className }) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Criar mapa de dados por estado
  const stateDataMap = data.reduce((acc, item) => {
    acc[item.state] = item;
    return acc;
  }, {} as Record<string, StateData>);

  // Calcular cores baseadas no volume de vendas
  const getStateColor = (stateCode: string) => {
    const stateData = stateDataMap[stateCode];
    if (!stateData || stateData.sales === 0) {
      return '#f3f4f6'; // Cinza claro para estados sem vendas
    }

    // Encontrar o valor máximo para normalizar as cores
    const maxSales = Math.max(...data.map(d => d.sales));
    const intensity = stateData.sales / maxSales;

    // Escala de cores do azul claro ao azul escuro
    const colors = [
      '#dbeafe', // Azul muito claro
      '#bfdbfe', // Azul claro
      '#93c5fd', // Azul médio claro
      '#60a5fa', // Azul médio
      '#3b82f6', // Azul
      '#2563eb', // Azul escuro
      '#1d4ed8', // Azul mais escuro
      '#1e40af'  // Azul muito escuro
    ];

    const colorIndex = Math.floor(intensity * (colors.length - 1));
    return colors[colorIndex];
  };

  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Vendas por Estado do Brasil
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Total: {formatCurrency(data.reduce((sum, state) => sum + state.sales, 0))}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Mapa do Brasil */}
          <div className="h-96 w-full relative">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 1000,
                center: [-54, -14]
              }}
              width={800}
              height={400}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies
                    .filter((geo) => geo.properties.NAME === "Brazil")
                    .map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#e5e7eb"
                        stroke="#9ca3af"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none" },
                          pressed: { outline: "none" }
                        }}
                      />
                    ))
                }
              </Geographies>
            </ComposableMap>
          </div>

          {/* Ranking dos Estados */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Top 10 Estados</h4>
            <div className="grid grid-cols-1 gap-2">
              {data
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 10)
                .map((state, index) => (
                  <div 
                    key={state.state} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{state.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {state.percentage.toFixed(1)}% do total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatCurrency(state.sales)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>#{index + 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
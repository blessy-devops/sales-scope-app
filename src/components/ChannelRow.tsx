import React from 'react';
import { Input } from '@/components/ui/input';
import { ChannelHierarchy } from '@/types/annual-plan';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ChannelRowProps {
  channel: ChannelHierarchy;
  months: Array<{ name: string; number: number; quarter: number }>;
  getMonthlyPercentage: (channelId: string, month: number) => string;
  updateMonthlyDistribution: (channelId: string, month: number, percentage: string) => void;
  calculateMonthlyRevenue: (channelId: string, month: number) => number;
  formatCompactCurrency: (value: number) => string;
  getValidationColor: (channelId: string) => string;
  toggleChannelExpansion: (channelId: string) => void;
}

export const ChannelRow: React.FC<ChannelRowProps> = ({
  channel,
  months,
  getMonthlyPercentage,
  updateMonthlyDistribution,
  calculateMonthlyRevenue,
  formatCompactCurrency,
  getValidationColor,
  toggleChannelExpansion,
}) => {
  const validationColor = getValidationColor(channel.id);
  const hasChildren = channel.children.length > 0;

  return (
    <>
      <tr className={`border-b hover:bg-muted/30 ${validationColor}`}>
        <td className="sticky left-0 bg-background p-2 border-r z-10">
          <div 
            className="flex items-center gap-1"
            style={{ paddingLeft: `${channel.level * 16}px` }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleChannelExpansion(channel.id)}
                className="p-1 hover:bg-muted rounded"
              >
                {channel.is_expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
            <span className={`${channel.level === 0 ? 'font-semibold' : 'font-normal'} text-xs`}>
              {channel.name}
            </span>
          </div>
        </td>
        
        {months.map(month => (
          <td key={month.number} className="p-1 text-center border-r">
            <div className="space-y-1">
              <Input
                type="number"
                className="w-full h-6 text-xs text-center"
                value={getMonthlyPercentage(channel.id, month.number)}
                onChange={(e) => updateMonthlyDistribution(channel.id, month.number, e.target.value)}
                placeholder="%"
                min="0"
                max="100"
                step="0.1"
              />
              <div 
                className="text-xs text-muted-foreground cursor-help"
                title={`R$ ${calculateMonthlyRevenue(channel.id, month.number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              >
                {formatCompactCurrency(calculateMonthlyRevenue(channel.id, month.number))}
              </div>
            </div>
          </td>
        ))}
      </tr>
      
      {/* Renderizar filhos se expandido */}
      {hasChildren && channel.is_expanded && channel.children.map(child => (
        <ChannelRow
          key={child.id}
          channel={child}
          months={months}
          getMonthlyPercentage={getMonthlyPercentage}
          updateMonthlyDistribution={updateMonthlyDistribution}
          calculateMonthlyRevenue={calculateMonthlyRevenue}
          formatCompactCurrency={formatCompactCurrency}
          getValidationColor={getValidationColor}
          toggleChannelExpansion={toggleChannelExpansion}
        />
      ))}
    </>
  );
};
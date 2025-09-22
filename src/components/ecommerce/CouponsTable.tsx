import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Eye, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CouponData {
  id: string;
  code: string;
  name: string;
  value: number;
  uses: number;
  revenue: number;
  type: 'percentage' | 'fixed';
  status: 'active' | 'inactive' | 'expired';
}

interface CouponsTableProps {
  data: CouponData[];
  className?: string;
}

export const CouponsTable: React.FC<CouponsTableProps> = ({ data, className }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">%</Badge>;
      case 'fixed':
        return <Badge variant="outline" className="text-green-600 border-green-200">R$</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Cupons Mais Utilizados</CardTitle>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Ver Relatório
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Usos</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((coupon) => (
                <TableRow key={coupon.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                        {coupon.code}
                      </code>
                      {getTypeBadge(coupon.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{coupon.name}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                      <span className="font-medium">{coupon.uses}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    {formatCurrency(coupon.revenue)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(coupon.status)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum cupom encontrado para este período</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

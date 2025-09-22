import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CouponData {
  id: string;
  code: string;
  uses: number;
  revenue: number;
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

  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Cupons Mais Utilizados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead className="w-[100px] text-center">Usos</TableHead>
                <TableHead className="w-[140px] text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {coupon.code}
                    </code>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {coupon.uses}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(coupon.revenue)}
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
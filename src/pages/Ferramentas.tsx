import { Link } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Ferramentas() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Ferramentas de Marketing</h1>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/ferramentas/calculadora-email">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Calculator className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Calculadora de Receita de E-mail Marketing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Calcule a receita estimada de suas campanhas de e-mail com base em um funil de métricas.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
import { Card, CardContent } from '@/components/ui/card';

export function LoadingCard() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded"></div>
          <div className="h-6 bg-muted animate-pulse rounded"></div>
          <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
        </div>
      </CardContent>
    </Card>
  );
}
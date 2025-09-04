import { supabase } from '@/integrations/supabase/client';

interface MonthlyDebugData {
  date: string;
  manual_value: number;
  automatic_value: number;
  orders_count: number;
  difference: number;
  difference_percent: number;
}

interface DailyOrderDetail {
  id: number;
  order_number: number;
  created_at_sp: string;
  total_price: number;
  status_debug: string;
  included_in_filter: boolean;
}

export async function fetchMonthlyDebugData(year: number, month: number): Promise<MonthlyDebugData[]> {
  try {
    // Try to use RPC function first
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('compare_shopify_sales_debug', {
      target_year: year,
      target_month: month
    });

    if (!rpcError && rpcData) {
      return (rpcData as any[]).map((row: any) => ({
        date: row.data,
        manual_value: Number(row.manual_value) || 0,
        automatic_value: Number(row.automatic_value) || 0,
        orders_count: Number(row.orders_count) || 0,
        difference: Number(row.difference) || 0,
        difference_percent: Number(row.difference_percent) || 0
      }));
    }
  } catch (error) {
    console.warn('RPC function not available, using fallback query');
  }

  // Fallback to direct queries
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const daysInMonth = endDate.getDate();

  // Get manual sales data for the month
  const { data: manualData } = await supabase
    .from('daily_sales')
    .select('sale_date, amount')
    .gte('sale_date', startDate.toISOString().split('T')[0])
    .lte('sale_date', endDate.toISOString().split('T')[0]);

  // Get Shopify channel ID (assuming Shopify is the e-commerce channel)
  const { data: shopifyChannel } = await supabase
    .from('channels')
    .select('id')
    .or('name.ilike.%shopify%,type.eq.E-commerce')
    .limit(1)
    .single();

  const manualSales = new Map(
    (manualData || [])
      .filter(sale => shopifyChannel && sale.sale_date)
      .map(sale => [sale.sale_date, Number(sale.amount) || 0])
  );

  // Generate data for each day of the month
  const result: MonthlyDebugData[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const manualValue = manualSales.get(dateStr) || 0;
    
    // For automatic data, we'd need to query shopify_orders_gold
    // This is a simplified version for now
    const automaticValue = 0; // Will be calculated when RPC is available
    const ordersCount = 0;
    const difference = automaticValue - manualValue;
    const differencePercent = manualValue > 0 ? (difference / manualValue) * 100 : 0;

    result.push({
      date: dateStr,
      manual_value: manualValue,
      automatic_value: automaticValue,
      orders_count: ordersCount,
      difference,
      difference_percent: differencePercent
    });
  }

  return result;
}

export async function fetchDailyOrderDetails(date: string): Promise<DailyOrderDetail[]> {
  try {
    // Try to use RPC function first
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_shopify_orders_debug', {
      target_date: date
    });

    if (!rpcError && rpcData) {
      return (rpcData as any[]).map((row: any) => ({
        id: Number(row.id),
        order_number: Number(row.order_number),
        created_at_sp: row.created_at_sp,
        total_price: Number(row.total_price) || 0,
        status_debug: row.financial_status || 'unknown',
        included_in_filter: Boolean(row.included_in_filter)
      }));
    }
  } catch (error) {
    console.warn('RPC function not available, using fallback query');
  }

  // Fallback: For now, return empty array since shopify_orders_gold is not in types
  // This will be populated when RPC functions are created
  console.warn('Shopify orders table not available in current schema types');
  return [];
}
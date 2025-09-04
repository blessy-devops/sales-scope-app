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
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const daysInMonth = endDate.getDate();

  // Generate data for each day of the month using RPC function
  const result: MonthlyDebugData[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('compare_shopify_sales_debug', {
        target_date: dateStr
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        const row = rpcData[0];
        result.push({
          date: dateStr,
          manual_value: Number(row.manual_value) || 0,
          automatic_value: Number(row.automatic_value) || 0,
          orders_count: Number(row.orders_count) || 0,
          difference: Number(row.difference) || 0,
          difference_percent: Number(row.difference_percent) || 0
        });
      } else {
        // Fallback with zero values if RPC fails
        result.push({
          date: dateStr,
          manual_value: 0,
          automatic_value: 0,
          orders_count: 0,
          difference: 0,
          difference_percent: 0
        });
      }
    } catch (error) {
      console.warn(`Error fetching data for ${dateStr}:`, error);
      // Fallback with zero values
      result.push({
        date: dateStr,
        manual_value: 0,
        automatic_value: 0,
        orders_count: 0,
        difference: 0,
        difference_percent: 0
      });
    }
  }

  return result;
}

export async function fetchDailyOrderDetails(date: string): Promise<DailyOrderDetail[]> {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_shopify_orders_debug', {
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
    console.warn('Error fetching daily order details:', error);
  }

  // Return empty array as fallback
  return [];
}
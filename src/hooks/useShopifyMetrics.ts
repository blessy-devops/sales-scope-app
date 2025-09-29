import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ShopifyMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  cancellations: number;
  sessions: number;
  loading: boolean;
  error: string | null;
}

interface CouponData {
  id: string;
  code: string;
  uses: number;
  revenue: number;
}

export function useShopifyMetrics(startDate: Date, endDate: Date) {
  const [metrics, setMetrics] = useState<ShopifyMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    cancellations: 0,
    sessions: 0,
    loading: true,
    error: null,
  });

  const [coupons, setCoupons] = useState<CouponData[]>([]);

  useEffect(() => {
    fetchMetrics();
    fetchCoupons();
  }, [startDate, endDate]);

  const fetchMetrics = async () => {
    try {
      setMetrics(prev => ({ ...prev, loading: true }));

      // Format dates
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      const startDateISO = startDateStr + 'T00:00:00-03:00';
      const endDateISO = endDateStr + 'T23:59:59-03:00';

      console.log('🔍 Date range:', { startDateStr, endDateStr });

      // Fetch calculation mode from system_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'shopify_sales_calculation_mode')
        .maybeSingle();

      const calculationMode = settingsData?.value || 'paid_only';
      console.log('⚙️ Calculation mode:', calculationMode);

      // Add unique timestamp to bypass cache
      const cacheBypass = Date.now();
      console.log('🔄 Cache bypass timestamp:', cacheBypass);

      // Retry mechanism for RPC call
      let salesData, salesError;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          console.log(`🔄 RPC attempt ${retryCount + 1}/${maxRetries + 1}`);
          
          const result = await supabase.rpc(
            'get_shopify_precise_sales',
            {
              start_date: startDateStr,
              end_date: endDateStr,
              calculation_mode: calculationMode,
            } as any // Cast to any until types are regenerated
          );
          
          salesData = result.data;
          salesError = result.error;
          
          if (!salesError && salesData) {
            console.log(`✅ RPC successful on attempt ${retryCount + 1}`);
            break;
          }
          
          console.log(`⚠️ RPC attempt ${retryCount + 1} failed or returned no data`);
          retryCount++;
          
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          }
        } catch (error) {
          console.error(`❌ RPC attempt ${retryCount + 1} threw error:`, error);
          salesError = error;
          retryCount++;
          
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      console.log('📥 RPC Response (detailed):', { 
        salesData, 
        salesError,
        dataType: typeof salesData,
        isArray: Array.isArray(salesData),
        dataLength: salesData?.length,
        dataFirstItem: salesData?.[0],
        errorCode: salesError?.code,
        errorMessage: salesError?.message
      });

      let totalRevenue = 0;

      if (salesError) {
        console.error('❌ Error from get_shopify_precise_sales:', salesError);
        console.error('❌ Error details:', {
          code: salesError.code,
          message: salesError.message,
          details: salesError.details,
          hint: salesError.hint
        });
        // Will use fallback calculation below
      } else if (salesData && Array.isArray(salesData) && salesData.length > 0) {
        console.log('✅ Processing RPC data:', salesData);
        totalRevenue = salesData.reduce((sum: number, day: any) => {
          const dayTotal = day.total_sales || 0;
          console.log('📊 Day data:', { date: day.sale_date, total: dayTotal });
          return sum + dayTotal;
        }, 0);
        console.log('💰 Total revenue from get_shopify_precise_sales:', totalRevenue);
      } else {
        console.warn('⚠️ No data returned from get_shopify_precise_sales');
        console.warn('⚠️ RPC returned:', { 
          data: salesData, 
          isNull: salesData === null,
          isUndefined: salesData === undefined,
          isEmpty: Array.isArray(salesData) && salesData.length === 0
        });
      }

      // Get orders directly from shopify_orders_gold for other metrics
      console.log('🔍 Fetching orders with date range:', {
        startISO: startDateISO,
        endISO: endDateISO,
        oldWay: startDate.toISOString()
      });

      const { data: ordersData, error: ordersError } = await supabase
        .from('shopify_orders_gold')
        .select('total_price, financial_status, cancelled_at, test, created_at')
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO);

      console.log('📥 Orders query result:', {
        ordersData: ordersData?.length,
        ordersError,
        firstOrder: ordersData?.[0]
      });

      if (ordersError) {
        console.error('❌ Orders query error:', ordersError);
        throw ordersError;
      }

      // Filter paid orders for count and average ticket
      const paidOrders = ordersData?.filter((order: any) => 
        order.financial_status === 'paid' && 
        !order.test &&
        !order.cancelled_at
      ) || [];

      console.log('📊 Filtered orders:', {
        totalOrders: ordersData?.length,
        paidOrders: paidOrders.length,
        testOrders: ordersData?.filter(o => o.test).length,
        cancelledOrders: ordersData?.filter(o => o.cancelled_at).length
      });

      // Calculate cancellations
      const cancelledOrders = ordersData?.filter((order: any) => 
        order.cancelled_at !== null
      ) || [];
      
      const cancellations = cancelledOrders.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0);

      const totalOrders = paidOrders.length;
      
      // Use fallback calculation if RPC didn't provide revenue
      if (totalRevenue === 0 && paidOrders.length > 0) {
        totalRevenue = paidOrders.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0);
        console.log('🔄 Using fallback revenue calculation:', totalRevenue);
      }
      
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      console.log('📊 Metrics calculated:', { totalRevenue, totalOrders, averageTicket, cancellations });

      // Get GA4 sessions data
      const { data: ga4Data, error: ga4Error } = await supabase
        .from('ga4_daily_sessions')
        .select('sessions')
        .gte('session_date', startDateStr)
        .lte('session_date', endDateStr);

      const totalSessions = ga4Data?.reduce((sum: number, day: any) => sum + (day.sessions || 0), 0) || 0;

      setMetrics({
        totalRevenue,
        totalOrders,
        averageTicket,
        cancellations,
        sessions: totalSessions,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching Shopify metrics:', error);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }));
    }
  };

  const fetchCoupons = async () => {
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      // Use timezone-consistent ISO strings
      const startDateISO = startDateStr + 'T00:00:00-03:00';
      const endDateISO = endDateStr + 'T23:59:59-03:00';

      // Query shopify_orders_gold for coupon usage
      const { data: couponsData, error: couponsError } = await supabase
        .from('shopify_orders_gold')
        .select('coupon_code, total_price')
        .not('coupon_code', 'is', null)
        .eq('financial_status', 'paid')
        .is('cancelled_at', null)
        .eq('test', false)
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO);

      if (couponsError) throw couponsError;

      // Group by coupon code and calculate metrics
      const couponMap = new Map<string, { uses: number; revenue: number }>();

      couponsData?.forEach((order: any) => {
        const code = order.coupon_code;
        const revenue = order.total_price || 0;
        
        if (couponMap.has(code)) {
          const existing = couponMap.get(code)!;
          couponMap.set(code, {
            uses: existing.uses + 1,
            revenue: existing.revenue + revenue,
          });
        } else {
          couponMap.set(code, { uses: 1, revenue });
        }
      });

      // Convert to array and sort by usage
      const couponsArray = Array.from(couponMap.entries())
        .map(([code, data]) => ({
          id: code,
          code,
          uses: data.uses,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 10); // Top 10 coupons

      setCoupons(couponsArray);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  return {
    ...metrics,
    coupons,
    refetch: () => {
      fetchMetrics();
      fetchCoupons();
    },
  };
}
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

      // Get Shopify channel ID
      const { data: shopifyChannel } = await supabase
        .from('channels')
        .select('id')
        .ilike('name', '%shopify%')
        .single();

      if (!shopifyChannel) {
        throw new Error('Canal Shopify não encontrado');
      }

      console.log('🏪 Shopify channel ID:', shopifyChannel.id);

      // Use get_dashboard_sales (same as home dashboard)
      const { data: salesData, error: salesError } = await supabase.rpc(
        'get_dashboard_sales',
        {
          start_date: startDateStr,
          end_date: endDateStr,
        }
      );

      console.log('📥 Dashboard sales response:', { 
        salesData, 
        salesError,
        dataLength: salesData?.length
      });

      // Filter for Shopify channel only
      const shopifySales = salesData?.filter(
        (row: any) => row.channel_id === shopifyChannel.id
      ) || [];

      console.log('🏪 Shopify sales filtered:', {
        total: salesData?.length,
        shopify: shopifySales.length,
        data: shopifySales
      });

      // Calculate total revenue from Shopify sales
      let totalRevenue = shopifySales.reduce(
        (sum: number, row: any) => sum + (row.amount || 0), 
        0
      );

      console.log('💰 Total revenue from get_dashboard_sales:', totalRevenue);

      if (salesError) {
        console.error('❌ Error from get_dashboard_sales:', salesError);
        // Will use fallback calculation below
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
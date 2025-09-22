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

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      console.log('🔍 Fetching metrics for period:', { startDateStr, endDateStr });

      // Use get_shopify_precise_sales for accurate revenue calculation with cache bypass
      const { data: salesData, error: salesError } = await supabase.rpc(
        'get_shopify_precise_sales',
        {
          start_date: startDateStr,
          end_date: endDateStr,
        }
      );

      console.log('📥 RPC Response:', { salesData, salesError });

      let totalRevenue = 0;

      if (salesError) {
        console.error('❌ Error from get_shopify_precise_sales:', salesError);
        // Fallback: calculate directly from orders as backup
        totalRevenue = 0; // Will be calculated below from ordersData
      } else if (salesData && Array.isArray(salesData) && salesData.length > 0) {
        totalRevenue = salesData.reduce((sum: number, day: any) => sum + (day.total_sales || 0), 0);
        console.log('💰 Total revenue from get_shopify_precise_sales:', totalRevenue);
      } else {
        console.warn('⚠️ No data returned from get_shopify_precise_sales, using fallback');
        totalRevenue = 0; // Will use fallback calculation
      }

      // Get orders directly from shopify_orders_gold for other metrics
      const { data: ordersData, error: ordersError } = await supabase
        .from('shopify_orders_gold')
        .select('total_price, financial_status, cancelled_at, test, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ordersError) throw ordersError;

      // Filter paid orders for count and average ticket
      const paidOrders = ordersData?.filter((order: any) => 
        order.financial_status === 'paid' && 
        !order.test &&
        !order.cancelled_at
      ) || [];

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

      // Query shopify_orders_gold for coupon usage
      const { data: couponsData, error: couponsError } = await supabase
        .from('shopify_orders_gold')
        .select('coupon_code, total_price')
        .not('coupon_code', 'is', null)
        .eq('financial_status', 'paid')
        .is('cancelled_at', null)
        .eq('test', false)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

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
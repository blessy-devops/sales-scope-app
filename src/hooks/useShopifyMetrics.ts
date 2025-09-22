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

      // Get orders directly from shopify_orders_gold table
      const { data: ordersData, error: ordersError } = await supabase
        .from('shopify_orders_gold')
        .select('total_price, financial_status, cancelled_at, test, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ordersError) throw ordersError;

      // Filter paid orders
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

      // Calculate total revenue from paid orders
      const totalRevenue = paidOrders.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0);
      const totalOrders = paidOrders.length;
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, Target, Settings, RefreshCw } from "lucide-react";
import { GoalsModal } from "@/components/GoalsModal";
import { CouponsModal } from "@/components/CouponsModal";
import { FollowersMetricsSection } from "@/components/FollowersMetricsSection";
import SocialMediaSalesAnalytics from "@/pages/analises/components/SocialMediaSalesAnalytics";
import { PeriodRangePicker, DateRange } from "@/components/PeriodRangePicker";
import { useQueryClient } from "@tanstack/react-query";
import { startOfMonth, endOfMonth } from "date-fns";
export default function SocialMedia() {
  const currentDate = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(currentDate),
    to: endOfMonth(currentDate)
  });
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [couponsModalOpen, setCouponsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // For followers, use the first month of the range
  const selectedDate = dateRange.from;
  
  const handleRefreshAll = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    
    // Invalidate followers using the first month
    queryClient.invalidateQueries({
      queryKey: ['followers-analytics', year, month]
    });
    
    // Invalidate sales using the date range
    const startISO = new Date(`${dateRange.from.getFullYear()}-${(dateRange.from.getMonth() + 1).toString().padStart(2, '0')}-${dateRange.from.getDate().toString().padStart(2, '0')}T00:00:00-03:00`).toISOString();
    const endISO = new Date(`${dateRange.to.getFullYear()}-${(dateRange.to.getMonth() + 1).toString().padStart(2, '0')}-${dateRange.to.getDate().toString().padStart(2, '0')}T23:59:59-03:00`).toISOString();
    
    queryClient.invalidateQueries({
      queryKey: ['sales-analytics', startISO, endISO]
    });
  };
  return <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Instagram className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Social Media Analytics</h1>
            
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <PeriodRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          <Button onClick={() => setGoalsModalOpen(true)} variant="outline">
            <Target className="mr-2 h-4 w-4" />
            Definir Metas
          </Button>
          <Button onClick={handleRefreshAll} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => setCouponsModalOpen(true)} variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Followers Performance Section */}
      <div className="mb-12">
        <FollowersMetricsSection selectedDate={selectedDate} onOpenGoals={() => setGoalsModalOpen(true)} />
      </div>

      {/* Sales Performance Section */}
      <div className="mb-8">
        <SocialMediaSalesAnalytics />
      </div>

      {/* Modals */}
      <GoalsModal open={goalsModalOpen} onOpenChange={setGoalsModalOpen} selectedDate={selectedDate} />
      
      <CouponsModal open={couponsModalOpen} onOpenChange={setCouponsModalOpen} />
    </div>;
}
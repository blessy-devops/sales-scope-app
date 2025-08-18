import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, Target, Settings, RefreshCw } from "lucide-react";
import { GoalsModal } from "@/components/GoalsModal";
import { CouponsModal } from "@/components/CouponsModal";
import { FollowersMetricsSection } from "@/components/FollowersMetricsSection";
import { SalesMetricsSection } from "@/components/SalesMetricsSection";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useQueryClient } from "@tanstack/react-query";
export default function SocialMedia() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [couponsModalOpen, setCouponsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const handleRefreshAll = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    queryClient.invalidateQueries({
      queryKey: ['followers-analytics', year, month]
    });
    queryClient.invalidateQueries({
      queryKey: ['sales-analytics', year, month]
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
          <MonthYearPicker date={selectedDate} onDateChange={setSelectedDate} />
          <Button onClick={() => setGoalsModalOpen(true)} variant="outline">
            <Target className="mr-2 h-4 w-4" />
            Definir Metas
          </Button>
          <Button onClick={handleRefreshAll} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" size="icon">
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
        <SalesMetricsSection selectedDate={selectedDate} onOpenGoals={() => setGoalsModalOpen(true)} />
      </div>

      {/* Modals */}
      <GoalsModal open={goalsModalOpen} onOpenChange={setGoalsModalOpen} />
      
      <CouponsModal open={couponsModalOpen} onOpenChange={setCouponsModalOpen} />
    </div>;
}
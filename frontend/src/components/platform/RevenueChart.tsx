'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';

export function RevenueChart() {
  const { data: revenueData } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: platformService.getRevenueChartData,
  });

  // Fallback chart implementation while recharts has compatibility issues
  return (
    <div className="w-full h-[350px] flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-600 mb-2">Revenue Chart</div>
        <div className="text-sm text-gray-500">
          {revenueData ? 'Chart data loaded' : 'Loading chart data...'}
        </div>
        <div className="mt-4 text-xs text-gray-400">
          Chart visualization temporarily disabled due to library compatibility
        </div>
      </div>
    </div>
  );
}

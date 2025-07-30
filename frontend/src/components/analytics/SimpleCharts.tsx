'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SimpleBarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  height?: number;
  className?: string;
}

export function SimpleBarChart({ data, height = 200, className }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className={cn("flex items-end space-x-2", className)} style={{ height }}>
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div
            className={cn(
              "w-full rounded-t transition-all duration-300 hover:opacity-80",
              item.color || "bg-blue-500"
            )}
            style={{
              height: `${Math.max(8, (item.value / maxValue) * (height - 40))}px`,
            }}
            title={`${item.label}: ${item.value}`}
          />
          <span className="text-xs text-gray-600 mt-2 text-center truncate w-full">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

interface SimpleLineChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  height?: number;
  className?: string;
  color?: string;
}

export function SimpleLineChart({ 
  data, 
  height = 200, 
  className,
  color = "rgb(59, 130, 246)" // blue-500
}: SimpleLineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 80; // Leave 20% padding
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className={cn("relative", className)} style={{ height }}>
      <svg width="100%" height="100%" className="overflow-visible">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Area under curve */}
        <path
          d={`M 0,100 L ${points} L 100,100 Z`}
          fill={color}
          fillOpacity="0.1"
        />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((item.value - minValue) / range) * 80;
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="3"
              fill={color}
              className="hover:r-4 transition-all cursor-pointer"
            >
              <title>{`${item.label}: ${item.value}`}</title>
            </circle>
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500">
        {data.map((item, index) => (
          index % Math.ceil(data.length / 6) === 0 && (
            <span key={index}>{item.label}</span>
          )
        ))}
      </div>
    </div>
  );
}

interface DonutChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  size?: number;
  thickness?: number;
  className?: string;
}

export function DonutChart({ 
  data, 
  size = 160, 
  thickness = 20, 
  className 
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;
  const radius = center - thickness / 2;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercent = 0;
  
  return (
    <div className={cn("flex items-center space-x-6", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={thickness}
          />
          
          {/* Data segments */}
          {data.map((item, index) => {
            const percent = item.value / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePercent * circumference;
            
            cumulativePercent += percent;
            
            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 hover:opacity-80"
              >
                <title>{`${item.label}: ${item.value} (${(percent * 100).toFixed(1)}%)`}</title>
              </circle>
            );
          })}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-700">{item.label}</span>
            <span className="text-sm font-medium text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

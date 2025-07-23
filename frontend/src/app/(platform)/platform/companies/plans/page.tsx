'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { platformService } from '@/services/platformService';
import { 
  Building2, 
  Users, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Package,
  Crown,
  Zap,
  Briefcase
} from 'lucide-react';

export default function CompanyPlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('all');

  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['platform-companies'],
    queryFn: platformService.getCompanies,
  });

  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: platformService.getBillingPlans,
  });

  if (loadingCompanies || loadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 animate-pulse">Loading company plans...</p>
        </div>
      </div>
    );
  }

  const getPlanIcon = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'trial':
        return <Package className="h-5 w-5 text-gray-500" />;
      case 'basic':
        return <Zap className="h-5 w-5 text-blue-500" />;
      case 'professional':
        return <Briefcase className="h-5 w-5 text-purple-500" />;
      case 'enterprise':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'trial':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'professional':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'enterprise':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group companies by plan
  const companiesByPlan = companies?.reduce((acc: any, company: any) => {
    const plan = company.company.subscription_plan || 'No Plan';
    if (!acc[plan]) {
      acc[plan] = [];
    }
    acc[plan].push(company);
    return acc;
  }, {}) || {};

  // Calculate plan statistics
  const planStats = plans?.map((plan: any) => {
    const companiesOnPlan = companies?.filter((company: any) => 
      company.company.subscription_plan === plan.name
    ) || [];
    
    const totalRevenue = companiesOnPlan.reduce((sum: number, company: any) => 
      sum + (plan.monthly_price || 0), 0
    );

    return {
      ...plan,
      company_count: companiesOnPlan.length,
      total_revenue: totalRevenue,
      active_companies: companiesOnPlan.filter((c: any) => 
        c.company.subscription_status === 'active'
      ).length
    };
  }) || [];

  const filteredCompanies = selectedPlan === 'all' 
    ? companies 
    : companies?.filter((company: any) => 
        company.company.subscription_plan === selectedPlan
      ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Company Plans Management
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor subscription plans and company billing across the platform
            </p>
          </div>
        </div>

        {/* Plan Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {planStats.map((plan: any) => (
            <Card 
              key={plan.id} 
              className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                selectedPlan === plan.name ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedPlan(selectedPlan === plan.name ? 'all' : plan.name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPlanIcon(plan.plan_type)}
                    <CardTitle className="text-lg font-semibold text-slate-800">
                      {plan.name}
                    </CardTitle>
                  </div>
                  <Badge className={`text-xs ${getPlanColor(plan.plan_type)}`}>
                    {plan.plan_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Companies</span>
                  <span className="font-semibold text-slate-900">{plan.company_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Active</span>
                  <span className="font-semibold text-green-600">{plan.active_companies}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Monthly Revenue</span>
                  <span className="font-semibold text-slate-900">
                    ${plan.total_revenue.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <DollarSign className="h-3 w-3" />
                    ${plan.monthly_price}/month per company
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm border">
          <span className="text-sm font-medium text-slate-700">Filter by plan:</span>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedPlan === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPlan('all')}
              className="text-xs"
            >
              All Plans ({companies?.length || 0})
            </Button>
            {plans?.map((plan: any) => (
              <Button
                key={plan.id}
                variant={selectedPlan === plan.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlan(plan.name)}
                className="text-xs"
              >
                {plan.name} ({companiesByPlan[plan.name]?.length || 0})
              </Button>
            ))}
          </div>
        </div>

        {/* Companies List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCompanies?.map((company: any) => (
            <Card 
              key={company.company.id} 
              className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        {company.company.name}
                      </CardTitle>
                      <p className="text-sm text-slate-500">{company.company.code}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(company.company.subscription_status)}`}>
                    {company.company.subscription_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plan Information */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Current Plan</span>
                    {getPlanIcon(company.company.subscription_plan || 'basic')}
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {company.company.subscription_plan || 'No Plan'}
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-slate-600 mb-1">
                      <Users className="h-3 w-3" />
                      Users
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {company.user_count}
                    </div>
                    <div className="text-xs text-slate-500">
                      / {company.company.user_limit || '∞'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-slate-600 mb-1">
                      <TrendingUp className="h-3 w-3" />
                      Active (30d)
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {company.active_users_30d}
                    </div>
                  </div>
                </div>

                {/* Contact & Billing Info */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Primary Contact</span>
                    <span className="text-slate-900 font-medium">
                      {company.company.primary_contact_email || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Storage Used</span>
                    <span className="text-slate-900 font-medium">
                      {company.storage_used_gb || 0} GB / {company.company.storage_limit_gb || '∞'} GB
                    </span>
                  </div>
                  {company.company.subscription_expires && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Expires</span>
                      <span className="text-slate-900 font-medium">
                        {new Date(company.company.subscription_expires).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    Manage Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="text-center py-6 bg-white rounded-lg shadow-sm border">
          <p className="text-sm text-slate-500">
            Showing {filteredCompanies?.length || 0} companies 
            {selectedPlan !== 'all' && ` on ${selectedPlan} plan`}
            • Total Platform Revenue: ${planStats.reduce((sum, plan) => sum + plan.total_revenue, 0).toLocaleString()}/month
          </p>
        </div>
      </div>
    </div>
  );
}
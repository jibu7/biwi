'use client';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, FileText } from 'lucide-react';

export default function ReportsBomPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BOM Reports</h1>
        <p className="text-muted-foreground">
          View manufacturing and material planning reports
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/reports/bom/mrp')}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <CardTitle>Material Requirements Planning</CardTitle>
            </div>
            <CardDescription>
              Plan material requirements based on production schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/reports/bom/mrp');
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Report
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/reports/bom/manufacturing-process')}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
              <CardTitle>Manufacturing Process Report</CardTitle>
            </div>
            <CardDescription>
              Monitor manufacturing processes and efficiency metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/reports/bom/manufacturing-process');
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

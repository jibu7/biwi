'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Package, Settings, FileText, PlusCircle } from 'lucide-react';

export default function MaintenanceBomPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BOM Maintenance</h1>
        <p className="text-muted-foreground">
          Manage Bill of Materials and related maintenance operations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/maintenance/bom/bills')}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-blue-600" />
              <CardTitle>Bills of Materials</CardTitle>
            </div>
            <CardDescription>
              Create and manage bill of materials for products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/maintenance/bom/bills');
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                View All
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/maintenance/bom/bills/new');
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/maintenance/bom/defaults')}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-green-600" />
              <CardTitle>BOM Defaults</CardTitle>
            </div>
            <CardDescription>
              Configure default settings for BOM operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/maintenance/bom/defaults');
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

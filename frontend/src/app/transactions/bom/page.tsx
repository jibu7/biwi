'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Factory, FileText, PlusCircle } from 'lucide-react';

export default function TransactionsBomPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BOM Transactions</h1>
        <p className="text-muted-foreground">
          Execute manufacturing orders and production transactions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 max-w-2xl">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/transactions/bom/manufacturing-orders')}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Factory className="h-6 w-6 text-orange-600" />
              <CardTitle>Manufacturing Orders</CardTitle>
            </div>
            <CardDescription>
              Create and manage manufacturing orders for production
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/transactions/bom/manufacturing-orders');
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
                  router.push('/transactions/bom/manufacturing-orders/new');
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

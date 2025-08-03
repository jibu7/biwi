'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedSelect as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, Play, Download } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { toast } from 'sonner';

interface ReportColumn {
  id: string;
  name: string;
  field: string;
  type: 'text' | 'number' | 'date' | 'currency';
  format?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

export default function CustomReportBuilder() {
  const [reportName, setReportName] = useState('');
  const [dataSource, setDataSource] = useState('gl_transactions');
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);

  const availableFields = {
    gl_transactions: [
      { field: 'entry_date', label: 'Entry Date', type: 'date' },
      { field: 'account_code', label: 'Account Code', type: 'text' },
      { field: 'account_name', label: 'Account Name', type: 'text' },
      { field: 'description', label: 'Description', type: 'text' },
      { field: 'debit_amount', label: 'Debit Amount', type: 'currency' },
      { field: 'credit_amount', label: 'Credit Amount', type: 'currency' },
    ],
    ar_transactions: [
      { field: 'transaction_date', label: 'Transaction Date', type: 'date' },
      { field: 'customer_name', label: 'Customer', type: 'text' },
      { field: 'document_number', label: 'Document #', type: 'text' },
      { field: 'total_amount', label: 'Amount', type: 'currency' },
      { field: 'open_amount', label: 'Open Amount', type: 'currency' },
      { field: 'status', label: 'Status', type: 'text' },
    ],
  };

  const addColumn = () => {
    const newColumn: ReportColumn = {
      id: `col-${Date.now()}`,
      name: '',
      field: '',
      type: 'text',
    };
    setColumns([...columns, newColumn]);
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter(col => col.id !== id));
  };

  const updateColumn = (id: string, updates: Partial<ReportColumn>) => {
    setColumns(columns.map(col => 
      col.id === id ? { ...col, ...updates } : col
    ));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<ReportFilter>) => {
    setFilters(filters.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  };

  const handlePreview = async () => {
    if (!reportName || columns.length === 0) {
      toast.error('Please provide a report name and at least one column');
      return;
    }

    const reportConfig = {
      name: reportName,
      report_type: 'custom',
      data_source: dataSource,
      columns: columns.map(col => ({
        name: col.name,
        field: col.field,
        type: col.type,
        format: col.format,
      })),
      filters: filters.reduce((acc, filter) => {
        if (filter.field) {
          acc[filter.field] = {
            operator: filter.operator,
            value: filter.value,
          };
        }
        return acc;
      }, {} as Record<string, any>),
      grouping: [],
      sorting: {},
      aggregations: columns.reduce((acc, col) => {
        if (col.aggregation) {
          acc[col.field] = col.aggregation;
        }
        return acc;
      }, {} as Record<string, string>),
    };

    try {
      const data = await reportService.buildCustomReport(reportConfig);
      setPreviewData(data);
      toast.success('Report preview generated');
    } catch (error) {
      toast.error('Failed to generate report preview');
    }
  };

  const handleSave = async () => {
    const template = {
      name: reportName,
      report_type: 'custom',
      configuration: {
        data_source: dataSource,
        columns,
        filters,
      },
    };

    try {
      await reportService.createReportTemplate(template);
      toast.success('Report template saved successfully');
    } catch (error) {
      toast.error('Failed to save report template');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Custom Report Builder</h1>
        <p className="text-muted-foreground">
          Create custom reports by selecting data sources, columns, and filters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name"
                />
              </div>

              <div>
                <Label htmlFor="data-source">Data Source</Label>
                <Select value={dataSource} onValueChange={setDataSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gl_transactions">GL Transactions</SelectItem>
                    <SelectItem value="ar_transactions">AR Transactions</SelectItem>
                    <SelectItem value="ap_transactions">AP Transactions</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="suppliers">Suppliers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Columns Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Report Columns</CardTitle>
                <Button onClick={addColumn} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Column
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {columns.map((column) => (
                  <div key={column.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        <Input
                          placeholder="Column Name"
                          value={column.name}
                          onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                        />
                        
                        <Select
                          value={column.field}
                          onValueChange={(value) => updateColumn(column.id, { field: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields[dataSource as keyof typeof availableFields]?.map((field) => (
                              <SelectItem key={field.field} value={field.field}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={column.type}
                          onValueChange={(value) => updateColumn(column.id, { type: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="currency">Currency</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>

                        {(column.type === 'number' || column.type === 'currency') && (
                          <Select
                            value={column.aggregation || ''}
                            onValueChange={(value) => updateColumn(column.id, { aggregation: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Aggregation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              <SelectItem value="sum">Sum</SelectItem>
                              <SelectItem value="avg">Average</SelectItem>
                              <SelectItem value="count">Count</SelectItem>
                              <SelectItem value="min">Min</SelectItem>
                              <SelectItem value="max">Max</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeColumn(column.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Filters</CardTitle>
                <Button onClick={addFilter} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filters.map((filter) => (
                <div key={filter.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Select
                      value={filter.field}
                      onValueChange={(value) => updateFilter(filter.id, { field: value })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields[dataSource as keyof typeof availableFields]?.map((field) => (
                          <SelectItem key={field.field} value={field.field}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filter.operator}
                      onValueChange={(value) => updateFilter(filter.id, { operator: value as any })}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater">Greater than</SelectItem>
                        <SelectItem value="less">Less than</SelectItem>
                        <SelectItem value="between">Between</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                      className="flex-1"
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(filter.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Actions & Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handlePreview} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Preview Report
              </Button>
              <Button onClick={handleSave} variant="outline" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
              {previewData && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => reportService.exportReport('custom', previewData, 'excel')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => reportService.exportReport('custom', previewData, 'csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Preview Summary */}
          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Rows:</span>
                    <span className="font-medium">{previewData.row_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Columns:</span>
                    <span className="font-medium">{previewData.columns?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Data Preview Table */}
      {previewData && previewData.data && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    {previewData.columns?.map((col: string) => (
                      <th key={col} className="text-left p-2 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.data.slice(0, 20).map((row: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      {previewData.columns?.map((col: string) => (
                        <td key={col} className="p-2">
                          {typeof row[col] === 'number' 
                            ? row[col].toFixed(2)
                            : row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.data.length > 20 && (
                <div className="text-center text-muted-foreground mt-4">
                  Showing first 20 of {previewData.data.length} rows
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

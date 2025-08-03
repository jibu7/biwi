// frontend/src/types/reports.ts
export interface BalanceSheetRequest {
  as_of_date: string;
  format_type?: 'standard' | 'comparative' | 'detailed';
  comparison_period?: 'previous_period' | 'previous_year';
  include_zero_balances?: boolean;
  branch_id?: number;
}

export interface IncomeStatementRequest {
  start_date: string;
  end_date: string;
  comparison_period?: string;
  group_by?: 'account' | 'department' | 'branch';
  show_percentages?: boolean;
  include_zero_balances?: boolean;
}

export interface CashFlowRequest {
  start_date: string;
  end_date: string;
  method?: 'direct' | 'indirect';
}

export interface CustomReportBuilder {
  name: string;
  report_type: string;
  data_source: string;
  columns: Array<{
    name: string;
    field: string;
    type: string;
    width?: number;
    format?: string;
  }>;
  filters: Record<string, any>;
  grouping?: string[];
  sorting?: Record<string, 'asc' | 'desc'>;
  aggregations?: Record<string, string>;
}

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ReportSchedule {
  id?: number;
  template_id: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on_demand';
  schedule_config: {
    hour?: number;
    minute?: number;
    day_of_week?: number;
    day?: number;
  };
  recipient_emails: string[];
  export_formats: ExportFormat[];
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
}

export interface ReportTemplate {
  id: number;
  name: string;
  report_type: string;
  configuration: Record<string, any>;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
}

export interface GeneratedReport {
  id: number;
  report_name: string;
  report_type: string;
  format: string;
  generated_at: string;
  generated_by: string;
  file_size?: number;
}

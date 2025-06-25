import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import InventoryItemsPage from '@/app/(dashboard)/maintenance/inventory/items/page';
import * as inventoryService from '@/services/inventoryService';
import { usePermissions } from '@/hooks/usePermissions';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/services/inventoryService');
jest.mock('@/hooks/usePermissions');

const mockInventoryService = inventoryService as jest.Mocked<typeof inventoryService>;
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

// Test data
const mockItems = [
  {
    id: 1,
    company_id: 1,
    item_code: 'ITEM001',
    description: 'Test Item 1',
    item_type: 'Stock' as const,
    unit_of_measure_id: 1,
    unit_of_measure: {
      id: 1,
      company_id: 1,
      name: 'Each',
      abbreviation: 'EA',
      conversion_factor_to_base: 1,
      is_active: true,
    },
    costing_method: 'WeightedAverage',
    standard_cost: 0,
    average_cost: 10.50,
    selling_price: 15.00,
    is_active: true,
    notes: null,
    reorder_level: 10,
    reorder_quantity: 50,
    default_inventory_gl_account_id: null,
    default_cogs_gl_account_id: null,
    default_sales_gl_account_id: null,
  },
  {
    id: 2,
    company_id: 1,
    item_code: 'ITEM002',
    description: 'Test Item 2',
    item_type: 'Service' as const,
    unit_of_measure_id: 2,
    unit_of_measure: {
      id: 2,
      company_id: 1,
      name: 'Hour',
      abbreviation: 'HR',
      conversion_factor_to_base: 1,
      is_active: true,
    },
    costing_method: 'WeightedAverage',
    standard_cost: 0,
    average_cost: 0,
    selling_price: 50.00,
    is_active: false,
    notes: null,
    reorder_level: null,
    reorder_quantity: null,
    default_inventory_gl_account_id: null,
    default_cogs_gl_account_id: null,
    default_sales_gl_account_id: null,
  },
];

describe('InventoryItemsPage', () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(true),
      hasAnyPermission: jest.fn().mockReturnValue(true),
    });

    mockInventoryService.getInventoryItems.mockResolvedValue(mockItems);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <InventoryItemsPage />
      </QueryClientProvider>
    );
  };

  test('renders inventory items page', async () => {
    renderComponent();

    expect(screen.getByText('Inventory Items')).toBeInTheDocument();
    expect(screen.getByText('Add New Item')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ITEM001')).toBeInTheDocument();
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });
  });

  test('displays items in table', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('ITEM001')).toBeInTheDocument();
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Stock')).toBeInTheDocument();
      expect(screen.getByText('EA')).toBeInTheDocument();
      expect(screen.getByText('$10.50')).toBeInTheDocument();
      expect(screen.getByText('$15.00')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();

      expect(screen.getByText('ITEM002')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
      expect(screen.getByText('Service')).toBeInTheDocument();
      expect(screen.getByText('HR')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  test('filters items by search term', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('ITEM001')).toBeInTheDocument();
      expect(screen.getByText('ITEM002')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by code or description...');
    await user.type(searchInput, 'ITEM001');

    expect(screen.getByText('ITEM001')).toBeInTheDocument();
    expect(screen.queryByText('ITEM002')).not.toBeInTheDocument();
  });

  test('navigates to new item page when Add New Item clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const addButton = screen.getByText('Add New Item');
    await user.click(addButton);

    expect(mockPush).toHaveBeenCalledWith('/maintenance/inventory/items/new');
  });

  test('navigates to edit page when edit icon clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('ITEM001')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('link');
    const editButton = editButtons.find(btn => btn.getAttribute('href') === '/maintenance/inventory/items/1');
    
    expect(editButton).toBeInTheDocument();
  });

  test('deletes item when delete button clicked and confirmed', async () => {
    const user = userEvent.setup();
    mockInventoryService.deleteInventoryItem.mockResolvedValue(undefined);
    
    // Mock window.confirm
    global.confirm = jest.fn().mockReturnValue(true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('ITEM001')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.querySelector('svg')); // Find button with Trash2 icon
    
    if (deleteButton) {
      await user.click(deleteButton);
    }

    await waitFor(() => {
      expect(mockInventoryService.deleteInventoryItem).toHaveBeenCalledWith(1);
    });
  });

  test('hides actions when user lacks permissions', async () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(false),
      hasAnyPermission: jest.fn().mockReturnValue(false),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('ITEM001')).toBeInTheDocument();
    });

    expect(screen.queryByText('Add New Item')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});

describe('InventoryAdjustmentPage', () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  const mockWarehouses = [
    { id: 1, company_id: 1, name: 'Main Warehouse', location: null, is_default: true, is_active: true },
    { id: 2, company_id: 1, name: 'Secondary', location: null, is_default: false, is_active: true },
  ];

  const mockTransactionTypes = [
    {
      id: 1,
      company_id: 1,
      name: 'Stock Increase',
      description: null,
      base_type: 'AdjustmentIncrease',
      affects_quantity_direction: 'Increase' as const,
      default_offsetting_gl_account_id: null,
    },
    {
      id: 2,
      company_id: 1,
      name: 'Stock Decrease',
      description: null,
      base_type: 'AdjustmentDecrease',
      affects_quantity_direction: 'Decrease' as const,
      default_offsetting_gl_account_id: null,
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
      refresh: jest.fn(),
    });

    mockInventoryService.getInventoryItems.mockResolvedValue(mockItems);
    mockInventoryService.getWarehouses.mockResolvedValue(mockWarehouses);
    mockInventoryService.getInventoryTransactionTypes.mockResolvedValue(mockTransactionTypes);
    mockInventoryService.processInventoryAdjustment.mockResolvedValue({
      id: 1,
      company_id: 1,
      item_id: 1,
      warehouse_id: 1,
      inventory_transaction_type_id: 1,
      transaction_date: '2024-01-01',
      quantity: 10,
      unit_cost: 10,
      total_value: 100,
      reference_document_type: 'Adjustment',
      reference_document_id: null,
      notes: 'Test adjustment',
      linked_gl_journal_entry_id: 1,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('submits adjustment form with valid data', async () => {
    const user = userEvent.setup();
    const { default: NewInventoryAdjustmentPage } = await import(
      '@/app/(dashboard)/transactions/inventory/adjustments/new/page'
    );

    render(
      <QueryClientProvider client={queryClient}>
        <NewInventoryAdjustmentPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('New Inventory Adjustment')).toBeInTheDocument();
    });

    // Fill form
    const itemSelect = screen.getByLabelText(/item/i);
    await user.selectOptions(itemSelect, '1');

    const warehouseSelect = screen.getByLabelText(/warehouse/i);
    await user.selectOptions(warehouseSelect, '1');

    const typeSelect = screen.getByLabelText(/adjustment type/i);
    await user.selectOptions(typeSelect, '1');

    const quantityInput = screen.getByLabelText(/quantity/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '10');

    const reasonInput = screen.getByLabelText(/reason/i);
    await user.type(reasonInput, 'Test adjustment reason');

    // Submit form
    const submitButton = screen.getByText('Process Adjustment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInventoryService.processInventoryAdjustment).toHaveBeenCalledWith({
        item_id: 1,
        warehouse_id: 1,
        quantity: 10,
        unit_cost: 10.5, // Default from selected item
        inventory_transaction_type_id: 1,
        reason: 'Test adjustment reason',
        transaction_date: expect.any(String),
      });
    });
  });
});
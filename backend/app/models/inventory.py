from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, JSON, Numeric, Text, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database.database import Base

class UnitOfMeasure(Base):
    __tablename__ = "unit_of_measures"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # ENSURE THIS EXISTS
    name = Column(String, nullable=False)
    abbreviation = Column(String, nullable=False)
    conversion_factor_to_base = Column(Numeric, default=1)
    is_active = Column(Boolean, default=True)
    
    __table_args__ = (
        UniqueConstraint('name', 'company_id', name='uq_uom_name_company'),
        UniqueConstraint('abbreviation', 'company_id', name='uq_uom_abbrev_company'),
        Index('ix_uom_company', 'company_id'),
    )

class Warehouse(Base):
    __tablename__ = "warehouses"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # ENSURE THIS EXISTS
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    __table_args__ = (
        UniqueConstraint('name', 'company_id', name='uq_warehouse_name_company'),
        Index('ix_warehouse_company', 'company_id'),
    )

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # ENSURE THIS EXISTS
    item_code = Column(String, nullable=False, index=True)
    description = Column(String, nullable=False)
    item_type = Column(String, nullable=False)  # "Stock", "Service", "NonStock"
    unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id"), nullable=False)
    costing_method = Column(String, default="WeightedAverage")
    standard_cost = Column(Numeric, nullable=True)
    average_cost = Column(Numeric, default=0.00)
    selling_price = Column(Numeric, default=0.00)
    is_active = Column(Boolean, default=True)
    
    # GL Integration - must be from same company
    default_inventory_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_cogs_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_sales_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    
    __table_args__ = (
        UniqueConstraint('item_code', 'company_id', name='uq_item_code_company'),
        Index('ix_item_company_code', 'company_id', 'item_code'),
        Index('ix_item_company_active', 'company_id', 'is_active'),
    )

class ItemBarcode(Base):
    __tablename__ = "item_barcodes"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # ENSURE THIS EXISTS
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    barcode = Column(String, nullable=False)
    unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id"), nullable=True)
    quantity_in_uom = Column(Numeric, default=1)
    
    __table_args__ = (
        UniqueConstraint('barcode', 'company_id', name='uq_barcode_company'),
        Index('ix_barcode_company', 'company_id'),
    )

class InventoryItemLocation(Base):
    __tablename__ = "inventory_item_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # ENSURE THIS EXISTS
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity_on_hand = Column(Numeric, default=0.00)
    quantity_committed = Column(Numeric, default=0.00)  # For SOs
    quantity_on_order = Column(Numeric, default=0.00)   # For POs
    
    __table_args__ = (
        UniqueConstraint('item_id', 'warehouse_id', 'company_id', name='uq_item_warehouse_company'),
        Index('ix_item_location_company', 'company_id'),
        Index('ix_item_location_company_item', 'company_id', 'item_id'),
    )

class InventoryTransactionType(Base):
    __tablename__ = "inventory_transaction_types"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # ENSURE THIS EXISTS
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    base_type = Column(String, nullable=False)  # "AdjustmentIncrease", "AdjustmentDecrease", etc.
    affects_quantity_direction = Column(String, nullable=False)  # "Increase", "Decrease", "None"
    default_offsetting_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    
    __table_args__ = (
        UniqueConstraint('name', 'company_id', name='uq_inv_trans_type_name_company'),
        Index('ix_inv_trans_type_company', 'company_id'),
    )

# Base types for inventory transactions:
# - "AdjustmentIncrease", "AdjustmentDecrease"
# - "ReceiptFromSupplier", "ReturnToSupplier"
# - "SaleToCustomer", "ReturnFromCustomer"
# - "WarehouseTransferOut", "WarehouseTransferIn"
# - "ManufacturingConsumption", "ManufacturingProduction"

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # ENSURE THIS EXISTS
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    inventory_transaction_type_id = Column(Integer, ForeignKey("inventory_transaction_types.id"), nullable=False)
    linked_gl_journal_entry_id = Column(Integer, ForeignKey("gl_journal_entries.id"), nullable=True)
    transaction_date = Column(Date, nullable=False)
    quantity = Column(Numeric, nullable=False)
    unit_cost = Column(Numeric, nullable=False)
    total_value = Column(Numeric, nullable=False)
    reference_document_type = Column(String, nullable=True)
    reference_document_id = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    
    __table_args__ = (
        Index('ix_inv_trans_company_date', 'company_id', 'transaction_date'),
        Index('ix_inv_trans_company_item', 'company_id', 'item_id'),
        Index('ix_inv_trans_company_warehouse', 'company_id', 'warehouse_id'),
    )

class InventoryDefaults(Base):
    __tablename__ = "inventory_defaults"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, unique=True)  # ENSURE THIS EXISTS
    default_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    default_inventory_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_cogs_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_sales_revenue_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_inventory_adjustment_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)

class InventoryCountSession(Base):
    __tablename__ = "inventory_count_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # ENSURE THIS EXISTS
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    count_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # "Open", "Counting", "Review", "Completed"
    notes = Column(String, nullable=True)
    
    __table_args__ = (
        Index('ix_count_session_company', 'company_id'),
    )

class InventoryCountLine(Base):
    __tablename__ = "inventory_count_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    inventory_count_session_id = Column(Integer, ForeignKey("inventory_count_sessions.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    system_quantity = Column(Numeric, nullable=False)
    counted_quantity = Column(Numeric, nullable=True)
    variance_quantity = Column(Numeric, default=0.00)

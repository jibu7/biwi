from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, Date, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class BOMHeader(Base):
    """Bill of Materials master record for a manufactured item"""
    __tablename__ = "bom_headers"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    parent_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)  # Finished good
    bom_code = Column(String, nullable=False)
    description = Column(String, nullable=True)
    revision = Column(String, nullable=True)
    effective_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    quantity_per_batch = Column(Numeric(15, 4), default=1.0)  # Quantity produced per batch
    unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    item = relationship("InventoryItem", foreign_keys=[parent_item_id])
    components = relationship("BOMComponent", back_populates="bom_header", cascade="all, delete-orphan")
    unit_of_measure = relationship("UnitOfMeasure")
    
    __table_args__ = (
        UniqueConstraint('bom_code', 'company_id', name='uq_bom_code_company'),
        UniqueConstraint('parent_item_id', 'revision', 'company_id', name='uq_bom_item_revision_company'),
    )

class BOMComponent(Base):
    """Individual components/materials in a BOM"""
    __tablename__ = "bom_components"
    
    id = Column(Integer, primary_key=True, index=True)
    bom_header_id = Column(Integer, ForeignKey("bom_headers.id"), nullable=False)
    component_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity_required = Column(Numeric(15, 4), nullable=False)
    unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id"), nullable=False)
    scrap_percentage = Column(Numeric(5, 2), default=0.0)
    is_phantom = Column(Boolean, default=False)  # Phantom assemblies are exploded in MRP
    notes = Column(Text, nullable=True)
    
    # Relationships
    bom_header = relationship("BOMHeader", back_populates="components")
    component_item = relationship("InventoryItem", foreign_keys=[component_item_id])
    unit_of_measure = relationship("UnitOfMeasure")

class ManufacturingOrder(Base):
    """Production/Manufacturing order"""
    __tablename__ = "manufacturing_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    order_number = Column(String, unique=True, nullable=False)
    bom_header_id = Column(Integer, ForeignKey("bom_headers.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity_to_manufacture = Column(Numeric(15, 4), nullable=False)
    quantity_completed = Column(Numeric(15, 4), default=0.0)
    order_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    start_date = Column(DateTime, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="Planned")  # Planned, Released, In Progress, Completed, Cancelled
    linked_gl_journal_entry_id = Column(Integer, ForeignKey("gl_journal_entries.id"), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    bom_header = relationship("BOMHeader")
    warehouse = relationship("Warehouse")
    manufacturing_order_components = relationship("ManufacturingOrderComponent", back_populates="manufacturing_order")

class ManufacturingOrderComponent(Base):
    """Components required for a manufacturing order"""
    __tablename__ = "manufacturing_order_components"
    
    id = Column(Integer, primary_key=True, index=True)
    manufacturing_order_id = Column(Integer, ForeignKey("manufacturing_orders.id"), nullable=False)
    component_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity_required = Column(Numeric(15, 4), nullable=False)
    quantity_issued = Column(Numeric(15, 4), default=0.0)
    unit_cost = Column(Numeric(15, 4), nullable=False)
    
    # Relationships
    manufacturing_order = relationship("ManufacturingOrder", back_populates="manufacturing_order_components")
    component_item = relationship("InventoryItem")

# Placeholder models for MaterialRequisition and ProductionEntry
# These tables don't exist yet but the CRUD functions reference them
# This allows imports to work without breaking the existing CRUD code

class MaterialRequisition(Base):
    """Placeholder - Material requirements for a manufacturing order"""
    __tablename__ = "material_requisitions_placeholder"
    
    id = Column(Integer, primary_key=True, index=True)
    manufacturing_order_id = Column(Integer, nullable=False)
    component_item_id = Column(Integer, nullable=False)
    required_quantity = Column(Numeric(15, 4), nullable=False)
    issued_quantity = Column(Numeric(15, 4), default=0.0)
    warehouse_id = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="Pending")
    issue_date = Column(DateTime, nullable=True)

class ProductionEntry(Base):
    """Placeholder - Record of actual production/completion"""
    __tablename__ = "production_entries_placeholder"
    
    id = Column(Integer, primary_key=True, index=True)
    manufacturing_order_id = Column(Integer, nullable=False)
    entry_date = Column(DateTime, nullable=False)
    quantity_produced = Column(Numeric(15, 4), nullable=False)
    quantity_scrapped = Column(Numeric(15, 4), default=0.0)
    labor_hours_actual = Column(Numeric(10, 2), default=0.0)
    linked_gl_journal_entry_id = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_by_user_id = Column(Integer, nullable=False)

class BOMDefaults(Base):
    """Default settings for BOM module"""
    __tablename__ = "bom_defaults"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False)
    default_overhead_percentage = Column(Numeric(5, 2), default=15.0)
    default_labor_rate_per_hour = Column(Numeric(10, 2), default=25.0)
    wip_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)  # Work in Progress
    labor_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    overhead_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    variance_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    auto_issue_components = Column(Boolean, default=True)  # Automatically issue components when starting production
    allow_negative_inventory = Column(Boolean, default=False)

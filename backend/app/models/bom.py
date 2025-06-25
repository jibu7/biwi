from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class BOMHeader(Base):
    __tablename__ = "bom_headers"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    parent_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    bom_code = Column(String, nullable=False)
    description = Column(String, nullable=True)
    revision = Column(String, default="1.0")
    effective_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True)
    quantity_per_batch = Column(Numeric, default=1.00)
    unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id"))
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    parent_item = relationship("InventoryItem", foreign_keys=[parent_item_id])
    components = relationship("BOMComponent", back_populates="bom_header", cascade="all, delete-orphan")
    unit_of_measure = relationship("UnitOfMeasure")
    
    __table_args__ = (
        UniqueConstraint('bom_code', 'company_id', name='uq_bom_code_company'),
        UniqueConstraint('parent_item_id', 'revision', 'company_id', name='uq_bom_item_revision_company'),
    )

class BOMComponent(Base):
    __tablename__ = "bom_components"
    
    id = Column(Integer, primary_key=True, index=True)
    bom_header_id = Column(Integer, ForeignKey("bom_headers.id"), nullable=False)
    component_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity_required = Column(Numeric, nullable=False)
    unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id"))
    scrap_percentage = Column(Numeric, default=0.00)
    sequence_number = Column(Integer, default=10)
    is_phantom = Column(Boolean, default=False)  # For sub-assemblies
    notes = Column(Text, nullable=True)
    
    # Relationships
    bom_header = relationship("BOMHeader", back_populates="components")
    component_item = relationship("InventoryItem")
    unit_of_measure = relationship("UnitOfMeasure")

class ManufacturingOrder(Base):
    __tablename__ = "manufacturing_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    order_number = Column(String, unique=True, nullable=False)
    bom_header_id = Column(Integer, ForeignKey("bom_headers.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity_to_manufacture = Column(Numeric, nullable=False)
    quantity_completed = Column(Numeric, default=0.00)
    order_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    start_date = Column(DateTime, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    status = Column(String, default="Planned")  # Planned, Released, In Progress, Completed, Cancelled
    linked_gl_journal_entry_id = Column(Integer, ForeignKey("gl_journal_entries.id"), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    bom_header = relationship("BOMHeader")
    warehouse = relationship("Warehouse")
    component_allocations = relationship("ManufacturingOrderComponent", back_populates="manufacturing_order")

class ManufacturingOrderComponent(Base):
    __tablename__ = "manufacturing_order_components"
    
    id = Column(Integer, primary_key=True, index=True)
    manufacturing_order_id = Column(Integer, ForeignKey("manufacturing_orders.id"), nullable=False)
    component_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity_required = Column(Numeric, nullable=False)
    quantity_issued = Column(Numeric, default=0.00)
    unit_cost = Column(Numeric, nullable=False)
    
    # Relationships
    manufacturing_order = relationship("ManufacturingOrder", back_populates="component_allocations")
    component_item = relationship("InventoryItem")

class BOMDefaults(Base):
    __tablename__ = "bom_defaults"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False)
    default_wip_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_material_usage_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_manufacturing_overhead_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_scrap_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    next_mo_number = Column(Integer, default=1000)

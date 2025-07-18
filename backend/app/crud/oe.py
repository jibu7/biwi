from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from decimal import Decimal
from datetime import date, timedelta
from fastapi import HTTPException
from app import models, schemas
from app.crud import ar as crud_ar
from app.crud import ap as crud_ap
from app.crud import inventory as crud_inventory
from app.crud import gl as crud_gl

# Sales Order Processing
def create_sales_order(
    db: Session, 
    so_in: schemas.SalesOrderCreate, 
    company_id: int, 
    user_id: int
) -> models.SalesOrder:
    # Validate customer belongs to same company
    customer = db.query(models.Customer).filter(
        models.Customer.id == so_in.customer_id,
        models.Customer.company_id == company_id
    ).first()
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found in this company")
    
    # Generate document number
    order_defaults = get_order_defaults(db, company_id)
    document_number = f"SO{order_defaults.next_so_number:06d}"
    
    # Create sales order
    db_so = models.SalesOrder(
        company_id=company_id,
        customer_id=so_in.customer_id,
        order_date=so_in.order_date,
        reference=so_in.reference,
        document_number=document_number,
        status=order_defaults.default_so_status,
        notes=so_in.notes,
        shipping_address=so_in.shipping_address,
        billing_address=so_in.billing_address,
        sales_representative_id=so_in.sales_representative_id
    )
    db.add(db_so)
    db.flush()
    
    # Create sales order lines and update committed quantities
    total_amount = 0
    for line_data in so_in.lines:
        # Validate item belongs to same company
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.id == line_data.item_id,
            models.InventoryItem.company_id == company_id
        ).first()
        if not item:
            raise HTTPException(status_code=400, detail=f"Item {line_data.item_id} not found in this company")
        
        # Handle optional fields safely
        discount_percentage = line_data.discount_percentage or Decimal(0)
        tax_amount = getattr(line_data, 'tax_amount', None) or Decimal(0)
        
        line_total = (
            line_data.quantity_ordered * 
            line_data.unit_price * 
            (1 - discount_percentage / 100) + 
            tax_amount
        )
        
        line = models.SalesOrderLine(
            sales_order_id=db_so.id,
            item_id=line_data.item_id,
            description=line_data.description,
            quantity_ordered=line_data.quantity_ordered,
            unit_price=line_data.unit_price,
            discount_percentage=discount_percentage,
            tax_type_id=line_data.tax_type_id,
            tax_amount=tax_amount,
            line_total=line_total
        )
        db.add(line)
        total_amount += line_total
        
        # Update committed quantity for stock items
        if item.item_type == "Stock":
            # Use default warehouse or first warehouse for company
            warehouse = get_default_warehouse(db, company_id)
            if warehouse:
                item_location = get_or_create_item_location(db, line_data.item_id, warehouse.id, company_id)
                item_location.quantity_committed += line_data.quantity_ordered
    
    db_so.total_amount = total_amount
    
    # Update next SO number
    order_defaults.next_so_number += 1
    
    db.commit()
    db.refresh(db_so)
    return db_so

def convert_so_to_ar_invoice(
    db: Session, 
    so_id: int, 
    company_id: int, 
    user_id: int
) -> models.ARTransaction:
    # Validate SO belongs to company
    so = db.query(models.SalesOrder).filter(
        models.SalesOrder.id == so_id,
        models.SalesOrder.company_id == company_id
    ).first()
    if not so:
        raise HTTPException(status_code=400, detail="Sales Order not found in this company")
    
    # Create AR Invoice using AR service
    from app.crud import ar as crud_ar
    
    ar_invoice_data = schemas.ARTransactionCreate(
        customer_id=so.customer_id,
        ar_transaction_type_id=get_default_ar_invoice_type_id(db, company_id),
        transaction_date=date.today(),
        reference=f"SO#{so.document_number}",
        total_amount=so.total_amount
    )
    
    ar_invoice = crud_ar.create_ar_transaction(db, ar_invoice_data, company_id, user_id)
    
    # Process inventory for stock items
    so_lines = db.query(models.SalesOrderLine).filter(
        models.SalesOrderLine.sales_order_id == so_id
    ).all()
    
    for line in so_lines:
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.id == line.item_id
        ).first()
        
        if item and item.item_type == "Stock":
            # Create sale inventory transaction
            warehouse = get_default_warehouse(db, company_id)
            if warehouse:
                sale_transaction = models.InventoryTransaction(
                    company_id=company_id,
                    item_id=line.item_id,
                    warehouse_id=warehouse.id,
                    inventory_transaction_type_id=get_sale_transaction_type_id(db, company_id),
                    transaction_date=date.today(),
                    quantity=-line.quantity_ordered,  # Negative for sale
                    unit_cost=item.average_cost,
                    total_value=-(line.quantity_ordered * item.average_cost),
                    reference_document_type="SalesOrder",
                    reference_document_id=so_id
                )
                db.add(sale_transaction)
                
                # Update inventory location
                item_location = get_or_create_item_location(db, line.item_id, warehouse.id, company_id)
                item_location.quantity_on_hand -= line.quantity_ordered
                item_location.quantity_committed -= line.quantity_ordered
    
    # Update SO status and link to AR invoice
    so.status = "Invoiced"
    so.ar_invoice_id = ar_invoice.id
    
    db.commit()
    return ar_invoice

# Purchase Order Processing
def create_purchase_order(
    db: Session,
    po_in: schemas.PurchaseOrderCreate,
    company_id: int,
    user_id: int
) -> models.PurchaseOrder:
    # Validate supplier belongs to same company
    supplier = db.query(models.Supplier).filter(
        models.Supplier.id == po_in.supplier_id,
        models.Supplier.company_id == company_id
    ).first()
    if not supplier:
        raise HTTPException(status_code=400, detail="Supplier not found in this company")
    
    # Get next PO number
    defaults = get_or_create_order_defaults(db, company_id)
    document_number = f"PO{defaults.next_po_number:06d}"
    
    # Create PO header
    db_po = models.PurchaseOrder(
        company_id=company_id,
        supplier_id=po_in.supplier_id,
        order_date=po_in.order_date,
        expected_delivery_date=po_in.expected_delivery_date,
        reference=po_in.reference,
        document_number=document_number,
        status=defaults.default_po_status,
        delivery_address_warehouse_id=po_in.delivery_address_warehouse_id,
        notes=po_in.notes,
        total_amount=0
    )
    db.add(db_po)
    db.flush()
    
    # Create PO lines
    total_amount = Decimal(0)
    for line_in in po_in.lines:
        # Validate item belongs to same company
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.id == line_in.item_id,
            models.InventoryItem.company_id == company_id
        ).first()
        if not item:
            raise HTTPException(status_code=400, detail=f"Item {line_in.item_id} not found in this company")
        
        line_total = (
            line_in.quantity_ordered * 
            line_in.unit_price * 
            (1 - line_in.discount_percentage / 100) + 
            line_in.tax_amount
        )
        
        db_line = models.PurchaseOrderLine(
            purchase_order_id=db_po.id,
            item_id=line_in.item_id,
            description=line_in.description,
            quantity_ordered=line_in.quantity_ordered,
            unit_price=line_in.unit_price,
            discount_percentage=line_in.discount_percentage,
            tax_type_id=line_in.tax_type_id,
            tax_amount=line_in.tax_amount,
            line_total=line_total
        )
        db.add(db_line)
        total_amount += line_total
        
        # Update on-order quantity for stock items
        if item.item_type == "Stock":
            # Validate delivery warehouse belongs to company
            if po_in.delivery_address_warehouse_id:
                warehouse = db.query(models.Warehouse).filter(
                    models.Warehouse.id == po_in.delivery_address_warehouse_id,
                    models.Warehouse.company_id == company_id
                ).first()
                if not warehouse:
                    raise HTTPException(status_code=400, detail="Delivery warehouse not found in this company")
                
                item_location = get_or_create_item_location(db, item.id, warehouse.id, company_id)
                item_location.quantity_on_order += line_in.quantity_ordered
    
    # Update PO total
    db_po.total_amount = total_amount
    
    # Increment PO number
    defaults.next_po_number += 1
    
    db.commit()
    db.refresh(db_po)
    return db_po

# Goods Received Voucher Processing
def create_grv(
    db: Session,
    grv_in: schemas.GoodsReceivedVoucherCreate,
    company_id: int,
    user_id: int
) -> models.GoodsReceivedVoucher:
    # Validate supplier belongs to same company
    supplier = db.query(models.Supplier).filter(
        models.Supplier.id == grv_in.supplier_id,
        models.Supplier.company_id == company_id
    ).first()
    if not supplier:
        raise HTTPException(status_code=400, detail="Supplier not found in this company")
    
    # Validate purchase order belongs to same company if provided
    if grv_in.purchase_order_id:
        po = db.query(models.PurchaseOrder).filter(
            models.PurchaseOrder.id == grv_in.purchase_order_id,
            models.PurchaseOrder.company_id == company_id
        ).first()
        if not po:
            raise HTTPException(status_code=400, detail="Purchase Order not found in this company")
    
    # Get next GRV number
    defaults = get_or_create_order_defaults(db, company_id)
    document_number = f"GRV{defaults.next_grv_number:06d}"
    
    # Create GRV header
    db_grv = models.GoodsReceivedVoucher(
        company_id=company_id,
        purchase_order_id=grv_in.purchase_order_id,
        supplier_id=grv_in.supplier_id,
        grv_date=grv_in.grv_date,
        reference=grv_in.reference,
        document_number=document_number,
        status=defaults.default_grv_status,
        notes=grv_in.notes
    )
    db.add(db_grv)
    db.flush()
    
    # Determine warehouse
    warehouse = get_default_warehouse(db, company_id)
    if not warehouse:
        raise HTTPException(status_code=400, detail="No warehouse found for this company")
    
    warehouse_id = warehouse.id
    
    if grv_in.purchase_order_id:
        po = db.query(models.PurchaseOrder).filter(
            models.PurchaseOrder.id == grv_in.purchase_order_id
        ).first()
        if po and po.delivery_address_warehouse_id:
            # Validate the PO warehouse belongs to the company
            po_warehouse = db.query(models.Warehouse).filter(
                models.Warehouse.id == po.delivery_address_warehouse_id,
                models.Warehouse.company_id == company_id
            ).first()
            if po_warehouse:
                warehouse_id = po.delivery_address_warehouse_id
    
    # Process GRV lines
    for line_in in grv_in.lines:
        # Validate item belongs to same company
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.id == line_in.item_id,
            models.InventoryItem.company_id == company_id
        ).first()
        if not item:
            raise HTTPException(status_code=400, detail=f"Item {line_in.item_id} not found in this company")
        
        line_total = line_in.quantity_received * line_in.unit_cost
        
        db_line = models.GoodsReceivedVoucherLine(
            grv_id=db_grv.id,
            purchase_order_line_id=line_in.purchase_order_line_id,
            item_id=line_in.item_id,
            description=line_in.description,
            quantity_received=line_in.quantity_received,
            unit_cost=line_in.unit_cost,
            line_total=line_total
        )
        db.add(db_line)
        
        # Process inventory receipt for stock items
        if item.item_type == "Stock":
            # Ensure inventory item location exists for this warehouse
            item_location = get_or_create_item_location(db, item.id, warehouse_id, company_id)
            
            # Get the correct transaction type for receipt from supplier
            receipt_trans_type = db.query(models.InventoryTransactionType).filter(
                models.InventoryTransactionType.company_id == company_id,
                models.InventoryTransactionType.base_type == "ReceiptFromSupplier"
            ).first()
            
            if not receipt_trans_type:
                # Create default receipt transaction type if it doesn't exist
                receipt_trans_type = models.InventoryTransactionType(
                    company_id=company_id,
                    name="Receipt from Supplier",
                    description="Inventory receipt from supplier via GRV",
                    base_type="ReceiptFromSupplier",
                    affects_quantity_direction="Increase"
                )
                db.add(receipt_trans_type)
                db.flush()
            
            # Create inventory transaction
            inv_receipt = schemas.InventoryAdjustmentCreate(
                item_id=line_in.item_id,
                warehouse_id=warehouse_id,
                quantity=line_in.quantity_received,
                unit_cost=line_in.unit_cost,
                inventory_transaction_type_id=receipt_trans_type.id,
                reason="Receipt from Supplier - GRV"
            )
            crud_inventory.process_inventory_adjustment(
                db, inv_receipt, company_id, user_id
            )
            
            # Update PO line if linked
            if line_in.purchase_order_line_id:
                po_line = db.query(models.PurchaseOrderLine).filter(
                    models.PurchaseOrderLine.id == line_in.purchase_order_line_id
                ).first()
                if po_line:
                    po_line.quantity_received += line_in.quantity_received
                    
                    # Update on-order quantity
                    item_location.quantity_on_order -= line_in.quantity_received
    
    # Update PO status if linked
    if grv_in.purchase_order_id:
        po = db.query(models.PurchaseOrder).filter(
            models.PurchaseOrder.id == grv_in.purchase_order_id
        ).first()
        if po:
            # Check if all lines are fully received
            all_received = all(
                line.quantity_received >= line.quantity_ordered 
                for line in po.lines
            )
            if all_received:
                po.status = "Received"
            else:
                po.status = "PartiallyReceived"
    
    # Increment GRV number
    defaults.next_grv_number += 1
    
    db.commit()
    db.refresh(db_grv)
    return db_grv

def convert_grv_to_ap_invoice(
    db: Session,
    grv_id: int,
    company_id: int,
    user_id: int,
    ap_invoice_details: schemas.APTransactionCreate
) -> models.APTransaction:
    # Get GRV
    grv = db.query(models.GoodsReceivedVoucher).filter(
        models.GoodsReceivedVoucher.id == grv_id,
        models.GoodsReceivedVoucher.company_id == company_id
    ).first()
    
    if not grv:
        raise ValueError("GRV not found")
    
    if grv.status == "Invoiced":
        raise ValueError("GRV already invoiced")
    
    # Calculate total from GRV lines
    total_amount = sum(line.line_total for line in grv.lines)
    
    # Create AP Invoice with provided details but use GRV total
    ap_transaction_data = schemas.APTransactionCreate(
        supplier_id=grv.supplier_id,
        ap_transaction_type_id=ap_invoice_details.ap_transaction_type_id,
        transaction_date=ap_invoice_details.transaction_date,
        due_date=ap_invoice_details.due_date,
        reference=ap_invoice_details.reference,
        total_amount=total_amount
    )
    
    ap_invoice = crud_ap.create_ap_transaction(
        db, ap_transaction_data, company_id
    )
    
    # Update GRV status
    grv.status = "Invoiced"
    grv.ap_invoice_id = ap_invoice.id
    
    db.commit()
    return ap_invoice

# Order Defaults
def get_or_create_order_defaults(
    db: Session,
    company_id: int
) -> models.OrderDefaults:
    defaults = db.query(models.OrderDefaults).filter(
        models.OrderDefaults.company_id == company_id
    ).first()
    
    if not defaults:
        defaults = models.OrderDefaults(company_id=company_id)
        db.add(defaults)
        db.commit()
        db.refresh(defaults)
    
    return defaults

def update_order_defaults(
    db: Session,
    company_id: int,
    defaults_update: schemas.OrderDefaultsUpdate
) -> models.OrderDefaults:
    defaults = get_or_create_order_defaults(db, company_id)
    
    update_data = defaults_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(defaults, field, value)
    
    db.commit()
    db.refresh(defaults)
    return defaults

# Standard CRUD operations for Sales Orders
def get_sales_order(
    db: Session,
    so_id: int,
    company_id: int
) -> Optional[models.SalesOrder]:
    return db.query(models.SalesOrder).filter(
        models.SalesOrder.id == so_id,
        models.SalesOrder.company_id == company_id
    ).first()

def get_sales_orders(
    db: Session,
    company_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
) -> List[models.SalesOrder]:
    query = db.query(models.SalesOrder).filter(
        models.SalesOrder.company_id == company_id
    ).options(
        # Load related customer and sales rep data
        joinedload(models.SalesOrder.customer),
        joinedload(models.SalesOrder.sales_representative)
    )
    
    if status:
        query = query.filter(models.SalesOrder.status == status)
    
    return query.offset(skip).limit(limit).all()

def update_sales_order(
    db: Session,
    so_id: int,
    company_id: int,
    so_update: schemas.SalesOrderUpdate
) -> Optional[models.SalesOrder]:
    so = get_sales_order(db, so_id, company_id)
    if not so:
        return None
    
    update_data = so_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field != "lines":  # Handle lines separately
            setattr(so, field, value)
    
    db.commit()
    db.refresh(so)
    return so

# Standard CRUD operations for Purchase Orders
def get_purchase_order(
    db: Session,
    po_id: int,
    company_id: int
) -> Optional[models.PurchaseOrder]:
    return db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.id == po_id,
        models.PurchaseOrder.company_id == company_id
    ).first()

def get_purchase_orders(
    db: Session,
    company_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
) -> List[models.PurchaseOrder]:
    from sqlalchemy.orm import joinedload
    
    query = db.query(models.PurchaseOrder).options(
        joinedload(models.PurchaseOrder.supplier),
        joinedload(models.PurchaseOrder.lines).joinedload(models.PurchaseOrderLine.item)
    ).filter(
        models.PurchaseOrder.company_id == company_id
    )
    
    if status:
        query = query.filter(models.PurchaseOrder.status == status)
    
    return query.offset(skip).limit(limit).all()

def update_purchase_order(
    db: Session,
    po_id: int,
    company_id: int,
    po_update: schemas.PurchaseOrderUpdate
) -> Optional[models.PurchaseOrder]:
    po = get_purchase_order(db, po_id, company_id)
    if not po:
        return None
    
    update_data = po_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field != "lines":  # Handle lines separately
            setattr(po, field, value)
    
    db.commit()
    db.refresh(po)
    return po

# Standard CRUD operations for GRVs
def get_grv(
    db: Session,
    grv_id: int,
    company_id: int
) -> Optional[models.GoodsReceivedVoucher]:
    return db.query(models.GoodsReceivedVoucher).filter(
        models.GoodsReceivedVoucher.id == grv_id,
        models.GoodsReceivedVoucher.company_id == company_id
    ).first()

def get_grvs(
    db: Session,
    company_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
) -> List[models.GoodsReceivedVoucher]:
    query = db.query(models.GoodsReceivedVoucher).options(
        joinedload(models.GoodsReceivedVoucher.lines),
        joinedload(models.GoodsReceivedVoucher.supplier),
        joinedload(models.GoodsReceivedVoucher.purchase_order)
    ).filter(
        models.GoodsReceivedVoucher.company_id == company_id
    )
    
    if status:
        query = query.filter(models.GoodsReceivedVoucher.status == status)
    
    return query.offset(skip).limit(limit).all()

def update_grv(
    db: Session,
    grv_id: int,
    company_id: int,
    grv_update: schemas.GoodsReceivedVoucherUpdate
) -> Optional[models.GoodsReceivedVoucher]:
    grv = get_grv(db, grv_id, company_id)
    if not grv:
        return None
    
    update_data = grv_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field != "lines":  # Handle lines separately
            setattr(grv, field, value)
    
    db.commit()
    db.refresh(grv)
    return grv

# Reporting and status functions
def get_sales_orders_by_customer(
    db: Session,
    company_id: int,
    customer_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[models.SalesOrder]:
    return db.query(models.SalesOrder).filter(
        models.SalesOrder.company_id == company_id,
        models.SalesOrder.customer_id == customer_id
    ).offset(skip).limit(limit).all()

def get_purchase_orders_by_supplier(
    db: Session,
    company_id: int,
    supplier_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[models.PurchaseOrder]:
    return db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.company_id == company_id,
        models.PurchaseOrder.supplier_id == supplier_id
    ).offset(skip).limit(limit).all()

def get_outstanding_purchase_orders(
    db: Session,
    company_id: int
) -> List[models.PurchaseOrder]:
    return db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.company_id == company_id,
        models.PurchaseOrder.status.in_(["Open", "PartiallyReceived"])
    ).all()

def get_uninvoiced_grvs(
    db: Session,
    company_id: int
) -> List[models.GoodsReceivedVoucher]:
    return db.query(models.GoodsReceivedVoucher).filter(
        models.GoodsReceivedVoucher.company_id == company_id,
        models.GoodsReceivedVoucher.status == "Open"
    ).all()

# Helper functions for tenant-aware operations
def get_order_defaults(db: Session, company_id: int) -> models.OrderDefaults:
    """Get order defaults for a company, raise exception if not found"""
    defaults = db.query(models.OrderDefaults).filter(
        models.OrderDefaults.company_id == company_id
    ).first()
    if not defaults:
        raise HTTPException(status_code=400, detail="Order defaults not configured for this company")
    return defaults

def get_default_warehouse(db: Session, company_id: int) -> Optional[models.Warehouse]:
    """Get the default warehouse for a company"""
    # Try to get from inventory defaults first
    inv_defaults = db.query(models.InventoryDefaults).filter(
        models.InventoryDefaults.company_id == company_id
    ).first()
    
    if inv_defaults and inv_defaults.default_warehouse_id:
        warehouse = db.query(models.Warehouse).filter(
            models.Warehouse.id == inv_defaults.default_warehouse_id,
            models.Warehouse.company_id == company_id
        ).first()
        if warehouse:
            return warehouse
    
    # Fallback to finding a default warehouse
    warehouse = db.query(models.Warehouse).filter(
        models.Warehouse.company_id == company_id,
        models.Warehouse.is_default == True
    ).first()
    
    if not warehouse:
        # Get any warehouse for the company
        warehouse = db.query(models.Warehouse).filter(
            models.Warehouse.company_id == company_id
        ).first()
    
    return warehouse

def get_or_create_item_location(db: Session, item_id: int, warehouse_id: int, company_id: int) -> models.InventoryItemLocation:
    """Get or create inventory item location"""
    item_location = db.query(models.InventoryItemLocation).filter(
        models.InventoryItemLocation.item_id == item_id,
        models.InventoryItemLocation.warehouse_id == warehouse_id,
        models.InventoryItemLocation.company_id == company_id
    ).first()
    
    if not item_location:
        item_location = models.InventoryItemLocation(
            company_id=company_id,
            item_id=item_id,
            warehouse_id=warehouse_id,
            quantity_on_hand=Decimal("0.00"),
            quantity_committed=Decimal("0.00"),
            quantity_on_order=Decimal("0.00")
        )
        db.add(item_location)
        db.flush()
    
    return item_location

def get_default_ar_invoice_type_id(db: Session, company_id: int) -> int:
    """Get the default AR invoice transaction type ID"""
    ar_trans_type = db.query(models.ARTransactionType).filter(
        models.ARTransactionType.company_id == company_id,
        models.ARTransactionType.base_type == "Invoice",
        models.ARTransactionType.is_active == True
    ).first()
    
    if not ar_trans_type:
        raise HTTPException(status_code=400, detail="No active Invoice transaction type found for this company")
    
    return ar_trans_type.id

def get_sale_transaction_type_id(db: Session, company_id: int) -> int:
    """Get the sale inventory transaction type ID"""
    sale_trans_type = db.query(models.InventoryTransactionType).filter(
        models.InventoryTransactionType.company_id == company_id,
        models.InventoryTransactionType.base_type == "SaleToCustomer"
    ).first()
    
    if not sale_trans_type:
        raise HTTPException(status_code=400, detail="Sales inventory transaction type not found for this company")
    
    return sale_trans_type.id

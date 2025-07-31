from sqlalchemy.orm import Session
from app import crud, models, schemas

class ARService:
    def __init__(self, db: Session):
        self.db = db

    def create_customer(self, customer: schemas.CustomerCreate):
        return crud.ar.create_customer(self.db, customer)

    def create_invoice(self, invoice: schemas.ARTransactionCreate):
        return crud.ar.create_ar_transaction(self.db, invoice)

    def create_payment(self, payment: schemas.ARTransactionCreate):
        return crud.ar.create_ar_transaction(self.db, payment)

    def allocate_payment(self, payment_id: int, invoice_id: int, amount: float):
        # This is a simplified allocation. A real implementation would be more complex.
        allocation = models.ARAllocation(
            payment_id=payment_id,
            invoice_id=invoice_id,
            allocated_amount=amount
        )
        self.db.add(allocation)
        self.db.commit()
        return allocation

    def get_customer_aging_report(self, company_id: int):
        return crud.ar.get_customer_aging_report(self.db, company_id)

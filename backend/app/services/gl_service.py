from sqlalchemy.orm import Session
from app import crud, models, schemas

class GLService:
    def __init__(self, db: Session):
        self.db = db

    def create_basic_chart_of_accounts(self, company_id: int):
        # This is a simplified chart of accounts. A real implementation would be more complex.
        chart = models.ChartOfAccounts(
            company_id=company_id,
            name="Standard Chart of Accounts",
            description="A basic chart of accounts for testing."
        )
        self.db.add(chart)
        self.db.commit()
        return chart

    def create_account(self, account: schemas.GLAccountCreate):
        return crud.gl.create_gl_account(self.db, account)

    def create_transaction(self, transaction: schemas.GLJournalEntryCreate):
        return crud.gl.create_gl_journal_entry(self.db, transaction)

    def get_account_balance(self, account_id: int):
        account = crud.gl.get_gl_account(self.db, account_id)
        return account.current_balance

from decimal import Decimal
from datetime import date
from sqlalchemy.orm import Session
from app import models, schemas
from app.crud import gl as crud_gl


class ForexService:
    @staticmethod
    def get_exchange_rate(
        db: Session,
        currency_id: int,
        rate_date: date,
        company_id: int
    ) -> Decimal:
        """Get exchange rate for a specific date"""
        # First try exact date
        rate = db.query(models.ExchangeRateHistory).filter(
            models.ExchangeRateHistory.currency_id == currency_id,
            models.ExchangeRateHistory.rate_date == rate_date,
            models.ExchangeRateHistory.company_id == company_id
        ).first()
        
        if rate:
            return rate.exchange_rate
        
        # If not found, get the latest rate before the date
        rate = db.query(models.ExchangeRateHistory).filter(
            models.ExchangeRateHistory.currency_id == currency_id,
            models.ExchangeRateHistory.rate_date <= rate_date,
            models.ExchangeRateHistory.company_id == company_id
        ).order_by(models.ExchangeRateHistory.rate_date.desc()).first()
        
        if rate:
            return rate.exchange_rate
        
        # If still not found, check if it's base currency
        currency = db.query(models.Currency).filter(
            models.Currency.id == currency_id,
            models.Currency.company_id == company_id
        ).first()
        
        if currency and currency.is_base_currency:
            return Decimal("1.000000")
        
        # Default to currency's static rate
        return currency.exchange_rate_to_base if currency else Decimal("1.000000")
    
    @staticmethod
    def calculate_forex_gain_loss(
        db: Session,
        original_amount: Decimal,
        original_rate: Decimal,
        payment_amount: Decimal,
        payment_rate: Decimal,
        company_id: int,
        transaction_type: str,
        transaction_id: int,
        user_id: int
    ) -> models.ForexGainLoss:
        """Calculate and post foreign exchange gain/loss"""
        # Calculate base currency amounts
        original_base = original_amount * original_rate
        payment_base = payment_amount * payment_rate
        
        # Gain/Loss = Payment base amount - Original base amount
        gain_loss = payment_base - original_base
        
        if gain_loss == 0:
            return None
        
        # Get GL accounts from company defaults
        defaults = db.query(models.GLDefaults).filter(
            models.GLDefaults.company_id == company_id
        ).first()
        
        # Create GL journal entry for forex gain/loss
        gl_lines = []
        if gain_loss > 0:  # Gain
            gl_lines.append({
                "gl_account_id": defaults.forex_gain_account_id,
                "credit_amount": abs(gain_loss),
                "debit_amount": Decimal("0")
            })
            gl_lines.append({
                "gl_account_id": defaults.default_ar_control_account_id if "AR" in transaction_type 
                                else defaults.default_ap_control_account_id,
                "debit_amount": abs(gain_loss),
                "credit_amount": Decimal("0")
            })
        else:  # Loss
            gl_lines.append({
                "gl_account_id": defaults.forex_loss_account_id,
                "debit_amount": abs(gain_loss),
                "credit_amount": Decimal("0")
            })
            gl_lines.append({
                "gl_account_id": defaults.default_ar_control_account_id if "AR" in transaction_type 
                                else defaults.default_ap_control_account_id,
                "credit_amount": abs(gain_loss),
                "debit_amount": Decimal("0")
            })
        
        # Post to GL
        journal_entry = crud_gl.create_journal_entry(
            db,
            schemas.GLJournalEntryCreate(
                entry_date=date.today(),
                reference=f"Forex {transaction_type} {transaction_id}",
                description=f"Foreign exchange {'gain' if gain_loss > 0 else 'loss'}",
                lines=gl_lines
            ),
            company_id,
            user_id
        )
        
        # Record forex gain/loss
        forex_record = models.ForexGainLoss(
            company_id=company_id,
            transaction_type=transaction_type,
            transaction_id=transaction_id,
            gain_loss_amount=gain_loss,
            gl_journal_entry_id=journal_entry.id
        )
        db.add(forex_record)
        db.commit()
        db.refresh(forex_record)
        
        return forex_record
    
    @staticmethod
    def update_exchange_rate(
        db: Session,
        currency_id: int,
        rate_date: date,
        exchange_rate: Decimal,
        company_id: int
    ) -> models.ExchangeRateHistory:
        """Update or create exchange rate for a specific date"""
        # Check if rate already exists for this date
        existing_rate = db.query(models.ExchangeRateHistory).filter(
            models.ExchangeRateHistory.currency_id == currency_id,
            models.ExchangeRateHistory.rate_date == rate_date,
            models.ExchangeRateHistory.company_id == company_id
        ).first()
        
        if existing_rate:
            existing_rate.exchange_rate = exchange_rate
            db.commit()
            db.refresh(existing_rate)
            return existing_rate
        else:
            new_rate = models.ExchangeRateHistory(
                company_id=company_id,
                currency_id=currency_id,
                rate_date=rate_date,
                exchange_rate=exchange_rate
            )
            db.add(new_rate)
            db.commit()
            db.refresh(new_rate)
            return new_rate
    
    @staticmethod
    def convert_amount(
        db: Session,
        amount: Decimal,
        from_currency_id: int,
        to_currency_id: int,
        rate_date: date,
        company_id: int
    ) -> Decimal:
        """Convert amount from one currency to another"""
        if from_currency_id == to_currency_id:
            return amount
        
        # Get exchange rates
        from_rate = ForexService.get_exchange_rate(
            db, from_currency_id, rate_date, company_id
        )
        to_rate = ForexService.get_exchange_rate(
            db, to_currency_id, rate_date, company_id
        )
        
        # Convert to base currency first, then to target currency
        base_amount = amount * from_rate
        target_amount = base_amount / to_rate
        
        return target_amount

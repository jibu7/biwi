from sqlalchemy import Column, Integer, String, ForeignKey, Date, Numeric, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base


class ExchangeRateHistory(Base):
    __tablename__ = "exchange_rate_history"
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    currency_id = Column(Integer, ForeignKey("currencies.id"))
    rate_date = Column(Date)
    exchange_rate = Column(Numeric(15, 6))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company")
    currency = relationship("Currency")
    
    __table_args__ = (
        UniqueConstraint('currency_id', 'rate_date', 'company_id', 
                        name='uq_exchange_rate_date'),
    )


class ForexGainLoss(Base):
    __tablename__ = "forex_gain_loss"
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    transaction_type = Column(String)  # "AR_Payment", "AP_Payment", etc.
    transaction_id = Column(Integer)
    gain_loss_amount = Column(Numeric(15, 2))  # Positive = gain, Negative = loss
    gl_journal_entry_id = Column(Integer, ForeignKey("gl_journal_entries.id"))
    
    company = relationship("Company")
    gl_journal_entry = relationship("GLJournalEntry")

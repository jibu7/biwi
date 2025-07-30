from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel

class TimeRangeFilter(str, Enum):
    SEVEN_DAYS = "7d"
    THIRTY_DAYS = "30d"
    NINETY_DAYS = "90d"
    ONE_YEAR = "1y"

class KPIData(BaseModel):
    value: str
    change: str

class ChartData(BaseModel):
    label: str
    value: float

class AlertData(BaseModel):
    type: str  # 'info', 'warning', 'error'
    message: str

class ExecutiveDashboardResponse(BaseModel):
    kpis: Dict[str, KPIData]
    charts: Dict[str, List[ChartData]]
    alerts: List[AlertData]
    last_updated: datetime
    
    class Config:
        from_attributes = True
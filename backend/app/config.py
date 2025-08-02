from pydantic_settings import BaseSettings, SettingsConfigDict
import os
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vinea ERP Backend"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://user:password@localhost/Biwi_db"
    SECRET_KEY: str = "your_super_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_HOSTS: list[str] = ["*"]
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000", 
        "http://localhost:3001",
        "https://www.channelzap.com",
        "https://channelzap.com"
    ]
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000", 
        "http://localhost:3001",
        "https://www.channelzap.com",
        "https://channelzap.com"
    ]
    
    # Alert system configuration
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    SMTP_FROM_EMAIL: str = "noreply@vinea-erp.com"
    ALERT_EMAIL: str = "admin@vinea-erp.com"
    SLACK_WEBHOOK_URL: str = ""
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Parse CORS_ORIGINS from environment if it's a JSON string
        cors_origins_str = os.getenv('CORS_ORIGINS')
        if cors_origins_str:
            try:
                self.BACKEND_CORS_ORIGINS = json.loads(cors_origins_str)
                self.CORS_ORIGINS = json.loads(cors_origins_str)
            except json.JSONDecodeError:
                # Fallback to default if JSON parsing fails
                pass

settings = Settings()

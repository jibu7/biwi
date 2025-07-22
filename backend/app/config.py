from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vinea ERP Backend"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://user:password@localhost/Biwi_db"
    SECRET_KEY: str = "your_super_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_HOSTS: list[str] = ["*"]
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

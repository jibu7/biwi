import smtplib
import asyncio
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from datetime import datetime
import aiohttp
import logging

from app.config import settings

logger = logging.getLogger(__name__)


async def send_email_alert(
    error_id: str,
    error_message: str,
    stack_trace: str,
    url: Optional[str] = None,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    occurrence_count: int = 1
):
    """Send email alert for critical errors."""
    try:
        if not hasattr(settings, 'SMTP_HOST') or not settings.SMTP_HOST:
            logger.warning("SMTP not configured, skipping email alert")
            return

        # Create email content
        subject = f"🚨 Critical Error Alert - {error_id}"
        
        html_body = f"""
        <html>
        <body>
            <h2 style="color: #dc2626;">Critical Error Detected</h2>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 16px 0;">
                <h3>Error Details</h3>
                <p><strong>Error ID:</strong> {error_id}</p>
                <p><strong>Message:</strong> {error_message}</p>
                <p><strong>URL:</strong> {url or 'N/A'}</p>
                <p><strong>Company ID:</strong> {company_id or 'N/A'}</p>
                <p><strong>User ID:</strong> {user_id or 'N/A'}</p>
                <p><strong>Occurrences:</strong> {occurrence_count}</p>
                <p><strong>Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
            </div>
            
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 16px 0;">
                <h3>Stack Trace</h3>
                <pre style="font-size: 12px; overflow-x: auto;">{stack_trace}</pre>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
                This is an automated alert from Vinea ERP. Please investigate this error immediately.
            </p>
        </body>
        </html>
        """
        
        text_body = f"""
        CRITICAL ERROR ALERT
        
        Error ID: {error_id}
        Message: {error_message}
        URL: {url or 'N/A'}
        Company ID: {company_id or 'N/A'}
        User ID: {user_id or 'N/A'}
        Occurrences: {occurrence_count}
        Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
        
        Stack Trace:
        {stack_trace}
        
        This is an automated alert from Vinea ERP. Please investigate this error immediately.
        """

        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = getattr(settings, 'SMTP_FROM_EMAIL', 'noreply@vinea-erp.com')
        msg['To'] = getattr(settings, 'ALERT_EMAIL', 'admin@vinea-erp.com')

        # Attach text and HTML parts
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, getattr(settings, 'SMTP_PORT', 587)) as server:
            if getattr(settings, 'SMTP_TLS', True):
                server.starttls()
            if hasattr(settings, 'SMTP_USERNAME') and settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email alert sent for error {error_id}")
        
    except Exception as e:
        logger.error(f"Failed to send email alert for error {error_id}: {e}")


async def send_slack_alert(
    error_id: str,
    error_message: str,
    stack_trace: str,
    url: Optional[str] = None,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    occurrence_count: int = 1
):
    """Send Slack alert for critical errors."""
    try:
        if not hasattr(settings, 'SLACK_WEBHOOK_URL') or not settings.SLACK_WEBHOOK_URL:
            logger.warning("Slack webhook not configured, skipping Slack alert")
            return

        # Create Slack message
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🚨 Critical Error Alert"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Error ID:*\n{error_id}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Occurrences:*\n{occurrence_count}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Company ID:*\n{company_id or 'N/A'}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Time:*\n{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Error Message:*\n```{error_message}```"
                }
            }
        ]
        
        if url:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*URL:* {url}"
                }
            })
        
        # Truncate stack trace for Slack (it has message limits)
        truncated_stack = stack_trace[:1000] + "..." if len(stack_trace) > 1000 else stack_trace
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Stack Trace:*\n```{truncated_stack}```"
            }
        })

        payload = {
            "text": f"Critical Error Alert - {error_id}",
            "blocks": blocks
        }

        # Send to Slack
        async with aiohttp.ClientSession() as session:
            async with session.post(
                settings.SLACK_WEBHOOK_URL,
                json=payload,
                headers={'Content-Type': 'application/json'}
            ) as response:
                if response.status == 200:
                    logger.info(f"Slack alert sent for error {error_id}")
                else:
                    logger.error(f"Failed to send Slack alert: {response.status}")
                    
    except Exception as e:
        logger.error(f"Failed to send Slack alert for error {error_id}: {e}")


async def send_platform_alert(
    error_id: str,
    error_message: str,
    stack_trace: str,
    url: Optional[str] = None,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    occurrence_count: int = 1
):
    """Send platform alert using all configured channels."""
    # Send alerts concurrently
    tasks = []
    
    # Email alert
    tasks.append(send_email_alert(
        error_id, error_message, stack_trace, url, company_id, user_id, occurrence_count
    ))
    
    # Slack alert
    tasks.append(send_slack_alert(
        error_id, error_message, stack_trace, url, company_id, user_id, occurrence_count
    ))
    
    # Execute all tasks concurrently
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


# Rate limiting to prevent spam
class AlertRateLimiter:
    def __init__(self):
        self._alerts = {}  # error_id -> last_alert_time
        self._rate_limit = 300  # 5 minutes between alerts for same error
    
    def should_send_alert(self, error_id: str) -> bool:
        """Check if we should send an alert for this error."""
        now = datetime.utcnow().timestamp()
        last_alert = self._alerts.get(error_id, 0)
        
        if now - last_alert > self._rate_limit:
            self._alerts[error_id] = now
            return True
        return False


# Global rate limiter instance
alert_rate_limiter = AlertRateLimiter()


async def send_critical_error_alert(
    error_id: str,
    exception: Exception,
    url: Optional[str] = None,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    occurrence_count: int = 1
):
    """Send critical error alert with rate limiting."""
    # Check rate limiting
    if not alert_rate_limiter.should_send_alert(error_id):
        logger.info(f"Rate limited alert for error {error_id}")
        return
    
    import traceback
    stack_trace = traceback.format_exc()
    
    await send_platform_alert(
        error_id=error_id,
        error_message=str(exception),
        stack_trace=stack_trace,
        url=url,
        company_id=company_id,
        user_id=user_id,
        occurrence_count=occurrence_count
    )
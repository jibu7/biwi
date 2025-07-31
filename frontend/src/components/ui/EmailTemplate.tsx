'use client';

import React from 'react';
import { Logo } from './Logo';
import { brandContent } from './BrandKit';

interface EmailTemplateProps {
  children: React.ReactNode;
  title?: string;
  preheader?: string;
}

export function EmailTemplate({ children, title, preheader }: EmailTemplateProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {preheader && (
          <div style={{ display: 'none', fontSize: '1px', color: '#fefefe', lineHeight: '1px', fontFamily: 'Helvetica, Arial, sans-serif', maxHeight: '0px', maxWidth: '0px', opacity: 0, overflow: 'hidden' }}>
            {preheader}
          </div>
        )}
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f4', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ backgroundColor: '#f4f4f4' }}>
          <tr>
            <td align="center" style={{ padding: '20px 0' }}>
              <table cellPadding="0" cellSpacing="0" border={0} width="600" style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                {/* Header */}
                <tr>
                  <td style={{ backgroundColor: '#667eea', padding: '30px 40px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src="/channelzap.com_logo_OG.svg" 
                        alt="ChannelZap" 
                        width="48" 
                        height="48" 
                        style={{ verticalAlign: 'middle' }}
                      />
                      <span style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', letterSpacing: '-0.025em' }}>
                        {brandContent.name}
                      </span>
                    </div>
                  </td>
                </tr>
                
                {/* Content */}
                <tr>
                  <td style={{ padding: '40px' }}>
                    {children}
                  </td>
                </tr>
                
                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: '#f8fafc', padding: '30px 40px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <img 
                          src="/channelzap.com_logo_OG.svg" 
                          alt="ChannelZap" 
                          width="24" 
                          height="24" 
                          style={{ verticalAlign: 'middle' }}
                        />
                        <span style={{ color: '#64748b', fontSize: '16px', fontWeight: '600' }}>
                          {brandContent.name}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                      {brandContent.tagline}
                    </p>
                    <p style={{ margin: '0', color: '#94a3b8', fontSize: '12px' }}>
                      {brandContent.copyright}
                    </p>
                    <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
                      Need help? Contact us at{' '}
                      <a href={`mailto:${brandContent.supportEmail}`} style={{ color: '#667eea', textDecoration: 'none' }}>
                        {brandContent.supportEmail}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

// Example usage components
export function WelcomeEmail({ userName }: { userName: string }) {
  return (
    <EmailTemplate 
      title="Welcome to ChannelZap" 
      preheader="Get started with your new account"
    >
      <h1 style={{ margin: '0 0 24px 0', color: '#1e293b', fontSize: '28px', fontWeight: 'bold', lineHeight: '1.2' }}>
        Welcome to ChannelZap!
      </h1>
      <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '16px', lineHeight: '1.6' }}>
        Hi {userName},
      </p>
      <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '16px', lineHeight: '1.6' }}>
        Thank you for joining ChannelZap! We're excited to help you streamline your business operations across all channels.
      </p>
      <div style={{ margin: '32px 0', textAlign: 'center' }}>
        <a 
          href="/login" 
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            backgroundColor: '#667eea',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          Get Started
        </a>
      </div>
    </EmailTemplate>
  );
}

export function PasswordResetEmail({ resetLink }: { resetLink: string }) {
  return (
    <EmailTemplate 
      title="Reset Your Password - ChannelZap" 
      preheader="Reset your password to continue accessing your account"
    >
      <h1 style={{ margin: '0 0 24px 0', color: '#1e293b', fontSize: '28px', fontWeight: 'bold', lineHeight: '1.2' }}>
        Reset Your Password
      </h1>
      <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '16px', lineHeight: '1.6' }}>
        We received a request to reset your password. Click the button below to create a new password.
      </p>
      <div style={{ margin: '32px 0', textAlign: 'center' }}>
        <a 
          href={resetLink}
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            backgroundColor: '#667eea',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          Reset Password
        </a>
      </div>
      <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
        If you didn't request this password reset, you can safely ignore this email.
      </p>
    </EmailTemplate>
  );
}

export default EmailTemplate;

import { 
  BuildingIcon,
  UsersIcon,
  CreditCardIcon,
  BarChart3Icon,
  SettingsIcon,
  ActivityIcon,
  PackageIcon,
  AlertCircleIcon,
  KeyIcon,
  ShieldIcon,
  ServerIcon,
  DatabaseIcon,
  FileTextIcon,
  MailIcon,
  BellIcon
} from 'lucide-react';

export const platformNavItems = [
  {
    label: "Dashboard",
    href: "/platform/dashboard",
    icon: BarChart3Icon,
  },
  {
    label: "Companies",
    icon: BuildingIcon,
    children: [
      { label: "All Companies", href: "/platform/companies", icon: BuildingIcon },
      { label: "Subscription Plans", href: "/platform/companies/plans", icon: PackageIcon },
      { label: "Usage & Limits", href: "/platform/companies/usage", icon: ActivityIcon },
    ]
  },
  {
    label: "Users",
    icon: UsersIcon,
    children: [
      { label: "All Users", href: "/platform/users", icon: UsersIcon },
      { label: "Platform Admins", href: "/platform/users/admins", icon: ShieldIcon },
      { label: "User Activity", href: "/platform/users/activity", icon: ActivityIcon },
    ]
  },
  {
    label: "Billing",
    icon: CreditCardIcon,
    children: [
      { label: "Subscriptions", href: "/platform/billing/subscriptions", icon: CreditCardIcon },
      { label: "Invoices", href: "/platform/billing/invoices", icon: FileTextIcon },
      { label: "Payment Methods", href: "/platform/billing/payment-methods", icon: CreditCardIcon },
      { label: "Revenue Reports", href: "/platform/billing/revenue", icon: BarChart3Icon },
    ]
  },
  {
    label: "System",
    icon: ServerIcon,
    children: [
      { label: "Health Status", href: "/platform/system/health", icon: ActivityIcon },
      { label: "Database", href: "/platform/system/database", icon: DatabaseIcon },
      { label: "API Keys", href: "/platform/system/api-keys", icon: KeyIcon },
      { label: "Audit Logs", href: "/platform/system/audit", icon: FileTextIcon },
      { label: "Error Logs", href: "/platform/system/errors", icon: AlertCircleIcon },
    ]
  },
  {
    label: "Communications",
    icon: MailIcon,
    children: [
      { label: "Email Templates", href: "/platform/communications/emails", icon: MailIcon },
      { label: "Notifications", href: "/platform/communications/notifications", icon: BellIcon },
      { label: "Announcements", href: "/platform/communications/announcements", icon: BellIcon },
    ]
  },
  {
    label: "Settings",
    icon: SettingsIcon,
    children: [
      { label: "Platform Settings", href: "/platform/settings/general", icon: SettingsIcon },
      { label: "Security", href: "/platform/settings/security", icon: ShieldIcon },
      { label: "Integrations", href: "/platform/settings/integrations", icon: PackageIcon },
    ]
  },
];

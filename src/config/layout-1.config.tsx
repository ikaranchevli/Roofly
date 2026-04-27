import { FileText, Home, LayoutGrid, Settings, Users } from 'lucide-react';
import { MenuConfig } from '@/config/types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    heading: 'Overview',
  },
  {
    title: 'Dashboard',
    icon: Home,
    path: '/dashboard',
  },
  {
    heading: 'Property',
  },
  {
    title: 'Tenants',
    icon: Users,
    path: '/tenants',
  },
  {
    title: 'Bills',
    icon: FileText,
    path: '/bills',
  },
  {
    heading: 'System',
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

// Mega menu not used in Roofly (kept minimal)
export const MENU_MEGA: MenuConfig = [];

export const MENU_MEGA_MOBILE: MenuConfig = [
  { title: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
  { title: 'Tenants', icon: Users, path: '/tenants' },
];

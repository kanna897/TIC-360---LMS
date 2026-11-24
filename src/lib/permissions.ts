import { UserRole } from './types';
import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck,
  CircleDollarSign,
  ClipboardCheck,
  FileSpreadsheet,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  LucideIcon,
  Settings,
  ShieldCheck,
  Sparkles,
  UserX,
  Users,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge: string | null;
  description?: string;
}

export interface RolePermissionConfig {
  role: UserRole;
  title: string;
  badgeColor: string;
  description: string;
  defaultRoute: string;
  allowedRoutes: string[];
  navItems: NavItem[];
}

/**
 * The standalone LMS has exactly three application roles. These route rules
 * improve navigation and fail closed in the browser; Supabase RLS and trusted
 * server handlers remain the authoritative security boundaries.
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissionConfig> = {
  Admin: {
    role: 'Admin',
    title: 'LMS Administrator',
    badgeColor: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    description: 'Complete academic, finance, career, approval and platform administration.',
    defaultRoute: '/',
    allowedRoutes: [
      '/', '/change-password', '/admin-control', '/admin/users', '/admin/academic', '/students', '/attendance', '/absentees-form',
      '/absentees-report', '/blossom-payments', '/dropouts', '/assessments',
      '/outcomes', '/reports', '/settings', '/portal', '/register', '/members',
      '/stickers', '/finance', '/courses', '/graduate-survey',
      '/career-survey-report', '/survey', '/login',
    ],
    navItems: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
      { label: 'LMS Control Centre', href: '/admin-control', icon: ShieldCheck, badge: 'New' },
      { label: 'Bulk Student Accounts', href: '/admin/users', icon: Users, badge: 'New' },
      { label: 'Academic Structure', href: '/admin/academic', icon: FolderTree, badge: 'New' },
      { label: 'Users & Students', href: '/students', icon: Users, badge: null },
      { label: 'Attendance', href: '/attendance', icon: CalendarCheck, badge: 'Admin' },
      { label: 'Assessments & Marks', href: '/assessments', icon: FileSpreadsheet, badge: null },
      { label: 'Learning Outcomes', href: '/outcomes', icon: GraduationCap, badge: null },
      { label: 'Blossom Payments', href: '/blossom-payments', icon: CircleDollarSign, badge: 'Admin' },
      { label: 'Dropout Management', href: '/dropouts', icon: UserX, badge: null },
      { label: 'Career Tracking', href: '/career-survey-report', icon: BriefcaseBusiness, badge: null },
      { label: 'Reports', href: '/reports', icon: BarChart3, badge: null },
      { label: 'Settings', href: '/settings', icon: Settings, badge: 'Admin' },
    ],
  },

  Trainer: {
    role: 'Trainer',
    title: 'Trainer Workspace',
    badgeColor: 'bg-teal-400/15 text-teal-300 border-teal-400/30',
    description: 'Assigned teaching, learning content, evaluation and learner progress workspace.',
    defaultRoute: '/trainer',
    allowedRoutes: ['/trainer', '/change-password', '/login'],
    navItems: [
      { label: 'Trainer Dashboard', href: '/trainer', icon: LayoutDashboard, badge: null },
      { label: 'Assigned Access', href: '/trainer', icon: BookOpenCheck, badge: 'Protected' },
    ],
  },

  Student: {
    role: 'Student',
    title: 'Student Learning Portal',
    badgeColor: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
    description: 'Personal learning, attendance, results, finance and career information.',
    defaultRoute: '/portal',
    allowedRoutes: [
      '/portal', '/change-password', '/register', '/absentees-form', '/survey',
      '/graduate-survey', '/login',
    ],
    navItems: [
      { label: 'My Dashboard', href: '/portal', icon: Sparkles, badge: null },
      { label: 'Leave Request', href: '/absentees-form', icon: ClipboardCheck, badge: null },
      { label: 'Career Profile', href: '/survey', icon: BriefcaseBusiness, badge: null },
    ],
  },
};

const PUBLIC_ROUTES = ['/login', '/register', '/absentees-form', '/survey', '/graduate-survey'];

export const canAccessRoute = (role: UserRole | undefined, pathname: string): boolean => {
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true;
  }

  if (!role) return false;
  const config = ROLE_PERMISSIONS[role];

  return config.allowedRoutes.some((route) => {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname.startsWith(`${route}/`);
  });
};

export const getDefaultRouteForRole = (role: UserRole | undefined): string =>
  role ? ROLE_PERMISSIONS[role].defaultRoute : '/login';

import {
  BarChart3,
  Filter,
  GitCommitHorizontal,
  Home,
  LayoutDashboard,
  UploadCloud,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** Single source of truth for navigation (sidebar, mobile nav, command menu, page titles). */
export const NAV: NavItem[] = [
  { href: '/', label: 'Home', description: 'Start here', icon: Home },
  { href: '/overview', label: 'Overview', description: 'Pipeline at a glance', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload', description: 'Add consultants from CSV', icon: UploadCloud },
  { href: '/consultants', label: 'Consultants', description: 'Search and filter everyone', icon: Users },
  { href: '/funnel', label: 'Funnel', description: 'Stage-by-stage conversion', icon: Filter },
  { href: '/journey', label: 'Journey', description: 'One consultant’s path', icon: GitCommitHorizontal },
  { href: '/insights', label: 'Insights', description: 'Technology, title and visa mix', icon: BarChart3 },
];

export function findNav(pathname: string): NavItem | undefined {
  return NAV.find((item) => (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)));
}

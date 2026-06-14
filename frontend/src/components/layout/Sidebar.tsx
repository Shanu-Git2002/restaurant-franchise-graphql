import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, Users, Star, BarChart3, Settings, LogOut, ChefHat, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useMutation } from '@apollo/client';
import { LOGOUT_MUTATION } from '@/features/auth/api/auth.graphql';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { to: '/outlets', icon: Store, label: 'Outlets', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { to: '/employees', icon: Users, label: 'Employees', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { to: '/reviews', icon: Star, label: 'Reviews', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  const handleLogout = async () => {
    try { await logoutMutation(); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className={cn(
      'flex flex-col h-screen bg-gray-900 text-white transition-all duration-300 sticky top-0',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-orange-400" />
            <span className="font-bold text-lg">FranchisePro</span>
          </div>
        )}
        {collapsed && <ChefHat className="h-7 w-7 text-orange-400 mx-auto" />}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white hover:bg-gray-700 ml-auto"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-gray-700">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user ? getInitials(user.fullName) : 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-400 hover:bg-gray-700 shrink-0"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}

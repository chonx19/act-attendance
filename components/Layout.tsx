
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowRightLeft, FileText, LogOut, Menu, X, Trello, Globe, Moon, Sun, Users, Settings, Mail, CheckSquare, Calendar, Server } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserRole } from '../types';

const Layout = () => {
  const { user, logout } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isEmployee = user?.role === UserRole.ADMIN || user?.role === UserRole.USER;
  const isAdmin = user?.role === UserRole.ADMIN;

  // Permissions Check Helper
  const hasPermission = (perm: string) => {
    if (user?.role === UserRole.ADMIN) return true;
    if (user?.role === UserRole.USER) return user.permissions?.includes(perm) || false;
    return false;
  };

  const navItems = [];
  if (user?.role === UserRole.CUSTOMER) {
    navItems.push({ to: '/app/contact', icon: Mail, label: t('menu_messages') });
  } else {
    // Admin or Employee (Check Permissions)
    if (hasPermission('dashboard')) navItems.push({ to: '/app/dashboard', icon: LayoutDashboard, label: t('menu_dashboard') });
    if (hasPermission('kanban')) navItems.push({ to: '/app/kanban', icon: Trello, label: t('menu_kanban') });
    if (hasPermission('products')) navItems.push({ to: '/app/products', icon: Package, label: t('menu_products') });
    if (hasPermission('attendance')) navItems.push({ to: '/app/attendance', icon: Calendar, label: t('menu_attendance_logs') });
    if (hasPermission('stock')) navItems.push({ to: '/app/stock-movement', icon: ArrowRightLeft, label: t('menu_stock') });
    if (hasPermission('reports')) navItems.push({ to: '/app/reports', icon: FileText, label: t('menu_reports') });
    // Always show messages for internal staff too? Or use permission? Let's assume always for now or use 'messages' permission if strictly needed.
    // For now, let's include it always for internal staff or maybe under 'dashboard' implied access? 
    // Actually, let's just add it as a basic feature for all staff.
    navItems.push({ to: '/app/contact', icon: Mail, label: t('menu_messages') });
  }

  const masterDataItems = [];
  if (hasPermission('customers')) {
    masterDataItems.push({ to: '/app/customers', icon: Users, label: t('menu_customers') });
  }

  const renderNavLink = (item: any) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) => `
        flex items-center px-4 py-3 rounded-lg transition-colors mb-1
        ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700'}
      `}
    >
      <item.icon className="w-5 h-5 mr-3" />
      <span className="font-medium">{item.label}</span>
      {item.to === '/app/contact' && (
        // Badge example if needed
        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden">3</span>
      )}
    </NavLink>
  );

  return (
    <div className="flex h-[100dvh] bg-gray-100 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 dark:bg-slate-950 text-white shadow-xl border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">A</div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">ACT<span className="text-blue-400">&</span>R</h1>
              <span className="text-[0.6rem] text-slate-400 tracking-wider">PRECISION PART</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto no-scrollbar">
          <div className="mb-2">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('menu_main')}</p>
            {navItems.map(renderNavLink)}
          </div>

          {masterDataItems.length > 0 && (
            <div className="mt-6">
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('menu_master')}</p>
              {masterDataItems.map(renderNavLink)}
            </div>
          )}

          {/* Admin Section */}
          <div className="mt-6">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('menu_admin')}</p>

            {hasPermission('settings') && (
              <NavLink
                to="/app/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-lg transition-colors mb-1
                  ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700'}
              `}
              >
                <Settings className="w-5 h-5 mr-3" />
                <span className="font-medium">{t('settings')} / {t('backupData')}</span>
              </NavLink>
            )}



            {hasPermission('devices') && (
              <NavLink
                to="/app/devices"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-lg transition-colors mb-1
                  ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700'}
              `}
              >
                <Server className="w-5 h-5 mr-3" />
                <span className="font-medium">{t('devices')}</span>
              </NavLink>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900 dark:bg-slate-950 space-y-3">
          {/* Toggles */}
          <div className="flex gap-2">
            <button
              onClick={toggleLanguage}
              className="flex-1 flex items-center justify-center px-2 py-2 text-xs font-bold text-slate-400 bg-slate-800 rounded-lg hover:text-white hover:bg-slate-700 transition"
              title="Change Language"
            >
              <Globe className="w-3 h-3 mr-1" />
              {language === 'th' ? 'TH' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center px-2 py-2 text-xs font-bold text-slate-400 bg-slate-800 rounded-lg hover:text-white hover:bg-slate-700 transition"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-3 h-3 mr-1" /> : <Sun className="w-3 h-3 mr-1" />}
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>

          <div className="flex items-center px-2 pt-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold uppercase text-white">
              {user?.name.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize truncate">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('nav_logout')}
          </button>
        </div>
      </aside>

      {/* Mobile Header - Z-Index 40 to stay above menu if needed, or interact properly */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 dark:bg-slate-950 text-white z-40 flex justify-between items-center p-4 shadow-md h-16">
        <span className="text-xl font-bold">ACT<span className="text-blue-400">&</span>R</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay - Z-Index 30 */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900 dark:bg-slate-950 z-30 pt-20 px-4 space-y-4 overflow-y-auto pb-20">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center px-4 py-4 rounded-lg text-lg
                ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}
              `}
            >
              <item.icon className="w-6 h-6 mr-4" />
              {item.label}
            </NavLink>
          ))}
          {masterDataItems.length > 0 && (
            <div className="border-t border-slate-800 my-4 pt-4">
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('menu_master')}</p>
              {masterDataItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center px-4 py-4 rounded-lg text-lg
                    ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}
                  `}
                >
                  <item.icon className="w-6 h-6 mr-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}

          {isAdmin && (
            <NavLink
              to="/app/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                  flex items-center px-4 py-4 rounded-lg text-lg
                  ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}
                `}
            >
              <Settings className="w-6 h-6 mr-4" />
              Settings
            </NavLink>
          )}

          {hasPermission('devices') && (
            <NavLink
              to="/app/devices"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                  flex items-center px-4 py-4 rounded-lg text-lg
                  ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}
                `}
            >
              <Server className="w-6 h-6 mr-4" />
              {t('devices')}
            </NavLink>
          )}

          <div className="border-t border-slate-800 pt-4 flex justify-between items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex-1 flex justify-center items-center px-4 py-3 bg-slate-800 rounded-lg text-white font-bold"
            >
              <Globe className="w-5 h-5 mr-2" />
              {language.toUpperCase()}
            </button>
            <button
              onClick={toggleTheme}
              className="flex-1 flex justify-center items-center px-4 py-3 bg-slate-800 rounded-lg text-white font-bold"
            >
              {theme === 'light' ? <Moon className="w-5 h-5 mr-2" /> : <Sun className="w-5 h-5 mr-2" />}
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-4 text-lg text-red-400 hover:bg-slate-800 rounded-lg mt-4"
          >
            <LogOut className="w-6 h-6 mr-4" />
            {t('nav_logout')}
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-16 bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="p-4 md:p-8 max-w-[1920px] mx-auto h-full flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

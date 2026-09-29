import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CreditCard, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  MapPin,
  Target
} from 'lucide-react';
import { clearAuthToken, clearAuthUser, getAuthUser } from '../../services/auth';
import { ConferenceOfficialView } from '../../types';
import { useConferenceOfficialView } from '../../hooks/queries';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/conference/official/home', icon: <Home className="w-5 h-5" /> },
  { label: 'Manage Delegates', path: '/conference/official/delegates', icon: <Users className="w-5 h-5" /> },
  { label: 'Payment', path: '/conference/official/payment', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Export Data', path: '/conference/official/export', icon: <FileText className="w-5 h-5" /> },
];

export const ConferenceOfficialLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getAuthUser();
  
  // Use TanStack Query
  const { data: conferenceData, isLoading: loading, refetch } = useConferenceOfficialView();

  const handleLogout = () => {
    clearAuthToken();
    clearAuthUser();
    localStorage.removeItem('user_type');
    navigate('/');
  };

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-gradient-to-b from-orange-600 to-red-600 text-white
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Logo/Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Youth Conference</h1>
              <p className="text-orange-100 text-sm mt-1">Official Portal</p>
            </div>
            <button 
              className="lg:hidden text-white/80 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Conference Info */}
        {conferenceData?.conference && (
          <div className="px-6 py-4 bg-white/10">
            <h3 className="font-semibold text-sm truncate">{conferenceData.conference.title}</h3>
            {conferenceData.district && (
              <div className="flex items-center text-orange-100 text-xs mt-2">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{conferenceData.district} District</span>
              </div>
            )}
            <div className="flex items-center text-orange-100 text-xs mt-1">
              <Target className="w-3 h-3 mr-1" />
              <span>{conferenceData.member_count} / {conferenceData.allowed_count} delegates</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                transition-all duration-200
                ${isActivePath(item.path) 
                  ? 'bg-white text-orange-600 shadow-lg' 
                  : 'text-white/90 hover:bg-white/10'
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
              {isActivePath(item.path) && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-3 bg-white/10 rounded-lg mb-3">
            <p className="font-medium text-sm truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-orange-100 text-xs truncate">{user?.email || user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex-1 lg:flex-none">
              <h2 className="text-lg font-semibold text-gray-800 lg:hidden">Conference Portal</h2>
            </div>

            <div className="flex items-center gap-3">
              {conferenceData?.registration_open ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Registration Open
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Registration Closed
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet context={{ conferenceData, loading, refreshData: () => { void refetch(); } }} />
        </main>
      </div>
    </div>
  );
};


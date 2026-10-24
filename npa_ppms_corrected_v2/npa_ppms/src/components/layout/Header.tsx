import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NpaLogo } from '../common/NpaLogo';
import {
  Bell,
  LogOut,
  Anchor,
  PanelLeftClose,
  PanelLeftOpen,
  Mail,
  ChevronRight
} from 'lucide-react';
import { InAppNotification } from '../../types';
import { NotificationDetailModal } from '../common/NotificationDetailModal';

interface HeaderProps {
  onSelectApplication?: (id: string) => void;
  isSidebarMinimized?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectApplication,
  isSidebarMinimized,
  onToggleSidebar
}) => {
  const {
    currentUser,
    logout,
    ports,
    currentPortId,
    notifications,
    markNotificationRead
  } = useAuth();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<InAppNotification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const assignedPort = ports.find(p => p.id === currentUser?.assignedPortId) ||
                       (currentPortId !== 'ALL' ? ports.find(p => p.id === currentPortId) : null);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between z-30 sticky top-0 shadow-2xs">
      {/* Brand, Crest & Sidebar Toggle */}
      <div className="flex items-center gap-3 sm:gap-5">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-[#087443] hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title={isSidebarMinimized ? 'Expand sidebar navigation' : 'Minimize sidebar navigation'}
            aria-label={isSidebarMinimized ? 'Expand sidebar navigation' : 'Minimize sidebar navigation'}
          >
            {isSidebarMinimized ? (
              <PanelLeftOpen className="w-4 h-4 text-[#087443]" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-600" />
            )}
          </button>
        )}

        <NpaLogo className="h-12 w-auto" />

        {/* Assigned Port Trust Marker */}
        {assignedPort && (
          <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-4 lg:pl-6 text-xs">
            <Anchor className="w-4 h-4 text-[#087443]" />
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Command Port:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              {assignedPort.name} ({assignedPort.code})
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: User Profile, Notifications, Logout */}
      <div className="flex items-center gap-3">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="In-App Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="px-4 py-2.5 bg-[#087443] text-white flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    System Notifications
                  </span>
                  {currentUser?.email && (
                    <div className="text-[10px] text-emerald-100 flex items-center gap-1 mt-0.5">
                      <Mail className="w-2.5 h-2.5" />
                      Dispatched to {currentUser.email}
                    </div>
                  )}
                </div>
                <span className="text-[10px] bg-emerald-900/50 px-2 py-0.5 rounded font-semibold shrink-0">
                  {unreadCount} Unread
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications at this time
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setSelectedNotification(n);
                        setShowDetailModal(true);
                        setShowNotifMenu(false);
                      }}
                      className={`p-3 text-xs cursor-pointer hover:bg-emerald-50/50 transition-colors group relative ${
                        !n.isRead ? 'bg-emerald-50/40 font-medium' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-slate-900 leading-snug group-hover:text-[#087443] transition-colors flex items-center gap-1.5">
                          <span>{n.title}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#087443]" />
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#087443] transition-colors" />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 font-medium bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">
                            <Mail className="w-2.5 h-2.5" />
                            Email sent
                          </span>
                        </span>
                        {n.applicationReference && (
                          <span className="font-mono text-[#087443] font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{n.applicationReference}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <span>Click to view full details & delivery record</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>



        {/* Current User Identity */}
        {currentUser && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#087443] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
              {currentUser.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] font-mono text-[#087443] font-semibold">
                {currentUser.roles[0]?.replace(/_/g, ' ')}
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-300 hover:border-red-300 rounded-lg transition-colors cursor-pointer ml-1"
              title="Sign out of NPA PPMS"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Official Notification Detail Modal */}
      <NotificationDetailModal
        isOpen={showDetailModal}
        notification={selectedNotification}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedNotification(null);
        }}
        onViewApplication={(appId) => {
          if (onSelectApplication) {
            onSelectApplication(appId);
          }
        }}
        recipientEmail={currentUser?.email}
      />
    </header>
  );
};

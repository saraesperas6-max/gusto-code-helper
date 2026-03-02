import React from 'react';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

interface TopbarProps {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  hideSearch?: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ searchPlaceholder = "Search...", onSearch, hideSearch = false }) => {
  const { profile } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const userName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : 'User';

  return (
    <div className="bg-card rounded-lg shadow-sm p-2.5 sm:p-4 mb-4 sm:mb-6 flex items-center justify-between gap-2">
      {/* Search */}
      {!hideSearch && (
        <div className="relative flex-1 max-w-[200px] sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            className="pl-10 bg-muted/50 border-0 h-8 sm:h-9 text-sm"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      )}
      {hideSearch && <div />}

      {/* Right side */}
      <div className="flex items-center gap-1.5 sm:gap-4">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9">
          {theme === 'dark' ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative cursor-pointer">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-foreground transition-colors" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs bg-destructive">
                  {unreadCount}
                </Badge>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 sm:w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-auto p-1" onClick={markAllNotificationsRead}>
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                   <div
                     key={notif.id}
                     className={`flex items-start gap-3 p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                       notif.type === 'approved' ? 'bg-green-500/10 hover:bg-green-500/15' :
                       notif.type === 'denied' ? 'bg-red-500/10 hover:bg-red-500/15' :
                       !notif.read ? 'bg-primary/5' : ''
                     }`}
                     onClick={() => {
                       markNotificationRead(notif.id);
                        if (notif.id.startsWith('resident-')) {
                          const residentId = notif.id.replace('resident-', '');
                          navigate(`/dashboard/residents?highlightResident=${residentId}&openProfile=true`);
                        } else if (notif.requestId) {
                         navigate(`/dashboard/requests?highlight=${notif.requestId}`);
                       }
                     }}
                   >
                     <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                       notif.type === 'pending' ? 'bg-warning' : 
                       notif.type === 'approved' ? 'bg-green-500' : 
                       notif.type === 'denied' ? 'bg-red-500' : 'bg-primary'
                     }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-primary/30 overflow-hidden bg-primary/10 flex items-center justify-center">
            <img 
              src={logo} 
              alt="Barangay Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-medium text-foreground text-xs sm:text-sm hidden md:inline">
            {userName} <span className="text-muted-foreground">(Barangay Official)</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Topbar;

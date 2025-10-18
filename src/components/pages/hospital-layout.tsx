import { useState, useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    Building2,
    Calendar,
    FileText,
    Pill,
    CreditCard,
    Clock,

    Settings,
    Search,
    Bell,
    User,
    Moon,
    Sun,
    Globe,
    ChevronDown,
    Menu,
    X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';

interface HospitalLayoutProps {
    children: React.ReactNode;
    activeModule: string;
    onModuleChange: (module: string) => void;
}

const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'patients', label: 'Bệnh nhân', icon: Users, roles: ['admin'] },
    { id: 'doctors', label: 'Bác sĩ', icon: UserCheck, roles: ['admin', 'pharmacist'] },
    { id: 'departments', label: 'Phòng ban & Giường', icon: Building2, roles: ['admin', 'facility_manager', 'pharmacist'] },
    { id: 'appointments', label: 'Lịch hẹn', icon: Calendar, roles: ['admin'] },
    { id: 'records', label: 'Hồ sơ bệnh án', icon: FileText, roles: ['admin'] },
    { id: 'pharmacy', label: 'Nhà thuốc & Thiết bị', icon: Pill, roles: ['admin', 'pharmacist'] },
    { id: 'payments', label: 'Thanh toán, Bảo hiểm', icon: CreditCard, roles: ['admin', 'cashier'] },
    { id: 'schedules', label: 'Lịch làm việc', icon: Clock, roles: ['admin'] },
    { id: 'settings', label: 'Cài đặt', icon: Settings, roles: ['admin'] },
];

export function HospitalLayout({ children, activeModule, onModuleChange }: HospitalLayoutProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [language, setLanguage] = useState('VN');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const auth = useContext(AuthContext);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
    };

    const toggleLanguage = () => {
        setLanguage(language === 'EN' ? 'VN' : 'EN');
    };

    return (
        <div className="h-screen flex bg-background">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">VM</span>
                            </div>
                            <span className="text-sidebar-foreground font-semibold">Vinmec</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1">
                        {menuItems
                            .filter(item => item.roles.includes(auth?.user?.role || ''))
                            .map((item) => {
                                const Icon = item.icon;
                                const isActive = activeModule === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onModuleChange(item.id);
                                            setSidebarOpen(false);
                                        }}
                                        className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                        ${isActive
                                                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                            }
                      `}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                    </nav>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        {/* Search */}
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm bệnh nhân, bác sĩ, lịch hẹn..."
                                className="pl-10 w-80"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Language Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleLanguage}
                            className="hidden sm:flex items-center space-x-1"
                        >
                            <Globe className="h-4 w-4" />
                            <span>{language}</span>
                        </Button>

                        {/* Dark Mode Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleDarkMode}
                        >
                            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>

                        {/* Notifications */}
                        <Button variant="ghost" size="sm" className="relative">
                            <Bell className="h-4 w-4" />
                            <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                            >
                                3
                            </Badge>
                        </Button>

                        {/* User Profile */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/api/placeholder/32/32" />
                                        <AvatarFallback>
                                            {auth?.user?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden sm:block text-left">
                                        <div className="text-sm">{auth?.user?.full_name || 'Admin User'}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {auth?.user?.role === 'admin' ? 'Quản trị viên' :
                                                auth?.user?.role === 'pharmacist' ? 'Dược sĩ' :
                                                    auth?.user?.role === 'facility_manager' ? 'Quản lý cơ sở' :
                                                        auth?.user?.role === 'cashier' ? 'Thu ngân' : 'Người dùng'}
                                        </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    Hồ sơ cá nhân
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Cài đặt
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => auth?.logout()}>
                                    Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
import { useState } from 'react';
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
    BarChart3,
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'doctors', label: 'Doctors', icon: UserCheck },
    { id: 'departments', label: 'Departments & Rooms', icon: Building2 },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'pharmacy', label: 'Pharmacy & Equipment', icon: Pill },
    { id: 'payments', label: 'Payments & Insurance', icon: CreditCard },
    { id: 'schedules', label: 'Work Schedules', icon: Clock },
    // { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export function HospitalLayout({ children, activeModule, onModuleChange }: HospitalLayoutProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [language, setLanguage] = useState('EN');
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
                                <span className="text-white font-bold">H+</span>
                            </div>
                            <span className="text-sidebar-foreground font-semibold">HealthCare</span>
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
                        {menuItems.map((item) => {
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
                                placeholder="Search patients, doctors, appointments..."
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
                                        <AvatarFallback>AD</AvatarFallback>
                                    </Avatar>
                                    <div className="hidden sm:block text-left">
                                        <div className="text-sm">Dr. Admin</div>
                                        <div className="text-xs text-muted-foreground">Administrator</div>
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    Logout
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
import { useState, useContext } from 'react';
import { AuthContext, AuthProvider } from '@/contexts/auth-context';
import type { Manager } from '@/interfaces/manager';

import { SettingsPage } from './components/pages/settings';
import { Dashboard } from './components/pages/dashboard';
import { Patients } from './components/pages/patients';
import { Doctors } from './components/pages/doctors';
import { Departments } from './components/pages/departments';
import { Appointments } from './components/pages/appointments';
import { MedicalRecords } from './components/pages/medical-records';
import { Pharmacy } from './components/pages/pharmacy';
import { Payments } from './components/pages/payments';
import { Schedules } from './components/pages/schedules';
import { HospitalLayout } from './components/pages/hospital-layout';
import LoginForm from './components/pages/login';

function AppContent() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const auth = useContext(AuthContext);

  const getAccessibleModules = (user: Manager | null) => {
    if (!user) return ['dashboard'];

    const roleModules: Record<string, string[]> = {
      admin: ['dashboard', 'patients', 'doctors', 'departments', 'appointments', 'records', 'pharmacy', 'payments', 'schedules', 'settings'],
      pharmacist: ['pharmacy'],
      facility_manager: ['departments'],
      cashier: ['payments']
    };

    return roleModules[user.role] || ['dashboard'];
  };

  const canAccessModule = (module: string, user: Manager | null) => {
    const accessibleModules = getAccessibleModules(user);
    return accessibleModules.includes(module);
  };

  const renderModule = () => {
    if (!canAccessModule(activeModule, auth?.user || null)) {
      return <div>Bạn không có quyền truy cập trang này.</div>;
    }

    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <Patients />;
      case 'doctors':
        return <Doctors />;
      case 'departments':
        return <Departments />;
      case 'appointments':
        return <Appointments />;
      case 'records':
        return <MedicalRecords />;
      case 'pharmacy':
        return <Pharmacy />;
      case 'payments':
        return <Payments />;
      case 'schedules':
        return <Schedules />;
      // case 'reports':
      //   return <Reports />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  // If not authenticated, show login page without layout
  if (!auth?.isAuthenticated) {
    return <LoginForm />;
  }

  // If authenticated, show main app with layout
  return (
    <HospitalLayout
      activeModule={activeModule}
      onModuleChange={setActiveModule}
    >
      {renderModule()}
    </HospitalLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
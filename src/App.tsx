import { useState } from 'react';

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

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
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

  return (
    <HospitalLayout
      activeModule={activeModule}
      onModuleChange={setActiveModule}
    >
      {renderModule()}
    </HospitalLayout>
  );
}
// src/components/pages/patients.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
// Điều chỉnh đường dẫn component UI dựa trên cấu trúc của bạn
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Calendar, ClipboardCheck, AlertTriangle } from 'lucide-react';

// Đường dẫn tương đối đã sửa (cùng cấp trong thư mục 'pages')
import AlertNotification from './AlertNotification';
// Giả định import supabase
import { supabase } from '@/utils/backend/client';

// --- TYPES & INTERFACES ---
type PatientStatus = 'Active' | 'Inactive';
type PatientGender = 'Male' | 'Female' | 'Other';

interface IPatient {
    id: number;
    full_name: string;
    personal_id: string | null;
    phone: string | null;
    birth_date: string | null;
    gender: PatientGender;
    status: PatientStatus;
    email: string | null;
    address: string | null;
    join_date: string | null;
    password?: string | null;
}
interface IMedicalRecord {
    id: number;
    patient_id: number;
    doctor_id: number;
    diagnosis: string;
    treatment: string;
    record_date: string;
}
interface PatientFormState {
    full_name: string;
    personal_id: string;
    phone: string;
    birth_date: string;
    gender: PatientGender;
    status: PatientStatus;
    email: string;
    address: string;
    password: string;
    join_date: string;
}

interface NotificationState {
    message: string | null;
    type: 'success' | 'error';
}


export function Patients() {
    // Lấy ngày hiện tại ở định dạng YYYY-MM-DD
    const getTodayDate = () => new Date().toISOString().split('T')[0];

    // Khởi tạo form state với các giá trị mặc định
    const initialFormState: PatientFormState = {
        full_name: '', personal_id: '', phone: '', birth_date: '',
        gender: 'Male', status: 'Active', email: '', address: '',
        password: '',
        join_date: getTodayDate(),
    };

    // --- STATES ---
    const [patients, setPatients] = useState<IPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    // Dialog States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    const [currentPatient, setCurrentPatient] = useState<IPatient | null>(null);
    const [formPatient, setFormPatient] = useState<PatientFormState>(initialFormState);
    const [addEditError, setAddEditError] = useState<string | null>(null);

    // Notification State
    const [notification, setNotification] = useState<NotificationState>({ message: null, type: 'success' });
    const [medicalRecords, setMedicalRecords] = useState<IMedicalRecord[]>([]);
    const [recordsLoading, setRecordsLoading] = useState(true);


    // --- HỆ THỐNG THÔNG BÁO ---
    const showNotification = (message: string, type: 'success' | 'error', duration = 4000) => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification({ message: null, type: 'success' });
        }, duration);
    };

    const closeNotification = () => {
        setNotification({ message: null, type: 'success' });
    };


    // --- FETCH DATA ---
    useEffect(() => {
        fetchPatients();
        fetchMedicalRecords();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('patient')
                .select('*');

            if (error) throw error;
            setPatients(data as IPatient[]);
            showNotification('Patient list loaded successfully!', 'success', 2000);
        } catch (error) {
            console.error('Error fetching patients:', error);
            showNotification('Failed to load patient data.', 'error');
        } finally {
            setLoading(false);
        }
    };
    const fetchMedicalRecords = async () => {
        setRecordsLoading(true);
        try {
            const { data, error } = await supabase
                .from('medical_record')
                .select('*')
                .order('record_date', { ascending: false });

            if (error) throw error;
            setMedicalRecords(data as IMedicalRecord[]);
        } catch (error) {
            console.error('Error fetching medical records:', error);
            showNotification('Failed to load medical records.', 'error');
        } finally {
            setRecordsLoading(false);
        }
    };

    // --- FORM & UI HANDLERS ---
    const mapPatientToForm = (patient: IPatient): PatientFormState => ({
        full_name: patient.full_name || '',
        personal_id: patient.personal_id || '',
        phone: patient.phone || '',
        birth_date: patient.birth_date ? patient.birth_date.split('T')[0] : '',
        gender: patient.gender || 'Male',
        status: patient.status || 'Active',
        email: patient.email || '',
        address: patient.address || '',
        password: '',
        join_date: patient.join_date ? patient.join_date.split('T')[0] : getTodayDate(),
    });

    const resetFormState = () => {
        setFormPatient(initialFormState);
        setCurrentPatient(null);
        setAddEditError(null);
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormPatient(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: keyof PatientFormState, value: string) => {
        setFormPatient(prev => ({ ...prev, [id]: value as any }));
    };

    // --- CRUD OPERATIONS ---

    const handleAddPatient = async () => {
        setAddEditError(null);
        if (!formPatient.full_name || !formPatient.personal_id || !formPatient.birth_date || !formPatient.password) {
            setAddEditError("Please fill in all required fields (Full Name, Personal ID, Birth Date, and Password).");
            return;
        }

        const patientDataToInsert = {
            ...formPatient,
            join_date: formPatient.join_date || getTodayDate(),
        };

        try {
            const { data, error } = await supabase
                .from('patient')
                .insert([patientDataToInsert])
                .select('*');
            if (error) throw error;
            const addedPatient = data[0] as IPatient;
            setPatients(prevPatients => [...prevPatients, addedPatient]);
            setIsAddDialogOpen(false);
            resetFormState();
            showNotification(`Patient ${addedPatient.full_name} added successfully!`, 'success');
        } catch (error: any) {
            setAddEditError(`Failed to add patient: ${error.message || 'Unknown error'}`);
            showNotification(`Failed to add patient: ${error.message || 'Unknown error'}`, 'error');
        }
    };

    const openEditDialog = (patient: IPatient) => {
        setCurrentPatient(patient);
        setFormPatient(mapPatientToForm(patient));
        setIsEditDialogOpen(true);
    };

    const handleEditPatient = async () => {
        setAddEditError(null);
        if (!currentPatient) return;
        if (!formPatient.full_name || !formPatient.personal_id || !formPatient.birth_date) {
            setAddEditError("Please fill in all required fields.");
            return;
        }

        const updates: Partial<PatientFormState> = {
            ...formPatient
        };

        if (!updates.password) {
            delete updates.password;
        }

        try {
            const { data, error } = await supabase
                .from('patient')
                .update(updates)
                .eq('id', currentPatient.id)
                .select('*');

            if (error) throw error;

            const updatedPatient = data[0] as IPatient;
            setPatients(prevPatients => prevPatients.map(p => p.id === updatedPatient.id ? updatedPatient : p));
            setIsEditDialogOpen(false);
            resetFormState();
            showNotification(`Patient ${updatedPatient.full_name} updated successfully!`, 'success');
        } catch (error: any) {
            setAddEditError(`Failed to update patient: ${error.message || 'Unknown error'}`);
            showNotification(`Failed to update patient: ${error.message || 'Unknown error'}`, 'error');
        }
    };

    const openDeleteDialog = (patient: IPatient) => {
        setCurrentPatient(patient);
        setIsDeleteDialogOpen(true);
    };

    const handleDeletePatient = async () => {
        if (!currentPatient) return;
        const patientName = currentPatient.full_name;

        try {
            const { error } = await supabase
                .from('patient')
                .delete()
                .eq('id', currentPatient.id);

            if (error) throw error;
            setPatients(prevPatients => prevPatients.filter(p => p.id !== currentPatient.id));
            setIsDeleteDialogOpen(false);
            resetFormState();
            showNotification(`Patient ${patientName} deleted successfully!`, 'success');
        } catch (error: any) {
            console.error('Error deleting patient:', error);
            showNotification(`Failed to delete patient: ${error.message || 'Unknown error'}`, 'error');
        }
    };

    // EXPORT
    const handleExport = () => {
        if (filteredPatients.length === 0) {
            showNotification('No data to export.', 'error');
            return;
        }

        const header = ['ID', 'Full Name', 'Personal ID', 'Birth Date', 'Gender', 'Phone', 'Email', 'Address', 'Status', 'Join Date'];
        const csvContent = filteredPatients.map((p: IPatient) => [
            p.id, `"${p.full_name}"`, `"${p.personal_id || ''}"`,
            p.birth_date ? new Date(p.birth_date).toLocaleDateString('en-CA') : '',
            p.gender, `"${p.phone || ''}"`, `"${p.email || ''}"`,
            `"${p.address || ''}"`, p.status,
            p.join_date ? new Date(p.join_date).toLocaleDateString('en-CA') : '',
        ].join(',')).join('\n');
        const csv = [header.join(','), csvContent].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `patients_export_${getTodayDate()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`Exported ${filteredPatients.length} records successfully!`, 'success');
    };

    // VIEW DETAILS (SHOW/HIDE)
    const openViewDialog = (patient: IPatient) => {
        setCurrentPatient(patient);
        setIsViewDialogOpen(true);
    };

    const renderPatientDetails = (patient: IPatient) => {
        if (!patient) return null;

        const details = [
            { label: 'Full Name', value: patient.full_name },
            { label: 'Personal ID', value: patient.personal_id || 'N/A' },
            { label: 'Email', value: patient.email || 'N/A' },
            { label: 'Phone', value: patient.phone || 'N/A' },
            { label: 'Gender', value: patient.gender },
            { label: 'Status', value: patient.status },
            {
                label: 'Birth Date',
                value: patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('vi-VN') : 'N/A',
                icon: <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
            },
            {
                label: 'Join Date',
                value: patient.join_date ? new Date(patient.join_date).toLocaleDateString('vi-VN') : 'N/A',
                icon: <ClipboardCheck className="h-4 w-4 text-muted-foreground mr-2" />
            },
            { label: 'Address', value: patient.address || 'N/A' },
        ];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
                {details.map((item, index) => (
                    <div key={index} className="space-y-1">
                        <Label className="text-muted-foreground font-semibold">{item.label}</Label>
                        <div className="flex items-center text-base">
                            {item.icon}
                            <p>{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // --- FILTER & DISPLAY LOGIC (Đã sửa lỗi Vị trí và Implicit 'any') ---

    const getStatusBadge = (status: PatientStatus) => {
        const variant = status === 'Active' ? 'default' : 'secondary';
        return <Badge variant={variant}>{status}</Badge>;
    };

    const getGenderBadge = (gender: PatientGender) => {
        const variant = gender === 'Male' ? 'outline' :
            gender === 'Female' ? 'secondary' : 'default';
        return <Badge variant={variant}>{gender}</Badge>;
    };

    const filteredPatients = patients.filter((patient: IPatient) => {
        if (!patient || typeof patient !== 'object') return false;
        const searchFields = [patient.full_name, patient.personal_id, patient.email, patient.phone].filter((val): val is string => !!val).join(' ').toLowerCase();
        const matchesSearch = searchFields.includes(searchTerm.toLowerCase());
        const matchesGender = genderFilter === 'All' || patient.gender === genderFilter;
        const matchesStatus = statusFilter === 'All' || patient.status === statusFilter;
        return matchesSearch && matchesGender && matchesStatus;
    });

    // --- RENDER FORM FIELDS (Đảm bảo có đủ 6 hàng dữ liệu) ---

    const renderPatientFormFields = (data: PatientFormState, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onSelectChange: (id: keyof PatientFormState, value: string) => void) => (
        <div className="grid grid-cols-2 gap-4 py-4">
            {/* Hàng 1: Name, ID */}
            <div className="space-y-2"><Label htmlFor="full_name">Full Name *</Label><Input id="full_name" placeholder="Patient Name" value={data.full_name} onChange={onChange} /></div>
            <div className="space-y-2"><Label htmlFor="personal_id">Personal ID *</Label><Input id="personal_id" placeholder="e.g. 123456789" value={data.personal_id} onChange={onChange} /></div>

            {/* Hàng 2: Birth Date, Gender */}
            <div className="space-y-2"><Label htmlFor="birth_date">Birth Date *</Label><Input id="birth_date" type="date" value={data.birth_date} onChange={onChange} /></div>
            <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={data.gender} onValueChange={(val) => onSelectChange('gender', val)}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Hàng 3: Phone, Email */}
            <div className="space-y-2"><Label htmlFor="phone">Phone Number</Label><Input id="phone" placeholder="Enter phone number" value={data.phone} onChange={onChange} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="Enter email address" value={data.email} onChange={onChange} /></div>

            {/* Hàng 4: Password, Join Date (Hai trường mới) */}
            <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type="password"
                        placeholder="Set user password"
                        value={data.password}
                        onChange={onChange}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="join_date">Join Date</Label>
                <Input id="join_date" type="date" value={data.join_date} onChange={onChange} />
            </div>

            {/* Hàng 5: Address */}
            <div className="space-y-2 col-span-2"><Label htmlFor="address">Address</Label><Input id="address" placeholder="123 Main St" value={data.address} onChange={onChange} /></div>

            {/* Hàng 6: Status */}
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={data.status} onValueChange={(val) => onSelectChange('status', val as PatientStatus)}>
                    <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    // --- RENDER ---
    if (loading) {
        return <div className="text-center py-10 text-xl font-medium">Loading patient data...</div>;
    }

    return (
        <div className="space-y-6">

            {/* CUSTOM ALERT NOTIFICATION */}
            <AlertNotification
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
            />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Patient Management</h1>
                    <p className="text-muted-foreground">Manage patient profiles and health records</p>
                </div>
                {/* ADD PATIENT DIALOG TRIGGER */}
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) resetFormState();
                }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" />Add Patient</Button>
                    </DialogTrigger>
                    {/* ĐÃ CHỈNH SỬA: Đảm bảo cuộn dọc hoạt động để hiển thị 6 hàng form */}
                    <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-scroll">
                        <DialogHeader><DialogTitle>Add New Patient</DialogTitle></DialogHeader>
                        {renderPatientFormFields(formPatient, handleFormChange, handleSelectChange)}
                        {addEditError && (<p className="text-red-500 text-sm mt-2">{addEditError}</p>)}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddPatient}>Add Patient</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="patients" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="patients">Patients ({patients.length})</TabsTrigger>
                    <TabsTrigger value="records">Health Records</TabsTrigger>
                </TabsList>
                <TabsContent value="patients">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                                <CardTitle>All Patients ({filteredPatients.length})</CardTitle>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by Name, ID, Phone..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 w-64"
                                        />
                                    </div>
                                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                                        <SelectTrigger className="w-40"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Gender" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Genders</SelectItem>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Status</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" onClick={handleExport}>
                                        <Download className="mr-2 h-4 w-4" />Export
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>ID Cá nhân</TableHead>
                                            <TableHead>Ngày sinh</TableHead>
                                            <TableHead>Giới tính</TableHead>
                                            <TableHead>Phone/Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPatients.map((patient) => (
                                            <TableRow key={patient.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar><AvatarFallback>{patient.full_name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{patient.full_name}</span>
                                                            <span className="text-sm text-muted-foreground">{patient.address}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{patient.personal_id || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Calendar className="inline h-4 w-4 mr-1 text-muted-foreground" />
                                                    {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('vi-VN') : 'N/A'}
                                                </TableCell>
                                                <TableCell>{getGenderBadge(patient.gender)}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">{patient.phone || 'N/A'}</span>
                                                        <span className="text-xs text-muted-foreground">{patient.email || 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(patient.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-1">
                                                        <Button variant="ghost" size="sm" title="View Details" onClick={() => openViewDialog(patient)}><Eye className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="sm" title="Edit" onClick={() => openEditDialog(patient)}><Edit className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="sm" title="Delete" onClick={() => openDeleteDialog(patient)}><Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredPatients.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">No patients found matching your criteria.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="records">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <ClipboardCheck className="mr-2 h-5 w-5" />
                                Patient Health Records ({medicalRecords.length})
                            </CardTitle>
                            <p className="text-muted-foreground text-sm">
                                Overview of all diagnosis and treatments recorded by doctors.
                            </p>
                        </CardHeader>

                        <CardContent>
                            {recordsLoading ? (
                                <div className="text-center py-6 text-muted-foreground">Loading medical records...</div>
                            ) : medicalRecords.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">No medical records found.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Patient ID</TableHead>
                                                <TableHead>Doctor ID</TableHead>
                                                <TableHead>Diagnosis</TableHead>
                                                <TableHead>Treatment</TableHead>
                                                <TableHead>Record Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {medicalRecords.map((record) => (
                                                <TableRow key={record.id}>
                                                    <TableCell className="font-medium">{record.id}</TableCell>
                                                    <TableCell>{record.patient_id}</TableCell>
                                                    <TableCell>{record.doctor_id}</TableCell>
                                                    <TableCell className="max-w-[250px] truncate" title={record.diagnosis}>
                                                        {record.diagnosis || 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="max-w-[250px] truncate" title={record.treatment}>
                                                        {record.treatment || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {record.record_date
                                                            ? new Date(record.record_date).toLocaleString('vi-VN')
                                                            : 'N/A'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* --- DIALOG XEM CHI TIẾT BỆNH NHÂN (SHOW/HIDE) --- */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                            Patient Details: {currentPatient?.full_name}
                        </DialogTitle>
                        <DialogDescription>
                            Detailed information for patient ID: **{currentPatient?.personal_id}**
                        </DialogDescription>
                    </DialogHeader>
                    {currentPatient && renderPatientDetails(currentPatient)}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- EDIT PATIENT DIALOG --- */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) resetFormState();
            }}>
                <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Edit Patient: {currentPatient?.full_name}</DialogTitle></DialogHeader>
                    {currentPatient && renderPatientFormFields(formPatient, handleFormChange, handleSelectChange)}
                    {addEditError && (<p className="text-red-500 text-sm mt-2">{addEditError}</p>)}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditPatient}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- DELETE CONFIRMATION DIALOG --- */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
                setIsDeleteDialogOpen(open);
                if (!open) resetFormState();
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-red-600"><AlertTriangle className="h-5 w-5 mr-2" /> Confirm Deletion</DialogTitle>
                        <DialogDescription>Are you sure you want to delete patient **{currentPatient?.full_name}** (ID: {currentPatient?.personal_id})? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeletePatient}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
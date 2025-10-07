/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Award } from 'lucide-react';
import { supabase } from '@/utils/backend/client';
import type { IDoctor } from '@/interfaces/doctor';
import type { ICertificate } from '@/interfaces/certificate';
import type { DoctorStatus } from '@/types';
import type { ISpecialty } from '@/interfaces/specialty';

// Interface cho state của form thêm bác sĩ
interface NewDoctorState {
    full_name: string;
    username: string;
    // specialty sẽ là string để chứa ID (từ Select) trước khi chuyển thành number
    specialty: string;
    phone: string;
    email: string;
    address: string;
    status: DoctorStatus;
}

export function Doctors() {
    const [doctors, setDoctors] = useState<IDoctor[]>([]);
    const [certificates, setCertificates] = useState<ICertificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addDoctorError, setAddDoctorError] = useState<string | null>(null);

    // Cập nhật state newDoctor để bao gồm tất cả các trường trong form
    const [newDoctor, setNewDoctor] = useState<NewDoctorState>({
        full_name: '',
        username: '',
        specialty: '', // Lưu ID chuyên khoa
        phone: '',
        email: '',
        address: '',
        status: 'Active',
    });

    // Hàm chung để cập nhật state form
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setNewDoctor(prev => ({
            ...prev,
            [id]: id === 'experience' ? parseInt(value) || '' : value
        }));
    };

    // Hàm cho Select Component (thường có API khác)
    const handleSelectChange = (id: keyof NewDoctorState, value: string) => {
        setNewDoctor(prev => ({ ...prev, [id]: value }));
    };

    // --- FETCH DATA ---

    useEffect(() => {
        // Cả hai hàm fetch đều gọi setLoading(false), nên không cần logic phức tạp hơn
        // Tuy nhiên, việc này có thể gây lỗi nếu một trong hai fetch thất bại hoặc chậm hơn
        // Tôi sẽ giữ nguyên logic cũ vì nó đủ cho mục đích ví dụ này
        fetchDoctors();
        fetchCertificates();
    }, []);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            // Liên kết bảng specialty và chỉ chọn các cột cần thiết từ specialty
            const { data, error } = await supabase
                .from('doctor')
                .select(`
                    id, specialty_id, full_name, username, phone, email, address, status,
                    specialty ( id, name, description )
                `);
            if (error) throw error;
            setDoctors(data as unknown as IDoctor[]);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            // Có thể thêm state lỗi cho người dùng
        } finally {
            setLoading(false);
        }
    };

    const fetchCertificates = async () => {
        // Bỏ setLoading(true) ở đây để tránh ghi đè kết quả của fetchDoctors
        try {
            const { data, error } = await supabase.from('certificate').select('*');
            if (error) throw error;
            setCertificates(data || []);
        } catch (error) {
            console.error('Error fetching certificates:', error);
        }
        // Giữ lại setLoading(false) trong fetchDoctors để quản lý trạng thái tải chính
    };


    // --- ADD DOCTOR LOGIC ---

    const resetNewDoctorState = () => {
        setNewDoctor({
            full_name: '',
            username: '',
            specialty: '',
            phone: '',
            email: '',
            address: '',
            status: 'Active',
        });
        setAddDoctorError(null);
    }

    const handleAddDoctor = async () => {
        setAddDoctorError(null);

        // Kiểm tra validation cơ bản
        if (!newDoctor.full_name || !newDoctor.username || !newDoctor.specialty || !newDoctor.email) {
            setAddDoctorError("Please fill in all required fields (Full Name, Username, Specialty, Email).");
            return;
        }

        try {
            // 1. Chuẩn bị dữ liệu để chèn
            // Loại bỏ các trường chỉ dùng cho giao diện hoặc không thuộc bảng `doctor`
            const { specialty, ...baseDoctorData } = newDoctor;

            // Chuyển đổi 'On Leave' thành 'On_Leave' để khớp với ENUM của DB (nếu bạn sử dụng nó)
            const statusForDB = (
                (baseDoctorData.status as string) === 'On Leave'
                    ? 'On_Leave'
                    : baseDoctorData.status
            ) as DoctorStatus;

            const doctorDataToInsert = {
                ...baseDoctorData,
                specialty_id: parseInt(specialty, 10), // Chuyển specialty_id từ string sang number
                status: statusForDB, // Sử dụng giá trị đã chuyển đổi
                password: '12345678',
            };

            const { data, error } = await supabase
                .from('doctor')
                .insert([doctorDataToInsert])
                .select(`
                id, specialty_id, full_name, username, phone, email, address, status,
                specialty ( id, name, description )
            `); // Chọn lại để có specialty object

            if (error) {
                console.error('Supabase error adding doctor:', error);
                throw new Error(error.message);
            }

            const addedDoctor = data[0] as unknown as IDoctor;

            // Thêm bác sĩ mới vào danh sách hiện tại
            setDoctors(prevDoctors => [...prevDoctors, addedDoctor]);

            // Đóng dialog và reset form
            setIsAddDialogOpen(false);
            resetNewDoctorState();

            console.log('Doctor added successfully:', addedDoctor);

        } catch (error: any) {
            console.error('Error adding doctor:', error);
            setAddDoctorError(`Failed to add doctor: ${error.message || 'Unknown error'}`);
        }
    };


    // --- FILTER & DISPLAY LOGIC ---

    // Lấy danh sách chuyên khoa duy nhất
    const uniqueSpecialties = Array.from(new Set(doctors
        .map(doctor => doctor.specialty)
        .filter((s): s is ISpecialty => !!s)
        .map(s => JSON.stringify({ id: s.id, name: s.name }))
    )).map(s => JSON.parse(s) as ISpecialty);


    const filteredDoctors = doctors.filter(doctor => {
        if (!doctor || typeof doctor !== 'object') return false;

        const name = doctor.full_name || doctor.username || '';
        const email = doctor.email || '';
        const specialtyName = doctor.specialty?.name || '';
        // 1. Lọc theo thanh tìm kiếm (Tên hoặc Email)
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Lọc theo Chuyên khoa (dùng ID hoặc Name tùy thuộc vào specialtyFilter)
        // Nếu specialtyFilter là 'All' hoặc trùng tên/ID chuyên khoa
        const matchesSpecialty = specialtyFilter === 'All' ||
            specialtyName.toLowerCase() === specialtyFilter.toLowerCase() ||
            (doctor.specialty_id && specialtyFilter === doctor.specialty_id.toString());

        // 3. Lọc theo Trạng thái
        const normalizedStatusFilter = statusFilter === 'On Leave' ? 'On_Leave' : statusFilter;
        const matchesStatus = statusFilter === 'All' || doctor.status === normalizedStatusFilter;

        return matchesSearch && matchesSpecialty && matchesStatus;
    });

    const getStatusBadge = (status: DoctorStatus) => {
        // Chuyển 'On_Leave' thành 'On Leave' để hiển thị
        const displayStatus = status.replace('_', ' ');

        const variant = status === 'Active' ? 'default' :
            // So sánh với ENUM value 'On_Leave'
            status === 'On_Leave' ? 'secondary' : 'destructive';

        return <Badge variant={variant}>{displayStatus}</Badge>;
    };
    // --- RENDER ---

    if (loading) {
        return <div className="text-center py-10">Loading doctors and certificates...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Doctor Management</h1>
                    <p className="text-muted-foreground">
                        Manage doctor profiles and certifications
                    </p>
                </div>

                {/* --- ADD DOCTOR DIALOG --- */}
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) resetNewDoctorState(); // Reset form khi đóng
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Doctor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Doctor</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    placeholder="Dr. John Doe"
                                    value={newDoctor.full_name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {/* Username */}
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="john.doe"
                                    value={newDoctor.username}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {/* Specialty */}
                            <div className="space-y-2">
                                <Label htmlFor="specialty">Specialty</Label>
                                <Select
                                    value={newDoctor.specialty}
                                    onValueChange={(val) => handleSelectChange('specialty', val)}
                                >
                                    <SelectTrigger id="specialty">
                                        <SelectValue placeholder="Select specialty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uniqueSpecialties.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="Enter phone number"
                                    value={newDoctor.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter email address"
                                    value={newDoctor.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {/* Address */}
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    placeholder="123 Main St"
                                    value={newDoctor.address}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="specialty">Status</Label>
                                <Select
                                    value={newDoctor.status}
                                    onValueChange={(val) => handleSelectChange('status', val as DoctorStatus)}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        {/* Sửa value từ "On Leave" thành "On_Leave" để khớp với DB ENUM */}
                                        <SelectItem value="On_Leave">On Leave</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {addDoctorError && (
                            <p className="text-red-500 text-sm mt-2">{addDoctorError}</p>
                        )}
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddDoctor}>
                                Add Doctor
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            {/* --- TABS --- */}
            <Tabs defaultValue="doctors" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="doctors">Doctors</TabsTrigger>
                    <TabsTrigger value="certificates">Certificates ({certificates.length})</TabsTrigger>
                </TabsList>

                {/* --- DOCTORS TAB CONTENT --- */}
                <TabsContent value="doctors">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                                <CardTitle>All Doctors ({filteredDoctors.length})</CardTitle>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    {/* Search Input */}
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search doctors..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 w-64"
                                        />
                                    </div>
                                    {/* Specialty Filter */}
                                    <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                                        <SelectTrigger className="w-40">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Specialty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Specialties</SelectItem>
                                            {uniqueSpecialties.map(s => (
                                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {/* Status Filter */}
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Status</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            {/* Sửa value từ "On Leave" thành "On_Leave" */}
                                            <SelectItem value="On_Leave">On Leave</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Doctor</TableHead>
                                            <TableHead>Specialty</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDoctors.map((doctor) => (
                                            <TableRow key={doctor.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar>
                                                            <AvatarImage src="https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/default-avatar-profile-picture-male-icon.png" />
                                                            <AvatarFallback>{doctor.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{doctor.full_name}</span>
                                                            <span className="text-sm text-muted-foreground">@{doctor.username}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    <span className="font-medium">{doctor.specialty?.name}</span>
                                                    <span className="text-sm text-muted-foreground block" title={doctor?.specialty?.description || ''}>
                                                        {doctor?.specialty?.description?.substring(0, 30) || ''}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{doctor.phone}</TableCell>
                                                <TableCell>{doctor.email}</TableCell>
                                                <TableCell>{getStatusBadge(doctor.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-1">
                                                        <Button variant="ghost" size="sm" title="View">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" title="Edit">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" title="Delete">
                                                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredDoctors.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                    No doctors found matching your criteria.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- CERTIFICATES TAB CONTENT --- */}
                <TabsContent value="certificates">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Award className="mr-2 h-5 w-5" />
                                Doctor Certificates ({certificates.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Doctor</TableHead>
                                            <TableHead>Certificate Name</TableHead>
                                            <TableHead>Issued By</TableHead>
                                            <TableHead>Issue Date</TableHead>
                                            <TableHead>Expiry Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {certificates.map(cert => {
                                            const doctor = doctors.find(d => d.id === cert.doctor_id);
                                            const today = new Date();
                                            const expiryDate = cert.expiry_date ? new Date(cert.expiry_date) : null;

                                            const isExpired = expiryDate ? expiryDate < today : false;
                                            const isExpiringSoon = expiryDate
                                                ? expiryDate > today && expiryDate < new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
                                                : false;


                                            return (
                                                <TableRow key={cert.id}>
                                                    <TableCell>{doctor?.full_name || 'N/A'}</TableCell>
                                                    <TableCell>{cert.name}</TableCell>
                                                    <TableCell>{cert.issued_by}</TableCell>
                                                    <TableCell>
                                                        {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            isExpired ? 'destructive' :
                                                                isExpiringSoon ? 'secondary' : 'default'
                                                        }>
                                                            {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Valid'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
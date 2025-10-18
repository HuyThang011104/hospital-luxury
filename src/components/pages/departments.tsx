/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, Edit, Trash2, Building2, Bed, Search } from 'lucide-react';
import { supabase } from '@/utils/backend/client';

// --- GIAO DIỆN (INTERFACES) ---
interface IDepartment {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
}

type RoomType = 'Normal' | 'ICU' | 'Operating' | 'Emergency';
interface IRoom {
    id: number;
    name: string;
    type: RoomType;
    floor: string | null;
    department_id: number;
    department: Pick<IDepartment, 'id' | 'name'>;
}

type BedStatus = 'Occupied' | 'Available' | 'Maintenance';
interface IBed {
    id: number;
    bed_number: string;
    status: BedStatus;
    room_id: number;
    patient: { name: string } | null;
    room: { name: string; department: { name: string } };
}

// --- TRẠNG THÁI KHỞI TẠO CHO FORM ---
const initialNewDepartmentState = { name: '', description: '', location: '' };
const initialEditDepartmentState = { id: 0, name: '', description: '', location: '' };
const initialNewRoomState = { name: '', type: 'Normal' as RoomType, floor: '', department_id: 0 };
const initialEditRoomState = { id: 0, name: '', type: 'Normal' as RoomType, floor: '', department_id: 0 };
const initialNewBedState = { bed_number: '', status: 'Available' as BedStatus, room_id: 0, patient_name: '' };
const initialEditBedState = { id: 0, bed_number: '', status: 'Available' as BedStatus, room_id: 0, patient_name: '' };

// --- GIỚI HẠN SỐ GIƯỜNG THEO LOẠI PHÒNG (THỰC TẾ) ---
const maxBedsPerRoomType: Record<RoomType, number> = {
    Normal: 4,
    ICU: 2,
    Operating: 1,
    Emergency: 3,
};

export function Departments() {
    // --- QUẢN LÝ STATE ---
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<IDepartment[]>([]);
    const [rooms, setRooms] = useState<IRoom[]>([]);
    const [beds, setBeds] = useState<IBed[]>([]);

    const [isAddDeptDialogOpen, setIsAddDeptDialogOpen] = useState(false);
    const [isEditDeptDialogOpen, setIsEditDeptDialogOpen] = useState(false);
    const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
    const [isEditRoomDialogOpen, setIsEditRoomDialogOpen] = useState(false);
    const [isAddBedDialogOpen, setIsAddBedDialogOpen] = useState(false);
    const [isEditBedDialogOpen, setIsEditBedDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [newDepartment, setNewDepartment] = useState(initialNewDepartmentState);
    const [editDepartment, setEditDepartment] = useState(initialEditDepartmentState);
    const [newRoom, setNewRoom] = useState(initialNewRoomState);
    const [editRoom, setEditRoom] = useState(initialEditRoomState);
    const [newBed, setNewBed] = useState(initialNewBedState);
    const [editBed, setEditBed] = useState(initialEditBedState);

    const [itemToDelete, setItemToDelete] = useState<{ type: 'department' | 'room' | 'bed'; id: number } | null>(null);

    const [roomSearchTerm, setRoomSearchTerm] = useState('');
    const [bedSearchTerm, setBedSearchTerm] = useState('');

    // --- LẤY DỮ LIỆU ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([fetchDepartments(), fetchRooms(), fetchBeds()]);
            } catch (error: any) {
                console.error("Lỗi khi tải dữ liệu ban đầu:", error);
                alert('Lỗi khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const fetchDepartments = async () => {
        const { data, error } = await supabase.from('department').select('*');
        if (error) throw error;
        setDepartments(data || []);
    };

    const fetchRooms = async () => {
        const { data, error } = await supabase.from('room').select('*, department (id, name)');
        if (error) throw error;
        setRooms(data as any || []);
    };

    const fetchBeds = async () => {
        const { data, error } = await supabase.from('bed').select('*, room ( name, department ( name ) )');
        if (error) throw error;
        setBeds(data as any || []);
    };

    // --- XỬ LÝ THÊM / SỬA / XÓA ---
    const handleAddDepartment = async () => {
        if (!newDepartment.name) return alert('Tên khoa là bắt buộc.');
        const { data, error } = await supabase.from('department').insert([newDepartment]).select().single();
        if (error) alert(error.message);
        else if (data) {
            setDepartments(prev => [...prev, data]);
            setNewDepartment(initialNewDepartmentState);
            setIsAddDeptDialogOpen(false);
            alert('Thêm khoa thành công');
        }
    };

    const handleEditDepartment = async () => {
        if (!editDepartment.name) return alert('Tên khoa là bắt buộc.');
        const { data, error } = await supabase
            .from('department')
            .update(editDepartment)
            .eq('id', editDepartment.id)
            .select()
            .single();
        if (error) alert(error.message);
        else if (data) {
            setDepartments(prev => prev.map(item => item.id === data.id ? data : item));
            setIsEditDeptDialogOpen(false);
            alert('Cập nhật khoa thành công');
        }
    };

    const handleAddRoom = async () => {
        if (!newRoom.name || !newRoom.department_id) return alert('Tên phòng và khoa là bắt buộc.');
        const { data, error } = await supabase
            .from('room')
            .insert([{ name: newRoom.name, type: newRoom.type, floor: newRoom.floor, department_id: newRoom.department_id }])
            .select('*, department (id, name)')
            .single();
        if (error) alert(error.message);
        else if (data) {
            setRooms(prev => [...prev, data as any]);
            setNewRoom(initialNewRoomState);
            setIsAddRoomDialogOpen(false);
            alert('Thêm phòng thành công');
        }
    };

    const handleEditRoom = async () => {
        if (!editRoom.name || !editRoom.department_id) return alert('Tên phòng và khoa là bắt buộc.');
        const { data, error } = await supabase
            .from('room')
            .update({ name: editRoom.name, type: editRoom.type, floor: editRoom.floor, department_id: editRoom.department_id })
            .eq('id', editRoom.id)
            .select('*, department (id, name)')
            .single();
        if (error) alert(error.message);
        else if (data) {
            setRooms(prev => prev.map(item => item.id === data.id ? data as any : item));
            setIsEditRoomDialogOpen(false);
            alert('Cập nhật phòng thành công');
        }
    };

    const handleAddBed = async () => {
        if (!newBed.bed_number || !newBed.room_id) return alert('Số giường và phòng là bắt buộc.');
        if (newBed.status === 'Occupied' && !newBed.patient_name) return alert('Tên bệnh nhân là bắt buộc khi giường được chiếm.');

        // Kiểm tra số lượng giường trong phòng
        const room = rooms.find(r => r.id === newBed.room_id);
        if (!room) return alert('Phòng không tồn tại.');
        const bedCount = beds.filter(b => b.room_id === newBed.room_id).length;
        if (bedCount >= maxBedsPerRoomType[room.type]) return alert(`Phòng ${room.name} đã đạt giới hạn ${maxBedsPerRoomType[room.type]} giường.`);

        // Kiểm tra trùng số giường
        const existingBed = beds.find(b => b.room_id === newBed.room_id && b.bed_number === newBed.bed_number);
        if (existingBed) return alert(`Số giường ${newBed.bed_number} đã tồn tại trong phòng này.`);

        const { data, error } = await supabase
            .from('bed')
            .insert([{ bed_number: newBed.bed_number, status: newBed.status, room_id: newBed.room_id }])
            .select('*, room ( name, department ( name ) )')
            .single();
        if (error) alert(error.message);
        else if (data) {
            setBeds(prev => [...prev, { ...data, patient: newBed.status === 'Occupied' ? { name: newBed.patient_name } : null } as any]);
            setNewBed(initialNewBedState);
            setIsAddBedDialogOpen(false);
            alert('Thêm giường thành công');
        }
    };

    const handleEditBed = async () => {
        if (!editBed.bed_number || !editBed.room_id) return alert('Số giường và phòng là bắt buộc.');
        if (editBed.status === 'Occupied' && !editBed.patient_name) return alert('Tên bệnh nhân là bắt buộc khi giường được chiếm.');

        // Kiểm tra trùng số giường (ngoại trừ giường đang sửa)
        const existingBed = beds.find(b => b.room_id === editBed.room_id && b.bed_number === editBed.bed_number && b.id !== editBed.id);
        if (existingBed) return alert(`Số giường ${editBed.bed_number} đã tồn tại trong phòng này.`);

        const { data, error } = await supabase
            .from('bed')
            .update({ bed_number: editBed.bed_number, status: editBed.status, room_id: editBed.room_id })
            .eq('id', editBed.id)
            .select('*, room ( name, department ( name ) )')
            .single();
        if (error) alert(error.message);
        else if (data) {
            setBeds(prev => prev.map(item => item.id === data.id ? { ...data, patient: editBed.status === 'Occupied' ? { name: editBed.patient_name } : null } as any : item));
            setIsEditBedDialogOpen(false);
            alert('Cập nhật giường thành công');
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const { type, id } = itemToDelete;
        try {
            if (type === 'department') {
                // Kiểm tra xem khoa có phòng không
                const roomCount = rooms.filter(r => r.department_id === id).length;
                if (roomCount > 0) throw new Error('Không thể xóa khoa vì còn phòng liên kết.');
            } else if (type === 'room') {
                // Kiểm tra xem phòng có giường hoặc lịch bác sĩ không
                const bedCount = beds.filter(b => b.room_id === id).length;
                if (bedCount > 0) throw new Error('Không thể xóa phòng vì còn giường liên kết.');
                const { error: scheduleError } = await supabase.from('doctor_work_schedule').delete().eq('room_id', id);
                if (scheduleError) throw scheduleError;
            }
            const { error } = await supabase.from(type).delete().eq('id', id);
            if (error) throw error;

            if (type === 'department') setDepartments(prev => prev.filter(item => item.id !== id));
            else if (type === 'room') setRooms(prev => prev.filter(item => item.id !== id));
            else if (type === 'bed') setBeds(prev => prev.filter(item => item.id !== id));
            alert('Xóa thành công');
        } catch (error: any) {
            alert(error.message);
        }
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    // --- XỬ LÝ INPUT FORM ---
    const handleDepartmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNewDepartment(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleEditDepartmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditDepartment(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleRoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setNewRoom(prev => ({ ...prev, [id]: value }));
    };

    const handleRoomSelectChange = (id: 'type' | 'department_id' | 'floor', value: string | number) => {
        setNewRoom(prev => ({ ...prev, [id]: value }));
    };

    const handleEditRoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setEditRoom(prev => ({ ...prev, [id]: value }));
    };

    const handleEditRoomSelectChange = (id: 'type' | 'department_id' | 'floor', value: string | number) => {
        setEditRoom(prev => ({ ...prev, [id]: value }));
    };

    const handleBedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setNewBed(prev => ({ ...prev, [id]: value }));
    };

    const handleBedSelectChange = (id: 'status' | 'room_id', value: string | number) => {
        setNewBed(prev => ({ ...prev, [id]: value }));
    };

    const handleEditBedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setEditBed(prev => ({ ...prev, [id]: value }));
    };

    const handleEditBedSelectChange = (id: 'status' | 'room_id', value: string | number) => {
        setEditBed(prev => ({ ...prev, [id]: value }));
    };

    // --- MỞ DIALOG SỬA ---
    const openEditDepartmentDialog = (dept: IDepartment) => {
        setEditDepartment({
            id: dept.id,
            name: dept.name,
            description: dept.description || '',
            location: dept.location || '',
        });
        setIsEditDeptDialogOpen(true);
    };

    const openEditRoomDialog = (room: IRoom) => {
        setEditRoom({
            id: room.id,
            name: room.name,
            type: room.type,
            floor: room.floor || '',
            department_id: room.department_id,
        });
        setIsEditRoomDialogOpen(true);
    };

    const openEditBedDialog = (bed: IBed) => {
        setEditBed({
            id: bed.id,
            bed_number: bed.bed_number,
            status: bed.status,
            room_id: bed.room_id,
            patient_name: bed.patient?.name || '',
        });
        setIsEditBedDialogOpen(true);
    };

    const openDeleteDialog = (type: 'department' | 'room' | 'bed', id: number) => {
        setItemToDelete({ type, id });
        setIsDeleteDialogOpen(true);
    };
    // --- DỮ LIỆU ĐÃ LỌC ---
    const filteredRooms = useMemo(() =>
        rooms.filter(room =>
            room.name.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
            room.department.name.toLowerCase().includes(roomSearchTerm.toLowerCase())
        ), [rooms, roomSearchTerm]);

    const filteredBeds = useMemo(() =>
        beds.filter(bed =>
            bed.bed_number.toLowerCase().includes(bedSearchTerm.toLowerCase()) ||
            (bed.patient?.name && bed.patient.name.toLowerCase().includes(bedSearchTerm.toLowerCase())) ||
            bed.room.name.toLowerCase().includes(bedSearchTerm.toLowerCase())
        ), [beds, bedSearchTerm]);

    // --- TÍNH TOÁN TRẠNG THÁI PHÒNG ---
    const getRoomStatus = (roomId: number) => {
        const roomBeds = beds.filter(b => b.room_id === roomId);
        const totalBeds = roomBeds.length;
        const occupiedBeds = roomBeds.filter(b => b.status === 'Occupied').length;
        return `${occupiedBeds}/${totalBeds} giường đã chiếm`;
    };

    // --- HÀM PHỤ ---
    const getBedStatusColor = (status: BedStatus) => {
        switch (status) {
            case 'Occupied': return 'destructive';
            case 'Available': return 'default';
            case 'Maintenance': return 'secondary';
            default: return 'default';
        }
    };

    // --- HIỂN THỊ ---
    if (loading) {
        return <div className="flex justify-center items-center h-64">Đang tải dữ liệu bệnh viện...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Khoa & Phòng</h1>
                    <p className="text-muted-foreground">Quản lý các khoa, phòng và giường bệnh trong bệnh viện</p>
                </div>
            </div>

            <Tabs defaultValue="departments" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="departments">Khoa</TabsTrigger>
                    <TabsTrigger value="rooms">Phòng</TabsTrigger>
                    <TabsTrigger value="beds">Giường bệnh</TabsTrigger>
                </TabsList>

                {/* TAB KHOA */}
                <TabsContent value="departments">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center"><Building2 className="mr-2 h-5 w-5" /> Danh sách khoa</CardTitle>
                                <Dialog open={isAddDeptDialogOpen} onOpenChange={setIsAddDeptDialogOpen}>
                                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Thêm khoa</Button></DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Thêm khoa mới</DialogTitle></DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Tên khoa</Label>
                                                <Input id="name" value={newDepartment.name} onChange={handleDepartmentInputChange} placeholder="Nhập tên khoa" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description">Mô tả</Label>
                                                <Textarea id="description" value={newDepartment.description} onChange={handleDepartmentInputChange} placeholder="Nhập mô tả khoa" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="location">Vị trí</Label>
                                                <Input id="location" value={newDepartment.location} onChange={handleDepartmentInputChange} placeholder="Tòa nhà, tầng..." />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddDeptDialogOpen(false)}>Hủy</Button>
                                            <Button onClick={handleAddDepartment}>Thêm</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {departments.map((dept) => (
                                    <Card key={dept.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                                                    <p className="text-sm text-muted-foreground">{dept.location || 'Không xác định'}</p>
                                                </div>
                                                <div className="flex space-x-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDepartmentDialog(dept)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => openDeleteDialog('department', dept.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent><p className="text-sm">{dept.description || 'Chưa có mô tả.'}</p></CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB PHÒNG */}
                <TabsContent value="rooms">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Danh sách phòng</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Tìm theo phòng hoặc khoa..." value={roomSearchTerm} onChange={e => setRoomSearchTerm(e.target.value)} className="pl-8" />
                                    </div>
                                    <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
                                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Thêm phòng</Button></DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Thêm phòng mới</DialogTitle></DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Tên phòng</Label>
                                                    <Input id="name" value={newRoom.name} onChange={handleRoomInputChange} placeholder="VD: Phòng 101, ICU-01" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="department_id">Khoa</Label>
                                                    <Select value={String(newRoom.department_id)} onValueChange={(value) => handleRoomSelectChange('department_id', Number(value))}>
                                                        <SelectTrigger><SelectValue placeholder="Chọn khoa" /></SelectTrigger>
                                                        <SelectContent>
                                                            {departments.map(dept => (<SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="type">Loại phòng</Label>
                                                    <Select value={newRoom.type} onValueChange={(value) => handleRoomSelectChange('type', value as RoomType)}>
                                                        <SelectTrigger><SelectValue placeholder="Chọn loại phòng" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Normal">Normal</SelectItem>
                                                            <SelectItem value="ICU">ICU</SelectItem>
                                                            <SelectItem value="Operating">Operating</SelectItem>
                                                            <SelectItem value="Emergency">Emergency</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="floor">Tầng</Label>
                                                    <Input id="floor" value={newRoom.floor} onChange={handleRoomInputChange} placeholder="VD: Tầng 1" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddRoomDialogOpen(false)}>Hủy</Button>
                                                <Button onClick={handleAddRoom}>Thêm</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Phòng</TableHead>
                                        <TableHead>Loại</TableHead>
                                        <TableHead>Khoa</TableHead>
                                        <TableHead>Tầng</TableHead>
                                        <TableHead>Trạng thái giường</TableHead>
                                        <TableHead>Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRooms.map((room) => (
                                        <TableRow key={room.id}>
                                            <TableCell className="font-medium">{room.name}</TableCell>
                                            <TableCell><Badge>{room.type}</Badge></TableCell>
                                            <TableCell>{room.department?.name || 'Không xác định'}</TableCell>
                                            <TableCell>{room.floor || 'Không xác định'}</TableCell>
                                            <TableCell>{getRoomStatus(room.id)}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRoomDialog(room)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => openDeleteDialog('room', room.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB GIƯỜNG */}
                <TabsContent value="beds">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center"><Bed className="mr-2 h-5 w-5" /> Quản lý giường bệnh</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Tìm giường hoặc bệnh nhân..." value={bedSearchTerm} onChange={e => setBedSearchTerm(e.target.value)} className="pl-8" />
                                    </div>
                                    <Dialog open={isAddBedDialogOpen} onOpenChange={setIsAddBedDialogOpen}>
                                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Thêm giường</Button></DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Thêm giường mới</DialogTitle></DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="bed_number">Số giường</Label>
                                                    <Input id="bed_number" value={newBed.bed_number} onChange={handleBedInputChange} placeholder="VD: Giường 01" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="room_id">Phòng</Label>
                                                    <Select value={String(newBed.room_id)} onValueChange={(value) => handleBedSelectChange('room_id', Number(value))}>
                                                        <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                                                        <SelectContent>
                                                            {rooms.map(room => (
                                                                <SelectItem key={room.id} value={String(room.id)}>
                                                                    {room.name} ({getRoomStatus(room.id)})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="status">Trạng thái</Label>
                                                    <Select value={newBed.status} onValueChange={(value) => handleBedSelectChange('status', value as BedStatus)}>
                                                        <SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Available">Available</SelectItem>
                                                            <SelectItem value="Occupied">Occupied</SelectItem>
                                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {newBed.status === 'Occupied' && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="patient_name">Tên bệnh nhân</Label>
                                                        <Input id="patient_name" value={newBed.patient_name} onChange={handleBedInputChange} placeholder="Nhập tên bệnh nhân" />
                                                    </div>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddBedDialogOpen(false)}>Hủy</Button>
                                                <Button onClick={handleAddBed}>Thêm</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Giường</TableHead>
                                        <TableHead>Phòng</TableHead>
                                        <TableHead>Khoa</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Bệnh nhân</TableHead>
                                        <TableHead>Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBeds.map((bed) => (
                                        <TableRow key={bed.id}>
                                            <TableCell className="font-medium">{bed.bed_number}</TableCell>
                                            <TableCell>{bed.room?.name || 'Không xác định'}</TableCell>
                                            <TableCell>{bed.room?.department?.name || 'Không xác định'}</TableCell>
                                            <TableCell><Badge variant={getBedStatusColor(bed.status)}>{bed.status}</Badge></TableCell>
                                            <TableCell>{bed.patient?.name || '---'}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditBedDialog(bed)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => openDeleteDialog('bed', bed.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* DIALOG SỬA KHOA */}
            <Dialog open={isEditDeptDialogOpen} onOpenChange={setIsEditDeptDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Sửa khoa</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên khoa</Label>
                            <Input id="name" value={editDepartment.name} onChange={handleEditDepartmentInputChange} placeholder="Nhập tên khoa" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Textarea id="description" value={editDepartment.description} onChange={handleEditDepartmentInputChange} placeholder="Nhập mô tả khoa" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Vị trí</Label>
                            <Input id="location" value={editDepartment.location} onChange={handleEditDepartmentInputChange} placeholder="Tòa nhà, tầng..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDeptDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleEditDepartment}>Cập nhật</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG SỬA PHÒNG */}
            <Dialog open={isEditRoomDialogOpen} onOpenChange={setIsEditRoomDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Sửa phòng</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên phòng</Label>
                            <Input id="name" value={editRoom.name} onChange={handleEditRoomInputChange} placeholder="VD: Phòng 101, ICU-01" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department_id">Khoa</Label>
                            <Select value={String(editRoom.department_id)} onValueChange={(value) => handleEditRoomSelectChange('department_id', Number(value))}>
                                <SelectTrigger><SelectValue placeholder="Chọn khoa" /></SelectTrigger>
                                <SelectContent>
                                    {departments.map(dept => (<SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Loại phòng</Label>
                            <Select value={editRoom.type} onValueChange={(value) => handleEditRoomSelectChange('type', value as RoomType)}>
                                <SelectTrigger><SelectValue placeholder="Chọn loại phòng" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="ICU">ICU</SelectItem>
                                    <SelectItem value="Operating">Operating</SelectItem>
                                    <SelectItem value="Emergency">Emergency</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="floor">Tầng</Label>
                            <Input id="floor" value={editRoom.floor} onChange={handleEditRoomInputChange} placeholder="VD: Tầng 1" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditRoomDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleEditRoom}>Cập nhật</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG SỬA GIƯỜNG */}
            <Dialog open={isEditBedDialogOpen} onOpenChange={setIsEditBedDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Sửa giường</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="bed_number">Số giường</Label>
                            <Input id="bed_number" value={editBed.bed_number} onChange={handleEditBedInputChange} placeholder="VD: Giường 01" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room_id">Phòng</Label>
                            <Select value={String(editBed.room_id)} onValueChange={(value) => handleEditBedSelectChange('room_id', Number(value))}>
                                <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                                <SelectContent>
                                    {rooms.map(room => (
                                        <SelectItem key={room.id} value={String(room.id)}>
                                            {room.name} ({getRoomStatus(room.id)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Trạng thái</Label>
                            <Select value={editBed.status} onValueChange={(value) => handleEditBedSelectChange('status', value as BedStatus)}>
                                <SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Occupied">Occupied</SelectItem>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {editBed.status === 'Occupied' && (
                            <div className="space-y-2">
                                <Label htmlFor="patient_name">Tên bệnh nhân</Label>
                                <Input id="patient_name" value={editBed.patient_name} onChange={handleEditBedInputChange} placeholder="Nhập tên bệnh nhân" />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditBedDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleEditBed}>Cập nhật</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* HỘP THOẠI XÁC NHẬN XÓA */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bạn có chắc chắn muốn xóa?</DialogTitle>
                        <DialogDescription>Hành động này không thể hoàn tác. Mục sẽ bị xóa vĩnh viễn.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Xóa</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

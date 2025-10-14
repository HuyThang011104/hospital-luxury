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
import { Plus, Edit, Trash2, Building2, Bed, AlertTriangle, Search } from 'lucide-react';
import { supabase } from '@/utils/backend/client';

// --- INTERFACES ---
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
    capacity: number;
    occupied: number;
    department: Pick<IDepartment, 'id' | 'name'>; // Dữ liệu join
}

type BedStatus = 'Occupied' | 'Available' | 'Maintenance';
interface IBed {
    id: number;
    bed_number: string;
    status: BedStatus;
    room_id: number;
    patient: { name: string } | null; // Giả sử join với bảng patient
    room: { // Dữ liệu join
        name: string;
        department: { name: string };
    };
}

// --- INITIAL FORM STATES ---
const initialNewDepartmentState = { name: '', description: '', location: '' };
const initialNewRoomState = { name: '', type: 'Normal' as RoomType, floor: '', department_id: 0, capacity: 1 };


export function Departments() {
    // --- STATE MANAGEMENT ---
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<IDepartment[]>([]);
    const [rooms, setRooms] = useState<IRoom[]>([]);
    const [beds, setBeds] = useState<IBed[]>([]);

    const [isAddDeptDialogOpen, setIsAddDeptDialogOpen] = useState(false);
    const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [newDepartment, setNewDepartment] = useState(initialNewDepartmentState);
    const [newRoom, setNewRoom] = useState(initialNewRoomState);

    const [itemToDelete, setItemToDelete] = useState<{ type: 'department' | 'room' | 'bed'; id: number } | null>(null);

    const [roomSearchTerm, setRoomSearchTerm] = useState('');
    const [bedSearchTerm, setBedSearchTerm] = useState('');


    // --- FETCH DATA ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([fetchDepartments(), fetchRooms(), fetchBeds()]);
            } catch (error) {
                console.error("Error fetching initial data:", error);
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


    // --- CRUD HANDLERS ---
    const handleAddDepartment = async () => {
        if (!newDepartment.name) return alert('Department Name is required.');
        const { data, error } = await supabase.from('department').insert([newDepartment]).select().single();
        if (error) alert(error.message);
        else if (data) {
            setDepartments(prev => [...prev, data]);
            setNewDepartment(initialNewDepartmentState);
            setIsAddDeptDialogOpen(false);
        }
    };

    const handleAddRoom = async () => {
        if (!newRoom.name || !newRoom.department_id) return alert('Room name and department are required.');
        const { data, error } = await supabase.from('room').insert([{ ...newRoom, occupied: 0 }]).select('*, department (id, name)').single();
        if (error) alert(error.message);
        else if (data) {
            setRooms(prev => [...prev, data as any]);
            setNewRoom(initialNewRoomState);
            setIsAddRoomDialogOpen(false);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const { type, id } = itemToDelete;
        const { error } = await supabase.from(type).delete().eq('id', id);
        if (error) alert(error.message);
        else {
            if (type === 'department') setDepartments(prev => prev.filter(item => item.id !== id));
            else if (type === 'room') setRooms(prev => prev.filter(item => item.id !== id));
        }
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    // --- FORM INPUT HANDLERS ---
    const handleDepartmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNewDepartment(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleRoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setNewRoom(prev => ({ ...prev, [id]: id === 'capacity' ? parseInt(value, 10) || 0 : value }));
    };
    const handleRoomSelectChange = (id: 'type' | 'department_id' | 'floor', value: string | number) => {
        setNewRoom(prev => ({ ...prev, [id]: value }));
    };

    // --- FILTERED DATA ---
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

    // --- HELPERS ---
    const getBedStatusColor = (status: BedStatus) => {
        // ... (function as before)
    };

    // --- RENDER ---
    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading hospital data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Departments & Rooms</h1>
                    <p className="text-muted-foreground">Manage hospital departments, rooms, and bed allocation</p>
                </div>
            </div>

            <Tabs defaultValue="departments" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="departments">Departments</TabsTrigger>
                    <TabsTrigger value="rooms">Rooms</TabsTrigger>
                    <TabsTrigger value="beds">Beds</TabsTrigger>
                </TabsList>

                {/* DEPARTMENTS TAB */}
                <TabsContent value="departments">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center"><Building2 className="mr-2 h-5 w-5" /> Departments</CardTitle>
                                <Dialog open={isAddDeptDialogOpen} onOpenChange={setIsAddDeptDialogOpen}>
                                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Department</Button></DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Add New Department</DialogTitle></DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Department Name</Label>
                                                <Input id="name" value={newDepartment.name} onChange={handleDepartmentInputChange} placeholder="Enter department name" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea id="description" value={newDepartment.description} onChange={handleDepartmentInputChange} placeholder="Enter department description" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="location">Location</Label>
                                                <Input id="location" value={newDepartment.location} onChange={handleDepartmentInputChange} placeholder="Building, Floor" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddDeptDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleAddDepartment}>Add Department</Button>
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
                                                    <p className="text-sm text-muted-foreground">{dept.location || 'N/A'}</p>
                                                </div>
                                                <div className="flex space-x-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => openDeleteDialog('department', dept.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent><p className="text-sm">{dept.description || 'No description.'}</p></CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ROOMS TAB */}
                <TabsContent value="rooms">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Rooms</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Search room or department..." value={roomSearchTerm} onChange={e => setRoomSearchTerm(e.target.value)} className="pl-8" />
                                    </div>
                                    <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
                                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Room</Button></DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Add New Room</DialogTitle></DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <Input id="name" value={newRoom.name} onChange={handleRoomInputChange} placeholder="e.g., Room 101, ICU-01" />
                                                <Select value={String(newRoom.department_id)} onValueChange={(value) => handleRoomSelectChange('department_id', Number(value))}>
                                                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                                    <SelectContent>
                                                        {departments.map(dept => (<SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                                <Input id="capacity" type="number" min="1" value={newRoom.capacity} onChange={handleRoomInputChange} placeholder="Number of beds" />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddRoomDialogOpen(false)}>Cancel</Button>
                                                <Button onClick={handleAddRoom}>Add Room</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Room</TableHead><TableHead>Type</TableHead><TableHead>Department</TableHead><TableHead>Capacity</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredRooms.map((room) => (
                                        <TableRow key={room.id}>
                                            <TableCell className="font-medium">{room.name}</TableCell>
                                            <TableCell><Badge>{room.type}</Badge></TableCell>
                                            {/* Hiển thị tên khoa từ dữ liệu join */}
                                            <TableCell>{room.department?.name || 'N/A'}</TableCell>
                                            <TableCell>{room.occupied}/{room.capacity}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
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

                {/* BEDS TAB */}
                <TabsContent value="beds">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center"><Bed className="mr-2 h-5 w-5" /> Bed Management</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search bed, patient..." value={bedSearchTerm} onChange={e => setBedSearchTerm(e.target.value)} className="pl-8" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Bed</TableHead><TableHead>Room</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead>Patient</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredBeds.map((bed) => (
                                        <TableRow key={bed.id}>
                                            <TableCell className="font-medium">{bed.bed_number}</TableCell>
                                            {/* Hiển thị tên phòng và khoa từ dữ liệu join */}
                                            <TableCell>{bed.room?.name || 'N/A'}</TableCell>
                                            <TableCell>{bed.room?.department?.name || 'N/A'}</TableCell>
                                            <TableCell><Badge>{bed.status}</Badge></TableCell>
                                            <TableCell>{bed.patient?.name || '---'}</TableCell>
                                            <TableCell><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>This action cannot be undone. This will permanently delete the item.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
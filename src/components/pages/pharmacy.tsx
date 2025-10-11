/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { Plus, Search, Filter, Pill, Wrench, AlertTriangle, Edit, Trash2, Package } from 'lucide-react';
import { supabase } from '@/utils/backend/client';
import type { IMedicine } from '@/interfaces/medicine';
import type { IEquipment } from '@/interfaces/equipment';
import type { EquipmentStatus } from '@/types';

// Interface cho state của form thêm thuốc
interface NewMedicineState {
    name: string;
    description: string;
    quantity: string;
    unit_price: string;
    expiry_date: string;
}

// Interface cho state của form thêm thiết bị
interface NewEquipmentState {
    name: string;
    quantity: string;
    location: string;
    status: EquipmentStatus;
}

export function Pharmacy() {
    const [medicines, setMedicines] = useState<IMedicine[]>([]);
    const [medicinesLoading, setMedicinesLoading] = useState(true);
    const [equipment, setEquipment] = useState<IEquipment[]>([]);
    const [equipmentLoading, setEquipmentLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isAddMedicineDialogOpen, setIsAddMedicineDialogOpen] = useState(false);
    const [isAddEquipmentDialogOpen, setIsAddEquipmentDialogOpen] = useState(false);
    const [addMedicineError, setAddMedicineError] = useState<string | null>(null);
    const [addEquipmentError, setAddEquipmentError] = useState<string | null>(null);

    const [newMedicine, setNewMedicine] = useState<NewMedicineState>({
        name: '',
        description: '',
        quantity: '',
        unit_price: '',
        expiry_date: ''
    });

    const [newEquipment, setNewEquipment] = useState<NewEquipmentState>({
        name: '',
        quantity: '',
        location: '',
        status: 'Available'
    });

    useEffect(() => {
        fetchMedicines();
        fetchEquipment();
    }, []);

    // Hàm chung để cập nhật state form thuốc
    const handleMedicineInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setNewMedicine(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Hàm cho Select Component cho thuốc
    const handleMedicineSelectChange = (id: keyof NewMedicineState, value: string) => {
        setNewMedicine(prev => ({ ...prev, [id]: value }));
    };

    // Hàm chung để cập nhật state form thiết bị
    const handleEquipmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setNewEquipment(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Hàm cho Select Component cho thiết bị
    const handleEquipmentSelectChange = (id: keyof NewEquipmentState, value: string) => {
        setNewEquipment(prev => ({ ...prev, [id]: value as EquipmentStatus }));
    };

    const fetchMedicines = async () => {
        setMedicinesLoading(true);
        try {
            const { data, error } = await supabase
                .from('medicine')
                .select('*')
                .order('name');
            if (error) throw error;
            setMedicines(data || []);
        } catch (error) {
            console.error('Error fetching medicines:', error);
        } finally {
            setMedicinesLoading(false);
        }
    };

    const fetchEquipment = async () => {
        setEquipmentLoading(true);
        try {
            const { data, error } = await supabase
                .from('equipment')
                .select('*')
                .order('name');
            if (error) throw error;
            setEquipment(data || []);
        } catch (error) {
            console.error('Error fetching equipment:', error);
        } finally {
            setEquipmentLoading(false);
        }
    };

    const resetNewMedicineState = () => {
        setNewMedicine({
            name: '',
            description: '',
            quantity: '',
            unit_price: '',
            expiry_date: ''
        });
        setAddMedicineError(null);
    };

    const resetNewEquipmentState = () => {
        setNewEquipment({
            name: '',
            quantity: '',
            location: '',
            status: 'Available'
        });
        setAddEquipmentError(null);
    };

    const handleAddMedicine = async () => {
        setAddMedicineError(null);

        // Kiểm tra validation cơ bản
        if (!newMedicine.name || !newMedicine.quantity || !newMedicine.unit_price) {
            setAddMedicineError("Please fill in all required fields (Name, Quantity, Price).");
            return;
        }

        try {
            const medicineDataToInsert = {
                name: newMedicine.name,
                description: newMedicine.description || null,
                quantity: parseInt(newMedicine.quantity, 10) || null,
                unit_price: parseFloat(newMedicine.unit_price) || null,
                expiry_date: newMedicine.expiry_date ? new Date(newMedicine.expiry_date).toISOString().split('T')[0] : null
            };

            const { data, error } = await supabase
                .from('medicine')
                .insert([medicineDataToInsert])
                .select('*');

            if (error) {
                console.error('Supabase error adding medicine:', error);
                throw new Error(error.message);
            }

            const addedMedicine = data?.[0] as IMedicine;
            if (addedMedicine) {
                setMedicines(prevMedicines => [...prevMedicines, addedMedicine]);
            }

            // Đóng dialog và reset form
            setIsAddMedicineDialogOpen(false);
            resetNewMedicineState();

            console.log('Medicine added successfully:', addedMedicine);
        } catch (error: any) {
            console.error('Error adding medicine:', error);
            setAddMedicineError(`Failed to add medicine: ${error.message || 'Unknown error'}`);
        }
    };

    const handleAddEquipment = async () => {
        setAddEquipmentError(null);

        // Kiểm tra validation cơ bản
        if (!newEquipment.name || !newEquipment.quantity) {
            setAddEquipmentError("Please fill in all required fields (Name, Quantity).");
            return;
        }

        try {
            const equipmentDataToInsert = {
                name: newEquipment.name,
                quantity: parseInt(newEquipment.quantity, 10) || null,
                location: newEquipment.location || null,
                status: newEquipment.status
            };

            const { data, error } = await supabase
                .from('equipment')
                .insert([equipmentDataToInsert])
                .select('*');

            if (error) {
                console.error('Supabase error adding equipment:', error);
                throw new Error(error.message);
            }

            const addedEquipment = data?.[0] as IEquipment;
            if (addedEquipment) {
                setEquipment(prevEquipment => [...prevEquipment, addedEquipment]);
            }

            // Đóng dialog và reset form
            setIsAddEquipmentDialogOpen(false);
            resetNewEquipmentState();

            console.log('Equipment added successfully:', addedEquipment);
        } catch (error: any) {
            console.error('Error adding equipment:', error);
            setAddEquipmentError(`Failed to add equipment: ${error.message || 'Unknown error'}`);
        }
    };

    const filteredMedicines = medicines.filter(medicine => {
        const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (medicine.description && medicine.description.toLowerCase().includes(searchTerm.toLowerCase()));
        // Category filter would need actual category field in database - temporarily disabled
        const matchesCategory = categoryFilter === 'All' || true;
        return matchesSearch && matchesCategory;
    });

    const filteredEquipment = equipment.filter(equipment => {
        const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (equipment.location && equipment.location.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'All' || equipment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const isExpiringSoon = (expiryDate: string | null) => {
        if (!expiryDate) return false;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return daysUntilExpiry <= 90; // Within 90 days
    };

    const isExpired = (expiryDate: string | null) => {
        if (!expiryDate) return false;
        const today = new Date();
        const expiry = new Date(expiryDate);
        return expiry < today;
    };

    const getExpiryBadge = (expiryDate: string | null) => {
        if (isExpired(expiryDate)) {
            return <Badge variant="destructive">Expired</Badge>;
        } else if (isExpiringSoon(expiryDate)) {
            return <Badge variant="secondary">Expiring Soon</Badge>;
        }
        return <Badge variant="default">Valid</Badge>;
    };

    const getStockBadge = (quantity: number | null, threshold: number = 20) => {
        if (quantity === null || quantity === undefined) {
            return <Badge variant="outline">Unknown</Badge>;
        } else if (quantity === 0) {
            return <Badge variant="destructive">Out of Stock</Badge>;
        } else if (quantity <= threshold) {
            return <Badge variant="secondary">Low Stock</Badge>;
        }
        return <Badge variant="default">In Stock</Badge>;
    };

    const getStatusBadge = (status: EquipmentStatus) => {
        const variant = status === 'Available' ? 'default' :
            status === 'In_Use' ? 'secondary' : 'destructive';
        return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>;
    };

    // Loading state
    const loading = medicinesLoading || equipmentLoading;

    if (loading) {
        return <div className="text-center py-10">Loading medicines and equipment...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1>Pharmacy & Equipment</h1>
                    <p className="text-muted-foreground">
                        Manage medicines inventory and medical equipment
                    </p>
                </div>
            </div>

            <Tabs defaultValue="medicines" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="medicines" className="flex items-center">
                        <Pill className="mr-2 h-4 w-4" />
                        Medicines
                    </TabsTrigger>
                    <TabsTrigger value="equipment" className="flex items-center">
                        <Wrench className="mr-2 h-4 w-4" />
                        Equipment
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="medicines">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                                <CardTitle className="flex items-center">
                                    <Package className="mr-2 h-5 w-5" />
                                    Medicine Inventory ({filteredMedicines.length})
                                </CardTitle>
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search medicines..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 w-64"
                                        />
                                    </div>
                                    <Dialog open={isAddMedicineDialogOpen} onOpenChange={(open) => {
                                        setIsAddMedicineDialogOpen(open);
                                        if (!open) resetNewMedicineState();
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Medicine
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Medicine</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid grid-cols-2 gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Medicine Name</Label>
                                                    <Input
                                                        id="name"
                                                        placeholder="Enter medicine name"
                                                        value={newMedicine.name}
                                                        onChange={handleMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="quantity">Quantity</Label>
                                                    <Input
                                                        id="quantity"
                                                        type="number"
                                                        placeholder="Enter quantity"
                                                        value={newMedicine.quantity}
                                                        onChange={handleMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <Label htmlFor="description">Description</Label>
                                                    <Input
                                                        id="description"
                                                        placeholder="Enter description"
                                                        value={newMedicine.description}
                                                        onChange={handleMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="unit_price">Price ($)</Label>
                                                    <Input
                                                        id="unit_price"
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Enter price"
                                                        value={newMedicine.unit_price}
                                                        onChange={handleMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="expiry_date">Expiry Date</Label>
                                                    <Input
                                                        id="expiry_date"
                                                        type="date"
                                                        value={newMedicine.expiry_date}
                                                        onChange={handleMedicineInputChange}
                                                    />
                                                </div>
                                            </div>
                                            {addMedicineError && (
                                                <p className="text-red-500 text-sm mt-2">{addMedicineError}</p>
                                            )}
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="outline" onClick={() => setIsAddMedicineDialogOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleAddMedicine}>
                                                    Add Medicine
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Medicine Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Expiry Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMedicines.map((medicine) => (
                                            <TableRow key={medicine.id}>
                                                <TableCell className="font-medium">{medicine.name}</TableCell>
                                                <TableCell className="max-w-40 truncate">{medicine.description || 'No description'}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <span>{medicine.quantity || 'N/A'}</span>
                                                        {medicine.quantity && medicine.quantity <= 20 && (
                                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>${medicine.unit_price || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <span>{medicine.expiry_date ? new Date(medicine.expiry_date).toLocaleDateString() : 'No expiry date'}</span>
                                                        {isExpiringSoon(medicine.expiry_date.toString()) && (
                                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {getStockBadge(medicine.quantity)}
                                                        {medicine.expiry_date && getExpiryBadge(medicine.expiry_date.toString())}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-1">
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredMedicines.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                                    No medicines found matching your criteria.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="equipment">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                                <CardTitle className="flex items-center">
                                    <Wrench className="mr-2 h-5 w-5" />
                                    Medical Equipment ({filteredEquipment.length})
                                </CardTitle>
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search equipment..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 w-64"
                                        />
                                    </div>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-32">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Status</SelectItem>
                                            <SelectItem value="Available">Available</SelectItem>
                                            <SelectItem value="In_Use">In Use</SelectItem>
                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Dialog open={isAddEquipmentDialogOpen} onOpenChange={(open) => {
                                        setIsAddEquipmentDialogOpen(open);
                                        if (!open) resetNewEquipmentState();
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Equipment
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Equipment</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid grid-cols-2 gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Equipment Name</Label>
                                                    <Input
                                                        id="name"
                                                        placeholder="Enter equipment name"
                                                        value={newEquipment.name}
                                                        onChange={handleEquipmentInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="quantity">Quantity</Label>
                                                    <Input
                                                        id="quantity"
                                                        type="number"
                                                        placeholder="Enter quantity"
                                                        value={newEquipment.quantity}
                                                        onChange={handleEquipmentInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="location">Location</Label>
                                                    <Input
                                                        id="location"
                                                        placeholder="Enter location"
                                                        value={newEquipment.location}
                                                        onChange={handleEquipmentInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="status">Status</Label>
                                                    <Select
                                                        value={newEquipment.status}
                                                        onValueChange={(value) => handleEquipmentSelectChange('status', value as EquipmentStatus)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Available">Available</SelectItem>
                                                            <SelectItem value="In_Use">In Use</SelectItem>
                                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            {addEquipmentError && (
                                                <p className="text-red-500 text-sm mt-2">{addEquipmentError}</p>
                                            )}
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="outline" onClick={() => setIsAddEquipmentDialogOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleAddEquipment}>
                                                    Add Equipment
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Equipment Name</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEquipment.map((equipment) => (
                                            <TableRow key={equipment.id}>
                                                <TableCell className="font-medium">{equipment.name}</TableCell>
                                                <TableCell>{equipment.quantity || 'N/A'}</TableCell>
                                                <TableCell>{equipment.location || 'No location'}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusBadge(equipment.status)}
                                                        {equipment.status === 'Maintenance' && (
                                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-1">
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredEquipment.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                                    No equipment found matching your criteria.
                                                </TableCell>
                                            </TableRow>
                                        )}
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

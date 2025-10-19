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
import { Plus, Search, Filter, Pill, Wrench, AlertTriangle, Edit, Trash2, Package, ShoppingCart, X, Minus, PlusCircle, Receipt } from 'lucide-react';
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

// Interface cho state của form sửa thuốc
interface EditMedicineState {
    name: string;
    description: string;
    quantity: string;
    unit_price: string;
    expiry_date: string;
}

// Interface cho state của form sửa thiết bị
interface EditEquipmentState {
    name: string;
    quantity: string;
    location: string;
    status: EquipmentStatus;
}

// Interface cho item trong giỏ hàng
interface CartItem {
    id: string;
    medicine: IMedicine;
    quantity: number;
    subtotal: number;
}

// Interface cho hóa đơn
interface SalesInvoice {
    id: string;
    items: CartItem[];
    total_amount: number;
    created_at: string;
    customer_name?: string;
    customer_phone?: string;
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

    // Edit dialog states
    const [isEditMedicineDialogOpen, setIsEditMedicineDialogOpen] = useState(false);
    const [isEditEquipmentDialogOpen, setIsEditEquipmentDialogOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<IMedicine | null>(null);
    const [editingEquipment, setEditingEquipment] = useState<IEquipment | null>(null);
    const [editMedicineError, setEditMedicineError] = useState<string | null>(null);
    const [editEquipmentError, setEditEquipmentError] = useState<string | null>(null);

    // State cho chức năng bán thuốc
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedMedicine, setSelectedMedicine] = useState<IMedicine | null>(null);
    const [saleQuantity, setSaleQuantity] = useState<string>('1');
    const [customerName, setCustomerName] = useState<string>('');
    const [customerPhone, setCustomerPhone] = useState<string>('');
    const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
    const [saleError, setSaleError] = useState<string | null>(null);
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState<SalesInvoice | null>(null);

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

    // Edit form states
    const [editMedicine, setEditMedicine] = useState<EditMedicineState>({
        name: '',
        description: '',
        quantity: '',
        unit_price: '',
        expiry_date: ''
    });

    const [editEquipment, setEditEquipment] = useState<EditEquipmentState>({
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

    // --- EDIT HANDLERS ---

    // Hàm cập nhật state form sửa thuốc
    const handleEditMedicineInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setEditMedicine(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Hàm cho Select Component trong form sửa thuốc
    const handleEditMedicineSelectChange = (id: keyof EditMedicineState, value: string) => {
        setEditMedicine(prev => ({ ...prev, [id]: value }));
    };

    // Hàm cập nhật state form sửa thiết bị
    const handleEditEquipmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setEditEquipment(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Hàm cho Select Component trong form sửa thiết bị
    const handleEditEquipmentSelectChange = (id: keyof EditEquipmentState, value: string) => {
        setEditEquipment(prev => ({ ...prev, [id]: value as EquipmentStatus }));
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

    // --- EDIT FUNCTIONS ---

    const openEditMedicineDialog = (medicine: IMedicine) => {
        setEditingMedicine(medicine);
        setEditMedicine({
            name: medicine.name,
            description: medicine.description || '',
            quantity: medicine.quantity?.toString() || '',
            unit_price: medicine.unit_price?.toString() || '',
            expiry_date: medicine.expiry_date?.toString().split('T')[0] || ''
        });
        setEditMedicineError(null);
        setIsEditMedicineDialogOpen(true);
    };

    const handleEditMedicine = async () => {
        if (!editingMedicine) return;

        setEditMedicineError(null);

        // Kiểm tra validation
        if (!editMedicine.name || !editMedicine.quantity || !editMedicine.unit_price) {
            setEditMedicineError("Vui lòng điền tất cả các trường bắt buộc (Tên, Số lượng, Giá).");
            return;
        }

        try {
            const medicineDataToUpdate = {
                name: editMedicine.name,
                description: editMedicine.description || null,
                quantity: parseInt(editMedicine.quantity, 10) || null,
                unit_price: parseFloat(editMedicine.unit_price) || null,
                expiry_date: editMedicine.expiry_date ? new Date(editMedicine.expiry_date).toISOString().split('T')[0] : null
            };

            const { data, error } = await supabase
                .from('medicine')
                .update(medicineDataToUpdate)
                .eq('id', editingMedicine.id)
                .select('*');

            if (error) {
                console.error('Supabase error updating medicine:', error);
                throw new Error(error.message);
            }

            const updatedMedicine = data?.[0] as IMedicine;
            if (updatedMedicine) {
                setMedicines(prevMedicines =>
                    prevMedicines.map(m => m.id === editingMedicine.id ? updatedMedicine : m)
                );
            }

            setIsEditMedicineDialogOpen(false);
            setEditingMedicine(null);

            console.log('Medicine updated successfully:', updatedMedicine);
        } catch (error: any) {
            console.error('Error updating medicine:', error);
            setEditMedicineError(`Cập nhật thuốc thất bại: ${error.message || 'Lỗi không xác định'}`);
        }
    };

    const openEditEquipmentDialog = (equipment: IEquipment) => {
        setEditingEquipment(equipment);
        setEditEquipment({
            name: equipment.name,
            quantity: equipment.quantity?.toString() || '',
            location: equipment.location || '',
            status: equipment.status
        });
        setEditEquipmentError(null);
        setIsEditEquipmentDialogOpen(true);
    };

    const handleEditEquipment = async () => {
        if (!editingEquipment) return;

        setEditEquipmentError(null);

        // Kiểm tra validation
        if (!editEquipment.name || !editEquipment.quantity) {
            setEditEquipmentError("Vui lòng điền tất cả các trường bắt buộc (Tên, Số lượng).");
            return;
        }

        try {
            const equipmentDataToUpdate = {
                name: editEquipment.name,
                quantity: parseInt(editEquipment.quantity, 10) || null,
                location: editEquipment.location || null,
                status: editEquipment.status
            };

            const { data, error } = await supabase
                .from('equipment')
                .update(equipmentDataToUpdate)
                .eq('id', editingEquipment.id)
                .select('*');

            if (error) {
                console.error('Supabase error updating equipment:', error);
                throw new Error(error.message);
            }

            const updatedEquipment = data?.[0] as IEquipment;
            if (updatedEquipment) {
                setEquipment(prevEquipment =>
                    prevEquipment.map(e => e.id === editingEquipment.id ? updatedEquipment : e)
                );
            }

            setIsEditEquipmentDialogOpen(false);
            setEditingEquipment(null);

            console.log('Equipment updated successfully:', updatedEquipment);
        } catch (error: any) {
            console.error('Error updating equipment:', error);
            setEditEquipmentError(`Cập nhật thiết bị thất bại: ${error.message || 'Lỗi không xác định'}`);
        }
    };

    const handleAddMedicine = async () => {
        setAddMedicineError(null);

        // Kiểm tra validation cơ bản
        if (!newMedicine.name || !newMedicine.quantity || !newMedicine.unit_price) {
            setAddMedicineError("Vui lòng điền tất cả các trường bắt buộc (Tên, Số lượng, Giá).");
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
            setAddMedicineError(`Thêm thuốc thất bại: ${error.message || 'Lỗi không xác định'}`);
        }
    };

    const handleAddEquipment = async () => {
        setAddEquipmentError(null);

        // Kiểm tra validation cơ bản
        if (!newEquipment.name || !newEquipment.quantity) {
            setAddEquipmentError("Vui lòng điền tất cả các trường bắt buộc (Tên, Số lượng).");
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
            setAddEquipmentError(`Thêm thiết bị thất bại: ${error.message || 'Lỗi không xác định'}`);
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
            return <Badge variant="destructive">Đã hết hạn</Badge>;
        } else if (isExpiringSoon(expiryDate)) {
            return <Badge variant="secondary">Sắp hết hạn</Badge>;
        }
        return <Badge variant="default">Còn hiệu lực</Badge>;
    };

    const getStockBadge = (quantity: number | null, threshold: number = 20) => {
        if (quantity === null || quantity === undefined) {
            return <Badge variant="outline">Không xác định</Badge>;
        } else if (quantity === 0) {
            return <Badge variant="destructive">Hết hàng</Badge>;
        } else if (quantity <= threshold) {
            return <Badge variant="secondary">Hàng sắp hết</Badge>
        }
        return <Badge variant="default">Còn hàng</Badge>;
    };

    const getStatusBadge = (status: EquipmentStatus) => {
        const variant = status === 'Available' ? 'default' :
            status === 'In_Use' ? 'secondary' : 'destructive';
        return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>;
    };

    // --- HÀM XỬ LÝ BÁN THUỐC ---

    const addToCart = () => {
        setSaleError(null);

        if (!selectedMedicine) {
            setSaleError('Vui lòng chọn thuốc');
            return;
        }

        const quantity = parseInt(saleQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            setSaleError('Số lượng phải lớn hơn 0');
            return;
        }

        if (selectedMedicine.quantity && quantity > selectedMedicine.quantity) {
            setSaleError(`Không đủ hàng. Chỉ còn ${selectedMedicine.quantity} ${selectedMedicine.name} trong kho`);
            return;
        }

        const existingItemIndex = cart.findIndex(item => item.medicine.id === selectedMedicine.id);

        if (existingItemIndex >= 0) {
            const updatedCart = [...cart];
            const newQuantity = updatedCart[existingItemIndex].quantity + quantity;

            if (selectedMedicine.quantity && newQuantity > selectedMedicine.quantity) {
                setSaleError(`Không đủ hàng. Tổng số lượng ${newQuantity} vượt quá tồn kho ${selectedMedicine.quantity}`);
                return;
            }

            const unitPrice = selectedMedicine.unit_price || 0;
            updatedCart[existingItemIndex] = {
                ...updatedCart[existingItemIndex],
                quantity: newQuantity,
                subtotal: newQuantity * unitPrice
            };
            setCart(updatedCart);
        } else {
            const unitPrice = selectedMedicine.unit_price || 0;
            const newItem: CartItem = {
                id: Date.now().toString(),
                medicine: selectedMedicine,
                quantity: quantity,
                subtotal: quantity * unitPrice
            };
            setCart([...cart, newItem]);
        }

        setSelectedMedicine(null);
        setSaleQuantity('1');
    };

    const removeFromCart = (itemId: string) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
        const item = cart.find(item => item.id === itemId);
        if (!item) return;

        if (item.medicine.quantity && newQuantity > item.medicine.quantity) {
            setSaleError(`Không đủ hàng. Tổng số lượng ${newQuantity} vượt quá tồn kho ${item.medicine.quantity}`);
            return;
        }

        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        const unitPrice = item.medicine.unit_price || 0;
        const updatedCart = cart.map(cartItem =>
            cartItem.id === itemId
                ? { ...cartItem, quantity: newQuantity, subtotal: newQuantity * unitPrice }
                : cartItem
        );
        setCart(updatedCart);
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + item.subtotal, 0);
    };

    const processSale = async () => {
        setSaleError(null);

        if (cart.length === 0) {
            setSaleError('Giỏ hàng trống');
            return;
        }

        try {
            // Cập nhật số lượng thuốc trong kho
            for (const item of cart) {
                const medicine = medicines.find(m => m.id === item.medicine.id);
                if (!medicine) continue;

                const newQuantity = (medicine.quantity || 0) - item.quantity;
                if (newQuantity < 0) {
                    throw new Error(`Không đủ hàng cho thuốc ${medicine.name}`);
                }

                const { error } = await supabase
                    .from('medicine')
                    .update({ quantity: newQuantity })
                    .eq('id', item.medicine.id);

                if (error) {
                    console.error('Error updating medicine quantity:', error);
                    throw new Error(`Lỗi khi cập nhật số lượng thuốc ${medicine.name}: ${error.message}`);
                }
            }

            // Tạo hóa đơn mới
            const invoice: SalesInvoice = {
                id: Date.now().toString(),
                items: [...cart],
                total_amount: calculateTotal(),
                created_at: new Date().toISOString(),
                customer_name: customerName || 'Khách lẻ',
                customer_phone: customerPhone
            };

            // Cập nhật lại danh sách thuốc
            await fetchMedicines();

            // Hiển thị hóa đơn
            setCurrentInvoice(invoice);
            setIsInvoiceDialogOpen(true);
            setIsSaleDialogOpen(false);

            // Reset giỏ hàng và form
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setSaleQuantity('1');
            setSelectedMedicine(null);

            console.log('Sale processed successfully:', invoice);
        } catch (error: any) {
            console.error('Error processing sale:', error);
            setSaleError(`Lỗi khi xử lý bán hàng: ${error.message || 'Lỗi không xác định'}`);
        }
    };

    const clearCart = () => {
        setCart([]);
        setSaleError(null);
    };

    const availableMedicines = medicines.filter(medicine =>
        medicine.quantity && medicine.quantity > 0
    );

    // Loading state
    const loading = medicinesLoading || equipmentLoading;

    if (loading) {
        return <div className="text-center py-10">Đang tải thuốc và thiết bị...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1>Nhà thuốc & Thiết bị</h1>
                    <p className="text-muted-foreground">
                        Quản lý tồn kho thuốc và thiết bị y tế
                    </p>
                </div>
            </div>

            <Tabs defaultValue="medicines" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="medicines" className="flex items-center">
                        <Pill className="mr-2 h-4 w-4" />
                        Thuốc
                    </TabsTrigger>
                    <TabsTrigger value="equipment" className="flex items-center">
                        <Wrench className="mr-2 h-4 w-4" />
                        Thiết bị
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="flex items-center">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Bán thuốc
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="medicines">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                                <CardTitle className="flex items-center">
                                    <Package className="mr-2 h-5 w-5" />
                                    Tồn kho thuốc ({filteredMedicines.length})
                                </CardTitle>
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm thuốc..."
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
                                                Thêm thuốc
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Thêm thuốc mới</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid grid-cols-2 gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Tên thuốc</Label>
                                                    <Input
                                                        id="name"
                                                        placeholder="Nhập tên thuốc"
                                                        value={newMedicine.name}
                                                        onChange={handleMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="quantity">Số lượng</Label>
                                                    <Input
                                                        id="quantity"
                                                        type="number"
                                                        placeholder="Nhập số lượng"
                                                        value={newMedicine.quantity}
                                                        onChange={handleMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <Label htmlFor="description">Mô tả</Label>
                                                    <Input
                                                        id="description"
                                                        placeholder="Nhập mô tả"
                                                        value={newMedicine.description}
                                                        onChange={handleMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="unit_price">Giá ($)</Label>
                                                    <Input
                                                        id="unit_price"
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Nhập giá"
                                                        value={newMedicine.unit_price}
                                                        onChange={handleMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="expiry_date">Ngày hết hạn</Label>
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
                                                    Hủy
                                                </Button>
                                                <Button onClick={handleAddMedicine}>
                                                    Thêm thuốc
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {/* --- EDIT MEDICINE DIALOG --- */}
                                    <Dialog open={isEditMedicineDialogOpen} onOpenChange={(open) => {
                                        setIsEditMedicineDialogOpen(open);
                                        if (!open) {
                                            setEditingMedicine(null);
                                            setEditMedicineError(null);
                                        }
                                    }}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Sửa thông tin thuốc</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid grid-cols-2 gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit_name">Tên thuốc</Label>
                                                    <Input
                                                        id="edit_name"
                                                        placeholder="Nhập tên thuốc"
                                                        value={editMedicine.name}
                                                        onChange={handleEditMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit_quantity">Số lượng</Label>
                                                    <Input
                                                        id="edit_quantity"
                                                        type="number"
                                                        placeholder="Nhập số lượng"
                                                        value={editMedicine.quantity}
                                                        onChange={handleEditMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <Label htmlFor="edit_description">Mô tả</Label>
                                                    <Input
                                                        id="edit_description"
                                                        placeholder="Nhập mô tả"
                                                        value={editMedicine.description}
                                                        onChange={handleEditMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit_unit_price">Giá ($)</Label>
                                                    <Input
                                                        id="edit_unit_price"
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Nhập giá"
                                                        value={editMedicine.unit_price}
                                                        onChange={handleEditMedicineInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit_expiry_date">Ngày hết hạn</Label>
                                                    <Input
                                                        id="edit_expiry_date"
                                                        type="date"
                                                        value={editMedicine.expiry_date}
                                                        onChange={handleEditMedicineInputChange}
                                                    />
                                                </div>
                                            </div>
                                            {editMedicineError && (
                                                <p className="text-red-500 text-sm mt-2">{editMedicineError}</p>
                                            )}
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="outline" onClick={() => setIsEditMedicineDialogOpen(false)}>
                                                    Hủy
                                                </Button>
                                                <Button onClick={handleEditMedicine}>
                                                    Cập nhật thuốc
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
                                            <TableHead>Tên thuốc</TableHead>
                                            <TableHead>Mô tả</TableHead>
                                            <TableHead>Số lượng</TableHead>
                                            <TableHead>Giá</TableHead>
                                            <TableHead>Ngày hết hạn</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMedicines.map((medicine) => (
                                            <TableRow key={medicine.id}>
                                                <TableCell className="font-medium">{medicine.name}</TableCell>
                                                <TableCell className="max-w-40 truncate">{medicine.description || 'Không có mô tả'}</TableCell>
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
                                                        <span>{medicine.expiry_date ? new Date(medicine.expiry_date).toLocaleDateString() : 'Không có ngày hết hạn'}</span>
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
                                                        <Button variant="ghost" size="sm" onClick={() => openEditMedicineDialog(medicine)}>
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
                                                    Không tìm thấy thuốc nào theo điều kiện tìm kiếm.
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

                                    {/* --- EDIT EQUIPMENT DIALOG --- */}
                                    <Dialog open={isEditEquipmentDialogOpen} onOpenChange={(open) => {
                                        setIsEditEquipmentDialogOpen(open);
                                        if (!open) {
                                            setEditingEquipment(null);
                                            setEditEquipmentError(null);
                                        }
                                    }}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Sửa thông tin thiết bị</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid grid-cols-2 gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit_eq_name">Tên thiết bị</Label>
                                                    <Input
                                                        id="edit_eq_name"
                                                        placeholder="Nhập tên thiết bị"
                                                        value={editEquipment.name}
                                                        onChange={handleEditEquipmentInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit_eq_quantity">Số lượng</Label>
                                                    <Input
                                                        id="edit_eq_quantity"
                                                        type="number"
                                                        placeholder="Nhập số lượng"
                                                        value={editEquipment.quantity}
                                                        onChange={handleEditEquipmentInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit_eq_location">Vị trí</Label>
                                                    <Input
                                                        id="edit_eq_location"
                                                        placeholder="Nhập vị trí"
                                                        value={editEquipment.location}
                                                        onChange={handleEditEquipmentInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit_eq_status">Trạng thái</Label>
                                                    <Select
                                                        value={editEquipment.status}
                                                        onValueChange={(value) => handleEditEquipmentSelectChange('status', value as EquipmentStatus)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn trạng thái" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Available">Available</SelectItem>
                                                            <SelectItem value="In_Use">In Use</SelectItem>
                                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            {editEquipmentError && (
                                                <p className="text-red-500 text-sm mt-2">{editEquipmentError}</p>
                                            )}
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="outline" onClick={() => setIsEditEquipmentDialogOpen(false)}>
                                                    Hủy
                                                </Button>
                                                <Button onClick={handleEditEquipment}>
                                                    Cập nhật thiết bị
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
                                                        <Button variant="ghost" size="sm" onClick={() => openEditEquipmentDialog(equipment)}>
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

                <TabsContent value="sales">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Form chọn thuốc */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    Chọn thuốc bán
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Chọn thuốc</Label>
                                        <Select
                                            value={selectedMedicine?.id.toString() || ''}
                                            onValueChange={(value) => {
                                                const medicine = availableMedicines.find(m => m.id === parseInt(value));
                                                setSelectedMedicine(medicine || null);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn thuốc..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableMedicines.map((medicine) => (
                                                    <SelectItem key={medicine.id} value={medicine.id.toString()}>
                                                        {medicine.name} (Tồn: {medicine.quantity})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Số lượng</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={saleQuantity}
                                            onChange={(e) => setSaleQuantity(e.target.value)}
                                            placeholder="Nhập số lượng"
                                        />
                                    </div>
                                </div>

                                {selectedMedicine && (
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm font-medium">{selectedMedicine.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Giá: ${selectedMedicine.unit_price || 0} |
                                            Tồn kho: {selectedMedicine.quantity} |
                                            Hạn: {selectedMedicine.expiry_date ? new Date(selectedMedicine.expiry_date).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                )}

                                <Button onClick={addToCart} className="w-full" disabled={!selectedMedicine}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Thêm vào giỏ hàng
                                </Button>

                                {saleError && (
                                    <p className="text-red-500 text-sm">{saleError}</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Giỏ hàng */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">Giỏ hàng ({cart.length})</CardTitle>
                                    {cart.length > 0 && (
                                        <Button variant="ghost" size="sm" onClick={clearCart}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {cart.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">Giỏ hàng trống</p>
                                ) : (
                                    <>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {cart.map((item) => (
                                                <div key={item.id} className="p-2 border rounded-lg">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-medium text-sm">{item.medicine.name}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center space-x-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <span className="text-sm w-8 text-center">{item.quantity}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <span className="text-sm font-medium">${item.subtotal.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border-t pt-2">
                                            <div className="flex justify-between items-center font-medium">
                                                <span>Tổng cộng:</span>
                                                <span>${calculateTotal().toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="w-full">
                                                    <Receipt className="mr-2 h-4 w-4" />
                                                    Thanh toán ({cart.length} thuốc)
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Thông tin khách hàng</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid grid-cols-2 gap-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="customer_name">Tên khách hàng</Label>
                                                        <Input
                                                            id="customer_name"
                                                            placeholder="Nhập tên khách hàng"
                                                            value={customerName}
                                                            onChange={(e) => setCustomerName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="customer_phone">Số điện thoại</Label>
                                                        <Input
                                                            id="customer_phone"
                                                            placeholder="Nhập số điện thoại"
                                                            value={customerPhone}
                                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="border-t py-2">
                                                    <h4 className="font-medium mb-2">Chi tiết hóa đơn:</h4>
                                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                                        {cart.map((item) => (
                                                            <div key={item.id} className="flex justify-between text-sm">
                                                                <span>{item.medicine.name} x{item.quantity}</span>
                                                                <span>${item.subtotal.toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                                                        <span>Tổng cộng:</span>
                                                        <span>${calculateTotal().toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                {saleError && (
                                                    <p className="text-red-500 text-sm">{saleError}</p>
                                                )}

                                                <div className="flex justify-end space-x-2">
                                                    <Button variant="outline" onClick={() => setIsSaleDialogOpen(false)}>
                                                        Hủy
                                                    </Button>
                                                    <Button onClick={processSale}>
                                                        Xác nhận thanh toán
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Hóa đơn thành công */}
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <Receipt className="mr-2 h-5 w-5" />
                            Hóa đơn bán hàng
                        </DialogTitle>
                    </DialogHeader>
                    {currentInvoice && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Mã hóa đơn: #{currentInvoice.id}</p>
                                <p className="text-sm text-muted-foreground">
                                    Ngày: {new Date(currentInvoice.created_at).toLocaleString()}
                                </p>
                                <p className="text-sm font-medium">
                                    Khách hàng: {currentInvoice.customer_name}
                                    {currentInvoice.customer_phone && ` - ${currentInvoice.customer_phone}`}
                                </p>
                            </div>

                            <div className="border-t pt-2">
                                <h4 className="font-medium mb-2">Chi tiết:</h4>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {currentInvoice.items.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span>{item.medicine.name} x{item.quantity}</span>
                                            <span>${item.subtotal.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                                    <span>Tổng cộng:</span>
                                    <span>${currentInvoice.total_amount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={() => setIsInvoiceDialogOpen(false)}>
                                    Đóng
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

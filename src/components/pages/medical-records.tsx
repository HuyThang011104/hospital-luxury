/* eslint-disable no-dupe-else-if */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, Eye, FileText, Pill, TestTube, Download, Calendar } from 'lucide-react';
import { supabase } from '@/utils/backend/client';
import type { IMedicalRecord } from '@/interfaces/medical_record';
import type { IPrescription } from '@/interfaces/prescription';
import type { ILabTest } from '@/interfaces/lab_test';
import type { IPatient } from '@/interfaces/patient';
import type { IDoctor } from '@/interfaces/doctor';
import type { IMedicine } from '@/interfaces/medicine';

// Extended interface for medical records with related data
interface IMedicalRecordWithDetails extends IMedicalRecord {
    patient: IPatient;
    doctor: IDoctor;
}

// Extended interface for prescriptions with related data
interface IPrescriptionWithDetails extends IPrescription {
    medical_record: IMedicalRecordWithDetails;
    medicine: IMedicine;
}

// Extended interface for lab tests with related data
interface ILabTestWithDetails extends ILabTest {
    medical_record: IMedicalRecordWithDetails;
}

export function MedicalRecords() {
    const [records, setRecords] = useState<IMedicalRecordWithDetails[]>([]);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [prescriptions, setPrescriptions] = useState<IPrescriptionWithDetails[]>([]);
    const [prescriptionsLoading, setPrescriptionsLoading] = useState(true);
    const [labTests, setLabTests] = useState<ILabTestWithDetails[]>([]);
    const [labTestsLoading, setLabTestsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<IMedicalRecordWithDetails | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMedicalRecords();
        fetchPrescriptions();
        fetchLabTests();
    }, []);

    const fetchMedicalRecords = async () => {
        setRecordsLoading(true);
        try {
            const { data, error } = await supabase
                .from('medical_record')
                .select(`
                    id, patient_id, doctor_id, appointment_id, diagnosis, treatment, record_date,
                    patient ( id, full_name, phone, email ),
                    doctor ( id, full_name, username, phone, email, specialty ( id, name ) )
                `)
                .order('record_date', { ascending: false });
            if (error) throw error;
            console.log("data: ", data);
            setRecords(data as unknown as IMedicalRecordWithDetails[] || []);
        } catch (error) {
            console.error('Error fetching medical records:', error);
        } finally {
            setRecordsLoading(false);
        }
    };

    const fetchPrescriptions = async () => {
        setPrescriptionsLoading(true);
        try {
            const { data, error } = await supabase
                .from('prescription')
                .select(`
                    id, medical_record_id, medicine_id, dosage, frequency, duration,
                    medical_record ( 
                        id, 
                        patient ( id, full_name, phone, email ),
                        doctor ( id, full_name, username, phone, email, specialty ( id, name ) )
                    ),
                    medicine ( id, name, description, unit_price )
                `);
            if (error) throw error;
            setPrescriptions(data as unknown as IPrescriptionWithDetails[] || []);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        } finally {
            setPrescriptionsLoading(false);
        }
    };

    const fetchLabTests = async () => {
        setLabTestsLoading(true);
        try {
            const { data, error } = await supabase
                .from('lab_test')
                .select(`
                    id, medical_record_id, test_type, result, test_date,
                    medical_record ( 
                        id, 
                        patient ( id, full_name, phone, email ),
                        doctor ( id, full_name, username, phone, email, specialty ( id, name ) )
                    )
                `)
                .order('test_date', { ascending: false });
            if (error) throw error;
            setLabTests(data as unknown as ILabTestWithDetails[] || []);
        } catch (error) {
            console.error('Error fetching lab tests:', error);
        } finally {
            setLabTestsLoading(false);
        }
    };

    const isLoadingComplete = () => {
        return !recordsLoading && !prescriptionsLoading && !labTestsLoading;
    };

    useEffect(() => {
        setLoading(!isLoadingComplete());
    }, [recordsLoading, prescriptionsLoading, labTestsLoading]);

    const filteredRecords = records.filter(record => {
        if (!record || typeof record !== 'object') return false;

        const patientName = record.patient?.full_name || '';
        const doctorName = record.doctor?.full_name || '';
        const diagnosis = record.diagnosis || '';
        const treatment = record.treatment || '';

        return patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
            treatment.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getTestStatusBadge = (result: string | null, testType: string) => {
        if (!result) return <Badge variant="outline">Pending</Badge>;

        const lowerResult = result.toLowerCase();
        if (lowerResult.includes('normal') || lowerResult.includes('no') || lowerResult.includes('negative')) {
            return <Badge variant="default">Normal</Badge>;
        } else if (lowerResult.includes('abnormal') || lowerResult.includes('high') || lowerResult.includes('low')) {
            return <Badge variant="destructive">Abnormal</Badge>;
        } else if (testType.toLowerCase().includes('mri') && lowerResult.includes('no')) {
            return <Badge variant="default">Normal</Badge>;
        } else {
            return <Badge variant="secondary">Review Required</Badge>;
        }
    };

    const openRecordDetail = (record: IMedicalRecordWithDetails) => {
        setSelectedRecord(record);
        setIsDetailDialogOpen(true);
    };

    const getRecordPrescriptions = (recordId: number) => {
        return prescriptions.filter(p => p.medical_record_id === recordId);
    };

    const getRecordLabTests = (recordId: number) => {
        return labTests.filter(t => t.medical_record_id === recordId);
    };

    if (loading) {
        return <div className="text-center py-10">Loading medical records, prescriptions, and lab tests...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1>Medical Records</h1>
                    <p className="text-muted-foreground">
                        Patient medical history and treatment records
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                        <CardTitle className="flex items-center">
                            <FileText className="mr-2 h-5 w-5" />
                            All Medical Records ({filteredRecords.length})
                        </CardTitle>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-64"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead>Diagnosis</TableHead>
                                    <TableHead>Treatment</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecords.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{record.patient?.full_name || 'N/A'}</TableCell>
                                        <TableCell>Dr. {record.doctor?.full_name || 'N/A'}</TableCell>
                                        <TableCell>{record.diagnosis || 'Not recorded'}</TableCell>
                                        <TableCell className="max-w-60 truncate">{record.treatment || 'Not recorded'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                                                {record.record_date ? new Date(record.record_date).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openRecordDetail(record)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredRecords.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No medical records found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Medical Record Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Medical Record Details</DialogTitle>
                    </DialogHeader>

                    {selectedRecord && (
                        <div className="space-y-6">
                            {/* Record Overview */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Record Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Patient</p>
                                            <p className="font-medium">{selectedRecord.patient?.full_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Doctor</p>
                                            <p className="font-medium">Dr. {selectedRecord.doctor?.full_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Department</p>
                                            <p className="font-medium">{selectedRecord.doctor?.specialty?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Date</p>
                                            <p className="font-medium">{selectedRecord.record_date ? new Date(selectedRecord.record_date).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">Diagnosis</p>
                                            <p className="font-medium">{selectedRecord.diagnosis || 'Not recorded'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">Treatment</p>
                                            <p className="font-medium">{selectedRecord.treatment || 'Not recorded'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Tabs defaultValue="prescriptions" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="prescriptions" className="flex items-center">
                                        <Pill className="mr-2 h-4 w-4" />
                                        Prescriptions
                                    </TabsTrigger>
                                    <TabsTrigger value="lab-tests" className="flex items-center">
                                        <TestTube className="mr-2 h-4 w-4" />
                                        Lab Tests
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="prescriptions">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Prescribed Medications</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {getRecordPrescriptions(selectedRecord.id).length === 0 ? (
                                                <p className="text-muted-foreground text-center py-4">
                                                    No prescriptions for this record
                                                </p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {getRecordPrescriptions(selectedRecord.id).map((prescription) => (
                                                        <div key={prescription.id} className="border rounded-lg p-4">
                                                            <div className="flex justify-between items-start">
                                                                <div className="space-y-2">
                                                                    <h4 className="font-medium">{prescription.medicine?.name || 'Unknown Medicine'}</h4>
                                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                                        <div>
                                                                            <span className="text-muted-foreground">Dosage: </span>
                                                                            <span>{prescription.dosage || 'Not specified'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-muted-foreground">Frequency: </span>
                                                                            <span>{prescription.frequency || 'Not specified'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-muted-foreground">Duration: </span>
                                                                            <span>{prescription.duration || 'Not specified'}</span>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Prescribed by Dr. {prescription.medical_record?.doctor?.full_name || 'N/A'}
                                                                    </p>
                                                                </div>
                                                                <Button variant="outline" size="sm">
                                                                    <Download className="h-4 w-4 mr-1" />
                                                                    Print
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="lab-tests">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Laboratory Tests</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {getRecordLabTests(selectedRecord.id).length === 0 ? (
                                                <p className="text-muted-foreground text-center py-4">
                                                    No lab tests for this record
                                                </p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {getRecordLabTests(selectedRecord.id).map((test) => (
                                                        <div key={test.id} className="border rounded-lg p-4">
                                                            <div className="flex justify-between items-start">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center space-x-2">
                                                                        <h4 className="font-medium">{test.test_type}</h4>
                                                                        {getTestStatusBadge(test.result, test.test_type)}
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                                        <div>
                                                                            <span className="text-muted-foreground">Result: </span>
                                                                            <span className="font-medium">{test.result || 'Pending'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-muted-foreground">Test Date: </span>
                                                                            <span>{test.test_date ? new Date(test.test_date).toLocaleDateString() : 'N/A'}</span>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Ordered by Dr. {test.medical_record?.doctor?.full_name || 'N/A'}
                                                                    </p>
                                                                </div>
                                                                <Button variant="outline" size="sm">
                                                                    <Download className="h-4 w-4 mr-1" />
                                                                    Download
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

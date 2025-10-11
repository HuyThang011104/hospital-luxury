export interface IMedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id: number | null;
  diagnosis: string | null;
  treatment: string | null;
  record_date: Date | null; // datetime, có default là current_timestamp()
}

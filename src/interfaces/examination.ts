export interface Examination {
  id: number;
  medical_record_id: number;
  examination_type: string;
  details: string | null;
  examination_date: Date;
}

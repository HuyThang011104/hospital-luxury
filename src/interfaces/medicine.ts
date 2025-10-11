export interface IMedicine {
  id: number;
  name: string;
  description: string | null;
  quantity: number | null;
  unit_price: number | null; // decimal(12,2)
  expiry_date: Date; // date trong SQL
}

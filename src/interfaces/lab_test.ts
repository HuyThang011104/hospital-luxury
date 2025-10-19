export interface ILabTest {
  id: number;
  examination_id: number;
  test_type: string;
  result: string | null;
  test_date: Date | null; // datetime, có default là current_timestamp()
  price: number;
}

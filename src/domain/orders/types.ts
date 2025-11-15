export type CreateOrderInput = {
  orderId?: string;
  title: string;
  description: string;
  quantity: number;
  due_date: Date;
  file: string;
  tags: string[];
  shipping_country: string;
  shipping_address_1: string;
  shipping_address_2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
};

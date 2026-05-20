import { Metadata } from 'next';
import OrderForm from '@/components/forms/OrderForm';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { getAccountType } from '@/domain/users/service';

export const metadata: Metadata = {
  title: 'New Order',
};

const NewOrder = async () => {
  if ((await getAccountType()) === 'manufacturer') {
    redirect('/');
  }

  return (
    <div className="flex justify-center items-center h-full my-auto">
      <Card className="w-full max-w-3xl my-10">
        <CardHeader>
          <h1 className="h1">Create a New Order</h1>
        </CardHeader>
        <CardContent>
          <OrderForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewOrder;

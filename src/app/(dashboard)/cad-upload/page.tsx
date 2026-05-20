import { Metadata } from 'next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CADAnalysisForm } from '@/components/forms/CADAnalysisForm';
import { getUserData } from '@/domain/users/service';
import { fetchOrdersByCreator } from '@/lib/supabase/orders';
import type { OrdersSchema } from '@/types/schemas';

export const metadata: Metadata = {
  title: 'CAD Upload | ManuConnect',
};

const CadUploadPage = async () => {
  // Get current user
  const userData = await getUserData();
  if (!userData?.id) {
    return (
      <main className="flex flex-col items-center justify-start p-8 pb-20 gap-8 sm:p-20 w-full">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load user data. Please try again.</p>
        </div>
      </main>
    );
  }

  // Fetch user's orders
  const { data: ordersData } = await fetchOrdersByCreator(userData.id);
  const userOrders = (ordersData as OrdersSchema[]) || [];

  return (
    <main className="flex flex-col items-center justify-start p-8 pb-20 gap-8 sm:p-20 w-full">
      <div className="w-full max-w-4xl">
        <h1 className="h1 mb-2 text-[#0c2340]">CAD File Upload & Analysis</h1>
        <p className="text-muted-foreground mb-8">
          Upload your CAD assembly files (STEP/IGES) to analyze parts and view specifications.
        </p>

        <Card className="w-full">
          <CardHeader className="h2">Upload & Analyze Assembly</CardHeader>
          <CardContent>
            <CADAnalysisForm userId={userData.id} userOrders={userOrders} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default CadUploadPage;

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ActiveOrders from "@/components/dashboard/ActiveOrders";
import { RecentEvents } from "@/components/dashboard/RecentEvents";
import { getUserById } from "@/utils/adminUtils";

export const metadata: Metadata = {
  title: "Home | ManuConnect",
};

export default async function Home() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  const userData = data.user?.user_metadata;

  return (
    <main className="flex flex-col items-center justify-items-center p-8 pb-20 gap-16 sm:p-20 w-full">
      <div className="w-full">
        <h1 className="h1">
          Welcome Back, {userData.first_name}{" "}
          {userData.last_name.substring(0, 1)}.
        </h1>
        <p className="text-muted-foreground">{userData.company_name || ""}</p>
        <div className="grid grid-cols-3 gap-4 mt-8 w-full">
          <Card className="w-full col-span-2">
            <CardHeader className="h2">Active Orders</CardHeader>
            <CardContent>
              <ActiveOrders />
            </CardContent>
          </Card>
          <RecentEvents
            title="Recent Events"
            description="Latest Activity For You"
            limit={10}
          />
        </div>
      </div>
    </main>
  );
}

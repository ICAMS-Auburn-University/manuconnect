import { getAccountType } from "@/utils/supabase/utils";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import BrowseOrders from "@/components/BrowseOrdersCard";
import BrowseOrdersCard from "@/components/BrowseOrdersCard";
import { getUnclaimedOrders } from "@/utils/supabase/orders";

export const metadata: Metadata = {
  title: `Browsing Orders`,
};

const BrowsePage = async () => {
  // Check if the user is a creator
  const accountType = await getAccountType();

  if (accountType === "creator") {
    redirect("/orders");
  }

  return (
    <div className="min-w-full h-full">
      <div className="mt-12">
        <h1 className="h1">Browse Orders</h1>
      </div>
      <BrowseOrdersCard />
    </div>
  );
};

export default BrowsePage;

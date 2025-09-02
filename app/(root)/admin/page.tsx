import { getAccountType } from "@/utils/supabase/utils";
import { redirect } from "next/navigation";
import React from "react";

const AdminPortal = async () => {
  const userType = await getAccountType();

  if (userType !== "admin") {
    redirect("/");
  }

  return (
    <>
      {userType === "admin" && (
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">Admin Portal</h1>
          <p className="text-2xl">Welcome to the Admin Portal</p>
        </div>
      )}
    </>
  );
};

export default AdminPortal;

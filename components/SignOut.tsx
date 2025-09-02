"use client";

import React from "react";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";

interface SignOutProps {
  className?: string;
}

const SignOut = ({ className }: SignOutProps) => {
  const supabase = createClient();

  async function signOut() {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    redirect("/");
  }
  return (
    <div>
      <Button
        className={className}
        onClick={() => {
          signOut();
        }}
      >
        Sign Out
      </Button>
    </div>
  );
};

export default SignOut;

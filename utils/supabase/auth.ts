"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { createUserPfp } from "../adminUtils";

interface AuthData {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  accountType?: "creator" | "manufacturer" | "admin"; // Admin is for the ManuConnect team
  companyName?: string;
}

export async function login(data: AuthData) {
  const supabase = await createClient();

  const { data: UserData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.error(error);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(data: AuthData) {
  const supabase = await createClient();

  const { data: UserData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: `${data.firstName} ${data.lastName}`,
        account_type: data.accountType,
        ...(data.accountType === "manufacturer" && {
          company_name: data.companyName, // Only for manufacturers
        }),
        profile_picture: ``, // Default to empty string
      },
    },
  });

  if (UserData?.user) {
    await createUserPfp(UserData.user.id);
  }

  if (error) {
    redirect("/error");
  }
}

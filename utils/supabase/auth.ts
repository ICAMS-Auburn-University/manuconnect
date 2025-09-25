'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';
import { createUserPfp } from '../adminUtils';

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData extends LoginData {
  firstName: string;
  lastName: string;
  accountType: 'creator' | 'manufacturer' | 'admin';
  companyName: string;
}

export async function login({ email, password }: LoginData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(data: SignupData) {
  console.log('Creating supabase client');
  const supabase = await createClient();
  console.log('Signing up user:', data);
  const { data: UserData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: `${data.firstName} ${data.lastName}`,
        // account_type: data.accountType,
        account_type: 'admin',
        company_name: data.companyName,
        profile_picture: ``,
      },
    },
  });
  console.log('Signup response:', { UserData, error });

  if (UserData?.user) {
    await createUserPfp(UserData.user.id);
  }

  if (error) {
    redirect('/error');
  }
}

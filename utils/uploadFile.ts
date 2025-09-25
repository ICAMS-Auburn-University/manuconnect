'use server';
import { createClient } from './supabase/server';

async function getUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user?.id) {
    throw new Error('User ID not found');
  }
  return data.user.id;
}

export async function uploadFile(file: File) {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from('project-files')
    .upload((await getUserId()) + `/${file.name}`, file);

  console.log(data, error);
  return { data, error };
}

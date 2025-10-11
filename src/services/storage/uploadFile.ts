'use server';

import { createSupabaseServerClient } from '@/app/_internal/supabase/server-client';

const getServerClient = async () => await createSupabaseServerClient();

async function getUserId() {
  const supabase = await getServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user?.id) {
    throw new Error('User ID not found');
  }
  return data.user.id;
}

export async function uploadFile(file: File) {
  const supabase = await getServerClient();

  const { data, error } = await supabase.storage
    .from('project-files')
    .upload((await getUserId()) + `/${file.name}`, file);

  return { data, error };
}

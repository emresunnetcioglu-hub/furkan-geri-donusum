import {createClient} from '@supabase/supabase-js';
export const configured=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export function supabase(){if(!configured)throw new Error('Supabase ortam değişkenleri eksik');return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);}

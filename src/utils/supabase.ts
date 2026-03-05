// src/utils/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ユーザーから提供された Supabase プロジェクトの URL と Anon Key
const supabaseUrl = 'https://inrlppuyqsdeouomcxhv.supabase.co';
const supabaseAnonKey = 'sb_publishable_Q7SjGy0gQESKHkHkwqmVEA_5mK2waXO';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

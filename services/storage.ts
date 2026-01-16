import { supabase } from './supabaseClient';
import { User } from '../types';
import { DEFAULT_ADMIN, DEFAULT_USER } from '../constants';

// --- SUPABASE METHODS ---

export const getStoredUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    // Nếu database trống, tự động thêm admin mặc định
    if (!data || data.length === 0) {
       console.log("Database empty, seeding defaults...");
       const defaults = [DEFAULT_ADMIN, DEFAULT_USER];
       const { error: insertError } = await supabase.from('users').insert(defaults);
       if (insertError) throw insertError;
       return defaults;
    }

    return data as User[];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const findUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .maybeSingle();

    if (error) throw error;
    
    // Logic đảm bảo Admin 'dinhtom' luôn tồn tại
    if (!data && username.toLowerCase() === DEFAULT_ADMIN.username.toLowerCase()) {
        console.log("Admin 'dinhtom' missing. Restoring...");
        const { error: upsertError } = await supabase
            .from('users')
            .upsert([DEFAULT_ADMIN]);
            
        if (!upsertError) return DEFAULT_ADMIN;
    }

    return data as User | null;
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
};

export const createUser = async (username: string, secret: string): Promise<User> => {
  const existing = await findUserByUsername(username);
  if (existing) throw new Error("User này đã tồn tại");

  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    secret,
    isAdmin: false,
    createdAt: Date.now()
  };

  const { error } = await supabase.from('users').insert([newUser]);
  if (error) throw error;

  return newUser;
};

export const updateUserSecret = async (id: string, newSecret: string) => {
  // Cập nhật secret dựa trên ID
  const { data, error } = await supabase
    .from('users')
    .update({ secret: newSecret })
    .eq('id', id)
    .select(); 

  if (error) throw error;
};

export const deleteUser = async (id: string) => {
  // Thực hiện xóa và yêu cầu trả về dòng đã xóa (select)
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    console.error("Supabase Delete Error:", error);
    throw new Error(error.message);
  }

  // Nếu data rỗng, tức là lệnh chạy thành công nhưng KHÔNG có dòng nào bị xóa
  // Nguyên nhân 99% là do RLS (Row Level Security) đang bật trên Supabase
  if (!data || data.length === 0) {
    throw new Error("Không xóa được! Hãy vào Supabase > Table Editor > 'users' > Tắt RLS (Disable Row Level Security).");
  }
};

export const importUsers = async (jsonString: string): Promise<boolean> => {
  try {
    const users: User[] = JSON.parse(jsonString);
    if (Array.isArray(users) && users.length > 0) {
      const { error } = await supabase.from('users').upsert(users);
      if (error) {
        console.error("Import error:", error);
        return false;
      }
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};
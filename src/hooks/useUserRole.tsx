import { useState } from 'react';

export type UserRole = 'admin' | 'hr_manager' | 'trainer' | 'employee' | null;

// AUTHENTICATION TEMPORARILY DISABLED FOR DEVELOPMENT
export const useUserRole = () => {
  const [role] = useState<UserRole>('admin');
  const [loading] = useState(false);
  return { role, loading };
};

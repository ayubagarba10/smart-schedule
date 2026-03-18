'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type UserRole = 'manager' | 'employee';

interface RoleContextValue {
  role: UserRole;
  userId: string | null;
  employeeId: string | null;
  userEmail: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue>({
  role: 'manager',
  userId: null,
  employeeId: null,
  userEmail: null,
  loading: true,
  signOut: async () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<Omit<RoleContextValue, 'signOut'>>({
    role: 'manager',
    userId: null,
    employeeId: null,
    userEmail: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setValue({ role: 'manager', userId: null, employeeId: null, userEmail: null, loading: false });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, employee_id')
        .eq('id', user.id)
        .single();

      setValue({
        role: (profile?.role ?? 'manager') as UserRole,
        userId: user.id,
        employeeId: profile?.employee_id ?? null,
        userEmail: user.email ?? null,
        loading: false,
      });
    };

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setValue({ role: 'manager', userId: null, employeeId: null, userEmail: null, loading: false });
  };

  return (
    <RoleContext.Provider value={{ ...value, signOut }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

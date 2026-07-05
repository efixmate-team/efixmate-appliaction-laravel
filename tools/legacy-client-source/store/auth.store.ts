import { create } from "zustand";

type User = {
  admin_id?: number;
  admin_uid?: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "ADMIN";
  admin_type?: string;
  is_active?: boolean;
  profile_image?: string | null;
  avatar?: string | null;
};

type AuthState = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  setUser: (user) =>
    set({
      user,
    }),
}));

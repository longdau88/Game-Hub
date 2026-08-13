"use client";

import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";

type AuthContextType = {
  token: string | null;
  role: string | null;
  profile: any;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  requireAuth: (action?: () => void) => boolean;
  login: (token: string, role: string, userProfile?: any) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const tokenCookie = Cookies.get("token") || null;
    setToken(tokenCookie);
    setRole(Cookies.get("role") || null);

    if (tokenCookie) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/me`, {
        headers: { "Authorization": `Bearer ${tokenCookie}` }
      })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setProfile(data);
      })
      .catch(console.error);
    }
  }, []);

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  const requireAuth = useCallback((action?: () => void) => {
    if (token) {
      action?.();
      return true;
    } else {
      openLoginModal();
      return false;
    }
  }, [token, openLoginModal]);

  const login = useCallback((newToken: string, newRole: string, newProfile?: any) => {
    Cookies.set("token", newToken, { expires: 7 });
    Cookies.set("role", newRole, { expires: 7 });
    setToken(newToken);
    setRole(newRole);
    if (newProfile) setProfile(newProfile);
    closeLoginModal();
  }, [closeLoginModal]);

  const logout = useCallback(() => {
    Cookies.remove("token");
    Cookies.remove("role");
    setToken(null);
    setRole(null);
    setProfile(null);
    window.location.href = "/"; // redirect to home on logout
  }, []);

  return (
    <AuthContext.Provider value={{
      token, role, profile, isLoginModalOpen,
      openLoginModal, closeLoginModal, requireAuth,
      login, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

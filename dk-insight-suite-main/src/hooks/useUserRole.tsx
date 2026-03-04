import { useAuth } from "./useAuth";

export function useUserRole() {
  const { user } = useAuth();
  return {
    role: user?.role || "employee",
    isAdmin: user?.role === "admin" || user?.role === "super_admin",
    isSuperAdmin: user?.role === "super_admin",
    isIT: user?.role === "it",
  };
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUserRoles = () => {
  return useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { roles: [], activeRole: null };

      // Get all roles for this user
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      // Get active role from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_role")
        .eq("id", user.id)
        .single();

      return {
        roles: userRoles?.map(r => r.role) || [],
        activeRole: profile?.active_role || null,
      };
    },
  });
};

export const useSwitchRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRole: "farmer" | "farm_worker" | "admin" | "super_admin") => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ active_role: newRole })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Role switched successfully");
    },
    onError: () => {
      toast.error("Failed to switch role");
    },
  });
};

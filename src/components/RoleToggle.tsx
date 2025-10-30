import { Button } from "@/components/ui/button";
import { useUserRoles, useSwitchRole } from "@/hooks/useUserRoles";
import { Badge } from "@/components/ui/badge";

export const RoleToggle = () => {
  const { data } = useUserRoles();
  const switchRole = useSwitchRole();

  if (!data || data.roles.length <= 1) return null;

  const handleToggle = () => {
    const newRole = data.activeRole === "farmer" ? "farm_worker" : "farmer";
    switchRole.mutate(newRole);
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-sm">
        {data.activeRole === "farmer" ? "🌾 Farmer" : "👨‍🌾 Farm Worker"}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={switchRole.isPending}
      >
        Switch to {data.activeRole === "farmer" ? "Farm Worker" : "Farmer"}
      </Button>
    </div>
  );
};

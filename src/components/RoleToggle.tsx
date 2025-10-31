import { Button } from "@/components/ui/button";
import { useUserRoles, useSwitchRole } from "@/hooks/useUserRoles";
import { Badge } from "@/components/ui/badge";

export const RoleToggle = () => {
  const { data, isLoading } = useUserRoles();
  const switchRole = useSwitchRole();

  if (isLoading || !data) return null;

  const handleToggle = () => {
    const newRole = data.activeRole === "farmer" ? "farm_worker" : "farmer";
    switchRole.mutate(newRole);
  };

  const hasMultipleRoles = data.roles.length > 1;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-sm">
        {data.activeRole === "farmer" ? "🌾 Farmer" : "👨‍🌾 Farm Worker"}
      </Badge>
      {hasMultipleRoles && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          disabled={switchRole.isPending}
        >
          Switch to {data.activeRole === "farmer" ? "Farm Worker" : "Farmer"}
        </Button>
      )}
    </div>
  );
};

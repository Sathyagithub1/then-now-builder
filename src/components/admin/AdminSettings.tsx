import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AppSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  is_encrypted: boolean;
}

export const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .order("key");
      
      if (error) throw error;
      return data as AppSetting[];
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("app_settings")
        .update({ 
          value, 
          updated_by: session?.user.id,
          updated_at: new Date().toISOString()
        })
        .eq("key", key);
      
      if (error) throw error;
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success(`${key} updated successfully`);
      setEditedValues(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update setting");
    }
  });

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    const value = editedValues[key];
    if (value !== undefined) {
      updateSettingMutation.mutate({ key, value });
    }
  };

  const isSecretKey = (key: string) => {
    return key.includes("SECRET") || key.includes("KEY") || key.includes("AUTH");
  };

  const getSettingsByCategory = () => {
    if (!settings) return { msg91: [], razorpay: [], general: [] };

    return {
      msg91: settings.filter(s => s.key.startsWith("MSG91")),
      razorpay: settings.filter(s => s.key.startsWith("RAZORPAY")),
      general: settings.filter(s => !s.key.startsWith("MSG91") && !s.key.startsWith("RAZORPAY"))
    };
  };

  const categories = getSettingsByCategory();

  if (isLoading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  const renderSettingField = (setting: AppSetting) => {
    const isSecret = isSecretKey(setting.key);
    const showValue = showSecrets[setting.key];
    const currentValue = editedValues[setting.key] ?? setting.value ?? "";
    const hasChanges = editedValues[setting.key] !== undefined;

    if (setting.key === "SMS_ENABLED") {
      return (
        <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label className="text-base font-medium">SMS Notifications</Label>
            <p className="text-sm text-muted-foreground">{setting.description}</p>
          </div>
          <Switch
            checked={setting.value === "true"}
            onCheckedChange={(checked) => {
              updateSettingMutation.mutate({ key: setting.key, value: checked ? "true" : "false" });
            }}
          />
        </div>
      );
    }

    return (
      <div key={setting.id} className="space-y-2 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <Label htmlFor={setting.key} className="text-base font-medium">
            {setting.key.replace(/_/g, " ")}
          </Label>
          {isSecret && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleShowSecret(setting.key)}
            >
              {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{setting.description}</p>
        <div className="flex gap-2">
          <Input
            id={setting.key}
            type={isSecret && !showValue ? "password" : "text"}
            value={currentValue}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            placeholder={`Enter ${setting.key.toLowerCase().replace(/_/g, " ")}`}
            className="flex-1"
          />
          {hasChanges && (
            <Button 
              onClick={() => handleSave(setting.key)}
              disabled={updateSettingMutation.isPending}
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          These settings are sensitive. Changes take effect immediately. 
          Keep your API keys secure and never share them publicly.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>📱 MSG91 Configuration</CardTitle>
          <CardDescription>
            Configure MSG91 for sending SMS notifications to users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.msg91.map(renderSettingField)}
          {categories.msg91.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No MSG91 settings found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💳 Razorpay Configuration</CardTitle>
          <CardDescription>
            Configure Razorpay for processing payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.razorpay.map(renderSettingField)}
          {categories.razorpay.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No Razorpay settings found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚙️ General Settings</CardTitle>
          <CardDescription>
            General application configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.general.map(renderSettingField)}
          {categories.general.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No general settings found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

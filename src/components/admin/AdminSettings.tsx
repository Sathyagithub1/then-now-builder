import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SettingsCategory } from "./SettingsCategory";

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

  const getSettingsByCategory = () => {
    if (!settings) return { msg91: [], twilio: [], razorpay: [], stripe: [], paypal: [], general: [] };

    return {
      msg91: settings.filter(s => s.key.startsWith("MSG91")),
      twilio: settings.filter(s => s.key.startsWith("TWILIO")),
      razorpay: settings.filter(s => s.key.startsWith("RAZORPAY")),
      stripe: settings.filter(s => s.key.startsWith("STRIPE")),
      paypal: settings.filter(s => s.key.startsWith("PAYPAL")),
      general: settings.filter(s => 
        !s.key.startsWith("MSG91") && 
        !s.key.startsWith("TWILIO") && 
        !s.key.startsWith("RAZORPAY") &&
        !s.key.startsWith("STRIPE") &&
        !s.key.startsWith("PAYPAL")
      )
    };
  };

  const categories = getSettingsByCategory();

  if (isLoading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          These settings are sensitive. Changes take effect immediately. 
          Keep your API keys secure and never share them publicly.
        </AlertDescription>
      </Alert>

      <SettingsCategory
        title="MSG91 Configuration"
        description="Configure MSG91 for sending SMS notifications in India"
        icon="📱"
        settings={categories.msg91}
        showSecrets={showSecrets}
        editedValues={editedValues}
        onToggleSecret={toggleShowSecret}
        onValueChange={handleValueChange}
        onSave={handleSave}
        isPending={updateSettingMutation.isPending}
      />

      <SettingsCategory
        title="Twilio Configuration"
        description="Configure Twilio for global SMS notifications"
        icon="📞"
        settings={categories.twilio}
        showSecrets={showSecrets}
        editedValues={editedValues}
        onToggleSecret={toggleShowSecret}
        onValueChange={handleValueChange}
        onSave={handleSave}
        isPending={updateSettingMutation.isPending}
      />

      <SettingsCategory
        title="Razorpay Configuration"
        description="Configure Razorpay for Indian payments (UPI, cards, net banking)"
        icon="💳"
        settings={categories.razorpay}
        showSecrets={showSecrets}
        editedValues={editedValues}
        onToggleSecret={toggleShowSecret}
        onValueChange={handleValueChange}
        onSave={handleSave}
        isPending={updateSettingMutation.isPending}
      />

      <SettingsCategory
        title="Stripe Configuration"
        description="Configure Stripe for global card payments"
        icon="💰"
        settings={categories.stripe}
        showSecrets={showSecrets}
        editedValues={editedValues}
        onToggleSecret={toggleShowSecret}
        onValueChange={handleValueChange}
        onSave={handleSave}
        isPending={updateSettingMutation.isPending}
      />

      <SettingsCategory
        title="PayPal Configuration"
        description="Configure PayPal for international payments"
        icon="🅿️"
        settings={categories.paypal}
        showSecrets={showSecrets}
        editedValues={editedValues}
        onToggleSecret={toggleShowSecret}
        onValueChange={handleValueChange}
        onSave={handleSave}
        isPending={updateSettingMutation.isPending}
      />

      <SettingsCategory
        title="General Settings"
        description="General application configuration"
        icon="⚙️"
        settings={categories.general}
        showSecrets={showSecrets}
        editedValues={editedValues}
        onToggleSecret={toggleShowSecret}
        onValueChange={handleValueChange}
        onSave={handleSave}
        isPending={updateSettingMutation.isPending}
      />
    </div>
  );
};

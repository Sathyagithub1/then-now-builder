import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Shield, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsCategory } from "./SettingsCategory";

interface AppSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  is_encrypted: boolean;
}

const PaymentGatewayStatus = ({ title, icon, description, secretKeys }: {
  title: string;
  icon: string;
  description: string;
  secretKeys: string[];
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>{icon} {title}</span>
        <Badge variant="outline">
          <Shield className="h-3 w-3 mr-1" /> Cloud Secrets
        </Badge>
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Payment gateway credentials are managed securely via Cloud environment variables.
        They are <strong>never stored in the database</strong>.
      </p>
      <div className="text-sm">
        <p className="font-medium mb-1">Required secrets:</p>
        <ul className="list-disc ml-5 text-muted-foreground space-y-0.5">
          {secretKeys.map(k => <li key={k}><code className="bg-muted px-1 rounded text-xs">{k}</code></li>)}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <ExternalLink className="h-3 w-3" />
        Add these via Lovable Cloud → Secrets when ready to integrate.
      </p>
    </CardContent>
  </Card>
);

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
    if (!settings) return { msg91: [], twilio: [], general: [] };

    return {
      msg91: settings.filter(s => s.key.startsWith("MSG91")),
      twilio: settings.filter(s => s.key.startsWith("TWILIO")),
      general: settings.filter(s => 
        !s.key.startsWith("MSG91") && 
        !s.key.startsWith("TWILIO")
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
          Payment gateway secrets are managed via Cloud environment variables and are never stored in the database.
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

      <PaymentGatewayStatus
        title="Razorpay"
        icon="💳"
        description="Indian payments (UPI, cards, net banking) — secrets managed via Cloud"
        secretKeys={["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]}
      />

      <PaymentGatewayStatus
        title="Stripe"
        icon="💰"
        description="Global card payments — secrets managed via Cloud"
        secretKeys={["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]}
      />

      <PaymentGatewayStatus
        title="PayPal"
        icon="🅿️"
        description="International payments — secrets managed via Cloud"
        secretKeys={["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"]}
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

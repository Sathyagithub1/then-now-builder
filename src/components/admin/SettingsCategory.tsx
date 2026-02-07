import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Eye, EyeOff } from "lucide-react";

interface AppSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  is_encrypted: boolean;
}

interface SettingsCategoryProps {
  title: string;
  description: string;
  icon: string;
  settings: AppSetting[];
  showSecrets: Record<string, boolean>;
  editedValues: Record<string, string>;
  onToggleSecret: (key: string) => void;
  onValueChange: (key: string, value: string) => void;
  onSave: (key: string) => void;
  isPending: boolean;
}

export const SettingsCategory = ({
  title,
  description,
  icon,
  settings,
  showSecrets,
  editedValues,
  onToggleSecret,
  onValueChange,
  onSave,
  isPending,
}: SettingsCategoryProps) => {
  const isSecretKey = (key: string) => {
    return key.includes("SECRET") || key.includes("KEY") || key.includes("AUTH") || key.includes("TOKEN");
  };

  const renderSettingField = (setting: AppSetting) => {
    const isSecret = isSecretKey(setting.key);
    const showValue = showSecrets[setting.key];
    const currentValue = editedValues[setting.key] ?? setting.value ?? "";
    const hasChanges = editedValues[setting.key] !== undefined;

    // Toggle switch for boolean settings
    if (setting.key.includes("ENABLED") || setting.key === "SMS_ENABLED") {
      return (
        <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label className="text-base font-medium">
              {setting.key.replace(/_/g, " ")}
            </Label>
            <p className="text-sm text-muted-foreground">{setting.description}</p>
          </div>
          <Switch
            checked={setting.value === "true"}
            onCheckedChange={(checked) => {
              onValueChange(setting.key, checked ? "true" : "false");
              // Auto-save toggle changes
              setTimeout(() => onSave(setting.key), 100);
            }}
          />
        </div>
      );
    }

    // Dropdown for mode settings
    if (setting.key.includes("MODE") || setting.key === "SMS_PROVIDER") {
      const options = setting.key === "SMS_PROVIDER" 
        ? [{ value: "msg91", label: "MSG91 (India)" }, { value: "twilio", label: "Twilio (Global)" }]
        : [{ value: "sandbox", label: "Sandbox (Testing)" }, { value: "live", label: "Live (Production)" }];

      return (
        <div key={setting.id} className="space-y-2 p-4 border rounded-lg">
          <Label className="text-base font-medium">
            {setting.key.replace(/_/g, " ")}
          </Label>
          <p className="text-sm text-muted-foreground">{setting.description}</p>
          <div className="flex gap-2">
            <Select
              value={currentValue}
              onValueChange={(value) => {
                onValueChange(setting.key, value);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {options.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasChanges && (
              <Button onClick={() => onSave(setting.key)} disabled={isPending}>
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      );
    }

    // Default text/password input
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
              onClick={() => onToggleSecret(setting.key)}
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
            onChange={(e) => onValueChange(setting.key, e.target.value)}
            placeholder={`Enter ${setting.key.toLowerCase().replace(/_/g, " ")}`}
            className="flex-1"
          />
          {hasChanges && (
            <Button onClick={() => onSave(setting.key)} disabled={isPending}>
              <Save className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{icon} {title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.map(renderSettingField)}
        {settings.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No settings found</p>
        )}
      </CardContent>
    </Card>
  );
};

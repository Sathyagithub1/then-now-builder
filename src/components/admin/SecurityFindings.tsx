import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SecurityFinding {
  source: string;
  finding: {
    id: string;
    internal_id: string;
    name: string;
    description: string;
    details: string;
    level: "error" | "warn" | "info";
    category: string;
    remediation_difficulty: string;
    ignore: boolean;
    link: string;
  };
}

const securityFindings: SecurityFinding[] = [
  {
    source: "agent_security",
    finding: {
      description: "The profiles table contains highly sensitive PII including mobile numbers, email addresses, government ID numbers (Aadhaar, passport, election card, ration card), and complete banking details (account number, IFSC code, holder name, UPI ID). While RLS restricts users to viewing only their own profiles, any authentication compromise could expose complete financial and identity information.",
      internal_id: "profiles_pii_exposure",
      id: "PUBLIC_DATA_EXPOSURE",
      level: "error",
      ignore: false,
      remediation_difficulty: "medium",
      details: "**MITIGATED**: Added audit logging and data separation:\n\n1. **Audit logging tables** - `profile_access_logs` tracks who accessed sensitive profile data\n2. **Sensitive data view** - `profile_sensitive_data` view isolates sensitive fields\n3. **Function for logging** - `log_profile_access()` function for explicit audit trails\n4. **Admin audit logs** - `function_audit_logs` table for edge function monitoring\n\n**Remaining recommendations:**\n- Implement field-level encryption for bank account and government ID fields\n- Consider MFA for accessing financial information\n- The core RLS policy remains unchanged (users can only view their own data)",
      category: "Sensitive Data",
      name: "Profile table exposes highly sensitive personal information",
      link: "https://docs.lovable.dev/features/security"
    }
  },
  {
    source: "agent_security",
    finding: {
      category: "Edge Function",
      name: "Notifications edge function lacks authentication",
      description: "The send-notifications edge function has no authentication mechanism, allowing anyone to trigger SMS notifications and potentially abuse the SMS service.",
      remediation_difficulty: "low",
      level: "error",
      link: "https://docs.lovable.dev/features/security",
      id: "OPEN_ENDPOINTS",
      details: "**FIXED**: The edge function now requires authentication:\n\n1. **Cron secret validation** - Accepts `x-cron-secret` header for scheduled invocations\n2. **Admin JWT validation** - Accepts Bearer token and verifies user is admin/super_admin\n3. **Audit logging** - All invocations are logged to `function_audit_logs` table\n4. **Unauthorized requests are rejected** with 401 status\n\n**Next Steps:**\n- Add `NOTIFICATION_CRON_SECRET` to Supabase secrets\n- Update the cron job to include the secret in request headers",
      ignore: false,
      internal_id: "send_notifications_no_auth"
    }
  },
  {
    source: "agent_security",
    finding: {
      level: "error",
      ignore: false,
      link: "https://docs.lovable.dev/features/security",
      details: "**PARTIALLY FIXED**: The edge function now prioritizes Supabase secrets over database storage:\n\n1. **Environment variables first** - SMS credentials (MSG91_AUTH_KEY, TWILIO_*) are read from Supabase secrets\n2. **Database fallback** - Only used for backwards compatibility\n3. **Non-sensitive settings** - Only configuration (enabled flags, sender IDs) read from database\n\n**To complete the fix:**\n1. Add SMS API keys as Supabase secrets using the Secrets tool\n2. Remove sensitive keys from app_settings table after migration\n3. Payment gateway secrets should also be migrated to Supabase secrets",
      name: "Application secrets stored unencrypted in database",
      remediation_difficulty: "low",
      category: "Secret Management",
      internal_id: "app_settings_unencrypted",
      description: "The app_settings table stores sensitive API keys and secrets (MSG91, Twilio, Razorpay, Stripe, PayPal) in plaintext, accessible to super_admin users. This creates risk if admin accounts are compromised.",
      id: "SECRETS_EXPOSED"
    }
  }
];

const getLevelIcon = (level: string) => {
  switch (level) {
    case "error":
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    case "warn":
      return <Info className="h-5 w-5 text-yellow-500" />;
    default:
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  }
};

const getLevelBadge = (level: string) => {
  switch (level) {
    case "error":
      return <Badge variant="destructive">Critical</Badge>;
    case "warn":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
    default:
      return <Badge variant="secondary">Info</Badge>;
  }
};

const getDifficultyBadge = (difficulty: string) => {
  switch (difficulty) {
    case "low":
      return <Badge variant="outline" className="border-green-500 text-green-600">Easy Fix</Badge>;
    case "medium":
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium</Badge>;
    case "high":
      return <Badge variant="outline" className="border-red-500 text-red-600">Complex</Badge>;
    default:
      return <Badge variant="outline">{difficulty}</Badge>;
  }
};

const formatDetails = (details: string) => {
  // Convert markdown-like formatting to JSX
  const lines = details.split('\n');
  return lines.map((line, index) => {
    if (line.startsWith('**') && line.includes('**:')) {
      const match = line.match(/\*\*(.+?)\*\*:?(.*)/);
      if (match) {
        return (
          <p key={index} className="mt-3 first:mt-0">
            <strong className="text-foreground">{match[1]}</strong>{match[2]}
          </p>
        );
      }
    }
    if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return (
        <li key={index} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: content }} />
      );
    }
    if (line.startsWith('- ')) {
      const content = line.replace(/^-\s/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return (
        <li key={index} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: content }} />
      );
    }
    if (line.trim() === '') return null;
    return <p key={index}>{line}</p>;
  });
};

export const SecurityFindings = () => {
  const criticalCount = securityFindings.filter(f => f.finding.level === "error").length;
  const warningCount = securityFindings.filter(f => f.finding.level === "warn").length;

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Security Overview</AlertTitle>
        <AlertDescription>
          Found {criticalCount} critical issues and {warningCount} warnings. 
          Review and address these findings to improve your application's security posture.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4 text-yellow-500" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{warningCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Mitigated</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Findings</CardTitle>
          <CardDescription>Detailed list of security issues and their remediation status</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {securityFindings.map((item, index) => (
              <AccordionItem key={item.finding.internal_id} value={`item-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    {getLevelIcon(item.finding.level)}
                    <div className="flex-1">
                      <div className="font-medium">{item.finding.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Badge variant="outline">{item.finding.category}</Badge>
                        {getLevelBadge(item.finding.level)}
                        {getDifficultyBadge(item.finding.remediation_difficulty)}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                      <p className="text-sm">{item.finding.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Details & Remediation</h4>
                      <div className="text-sm bg-muted/50 p-4 rounded-lg">
                        {formatDetails(item.finding.details)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">ID:</span>
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">{item.finding.id}</code>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

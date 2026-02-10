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
      description: "Sensitive PII (email, mobile number) has been moved to a dedicated profile_sensitive_data table with strict RLS. Banking details, government IDs, and unnecessary fields have been completely removed from the database.",
      internal_id: "profiles_pii_exposure",
      id: "PUBLIC_DATA_EXPOSURE",
      level: "info",
      ignore: false,
      remediation_difficulty: "low",
      details: "**RESOLVED**: Complete schema cleanup performed:\n\n1. **Removed banking fields** - bank_account_number, bank_ifsc_code, bank_account_holder_name, upi_id dropped\n2. **Removed gov ID fields** - passport_number, election_card_number, ration_card_number, gov_id_number, gov_id_type dropped\n3. **Separated sensitive data** - email and mobile_number moved to profile_sensitive_data table\n4. **Strict RLS** - Users can only access their own sensitive data; admins have read access for support\n5. **Trigger updates** - All notification triggers updated to read from the new table",
      category: "Sensitive Data",
      name: "Profile PII exposure — RESOLVED",
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
      level: "info",
      ignore: false,
      link: "https://docs.lovable.dev/features/security",
      details: "**RESOLVED**: Payment gateway secrets fully removed from database:\n\n1. **Razorpay, Stripe, PayPal** credentials deleted from app_settings table\n2. **Cloud environment variables** used exclusively for payment gateway secrets\n3. **SMS credentials** prioritized from Cloud secrets with database fallback\n4. **Database stores only** non-sensitive config (enabled flags, modes, sender IDs)\n5. **Admin UI** shows integration status cards instead of editable secret fields",
      name: "Application secrets management — RESOLVED",
      remediation_difficulty: "low",
      category: "Secret Management",
      internal_id: "app_settings_unencrypted",
      description: "Payment gateway secrets (Razorpay, Stripe, PayPal) are no longer stored in the database. They are managed exclusively via Cloud environment variables and used only during integration.",
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

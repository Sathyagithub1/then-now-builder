import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface PaymentStatusProps {
  transaction: {
    id: string;
    amount: number;
    commission_amount: number;
    net_amount: number;
    status: string;
    payment_gateway: string;
    created_at: string;
    held_at?: string;
    released_at?: string;
    refunded_at?: string;
  };
}

export const PaymentStatus = ({ transaction }: PaymentStatusProps) => {
  const getStatusIcon = () => {
    switch (transaction.status) {
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />;
      case "held":
        return <AlertTriangle className="h-5 w-5 text-accent-foreground" />;
      case "released":
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case "refunded":
        return <RefreshCw className="h-5 w-5 text-secondary-foreground" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      held: "outline",
      released: "default",
      refunded: "secondary",
      failed: "destructive"
    };
    return (
      <Badge variant={variants[transaction.status] || "secondary"}>
        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
      </Badge>
    );
  };

  const getStatusMessage = () => {
    switch (transaction.status) {
      case "pending":
        return "Payment is being processed";
      case "held":
        return "Payment held in escrow until job completion";
      case "released":
        return "Payment has been released to the worker";
      case "refunded":
        return "Payment has been refunded";
      case "failed":
        return "Payment failed - please try again";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStatusIcon()}
            Payment Details
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Total Amount:</span>
            <p className="font-semibold">₹{transaction.amount}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Commission:</span>
            <p className="font-medium text-muted-foreground">₹{transaction.commission_amount}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Net to Worker:</span>
            <p className="font-semibold text-primary">₹{transaction.net_amount}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Gateway:</span>
            <p className="capitalize">{transaction.payment_gateway}</p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
          {getStatusMessage()}
        </p>

        {transaction.held_at && (
          <p className="text-xs text-muted-foreground">
            Held on: {new Date(transaction.held_at).toLocaleDateString()}
          </p>
        )}
        {transaction.released_at && (
          <p className="text-xs text-muted-foreground">
            Released on: {new Date(transaction.released_at).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileText, Download } from "lucide-react";

interface Invoice {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  mpesaReceiptNumber: string | null;
  issuedAt: string;
  paidAt: string | null;
}

export default function BillingPage() {
  const { clinic } = useClinic();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices", clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      if (!clinic?.id) return [];

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("issued_at", { ascending: false });

      if (error || !data) {
        console.error("Error fetching invoices", error);
        return [];
      }

      return data.map((row) => ({
        id: row.id,
        amount: row.amount,
        status: row.status,
        paymentMethod: row.payment_method,
        mpesaReceiptNumber: row.mpesa_receipt_number,
        issuedAt: row.issued_at,
        paidAt: row.paid_at,
      }));
    },
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Billing & Invoices</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View your payment history and download invoices
          </p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <FileText className="mr-2 h-4 w-4" />
          Payment Methods
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading invoices...</p>}
          {!isLoading && (!invoices || invoices.length === 0) && (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No invoices yet</p>
              <p className="text-xs text-muted-foreground">
                Your invoices will appear here once you start making payments
              </p>
            </div>
          )}
          {!isLoading && invoices && invoices.length > 0 && (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-md border bg-card px-3 sm:px-4 py-3"
                >
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm sm:text-base">
                          KES {invoice.amount.toLocaleString()}
                        </span>
                        <Badge
                          variant={
                            invoice.status === "paid"
                              ? "default"
                              : invoice.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs capitalize"
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Issued {format(new Date(invoice.issuedAt), "MMM dd, yyyy")}
                        {invoice.paidAt && ` • Paid ${format(new Date(invoice.paidAt), "MMM dd, yyyy")}`}
                      </div>
                      {invoice.mpesaReceiptNumber && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          M-Pesa: {invoice.mpesaReceiptNumber}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="self-end sm:self-auto">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

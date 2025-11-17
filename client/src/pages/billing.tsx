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
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Billing & Invoices</h1>
          <p className="text-sm text-muted-foreground">
            View your payment history and download invoices
          </p>
        </div>
        <Button variant="outline">
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
                  className="flex items-center justify-between rounded-md border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
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
                      <div className="text-xs text-muted-foreground">
                        Issued {format(new Date(invoice.issuedAt), "MMM dd, yyyy")}
                        {invoice.paidAt && ` • Paid ${format(new Date(invoice.paidAt), "MMM dd, yyyy")}`}
                      </div>
                      {invoice.mpesaReceiptNumber && (
                        <div className="text-xs text-muted-foreground">
                          M-Pesa: {invoice.mpesaReceiptNumber}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
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

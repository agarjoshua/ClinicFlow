import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinicScope, useRequiredClinicId } from "@/hooks/use-clinic-scope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Hospital {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  color: string;
  created_at: string;
}

export default function Hospitals() {
  const { toast } = useToast();
  const scopeToClinic = useClinicScope();
  const clinicId = useRequiredClinicId();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    color: "#3b82f6",
  });

  // Fetch hospitals
  const { data: hospitals, isLoading } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Hospital[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingHospital) {
        const { error } = await supabase
          .from("hospitals")
          .update(data)
          .eq("id", editingHospital.id);
        if (error) throw error;
      } else {
        const payload = clinicId ? { ...data, clinic_id: clinicId } : data;
        const { error } = await supabase
          .from("hospitals")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      toast({
        title: editingHospital ? "Hospital updated" : "Hospital created",
        description: `${formData.name} has been ${editingHospital ? "updated" : "added"} successfully.`,
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hospitals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      toast({
        title: "Hospital deleted",
        description: "The hospital has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (hospital?: Hospital) => {
    if (hospital) {
      setEditingHospital(hospital);
      setFormData({
        name: hospital.name,
        code: hospital.code,
        address: hospital.address || "",
        phone: hospital.phone || "",
        color: hospital.color,
      });
    } else {
      setEditingHospital(null);
      setFormData({
        name: "",
        code: "",
        address: "",
        phone: "",
        color: "#3b82f6",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingHospital(null);
    setFormData({
      name: "",
      code: "",
      address: "",
      phone: "",
      color: "#3b82f6",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold">Hospitals</h1>
          <p className="text-gray-600 mt-1">Manage hospital and clinic locations</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Hospital
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Hospital Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading hospitals...</div>
          ) : hospitals && hospitals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitals.map((hospital) => (
                    <TableRow key={hospital.id}>
                      <TableCell className="font-medium">{hospital.name}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {hospital.code}
                        </code>
                      </TableCell>
                      <TableCell className="text-gray-600">{hospital.address || "—"}</TableCell>
                      <TableCell className="text-gray-600">{hospital.phone || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: hospital.color }}
                          />
                          <span className="text-sm text-gray-500">{hospital.color}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(hospital)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete ${hospital.name}?`)) {
                                deleteMutation.mutate(hospital.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hospitals added yet</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Hospital
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingHospital ? "Edit Hospital" : "Add New Hospital"}
              </DialogTitle>
              <DialogDescription>
                {editingHospital
                  ? "Update the hospital information below."
                  : "Enter the details for the new hospital location."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Hospital Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Synergy Hospital"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., SYNERGY"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Hospital address"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contact number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Calendar Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Saving..."
                  : editingHospital
                  ? "Update Hospital"
                  : "Add Hospital"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

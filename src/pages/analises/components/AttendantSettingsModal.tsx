import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Attendant {
  id: string;
  full_name: string;
  utm_identifier: string;
  created_at: string;
}

interface AttendantFormData {
  full_name: string;
  utm_identifier: string;
}

interface AttendantSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendantSettingsModal({ open, onOpenChange }: AttendantSettingsModalProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState<Attendant | null>(null);
  const [attendantToDelete, setAttendantToDelete] = useState<Attendant | null>(null);
  const [formData, setFormData] = useState<AttendantFormData>({
    full_name: "",
    utm_identifier: "",
  });

  const queryClient = useQueryClient();

  // Fetch attendants
  const { data: attendants, isLoading } = useQuery({
    queryKey: ["attendants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Attendant[];
    },
  });

  // Create attendant mutation
  const createMutation = useMutation({
    mutationFn: async (data: AttendantFormData) => {
      const { error } = await supabase
        .from("attendants")
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendants"] });
      toast.success("Atendente criado com sucesso!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao criar atendente: " + error.message);
    },
  });

  // Update attendant mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AttendantFormData }) => {
      const { error } = await supabase
        .from("attendants")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendants"] });
      toast.success("Atendente atualizado com sucesso!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar atendente: " + error.message);
    },
  });

  // Delete attendant mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("attendants")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendants"] });
      toast.success("Atendente excluído com sucesso!");
      setDeleteDialogOpen(false);
      setAttendantToDelete(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir atendente: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ full_name: "", utm_identifier: "" });
    setEditingAttendant(null);
    setFormOpen(false);
  };

  const handleAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (attendant: Attendant) => {
    setEditingAttendant(attendant);
    setFormData({
      full_name: attendant.full_name,
      utm_identifier: attendant.utm_identifier,
    });
    setFormOpen(true);
  };

  const handleDelete = (attendant: Attendant) => {
    setAttendantToDelete(attendant);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.utm_identifier.trim()) {
      toast.error("Todos os campos são obrigatórios!");
      return;
    }

    if (editingAttendant) {
      updateMutation.mutate({ id: editingAttendant.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const confirmDelete = () => {
    if (attendantToDelete) {
      deleteMutation.mutate(attendantToDelete.id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gerenciar Atendentes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Gerencie os atendentes que serão usados na análise de vendas.
              </p>
              <Button onClick={handleAdd} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Atendente
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Carregando atendentes...</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Completo</TableHead>
                      <TableHead>Identificador UTM</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendants?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Nenhum atendente cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendants?.map((attendant) => (
                        <TableRow key={attendant.id}>
                          <TableCell className="font-medium">
                            {attendant.full_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {attendant.utm_identifier}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(attendant)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(attendant)}
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Attendant Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAttendant ? "Editar Atendente" : "Adicionar Atendente"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Digite o nome completo do atendente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="utm_identifier">Identificador UTM</Label>
              <Input
                id="utm_identifier"
                type="text"
                value={formData.utm_identifier}
                onChange={(e) =>
                  setFormData({ ...formData, utm_identifier: e.target.value })
                }
                placeholder="Ex: atendimento-joao, atendimento-maria"
                required
              />
              <p className="text-xs text-muted-foreground">
                Este identificador será usado para filtrar vendas no utm_medium
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : editingAttendant
                  ? "Atualizar"
                  : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o atendente "{attendantToDelete?.full_name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
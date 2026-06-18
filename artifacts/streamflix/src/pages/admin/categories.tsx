import { useState } from "react";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash2, Plus } from "lucide-react";

interface CatForm { name: string; description: string; }
const emptyForm: CatForm = { name: "", description: "" };

export default function AdminCategories() {
  const { data: categories, isLoading, refetch } = useListCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CatForm>(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (cat: any) => {
    setForm({ name: cat.name || "", description: cat.description || "" });
    setEditingId(cat.id);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, description: form.description || undefined };
    if (editingId) {
      updateCategory.mutate({ id: editingId, data: payload }, { onSuccess: () => { setModalOpen(false); refetch(); } });
    } else {
      createCategory.mutate({ data: payload }, { onSuccess: () => { setModalOpen(false); refetch(); } });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer cette catégorie ?")) {
      deleteCategory.mutate({ id }, { onSuccess: () => refetch() });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Gérer les catégories</h1>
            <p className="text-muted-foreground mt-1">Organisez le contenu par catégories</p>
          </div>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-white font-bold">
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden max-w-4xl">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-14">ID</TableHead>
                <TableHead className="text-muted-foreground">Nom</TableHead>
                <TableHead className="text-muted-foreground">Description</TableHead>
                <TableHead className="text-muted-foreground">Créée le</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chargement…</TableCell>
                </TableRow>
              ) : categories?.map(cat => (
                <TableRow key={cat.id} className="border-border hover:bg-secondary/30">
                  <TableCell className="font-medium text-muted-foreground text-xs">{cat.id}</TableCell>
                  <TableCell className="font-bold text-white">{cat.name}</TableCell>
                  <TableCell className="text-gray-300 text-sm max-w-xs truncate">{cat.description || "—"}</TableCell>
                  <TableCell className="text-gray-300 text-sm">{new Date(cat.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white h-8 w-8" onClick={() => openEdit(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-destructive h-8 w-8"
                        onClick={() => handleDelete(cat.id)} disabled={deleteCategory.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {categories?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune catégorie trouvée</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingId ? "Modifier la catégorie" : "Ajouter une catégorie"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-white font-medium">Nom *</Label>
              <Input required value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nom de la catégorie" className="bg-secondary/50 border-border text-white" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white font-medium">Description</Label>
              <Textarea value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Description optionnelle…" rows={3}
                className="resize-none bg-secondary/50 border-border text-white" />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}
                className="border-border text-white hover:bg-secondary">
                Annuler
              </Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}
                className="bg-primary hover:bg-primary/90 text-white font-bold">
                {editingId ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

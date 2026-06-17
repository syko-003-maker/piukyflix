import { useListCategories, useDeleteCategory } from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Plus } from "lucide-react";

export default function AdminCategories() {
  const { data: categories, isLoading, refetch } = useListCategories();
  const deleteCategory = useDeleteCategory();

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      deleteCategory.mutate({ id }, {
        onSuccess: () => refetch()
      });
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
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden max-w-4xl">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-16">ID</TableHead>
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
                  <TableCell className="font-medium text-white">{cat.id}</TableCell>
                  <TableCell className="font-medium text-white">{cat.name}</TableCell>
                  <TableCell className="text-gray-300">{cat.description || "—"}</TableCell>
                  <TableCell className="text-gray-300">{new Date(cat.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-destructive"
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleteCategory.isPending}
                      >
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
    </div>
  );
}

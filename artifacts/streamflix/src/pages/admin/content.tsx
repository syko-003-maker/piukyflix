import { useListContent, useDeleteContent } from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Plus } from "lucide-react";
import { Link } from "wouter";

export default function AdminContent() {
  const { data: content, isLoading, refetch } = useListContent({ limit: 100 });
  const deleteContent = useDeleteContent();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this content?")) {
      deleteContent.mutate({ id }, {
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
            <h1 className="text-3xl font-bold text-white">Manage Content</h1>
            <p className="text-muted-foreground mt-1">Add, edit, or remove movies and series</p>
          </div>
          {/* Note: Form implementation omitted for brevity in this task, but normally this would open a modal or navigate to a form page */}
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold">
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-16">ID</TableHead>
                <TableHead className="text-muted-foreground">Title</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-muted-foreground">Year</TableHead>
                <TableHead className="text-muted-foreground">Views</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : content?.items.map(item => (
                <TableRow key={item.id} className="border-border hover:bg-secondary/30">
                  <TableCell className="font-medium text-white">{item.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-12 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {item.posterUrl && <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-medium text-white">{item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-gray-300">{item.contentType}</TableCell>
                  <TableCell className="text-gray-300">{item.categoryName || "-"}</TableCell>
                  <TableCell className="text-gray-300">{item.releaseYear || "-"}</TableCell>
                  <TableCell className="text-gray-300">{item.viewCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteContent.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {content?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No content found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
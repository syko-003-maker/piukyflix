import { useListUsers, useDeleteUser, useUpdateUserRole, useGetMe } from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Shield, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = useListUsers();
  const { data: me } = useGetMe();
  const deleteUser = useDeleteUser();
  const updateRole = useUpdateUserRole();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUser.mutate({ userId: id }, {
        onSuccess: () => refetch()
      });
    }
  };

  const handleToggleRole = (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateRole.mutate({ userId: id, data: { role: newRole as any } }, {
      onSuccess: () => refetch()
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Manage Users</h1>
          <p className="text-muted-foreground mt-1">View and manage user accounts and permissions</p>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : users?.map(u => (
                <TableRow key={u.id} className="border-border hover:bg-secondary/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatarUrl || ""} />
                        <AvatarFallback>{u.username?.charAt(0) || u.email.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-white">{u.username || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{u.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      u.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'
                    }`}>
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-300">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={u.role === 'admin' ? "text-primary hover:text-primary/80" : "text-gray-400 hover:text-white"}
                        onClick={() => handleToggleRole(u.id, u.role)}
                        disabled={updateRole.isPending || u.id === me?.id}
                        title={u.role === 'admin' ? "Remove Admin" : "Make Admin"}
                      >
                        {u.role === 'admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-destructive"
                        onClick={() => handleDelete(u.id)}
                        disabled={deleteUser.isPending || u.id === me?.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Mail, Send, CheckCircle } from "lucide-react";

export default function AdminInvite() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "admin" | "moderator">("user");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, message }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Échec de l'envoi");
      }
      setSuccess(true);
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Invitations</h1>
          <p className="text-muted-foreground mt-1">Invitez des utilisateurs à rejoindre PiukyFlix</p>
        </div>

        <div className="max-w-xl">
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">Envoyer une invitation</h2>
            </div>

            {success && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">Invitation envoyée avec succès !</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">Adresse e-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  className="bg-secondary/50 border-border text-white focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-white font-medium">Rôle attribué</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="user">Utilisateur</option>
                  <option value="moderator">Modérateur</option>
                  <option value="admin">Administrateur</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {role === "admin" && "Accès complet au tableau de bord d'administration."}
                  {role === "moderator" && "Peut gérer le contenu mais pas les utilisateurs."}
                  {role === "user" && "Accès standard à la plateforme."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-white font-medium">Message personnalisé (optionnel)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ajoutez un message d'accueil personnalisé..."
                  className="resize-none bg-secondary/50 border-border text-white focus:ring-primary h-24"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Envoyer l'invitation
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

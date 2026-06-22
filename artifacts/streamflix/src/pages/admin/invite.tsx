import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback } from "react";
import { Mail, Send, CheckCircle, RefreshCw, Clock, XCircle, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TiltCard, Reveal } from "@/components/admin/admin-ui";

interface Invitation {
  id: number;
  email: string;
  role: string;
  message: string | null;
  status: "sent" | "failed";
  invitedByEmail: string | null;
  sentAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  moderator: "Modérateur",
  user: "Utilisateur",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  moderator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  user: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export default function AdminInvite() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "admin" | "moderator">("user");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/invitations");
      if (res.ok) setInvitations(await res.json());
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

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
      loadHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (inv: Invitation) => {
    setResendingId(inv.id);
    try {
      const res = await fetch(`/api/admin/invitations/${inv.id}/resend`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Échec du renvoi");
      loadHistory();
    } catch {
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <Reveal>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Invitations</h1>
            <p className="text-muted-foreground mt-1">Invitez des utilisateurs à rejoindre PiukyFlix par e-mail</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Form */}
          <Reveal delay={0.05}>
            <TiltCard
              intensity={4}
              className="rounded-2xl border border-white/10 bg-card p-8 transition-colors duration-300 hover:border-primary/30"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 rounded-xl border border-primary/20">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-white">Envoyer une invitation</h2>
              </div>

              <AnimatePresence mode="wait">
                {success && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mb-6 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
                      <CheckCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm font-medium">Invitation envoyée avec succès !</p>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mb-6 flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                      <XCircle className="h-5 w-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">Adresse e-mail *</Label>
                  <Input
                    id="email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="bg-secondary/50 border-white/10 text-white transition-colors focus:ring-primary focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-white font-medium">Rôle attribué</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as "user" | "admin" | "moderator")}>
                    <SelectTrigger className="h-9 bg-secondary border-white/10 text-white">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="moderator">Modérateur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={role}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-muted-foreground"
                    >
                      {role === "admin" && "Accès complet au tableau de bord d'administration."}
                      {role === "moderator" && "Peut gérer le contenu mais pas les utilisateurs."}
                      {role === "user" && "Accès standard à la plateforme."}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white font-medium">Message personnalisé (optionnel)</Label>
                  <Textarea
                    id="message" value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ajoutez un message d'accueil personnalisé…"
                    className="resize-none bg-secondary/50 border-white/10 text-white transition-colors focus:ring-primary focus:border-primary/50 h-24"
                  />
                </div>

                <Button
                  type="submit" disabled={isLoading || !email}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 transition-transform hover:scale-[1.01] active:scale-[0.99]"
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
            </TiltCard>
          </Reveal>

          {/* History */}
          <Reveal delay={0.12}>
            <div className="rounded-2xl border border-white/10 bg-card p-8 transition-colors duration-300 hover:border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-xl border border-white/10">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Historique</h2>
                    <p className="text-xs text-muted-foreground">{invitations.length} invitation{invitations.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white"
                  onClick={loadHistory} disabled={historyLoading}>
                  <RefreshCw className={`h-4 w-4 ${historyLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {historyLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-secondary/30 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : invitations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">Aucune invitation envoyée</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Les invitations apparaîtront ici</p>
                </motion.div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {invitations.map((inv, i) => (
                      <motion.div
                        key={inv.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-secondary/20 hover:bg-secondary/40 hover:border-white/20 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {inv.status === "sent"
                            ? <CheckCircle className="h-4 w-4 text-green-400" />
                            : <XCircle className="h-4 w-4 text-destructive" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{inv.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${ROLE_COLORS[inv.role] || ROLE_COLORS.user}`}>
                              {ROLE_LABELS[inv.role] || inv.role}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(inv.sentAt).toLocaleDateString("fr-FR", {
                                day: "numeric", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {inv.message && (
                            <p className="text-xs text-muted-foreground/80 mt-1 truncate italic">"{inv.message}"</p>
                          )}
                        </div>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-white flex-shrink-0"
                          onClick={() => handleResend(inv)}
                          disabled={resendingId === inv.id}
                        >
                          {resendingId === inv.id
                            ? <span className="h-3 w-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            : <RefreshCw className="h-3 w-3" />}
                          <span className="ml-1">Renvoyer</span>
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  );
}

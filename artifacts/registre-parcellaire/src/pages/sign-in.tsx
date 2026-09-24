import { useState } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DataSpinner } from "@/components/data-spinner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (isLoading) {
    return <DataSpinner />;
  }

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;

    setIsSubmitting(true);
    try {
      await login({ data: { email, code } });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Échec de connexion",
        description: "Email ou code d'accès incorrect.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Administration</p>
          <h1 className="text-3xl font-bold text-primary mb-2">Registre parcellaire</h1>
          <p className="text-muted-foreground">Connexion à l'espace des agents de Kinshasa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              placeholder="agent@kinshasa.cd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code d'accès</Label>
            <Input
              id="code"
              type="password"
              placeholder="Code fourni par votre administrateur"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Veuillez contacter l'administrateur principal pour obtenir vos identifiants ou un nouveau code d'accès en cas d'oubli.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="bg-muted/30 p-6 rounded-full mb-6">
        <FileQuestion className="h-16 w-16 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
        Page introuvable
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link href="/">
        <Button size="lg" className="gap-2">
          <Home className="h-4 w-4" /> Retour à l'accueil
        </Button>
      </Link>
    </div>
  );
}

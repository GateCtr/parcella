import { SignIn } from "@clerk/react";

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Administration</p>
          <h1 className="text-3xl font-bold text-primary mb-2">Registre parcellaire</h1>
          <p className="text-muted-foreground">Connexion à l’espace des agents de Kinshasa</p>
        </div>
        <SignIn
          path={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sign-in`}
          routing="path"
          appearance={{ elements: { footerAction: { display: "none" } } }}
        />
      </div>
    </div>
  );
}

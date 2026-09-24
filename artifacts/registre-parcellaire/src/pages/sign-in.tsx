import { SignIn } from "@clerk/react";

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Registre Parcellaire</h1>
          <p className="text-muted-foreground">Ville Province de Kinshasa</p>
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

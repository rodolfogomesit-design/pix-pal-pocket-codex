import EmojiBrand from "@/components/branding/EmojiBrand";

export function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="flex justify-center animate-bounce-coin">
          <EmojiBrand size={56} className="rounded-2xl shadow-none" />
        </div>
        <p className="mt-4 font-display text-xl text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

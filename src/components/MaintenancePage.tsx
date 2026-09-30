export function MaintenancePage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <span className="text-5xl">✨</span>
        <h1 className="text-2xl font-bold tracking-tight">Nychthemeron is coming soon!</h1>
        <p className="text-muted-foreground text-base max-w-md">
          It won't be back on October 1. I'm (Ovi) taking a little more time to get everything ready (and, honestly, to get moving).
        </p>
        <p className="text-muted-foreground text-xs">
          Sorry for the delay, and thank you for sticking with Nychthemeron (formerly Genjutsu).
        </p>
        <p className="text-muted-foreground text-sm max-w-md">
          Want Nychthemeron to return? Send me a note at{" "}
          <a
            href="mailto:fornet.ovi@gmail.com?subject=Bring%20Nychthemeron%20back"
            className="font-semibold text-foreground underline underline-offset-4"
          >
            fornet.ovi@gmail.com
          </a>
          . Knowing people are waiting would give me the motivation I need to get back to work.
        </p>
      </div>
    </div>
  );
}

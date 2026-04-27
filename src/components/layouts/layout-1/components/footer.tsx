export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center gap-3 py-5">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 font-normal text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">{currentYear} &copy;</span>
              <span className="text-secondary-foreground font-medium">Roofly</span>
            </div>
            <span className="hidden sm:inline text-muted-foreground/30">|</span>
            <span className="text-muted-foreground/50 italic">Cozy. Connected. Confirmed.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

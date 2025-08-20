
export default function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-card px-6 py-4 rounded-b-2xl shadow-card mb-8">
      <span className="flex items-center gap-3 text-2xl font-bold tracking-wide text-accent">
        <img src="https://ui-avatars.com/api/?name=Z&background=00fff7&color=222&rounded=true&size=36" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-accent" />
        Zeiterfassung
      </span>
  {/* Timer-Anzeige entfernt */}
    </nav>
  );
}

export default function Navbar() {
  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-white">
      <input
        placeholder="Search..."
        className="border rounded-lg px-4 py-2 w-80"
      />

      <div className="flex items-center gap-4">
        <button>🔔</button>
        <div className="h-10 w-10 rounded-full bg-gray-300"></div>
      </div>
    </header>
  );
}
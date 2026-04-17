"use client";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-white text-gray-900">
        <header className="border-b border-gray-200">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Warisan Digital</h1>
            <ul className="flex gap-6">
              <li>
                <a href="/" className="hover:text-blue-600">
                  Beranda
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-blue-600">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-blue-600">
                  Login
                </a>
              </li>
            </ul>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>

        <footer className="border-t border-gray-200 mt-12 py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
            <p>
              © 2024 Warisan Digital. Sistem Warisan Digital Terdesentralisasi
              berbasis Blockchain.
            </p>
            <p className="mt-2">Sesuai KUHPerdata Pasal 913-915 & UU ITE Pasal 11</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

"use client";

export default function Home() {
  return (
    <div>
      <section className="text-center py-12">
        <h1 className="text-5xl font-bold mb-4">
          Sistem Warisan Digital Terdesentralisasi
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Platform blockchain untuk mengelola wasiat digital dengan aman, legal,
          dan transparan
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/wasiat/buat"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Buat Wasiat
          </a>
          <a
            href="/login"
            className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
          >
            Login
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 my-16">
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">🔒 Aman & Terenkripsi</h3>
          <p>
            Data wasiat disimpan dalam blockchain terenkripsi dengan teknologi
            Zero-Knowledge Proof
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">⚖️ Sesuai Hukum</h3>
          <p>
            Mematuhi KUHPerdata Pasal 913-915, UU ITE Pasal 11, dan standar TTE
            Tersertifikasi
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">✅ Eksekusi Otomatis</h3>
          <p>
            Wasiat dieksekusi secara otomatis melalui Death Verification Oracle
            dari Chainlink
          </p>
        </div>
      </section>

      <section className="bg-gray-50 rounded-lg p-8 my-16">
        <h2 className="text-3xl font-bold mb-6">Cara Kerja</h2>
        <div className="space-y-4">
          <p className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              1
            </span>
            <span>
              <strong>Buat Wasiat:</strong> Input data ahli waris dan alokasi
              aset sesuai KUHPerdata
            </span>
          </p>
          <p className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              2
            </span>
            <span>
              <strong>Tanda Tangan Elektronik:</strong> Tanda tangani wasiat
              dengan TTE Tersertifikasi dari PSrE
            </span>
          </p>
          <p className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              3
            </span>
            <span>
              <strong>Deploy ke Blockchain:</strong> Wasiat dideploy ke smart
              contract di Polygon
            </span>
          </p>
          <p className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              4
            </span>
            <span>
              <strong>Verifikasi Kematian:</strong> Oracle Chainlink verifikasi
              kematian via SATUSEHAT + Dukcapil
            </span>
          </p>
          <p className="flex items-start gap-3">
            <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              5
            </span>
            <span>
              <strong>Eksekusi Otomatis:</strong> Aset otomatis ditransfer ke
              ahli waris sesuai alokasi
            </span>
          </p>
        </div>
      </section>

      <section className="my-16">
        <h2 className="text-3xl font-bold mb-6">Fitur Utama</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span> Legitieme Portie Calculator
            - Real-time validasi bagian mutlak per KUHPerdata
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span> WebAuthn/Passkey Support -
            Autentikasi aman tanpa password
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span> Smart Account (ERC-4337) -
            Account abstraction untuk UX lebih baik
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span> Zero-Knowledge Proofs -
            Privacy-preserving verification
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span> Multi-signature Support -
            Collabora approval dari multiple signers
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span> IPFS Storage - Dokumen
            disimpan terdesentralisasi
          </li>
        </ul>
      </section>
    </div>
  );
}

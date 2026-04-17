/**
 * Konstanta hukum KUHPerdata Indonesia
 * Legitieme Portie (Bagian Mutlak Ahli Waris Garis Lurus)
 */

/** Basis points untuk kalkulasi persentase (10000 BPS = 100%) */
export const BASIS_POINTS = 10_000;

/**
 * Legitieme Portie (LP) = Bagian Mutlak yang harus diberikan ke ahli waris garis lurus
 * Berdasarkan Pasal 914 KUHPerdata
 */
export const LEGITIEME_PORTIE = {
  /** 0 anak sah = tidak ada LP mandatory */
  NOLANAK_BPS: 0,

  /** 1 anak sah = minimum 50% dari harta warisan (Pasal 914 ayat 1) */
  SATU_ANAK_BPS: 5_000,

  /** 2 anak sah = minimum 66.67% (2/3) dari harta warisan (Pasal 914 ayat 1) */
  DUA_ANAK_BPS: 6_667,

  /** 3+ anak sah = minimum 75% (3/4) dari harta warisan (Pasal 914 ayat 1) */
  TIGA_PLUS_BPS: 7_500,
} as const;

export const KUHPERDATA_REFERENCE = {
  /** Definisi Legitieme Portie */
  LP_DEFINISI: "Pasal 913 KUHPerdata",

  /** Perhitungan Legitieme Portie berdasarkan jumlah anak sah */
  LP_PERHITUNGAN: "Pasal 914 KUHPerdata",

  /** Perlindungan Legitieme Portie - tidak bisa dikurangi */
  LP_PERLINDUNGAN: "Pasal 915 KUHPerdata",

  /** Ahli waris sah garis lurus */
  AHLI_WARIS_GARIS_LURUS: "Pasal 852 KUHPerdata",
} as const;

/**
 * Helper function untuk menghitung Legitieme Portie minimum berdasarkan jumlah anak sah
 */
export function getLPMinimumBps(jumlahAnakSah: number): number {
  if (jumlahAnakSah === 0) return LEGITIEME_PORTIE.NOLANAK_BPS;
  if (jumlahAnakSah === 1) return LEGITIEME_PORTIE.SATU_ANAK_BPS;
  if (jumlahAnakSah === 2) return LEGITIEME_PORTIE.DUA_ANAK_BPS;
  return LEGITIEME_PORTIE.TIGA_PLUS_BPS;
}

/**
 * Get pembacaan hukum untuk Legitieme Portie
 */
export function getLPReference(jumlahAnakSah: number): string {
  if (jumlahAnakSah === 0) return `${KUHPERDATA_REFERENCE.LP_DEFINISI} - Tidak ada LP mandatory`;
  if (jumlahAnakSah === 1) return `${KUHPERDATA_REFERENCE.LP_PERHITUNGAN} ayat 1 - 1 anak = 50% minimum`;
  if (jumlahAnakSah === 2) return `${KUHPERDATA_REFERENCE.LP_PERHITUNGAN} ayat 1 - 2 anak = 2/3 minimum`;
  return `${KUHPERDATA_REFERENCE.LP_PERHITUNGAN} ayat 1 - 3+ anak = 3/4 minimum`;
}

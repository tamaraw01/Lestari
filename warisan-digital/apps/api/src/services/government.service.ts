/**
 * SatuSehat Service
 * Query ke API SATUSEHAT (Kemenkes) untuk Sertifikat Medis Penyebab Kematian (SMPK)
 * Base URI: https://api.satusehat.kemkes.go.id/fhir-r4/v1
 */

export interface SMPKObservation {
  resourceType: "Observation";
  id: string;
  status: "final" | "amended";
  effectiveDateTime: string;
  subject: { reference: string };
}

export interface SMPKQueryResult {
  valid: boolean;
  tanggalMeninggal?: Date;
  smpkId?: string;
  ihsNumber?: string;
}

export class SatusehatService {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private readonly config: {
      baseUrl: string;
      authUrl: string;
      clientId: string;
      clientSecret: string;
    }
  ) {}

  /**
   * Get access token dari OAuth 2.0
   * Implements token caching dengan refresh
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiresAt - 30_000) {
      return this.accessToken;
    }

    const resp = await fetch(this.config.authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`SATUSEHAT OAuth gagal [${resp.status}]: ${body}`);
    }

    const data = (await resp.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = now + data.expires_in * 1000;

    return this.accessToken;
  }

  /**
   * Query SMPK dari SATUSEHAT FHIR API
   * LOINC Code 69449-7 = Cause of Death (Sertifikat Medis Penyebab Kematian)
   */
  async querySMPK(ihsNumber: string): Promise<SMPKQueryResult> {
    const token = await this.getAccessToken();

    const url = new URL(`${this.config.baseUrl}/fhir-r4/v1/Observation`);
    url.searchParams.set("subject", `Patient/${ihsNumber}`);
    url.searchParams.set("code", "69449-7");
    url.searchParams.set("status", "final");
    url.searchParams.set("_sort", "-date");
    url.searchParams.set("_count", "1");

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/fhir+json",
        "Content-Type": "application/fhir+json",
      },
    });

    if (resp.status === 404) return { valid: false };
    if (!resp.ok) {
      throw new Error(`SATUSEHAT API error [${resp.status}]`);
    }

    const bundle = (await resp.json()) as {
      entry?: Array<{ resource: SMPKObservation }>;
    };

    if (!bundle.entry || bundle.entry.length === 0) {
      return { valid: false };
    }

    const obs = bundle.entry[0].resource;
    return {
      valid: true,
      tanggalMeninggal: new Date(obs.effectiveDateTime),
      smpkId: obs.id,
      ihsNumber,
    };
  }
}

/**
 * Dukcapil Service
 * Query ke API Dukcapil (Kemendagri) untuk Status Kependudukan
 */

export type StatusKependudukan =
  | "HIDUP"
  | "MENINGGAL"
  | "PINDAH"
  | "TIDAK_DIKETAHUI";

export interface DukcapilResult {
  valid: boolean;
  nik: string;
  statusKependudukan: StatusKependudukan;
  tanggalMeninggal?: string;
  nomorAktaKematian?: string;
  namaLengkap?: string;
}

export class DukcapilService {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  /**
   * Verifikasi NIK dari Dukcapil
   */
  async verifikasiNIK(nik: string): Promise<DukcapilResult> {
    // Validasi format NIK: 16 digit
    if (!/^\d{16}$/.test(nik)) {
      throw new Error(`Format NIK tidak valid: ${nik.length} digit`);
    }

    const resp = await fetch(`${this.baseUrl}/verifikasi/nik?nik=${nik}`, {
      headers: {
        "x-api-key": this.apiKey,
        Accept: "application/json",
      },
    });

    if (resp.status === 404) {
      return { valid: false, nik, statusKependudukan: "TIDAK_DIKETAHUI" };
    }
    if (!resp.ok) {
      throw new Error(`Dukcapil API error [${resp.status}]`);
    }

    const data = (await resp.json()) as {
      status: string;
      nik: string;
      nama: string;
      status_kependudukan: StatusKependudukan;
      tanggal_meninggal?: string;
      nomor_akta_kematian?: string;
    };

    return {
      valid: data.status === "OK",
      nik: data.nik,
      statusKependudukan: data.status_kependudukan,
      tanggalMeninggal: data.tanggal_meninggal,
      nomorAktaKematian: data.nomor_akta_kematian,
      namaLengkap: data.nama,
    };
  }

  /**
   * Cross-validasi antara SATUSEHAT dan Dukcapil
   * Periksa apakah tanggal meninggal konsisten
   */
  async crossValidate(
    nik: string,
    tanggalSatusehat: Date
  ): Promise<{
    valid: boolean;
    consistent: boolean;
    daysDiff?: number;
  }> {
    const result = await this.verifikasiNIK(nik);

    if (result.statusKependudukan !== "MENINGGAL") {
      return { valid: false, consistent: false };
    }

    if (!result.tanggalMeninggal) {
      return { valid: true, consistent: false };
    }

    const tglDukcapil = new Date(result.tanggalMeninggal);
    const diffMs = Math.abs(
      tglDukcapil.getTime() - tanggalSatusehat.getTime()
    );
    const daysDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return { valid: true, consistent: daysDiff <= 3, daysDiff };
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LegitimePortieLib
 * @notice Library untuk perhitungan Legitieme Portie (Bagian Mutlak) sesuai KUHPerdata Indonesia
 * @dev Sesuai Pasal 913-915 KUHPerdata: Bagian yang tidak boleh dikurangi untuk ahli waris garis lurus
 */
library LegitimePortieLib {
    /**
     * @notice Basis points untuk kalkulasi persentase (10000 BPS = 100%)
     */
    uint16 public constant BASIS_POINTS = 10_000;

    /**
     * @notice Custom error: Legitieme Portie dilanggar
     * @param actualLPBps Actual porsi LP yang dialokasikan
     * @param minimumLPBps Minimum porsi LP yang required
     */
    error LPDilanggar(uint256 actualLPBps, uint256 minimumLPBps);

    /**
     * @notice Custom error: Total BPS bukan 100%
     * @param totalBps Total basis points yang diberikan
     */
    error TotalBPSTidak100(uint256 totalBps);

    /**
     * @notice Custom error: Invalid jumlah anak sah
     */
    error InvalidJumlahAnak();

    /**
     * @notice Hitung Legitieme Portie minimum dalam basis points berdasarkan jumlah anak sah
     * @dev Pasal 914 KUHPerdata:
     *      - 0 anak sah: LP = 0% (tidak ada bagian mutlak yang wajib)
     *      - 1 anak sah: LP = 50% (1/2 dari harta warisan)
     *      - 2 anak sah: LP = 66.67% (2/3 dari harta warisan)
     *      - 3+ anak sah: LP = 75% (3/4 dari harta warisan)
     * @param jumlahAnakSah Jumlah anak sah pewaris
     * @return lpBps Minimum LP dalam basis points
     */
    function hitungLPBasisPoints(uint8 jumlahAnakSah)
        internal
        pure
        returns (uint16 lpBps)
    {
        if (jumlahAnakSah == 0) {
            return 0; // Pasal 914 - tidak ada LP untuk anak sah jika 0
        } else if (jumlahAnakSah == 1) {
            return 5_000; // 50% = 5000/10000
        } else if (jumlahAnakSah == 2) {
            return 6_667; // 66.67% = 6667/10000 (2/3)
        } else {
            // 3 atau lebih anak sah = 75% = 7500/10000 (3/4)
            return 7_500;
        }
    }

    /**
     * @notice Validasi apakah alokasi LP sesuai KUHPerdata
     * @param persentaseBpsList Array persentase alokasi dalam basis points
     * @param indeksLP Array boolean menunjukkan mana yang termasuk LP (true) vs bebas (false)
     * @param jumlahAnakSah Jumlah anak sah pewaris
     * @return valid true jika alokasi valid dan sesuai KUHPerdata
     * @return totalBps Total dari persentase list
     */
    function validasiPembagian(
        uint16[] calldata persentaseBpsList,
        bool[] calldata indeksLP,
        uint8 jumlahAnakSah
    ) internal pure returns (bool valid, uint256 totalBps) {
        // Validasi input
        if (persentaseBpsList.length != indeksLP.length) {
            return (false, 0);
        }

        // Hitung total dan total LP
        uint256 computedTotalBps = 0;
        uint256 computedLPBps = 0;

        for (uint256 i = 0; i < persentaseBpsList.length; i++) {
            uint16 bps = persentaseBpsList[i];

            // Validasi range
            if (bps > BASIS_POINTS) {
                return (false, 0);
            }

            computedTotalBps += bps;

            // Jika termasuk LP, tambahkan ke LP total
            if (indeksLP[i]) {
                computedLPBps += bps;
            }
        }

        // Cek total BPS harus 100%
        if (computedTotalBps != BASIS_POINTS) {
            return (false, computedTotalBps);
        }

        // Cek LP compliance
        uint16 minLPBps = hitungLPBasisPoints(jumlahAnakSah);
        if (computedLPBps < minLPBps) {
            return (false, computedTotalBps);
        }

        return (true, computedTotalBps);
    }

    /**
     * @notice Hitung pembagian aset ke seorang ahli waris
     * @dev Menggunakan basis points untuk menghindari floating point issues
     * @param totalAset Total aset yang akan dibagikan (dalam Wei atau accounting unit)
     * @param persentaseBps Persentase alokasi dalam basis points
     * @return jumlahAhliWaris Jumlah yang diterima (dalam satuan yang sama dengan totalAset)
     */
    function hitungPembagian(uint256 totalAset, uint16 persentaseBps)
        internal
        pure
        returns (uint256 jumlahAhliWaris)
    {
        // Hitung: total * (bps / 10000)
        // Menggunakan (total * bps) / 10000 untuk hindari overflow
        return (totalAset * uint256(persentaseBps)) / uint256(BASIS_POINTS);
    }

    /**
     * @notice Hitung dan validasi pembagian untuk semua ahli waris
     * @dev Internal function yang comprehensif untuk validasi LP
     * @param totalAset Total aset warrant
     * @param ahliWarisPerBps Array persentase untuk setiap ahli waris dalam BPS
     * @param isLPArray Array boolean menandai mana yang termasuk LP
     * @param jumlahAnakSah Jumlah anak sah pewaris
     * @return jumlahLP Jumlah untuk bagian yang termasuk LP
     * @return jumlahBebas Jumlah untuk bagian bebas
     */
    function hitungPembagianLengkap(
        uint256 totalAset,
        uint16[] calldata ahliWarisPerBps,
        bool[] calldata isLPArray,
        uint8 jumlahAnakSah
    ) internal pure returns (uint256 jumlahLP, uint256 jumlahBebas) {
        // Validasi pembagian
        (bool valid, ) = validasiPembagian(ahliWarisPerBps, isLPArray, jumlahAnakSah);
        if (!valid) {
            revert LPDilanggar(0, hitungLPBasisPoints(jumlahAnakSah));
        }

        // Hitung total LP dan total bebas dalam BPS
        uint256 totalLPBps = 0;
        for (uint256 i = 0; i < isLPArray.length; i++) {
            if (isLPArray[i]) {
                totalLPBps += ahliWarisPerBps[i];
            }
        }

        // Hitung jumlah
        jumlahLP = (totalAset * totalLPBps) / uint256(BASIS_POINTS);
        jumlahBebas = totalAset - jumlahLP;

        return (jumlahLP, jumlahBebas);
    }

    /**
     * @notice Validate persentase untuk single ahli waris
     * @param persentaseBps Persentase dalam BPS
     * @return valid true jika valid (0 <= bps <= 10000)
     */
    function isValidPersentase(uint16 persentaseBps)
        internal
        pure
        returns (bool valid)
    {
        return persentaseBps <= BASIS_POINTS;
    }

    /**
     * @notice Get LP reference untuk logging/UI
     * @param jumlahAnakSah Jumlah anak sah
     * @return reference String reference ke pasal KUHPerdata
     */
    function getLPReference(uint8 jumlahAnakSah)
        internal
        pure
        returns (string memory reference)
    {
        if (jumlahAnakSah == 0) {
            return "Pasal 914 KUHPerdata - Tidak ada LP (0 anak sah)";
        } else if (jumlahAnakSah == 1) {
            return "Pasal 914 ayat 1 KUHPerdata - 1 anak sah: LP minimum 50%";
        } else if (jumlahAnakSah == 2) {
            return "Pasal 914 ayat 1 KUHPerdata - 2 anak sah: LP minimum 66.67%";
        } else {
            return "Pasal 914 ayat 1 KUHPerdata - 3+ anak sah: LP minimum 75%";
        }
    }
}

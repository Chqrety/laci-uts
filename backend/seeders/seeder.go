package seeders

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"laci-backend/config"
	"laci-backend/models"
	"laci-backend/utils"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedCore menjalankan seeder kebutuhan dasar (Genesis Ketum, Proker & Instansi)
func SeedCore(db *gorm.DB) {
	SeedGenesisKetum(db)
	SeedProker(db)
	SeedInstansi(db)
}

// SeedGenesisKetum menginisialisasi Ketua Umum pertama jika belum ada satupun akun ketum di database.
// Menggunakan Solusi 1 Opsi 1A: akun dibuat inactive dan otomatis dikirimkan email aktivasi untuk membuat password sendiri.
func SeedGenesisKetum(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Where("LOWER(divisi) = 'ketum'").Count(&count)
	if count > 0 {
		return
	}

	nim := strings.TrimSpace(os.Getenv("INIT_KETUM_NIM"))
	nama := strings.TrimSpace(os.Getenv("INIT_KETUM_NAMA"))
	email := strings.TrimSpace(os.Getenv("INIT_KETUM_EMAIL"))
	username := strings.TrimSpace(os.Getenv("INIT_KETUM_USERNAME"))

	if username == "" {
		log.Println("[GENESIS KETUM] Variabel INIT_KETUM_USERNAME belum disetel di environment. Inisialisasi dilewati.")
		return
	}

	var existing models.User
	if err := db.Where("username = ? OR (email != '' AND email = ?)", username, email).First(&existing).Error; err == nil {
		// Jika username/email sudah ada tapi bukan ketum, promosikan menjadi ketum
		db.Model(&existing).Update("divisi", "ketum")
		log.Printf("[GENESIS KETUM] Akun '%s' dipromosikan menjadi Ketua Umum.", existing.Username)
		return
	}

	activationToken := utils.GenerateToken(32)
	tokenExpiry := time.Now().Add(24 * time.Hour)

	lockedPassword, _ := bcrypt.GenerateFromPassword([]byte(uuid.New().String()), bcrypt.DefaultCost)

	genesisKetum := models.User{
		ID:                       uuid.New(),
		NIM:                      nim,
		Nama:                     nama,
		Email:                    email,
		Username:                 username,
		Password:                 string(lockedPassword),
		Divisi:                   "ketum",
		IsActive:                 false,
		ActivationToken:          &activationToken,
		ActivationTokenExpiresAt: &tokenExpiry,
	}

	if err := db.Create(&genesisKetum).Error; err != nil {
		log.Printf("[GENESIS KETUM ERROR] Gagal membuat akun Ketua Umum pertama: %v", err)
		return
	}

	appURL := strings.TrimRight(config.GetEnv("APP_URL", ""), "/")
	var activationURL string
	if appURL != "" {
		activationURL = fmt.Sprintf("%s/activate?token=%s", appURL, activationToken)
	} else {
		activationURL = fmt.Sprintf("/activate?token=%s", activationToken)
	}

	log.Printf("================================================================================")
	log.Printf("[GENESIS KETUM] Akun Ketua Umum perdana berhasil disiapkan!")
	log.Printf("Username       : %s", username)
	log.Printf("Email          : %s", email)
	log.Printf("Token Aktivasi : %s", activationToken)
	if appURL != "" {
		log.Printf("Tautan Aktivasi: %s", activationURL)
	} else {
		log.Printf("Tautan Aktivasi: %s (buka via domain/IP server)", activationURL)
	}
	log.Printf("================================================================================")

	if email != "" {
		utils.SendActivationEmail(email, nama, username, activationToken)
	}
}

func SeedProker(db *gorm.DB) {
	defaultProkers := []models.Proker{
		{NamaProker: "MAKRAB", Deskripsi: "Malam Keakraban"},
		{NamaProker: "OPREC", Deskripsi: "Open Recruitment"},
		{NamaProker: "OOTS", Deskripsi: "Opensource On The School"},
		{NamaProker: "DST", Deskripsi: "Doscom Sharing Time"},
		{NamaProker: "DU", Deskripsi: "Doscom University"},
		{NamaProker: "RP", Deskripsi: "Release Party"},
	}

	for _, p := range defaultProkers {
		var proker models.Proker
		p.ID = uuid.New()
		if err := db.Where(models.Proker{NamaProker: p.NamaProker}).FirstOrCreate(&proker, p).Error; err != nil {
			log.Printf("Warning: failed to seed proker %s: %v", p.NamaProker, err)
		}
	}
}

func SeedInstansi(db *gorm.DB) {
	defaultInstansi := []models.Instansi{
		{NamaInstansi: "Dekan Fakultas Teknologi Cerdas", Kategori: "Fakultas", Keterangan: "Persetujuan izin kegiatan resmi DOSCOM"},
		{NamaInstansi: "Tata Usaha Fakultas Teknologi Cerdas", Kategori: "Fakultas", Keterangan: "Peminjaman ruangan kampus, sarpras, dan media promosi"},
		{NamaInstansi: "Kepala Biro Umum", Kategori: "Universitas", Keterangan: "Perizinan gedung eksternal dan parkir kampus"},
		{NamaInstansi: "Wakil Rektor II Bidang Umum dan Keuangan", Kategori: "Rektorat", Keterangan: "Fasilitas kendaraan operasional universitas"},
		{NamaInstansi: "Dosen Pengampu Mata Kuliah", Kategori: "Akademik", Keterangan: "Dispensasi izin perkuliahan panitia dan delegasi"},
		{NamaInstansi: "Kepala Poliklinik", Kategori: "Unit Kampus", Keterangan: "Bantuan obat-obatan dan P3K kegiatan"},
		{NamaInstansi: "Biro Kemahasiswaan", Kategori: "Universitas", Keterangan: "Permohonan plakat kenang-kenangan dan pendamping kegiatan"},
		{NamaInstansi: "Bapak/Ibu Kepala Sekolah", Kategori: "Sekolah Mitra", Keterangan: "Surat pengantar sosialisasi dan kunjungan sekolah"},
	}

	for _, ins := range defaultInstansi {
		var existing models.Instansi
		ins.ID = uuid.New()
		now := time.Now()
		ins.CreatedAt = now
		ins.UpdatedAt = now
		if err := db.Where("nama_instansi = ?", ins.NamaInstansi).FirstOrCreate(&existing, ins).Error; err != nil {
			log.Printf("Warning: failed to seed instansi %s: %v", ins.NamaInstansi, err)
		}
	}
}

// SeedDummyData mengisi user dummy, surat dummy yang realistis, dan log tracking terhubung
func SeedDummyData(db *gorm.DB) {
	SeedCore(db)
	seedDummyUsers(db)
	seedDummySuratAndLogs(db)
}

func seedDummyUsers(db *gorm.DB) {
	passHash, err := bcrypt.GenerateFromPassword([]byte("000000"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Gagal hashing password dummy: %v", err)
		return
	}

	dummyUsers := []models.User{
		{NIM: "A11.2023.14901", Nama: "Ahmad Fajar Pratama", Email: "fajar.ketum@doscom.org", Username: "fajar_ketum", Divisi: "ketum", IsKoor: true, IsActive: true},
		{NIM: "A11.2023.14902", Nama: "Nabila Ayu Wardani", Email: "nabila.sekre@doscom.org", Username: "nabila_sekre", Divisi: "sekre", IsKoor: true, IsActive: true},
		{NIM: "A11.2024.15011", Nama: "Rian Dwi Saputra", Email: "rian.sekre@doscom.org", Username: "rian_sekre", Divisi: "sekre", IsKoor: false, IsActive: true},
		{NIM: "A11.2023.14905", Nama: "Dimas Arya Wijaya", Email: "dimas.humas@doscom.org", Username: "dimas_humas", Divisi: "humas", IsKoor: true, IsActive: true},
		{NIM: "A11.2024.15019", Nama: "Siti Rahmawati", Email: "siti.humas@doscom.org", Username: "siti_humas", Divisi: "humas", IsKoor: false, IsActive: true},
		{NIM: "A11.2023.14910", Nama: "Bayu Aji Pamungkas", Email: "bayu.pengurus@doscom.org", Username: "bayu_pengurus", Divisi: "pengurus", IsKoor: true, IsActive: true},
		{NIM: "A11.2024.15025", Nama: "Lestari Widya Ningrum", Email: "lestari.pengurus@doscom.org", Username: "lestari_pengurus", Divisi: "pengurus", IsKoor: false, IsActive: true},
		{NIM: "A11.2024.15030", Nama: "Eko Wahyu Santoso", Email: "eko.pengurus@doscom.org", Username: "eko_pengurus", Divisi: "pengurus", IsKoor: false, IsActive: true},
		{NIM: "A11.2022.14001", Nama: "Budi Santoso", Email: "budi.alumni@doscom.org", Username: "budi_alumni", Divisi: "ex-ketum", IsKoor: false, IsActive: true},
	}

	for _, u := range dummyUsers {
		u.Password = string(passHash)
		var existing models.User
		if err := db.Where("username = ?", u.Username).First(&existing).Error; err != nil {
			u.ID = uuid.New()
			if err := db.Create(&u).Error; err != nil {
				log.Printf("Warning: gagal membuat dummy user %s: %v", u.Username, err)
			}
		} else {
			db.Model(&existing).Updates(map[string]interface{}{
				"password":  u.Password,
				"nama":      u.Nama,
				"divisi":    u.Divisi,
				"is_koor":   u.IsKoor,
				"is_active": true,
			})
		}
	}
}

func seedDummySuratAndLogs(db *gorm.DB) {
	var prokers []models.Proker
	db.Find(&prokers)
	prokerMap := make(map[string]uuid.UUID)
	for _, p := range prokers {
		prokerMap[p.NamaProker] = p.ID
	}

	getProkerID := func(name string) *uuid.UUID {
		if id, ok := prokerMap[name]; ok {
			return &id
		}
		if len(prokers) > 0 {
			return &prokers[0].ID
		}
		return nil
	}

	statusFlow := []string{
		"Standby",
		"Cetak",
		"TTD Dasar",
		"TTD Ketum",
		"TTD Pembina",
		"Paraf Koormawa",
		"TTD Tertinggi",
		"Selesai",
	}

	statusNotes := map[string]string{
		"Standby":        "Surat telah dibuat dan menunggu proses pengecekan berkas fisik",
		"Cetak":          "Surat dicetak fisik oleh Sekretariat dan disiapkan map permohonan",
		"TTD Dasar":      "Tanda tangan Ketua Panitia Pelaksana telah diverifikasi",
		"TTD Ketum":      "Disetujui dan ditandatangani oleh Ketua Umum DOSCOM",
		"TTD Pembina":    "Disetujui dan ditandatangani oleh Dosen Pembina Organisasi",
		"Paraf Koormawa": "Telah diverifikasi dan mendapatkan paraf Koordinator Kemahasiswaan Fakultas",
		"TTD Tertinggi":  "Berkas diserahkan ke ruang Dekanat / Biro Umum untuk pengesahan akhir",
		"Selesai":        "Surat resmi selesai ditandatangani, nomor surat tercatat rapi dan arsip disimpan",
	}

	dummySurats := []struct {
		Nomor    string
		Perihal  string
		Tujuan   string
		Proker   string
		Status   string
		PIC      string
		Catatan  string
		GDocsURL string
		ArsipURL string
	}{
		{
			Nomor:    "001/A/DOSCOM/MAKRAB/X/2026",
			Perihal:  "Permohonan Peminjaman Gedung H Lantai 3",
			Tujuan:   "Tata Usaha Fakultas Teknologi Cerdas",
			Proker:   "MAKRAB",
			Status:   "Standby",
			PIC:      "Lestari Widya Ningrum",
			Catatan:  "Menunggu lampiran denah layout panggung dan rundown malam keakraban.",
			GDocsURL: "https://docs.google.com/document/d/dummy-makrab-gedung/edit",
		},
		{
			Nomor:    "002/B/DOSCOM/OPREC/X/2026",
			Perihal:  "Peminjaman Lab Komputer Dasar untuk Seleksi Coding",
			Tujuan:   "Tata Usaha Fakultas Teknologi Cerdas",
			Proker:   "OPREC",
			Status:   "Cetak",
			PIC:      "Rian Dwi Saputra",
			Catatan:  "Form sarpras sudah diisi, surat siap dicetak 2 rangkap.",
			GDocsURL: "https://docs.google.com/document/d/dummy-oprec-lab/edit",
		},
		{
			Nomor:   "003/A/DOSCOM/DST/X/2026",
			Perihal: "Dispensasi Kuliah Panitia DOSCOM Sharing Time #1",
			Tujuan:  "Dosen Pengampu Mata Kuliah",
			Proker:  "DST",
			Status:  "TTD Dasar",
			PIC:     "Siti Rahmawati",
			Catatan: "Daftar 12 mahasiswa terlampir, menunggu TTD Koor Acara.",
		},
		{
			Nomor:    "004/A/DOSCOM/DU/X/2026",
			Perihal:  "Undangan Pembicara Bootcamp Linux System Administration",
			Tujuan:   "Dosen Pengampu Mata Kuliah",
			Proker:   "DU",
			Status:   "TTD Ketum",
			PIC:      "Dimas Arya Wijaya",
			Catatan:  "Draft TOR kegiatan telah disetujui, menunggu giliran tanda tangan Ketum.",
			GDocsURL: "https://docs.google.com/document/d/dummy-du-speaker/edit",
		},
		{
			Nomor:   "005/B/DOSCOM/OOTS/X/2026",
			Perihal: "Permohonan Pengantar Kunjungan Edukasi Linux ke SMK",
			Tujuan:  "Bapak/Ibu Kepala Sekolah",
			Proker:  "OOTS",
			Status:  "TTD Pembina",
			PIC:     "Eko Wahyu Santoso",
			Catatan: "Sudah di-acc Ketum, surat fisik sedang dibawa ke ruang Pembina.",
		},
		{
			Nomor:   "006/A/DOSCOM/RP/X/2026",
			Perihal: "Izin Publikasi Poster dan Baliho Release Party TeaLinuxOS",
			Tujuan:  "Biro Kemahasiswaan",
			Proker:  "RP",
			Status:  "Paraf Koormawa",
			PIC:     "Bayu Aji Pamungkas",
			Catatan: "Desain visual baliho sudah lolos sensor humas fakultas.",
		},
		{
			Nomor:   "007/B/DOSCOM/MAKRAB/X/2026",
			Perihal: "Peminjaman Bus Operasional Kampus untuk Makrab Bandungan",
			Tujuan:  "Wakil Rektor II Bidang Umum dan Keuangan",
			Proker:  "MAKRAB",
			Status:  "TTD Tertinggi",
			PIC:     "Lestari Widya Ningrum",
			Catatan: "Diajukan ke Warek II, menunggu jadwal ketersediaan supir dan armada.",
		},
		{
			Nomor:    "008/A/DOSCOM/RP/X/2026",
			Perihal:  "Permohonan Izin Kegiatan Resmi Release Party 2026",
			Tujuan:   "Dekan Fakultas Teknologi Cerdas",
			Proker:   "RP",
			Status:   "Selesai",
			PIC:      "Ahmad Fajar Pratama",
			Catatan:  "SK dan Izin resmi Dekan terbit. Kegiatan siap diselenggarakan.",
			ArsipURL: "uploads/dummy_arsip_rp_dekan.pdf",
		},
		{
			Nomor:   "009/B/DOSCOM/DST/X/2026",
			Perihal: "Bantuan Kotak P3K & Obat Kegiatan Sharing Outdoor",
			Tujuan:  "Kepala Poliklinik",
			Proker:  "DST",
			Status:  "Selesai",
			PIC:     "Siti Rahmawati",
			Catatan: "P3K sudah diambil di poliklinik kampus dan dikembalikan.",
		},
		{
			Nomor:   "010/A/DOSCOM/OPREC/X/2026",
			Perihal: "Permohonan Plakat Penghargaan Juri Oprec DOSCOM",
			Tujuan:  "Biro Kemahasiswaan",
			Proker:  "OPREC",
			Status:  "TTD Pembina",
			PIC:     "Nabila Ayu Wardani",
			Catatan: "Menunggu tanda tangan Pembina untuk pencairan souvenir plakat.",
		},
		{
			Nomor:   "011/B/DOSCOM/OOTS/X/2026",
			Perihal: "Izin Parkir Khusus Kendaraan Tamu Workshop OOTS",
			Tujuan:  "Kepala Biro Umum",
			Proker:  "OOTS",
			Status:  "Cetak",
			PIC:     "Eko Wahyu Santoso",
			Catatan: "Menunggu print out surat untuk diserahkan ke pos satpam.",
		},
		{
			Nomor:   "012/A/DOSCOM/DU/X/2026",
			Perihal: "Peminjaman Sound System & Wireless Mic Aula Utama",
			Tujuan:  "Tata Usaha Fakultas Teknologi Cerdas",
			Proker:  "DU",
			Status:  "Standby",
			PIC:     "Dimas Arya Wijaya",
			Catatan: "Menyesuaikan jam pemakaian dengan jadwal gladi bersih.",
		},
	}

	for _, d := range dummySurats {
		var s models.Surat
		newSurat := models.Surat{
			ID:            uuid.New(),
			NomorSurat:    d.Nomor,
			Perihal:       d.Perihal,
			Tujuan:        d.Tujuan,
			StatusSaatIni: d.Status,
			PICNama:       d.PIC,
			Catatan:       d.Catatan,
			ProkerID:      getProkerID(d.Proker),
		}
		if d.GDocsURL != "" {
			newSurat.GDocsURL = &d.GDocsURL
		}
		if d.ArsipURL != "" {
			newSurat.ArsipURL = &d.ArsipURL
		}

		if err := db.Where("nomor_surat = ?", d.Nomor).First(&s).Error; err != nil {
			s = newSurat
			if err := db.Create(&s).Error; err != nil {
				log.Printf("Warning: gagal seed surat %s: %v", d.Nomor, err)
				continue
			}
		} else {
			db.Model(&s).Updates(map[string]interface{}{
				"perihal":         d.Perihal,
				"tujuan":          d.Tujuan,
				"status_saat_ini": d.Status,
				"pic_nama":        d.PIC,
				"catatan":         d.Catatan,
				"proker_id":       newSurat.ProkerID,
				"g_docs_url":      newSurat.GDocsURL,
				"arsip_url":       newSurat.ArsipURL,
			})
		}

		// Bangun riwayat log tracking dari awal sampai status saat ini
		targetIdx := 0
		for idx, st := range statusFlow {
			if strings.EqualFold(st, d.Status) {
				targetIdx = idx
				break
			}
		}

		for i := 0; i <= targetIdx; i++ {
			stepStatus := statusFlow[i]
			note := statusNotes[stepStatus]
			if i == targetIdx && d.Catatan != "" {
				note = d.Catatan
			}

			offsetHours := time.Duration((targetIdx-i)*12 + 3)
			logTime := time.Now().Add(-offsetHours * time.Hour)

			var existingLog models.LogTracking
			if err := db.Where("surat_id = ? AND status_baru = ?", s.ID, stepStatus).First(&existingLog).Error; err != nil {
				newLog := models.LogTracking{
					ID:          uuid.New(),
					SuratID:     s.ID,
					StatusBaru:  stepStatus,
					CatatanLog:  note,
					WaktuUpdate: logTime,
				}
				db.Create(&newLog)
			}
		}
	}
}

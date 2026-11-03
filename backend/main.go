package main

import (
	"flag"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"laci-backend/config"
	"laci-backend/routes"
	"laci-backend/seeders"
)

func main() {
	seedFlag := flag.Bool("seed", false, "Jalankan seeder data dummy (surat, tracking, dan akun pengurus) lalu keluar")
	flag.Parse()

	if err := godotenv.Load("../.env", ".env"); err != nil {
		log.Println("Catatan: File .env tidak ditemukan, menggunakan nilai environment OS bawaan.")
	}

	config.InitDB()

	if *seedFlag {
		log.Println("[SEEDER] Flag -seed terdeteksi. Mengisi database dengan data dummy...")
		seeders.SeedDummyData(config.DB)
		log.Println("[SEEDER] Selesai mengisi data dummy.")
		os.Exit(0)
	}

	seeders.SeedCore(config.DB)

	r := gin.Default()
	routes.SetupRoutes(r)

	port := config.GetEnv("PORT", "8080")
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}

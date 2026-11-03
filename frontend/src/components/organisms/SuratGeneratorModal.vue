<script lang="ts">
// Module-level in-memory cache across modal toggles
let cachedTemplates: SuratTemplate[] | null = null
let cachedProkers: Proker[] | null = null
let cachedUsers: User[] | null = null
let cachedSettings: Record<string, string> | null = null
let cachedInstansi: Instansi[] | null = null

export const clearGeneratorCache = () => {
  cachedTemplates = null
  cachedProkers = null
  cachedUsers = null
  cachedSettings = null
  cachedInstansi = null
}
</script>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  templateService,
  prokerService,
  userService,
  instansiService,
  currentUser,
  currentUsername,
  type SuratTemplate,
  type Proker,
  type User,
  type Instansi,
  type Surat,
} from '@/services/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { ROMAN_MONTHS, getCurrentRomanMonth } from '@/utils/roman'
import { idLongDateFormatter, idDateOnlyFormatter, formatCompactFileDate } from '@/utils/date'
import {
  GeneratorSuccessView,
  GeneratorDynamicFields,
  STANDARD_COVERED,
} from '@/components/surat-generator'
import WheelTimePicker from '@/components/ui/time-picker/WheelTimePicker.vue'
import SimpleDatePicker from '@/components/ui/date-picker/SimpleDatePicker.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', surat: Surat): void
  (e: 'openSetup'): void
}>()

const templates = ref<SuratTemplate[]>([])
const prokerList = ref<Proker[]>([])
const userList = ref<User[]>([])
const templatePlaceholders = ref<string[]>([])
const isLoadingData = ref(false)
const isSubmitting = ref(false)

// Template Selection
const selectedTemplateId = ref<string>('')

// 1. Nomor Surat Segmented State (Format Versi Awal)
const noUrut = ref('01')
const selectedProkerCode = ref('NONE') // 'NONE' = Tanpa Proker (Kosong)
const selectedBulan = ref<string>(getCurrentRomanMonth())
const selectedTahun = ref(new Date().getFullYear().toString())

// 2. Data Pokok Surat
const perihal = ref('')
const instansiList = ref<Instansi[]>([])
const selectedTujuan = ref('')
const isCustomTujuan = ref(false)
const customTujuanInput = ref('')
const outputFolderUrl = ref('')

// 3. Detail Acara Kegiatan
const namaKegiatan = ref('')
const tipeTanggal = ref<'single' | 'range'>('single')
const tanggalMulai = ref('')
const tanggalSelesai = ref('')
const jamMulai = ref('')
const jamSelesai = ref('')
const isSampaiSelesai = ref(false)
const tempatAcara = ref('')

const formattedWaktu = computed(() => {
  if (!jamMulai.value) return ''
  if (isSampaiSelesai.value) {
    return `${jamMulai.value} WIB - Selesai`
  }
  if (jamSelesai.value) {
    return `${jamMulai.value} WIB - ${jamSelesai.value} WIB`
  }
  return `${jamMulai.value} WIB`
})


// 4. Narahubung (2 Input Terpisah)
const namaNarahubung = ref('')
const nohpNarahubung = ref('')

// 5. Penandatangan (Ketum di Kiri, Ketupel di Kanan)
const selectedKetumId = ref('')
const selectedKetupelId = ref('')

// Dynamic Extra Placeholders
const dynamicReplacements = ref<Record<string, string>>({})

// Success Result
const generationResult = ref<{
  surat: Surat
  gdocs_url: string
  pdf_url: string
} | null>(null)

const selectedTemplate = computed(() => {
  return templates.value.find((t) => t.id === selectedTemplateId.value) || null
})

// Data Pengurus dengan divisi Ketua Umum (hanya divisi ketum)
const ketumOptions = computed(() => {
  const byDivisi = userList.value.filter((u) => u.divisi?.toLowerCase() === 'ketum')
  if (byDivisi.length > 0) return byDivisi
  return userList.value.filter((u) => u.nama?.toLowerCase().includes('ketua umum'))
})

const ketumUser = computed(() => ketumOptions.value[0] || null)

// Penandatangan Dasar (Ketua Pelaksana / Pembuat): Semua user kecuali Ketum
const dasarUsers = computed(() => {
  const ketumId = selectedKetumId.value
  return userList.value.filter((u) => u.divisi?.toLowerCase() !== 'ketum' && u.id !== ketumId)
})
const lapis1Users = dasarUsers

watch(selectedKetumId, (newKetumId) => {
  if (selectedKetupelId.value && selectedKetupelId.value === newKetumId) {
    selectedKetupelId.value = ''
  }
})

// Ekstrak prefix angka dari nama template (contoh: "01_Surat Undangan" -> "01")
const extractPrefixNoUrut = (name: string): string => {
  const match = name.trim().match(/^(\d+)/)
  return match?.[1] ? match[1].padStart(2, '0') : '01'
}

const SMART_TUJUAN_RULES: [RegExp, string][] = [
  [/^01|permohonan kegiatan/i, 'Dekan Fakultas Teknologi Cerdas'],
  [/^02.*eksternal/i, 'Kepala Biro Umum'],
  [/^02|peminjaman ruangan/i, 'Tata Usaha Fakultas Teknologi Cerdas'],
  [/^03|peminjaman barang/i, 'Tata Usaha Fakultas Teknologi Cerdas'],
  [/^04|kendaraan/i, 'Wakil Rektor II Bidang Umum dan Keuangan'],
  [/^05|perkuliahan|dispensasi/i, 'Dosen Pengampu Mata Kuliah'],
  [/^06|poster|banner/i, 'Tata Usaha Fakultas Teknologi Cerdas'],
  [/^09|pembayaran|pembicara/i, 'Pembicara / Pemateri Kegiatan'],
  [/^10|parkir/i, 'Kepala Biro Umum'],
  [/^11|obat|p3k/i, 'Kepala Poliklinik'],
  [/^14|sekolah/i, 'Bapak/Ibu Kepala Sekolah'],
  [/^16|plakat/i, 'Biro Kemahasiswaan (BIMA)'],
]

// Pemetaan smart default tujuan berdasarkan nama template
const getSmartDefaultTujuan = (name: string): { tujuan: string; isCustom: boolean } => {
  const match = SMART_TUJUAN_RULES.find(([re]) => re.test(name))
  return match ? { tujuan: match[1], isCustom: false } : { tujuan: '', isCustom: true }
}

const toggleCustomTujuan = () => {
  isCustomTujuan.value = !isCustomTujuan.value
  if (isCustomTujuan.value) {
    if (!customTujuanInput.value && selectedTujuan.value) {
      customTujuanInput.value = selectedTujuan.value
    }
  } else {
    if (customTujuanInput.value) {
      selectedTujuan.value = customTujuanInput.value
    }
  }
}


const computedFinalTujuan = computed(() => {
  if (isCustomTujuan.value) {
    return customTujuanInput.value.trim()
  }
  return selectedTujuan.value.trim()
})

const computedFinalPerihal = computed(() => {
  const base = perihal.value.trim()
  const extra = namaKegiatan.value.trim()
  if (base && extra) {
    if (base.toLowerCase().includes(extra.toLowerCase())) {
      return base
    }
    return `${base} — ${extra}`
  }
  return base
})

// Format Tanggal Indonesia
const formatIndonesianDate = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? dateStr : idLongDateFormatter.format(d)
  } catch {
    return dateStr
  }
}

// Format Hari/Tanggal (Single vs Range)
const formattedHariTanggal = computed(() => {
  if (tipeTanggal.value === 'single') {
    return formatIndonesianDate(tanggalMulai.value)
  }
  if (tanggalMulai.value && tanggalSelesai.value) {
    return `${formatIndonesianDate(tanggalMulai.value)} s.d. ${formatIndonesianDate(tanggalSelesai.value)}`
  }
  return formatIndonesianDate(tanggalMulai.value)
})

// Format Narahubung: Format 2 Baris (Nama & No.Hp)
const formattedNarahubung = computed(() => {
  const nama = namaNarahubung.value.trim()
  const hp = nohpNarahubung.value.trim()
  if (nama && hp) return `Nama   : ${nama}\nNo.Hp  : ${hp}`
  if (nama) return `Nama   : ${nama}`
  if (hp) return `No.Hp  : ${hp}`
  return ''
})

// Full Nomor Surat Computed: jika Tanpa Proker, segmen proker dihilangkan
const computedNomorSurat = computed(() => {
  const paddedNo = (noUrut.value.trim() || '01').padStart(2, '0')
  const isNoProker = !selectedProkerCode.value || selectedProkerCode.value === 'NONE'

  if (isNoProker) {
    return `${paddedNo}/DOSCOM/${selectedBulan.value}/${selectedTahun.value.trim()}`
  }

  const prokerPart = selectedProkerCode.value.toUpperCase().replace(/\s+/g, '-')
  return `${paddedNo}/DOSCOM/${prokerPart}/${selectedBulan.value}/${selectedTahun.value.trim()}`
})

// Penamaan File Otomatis: [Template]_[Proker]_[Tanggal] atau [Template]_[Tanggal]
const computedFileName = computed(() => {
  const rawTplName = selectedTemplate.value?.nama_template || 'Surat'
  const cleanTplName = rawTplName.trim().replace(/[\/\\?%*:|"<>]/g, '_')
  const dateStr = formatCompactFileDate(new Date())
  const isNoProker = !selectedProkerCode.value || selectedProkerCode.value === 'NONE'

  if (isNoProker) {
    return `${cleanTplName}_${dateStr}`
  }

  const prokerPart = selectedProkerCode.value.toUpperCase().replace(/\s+/g, '-')
  return `${cleanTplName}_${prokerPart}_${dateStr}`
})

// Placeholder ekstra yang belum ter-cover oleh form standar
const extraPlaceholders = computed<string[]>(() => {
  return templatePlaceholders.value.filter((p) => !STANDARD_COVERED.has(p.toLowerCase()))
})

const syncInitialSelection = () => {
  const foundKetum = userList.value.find((u) => u.divisi?.toLowerCase() === 'ketum')
  if (foundKetum && !selectedKetumId.value) {
    selectedKetumId.value = foundKetum.id
  }
  const foundDasar = userList.value.find((u) => u.divisi?.toLowerCase() !== 'ketum' && (!foundKetum || u.id !== foundKetum.id))
  if (foundDasar && !selectedKetupelId.value) {
    selectedKetupelId.value = foundDasar.id
  }
  const templateExists = templates.value.some((t) => t.id === selectedTemplateId.value)
  if (!templateExists && templates.value.length > 0 && templates.value[0]) {
    selectedTemplateId.value = templates.value[0].id
  }
}

const loadData = async (force = false) => {
  if (!force && cachedTemplates && cachedTemplates.length > 0 && cachedProkers && cachedProkers.length > 0 && cachedUsers && cachedSettings && cachedInstansi) {
    templates.value = cachedTemplates
    prokerList.value = cachedProkers
    userList.value = cachedUsers
    instansiList.value = cachedInstansi
    if (cachedSettings.default_output_folder_url) {
      outputFolderUrl.value = cachedSettings.default_output_folder_url
    }
    syncInitialSelection()
    return
  }

  isLoadingData.value = true
  try {
    const [tplData, prokerData, usersData, settings, instansiData] = await Promise.all([
      cachedTemplates && cachedTemplates.length > 0 && !force ? cachedTemplates : templateService.getAll(),
      cachedProkers && cachedProkers.length > 0 && !force ? cachedProkers : prokerService.getAll(force),
      cachedUsers && !force ? cachedUsers : userService.getAll().catch(() => [] as User[]),
      cachedSettings && !force ? cachedSettings : templateService.getSettings().catch(() => ({} as Record<string, string>)),
      cachedInstansi && !force ? cachedInstansi : instansiService.getAll().catch(() => [] as Instansi[]),
    ])

    if (tplData && tplData.length > 0) {
      cachedTemplates = tplData
    }
    if (prokerData && prokerData.length > 0) {
      cachedProkers = prokerData
    }
    cachedUsers = usersData
    cachedSettings = settings
    cachedInstansi = instansiData

    templates.value = tplData
    prokerList.value = prokerData
    userList.value = usersData
    instansiList.value = instansiData

    if (settings.default_output_folder_url) {
      outputFolderUrl.value = settings.default_output_folder_url
    }

    syncInitialSelection()
  } catch (err) {
    console.error('Gagal memuat data generator surat:', err)
  } finally {
    isLoadingData.value = false
  }
}

onMounted(() => {
  if (props.isOpen) {
    generationResult.value = null
    loadData()
  }
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      generationResult.value = null
      loadData()
    }
  },
  { immediate: true }
)

// Saat template berubah, perbarui nomor urut dan perihal otomatis sesuai template yang dipilih
watch(
  selectedTemplate,
  (tpl) => {
    if (!tpl) {
      templatePlaceholders.value = []
      return
    }
    noUrut.value = extractPrefixNoUrut(tpl.nama_template)
    perihal.value = tpl.nama_template.replace(/^\d+[\s_-]*/, '').replace(/_/g, ' ').trim()
    const { tujuan, isCustom } = getSmartDefaultTujuan(tpl.nama_template)
    isCustomTujuan.value = isCustom
    selectedTujuan.value = isCustom ? '' : tujuan
    customTujuanInput.value = ''

    try {
      const list = JSON.parse(tpl.placeholders)
      templatePlaceholders.value = Array.isArray(list) ? list : []
    } catch {
      templatePlaceholders.value = []
    }
  },
  { immediate: true }
)

const handleSubmit = async () => {
  if (!selectedTemplateId.value) {
    toast({
      title: 'Validasi Gagal',
      description: 'Pilih template surat terlebih dahulu.',
      variant: 'destructive',
    })
    return
  }

  if (!perihal.value.trim()) {
    toast({
      title: 'Validasi Gagal',
      description: 'Perihal surat wajib diisi.',
      variant: 'destructive',
    })
    return
  }

  if (!computedFinalTujuan.value) {
    toast({
      title: 'Validasi Gagal',
      description: 'Tujuan surat wajib diisi atau dipilih.',
      variant: 'destructive',
    })
    return
  }

  // Validasi: Ketum dan Penandatangan Dasar tidak boleh orang yang sama
  if (selectedKetumId.value && selectedKetupelId.value && selectedKetumId.value === selectedKetupelId.value) {
    toast({
      title: 'Validasi Tanda Tangan',
      description: 'Ketua Umum dan Penandatangan Dasar tidak boleh orang yang sama.',
      variant: 'destructive',
    })
    return
  }

  isSubmitting.value = true
  try {
    const ketum = userList.value.find((u) => u.id === selectedKetumId.value)
    const ketupel = userList.value.find((u) => u.id === selectedKetupelId.value)
    const todayTanggalSurat = idDateOnlyFormatter.format(new Date())
    const finalPerihal = computedFinalPerihal.value
    const finalTujuan = computedFinalTujuan.value

    const finalReplacements: Record<string, string> = {
      nomor_surat: computedNomorSurat.value,
      tanggal_surat: todayTanggalSurat,
      tanggal_pembuatan: todayTanggalSurat,
      hari_tanggal_surat: idLongDateFormatter.format(new Date()),
      perihal: finalPerihal,
      tujuan: finalTujuan,
      tujuan_surat: finalTujuan,
      nama_tamu: finalTujuan,
      nama_kegiatan: namaKegiatan.value.trim(),
      hari_tanggal: formattedHariTanggal.value,
      tanggal_acara: formattedHariTanggal.value,
      tanggal_pelaksanaan: formattedHariTanggal.value,
      tanggal: formattedHariTanggal.value || todayTanggalSurat,
      waktu: formattedWaktu.value,
      waktu_acara: formattedWaktu.value,
      jam_acara: formattedWaktu.value,
      jam_mulai: jamMulai.value,
      jam_selesai: isSampaiSelesai.value ? 'Selesai' : jamSelesai.value,
      tempat: tempatAcara.value.trim(),
      narahubung: formattedNarahubung.value,
      nama_narahubung: namaNarahubung.value.trim(),
      nohp_narahubung: nohpNarahubung.value.trim(),
      narahubung_nama: namaNarahubung.value.trim(),
      narahubung_nohp: nohpNarahubung.value.trim(),
      narahubung_hp: nohpNarahubung.value.trim(),
      nama_cp: namaNarahubung.value.trim(),
      nohp_cp: nohpNarahubung.value.trim(),
      no_hp: nohpNarahubung.value.trim(),
      nama_ketum: ketum?.nama || '',
      nim_ketum: ketum?.nim || '',
      nama_dasar: ketupel?.nama || '',
      nim_dasar: ketupel?.nim || '',
      nama_tingkat_1: ketupel?.nama || '',
      nim_tingkat_1: ketupel?.nim || '',
      nama_lapis_1: ketupel?.nama || '',
      nim_lapis_1: ketupel?.nim || '',
      nama_lapis1: ketupel?.nama || '',
      nim_lapis1: ketupel?.nim || '',
      nama_ketupel: ketupel?.nama || '',
      nim_ketupel: ketupel?.nim || '',
      ...dynamicReplacements.value,
    }

    const isNoProker = !selectedProkerCode.value || selectedProkerCode.value === 'NONE'
    const matchedProker = isNoProker
      ? undefined
      : prokerList.value.find(
          (p) => p.nama_proker.toUpperCase().replace(/\s+/g, '-') === selectedProkerCode.value
        )

    const res = await templateService.generate({
      template_id: selectedTemplateId.value,
      folder_url: outputFolderUrl.value.trim() || undefined,
      nomor_surat: computedNomorSurat.value,
      file_name: computedFileName.value,
      perihal: finalPerihal,
      tujuan: finalTujuan,
      pic_nama: currentUser.value?.nama || currentUsername.value || 'Sekretaris',
      proker_id: matchedProker ? matchedProker.id : undefined,
      replacements: finalReplacements,
    })

    generationResult.value = {
      surat: res.surat,
      gdocs_url: res.gdocs_url,
      pdf_url: res.pdf_url,
    }

    emit('created', res.surat)

    toast({
      title: 'Surat Berhasil Dibuat',
      description: `Dokumen "${res.surat.nomor_surat}" berhasil dibuat dan disimpan di Google Drive.`,
      variant: 'success',
    })
  } catch (err: any) {
    toast({
      title: 'Gagal Men-generate Surat',
      description: err.response?.data?.error || err.message || 'Terjadi kesalahan sistem saat memproses dokumen',
      variant: 'destructive',
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleFinish = () => {
  generationResult.value = null
  perihal.value = ''
  namaKegiatan.value = ''
  tanggalMulai.value = ''
  tanggalSelesai.value = ''
  jamMulai.value = ''
  jamSelesai.value = ''
  isSampaiSelesai.value = false
  tempatAcara.value = ''
  namaNarahubung.value = ''
  nohpNarahubung.value = ''
  selectedKetupelId.value = ''
  dynamicReplacements.value = {}
  emit('close')
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="emit('close')">
    <DialogContent v-if="isOpen" size="3xl" class="p-0 max-h-[90vh] flex flex-col overflow-hidden">
      <DialogHeader class="px-6 py-4 border-b border-slate-100 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <DialogTitle class="text-base font-semibold text-slate-900 tracking-tight">
              Buat Surat Resmi DOSCOM
            </DialogTitle>
            <DialogDescription class="text-xs text-slate-500">
              Template otomatis dengan nomor surat segmented, jadwal kegiatan, dan tanda tangan pengurus.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <!-- SUCCESS STATE: Link GDocs & PDF Instan (Sub-Component) -->
      <GeneratorSuccessView
        v-if="generationResult"
        :result="generationResult"
        @finish="handleFinish"
        @new-generation="handleFinish"
      />

      <!-- FORM STATE -->
      <form v-else @submit.prevent="handleSubmit" class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4 overscroll-contain [transform:translateZ(0)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <!-- ALERT KETUM: Muncul jika data Ketua Umum belum ada di data users -->
        <div
          v-if="!isLoadingData && !ketumUser"
          role="alert"
          class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs"
        >
          <svg class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="space-y-0.5">
            <p class="font-bold">Data Ketua Umum Belum Ditemukan</p>
            <p class="text-[11px] text-amber-800 leading-relaxed">
              Belum ada akun pengurus dengan divisi <b>"Ketua Umum"</b> di sistem. Silakan tambahkan atau ubah divisi akun di menu <b>Pengurus</b> agar tanda tangan Ketua Umum terisi otomatis.
            </p>
          </div>
        </div>

        <!-- BLOK 1: TEMPLATE & NOMOR SURAT SEGMENTED (SEPERTI VERSI AWAL) -->
        <div class="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div class="flex items-center justify-between">
            <Label class="text-xs font-semibold text-slate-800">
              1. Pilih Template &amp; Nomor Surat
            </Label>
            <Badge variant="outline" size="xs">
              Segmented Input
            </Badge>
          </div>

          <!-- Pilihan Template -->
          <div class="space-y-1">
            <div class="relative w-full">
              <select
                v-model="selectedTemplateId"
                class="w-full h-10 pl-3 pr-8 appearance-none text-xs rounded-xl bg-white border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
              >
                <option value="" disabled>Pilih jenis surat...</option>
                <option
                  v-for="tpl in templates"
                  :key="tpl.id"
                  :value="tpl.id"
                >
                  {{ tpl.nama_template }}
                </option>
              </select>
              <svg class="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Format Nomor Surat Terpisah-pisah -->
          <div class="space-y-1.5 pt-1">
            <Label class="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Format Nomor Surat
            </Label>

            <div class="flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <!-- No Urut (Auto dari prefix nama template, editable) -->
              <Input
                v-model="noUrut"
                type="text"
                placeholder="01"
                class="w-14 h-8 text-xs font-mono font-bold text-center rounded-xl bg-zinc-50 border-zinc-200"
                title="Nomor Urut Surat (diambil dari awalan nama template)"
              />

              <span class="text-zinc-400 font-semibold text-xs select-none">/</span>

              <!-- Static DOSCOM Badge -->
              <Badge variant="info" class="font-mono font-bold select-none">
                DOSCOM
              </Badge>

              <span class="text-zinc-400 font-semibold text-xs select-none">/</span>

              <!-- Pilihan Proker (Native Select) -->
              <div class="min-w-[130px] flex-1 relative">
                <select
                  v-model="selectedProkerCode"
                  class="w-full h-8 pl-2.5 pr-7 appearance-none text-xs rounded-xl bg-zinc-50 border border-zinc-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-medium"
                >
                  <option value="NONE">Tanpa Proker (Kosong)</option>
                  <option
                    v-for="proker in prokerList"
                    :key="proker.id"
                    :value="proker.nama_proker.toUpperCase().replace(/\s+/g, '-')"
                  >
                    {{ proker.nama_proker }}
                  </option>
                </select>
                <svg class="w-3 h-3 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <span class="text-zinc-400 font-semibold text-xs select-none">/</span>

              <!-- Pilihan Bulan Romawi (Native Select, zero portal overhead) -->
              <div class="w-16">
                <select
                  v-model="selectedBulan"
                  class="w-full h-8 px-1 appearance-none text-xs font-mono font-semibold text-center rounded-xl bg-zinc-50 border border-zinc-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  title="Pilih Bulan Romawi"
                >
                  <option v-for="b in ROMAN_MONTHS" :key="b" :value="b">
                    {{ b }}
                  </option>
                </select>
              </div>

              <span class="text-zinc-400 font-semibold text-xs select-none">/</span>

              <!-- Input Tahun -->
              <Input
                v-model="selectedTahun"
                type="text"
                placeholder="2026"
                class="w-18 h-8 text-xs font-mono font-semibold text-center rounded-xl bg-zinc-50 border-zinc-200"
              />
            </div>

            <!-- Live Preview: Nomor & Nama File -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 pt-0.5 text-xs text-slate-500">
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-slate-400">Preview Nomor:</span>
                <Badge variant="info" size="xs" class="font-mono font-bold">
                  {{ computedNomorSurat }}
                </Badge>
              </div>
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-[11px] text-slate-400 shrink-0">Nama File:</span>
                <Badge
                  variant="success"
                  size="xs"
                  class="font-mono truncate"
                  :title="computedFileName"
                >
                  {{ computedFileName }}
                </Badge>
              </div>
            </div>
          </div>

          <!-- Perihal Surat -->
          <div class="space-y-1 pt-1">
            <div class="flex items-center justify-between">
              <Label for="perihal" class="text-xs font-semibold text-slate-800">
                Perihal Surat <span class="text-rose-500">*</span>
              </Label>
              <span v-if="namaKegiatan.trim() && computedFinalPerihal !== perihal" class="text-[10px] text-emerald-600 font-medium truncate max-w-[220px]" :title="computedFinalPerihal">
                Kanban: {{ computedFinalPerihal }}
              </span>
            </div>
            <Input
              id="perihal"
              v-model="perihal"
              type="text"
              required
              placeholder="Contoh: Peminjaman Ruangan Kampus"
              class="h-9 text-xs rounded-xl bg-white border-zinc-200"
            />
          </div>

          <!-- Tujuan Surat (Tertuju Kepada) -->
          <div class="space-y-1 pt-1">
            <div class="flex items-center justify-between">
              <Label class="text-xs font-semibold text-slate-800">
                Tujuan Surat (Tertuju Kepada) <span class="text-rose-500">*</span>
              </Label>
              <button
                type="button"
                @click="toggleCustomTujuan"
                class="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {{ isCustomTujuan ? '← Pilih dari Daftar Instansi' : '+ Ketik Manual / Custom' }}
              </button>
            </div>

            <!-- Mode 1: Select dari Daftar Instansi -->
            <div v-if="!isCustomTujuan" class="relative w-full">
              <select
                v-model="selectedTujuan"
                class="w-full h-9 pl-3 pr-8 appearance-none text-xs rounded-xl bg-white border border-zinc-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
              >
                <option value="" disabled>Pilih instansi tujuan...</option>
                <option
                  v-if="selectedTujuan && !instansiList.some((i) => i.nama_instansi === selectedTujuan)"
                  :value="selectedTujuan"
                >
                  {{ selectedTujuan }} (Default)
                </option>
                <option
                  v-for="inst in instansiList"
                  :key="inst.id"
                  :value="inst.nama_instansi"
                >
                  {{ inst.nama_instansi }} ({{ inst.kategori }})
                </option>
              </select>
              <svg class="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <!-- Mode 2: Input Manual Bebas -->
            <div v-else>
              <Input
                id="tujuan-custom"
                v-model="customTujuanInput"
                type="text"
                required
                placeholder="Contoh: BEM KM UDINUS / PT. Teknologi Nusantara"
                class="h-9 text-xs rounded-xl bg-white border-zinc-200"
              />
            </div>
          </div>
        </div>

        <!-- BLOK 2: DETAIL KEGIATAN & WAKTU ACARA -->
        <div class="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <Label class="text-xs font-semibold text-slate-800 block">
            2. Detail Jadwal Pelaksanaan / Acara / Peminjaman
          </Label>

          <div class="space-y-1">
            <Label for="nama-kegiatan" class="text-xs font-medium text-slate-700">Nama Kegiatan / Agenda</Label>
            <Input
              id="nama-kegiatan"
              v-model="namaKegiatan"
              type="text"
              placeholder="Contoh: Penutupan DOSCOM University 2026"
              class="h-9 text-xs rounded-xl bg-white border-zinc-200"
            />
          </div>

          <!-- Opsi Tanggal: 1 Hari vs Rentang Hari -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label class="text-xs font-medium text-slate-700">Hari &amp; Tanggal Pelaksanaan</Label>
              <div class="flex items-center gap-1 bg-white p-0.5 rounded-full border border-slate-200">
                <Button
                  type="button"
                  size="xs"
                  :variant="tipeTanggal === 'single' ? 'default' : 'ghost'"
                  @click="tipeTanggal = 'single'"
                >
                  1 Hari
                </Button>
                <Button
                  type="button"
                  size="xs"
                  :variant="tipeTanggal === 'range' ? 'default' : 'ghost'"
                  @click="tipeTanggal = 'range'"
                >
                  Rentang Hari
                </Button>
              </div>
            </div>

            <!-- Single Date Input -->
            <div v-if="tipeTanggal === 'single'" class="space-y-1">
              <SimpleDatePicker
                v-model="tanggalMulai"
                placeholder="Pilih Tanggal Acara"
              />
            </div>

            <!-- Range Date Inputs -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="space-y-0.5">
                <span class="text-[10px] text-slate-400">Tanggal Mulai:</span>
                <SimpleDatePicker
                  v-model="tanggalMulai"
                  placeholder="Pilih Tanggal Mulai"
                />
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] text-slate-400">Tanggal Selesai:</span>
                <SimpleDatePicker
                  v-model="tanggalSelesai"
                  :min="tanggalMulai"
                  placeholder="Pilih Tanggal Selesai"
                />
              </div>
            </div>

            <p v-if="formattedHariTanggal" class="text-[11px] text-sky-700 font-medium">
              Format di surat: <span class="font-semibold">{{ formattedHariTanggal }}</span>
            </p>
          </div>

          <!-- Waktu, Tempat, dan Narahubung (2 Input Terpisah) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Waktu Acara (Jam Mulai & Jam Selesai / Sampai Selesai) -->
            <div class="space-y-2 col-span-1 sm:col-span-2 p-3 bg-white rounded-xl border border-slate-200">
              <div class="flex items-center justify-between">
                <Label class="text-xs font-medium text-slate-700">Waktu Acara</Label>
                <label class="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    v-model="isSampaiSelesai"
                    class="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  Sampai Selesai
                </label>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <span class="text-[11px] text-slate-500 block">Jam Mulai</span>
                  <WheelTimePicker
                    v-model="jamMulai"
                    placeholder="Mulai (WIB)"
                  />
                </div>
                <div class="space-y-1">
                  <span class="text-[11px] text-slate-500 block">Jam Selesai</span>
                  <WheelTimePicker
                    v-model="jamSelesai"
                    :disabled="isSampaiSelesai"
                    placeholder="Selesai (WIB)"
                  />
                </div>
              </div>
              <p v-if="formattedWaktu" class="text-[11px] text-sky-700 font-medium">
                Format di surat: <span class="font-semibold">{{ formattedWaktu }}</span>
              </p>
            </div>

            <div class="space-y-1 col-span-1 sm:col-span-2">
              <Label for="tempat" class="text-xs font-medium text-slate-700">Tempat Acara</Label>
              <Input
                id="tempat"
                v-model="tempatAcara"
                type="text"
                placeholder="Contoh: Gedung H Lt. 7 UDINUS"
                class="h-9 text-xs rounded-xl bg-white border-zinc-200"
              />
            </div>

            <!-- Narahubung Input 1: Nama -->
            <div class="space-y-1">
              <Label for="nama-narahubung" class="text-xs font-medium text-slate-700">Nama Narahubung (CP)</Label>
              <Input
                id="nama-narahubung"
                v-model="namaNarahubung"
                type="text"
                placeholder="Contoh: Saudara Budi"
                class="h-9 text-xs rounded-xl bg-white border-zinc-200"
              />
            </div>

            <!-- Narahubung Input 2: No HP / WA -->
            <div class="space-y-1">
              <Label for="nohp-narahubung" class="text-xs font-medium text-slate-700">No. HP / WhatsApp</Label>
              <Input
                id="nohp-narahubung"
                v-model="nohpNarahubung"
                type="tel"
                placeholder="Contoh: 081234567890"
                class="h-9 text-xs rounded-xl bg-white border-zinc-200"
              />
            </div>
          </div>
        </div>

        <!-- BLOK 3: TANDA TANGAN (KETUM DI KIRI, KETUPEL DI KANAN) -->
        <div class="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div class="flex items-center justify-between">
            <Label class="text-xs font-semibold text-slate-800">
              3. Penandatangan Surat (Pengurus)
            </Label>
            <span class="text-[10px] text-slate-400">Pembina &amp; WR III statis di template</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <!-- TTD 1: KETUA UMUM (POSISI KIRI) -->
            <div class="space-y-1">
              <Label class="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <span>Ketua Umum</span>
                <span v-if="ketumUser" class="text-[10px] text-emerald-600 font-semibold font-mono">(Terdeteksi)</span>
              </Label>
              <div class="relative w-full">
                <select
                  v-model="selectedKetumId"
                  class="w-full h-9 pl-3 pr-8 appearance-none text-xs rounded-xl bg-white border border-zinc-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                >
                  <option value="" disabled>Pilih Ketua Umum...</option>
                  <option
                    v-for="u in ketumOptions"
                    :key="u.id"
                    :value="u.id"
                  >
                    {{ u.nama }} ({{ u.nim || u.username }})
                  </option>
                </select>
                <svg class="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <!-- TTD 2: KETUA PELAKSANA / PEMBUAT (POSISI KANAN) -->
            <div class="space-y-1">
              <Label class="text-xs font-medium text-slate-700">
                Penandatangan Dasar
              </Label>
              <div class="relative w-full">
                <select
                  v-model="selectedKetupelId"
                  class="w-full h-9 pl-3 pr-8 appearance-none text-xs rounded-xl bg-white border border-zinc-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                >
                  <option value="" disabled>Pilih Penandatangan Dasar...</option>
                  <option
                    v-for="u in lapis1Users"
                    :key="u.id"
                    :value="u.id"
                  >
                    {{ u.nama }} ({{ u.nim || u.username }})
                  </option>
                </select>
                <svg class="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- BLOK 4: VARIABEL EKSTRA (Sub-Component) -->
        <GeneratorDynamicFields
          :extra-placeholders="extraPlaceholders"
          :replacements="dynamicReplacements"
        />
      </div>

      <!-- STICKY FOOTER -->
      <DialogFooter class="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-2 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          @click="emit('close')"
          class="rounded-full px-4 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          Batal
        </Button>

        <Button
          type="submit"
          :disabled="isSubmitting || templates.length === 0"
          class="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <svg
            v-if="isSubmitting"
            class="w-3.5 h-3.5 mr-1.5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ isSubmitting ? 'Memproses ke GDrive...' : 'Generate Surat (GDocs & PDF) →' }}</span>
        </Button>
      </DialogFooter>
    </form>
    </DialogContent>
  </Dialog>
</template>

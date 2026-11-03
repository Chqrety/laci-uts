<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

const props = defineProps<{
  open: boolean
  suratId: string
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'close'): void
  (e: 'captured'): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const mediaStream = ref<MediaStream | null>(null)
const isCapturing = ref(false)
const cameraError = ref('')

const stopCamera = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => track.stop())
    mediaStream.value = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  cameraError.value = ''
  emit('update:open', false)
  emit('close')
}

const startCamera = async () => {
  cameraError.value = ''
  try {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('WebRTC tidak didukung atau memerlukan HTTPS.')
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
      },
    })
    mediaStream.value = stream
    await nextTick()
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play().catch(() => {})
    }
  } catch (err: any) {
    console.error('Camera access error:', err)
    cameraError.value =
      err.name === 'NotAllowedError'
        ? 'Izin kamera ditolak. Silakan gunakan kamera bawaan perangkat.'
        : 'Kamera WebRTC tidak dapat diakses di jaringan ini. Silakan gunakan kamera bawaan perangkat.'
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopCamera()
})

const captureAndSave = async () => {
  if (!videoRef.value || !mediaStream.value) return
  isCapturing.value = true
  cameraError.value = ''

  try {
    const video = videoRef.value
    const canvas = document.createElement('canvas')
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Gagal menyiapkan canvas gambar')
    ctx.drawImage(video, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9),
    )

    if (!blob) throw new Error('Gagal memproses frame kamera')

    const filename = `arsip-${props.suratId.slice(0, 8)}-${Date.now()}.jpg`
    const formData = new FormData()
    formData.append('file', blob, filename)

    await api.post(`/letters/${props.suratId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    stopCamera()
    toast({
      title: 'Berhasil',
      description: 'Foto arsip berhasil dijepret & diunggah',
      variant: 'success',
    })
    emit('captured')
  } catch (err: any) {
    console.error('Capture and upload error:', err)
    cameraError.value = err.response?.data?.error || err.message || 'Gagal menyimpan foto arsip'
    toast({
      title: 'Gagal',
      description: cameraError.value,
      variant: 'destructive',
    })
  } finally {
    isCapturing.value = false
  }
}
</script>

<template>
  <div
    v-if="open"
    class="rounded-3xl border border-black/10 bg-zinc-950 p-3.5 shadow-xl space-y-3 text-white overflow-hidden"
  >
    <div class="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
      <video
        ref="videoRef"
        autoplay
        playsinline
        muted
        class="w-full h-full object-cover"
      ></video>

      <div
        v-if="!mediaStream && !cameraError"
        class="absolute inset-0 flex items-center justify-center bg-black/70 text-xs text-zinc-300"
      >
        Memulai kamera belakang...
      </div>

      <div
        v-if="cameraError"
        class="absolute inset-0 p-4 flex items-center justify-center text-center bg-black/85 text-xs text-rose-400 font-medium"
      >
        {{ cameraError }}
      </div>
    </div>

    <!-- Camera Controls -->
    <div class="flex items-center justify-between px-1 pt-0.5">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        @click="stopCamera"
      >
        Tutup
      </Button>

      <Button
        type="button"
        size="sm"
        @click="captureAndSave"
        :disabled="isCapturing || !mediaStream"
      >
        <span v-if="!isCapturing" class="w-2.5 h-2.5 rounded-full bg-white mr-1"></span>
        <span>{{ isCapturing ? 'Menyimpan...' : 'Jepret & Simpan' }}</span>
      </Button>
    </div>
  </div>
</template>

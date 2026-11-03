<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

defineProps<{
  extraPlaceholders: string[]
  replacements: Record<string, string>
}>()
</script>

<template>
  <div v-if="extraPlaceholders.length > 0" class="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
    <Label class="text-xs font-semibold text-slate-800 block">
      Variabel Tambahan Template
    </Label>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div v-for="phKey in extraPlaceholders" :key="phKey" class="space-y-1">
        <Label :for="'ph-' + phKey" class="text-[11px] font-medium text-slate-700">
          {{ phKey.replace(/_/g, ' ').toUpperCase() }}
        </Label>
        <Input
          :id="'ph-' + phKey"
          v-model="replacements[phKey]"
          type="text"
          :placeholder="'Isi ' + phKey"
          class="h-8 text-xs rounded-xl bg-white border-zinc-200"
        />
      </div>
    </div>
  </div>
</template>

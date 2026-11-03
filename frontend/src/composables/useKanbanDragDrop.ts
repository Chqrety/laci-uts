import { ref, onBeforeUnmount, nextTick, type Ref } from 'vue'
import type { Surat } from '@/services/api'

export function useKanbanDragDrop(
  suratList: Ref<Surat[]>,
  statusColumns: readonly string[] | string[],
  onStatusUpdate: (suratId: string, targetStatus: string) => Promise<void>,
) {
  const draggingCardId = ref<string | null>(null)
  const dragOverColumn = ref<string | null>(null)

  const ambientDrop = ref<{
    active: boolean
    direction: 'left' | 'right' | null
    targetStatus: string | null
  }>({
    active: false,
    direction: null,
    targetStatus: null,
  })

  const resetAmbientDrop = () => {
    if (ambientDrop.value.active) {
      ambientDrop.value = {
        active: false,
        direction: null,
        targetStatus: null,
      }
    }
  }

  const scrollToColumn = (status: string) => {
    nextTick(() => {
      const colEl = document.querySelector(`[data-status="${status}"]`) as HTMLElement | null
      if (colEl) {
        colEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    })
  }

  const checkEdgeDetection = (clientX: number) => {
    if (!draggingCardId.value) {
      resetAmbientDrop()
      return
    }

    const card = suratList.value.find((s) => s.id === draggingCardId.value)
    if (!card) {
      resetAmbientDrop()
      return
    }

    const currentIndex = statusColumns.findIndex(
      (col) => col.toLowerCase() === card.status_saat_ini.toLowerCase(),
    )
    if (currentIndex === -1) {
      resetAmbientDrop()
      return
    }

    const screenWidth = window.innerWidth
    const edgeThreshold = 55

    if (clientX < edgeThreshold) {
      if (currentIndex > 0) {
        ambientDrop.value = {
          active: true,
          direction: 'left',
          targetStatus: statusColumns[currentIndex - 1] ?? null,
        }
        return
      }
    } else if (clientX > screenWidth - edgeThreshold) {
      if (currentIndex < statusColumns.length - 1) {
        ambientDrop.value = {
          active: true,
          direction: 'right',
          targetStatus: statusColumns[currentIndex + 1] ?? null,
        }
        return
      }
    }

    resetAmbientDrop()
  }

  // Native HTML5 Desktop Drag and Drop Handlers
  const onDragStart = (event: DragEvent, suratId: string) => {
    draggingCardId.value = suratId
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', suratId)
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  const onDrag = (event: DragEvent) => {
    if (event.clientX === 0 && event.clientY === 0) return
    checkEdgeDetection(event.clientX)
  }

  const onDragEnd = async () => {
    if (ambientDrop.value.active && ambientDrop.value.targetStatus && draggingCardId.value) {
      const cardId = draggingCardId.value
      const targetStatus = ambientDrop.value.targetStatus
      resetAmbientDrop()
      draggingCardId.value = null
      dragOverColumn.value = null
      await onStatusUpdate(cardId, targetStatus)
      scrollToColumn(targetStatus)
      return
    }
    resetAmbientDrop()
    draggingCardId.value = null
    dragOverColumn.value = null
  }

  const onDragOver = (event: DragEvent, status: string) => {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    dragOverColumn.value = status
    checkEdgeDetection(event.clientX)
  }

  const onDragEnter = (status: string) => {
    dragOverColumn.value = status
  }

  const onDragLeave = (status: string, event: DragEvent) => {
    const currentTarget = event.currentTarget as HTMLElement
    const relatedTarget = event.relatedTarget as HTMLElement | null
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      if (dragOverColumn.value === status) {
        dragOverColumn.value = null
      }
    }
  }

  const onDrop = async (event: DragEvent, targetStatus: string) => {
    dragOverColumn.value = null
    const suratId = event.dataTransfer?.getData('text/plain') || draggingCardId.value
    const isAmbient = ambientDrop.value.active && ambientDrop.value.targetStatus
    const finalTarget = isAmbient ? ambientDrop.value.targetStatus! : targetStatus

    resetAmbientDrop()
    draggingCardId.value = null
    if (!suratId) return

    await onStatusUpdate(suratId, finalTarget)
    if (isAmbient) {
      scrollToColumn(finalTarget)
    }
  }

  // Mobile Touch Drag State (Long Press to Drag & Ghost Card)
  const isDragging = ref(false)
  let dragTimer: ReturnType<typeof setTimeout> | null = null
  let touchGhostElement: HTMLElement | null = null
  let touchOffsetX = 0
  let touchOffsetY = 0
  let touchSuratId: string | null = null
  let touchCardElement: HTMLElement | null = null

  const cleanupGhostElement = () => {
    if (touchGhostElement) {
      touchGhostElement.remove()
      touchGhostElement = null
    }
  }

  onBeforeUnmount(() => {
    if (dragTimer) clearTimeout(dragTimer)
    cleanupGhostElement()
  })

  const handleTouchStart = (event: TouchEvent, suratId: string) => {
    if (dragTimer) {
      clearTimeout(dragTimer)
      dragTimer = null
    }
    cleanupGhostElement()
    isDragging.value = false

    const touch = event.touches[0]
    if (!touch) return

    const target = (event.currentTarget || event.target) as HTMLElement
    const cardElement = (target.closest('article') || target) as HTMLElement
    const rect = cardElement.getBoundingClientRect()

    touchOffsetX = touch.clientX - rect.left
    touchOffsetY = touch.clientY - rect.top
    touchSuratId = suratId
    touchCardElement = cardElement

    dragTimer = setTimeout(() => {
      isDragging.value = true
      draggingCardId.value = suratId

      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(50)
        } catch (_) {}
      }

      if (touchCardElement) {
        const clone = touchCardElement.cloneNode(true) as HTMLElement
        clone.id = 'touch-drag-ghost'
        clone.classList.add('will-change-transform', 'transform-gpu')
        clone.style.position = 'fixed'
        clone.style.left = `${touch.clientX - touchOffsetX}px`
        clone.style.top = `${touch.clientY - touchOffsetY}px`
        clone.style.width = `${rect.width}px`
        clone.style.zIndex = '9999'
        clone.style.opacity = '0.85'
        clone.style.pointerEvents = 'none'
        clone.style.transform = 'scale(1.04) rotate(1.5deg)'
        clone.style.willChange = 'transform, left, top'
        clone.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)'
        clone.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease'
        document.body.appendChild(clone)
        touchGhostElement = clone
      }
    }, 300)
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!isDragging.value) {
      if (dragTimer) {
        clearTimeout(dragTimer)
        dragTimer = null
      }
      return
    }

    if (event.cancelable) {
      event.preventDefault()
    }

    const touch = event.touches[0]
    if (!touch) return

    if (touchGhostElement) {
      touchGhostElement.style.left = `${touch.clientX - touchOffsetX}px`
      touchGhostElement.style.top = `${touch.clientY - touchOffsetY}px`
    }

    checkEdgeDetection(touch.clientX)

    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY)
    const columnElement = elementUnderTouch?.closest('[data-status]')
    if (columnElement) {
      const status = columnElement.getAttribute('data-status')
      if (status) {
        dragOverColumn.value = status
      }
    } else {
      dragOverColumn.value = null
    }
  }

  const handleTouchEnd = async (event?: TouchEvent) => {
    if (dragTimer) {
      clearTimeout(dragTimer)
      dragTimer = null
    }

    const wasDragging = isDragging.value
    const cardId = draggingCardId.value || touchSuratId

    cleanupGhostElement()

    if (wasDragging && cardId) {
      const isAmbient = ambientDrop.value.active && ambientDrop.value.targetStatus

      if (isAmbient) {
        const targetStatus = ambientDrop.value.targetStatus!
        resetAmbientDrop()
        draggingCardId.value = null
        dragOverColumn.value = null
        isDragging.value = false
        touchSuratId = null
        touchCardElement = null

        await onStatusUpdate(cardId, targetStatus)
        scrollToColumn(targetStatus)
        return
      }

      let targetCol = dragOverColumn.value
      if (!targetCol && event && event.changedTouches && event.changedTouches[0]) {
        const endTouch = event.changedTouches[0]
        const el = document.elementFromPoint(endTouch.clientX, endTouch.clientY)
        const colEl = el?.closest('[data-status]')
        if (colEl) {
          targetCol = colEl.getAttribute('data-status')
        }
      }

      if (targetCol) {
        const targetStatus = targetCol
        resetAmbientDrop()
        dragOverColumn.value = null
        draggingCardId.value = null
        isDragging.value = false
        touchSuratId = null
        touchCardElement = null

        await onStatusUpdate(cardId, targetStatus)
        scrollToColumn(targetStatus)
        return
      }
    }

    resetAmbientDrop()
    draggingCardId.value = null
    dragOverColumn.value = null
    isDragging.value = false
    touchSuratId = null
    touchCardElement = null
  }

  return {
    draggingCardId,
    dragOverColumn,
    ambientDrop,
    isDragging,
    onDragStart,
    onDrag,
    onDragEnd,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}

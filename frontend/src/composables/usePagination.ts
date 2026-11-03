import { ref, computed, type Ref, type ComputedRef } from 'vue'

export function usePagination<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  defaultPageSize: number = 15,
) {
  const currentPage = ref(1)
  const itemsPerPage = ref(defaultPageSize)

  const totalItems = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / itemsPerPage.value)))

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    return items.value.slice(start, start + itemsPerPage.value)
  })

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  const setPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const resetPage = () => {
    currentPage.value = 1
  }

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    setPage,
    resetPage,
  }
}

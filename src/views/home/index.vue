<script setup lang="ts">
import TopNav from "@/component/topnav/index.vue";
</script>

<template>
  <top-nav></top-nav>
  <div class="content">
    <RouterView></RouterView>
  </div>
</template>

<script lang="ts"></script>

<style lang="scss" scoped>
.about-container {
  @apply min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4;

  .about-card {
    @apply max-w-4xl mx-auto mt-12 bg-white rounded-2xl shadow-lg p-8;

    .about-title {
      @apply text-3xl font-bold text-center text-gray-800 mb-6;
    }

    .about-description {
      @apply text-lg text-gray-600 text-center mb-10;
    }

    .features {
      @apply grid grid-cols-1 md:grid-cols-2 gap-6;

      .feature-card {
        @apply rounded-lg border border-gray-200;

        :deep(.el-card__header) {
          @apply bg-blue-50 font-semibold;
        }

        .card-content {
          @apply text-gray-600;
        }
      }
    }
  }
}
</style>

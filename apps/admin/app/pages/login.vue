<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';

definePageMeta({
  layout: 'auth',
});

const { login } = useAuth();

const state = reactive<LoginInput>({
  email: '',
  password: '',
});

const loading = ref(false);
const errorMessage = ref('');

async function onSubmit(event: FormSubmitEvent<LoginInput>) {
  loading.value = true;
  errorMessage.value = '';

  try {
    await login(event.data);
  } catch (error: unknown) {
    const err = error as {
      statusMessage?: string;
      data?: { message?: string };
    };
    errorMessage.value =
      err.data?.message || err.statusMessage || 'Invalid email or password';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="w-full max-w-sm space-y-6 px-4">
    <!-- Header -->
    <div class="text-center">
      <h1
        class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
      >
        Đăng nhập
      </h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Đăng nhập để quản lý hệ thống
      </p>
    </div>

    <!-- Login Card -->
    <UCard>
      <UForm
        :schema="loginSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <!-- Error Alert -->
        <UAlert
          v-if="errorMessage"
          color="error"
          icon="i-lucide-circle-alert"
          :title="errorMessage"
          :close-button="{ onClick: () => (errorMessage = '') }"
          :ui="{ title: 'text-xs' }"
        />

        <!-- Email -->
        <UFormField label="Email" name="email">
          <UInput
            v-model="state.email"
            type="email"
            placeholder="admin@example.com"
            icon="i-lucide-mail"
            autocomplete="email"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <!-- Password -->
        <UFormField label="Mật khẩu" name="password">
          <UInput
            v-model="state.password"
            type="password"
            placeholder="Enter your password"
            icon="i-lucide-lock"
            autocomplete="current-password"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <!-- Submit -->
        <UButton
          type="submit"
          label="Đăng nhập"
          icon="i-lucide-log-in"
          size="lg"
          block
          :loading="loading"
        />
      </UForm>
    </UCard>
  </div>
</template>

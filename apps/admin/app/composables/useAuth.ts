import type { ApiResponse, TokenPair } from '~~/types/api';

const useAuthState = () => {
  const user = useState<LoginResponse | null>('auth:user', () => null);
  const isLoggedIn = computed(() => !!user.value);
  return { user, isLoggedIn };
};

export function useAuth() {
  const { user, isLoggedIn } = useAuthState();

  async function login(loginInput: LoginInput) {
    const response = await $fetch<ApiResponse<TokenPair & { user: User }>>(
      '/api/auth/login',
      {
        method: 'POST',
        body: loginInput,
      },
    );

    user.value = response.data.user;
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' });
    user.value = null;
    await navigateTo('/login');
  }

  async function fetchUser() {
    try {
      const response = await $fetch<ApiResponse<User>>(
        '/api/proxy/auth/profile',
      );
      user.value = response.data;
    } catch {
      user.value = null;
    }
  }

  async function refresh() {
    try {
      await $fetch('/api/auth/refresh', { method: 'POST' });
      return true;
    } catch {
      user.value = null;
      return false;
    }
  }

  return {
    user,
    isLoggedIn,
    login,
    logout,
    fetchUser,
    refresh,
  };
}

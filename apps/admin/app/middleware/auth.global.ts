export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, fetchUser } = useAuth();

  // Allow access to login page without auth
  if (to.path === '/login') {
    // Redirect to home if already logged in
    if (isLoggedIn.value) {
      return navigateTo('/');
    }
    return;
  }

  // Fetch user if not yet loaded (e.g., on page refresh)
  if (!isLoggedIn.value) {
    await fetchUser();
  }

  // Redirect to login if still not authenticated
  if (!isLoggedIn.value) {
    return navigateTo('/login');
  }
});

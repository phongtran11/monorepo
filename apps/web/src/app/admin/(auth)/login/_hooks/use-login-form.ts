import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { loginAction } from '../action';
import { loginSchema, type LoginFormValues } from '../login.schema';

export function useLoginForm() {
  const [serverError, setServerError] = useState<string>();

  const form = useForm<LoginFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod v4.3 minor version mismatch with @hookform/resolvers
    resolver: zodResolver(loginSchema as any),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginFormValues) {
    setServerError(undefined);
    const result = await loginAction(data);

    if (result?.error) {
      setServerError(result.error);
    }
  }

  return {
    serverError,
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
  };
}

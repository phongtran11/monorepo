import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSessionAction } from '@admin/features/auth/get-session.action';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@admin/components/ui/card';
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSet,
} from '@admin/components/ui/field';
import { Alert, AlertDescription } from '@admin/components/ui/alert';

import { useLoginForm } from '@admin/features/auth/hooks/use-login-form';
import { useState } from 'react';

export const Route = createFileRoute('/auth/login')({
  beforeLoad: async () => {
    const session = await getSessionAction();
    if (session) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { form, onSubmit, serverError, isSubmitting } = useLoginForm();
  const {
    register,
    formState: { errors },
  } = form;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Đăng nhập</CardTitle>
          <CardDescription>
            Nhập thông tin đăng nhập để tiếp tục
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldSet>
              {serverError && (
                <Alert variant="destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <Field data-invalid={!!errors.email || undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                <FieldError>{errors.email?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.password || undefined}>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    className="pr-10"
                    {...register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                <FieldError>{errors.password?.message}</FieldError>
              </Field>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Đăng nhập
              </Button>
            </FieldSet>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

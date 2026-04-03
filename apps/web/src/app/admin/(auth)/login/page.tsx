'use client';

import { CircleAlert, LogIn } from 'lucide-react';

import { Button } from '@web/components/atoms/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@web/components/atoms/card';
import { Input } from '@web/components/atoms/input';
import { Alert, AlertDescription } from '@web/components/atoms/alert';
import { Spinner } from '@web/components/atoms/spinner';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@web/components/atoms/field';

import { useLoginForm } from './_hooks/use-login-form';

export default function AdminLoginPage() {
  const { serverError, register, handleSubmit, errors, isSubmitting } =
    useLoginForm();

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Đăng nhập quản trị</CardTitle>
          <CardDescription>
            Đăng nhập để truy cập trang quản trị
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {serverError && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Field data-invalid={!!errors.email || undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                <FieldError errors={[errors.email]} />
              </Field>

              <Field data-invalid={!!errors.password || undefined}>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <FieldError errors={[errors.password]} />
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner /> : <LogIn data-icon="inline-start" />}
              {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { Button } from '@admin/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@admin/components/ui/card';
import { AlertOctagon, Home, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="max-w-md w-full shadow-lg border-red-100">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 bg-red-100 p-3 rounded-full w-fit">
            <AlertOctagon className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-4xl font-extrabold text-slate-900 tracking-tight">
            500
          </CardTitle>
          <CardDescription className="text-lg font-medium text-slate-600 mt-2">
            Lỗi Hệ Thống
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-slate-500 pb-6">
          <p className="mb-4">
            Đã có lỗi xảy ra từ phía chúng tôi. Chúng tôi đang nỗ lực khắc phục
            sự cố này.
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-4 p-3 bg-slate-100 rounded-md text-left text-xs font-mono text-slate-700 overflow-auto max-h-32">
              <p className="font-semibold text-red-600 mb-1">
                Chi tiết lỗi (Chỉ dành cho Dev):
              </p>
              {error.message || 'Unknown error'}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-3 justify-center pb-6">
          <Button
            variant="outline"
            onClick={() => reset()}
            className="flex-1 border-slate-300"
          >
            <RotateCcw className="mr-2 w-4 h-4" /> Thử Lại
          </Button>
          <Button
            onClick={() => router.push('/')}
            className="flex-1 bg-slate-900 hover:bg-slate-800"
          >
            <Home className="mr-2 w-4 h-4" /> Trang Chủ
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

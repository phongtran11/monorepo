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
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 bg-orange-100 p-3 rounded-full w-fit">
            <AlertCircle className="w-10 h-10 text-orange-600" />
          </div>
          <CardTitle className="text-4xl font-extrabold text-slate-900 tracking-tight">
            404
          </CardTitle>
          <CardDescription className="text-lg font-medium text-slate-600 mt-2">
            Trang không tồn tại
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-slate-500 pb-6">
          <p>
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Vui lòng
            kiểm tra lại địa chỉ trang web hoặc quay về trang chủ.
          </p>
        </CardContent>
        <CardFooter className="flex gap-3 justify-center pb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Quay Lại
          </Button>
          <Button onClick={() => router.push('/')} className="flex-1">
            <Home className="mr-2 w-4 h-4" /> Trang Chủ
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

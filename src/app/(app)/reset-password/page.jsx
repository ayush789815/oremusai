import { Suspense } from 'react';
import ResetPassword from '@/views/ResetPassword.jsx';

export const metadata = {
  title: 'Reset password',
  description: 'Set a new password for your Oremus AI account.',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  );
}

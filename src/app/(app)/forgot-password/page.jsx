import ForgotPassword from '@/views/ForgotPassword.jsx';

export const metadata = {
  title: 'Forgot password',
  description: 'Reset your Oremus AI account password.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}

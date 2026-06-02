import Login from '@/views/Login.jsx';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to your Oremus AI finance workspace.',
  robots: { index: true, follow: true },
};

export default function LoginPage() {
  return <Login />;
}

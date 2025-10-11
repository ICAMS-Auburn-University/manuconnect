import AuthForm from '@/components/forms/AuthForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Sign Up`,
};

const page = () => {
  return (
    <div className="min-w-96">
      <AuthForm type="sign-up" />
    </div>
  );
};

export default page;

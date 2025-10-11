import AuthForm from '@/components/forms/AuthForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Sign In`,
};

const SignIn = () => {
  return (
    <div className="min-w-96">
      <AuthForm type="sign-in" />
    </div>
  );
};

export default SignIn;

import SignInForm from '@/components/forms/SignInForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Sign In`,
};

const SignIn = () => {
  return (
    <div className="min-w-96">
      <SignInForm />
    </div>
  );
};

export default SignIn;

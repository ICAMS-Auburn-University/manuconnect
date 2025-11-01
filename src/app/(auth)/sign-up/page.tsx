import SignUpForm from '@/components/forms/SignUpForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Sign Up`,
};

const page = () => {
  return (
    <div className="min-w-96">
      <SignUpForm />
    </div>
  );
};

export default page;

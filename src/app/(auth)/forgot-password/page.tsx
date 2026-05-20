import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password',
};

const ForgotPasswordPage = () => {
  return (
    <div className="min-w-96 max-w-sm space-y-3 text-center">
      <h1 className="h1 text-[#0c2340]">Forgot Password</h1>
      <p className="text-sm text-muted-foreground">
        Password reset is not wired up yet. Use the sign-in flow or implement a
        Supabase reset-password route before linking users here in production.
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
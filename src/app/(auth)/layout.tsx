import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';

const interFont = Inter({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-inter',
});

const montserratFont = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: {
    template: '%s | ManuConnect',
    default: 'ManuConnect',
  },
  description: 'Connecting Ideas With Manufacturers',
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={`${interFont.className} ${montserratFont.className} flex min-h-screen`}
    >
      <section className="bg-[#e87722] hidden w-1/2  lg:flex lg:flex-col xl:w-2/5">
        <div className="flex">
          <Link
            href="/"
            className="flex flex-row items-center gap-2 bg-white p-4 m-4 rounded-sm"
          >
            <Image src="/logo.svg" width={38} height={41} alt="logo" />
            <h2 className="h2 text-[#e87722]">ManuConnect</h2>
          </Link>
        </div>

        <div className="flex flex-col mx-8 mt-40 text-white max-w-[32rem] gap-2">
          <h1 className="h1 !text-white">Make your ideas come to life</h1>
          <h3 className="h3">Connecting Ideas with Manufacturers</h3>
        </div>
        <div className="mt-auto mb-8 text-white flex flex-col items-center justify-center gap-2">
          <div className="bg-white rounded-sm max-w-fit p-2">
            <Link href="https://www.eng.auburn.edu/icams/">
              <Image
                src="/icams-logo.jpg"
                alt="ICAMS logo"
                width={260}
                height={100}
              />
            </Link>
          </div>
          <h5 className="h5">© 2025</h5>
        </div>
      </section>
      <section className="flex flex-1 flex-col items-center bg-white p-4 py-10 lg:justify-center lg:p-10 lg:py-0">
        {children}
      </section>
    </div>
  );
};

export default AuthLayout;

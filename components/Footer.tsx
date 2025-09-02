import { getAccountType } from "@/utils/supabase/utils";
import Image from "next/image";
import Link from "next/link";

const Footer = async () => {
  const userType = await getAccountType();

  return (
    <footer className="footer border-t w-full mt-auto">
      <div className=" py-8 grid grid-cols-3 items-center gap-2 mx-5">
        <div className="bg-white rounded-sm max-w-fit p-2 text-center">
          <Link href="https://www.eng.auburn.edu/icams/" target="_blank">
            <Image
              src="/icams-logo.jpg"
              alt="ICAMS logo"
              width={260}
              height={100}
            />
          </Link>
          <h5 className="h5">© 2025</h5>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">
            CONFIDENTIAL PROTOTYPE. DO NOT SHARE.
          </p>
        </div>
        <div className="text-right">
          <h5 className="h5 text-muted-foreground">Links</h5>
          <ul>
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="mailto:support@manuconnect.org">Contact</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/tos">Terms of Service</Link>
            </li>
            {userType === "admin" && (
              <li>
                <Link href="/admin">Admin Portal</Link>
                <p className="text-muted-foreground">{process.env.NODE_ENV}</p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

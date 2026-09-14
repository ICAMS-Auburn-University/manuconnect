import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import SignOut from '@/components/forms/SignOut';
import { Button } from '@/components/ui/button';
import {
  getAccountType,
  getInitials,
  getUserData,
} from '@/domain/users/service';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import MobileMenu from '@/components/layout/MobileMenu';
import { Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const Navbar = async () => {
  const userType = await getAccountType();
  const userData = await getUserData();
  const initials = await getInitials();

  console.log('userData in Navbar:', userData);
  return (
    <div className="w-full mt-2 rounded-md border-zinc-200 border text-black shadow-sm">
      <div className="flex content-between items-center p-2 px-4">
        <div className="flex-1 flex items-center">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" width={35} height={38} alt="logo" />
            <h2 className="h2 font-bold ml-2 text-brand">ManuConnect</h2>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-[16px] justify-center items-center">
          <Link href="/orders">
            <p className="navbarLink hover:underline">Your Orders</p>
          </Link>
          <Link href="/cad-upload">
            <p className="navbarLink hover:underline">AI Analysis</p>
          </Link>
          {(userType === 'creator' || userType === 'admin') && (
            <>
              <Link href="/orders/new">
                <Button className="bg-brand px-2 py-1 h-fit hover:bg-brand-100 transition">
                  <Image
                    src="/plus.svg"
                    width="18"
                    height="18"
                    alt="plus icon"
                  />
                  <p className="navbarLink text-white">Request</p>
                </Button>
              </Link>
            </>
          )}

          {(userType === 'manufacturer' || userType === 'admin') && (
            <>
              <Link href="/orders/browse">
                <Button className="bg-brand px-2 py-1 h-fit hover:bg-brand-100 transition">
                  <Image
                    src="/plus.svg"
                    width="18"
                    height="18"
                    alt="plus icon"
                  />
                  <p className="navbarLink text-white">Browse Orders</p>
                </Button>
              </Link>
              <Link href="/profile">
                <p className="navbarLink hover:underline">Shop Profile</p>
              </Link>
            </>
          )}

          <Link href="/messages">
            <Button className="bg-brand px-2 py-1 h-fit hover:bg-brand-100 transition">
              <Mail className="h-4 w-4 mr-2" />
              <p className="navbarLink text-white">Messages</p>
            </Button>
          </Link>

          <Popover>
            <PopoverTrigger>
              <Avatar>
                <AvatarImage
                  src={
                    process.env.NEXT_PUBLIC_SUPABASE_URL +
                    '/storage/v1/object/public/' +
                    userData?.profilePicture
                  }
                ></AvatarImage>
                <AvatarFallback className="bg-brand font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 border-border/60 bg-card/95 p-3 backdrop-blur"
              align="end"
            >
              <p className="h4">{userData?.displayName ?? 'N/A'}</p>
              <p className="text-sm text-muted-foreground">
                {userData?.accountType ?? 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                {userData?.companyName ?? 'N/A'}
              </p>
              <div className="mt-4 space-y-2 border-t border-border/70 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Appearance
                </p>
                <ThemeToggle compact />
              </div>
              <div className="mt-3 border-t border-border/70 pt-3">
                <SignOut className="w-full" />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <MobileMenu
            userType={userType}
            userData={userData}
            initials={initials ?? ''}
          />{' '}
          {/* Pass initials as a prop */}
        </div>
      </div>
    </div>
  );
};

export default Navbar;

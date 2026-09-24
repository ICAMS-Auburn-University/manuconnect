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
import { Mail, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const Navbar = async () => {
  const userType = await getAccountType();
  const userData = await getUserData();
  const initials = await getInitials();

  console.log('userData in Navbar:', userData);
  return (
    <div className="mt-2 w-full rounded-md border border-border/70 bg-card/95 text-foreground shadow-sm backdrop-blur">
      <div className="flex content-between items-center p-2 px-4">
        <div className="flex-1 flex items-center">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" width={35} height={38} alt="logo" />
            <h2 className="h2 font-bold ml-2 text-brand">ManuConnect</h2>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-3 justify-center items-center">
          <Link href="/orders">
            <p className="navbarLink text-foreground hover:text-brand hover:underline">
              Your Orders
            </p>
          </Link>
          <Link href="/cad-upload">
            <p className="navbarLink text-foreground hover:text-brand hover:underline">
              AI Analysis
            </p>
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
            </>
          )}

          <Link href="/messages">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 border-border/70 bg-background/80 hover:bg-muted"
              aria-label="Messages"
            >
              <Mail className="h-4 w-4" />
            </Button>
          </Link>

          <ThemeToggle iconOnly />

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
              {(userType === 'manufacturer' || userType === 'admin') && (
                <Link
                  href="/profile"
                  className="mt-4 flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  <Settings className="h-4 w-4" />
                  Shop Profile
                </Link>
              )}
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

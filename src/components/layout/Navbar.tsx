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

const Navbar = async () => {
  const userType = await getAccountType();
  const userData = await getUserData();
  const initials = await getInitials();

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

          <Popover>
            <PopoverTrigger>
              <Avatar>
                <AvatarImage
                  src={
                    process.env.NEXT_PUBLIC_SUPABASE_URL +
                    '/storage/v1/object/public/' +
                    userData?.user_metadata.profile_picture
                  }
                ></AvatarImage>
                <AvatarFallback className="bg-brand font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent className="bg-white w-40 p-2" align="end">
              <p className="h4">{userData?.user_metadata.display_name}</p>{' '}
              <p className="text-sm text-muted-foreground">
                {userData?.user_metadata.account_type}
              </p>
              <p className="text-sm text-muted-foreground">
                {userData?.user_metadata.company_name}
              </p>
              <div className="flex flex-col gap-2">
                <SignOut className="p-0 text-right w-full bg-black text-white" />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <MobileMenu
            userType={userType}
            userData={userData}
            initials={initials}
          />{' '}
          {/* Pass initials as a prop */}
        </div>
      </div>
    </div>
  );
};

export default Navbar;

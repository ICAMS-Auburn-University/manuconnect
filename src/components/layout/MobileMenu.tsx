'use client';

import type React from 'react';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SignOut from '@/components/forms/SignOut';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type UserMetadata = {
  profile_picture?: string;
  display_name?: string;
  account_type?: string;
  company_name?: string;
};

interface MobileMenuProps {
  userType: string | null;
  userData: { user_metadata?: UserMetadata } | null;
  initials: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  userType,
  userData,
  initials,
}) => {
  return (
    <>
      <Avatar className="md:hidden">
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

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[250px] sm:w-[300px]">
          <SheetHeader className="mb-4">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4">
            {/* User Profile Section */}
            <div className="border-b pb-4">
              <div className="flex items-center gap-2 mb-2">
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
                <div>
                  <p className="font-medium">
                    {userData?.user_metadata.display_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userData?.user_metadata.account_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userData?.user_metadata.company_name}
                  </p>
                </div>
              </div>
              <SignOut className="w-full mt-2" />
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="py-2 px-3 hover:bg-muted rounded-md transition-colors"
              >
                Home
              </Link>

              {(userType === 'creator' || userType === 'admin') && (
                <>
                  <Link
                    href="/orders"
                    className="py-2 px-3 hover:bg-muted rounded-md transition-colors"
                  >
                    View Orders
                  </Link>
                  <Link
                    href="/orders/new"
                    className="py-2 px-3 bg-brand text-white rounded-md hover:bg-brand-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src="/plus.svg"
                        width="18"
                        height="18"
                        alt="plus icon"
                      />
                      <span>Request</span>
                    </div>
                  </Link>
                </>
              )}

              {(userType === 'manufacturer' || userType === 'admin') && (
                <Link
                  href="/orders/browse"
                  className="py-2 px-3 hover:bg-muted rounded-md transition-colors"
                >
                  Browse Orders
                </Link>
              )}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileMenu;

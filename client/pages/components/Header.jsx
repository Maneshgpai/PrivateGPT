import { Disclosure, Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function AppHeader({toggleSidebar}) {
  const [screenWidth, setScreenWidth] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  return (
    <div
      id="nav"
      className="w-full px-4 border-gray-100 dark:border-gray-600"
    >
      <div className="relative flex h-12 items-center justify-between">
        {/* {
          screenWidth < 768? (
        <div className=" inset-y-0 left-0 flex items-center">
          <Disclosure as='nav'>
            <Disclosure.Button onClick={toggleSidebar}  className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
              <svg
                width="24"
                height="24"
                viewBox="0 0 16 16"
                fill="#858699"
              >
                <path d="M15 5.25A3.25 3.25 0 0 0 11.75 2h-7.5A3.25 3.25 0 0 0 1 5.25v5.5A3.25 3.25 0 0 0 4.25 14h7.5A3.25 3.25 0 0 0 15 10.75v-5.5Zm-3.5 7.25H7v-9h4.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2Zm-6 0H4.25a1.75 1.75 0 0 1-1.75-1.75v-5.5c0-.966.784-1.75 1.75-1.75H5.5v9Z"></path>
              </svg>
            </Disclosure.Button>
          </Disclosure>
        </div>
          ):(
        <div className="flex flex-1 items-center justify-start sm:items-stretch">
          <div className="flex flex-shrink-0 items-center">
            <span className="">
              <Link
                href="/"
                className="text-lg font-semibold text-white dark:text-white">
                
              </Link>
            </span>
          </div>
        </div>
          )
        } */}
        <div className="flex flex-1 justify-end">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
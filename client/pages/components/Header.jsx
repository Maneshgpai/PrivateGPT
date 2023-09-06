import { Disclosure, Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

export default function AppHeader() {
  return (
    <div
      id="nav"
      className="mx-auto px-4 border-b border-gray-100 dark:border-gray-600"
    >
      <div className="relative flex h-12 items-center justify-between">
        <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
          <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
            <svg
              width="24"
              height="24"
              viewBox="0 0 16 16"
              fill="#858699"
            >
              <path d="M15 5.25A3.25 3.25 0 0 0 11.75 2h-7.5A3.25 3.25 0 0 0 1 5.25v5.5A3.25 3.25 0 0 0 4.25 14h7.5A3.25 3.25 0 0 0 15 10.75v-5.5Zm-3.5 7.25H7v-9h4.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2Zm-6 0H4.25a1.75 1.75 0 0 1-1.75-1.75v-5.5c0-.966.784-1.75 1.75-1.75H5.5v9Z"></path>
            </svg>
          </Disclosure.Button>
        </div>

        <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
          <div className="flex flex-shrink-0 items-center">
            <span className="">
              <Link
                href="/"
                className="text-lg font-semibold text-white dark:text-white"
              >
                MedCoder
              </Link>
            </span>
          </div>
        </div>
        <div className="lg:flex lg:flex-1 lg:justify-end">
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
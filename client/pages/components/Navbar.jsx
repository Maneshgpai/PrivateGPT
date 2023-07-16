import React from 'react';
import Link from 'next/link';

function Navbar(){
return (
  <nav className="bg-white shadow dark:bg-gray-800">
    <div className="container flex items-center justify-center p-6 mx-auto text-gray-600 capitalize dark:text-gray-300">
      <Link href="/" className="border-b-2 border-transparent hover:text-gray-800 dark:hover:text-gray-200 hover:border-blue-500 mx-1.5 sm:mx-6">
        Upload
        </Link>
      
      <Link href="/chat" className="border-b-2 border-transparent hover:text-gray-800 dark:hover:text-gray-200 hover:border-blue-500 mx-1.5 sm:mx-6">
        Chat
      </Link>

      <Link href="/documents" className="border-b-2 border-transparent hover:text-gray-800 dark:hover:text-gray-200 hover:border-blue-500 mx-1.5 sm:mx-6">
        Documents
      </Link>

    </div>
  </nav>
)}

export default Navbar;

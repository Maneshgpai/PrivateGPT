import { Disclosure} from "@headlessui/react";
import Header from "./Header";
import Link from "next/link";
import { useState } from "react";
// import KeyChanger from "./input-elements/KeyChanger";
// import CodeSelector from "./input-elements/CodeSelector";
// import PhysicianTypeSelector from "./input-elements/PhysicianTypeSelector";

export default function Layout(props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isSidebarOpen) setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen" onClick={closeSidebar}>
      <Disclosure as="nav" className="bg-gray-900">
        {({ open }) => (
          <>
            <Header toggleSidebar={toggleSidebar} />

            <Disclosure.Panel
              className={`sm:hidden fixed inset-y-0 left-0 w-4/5 max-w-xs z-40 flex flex-col bg-gray-900 border-r dark:border-gray-600  transition-opacity duration-300 ease-in-out ${
                isSidebarOpen ? "opacity-100" : "opacity-0"
              }`}
            >

              <Disclosure.Button className="px-8 inline-flex items-center justify-start rounded-md p-3 text-gray-400 hover:bg-gray-700">
                <svg width="24" height="24" viewBox="0 0 16 16" fill="#858699">
                  <path d="M15 5.25A3.25 3.25 0 0 0 11.75 2h-7.5A3.25 3.25 0 0 0 1 5.25v5.5A3.25 3.25 0 0 0 4.25 14h7.5A3.25 3.25 0 0 0 15 10.75v-5.5Zm-3.5 7.25H7v-9h4.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2Zm-6 0H4.25a1.75 1.75 0 0 1-1.75-1.75v-5.5c0-.966.784-1.75 1.75-1.75H5.5v9Z"></path>
                </svg>
              </Disclosure.Button>

              <div className="flex-grow px-4 py-2">
                <div className="space-y-1">{getSidebarComponents()}</div>
              </div>
              </Disclosure.Panel>
            {/* {isSidebarOpen && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-30"></div>
            )} */}
          </>
        )}
      </Disclosure>

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden" >
        <Disclosure
          
          
        >
          <div
            id="sidebar"
            className={`bg-gray-900 pl-4 pr-4  w-1/5 ${!isSidebarOpen && "hidden"} border-r md:block  pt-5 border-gray-100 dark:border-gray-600 shadow-none sticky top-0 `}
           >
            <div
              className="w-full h-full  md:flex"
              data-projection-id="21"
              style={isSidebarOpen ? {
                position:  "absolute",
                top:  "0px",
                left:  "0px",
                width: "100%",
                backgroundColor: "#1f2937",
                height: "100vh",
                zIndex: "1000",
              } : {}}
            >
              <div className="w-full h-full flex flex-col ">
                <div className="flex justify-between items-center "></div>
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="flex flex-col">
                    <Disclosure.Button>
                      {getSidebarComponents()}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Disclosure>

        <div className="flex flex-grow flex-col md:flex-row w-full overflow-y-auto">
          {props.children}
           {isSidebarOpen && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-30" style={{
                marginLeft: "20%",
              }}></div>
            )}
        </div>
      </div>
    </div>
  );
}

function getSidebarComponents() {
  return (
    <>
      {/* <CodeSelector /> */}
      <div>
        <Link
          href="
          /"
          rel="noreferrer"
          className="flex items-center justify-start text-sm font-medium text-gray-400 hover:bg-gray-700 p-3 rounded-md"
        >
          
          <span className="ml-2"> Home (Paste your note)</span>
        </Link>
        <Link
          href="upload-pdf"
          rel="noreferrer"
          className="flex items-center justify-start text-sm font-medium text-gray-400 hover:bg-gray-700 p-3 rounded-md"
        >
          
          <span className="ml-2">Upload medical note</span>
        </Link>
        <Link
          href="/settings"
          rel="noreferrer"
          className="flex items-center justify-start text-sm font-medium text-gray-400 hover:bg-gray-700 p-3 rounded-md"
        >
          
          <span className="ml-2">Settings</span>
        </Link>

        
      </div>
      {/* <PhysicianTypeSelector/> */}
    </>
  );
}

import { Fragment, useState, useEffect } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const values = [
  {name: "Anesthesiologist",},
  {name: "Cardiologist",},
  {name: "Dermatologist",},
  {name: "Gastroenterologist",},
  {name: "General practitioner",},
  {name: "Neurologist",},
  {name: "Oncologist",},
  {name: "Ophthalmologist",},
  {name: "Orthopaedist",},
  {name: "Pathologist",},
  {name: "Pediatrist",},
  {name: "Psychiatrist",},
  {name: "Radiologist",},
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function PhysicianTypeSelector() {
  const [selected, setSelected] = useState(values[1]);

  useEffect(() => {
    const savedValue = localStorage.getItem("selectedPhysicianType");
    if (savedValue) {
      setSelected(JSON.parse(savedValue));
    }
  }, []);

  const handleSelectedChange = (newValue) => {
    setSelected(newValue);
    localStorage.setItem("selectedPhysicianType", JSON.stringify(newValue));
  };

  return (
    <Listbox value={selected} onChange={handleSelectedChange}>
      {({ open }) => (
        <>
          <div className="relative mt-2">
            <Listbox.Label className="block text-sm font-medium leading-6 text-gray-400" align="left">
              Select Specialization
            </Listbox.Label>
            <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-700 bg-gray-900 py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
              <span className="flex items-center">
                <span className="ml-1 block truncate font-semibold text-gray-300">
                  {selected.name}
                </span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
              style={{
                backgroundColor: "#ebeef4",
                color: "#000"
              
              
              }}>
                {values.map((value) => (
                  <Listbox.Option
                    key={value.id}
                    className={({ active }) =>
                      classNames(
                        active ? "bg-gray-600 text-white" : "text-gray-900",
                        "relative cursor-default select-none py-2 pl-3 pr-9"
                      )
                    }
                    value={value}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <span
                            className={classNames(
                              selected ? "font-semibold" : "font-normal",
                              "ml-3 block truncate text-gray-300"
                            )}
                          >
                            {value.name}
                          </span>
                        </div>

                        {selected ? (
                          <span
                            className={classNames(
                              active ? "text-white" : "text-gray-300",
                              "absolute inset-y-0 right-0 flex items-center pr-4"
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}

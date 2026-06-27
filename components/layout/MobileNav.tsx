// src/components/layout/MobileNav.tsx
'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export function MobileNav({ isOpen, onClose, onOpen }: MobileNavProps) {
  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={onOpen}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">
            G
          </div>
          <span className="font-semibold text-slate-800">DemandGenius</span>
        </div>
      </header>

      {/* Mobile sidebar drawer */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-[280px]">
                <Sidebar className="flex" onNavigate={onClose} />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-0 -mr-12 flex h-12 w-12 items-center justify-center"
                >
                  <X className="h-6 w-6 text-white" />
                  <span className="sr-only">Close sidebar</span>
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}

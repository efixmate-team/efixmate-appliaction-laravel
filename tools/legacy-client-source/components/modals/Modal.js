"use client"

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react"

export default function Modal({ openModal, setOpenModal, children, panelClassName = "max-w-lg" }) {
    return (
        <Dialog open={openModal} onClose={setOpenModal} className="relative z-50">

            {/* BACKDROP */}
            <DialogBackdrop
                transition
                className="
          fixed inset-0 bg-[#000000]/50
          transition-opacity duration-300
          data-closed:opacity-0
        "
            />

            {/* PANEL WRAPPER */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

                <DialogPanel transition className={`w-full ${panelClassName} rounded-xl bg-[#ffffff] shadow-xl p-6 transition-all duration-300 ease-out data-closed:scale-95 data-closed:opacity-0 max-h-[90vh] overflow-y-auto`}>
                    {children}
                </DialogPanel>

            </div>
        </Dialog>
    )
}
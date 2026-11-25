"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";

export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-3 py-4 hidden md:flex md:flex-col bg-[#120D24] border-r border-violet-500/20 w-[264px] shrink-0 overflow-x-hidden",
        className
      )}
      animate={{
        width: animate ? (open ? "264px" : "72px") : "264px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        "min-h-14 px-4 py-3 flex flex-row md:hidden items-center justify-between bg-[#120D24] border-b border-violet-500/20 w-full",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#4C1D95] via-[#6D28D9] to-[#7C3AED] flex items-center justify-center text-white font-black text-sm shadow-komodo shrink-0">
          K
        </div>
        <span className="font-black tracking-wide text-white text-base">KOMODO</span>
      </div>

      <button
        type="button"
        aria-label="Abrir menú de navegación"
        onClick={() => setOpen(!open)}
        className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-xl bg-violet-500/15 text-violet-200 hover:bg-violet-500/25 transition shrink-0"
      >
        <IconMenu2 className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.28,
              ease: "easeInOut",
            }}
            className="fixed h-full w-full inset-0 bg-[#0D091A] p-6 z-[100] flex flex-col justify-between overflow-y-auto"
          >
            <button
              type="button"
              aria-label="Cerrar menú"
              className="absolute right-5 top-5 z-50 min-h-10 min-w-10 inline-flex items-center justify-center rounded-xl bg-violet-500/15 text-slate-200 hover:text-white"
              onClick={() => setOpen(false)}
            >
              <IconX className="h-5 w-5" />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
}: {
  link: SidebarLinkItem;
  className?: string;
}) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <a
      href={link.href}
      onClick={(e) => {
        if (link.onClick) {
          link.onClick(e);
        }
        setOpen(false);
      }}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar min-h-10 px-2.5 py-2 rounded-xl transition-colors overflow-hidden",
        link.active
          ? "bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] text-white shadow-komodo border border-violet-400/30"
          : "text-slate-300 hover:text-white hover:bg-violet-500/15",
        className
      )}
    >
      <span
        className={cn(
          "shrink-0 inline-flex items-center justify-center",
          link.active ? "text-[#10B981]" : "text-violet-300 group-hover/sidebar:text-white"
        )}
      >
        {link.icon}
      </span>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm font-medium group-hover/sidebar:translate-x-0.5 transition duration-150 truncate !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </a>
  );
};

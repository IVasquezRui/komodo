"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import {
  IconBus,
  IconCompass,
  IconTicket,
  IconMapPin,
  IconLayoutDashboard,
  IconUser,
  IconSettings,
  IconLogout,
  IconLogin,
} from "@tabler/icons-react";
import { Sidebar, SidebarBody, SidebarLink, SidebarLinkItem } from "@/components/ui/sidebar";

export type AppSection =
  | "explore"
  | "my-trips"
  | "terminals"
  | "admin"
  | "profile"
  | "settings"
  | "auth";

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email?: string | null;
  phoneNumber: string;
  role: string;
}

interface KomodoSidebarShellProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  user: AuthenticatedUser | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const KomodoBrandLogo: React.FC = () => {
  return (
    <a
      href="#explorar"
      onClick={(e) => e.preventDefault()}
      className="relative z-20 flex items-center gap-2.5 py-1 text-sm font-normal text-white overflow-hidden"
    >
      <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-[#4C1D95] via-[#6D28D9] to-[#7C3AED] flex items-center justify-center shadow-komodo border border-violet-300/25">
        <IconBus className="h-4 w-4 text-[#10B981]" stroke={2.2} />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col leading-none min-w-0"
      >
        <span className="font-black tracking-wider text-base text-white truncate">
          KOMODO
        </span>
        <span className="text-[10px] font-semibold text-violet-300 truncate">
          Pasajes Venezuela
        </span>
      </motion.div>
    </a>
  );
};

export const KomodoBrandIcon: React.FC = () => {
  return (
    <a
      href="#explorar"
      onClick={(e) => e.preventDefault()}
      aria-label="Komodo"
      className="relative z-20 flex items-center justify-center py-1"
    >
      <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-[#4C1D95] via-[#6D28D9] to-[#7C3AED] flex items-center justify-center shadow-komodo border border-violet-300/25">
        <IconBus className="h-4 w-4 text-[#10B981]" stroke={2.2} />
      </div>
    </a>
  );
};

export const KomodoSidebar: React.FC<KomodoSidebarShellProps> = ({
  activeSection,
  onNavigate,
  user,
  onLogout,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const navLinks: SidebarLinkItem[] = [
    {
      label: "Explorar Viajes",
      href: "#explorar",
      active: activeSection === "explore",
      icon: <IconCompass className="h-5 w-5 shrink-0" />,
      onClick: (e) => {
        e.preventDefault();
        onNavigate("explore");
      },
    },
    {
      label: "Mis Viajes",
      href: "#mis-viajes",
      active: activeSection === "my-trips",
      icon: <IconTicket className="h-5 w-5 shrink-0" />,
      onClick: (e) => {
        e.preventDefault();
        onNavigate("my-trips");
      },
    },
    {
      label: "Terminales de Venezuela",
      href: "#terminales",
      active: activeSection === "terminals",
      icon: <IconMapPin className="h-5 w-5 shrink-0" />,
      onClick: (e) => {
        e.preventDefault();
        onNavigate("terminals");
      },
    },
    {
      label: "Operaciones y Flota",
      href: "#operacion",
      active: activeSection === "admin",
      icon: <IconLayoutDashboard className="h-5 w-5 shrink-0" />,
      onClick: (e) => {
        e.preventDefault();
        onNavigate("admin");
      },
    },
    {
      label: "Mi Perfil",
      href: "#perfil",
      active: activeSection === "profile",
      icon: <IconUser className="h-5 w-5 shrink-0" />,
      onClick: (e) => {
        e.preventDefault();
        onNavigate("profile");
      },
    },
    {
      label: "Configuración",
      href: "#configuracion",
      active: activeSection === "settings",
      icon: <IconSettings className="h-5 w-5 shrink-0" />,
      onClick: (e) => {
        e.preventDefault();
        onNavigate("settings");
      },
    },
  ];

  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "KM";

  const footerLinks: SidebarLinkItem[] = user
    ? [
        {
          label: user.fullName,
          href: "#perfil",
          active: activeSection === "profile",
          icon: (
            <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-[#6D28D9] to-[#10B981] text-white text-xs font-bold flex items-center justify-center">
              {userInitials}
            </div>
          ),
          onClick: (e) => {
            e.preventDefault();
            onNavigate("profile");
          },
        },
        {
          label: "Cerrar Sesión",
          href: "#cerrar-sesion",
          icon: <IconLogout className="h-5 w-5 shrink-0 text-rose-400" />,
          onClick: (e) => {
            e.preventDefault();
            onLogout();
          },
        },
      ]
    : [
        {
          label: "Iniciar sesión",
          href: "#registro",
          active: activeSection === "auth",
          icon: <IconLogin className="h-5 w-5 shrink-0 text-[#10B981]" />,
          onClick: (e) => {
            e.preventDefault();
            onNavigate("auth");
          },
        },
      ];

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen md:h-screen bg-[#0D091A] overflow-hidden">
      <div className="no-print shrink-0">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-8">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              {open ? <KomodoBrandLogo /> : <KomodoBrandIcon />}
              <nav aria-label="Navegación principal Komodo" className="mt-8 flex flex-col gap-1.5">
                {navLinks.map((link) => (
                  <SidebarLink key={link.href} link={link} />
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-violet-500/20 flex flex-col gap-1.5">
              {footerLinks.map((link) => (
                <SidebarLink key={link.label} link={link} />
              ))}
            </div>
          </SidebarBody>
        </Sidebar>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
};

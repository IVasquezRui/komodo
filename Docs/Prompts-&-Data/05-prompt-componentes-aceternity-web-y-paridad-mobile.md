# ROL Y OBJETIVO
Actúa como Senior Frontend Architect (React/Next.js + Tailwind/shadcn + Aceternity UI) y React Native Engineer. Tu tarea es integrar y adaptar a producción los **3 componentes de Aceternity UI** especificados para la **plataforma Web de Komodo**, y construir su **paridad funcional y visual nativa en la App Mobile (Expo)**, eliminando cualquier texto o lógica de demostración.

# REGLAS DE LIMPIEZA Y PRODUCCIÓN (OBLIGATORIO)
- **NUNCA dejes contenido demo de Aceternity:** Elimina por completo referencias a `"Aceternity"`, `"Acet Labs"`, `"Tyler Durden"`, `"Fight Club"`, `"Manu Arora"`, `"twitterpassword"`, `"OnlyFans"` o URLs externas de avatares demo.
- **Inspección previa:** Revisa `package.json`, `components.json` (shadcn), versión de Tailwind y alias `@/` en el proyecto Web antes de correr comandos `npx shadcn@latest add`. Instala dependencias faltantes (`motion`, `@tabler/icons-react`, `clsx`, `tailwind-merge`) solo si no existen.
- **Paridad Mobile:** Recuerda que los componentes `@aceternity/*` usan DOM/Tailwind y **NO funcionan directamente en React Native**. Para Mobile, implementa componentes equivalentes con `react-native-reanimated` y los tokens de **Komodo**.

---

# COMPONENTE 1: MULTI-STEP LOADER PARA CONFIRMACIÓN DE PAGO
## En Web
1. Instala el componente base:
   ```bash
   npx shadcn@latest add @aceternity/multi-step-loader
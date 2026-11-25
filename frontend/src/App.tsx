"use client";
import React, { useState, useEffect } from 'react';
import { MotionConfig, motion } from 'motion/react';
import { NavTab } from './components/Sidebar';
import {
  AppSection,
  AuthenticatedUser,
  KomodoSidebar,
} from './components/layout/KomodoSidebar';
import { KomodoSignupForm } from './components/auth/KomodoSignupForm';
import { KomodoButton } from './components/ui/KomodoButton';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { FleetPage } from './pages/FleetPage';
import { RoutesPage } from './pages/RoutesPage';
import { TripsPage } from './pages/TripsPage';
import { SalesPage } from './pages/SalesPage';
import { ManifestPage } from './pages/ManifestPage';
import {
  fetchStats,
  fetchFleet,
  fetchRoutes,
  fetchTrips,
  fetchSales,
  fetchManifest,
  createBus,
  searchTripsWeb,
  SearchTripItem,
} from './api/client';
import { AdminStats, Bus, Route, Trip, SaleTransaction, ManifestEntry } from './types';

const STORAGE_USER_KEY = 'komodo_web_user';
const STORAGE_TOKEN_KEY = 'komodo_web_access_token';

const ADMIN_TABS: { id: NavTab; label: string }[] = [
  { id: 'dashboard', label: 'Resumen' },
  { id: 'fleet', label: 'Flota' },
  { id: 'routes', label: 'Rutas' },
  { id: 'trips', label: 'Itinerarios' },
  { id: 'sales', label: 'Ventas' },
  { id: 'manifest', label: 'Manifiesto INTT' },
];

const VENEZUELA_REGIONS = [
  { region: 'Región Capital y Central', states: 'Distrito Capital, Miranda, Aragua, Carabobo, La Guaira', hubs: 'La Bandera, Terminal de Oriente, Big Low Center, Maracay' },
  { region: 'Región Occidental y Andina', states: 'Zulia, Lara, Falcón, Yaracuy, Táchira, Mérida, Trujillo', hubs: 'Gran Terminal Maracaibo, Barquisimeto, La Concordia, Mérida' },
  { region: 'Región Llanos y Sur', states: 'Barinas, Portuguesa, Cojedes, Guárico, Apure, Amazonas', hubs: 'Barinas, Acarigua COMTER, San Juan, San Fernando, Puerto Ayacucho' },
  { region: 'Región Oriental e Insular', states: 'Anzoátegui, Sucre, Monagas, Bolívar, Delta Amacuro, Nueva Esparta', hubs: 'Puerto La Cruz, Maturín, Manuel Piar (Puerto Ordaz), Porlamar' },
];

export default function App() {
  const [section, setSection] = useState<AppSection>('admin');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [user, setUser] = useState<AuthenticatedUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [fleet, setFleet] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [manifest, setManifest] = useState<ManifestEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Explore search state
  const [searchOrigin, setSearchOrigin] = useState('Caracas');
  const [searchDest, setSearchDest] = useState('Maracaibo');
  const [searchResults, setSearchResults] = useState<SearchTripItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        const [statsData, fleetData, routesData, tripsData, salesData, manifestData] =
          await Promise.all([
            fetchStats(),
            fetchFleet(),
            fetchRoutes(),
            fetchTrips(),
            fetchSales(),
            fetchManifest(),
          ]);
        setStats(statsData);
        setFleet(fleetData);
        setRoutes(routesData);
        setTrips(tripsData);
        setSales(salesData);
        setManifest(manifestData);
      } catch (err) {
        console.error('Error loading admin backoffice data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleSearchVenezuela = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearching(true);
    const items = await searchTripsWeb(searchOrigin.trim(), searchDest.trim());
    setSearchResults(items);
    setSearching(false);
  };

  useEffect(() => {
    if (section === 'explore' && searchResults.length === 0) {
      handleSearchVenezuela();
    }
  }, [section]);

  const handleAddBus = async (busData: Partial<Bus>) => {
    const newBus = await createBus(busData);
    setFleet((prev) => [newBus, ...prev]);
    if (stats) {
      setStats({
        ...stats,
        fleet_total: stats.fleet_total + 1,
        fleet_active: stats.fleet_active + 1,
      });
    }
  };

  const handleAddRoute = (routeData: Partial<Route>) => {
    const newRoute: Route = {
      id: `r_${Date.now()}`,
      origin: routeData.origin || 'Origen',
      destination: routeData.destination || 'Destino',
      distance_km: routeData.distance_km || 300,
      estimated_hours: routeData.estimated_hours || 4.5,
      base_price: routeData.base_price || 25,
      active_trips: 0,
    };
    setRoutes((prev) => [newRoute, ...prev]);
  };

  const handleAddTrip = (tripData: Partial<Trip>) => {
    const newTrip: Trip = {
      id: `trip_${Date.now()}`,
      route_name: tripData.route_name || 'Ruta Programada',
      origin: tripData.origin || 'Caracas',
      destination: tripData.destination || 'Destino',
      bus_plate: tripData.bus_plate || 'ABC-123',
      bus_model: tripData.bus_model || 'Marcopolo Paradiso G6 1800 DD',
      driver_name: tripData.driver_name || 'Chofer Asignado',
      departure_time: tripData.departure_time || new Date().toISOString(),
      arrival_time: tripData.arrival_time || new Date().toISOString(),
      status: 'SCHEDULED',
      total_seats: tripData.total_seats || 52,
      booked_seats: 0,
      occupancy_pct: 0,
      base_price: tripData.base_price || 35,
    };
    setTrips((prev) => [newTrip, ...prev]);
  };

  const handleSignupSuccess = (
    authUser: AuthenticatedUser,
    tokens: { accessToken: string; refreshToken: string }
  ) => {
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
      localStorage.setItem(STORAGE_TOKEN_KEY, tokens.accessToken);
    } catch {
      // Ignore storage errors
    }
    setUser(authUser);
    setSection('explore');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
    setUser(null);
    setSection('auth');
  };

  const adminTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Panel Ejecutivo de Control',
      subtitle: 'Visión consolidada de ocupación, flota venezolana y recaudación USD',
    },
    fleet: {
      title: 'Gestión de Parque Automotor',
      subtitle: 'Unidades Encava, Marcopolo, Busscar y Yutong por corredor',
    },
    routes: {
      title: 'Red de Rutas y Terminales',
      subtitle: 'Cobertura nacional de 24 entidades federales y enlaces fronterizos',
    },
    trips: {
      title: 'Itinerarios y Programación',
      subtitle: 'Asignación de unidades, choferes y control de despachos',
    },
    sales: {
      title: 'Ventas y Recaudación',
      subtitle: 'Transacciones comerciales y métodos de pago',
    },
    manifest: {
      title: 'Manifiesto Legal de Pasajeros',
      subtitle: 'Documento regulatorio para control de carretera y alcabalas (INTT)',
    },
  };

  const sectionHeaderMeta: Record<AppSection, { title: string; subtitle: string }> = {
    explore: {
      title: 'Explorar Viajes en Venezuela',
      subtitle: 'Consulta horarios reales, operadoras y modelos de autobús por ruta',
    },
    'my-trips': {
      title: 'Mis Viajes y Boletos',
      subtitle: 'Historial de pasajes emitidos con QR criptográfico HMAC',
    },
    terminals: {
      title: 'Terminales Terrestres de Venezuela',
      subtitle: 'Red oficial de 24 entidades federales + enlaces fronterizos',
    },
    admin: adminTitles[currentTab],
    profile: {
      title: 'Mi Perfil Komodo',
      subtitle: 'Información de pasajero y estado de verificación',
    },
    settings: {
      title: 'Configuración de Plataforma',
      subtitle: 'Preferencias de red, caché offline y accesibilidad',
    },
    auth: {
      title: 'Acceso y Registro Komodo',
      subtitle: 'Crea tu cuenta para emitir pasajes con respaldo offline',
    },
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0D091A] flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4C1D95] via-[#6D28D9] to-[#7C3AED] flex items-center justify-center shadow-komodo">
          <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
        </div>
        <div className="w-48 h-2 rounded-full komodo-shimmer" />
        <p className="text-xs font-semibold text-violet-200/80">Cargando Komodo...</p>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <KomodoSidebar
        activeSection={section}
        onNavigate={setSection}
        user={user}
        onLogout={handleLogout}
      >
        <div className="no-print">
          <Header
            title={sectionHeaderMeta[section].title}
            subtitle={sectionHeaderMeta[section].subtitle}
            userName={user?.fullName || 'Invitado Komodo'}
            userRole={user ? 'Cuenta Verificada' : 'Modo Exploración'}
            actionButton={
              !user && section !== 'auth' ? (
                <KomodoButton
                  variant="cta"
                  onClick={() => setSection('auth')}
                  className="text-xs px-3 py-2 min-h-9"
                >
                  Crear Cuenta
                </KomodoButton>
              ) : undefined
            }
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gradient-to-b from-[#0D091A] via-[#120D24] to-[#0D091A]">
          {section === 'explore' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <form
                onSubmit={handleSearchVenezuela}
                className="rounded-2xl border border-violet-500/25 bg-[#15102B] p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end shadow-komodo"
              >
                <div>
                  <label className="block text-xs font-semibold text-violet-200 mb-1.5">
                    Ciudad de Origen
                  </label>
                  <input
                    value={searchOrigin}
                    onChange={(e) => setSearchOrigin(e.target.value)}
                    className="w-full min-h-11 rounded-xl border border-violet-500/25 bg-[#191333] px-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    placeholder="Caracas"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-violet-200 mb-1.5">
                    Ciudad de Destino
                  </label>
                  <input
                    value={searchDest}
                    onChange={(e) => setSearchDest(e.target.value)}
                    className="w-full min-h-11 rounded-xl border border-violet-500/25 bg-[#191333] px-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    placeholder="Maracaibo"
                  />
                </div>
                <KomodoButton type="submit" variant="cta" loading={searching} className="w-full">
                  Buscar Salidas
                </KomodoButton>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((item, idx) => (
                  <motion.div
                    key={item.tid}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx, 6) * 0.04 }}
                    className="rounded-2xl border border-violet-500/25 bg-[#15102B] p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-200 border border-violet-400/30 mb-2">
                          {item.rc}
                        </span>
                        <h3 className="font-bold text-white truncate">
                          {item.operator_name || 'Operadora Komodo'}
                        </h3>
                        <p className="text-xs text-violet-200/75 truncate">
                          {item.bus_model || 'Autocar Certificado'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-black text-[#10B981]">
                          ${((item.price_usd_cents ?? Math.round(item.prc * 100)) / 100).toFixed(2)}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">USD / asiento</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 pt-3 border-t border-violet-500/15">
                      <span>
                        {item.org} → {item.dst}
                      </span>
                      <span className="font-semibold text-cyan-300">
                        {item.avl} disponibles · {item.amenities?.ac ? 'A/A' : 'Ventilación'}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {!searching && searchResults.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-violet-500/20 bg-[#15102B] p-8 text-center text-sm text-slate-300">
                    No se encontraron salidas activas para ese tramo o el Gateway (:8080) está fuera de línea. Prueba con Caracas → Maracaibo o Caracas → Valencia.
                  </div>
                )}
              </div>
            </div>
          )}

          {section === 'terminals' && (
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {VENEZUELA_REGIONS.map((item) => (
                <div
                  key={item.region}
                  className="rounded-2xl border border-violet-500/25 bg-[#15102B] p-5 space-y-2"
                >
                  <h3 className="text-base font-bold text-white">{item.region}</h3>
                  <p className="text-xs text-violet-200/80 font-medium">{item.states}</p>
                  <p className="text-xs text-slate-400 pt-2 border-t border-violet-500/15">
                    Nodos principales: <span className="text-slate-200">{item.hubs}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {section === 'my-trips' && (
            <div className="max-w-3xl mx-auto rounded-2xl border border-violet-500/25 bg-[#15102B] p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Tus Pasajes Digitales</h3>
              <p className="text-sm text-slate-300">
                {user
                  ? `Sesión activa para ${user.fullName}. Tus boletos confirmados y sus códigos QR HMAC quedan sincronizados para descarga.`
                  : 'Inicia sesión o crea tu cuenta en Komodo para consultar tus pasajes comprados y descargar comprobantes PDF.'}
              </p>
              {!user && (
                <KomodoButton variant="cta" onClick={() => setSection('auth')}>
                  Crear cuenta o iniciar sesión
                </KomodoButton>
              )}
            </div>
          )}

          {section === 'profile' && (
            <div className="max-w-2xl mx-auto rounded-2xl border border-violet-500/25 bg-[#15102B] p-6 space-y-3">
              <h3 className="text-lg font-bold text-white">Perfil de Usuario</h3>
              {user ? (
                <div className="space-y-2 text-sm text-slate-300">
                  <p><span className="text-violet-300 font-semibold">Nombre:</span> {user.fullName}</p>
                  <p><span className="text-violet-300 font-semibold">Teléfono:</span> {user.phoneNumber}</p>
                  <p><span className="text-violet-300 font-semibold">Correo:</span> {user.email || 'No especificado'}</p>
                  <p><span className="text-violet-300 font-semibold">Rol:</span> {user.role}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">Navegas actualmente como invitado.</p>
                  <KomodoButton variant="primary" onClick={() => setSection('auth')}>
                    Ir a Registro Komodo
                  </KomodoButton>
                </div>
              )}
            </div>
          )}

          {section === 'settings' && (
            <div className="max-w-2xl mx-auto rounded-2xl border border-violet-500/25 bg-[#15102B] p-6 space-y-3">
              <h3 className="text-lg font-bold text-white">Configuración</h3>
              <p className="text-sm text-slate-300">
                Gateway API configurado en <code className="text-cyan-300">/api/v1</code> · Respaldo offline activo · Animaciones respetando preferencias del sistema (<code className="text-cyan-300">prefers-reduced-motion</code>).
              </p>
            </div>
          )}

          {section === 'auth' && (
            <div className="py-4">
              <KomodoSignupForm
                onSuccess={handleSignupSuccess}
                onSwitchToLogin={() => setSection('explore')}
              />
            </div>
          )}

          {section === 'admin' && (
            <div className="space-y-6">
              {/* Sub-navigation tabs for Backoffice Modules */}
              <div className="no-print flex flex-wrap gap-2 pb-2 border-b border-violet-500/20">
                {ADMIN_TABS.map((tab) => {
                  const active = currentTab === tab.id;
                  return (
                    <KomodoButton
                      key={tab.id}
                      variant={active ? 'primary' : 'outline'}
                      onClick={() => setCurrentTab(tab.id)}
                      className="text-xs px-3.5 py-2 min-h-10"
                    >
                      {tab.label}
                    </KomodoButton>
                  );
                })}
              </div>

              {currentTab === 'dashboard' && stats && (
                <DashboardPage
                  stats={stats}
                  trips={trips}
                  sales={sales}
                  onNavigateToTrips={() => setCurrentTab('trips')}
                  onNavigateToManifest={() => setCurrentTab('manifest')}
                />
              )}

              {currentTab === 'fleet' && (
                <FleetPage fleet={fleet} onAddBus={handleAddBus} />
              )}

              {currentTab === 'routes' && (
                <RoutesPage routes={routes} onAddRoute={handleAddRoute} />
              )}

              {currentTab === 'trips' && (
                <TripsPage
                  trips={trips}
                  buses={fleet}
                  routes={routes}
                  onAddTrip={handleAddTrip}
                  onSelectTripForManifest={() => setCurrentTab('manifest')}
                />
              )}

              {currentTab === 'sales' && <SalesPage sales={sales} />}

              {currentTab === 'manifest' && <ManifestPage manifest={manifest} />}
            </div>
          )}
        </main>
      </KomodoSidebar>
    </MotionConfig>
  );
}

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
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
} from './api/client';
import { AdminStats, Bus, Route, Trip, SaleTransaction, ManifestEntry } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [fleet, setFleet] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [manifest, setManifest] = useState<ManifestEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
      bus_model: tripData.bus_model || 'Marcopolo G8',
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

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Panel Ejecutivo de Control',
      subtitle: 'Visión consolidada de ocupación, flota y recaudación',
    },
    fleet: {
      title: 'Gestión de Parque Automotor',
      subtitle: 'Inventario de unidades, configuración de dos pisos y comodidades',
    },
    routes: {
      title: 'Red de Rutas y Terminales',
      subtitle: 'Tarifas base, distancias kilométricas y tiempos de traslado',
    },
    trips: {
      title: 'Itinerarios y Programación',
      subtitle: 'Asignación de unidades, choferes y control de despachos',
    },
    sales: {
      title: 'Ventas y Recaudación',
      subtitle: 'Transacciones comerciales y métodos de pago de usuarios',
    },
    manifest: {
      title: 'Manifiesto Legal de Pasajeros',
      subtitle: 'Documento regulatorio para control de carretera y alcabalas (INTT)',
    },
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Cargando Panel Komodo Transit...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar - hidden when printing */}
      <div className="no-print h-full">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="no-print">
          <Header
            title={titles[currentTab].title}
            subtitle={titles[currentTab].subtitle}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-8">
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
        </main>
      </div>
    </div>
  );
}

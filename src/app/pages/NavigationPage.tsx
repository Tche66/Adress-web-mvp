import { PageGuide } from '../components/PageGuide';
import { Logo } from '../components/Logo';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation, Search, X, ArrowRight,
  RotateCcw, ExternalLink, Locate, Clock, Route,
  ArrowUp, CornerUpLeft, CornerUpRight, CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { searchAddresses, getAddressByCode, type Address } from '../utils/supabaseService';

// Fix icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function iconPin(color: string, label: string) {
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px">${label}</div>
      <div style="width:3px;height:10px;background:${color}"></div>
    </div>`,
    className: '', iconSize: [32, 42], iconAnchor: [16, 42],
  });
}

function iconGPS() {
  return L.divIcon({
    html: `<div style="position:relative">
      <div style="width:20px;height:20px;background:#4F46E5;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(79,70,229,0.3)"></div>
    </div>`,
    className: '', iconSize: [20, 20], iconAnchor: [10, 10],
  });
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
function formatDuree(mins: number) {
  return mins < 60 ? `${mins} min` : `${Math.floor(mins/60)}h${mins%60>0?mins%60:''}`;
}

// Icône d'instruction selon le type
function InstructionIcon({ type }: { type: string }) {
  const t = type?.toLowerCase() || '';
  if (t.includes('left'))  return <CornerUpLeft className="w-5 h-5 text-white" />;
  if (t.includes('right')) return <CornerUpRight className="w-5 h-5 text-white" />;
  if (t.includes('arrive') || t.includes('destination')) return <CheckCircle className="w-5 h-5 text-white" />;
  return <ArrowUp className="w-5 h-5 text-white" />;
}

interface Step {
  instruction: string;
  distance: number; // km
  duration: number; // min
  type: string;
  name: string;
}

function SearchBox({ label, color, value, onSelect, placeholder }: {
  label: string; color: string; value: Address | null;
  onSelect: (a: Address | null) => void; placeholder: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Address[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const res = await searchAddresses(q);
    setResults(res.slice(0, 5));
    setOpen(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const useGPS = () => {
    if (!navigator.geolocation) { toast.error('GPS non disponible'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(pos => {
      const gps = {
        id: 'gps', addressCode: 'GPS',
        latitude: pos.coords.latitude, longitude: pos.coords.longitude,
        repere: 'Ma position actuelle', ville: '', quartier: '', pays: '',
        categorie: 'autre', isPublic: false, isVerified: false,
        userId: '', viewCount: 0, createdAt: '', photos: [],
      } as Address;
      onSelect(gps); setQuery('📍 Ma position GPS');
      setGpsLoading(false); toast.success('Position GPS détectée');
    }, () => { toast.error('GPS indisponible'); setGpsLoading(false); });
  };

  const dot = color === 'indigo' ? '#4F46E5' : '#059669';
  const bg  = color === 'indigo' ? 'border-indigo-200 bg-indigo-50' : 'border-emerald-200 bg-emerald-50';
  const lbl = color === 'indigo' ? 'text-indigo-600' : 'text-emerald-600';

  return (
    <div ref={ref} className="relative">
      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1.5 ${lbl}`}>
        <div className="w-3 h-3 rounded-full" style={{ background: dot }} />
        {label}
      </label>
      {value ? (
        <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${bg}`}>
          <div>
            <p className="font-bold text-gray-900 text-sm">{value.addressCode === 'GPS' ? '📍 Ma position GPS' : value.addressCode}</p>
            <p className="text-xs text-gray-500 truncate max-w-[220px]">{value.repere}{value.ville ? ` · ${value.ville}` : ''}</p>
          </div>
          <button onClick={() => { onSelect(null); setQuery(''); }} className="text-gray-400 hover:text-red-500 p-1 ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setOpen(true)}
            placeholder={placeholder}
            className="w-full pl-9 pr-10 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-indigo-400 text-sm"
          />
          <button onClick={useGPS} title="GPS"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600">
            {gpsLoading
              ? <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              : <Locate className="w-4 h-4" />}
          </button>
          {open && results.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
              {results.map(a => (
                <button key={a.id} onClick={() => { onSelect(a); setQuery(a.addressCode); setOpen(false); }}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors border-b last:border-0">
                  <p className="font-mono font-bold text-indigo-600 text-sm">{a.addressCode}</p>
                  <p className="text-xs text-gray-500 truncate">{a.repere} · {a.ville}</p>
                </button>
              ))}
            </div>
          )}
          {loading && <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl shadow p-3 text-center text-sm text-gray-400">Recherche...</div>}
        </div>
      )}
    </div>
  );
}

export function NavigationPage() {
  const mapRef           = useRef<L.Map | null>(null);
  const mapDivRef        = useRef<HTMLDivElement>(null);
  const markerARef       = useRef<L.Marker | null>(null);
  const markerBRef       = useRef<L.Marker | null>(null);
  const markerGPSRef     = useRef<L.Marker | null>(null);
  const routeLayerRef    = useRef<L.Polyline | null>(null);
  const watchIdRef       = useRef<number | null>(null);

  const [depart, setDepart]     = useState<Address | null>(null);
  const [arrivee, setArrivee]   = useState<Address | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [steps, setSteps]       = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [gpsPos, setGpsPos]     = useState<[number, number] | null>(null);
  const [distToNext, setDistToNext] = useState<number | null>(null);

  // Init carte
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const map = L.map(mapDivRef.current, { zoomControl: false }).setView([5.3599517, -4.0082563], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
  }, []);

  // Mettre à jour marqueurs A/B
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (markerARef.current) { markerARef.current.remove(); markerARef.current = null; }
    if (depart) {
      markerARef.current = L.marker([depart.latitude, depart.longitude], { icon: iconPin('#4F46E5', 'A') })
        .addTo(map).bindPopup(`<b>Départ</b><br>${depart.repere || depart.addressCode}`);
    }
  }, [depart]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (markerBRef.current) { markerBRef.current.remove(); markerBRef.current = null; }
    if (arrivee) {
      markerBRef.current = L.marker([arrivee.latitude, arrivee.longitude], { icon: iconPin('#059669', 'B') })
        .addTo(map).bindPopup(`<b>Arrivée</b><br>${arrivee.repere || arrivee.addressCode}`);
    }
  }, [arrivee]);

  // Calcul itinéraire via OSRM (gratuit, open source)
  const calculerItineraire = useCallback(async () => {
    if (!depart || !arrivee) return;
    setLoadingRoute(true);
    setSteps([]);
    setCurrentStep(0);

    try {
      // OSRM public — gratuit, pas de clé API
      const url = `https://router.project-osrm.org/route/v1/driving/${depart.longitude},${depart.latitude};${arrivee.longitude},${arrivee.latitude}?steps=true&geometries=geojson&overview=full&language=fr`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== 'Ok' || !data.routes?.length) {
        toast.error('Impossible de calculer l\'itinéraire');
        setLoadingRoute(false);
        return;
      }

      const route = data.routes[0];
      const distKm = route.distance / 1000;
      const durMin = Math.round(route.duration / 60);

      setRouteInfo({ distance: distKm, duration: durMin });

      // Extraire les étapes
      const allSteps: Step[] = [];
      for (const leg of route.legs) {
        for (const step of leg.steps) {
          if (step.distance < 10 && allSteps.length > 0) continue; // Ignorer étapes trop courtes
          allSteps.push({
            instruction: step.maneuver?.instruction || translateManeuver(step.maneuver?.type, step.maneuver?.modifier, step.name),
            distance: step.distance / 1000,
            duration: Math.round(step.duration / 60),
            type: `${step.maneuver?.type || ''} ${step.maneuver?.modifier || ''}`,
            name: step.name || '',
          });
        }
      }
      setSteps(allSteps);

      // Tracer la route sur la carte
      const map = mapRef.current;
      if (map) {
        if (routeLayerRef.current) { routeLayerRef.current.remove(); routeLayerRef.current = null; }
        const coords: [number, number][] = route.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]);
        routeLayerRef.current = L.polyline(coords, {
          color: '#4F46E5', weight: 5, opacity: 0.85,
        }).addTo(map);
        map.fitBounds(routeLayerRef.current.getBounds(), { padding: [60, 60] });
      }

      toast.success(`Itinéraire calculé : ${formatDist(distKm)} · ${formatDuree(durMin)}`);
    } catch (err) {
      toast.error('Erreur calcul itinéraire');
    }
    setLoadingRoute(false);
  }, [depart, arrivee]);

  // Traduction manœuvres OSRM en français
  function translateManeuver(type?: string, modifier?: string, name?: string): string {
    const rue = name ? ` sur ${name}` : '';
    if (!type) return `Continuer${rue}`;
    const t: Record<string, string> = {
      'depart': `Démarrer${rue}`,
      'arrive': '🏁 Vous êtes arrivé à destination',
      'turn left': `Tourner à gauche${rue}`,
      'turn right': `Tourner à droite${rue}`,
      'turn slight left': `Légèrement à gauche${rue}`,
      'turn slight right': `Légèrement à droite${rue}`,
      'turn sharp left': `Virage serré à gauche${rue}`,
      'turn sharp right': `Virage serré à droite${rue}`,
      'continue': `Continuer tout droit${rue}`,
      'merge': `Fusionner${rue}`,
      'roundabout': `Prendre le rond-point${rue}`,
      'rotary': `Prendre le giratoire${rue}`,
      'fork left': `Rester à gauche${rue}`,
      'fork right': `Rester à droite${rue}`,
      'end of road left': `Au bout, tourner à gauche${rue}`,
      'end of road right': `Au bout, tourner à droite${rue}`,
    };
    const key = modifier ? `${type} ${modifier}` : type;
    return t[key] || t[type] || `Continuer${rue}`;
  }

  // Recalcul automatique quand A et B changent
  useEffect(() => {
    if (depart && arrivee && !navigating) calculerItineraire();
  }, [depart, arrivee]);

  // Navigation GPS en temps réel
  const startNavigation = () => {
    if (!steps.length) { toast.error('Calculez d\'abord l\'itinéraire'); return; }
    setNavigating(true);
    setCurrentStep(0);
    toast.success('Navigation démarrée — suivez les instructions');

    if (!navigator.geolocation) { toast.error('GPS non disponible'); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setGpsPos([lat, lng]);

      // Mettre à jour le marqueur GPS
      const map = mapRef.current;
      if (map) {
        if (!markerGPSRef.current) {
          markerGPSRef.current = L.marker([lat, lng], { icon: iconGPS() }).addTo(map);
        } else {
          markerGPSRef.current.setLatLng([lat, lng]);
        }
        map.panTo([lat, lng], { animate: true });
      }

      // Vérifier si on a atteint l'étape suivante
      setSteps(prev => {
        if (currentStep < prev.length - 1) {
          // Calculer distance vers destination de l'étape
          const nextStep = prev[currentStep];
          const d = haversine(lat, lng, arrivee!.latitude, arrivee!.longitude);
          setDistToNext(d);
          if (d < 0.05) { // 50m de tolérance
            setCurrentStep(s => Math.min(s + 1, prev.length - 1));
          }
        }
        return prev;
      });
    }, () => {}, { enableHighAccuracy: true, maximumAge: 2000 });
  };

  const stopNavigation = () => {
    setNavigating(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (markerGPSRef.current) { markerGPSRef.current.remove(); markerGPSRef.current = null; }
    setGpsPos(null); setDistToNext(null); setCurrentStep(0);
    toast.success('Navigation arrêtée');
  };

  useEffect(() => () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  const inverser = () => { const t = depart; setDepart(arrivee); setArrivee(t); };

  const loadCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    const addr = await getAddressByCode(code);
    if (!addr) { toast.error('Adresse introuvable'); return; }
    if (!depart) { setDepart(addr); } else { setArrivee(addr); }
    setCodeInput('');
  };

  const openGoogleMaps = (mode: string) => {
    if (!depart || !arrivee) return;
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${depart.latitude},${depart.longitude}&destination=${arrivee.latitude},${arrivee.longitude}&travelmode=${mode}`, '_blank');
  };

  const step = steps[currentStep];

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-bold text-gray-900 hidden sm:block text-sm">Adresse Postale Web</span>
          </Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600 font-medium flex items-center gap-1.5 text-sm">
            <Route className="w-4 h-4 text-indigo-600" /> Navigation guidée
          </span>
        </div>
      </header>

      {/* Mode Navigation — bandeau plein écran en haut */}
      {navigating && step && (
        <div className="bg-indigo-700 text-white px-4 py-3 flex-shrink-0 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            {/* Icône manœuvre */}
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <InstructionIcon type={step.type} />
            </div>
            {/* Instruction */}
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold leading-tight">{step.instruction}</p>
              {distToNext !== null && (
                <p className="text-indigo-300 text-sm mt-0.5">
                  Destination dans {formatDist(distToNext)}
                </p>
              )}
            </div>
            {/* Distance étape */}
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold">{formatDist(step.distance)}</p>
              <p className="text-indigo-300 text-xs">{formatDuree(step.duration)}</p>
            </div>
            {/* Arrêter */}
            <button onClick={stopNavigation}
              className="bg-red-500 hover:bg-red-600 rounded-xl px-3 py-2 text-white text-xs font-bold flex-shrink-0">
              Arrêter
            </button>
          </div>
          {/* Prochaine instruction */}
          {steps[currentStep + 1] && (
            <div className="max-w-6xl mx-auto mt-2 pt-2 border-t border-indigo-600 flex items-center gap-2">
              <span className="text-indigo-400 text-xs">Puis :</span>
              <span className="text-indigo-200 text-sm">{steps[currentStep + 1].instruction}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 grid lg:grid-cols-[360px_1fr] gap-4">

        {/* ── Panneau gauche ── */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-140px)] pb-4">

          {/* Saisie code rapide */}
          <Card className="p-3 bg-indigo-50 border-indigo-100">
            <p className="text-xs font-bold text-indigo-700 mb-2 uppercase tracking-wider">Code APW</p>
            <div className="flex gap-2">
              <input
                type="text" value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && loadCode()}
                placeholder="AW-ABI-84321"
                className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 bg-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
              <Button size="sm" onClick={loadCode} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-indigo-500 mt-1">1er code = départ · 2e = arrivée</p>
          </Card>

          {/* Départ */}
          <Card className="p-3">
            <SearchBox label="Départ" color="indigo" value={depart} onSelect={setDepart} placeholder="Rechercher ou position GPS..." />
          </Card>

          {/* Inverser */}
          <div className="flex justify-center">
            <button onClick={inverser}
              className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm">
              <RotateCcw className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Arrivée */}
          <Card className="p-3">
            <SearchBox label="Arrivée" color="emerald" value={arrivee} onSelect={setArrivee} placeholder="Rechercher destination..." />
          </Card>

          {/* Bouton calculer */}
          {depart && arrivee && !navigating && (
            <Button
              onClick={calculerItineraire}
              disabled={loadingRoute}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loadingRoute
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Calcul en cours...</>
                : <><Route className="w-4 h-4 mr-2" />Calculer l'itinéraire</>}
            </Button>
          )}

          {/* Infos trajet */}
          {routeInfo && (
            <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-2xl font-bold">{formatDist(routeInfo.distance)}</p>
                  <p className="text-slate-400 text-sm flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {formatDuree(routeInfo.duration)} en voiture
                  </p>
                </div>
                <div className="text-right text-slate-400 text-xs">
                  <p>🚶 {formatDuree(Math.round(routeInfo.distance / 5 * 60))}</p>
                  <p>🏍️ {formatDuree(Math.round(routeInfo.distance / 40 * 60))}</p>
                </div>
              </div>
              {/* Bouton démarrer navigation */}
              {steps.length > 0 && !navigating && (
                <button onClick={startNavigation}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <Navigation className="w-5 h-5" />
                  Démarrer la navigation
                </button>
              )}
            </Card>
          )}

          {/* Liste des étapes */}
          {steps.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Route className="w-3 h-3" /> {steps.length} étapes
              </p>
              <div className="space-y-1.5">
                {steps.map((s, i) => (
                  <div key={i}
                    className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                      navigating && i === currentStep
                        ? 'bg-indigo-100 border-2 border-indigo-400'
                        : navigating && i < currentStep
                        ? 'bg-gray-50 opacity-40'
                        : 'bg-white border border-gray-100'
                    }`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      navigating && i === currentStep ? 'bg-indigo-600' :
                      navigating && i < currentStep ? 'bg-gray-400' : 'bg-gray-700'
                    }`}>
                      <InstructionIcon type={s.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${navigating && i === currentStep ? 'font-bold text-indigo-700' : 'text-gray-700'}`}>
                        {s.instruction}
                      </p>
                      {s.distance > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{formatDist(s.distance)}</p>
                      )}
                    </div>
                    {navigating && i === currentStep && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ouvrir dans appli externe */}
          {depart && arrivee && (
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ouvrir dans</p>
              {[
                { label: '🗺️ Google Maps — Voiture', mode: 'driving' },
                { label: '🚶 Google Maps — À pied',  mode: 'walking' },
              ].map(item => (
                <button key={item.label} onClick={() => openGoogleMaps(item.mode)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-sm font-medium text-gray-700 group">
                  <span>{item.label}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600" />
                </button>
              ))}
              <button onClick={() => arrivee && window.open(`https://waze.com/ul?ll=${arrivee.latitude},${arrivee.longitude}&navigate=yes`, '_blank')}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-sm font-medium text-gray-700 group">
                <span>🔵 Waze</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-600" />
              </button>
            </div>
          )}
        </div>

        {/* ── CARTE ── */}
        <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200" style={{ minHeight: 500 }}>
          <div ref={mapDivRef} className="w-full h-full" style={{ minHeight: 500 }} />

          {/* Overlay vitesse GPS */}
          {navigating && gpsPos && (
            <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white rounded-xl px-4 py-2 text-sm font-bold backdrop-blur-sm">
              📍 GPS actif
            </div>
          )}

          {/* Indicateur étape en cours sur la carte */}
          {navigating && step && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl px-4 py-2 flex items-center gap-2 max-w-xs">
              <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <InstructionIcon type={step.type} />
              </div>
              <p className="text-sm font-bold text-gray-900 truncate">{step.instruction}</p>
            </div>
          )}

          {/* Placeholder */}
          {!depart && !arrivee && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10 pointer-events-none">
              <div className="text-center p-6">
                <Navigation className="w-14 h-14 text-indigo-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold text-lg">Navigation guidée</p>
                <p className="text-gray-400 text-sm mt-1">Entrez un départ et une destination</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    <PageGuide storageKey="navigation-v2" steps={[
      {"icon":"📍","title":"Point de départ","desc":"Recherchez une adresse APW ou cliquez sur GPS pour utiliser votre position actuelle."},
      {"icon":"🏁","title":"Destination","desc":"Entrez la destination — code APW ou recherche par nom de lieu."},
      {"icon":"🗺️","title":"Itinéraire calculé","desc":"L'itinéraire réel est calculé automatiquement avec les rues et virages exacts."},
      {"icon":"🧭","title":"Navigation virage par virage","desc":"Cliquez Démarrer — les instructions se mettent à jour en temps réel selon votre position GPS."}
    ]} />
    </>
  );
}

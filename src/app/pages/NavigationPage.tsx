import { PageGuide } from '../components/PageGuide';
import { Logo } from '../components/Logo';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, X, ArrowRight, Truck, ChevronRight, RotateCcw, ExternalLink, Locate, Clock, Route } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { searchAddresses, getAddressByCode } from '../utils/supabaseService';
import type { Address } from '../utils/supabaseService';

// Fix icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function iconPin(color: string) {
  return L.divIcon({
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    className: '', iconSize: [28, 28], iconAnchor: [14, 28],
  });
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
    navigator.geolocation.getCurrentPosition(
      pos => {
        const gps = {
          id: 'gps', addressCode: 'GPS',
          latitude: pos.coords.latitude, longitude: pos.coords.longitude,
          repere: 'Ma position GPS', ville: '', quartier: '', pays: '',
          categorie: 'autre', isPublic: false, isVerified: false,
          userId: '', viewCount: 0, createdAt: '', photos: [],
        } as Address;
        onSelect(gps);
        setQuery('Ma position GPS');
        setGpsLoading(false);
        toast.success('Position GPS détectée');
      },
      () => { toast.error('GPS indisponible'); setGpsLoading(false); }
    );
  };

  const dotColor = color === 'indigo' ? '#4F46E5' : '#059669';
  const borderClass = color === 'indigo' ? 'border-indigo-200 bg-indigo-50' : 'border-emerald-200 bg-emerald-50';
  const labelClass  = color === 'indigo' ? 'text-indigo-600' : 'text-emerald-600';

  return (
    <div ref={ref} className="relative">
      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>
        <div className="w-3 h-3 rounded-full" style={{ background: dotColor }} />
        {label}
      </label>
      {value ? (
        <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${borderClass}`}>
          <div>
            <p className="font-bold text-gray-900 text-sm">{value.addressCode === 'GPS' ? 'Ma position GPS' : value.addressCode}</p>
            <p className="text-xs text-gray-500">{value.repere}{value.ville ? ` · ${value.ville}` : ''}</p>
          </div>
          <button onClick={() => { onSelect(null); setQuery(''); }} className="text-gray-400 hover:text-red-500 p-1">
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
          <button onClick={useGPS} title="Utiliser ma position GPS"
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
          {loading && (
            <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl shadow p-3 text-center text-sm text-gray-400">
              Recherche...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NavigationPage() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerDepartRef = useRef<L.Marker | null>(null);
  const markerArriveeRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [depart, setDepart]   = useState<Address | null>(null);
  const [arrivee, setArrivee] = useState<Address | null>(null);
  const [codeInput, setCodeInput] = useState('');

  const distance = depart && arrivee
    ? haversine(depart.latitude, depart.longitude, arrivee.latitude, arrivee.longitude)
    : null;

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current).setView([5.3599517, -4.0082563], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapRef.current);
  }, []);

  // Mettre à jour les marqueurs et la ligne
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Départ
    if (markerDepartRef.current) { markerDepartRef.current.remove(); markerDepartRef.current = null; }
    if (depart) {
      markerDepartRef.current = L.marker([depart.latitude, depart.longitude], { icon: iconPin('#4F46E5') })
        .addTo(map)
        .bindPopup(`<b>🔵 Départ</b><br>${depart.addressCode}<br>${depart.repere}`);
    }

    // Arrivée
    if (markerArriveeRef.current) { markerArriveeRef.current.remove(); markerArriveeRef.current = null; }
    if (arrivee) {
      markerArriveeRef.current = L.marker([arrivee.latitude, arrivee.longitude], { icon: iconPin('#059669') })
        .addTo(map)
        .bindPopup(`<b>🟢 Arrivée</b><br>${arrivee.addressCode}<br>${arrivee.repere}`);
    }

    // Ligne
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
    if (depart && arrivee) {
      polylineRef.current = L.polyline(
        [[depart.latitude, depart.longitude], [arrivee.latitude, arrivee.longitude]],
        { color: '#4F46E5', weight: 4, dashArray: '10, 8', opacity: 0.8 }
      ).addTo(map);
      map.fitBounds([[depart.latitude, depart.longitude], [arrivee.latitude, arrivee.longitude]], { padding: [60, 60] });
    } else if (depart) {
      map.setView([depart.latitude, depart.longitude], 15);
    } else if (arrivee) {
      map.setView([arrivee.latitude, arrivee.longitude], 15);
    }
  }, [depart, arrivee]);

  const loadCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    const addr = await getAddressByCode(code);
    if (!addr) { toast.error('Adresse introuvable'); return; }
    if (!depart) { setDepart(addr); toast.success(`Départ : ${addr.addressCode}`); }
    else { setArrivee(addr); toast.success(`Arrivée : ${addr.addressCode}`); }
    setCodeInput('');
  };

  const inverser = () => { const tmp = depart; setDepart(arrivee); setArrivee(tmp); };

  const openGoogleMaps = (mode: string) => {
    if (!depart || !arrivee) return;
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${depart.latitude},${depart.longitude}&destination=${arrivee.latitude},${arrivee.longitude}&travelmode=${mode}`, '_blank');
  };

  const openWaze = () => {
    if (!arrivee) return;
    window.open(`https://waze.com/ul?ll=${arrivee.latitude},${arrivee.longitude}&navigate=yes`, '_blank');
  };

  const formatDuree = (mins: number) =>
    mins < 60 ? `${mins} min` : `${Math.floor(mins/60)}h${mins%60 > 0 ? mins%60 : ''}`;

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold text-gray-900 hidden sm:block">Adresse Postale Web</span>
          </Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600 font-medium flex items-center gap-1.5">
            <Route className="w-4 h-4 text-indigo-600" /> Navigation guidée
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[380px_1fr] gap-6">

        {/* ── Panneau gauche ── */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-indigo-600" /> Navigation
            </h1>
            <p className="text-sm text-gray-500 mt-1">Point A → Point B avec les codes APW</p>
          </div>

          {/* Saisie code rapide */}
          <Card className="p-4 bg-indigo-50 border-indigo-100">
            <p className="text-xs font-bold text-indigo-700 mb-2 uppercase tracking-wider">Saisir un code APW</p>
            <div className="flex gap-2">
              <input
                type="text" value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && loadCode()}
                placeholder="AW-ABI-84321"
                className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 bg-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
              <Button size="sm" onClick={loadCode} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-indigo-500 mt-1.5">1er code = départ · 2e code = arrivée</p>
          </Card>

          {/* Départ */}
          <Card className="p-4">
            <SearchBox label="Départ" color="indigo" value={depart} onSelect={setDepart} placeholder="Rechercher ou code APW..." />
          </Card>

          {/* Inverser */}
          <div className="flex justify-center">
            <button onClick={inverser}
              className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm transition-colors"
              title="Inverser">
              <RotateCcw className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Arrivée */}
          <Card className="p-4">
            <SearchBox label="Arrivée" color="emerald" value={arrivee} onSelect={setArrivee} placeholder="Rechercher ou code APW..." />
          </Card>

          {/* Infos trajet */}
          {distance !== null && (
            <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Route className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trajet estimé</span>
              </div>
              <p className="text-3xl font-bold mb-4">
                {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: '🚶 Pied', mins: Math.round(distance / 5 * 60) },
                  { label: '🏍️ Moto', mins: Math.round(distance / 40 * 60) },
                  { label: '🚗 Voiture', mins: Math.round(distance / 50 * 60) },
                ].map(m => (
                  <div key={m.label} className="bg-slate-700/60 rounded-lg p-2">
                    <p className="text-xs text-slate-400">{m.label}</p>
                    <p className="font-bold text-sm mt-0.5 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {formatDuree(m.mins)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Boutons navigation externe */}
          {depart && arrivee && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ouvrir dans</p>
              {[
                { label: '🗺️ Google Maps — Voiture', mode: 'driving' },
                { label: '🚶 Google Maps — À pied',  mode: 'walking' },
                { label: '🚌 Google Maps — Transport', mode: 'transit' },
              ].map(item => (
                <button key={item.label} onClick={() => openGoogleMaps(item.mode)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-sm font-medium text-gray-700 group">
                  <span>{item.label}</span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                </button>
              ))}
              <button onClick={openWaze}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-sm font-medium text-gray-700 group">
                <span>🔵 Waze</span>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-cyan-600" />
              </button>
            </div>
          )}

          {/* Détails adresses */}
          {(depart || arrivee) && (
            <div className="space-y-2">
              {[
                { addr: depart,  label: 'Départ',  border: 'border-l-indigo-500' },
                { addr: arrivee, label: 'Arrivée', border: 'border-l-emerald-500' },
              ].filter(x => x.addr).map(({ addr, label, border }) => (
                <Card key={label} className={`p-3 border-l-4 ${border}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{label}</p>
                      <p className="font-mono font-bold text-indigo-600 text-sm">{addr!.addressCode}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{addr!.repere}</p>
                      {addr!.ville && <p className="text-xs text-gray-400">{addr!.ville}{addr!.quartier ? ` · ${addr!.quartier}` : ''}</p>}
                    </div>
                    {addr!.addressCode !== 'GPS' && (
                      <Link to={`/${addr!.addressCode}`} target="_blank"
                        className="text-gray-400 hover:text-indigo-600 p-1">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Carte ── */}
        <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 h-[500px] lg:h-auto lg:min-h-[600px] sticky top-6">
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: 500 }} />
          {!depart && !arrivee && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-10 pointer-events-none">
              <div className="text-center p-6">
                <Navigation className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Entrez un point de départ</p>
                <p className="text-gray-400 text-sm">et une destination pour voir l'itinéraire</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    <PageGuide storageKey="navigation" steps={[
      {"icon":"🧭","title":"Navigation guidée","desc":"Entrez un point de départ et une destination pour planifier votre trajet."},
      {"icon":"📍","title":"Code APW","desc":"Tapez directement un code AW-ABI-XXXXX — le 1er devient le départ, le 2e l'arrivée."},
      {"icon":"📍","title":"GPS","desc":"Cliquez sur l'icône 📍 dans la barre de recherche pour utiliser votre position GPS comme point de départ."},
      {"icon":"🗺️","title":"Navigation externe","desc":"Une fois les deux points définis, ouvrez Google Maps ou Waze pour la navigation GPS réelle."}
    ]} />
    </>
  );
}

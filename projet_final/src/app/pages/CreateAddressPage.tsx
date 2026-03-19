import { PageGuide } from '../components/PageGuide';
import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { MapPin, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { MapPicker } from '../components/MapPicker';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { getCityFromCoordinates } from '../utils/geocodingService';
import { saveAddress, generateAddressCode } from '../utils/supabaseService';

type Step = 'map' | 'details' | 'creating';

export function CreateAddressPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('map');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [repere, setRepere] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('');
  const [quartier, setQuartier] = useState('');
  const [codeVille, setCodeVille] = useState('');
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    setLocation({ lat, lng });
    setIsGeoLoading(true);
    try {
      const result = await getCityFromCoordinates(lat, lng);
      setVille(result.ville);
      setPays(result.pays);
      setQuartier(result.quartier || '');
      setCodeVille(result.codeVille);
      toast.success('📍 ' + result.displayName + ' détecté');
    } catch {
      setCodeVille('AFR');
    } finally {
      setIsGeoLoading(false);
    }
  }, []);

  const handleCreate = async () => {
    if (!location || !ville.trim()) return;
    setStep('creating');
    try {
      const addressCode = generateAddressCode(codeVille || ville);
      const address = await saveAddress({
        addressCode,
        latitude: location.lat,
        longitude: location.lng,
        repere: repere.trim() || 'Aucun repère spécifié',
        ville,
        pays,
        quartier: quartier || undefined,
        isPublic,
      });
      toast.success('Adresse créée !');
      navigate('/' + address.addressCode + '?new=1');
    } catch (err: any) {
      toast.error('Erreur : ' + (err.message || 'Réessaie'));
      setStep('details');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" /><span>Retour</span>
            </Link>
            <div className="flex items-center gap-2">
              
              <h1 className="text-xl font-bold text-gray-900">Address-Web</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            <div className={'flex items-center gap-2 ' + (step === 'map' ? 'text-indigo-600' : 'text-green-600')}>
              <div className={'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ' + (step === 'map' ? 'bg-indigo-600' : 'bg-green-600')}>
                {step !== 'map' ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="font-medium text-sm hidden sm:inline">Position</span>
            </div>
            <div className="w-10 h-0.5 bg-gray-300" />
            <div className={'flex items-center gap-2 ' + (step === 'details' || step === 'creating' ? 'text-indigo-600' : 'text-gray-400')}>
              <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ' + (step === 'details' || step === 'creating' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500')}>
                2
              </div>
              <span className="font-medium text-sm hidden sm:inline">Détails</span>
            </div>
          </div>
        </div>
      </div>

      {/* ÉTAPE CARTE */}
      {step === 'map' && (
        <div className="flex flex-col flex-1">
          {/* Carte — hauteur réduite sur mobile pour que la barre reste visible */}
          <div className="relative" style={{ height: '50vh', minHeight: 280, maxHeight: 520 }}>
            <MapPicker onLocationSelect={handleLocationSelect} />
          </div>

          {/* Barre du bas — toujours visible */}
          <div className="bg-white border-t p-4 flex-shrink-0 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="text-sm flex-1 min-w-0">
                {isGeoLoading ? (
                  <span className="flex items-center gap-2 text-indigo-600">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span className="truncate">Détection en cours...</span>
                  </span>
                ) : location ? (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{ville || 'Position sélectionnée'}</span>
                  </span>
                ) : (
                  <span className="text-gray-500 text-xs">Appuyez sur la carte pour placer votre adresse</span>
                )}
              </div>
              <Button
                onClick={() => setStep('details')}
                disabled={!location || isGeoLoading}
                className="flex-shrink-0"
              >
                {isGeoLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : 'Continuer →'}
              </Button>
            </div>
          </div>

          {/* Instructions rapides */}
          <div className="bg-indigo-50 border-t border-indigo-100 px-4 py-3 flex-shrink-0">
            <p className="text-xs text-indigo-600 text-center">
              💡 Zoomez sur votre position exacte puis appuyez pour placer le repère
            </p>
          </div>
        </div>
      )}

      {/* ÉTAPE DÉTAILS */}
      {step === 'details' && (
        <div className="flex-1 py-6 px-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <Card className="p-5 md:p-8">
              <h2 className="text-xl font-bold mb-5">Personnalisez votre adresse</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ville">Ville *</Label>
                  <Input
                    id="ville"
                    value={ville}
                    onChange={e => setVille(e.target.value)}
                    placeholder="Ex: Abidjan"
                    className="mt-1"
                  />
                  {pays && <p className="text-sm text-indigo-600 mt-1">🌍 {pays} — détecté automatiquement</p>}
                </div>

                {quartier !== '' && (
                  <div>
                    <Label htmlFor="quartier">Quartier</Label>
                    <Input
                      id="quartier"
                      value={quartier}
                      onChange={e => setQuartier(e.target.value)}
                      placeholder="Ex: Cocody, Plateau..."
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="repere">Point de repère</Label>
                  <Input
                    id="repere"
                    value={repere}
                    onChange={e => setRepere(e.target.value)}
                    placeholder="Ex: Maison bleue, portail noir, derrière pharmacie"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">Aide les autres à reconnaître l'endroit</p>
                </div>

                {/* Visibilité */}
                <div className="border rounded-xl p-4 space-y-2">
                  <Label className="text-sm font-semibold">Visibilité de l'adresse</Label>
                  {[
                    { value: true, label: 'Publique', desc: 'Visible par tous via le lien ou la recherche', icon: '🌍' },
                    { value: false, label: 'Privée', desc: 'Visible uniquement par ceux qui ont le lien exact', icon: '🔒' },
                  ].map(opt => (
                    <label
                      key={String(opt.value)}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        isPublic === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        checked={isPublic === opt.value}
                        onChange={() => setIsPublic(opt.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-sm">{opt.icon} {opt.label}</div>
                        <div className="text-xs text-gray-500">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {location && (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-400 font-mono">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </div>
                )}

                {ville && (
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <p className="text-xs text-indigo-500 mb-1 font-semibold uppercase tracking-wide">Aperçu de votre code</p>
                    <p className="font-mono text-2xl font-bold text-indigo-700">
                      AW-{(codeVille || ville.substring(0, 3)).toUpperCase().padEnd(3, 'X')}-XXXXX
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={() => setStep('map')} className="flex-1">← Retour</Button>
                  <Button onClick={handleCreate} disabled={!ville.trim()} className="flex-1">
                    Créer mon adresse
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* CRÉATION EN COURS */}
      {step === 'creating' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-gray-600 text-lg text-center">Création de votre adresse...</p>
          <p className="text-gray-400 text-sm text-center">Votre adresse AW-{(codeVille || ville.substring(0,3)).toUpperCase()}-***** est en cours de génération</p>
        </div>
      )}
    </div>
      <PageGuide storageKey="create" steps={[{"icon": "📍", "title": "Étape 1 — Placer le repère", "desc": "Zoomez sur la carte et appuyez exactement sur l'endroit à identifier."}, {"icon": "🏙️", "title": "Étape 2 — Personnaliser", "desc": "Entrez la ville, un point de repère et choisissez public ou privé."}, {"icon": "✅", "title": "Étape 3 — Créer", "desc": "Cliquez sur Créer mon adresse — vous obtenez un code AW unique et permanent."}, {"icon": "📲", "title": "Étape 4 — Partager", "desc": "Copiez le lien ou partagez via WhatsApp — n'importe qui peut naviguer vers vous."}]} />
  );
}

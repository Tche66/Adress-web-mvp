import { PageGuide } from '../components/PageGuide';
import { Logo } from '../components/Logo';
import { Link, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { MapPin, Share2, Navigation, QrCode, Users, Truck, Building, Search, LogIn, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { getAllAddresses, type Address } from '../utils/supabaseService';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentAddresses, setRecentAddresses] = useState<Address[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getAllAddresses().then(addrs => setRecentAddresses(addrs.slice(0, 3)));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (/^AW-[A-Z]{3}-\d{5}$/i.test(searchQuery.trim())) {
      navigate('/' + searchQuery.trim().toUpperCase());
    } else {
      navigate('/explorer?q=' + encodeURIComponent(searchQuery.trim()));
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size={36} />
              <h1 className="text-2xl font-bold text-gray-900">Address-Web</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/explorer">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Search className="w-4 h-4 mr-1" /> Explorer
                </Button>
              </Link>
              <Link to="/plans">
                <Button variant="ghost" size="sm" className="hidden sm:flex text-indigo-600">
                  ✨ Tarifs
                </Button>
              </Link>
              {user ? (
                <Link to="/profil">
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-1" /> Mon profil
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    <LogIn className="w-4 h-4 mr-1" /> Connexion
                  </Button>
                </Link>
              )}
              <Link to="/create">
                <Button size="sm">Créer une adresse</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Bannière visiteur */}
      {!user && (
        <div className="bg-indigo-600 text-white py-2 px-4 text-center text-sm">
          Mode visiteur — <Link to="/auth" className="underline font-medium">Connectez-vous</Link> pour créer et gérer vos adresses
        </div>
      )}

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Créez votre adresse<br />numérique précise
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Partagez votre localisation exacte en un clic.<br />
            Une solution simple pour les zones sans adresse postale.
          </p>

          {/* Barre de recherche */}
          <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-8 flex gap-2">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Entrez un code AW-ABJ-84321 ou une ville..."
              className="flex-1 bg-white"
            />
            <Button type="submit">
              <Search className="w-4 h-4 mr-1" /> Chercher
            </Button>
          </form>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {user ? (
              <Link to="/create">
                <Button size="lg" className="text-lg px-8 py-6">
                  <MapPin className="w-5 h-5 mr-2" /> Créer mon adresse
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-6">
                  <LogIn className="w-5 h-5 mr-2" /> S'inscrire gratuitement
                </Button>
              </Link>
            )}
            <Link to="/AW-ABJ-84321">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Voir un exemple
              </Button>
            </Link>
          </div>

          {/* Demo link */}
          <div className="mt-8 inline-flex items-center gap-2 bg-white rounded-xl px-5 py-3 shadow-sm border border-indigo-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-400 font-mono text-sm">addressweb.brumerie.com/</span>
            <span className="text-indigo-600 font-mono font-bold text-sm">AW-ABJ-84321</span>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {[
            { icon: <Logo size={24} />, bg: 'bg-indigo-100', t: 'Localisation précise', d: 'Utilisez le GPS pour créer une adresse unique et précise au mètre près.' },
            { icon: <Share2 className="w-6 h-6 text-green-600" />, bg: 'bg-green-100', t: 'Partage facile', d: 'Partagez via WhatsApp, SMS ou un lien. Fini les explications compliquées.' },
            { icon: <Navigation className="w-6 h-6 text-orange-600" />, bg: 'bg-orange-100', t: 'Navigation GPS', d: 'Naviguez directement vers n\'importe quelle adresse via Google Maps ou Waze.' },
          ].map(f => (
            <Card key={f.t} className="p-6">
              <div className={`w-12 h-12 ${f.bg} rounded-lg flex items-center justify-center mb-4`}>{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.t}</h3>
              <p className="text-gray-600">{f.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { n: '1', t: 'Localiser', s: 'Placez un repère sur la carte à votre position exacte' },
              { n: '2', t: 'Générer', s: 'Obtenez un code unique comme AW-ABJ-84321' },
              { n: '3', t: 'Partager', s: 'Partagez via lien, WhatsApp ou QR code' },
              { n: '4', t: 'Naviguer', s: 'Vos visiteurs naviguent vers vous en un clic' },
            ].map(step => (
              <div key={step.n} className="text-center">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">{step.n}</div>
                <h3 className="font-semibold mb-2">{step.t}</h3>
                <p className="text-gray-600 text-sm">{step.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Pour tout le monde</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Users className="w-6 h-6 text-indigo-600" />, bg: 'bg-indigo-100', t: 'Particuliers', d: 'Maison, famille, amis — partagez votre adresse exacte une fois pour toutes.' },
            { icon: <Building className="w-6 h-6 text-green-600" />, bg: 'bg-green-100', t: 'Commerces', d: 'Boutique, restaurant — mettez le lien sur vos réseaux et carte de visite.' },
            { icon: <Truck className="w-6 h-6 text-orange-600" />, bg: 'bg-orange-100', t: 'Livraison', d: 'Le livreur clique sur le lien, la navigation démarre. Sans appel.' },
            { icon: <QrCode className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-100', t: 'Événements', d: 'Mariage, fête, chantier — partagez la localisation exacte à tous.' },
          ].map(u => (
            <Card key={u.t} className="p-6">
              <div className={`w-12 h-12 ${u.bg} rounded-lg flex items-center justify-center mb-4`}>{u.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{u.t}</h3>
              <p className="text-gray-600 text-sm">{u.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Explorer la carte */}
      <section className="bg-indigo-50 py-12 border-y border-indigo-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Explorez les adresses publiques</h2>
          <p className="text-gray-600 mb-6">Découvrez toutes les adresses créées sur Address-Web sur une carte interactive.</p>
          <Link to="/explorer">
            <Button size="lg" variant="outline">
              <Search className="w-5 h-5 mr-2" /> Explorer la carte
            </Button>
          </Link>
        </div>
      </section>

      {/* Adresses récentes */}
      {recentAddresses.length > 0 && (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8 text-center">Adresses récentes</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {recentAddresses.map(addr => (
                <Link key={addr.id} to={`/${addr.addressCode}`}>
                  <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span className="font-mono font-bold text-indigo-600 text-sm">{addr.addressCode}</span>
                    </div>
                    <p className="text-gray-700 font-medium text-sm">{addr.ville}</p>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{addr.repere}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Prêt à créer votre adresse ?</h2>
          <p className="text-xl text-indigo-100 mb-8">Gratuit. Rejoignez des milliers d'utilisateurs en Afrique.</p>
          <Link to={user ? '/create' : '/auth'}>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              {user ? 'Créer une adresse' : 'Commencer gratuitement'}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            
            <Logo size={28} /><span className="font-semibold text-lg">Address-Web</span>
          </div>
          <p className="text-gray-400 text-sm text-center mb-6">Une solution d'adressage numérique pour l'Afrique</p>
          <div className="flex items-center justify-center gap-6 flex-wrap mb-6">
            <Link to="/explorer" className="text-gray-400 hover:text-white text-sm">Explorer</Link>
            <Link to="/api" className="text-gray-400 hover:text-white text-sm">API</Link>
            <Link to="/plans" className="text-gray-400 hover:text-white text-sm">Tarifs</Link>
            <Link to="/import" className="text-gray-400 hover:text-white text-sm">Import CSV</Link>
            {user ? (
              <Link to="/profil" className="text-gray-400 hover:text-white text-sm">Mon profil</Link>
            ) : (
              <Link to="/auth" className="text-gray-400 hover:text-white text-sm">Connexion</Link>
            )}
            <Link to="/politique-confidentialite" className="text-gray-400 hover:text-white text-sm">Confidentialité</Link>
            <Link to="/conditions-utilisation" className="text-gray-400 hover:text-white text-sm">Conditions</Link>
            <Link to="/system-status" className="text-gray-400 hover:text-white text-sm">Statut</Link>
          </div>
          <p className="text-gray-500 text-xs text-center">© 2026 Address-Web. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
      <PageGuide storageKey="home" steps={[{"icon": "🏠", "title": "Bienvenue", "desc": "Donnez une adresse numérique précise à chaque lieu en Afrique."}, {"icon": "🔍", "title": "Rechercher", "desc": "Entrez un code AW-ABJ-84321 dans la barre pour trouver un lieu."}, {"icon": "➕", "title": "Créer", "desc": "Cliquez sur Créer mon adresse pour générer votre code unique."}, {"icon": "🗺️", "title": "Explorer", "desc": "Utilisez Explorer pour voir toutes les adresses publiques près de vous."}]} />
    </>
  );
}

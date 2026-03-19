import { PageGuide } from '../components/PageGuide';
import { Logo } from '../components/Logo';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { MapPin, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { signIn, signUp, supabase } from '../utils/supabaseService';
import { toast } from 'sonner';

type Mode = 'login' | 'register' | 'forgot';

const PROFESSIONS = [
  { value: 'particulier', label: '🏠 Particulier' },
  { value: 'commerce', label: '🏪 Commerce / Boutique' },
  { value: 'entreprise', label: '🏢 Entreprise' },
  { value: 'autre', label: '📍 Autre' },
];

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', nom: '', profession: 'particulier',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── Connexion / Inscription ──────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.email) { toast.error('Email requis'); return; }
    if (mode !== 'forgot' && !form.password) { toast.error('Mot de passe requis'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password);
        toast.success('Connexion réussie !');
        navigate('/profil');
      } else if (mode === 'register') {
        if (!form.nom.trim()) { toast.error('Nom requis'); setLoading(false); return; }
        if (form.password.length < 8) { toast.error('Mot de passe : minimum 8 caractères'); setLoading(false); return; }
        await signUp(form.email, form.password, form.nom, form.profession);
        toast.success('Compte créé ! Vérifiez votre email pour confirmer.');
        navigate('/profil');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        toast.error('Email ou mot de passe incorrect');
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        toast.error('Cet email est déjà utilisé');
      } else if (msg.includes('Email not confirmed')) {
        toast.error('Confirmez votre email avant de vous connecter');
      } else {
        toast.error(msg || 'Une erreur est survenue');
      }
    }
    setLoading(false);
  };

  // ── Mot de passe oublié ──────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!form.email) { toast.error('Entrez votre email d\'abord'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success('Email de réinitialisation envoyé !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur envoi email');
    }
    setLoading(false);
  };

  // ── UI ───────────────────────────────────────────────────────────
  const titles: Record<Mode, string> = {
    login: 'Connexion',
    register: 'Créer un compte',
    forgot: 'Mot de passe oublié',
  };
  const subs: Record<Mode, string> = {
    login: 'Accédez à vos adresses et votre profil',
    register: 'Créez vos adresses permanentes et personnalisées',
    forgot: 'Nous vous enverrons un lien de réinitialisation',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            
            <Logo size={32} /><span className="text-xl font-bold text-gray-900">Address-Web</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-500">
              Continuer sans compte
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="p-8">

            {/* Bouton retour pour forgot */}
            {mode === 'forgot' && (
              <button
                onClick={() => { setMode('login'); setResetSent(false); }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </button>
            )}

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4"><Logo size={72} /></div>
              <div className="hidden">
                
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{titles[mode]}</h1>
              <p className="text-gray-500 mt-2 text-sm">{subs[mode]}</p>
            </div>

            {/* ── MODE FORGOT ── */}
            {mode === 'forgot' ? (
              <div className="space-y-4">
                {resetSent ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">✉️</span>
                    </div>
                    <p className="font-medium text-gray-900">Email envoyé !</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Vérifiez votre boîte mail à <strong>{form.email}</strong> et cliquez sur le lien pour réinitialiser votre mot de passe.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6 w-full"
                      onClick={() => { setMode('login'); setResetSent(false); }}
                    >
                      Retour à la connexion
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="email-forgot">Votre email</Label>
                      <Input
                        id="email-forgot"
                        type="email"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                        placeholder="votre@email.com"
                        className="mt-1"
                        onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                      />
                    </div>
                    <Button
                      onClick={handleForgotPassword}
                      disabled={loading || !form.email}
                      className="w-full"
                      size="lg"
                    >
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Envoi...</>
                        : 'Envoyer le lien de réinitialisation'
                      }
                    </Button>
                  </>
                )}
              </div>
            ) : (
              /* ── MODE LOGIN / REGISTER ── */
              <div className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <Label htmlFor="nom">Nom complet *</Label>
                    <Input
                      id="nom"
                      value={form.nom}
                      onChange={e => set('nom', e.target.value)}
                      placeholder="Ex : Konan Serge"
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="serge@exemple.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="password">Mot de passe *</Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder={mode === 'register' ? 'Min. 8 caractères' : '••••••••'}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <Label>Type d'utilisateur</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {PROFESSIONS.map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => set('profession', p.value)}
                          className={`p-2.5 text-sm rounded-lg border text-left transition-colors ${
                            form.profession === p.value
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full mt-2"
                  size="lg"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Chargement...</>
                    : mode === 'login' ? 'Se connecter' : 'Créer mon compte'
                  }
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    {mode === 'login'
                      ? "Pas encore de compte ? S'inscrire"
                      : 'Déjà un compte ? Se connecter'
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Mentions légales */}
            {mode === 'register' && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  En créant un compte, vous acceptez nos{' '}
                  <Link to="/conditions-utilisation" className="text-indigo-500 hover:underline">
                    conditions d'utilisation
                  </Link>{' '}
                  et notre{' '}
                  <Link to="/politique-confidentialite" className="text-indigo-500 hover:underline">
                    politique de confidentialité
                  </Link>
                </p>
              </div>
            )}
          </Card>

          {/* Mode visiteur */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-3">Sans compte, vous pouvez :</p>
            <div className="flex justify-center gap-6 text-sm text-gray-500 flex-wrap">
              <span>🔍 Rechercher</span>
              <span>🗺️ Explorer la carte</span>
              <span>🧭 Naviguer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
      <PageGuide storageKey="auth" steps={[{"icon": "👋", "title": "Connexion ou inscription", "desc": "Créez un compte gratuit pour créer et gérer vos adresses personnelles."}, {"icon": "🆓", "title": "C'est gratuit", "desc": "Le plan gratuit permet de créer des adresses et de les partager sans limite."}, {"icon": "📧", "title": "Vérifiez votre email", "desc": "Après inscription, vérifiez votre boîte mail pour confirmer votre compte."}]} />
  );
}

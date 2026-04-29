import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../utils/supabaseService';
import { Logo } from '../components/Logo';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function BrumerieAuthPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connexion via Brumerie en cours...');

  useEffect(() => {
    // Supabase détecte automatiquement le magic link dans l'URL (hash ou query)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setStatus('success');
        setMessage('Connecté ! Redirection vers vos adresses...');
        setTimeout(() => navigate('/mes-lieux'), 1500);
      } else if (event === 'TOKEN_REFRESHED') {
        navigate('/mes-lieux');
      }
    });

    // Vérifier si déjà connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('success');
        setMessage('Déjà connecté ! Redirection...');
        setTimeout(() => navigate('/mes-lieux'), 1000);
      } else {
        // Attendre le magic link — si pas de session après 8s c'est une erreur
        setTimeout(() => {
          setStatus(s => {
            if (s === 'loading') {
              setMessage('Lien de connexion invalide ou expiré. Retour à Brumerie...');
              setTimeout(() => {
                window.location.href = 'https://brumerie.com';
              }, 2500);
              return 'error';
            }
            return s;
          });
        }, 8000);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        {/* Logos */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Logo size={40} />
            <span className="font-bold text-gray-900 text-lg">Adresse Postale Web</span>
          </div>
        </div>

        <div className="mb-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
          Connexion depuis Brumerie
        </div>

        {/* Icône statut */}
        <div className="my-6">
          {status === 'loading' && (
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          )}
          {status === 'error' && (
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          )}
        </div>

        <p className={`text-sm font-medium ${
          status === 'success' ? 'text-green-700' :
          status === 'error'   ? 'text-red-600'   : 'text-gray-600'
        }`}>
          {message}
        </p>

        {status === 'error' && (
          <button
            onClick={() => window.location.href = 'https://brumerie.com'}
            className="mt-4 text-xs text-indigo-600 hover:underline"
          >
            Retourner sur Brumerie
          </button>
        )}
      </div>
    </div>
  );
}

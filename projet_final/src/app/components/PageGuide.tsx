import { useState } from 'react';
import { X, ChevronRight, HelpCircle } from 'lucide-react';

interface Step {
  title: string;
  desc: string;
  icon: string;
}

interface PageGuideProps {
  steps: Step[];
  storageKey: string; // pour mémoriser si l'utilisateur a fermé
}

export function PageGuide({ steps, storageKey }: PageGuideProps) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(`guide_${storageKey}`) === 'done'
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [open, setOpen] = useState(!dismissed);

  const dismiss = () => {
    localStorage.setItem(`guide_${storageKey}`, 'done');
    setDismissed(true);
    setOpen(false);
  };

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
    else dismiss();
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-24 right-4 z-40 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"
      title="Aide"
    >
      <HelpCircle className="w-5 h-5" />
    </button>
  );

  const step = steps[currentStep];

  return (
    <div className="fixed bottom-24 right-4 z-40 w-72 bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
        <span className="text-white text-sm font-medium">Guide — étape {currentStep + 1}/{steps.length}</span>
        <button onClick={dismiss} className="text-indigo-200 hover:text-white"><X className="w-4 h-4" /></button>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <div className="text-3xl mb-2">{step.icon}</div>
        <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
      </div>

      {/* Barre de progression */}
      <div className="flex gap-1 px-4 pb-1">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 pt-2 flex justify-between items-center">
        <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600">Fermer le guide</button>
        <button
          onClick={next}
          className="flex items-center gap-1 bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {currentStep < steps.length - 1 ? <><span>Suivant</span><ChevronRight className="w-4 h-4" /></> : <span>Compris ✓</span>}
        </button>
      </div>
    </div>
  );
}

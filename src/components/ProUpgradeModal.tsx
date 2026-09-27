import React from 'react';
import { SubscriptionTier } from '../types';
import confetti from 'canvas-confetti';
import {
  X,
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Video,
  Film,
  Award,
} from 'lucide-react';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: SubscriptionTier;
  onToggleTier: (newTier: SubscriptionTier) => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  tier,
  onToggleTier,
}) => {
  if (!isOpen) return null;

  const isPro = tier === 'pro';

  const handleActivatePro = () => {
    onToggleTier('pro');
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });
    onClose();
  };

  const handleDowngradeFree = () => {
    onToggleTier('free');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden text-gray-100">
        
        {/* Glowing banner header */}
        <div className="relative px-6 py-6 bg-gradient-to-br from-amber-600/30 via-emerald-600/20 to-gray-950 border-b border-gray-800 text-center overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            VAR-ÃO PRO
          </div>
          <h2 className="text-2xl font-black text-white">Eleve o nível do seu jogo</h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto mt-1">
            Arbitragem de vídeo profissional e highlights sem limites para sua equipe ou quadra.
          </p>

          <div className="mt-4 flex items-baseline justify-center gap-1">
            <span className="text-sm text-gray-400">Apenas</span>
            <span className="text-3xl font-black text-white">R$ 9,00</span>
            <span className="text-xs text-gray-400">/ mês</span>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-gray-900/80 rounded-2xl p-4 border border-gray-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-mono uppercase text-[10px]">
                  <th className="pb-2.5">Recurso</th>
                  <th className="pb-2.5 text-center">Plano Free</th>
                  <th className="pb-2.5 text-center text-amber-400 font-bold">Plano Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-medium">
                <tr>
                  <td className="py-2.5 text-gray-300">Câmeras no Jam</td>
                  <td className="py-2.5 text-center text-gray-400">2 (Mestre + 1)</td>
                  <td className="py-2.5 text-center text-emerald-400 font-bold">Ilimitadas 🚀</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-300">Uso do VAR</td>
                  <td className="py-2.5 text-center text-emerald-400">Ilimitado</td>
                  <td className="py-2.5 text-center text-emerald-400 font-bold">Ilimitado</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-300">Salvar Lance (Highlights)</td>
                  <td className="py-2.5 text-center text-amber-400">3 por semana</td>
                  <td className="py-2.5 text-center text-emerald-400 font-bold">Ilimitado ✨</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-300">Qualidade de Vídeo</td>
                  <td className="py-2.5 text-center text-gray-400">720p Padrão</td>
                  <td className="py-2.5 text-center text-emerald-400 font-bold">1080p @ 60 FPS</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-300">Exportação</td>
                  <td className="py-2.5 text-center text-gray-400">Com Marca d'água</td>
                  <td className="py-2.5 text-center text-emerald-400 font-bold">Vídeo Limpo / HD</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            {!isPro ? (
              <button
                onClick={handleActivatePro}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-gray-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Assinar VAR-ÃO Pro (Simulação Imediata)</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                  <span className="text-xs text-emerald-300 font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Você já é assinante Pro!
                  </span>
                  <button
                    onClick={handleDowngradeFree}
                    className="text-[11px] text-gray-400 hover:text-red-400 underline"
                  >
                    Alternar para Free
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs"
                >
                  Continuar usando Pro
                </button>
              </div>
            )}

            {!isPro && (
              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Continuar com o Plano Gratuito
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

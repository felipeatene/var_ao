import React, { useState } from 'react';
import { SavedHighlight, SubscriptionTier } from '../types';
import {
  X,
  Play,
  Download,
  Share2,
  Trash2,
  Sparkles,
  Film,
  Calendar,
  Layers,
  HardDrive,
  CheckCircle,
} from 'lucide-react';

interface HighlightsGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlights: SavedHighlight[];
  onDeleteHighlight: (id: string) => void;
  weeklySavedCount: number;
  tier: SubscriptionTier;
  onOpenUpgradeModal: () => void;
}

export const HighlightsGalleryModal: React.FC<HighlightsGalleryModalProps> = ({
  isOpen,
  onClose,
  highlights,
  onDeleteHighlight,
  weeklySavedCount,
  tier,
  onOpenUpgradeModal,
}) => {
  if (!isOpen) return null;

  const [activeHighlight, setActiveHighlight] = useState<SavedHighlight | null>(
    highlights[0] || null
  );
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const isPro = tier === 'pro';
  const weeklyLimit = 3;
  const savesLeft = Math.max(0, weeklyLimit - weeklySavedCount);

  const handleDownload = (item: SavedHighlight) => {
    // Generate simulated download file
    const element = document.createElement('a');
    const file = new Blob(
      [
        `=== VAR-ÃO JOGADA EXPORTADA ===\nTítulo: ${item.title}\nData: ${item.timestamp}\nDuração: ${item.duration}s\nCâmeras Sincronizadas: ${item.camerasCount}\nResolução: ${item.resolution}\nMarca d'água: ${item.hasWatermark ? 'Ativa (Plano Free)' : 'Sem marca (Plano Pro)'}`,
      ],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = `${item.title.toLowerCase().replace(/\s+/g, '_')}_varao.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setDownloadSuccess(item.id);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden text-gray-100">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950/70 via-gray-900 to-gray-900 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-100 flex items-center gap-2">
                Galeria: <span className="text-emerald-400">VAR-ÃO — Jogadas</span>
              </h2>
              <p className="text-xs text-gray-400">
                Clipes de 40 segundos salvos diretamente para redes sociais e revisão.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Freemium Quota Bar */}
        <div className="px-5 py-2.5 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>
              Lances salvos esta semana:{' '}
              <strong className="text-white">
                {weeklySavedCount} {isPro ? '(Ilimitado no Pro)' : `/ ${weeklyLimit} grátis`}
              </strong>
            </span>
          </div>

          {!isPro ? (
            <button
              onClick={onOpenUpgradeModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-medium transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Desbloquear Ilimitado (R$ 9/mês)</span>
            </button>
          ) : (
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Sparkles className="w-3 h-3" /> PLANO PRO ATIVO
            </span>
          )}
        </div>

        {/* Clips Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {highlights.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <Film className="w-12 h-12 text-gray-600 mb-3" />
              <h3 className="text-base font-semibold text-gray-300">Nenhum lance salvo ainda</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Toque no botão <strong>"SALVAR LANCE"</strong> no painel do Mestre durante uma jogada
                incrível para exportar os últimos 40 segundos com multi-câmeras.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {highlights.map((item) => {
                const isSelected = activeHighlight?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveHighlight(item)}
                    className={`relative rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gray-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'bg-gray-900/60 hover:bg-gray-900 border-gray-800'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                            {item.duration}s BUFFER
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                            {item.resolution}
                          </span>
                          {item.hasWatermark && (
                            <span className="text-[9px] font-mono text-gray-400 bg-gray-800 px-1 rounded">
                              c/ marca d'água
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-gray-100">{item.title}</h4>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHighlight(item.id);
                        }}
                        className="text-gray-500 hover:text-red-400 p-1 rounded-lg"
                        title="Excluir lance"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tags & Camera Info */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-sky-400" />
                        {item.camerasCount} câmeras
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.timestamp}
                      </span>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center justify-between">
                      <div className="flex gap-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-medium bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item);
                        }}
                        className="px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        {downloadSuccess === item.id ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Exportado!</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Exportar MP4</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-900 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>Armazenamento local da galeria do Mestre</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold transition-colors"
          >
            Fechar Galeria
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Check } from 'lucide-react';
import { SubscriptionTier } from '../types';
import { UpgradeReason } from '../utils/planLimits';
const reasons: Record<UpgradeReason,string> = {
  camera_limit: 'O Plano Gratuito permite até 2 câmeras por partida.',
  weekly_highlight_limit: 'Você já utilizou os 3 salvamentos gratuitos desta semana.',
  export_1080p: 'A opção de exportação em 1080p faz parte do Plano Pro.',
  remove_watermark: 'A opção sem marca d’água faz parte do Plano Pro.',
};
interface Props { isOpen:boolean; onClose:()=>void; tier:SubscriptionTier; onToggleTier:(tier:SubscriptionTier)=>void; reason?:UpgradeReason }
export function ProUpgradeModal({isOpen,onClose,tier,onToggleTier,reason}:Props) {
  if (!isOpen) return null;
  const pro = tier === 'pro';
  return <div className="plans-overlay"><section className="plans-panel" aria-labelledby="plans-title">
    <header className="plans-header"><h2 id="plans-title">Experimente os planos</h2><button className="icon-button" onClick={onClose} aria-label="Fechar planos"><X/></button></header>
    <div className="plans-content">
      {reason && <p className="plans-reason" role="status">{reasons[reason]} Ative o Pro simulado para experimentar esse recurso.</p>}
      <p>Escolha como quer experimentar o Outro Ângulo.</p>
      <p className="plans-price"><strong>R$ 9,00</strong> / mês</p>
      <table><caption>Comparação dos planos da demonstração</caption><thead><tr><th>Recurso</th><th>Gratuito</th><th>Pro</th></tr></thead><tbody>
        <tr><th>Câmeras na partida</th><td>Até 2</td><td>Sem limite</td></tr>
        <tr><th>Revisar lances</th><td>Sem limite</td><td>Sem limite</td></tr>
        <tr><th>Salvar jogadas</th><td>3 por semana</td><td>Sem limite</td></tr>
        <tr><th>Exportação simulada</th><td>720p</td><td>1080p</td></tr>
        <tr><th>Marca d’água simulada</th><td>Com marca</td><td>Opcional</td></tr>
      </tbody></table>
      <p className="plans-note">A exportação deste protótipo gera um resumo em texto, não um vídeo. A cota semanal é local a este navegador.</p>
    </div>
    <footer className="plans-footer"><p>Simulação: nenhuma cobrança será realizada.</p>
      {pro ? <><button className="primary-button" onClick={onClose}><Check size={18}/>Continuar usando Pro</button><button className="quiet-button" onClick={()=>{onToggleTier('free');onClose();}}>Alternar para o Plano Gratuito</button></> : <><button className="primary-button" onClick={()=>{onToggleTier('pro');onClose();}}>Assinar Plano Pro — R$ 9,00/mês</button><button className="quiet-button" onClick={onClose}>Continuar com o Plano Gratuito</button></>}
    </footer>
  </section></div>;
}

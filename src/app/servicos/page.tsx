"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, X, Loader2, ShoppingBag, Scissors, Trash2, 
  Edit3, Save, MessageCircle, Megaphone, 
  Search, Users, Star, TrendingUp, AlertCircle
} from "lucide-react";

export default function Servicos() {
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos"); // todos, servico, produto, campanha
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMarketingOpen, setIsMarketingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do Item
  const [editingItem, setEditingItem] = useState<any>({
    id: null, nome: "", preco: "", custo: "", tipo: "servico", estoque: 0, mensagem_marketing: ""
  });
  
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [marketingTarget, setMarketingTarget] = useState("todas");
  const roseGoldDark = "#C27B5D";

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resItems, resClients] = await Promise.all([
        supabase.from("servicos").select("*").order("nome"),
        supabase.from("clientes").select(`*, financeiro(valor, tipo)`)
      ]);

      if (resItems.error) throw resItems.error;
      if (resItems.data) setItems(resItems.data);

      if (resClients.data) {
        const processed = resClients.data.map(c => ({
          ...c,
          totalGasto: c.financeiro?.filter((f: any) => f.tipo === 'receita').reduce((acc: number, cur: any) => acc + (cur.valor || 0), 0) || 0
        }));
        setClients(processed);
      }
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error);
      alert("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      nome: editingItem.nome,
      preco: parseFloat(editingItem.preco) || 0,
      custo: parseFloat(editingItem.custo) || 0,
      tipo: editingItem.tipo,
      estoque: editingItem.tipo === 'produto' ? parseInt(editingItem.estoque) || 0 : null,
      mensagem_marketing: editingItem.tipo === 'campanha' ? editingItem.mensagem_marketing : null
    };

    try {
      let error;
      if (editingItem.id) {
        const { error: err } = await supabase.from("servicos").update(payload).eq("id", editingItem.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("servicos").insert([payload]);
        error = err;
      }

      if (error) {
        // FUNÇÃO ALERTA DE ERRO DO BANCO
        console.error("Erro Supabase:", error);
        alert(`❌ ERRO AO SALVAR NO BANCO:\n\n${error.message}\n\nVerifique se as colunas 'custo', 'estoque' e 'mensagem_marketing' existem na tabela 'servicos'.`);
      } else {
        setIsFormOpen(false);
        await fetchData();
      }
    } catch (err: any) {
      alert("Erro inesperado: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNew = () => {
    // Inteligência: Abre com o tipo já filtrado
    const defaultType = filter === "todos" ? "servico" : filter;
    setEditingItem({
      id: null, nome: "", preco: "", custo: "", tipo: defaultType, estoque: 0, mensagem_marketing: ""
    });
    setIsFormOpen(true);
  };

  const sendMarketing = (client: any) => {
    let msg = selectedCampaign.mensagem_marketing || "Olá [NOME]!";
    msg = msg.replace("[NOME]", client.nome).replace("[PRECO]", selectedCampaign.preco.toFixed(2));
    const phone = client.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/351${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const lucro = (parseFloat(editingItem.preco) || 0) - (parseFloat(editingItem.custo) || 0);
  const margem = (parseFloat(editingItem.preco) || 0) > 0 ? (lucro / parseFloat(editingItem.preco)) * 100 : 0;

  return (
    <div className="w-full min-h-screen pt-10 px-4 md:px-8 pb-32 font-lato text-left text-white">
      
      {/* HEADER E FILTROS */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-left w-full">
          <h1 className="text-4xl font-cinzel text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${roseGoldDark}, #F2D2BD)` }}>Catálogo & Lucro</h1>
          <div className="flex gap-4 mt-6 overflow-x-auto pb-2 custom-scrollbar">
            {["todos", "servico", "produto", "campanha"].map((t) => (
              <button key={t} onClick={() => setFilter(t)} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${filter === t ? 'bg-[#C27B5D] border-[#C27B5D] text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                {t === 'todos' ? 'Ver Tudo' : t === 'servico' ? 'Serviços' : t === 'produto' ? 'Produtos' : 'Campanhas'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleOpenNew} className="bg-[#C27B5D] text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px] flex items-center gap-2 shadow-2xl transition-all hover:scale-105 whitespace-nowrap">
          <Plus className="w-4 h-4"/> Criar {filter === 'todos' ? 'Novo' : filter}
        </button>
      </div>

      {/* GRADE DE ITENS */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-[#C27B5D] w-10 h-10" /></div> : 
          items.filter(i => filter === "todos" ? true : i.tipo === filter).map(item => (
            <div key={item.id} className="bg-black/40 border border-white/5 p-8 rounded-[40px] hover:bg-white/5 transition-all group relative overflow-hidden shadow-xl text-left">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${item.tipo === 'campanha' ? 'bg-[#C27B5D]/20 text-[#C27B5D]' : 'bg-white/5 text-gray-400'}`}>
                  {item.tipo === 'servico' && <Scissors className="w-6 h-6"/>}
                  {item.tipo === 'produto' && <ShoppingBag className="w-6 h-6"/>}
                  {item.tipo === 'campanha' && <Megaphone className="w-6 h-6 animate-pulse"/>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingItem(item); setIsFormOpen(true); }} className="p-2 text-gray-500 hover:text-white transition-colors"><Edit3 className="w-4 h-4"/></button>
                  <button onClick={async () => { if(confirm("Deseja excluir permanentemente?")) { await supabase.from("servicos").delete().eq("id", item.id); fetchData(); } }} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>

              <h2 className="text-xl font-cinzel text-white uppercase tracking-widest truncate">{item.nome}</h2>
              
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-end">
                <div>
                  <p className="text-2xl font-cinzel text-white">{item.preco.toFixed(2)}€</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-green-500 font-bold">Lucro: {(item.preco - (item.custo || 0)).toFixed(2)}€</span>
                  </div>
                </div>
                {item.tipo === 'campanha' && (
                  <button onClick={() => { setSelectedCampaign(item); setIsMarketingOpen(true); }} className="bg-[#C27B5D] text-white p-3 rounded-xl shadow-lg hover:scale-110 transition-all">
                    <MessageCircle className="w-5 h-5"/>
                  </button>
                )}
                {item.tipo === 'produto' && (
                  <div className="text-[9px] font-bold uppercase text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                    Qtd: {item.estoque}
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {/* MODAL: CONFIGURAÇÃO 100% EDITÁVEL E COM SCROLL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <form onSubmit={handleSave} className="bg-[#0f0f0f] border border-[#C27B5D]/40 rounded-[40px] w-full max-w-lg p-10 relative max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <button type="button" onClick={() => setIsFormOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
            
            <h2 className="text-3xl font-cinzel text-white mb-8 text-center uppercase tracking-widest font-normal">
               {editingItem.id ? 'Ajustar' : 'Novo'} {editingItem.tipo}
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-1 block tracking-widest">Nome do {editingItem.tipo}</label>
                <input required value={editingItem.nome} onChange={e => setEditingItem({...editingItem, nome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white outline-none focus:border-[#C27B5D]" placeholder={`Ex: ${editingItem.tipo === 'servico' ? 'Drenagem' : 'Creme Facial'}`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-1 block tracking-widest">Custo (€)</label>
                  <input required type="number" step="0.01" value={editingItem.custo} onChange={e => setEditingItem({...editingItem, custo: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white outline-none font-cinzel" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-1 block tracking-widest">Venda (€)</label>
                  <input required type="number" step="0.01" value={editingItem.preco} onChange={e => setEditingItem({...editingItem, preco: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white outline-none font-cinzel" />
                </div>
              </div>

              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                 <div>
                    <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-1">Lucro Estimado</p>
                    <p className="text-xl font-cinzel text-green-400">{lucro.toFixed(2)}€</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-1">Margem Real</p>
                    <p className="text-xl font-cinzel text-[#C27B5D]">{margem.toFixed(0)}%</p>
                 </div>
              </div>

              {editingItem.tipo === 'produto' && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block tracking-widest">Unidades em Estoque</label>
                  <input type="number" value={editingItem.estoque} onChange={e => setEditingItem({...editingItem, estoque: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white outline-none" />
                </div>
              )}

              {editingItem.tipo === 'campanha' && (
                <div className="pt-4 border-t border-white/10">
                  <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-2 block tracking-widest">Mensagem de Venda (WhatsApp)</label>
                  <textarea 
                    value={editingItem.mensagem_marketing} 
                    onChange={e => setEditingItem({...editingItem, mensagem_marketing: e.target.value})} 
                    placeholder="Oi [NOME]! Aproveite o [SERVIÇO] por [PRECO]€..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-300 text-sm outline-none resize-none focus:border-[#C27B5D] custom-scrollbar" 
                  />
                  <p className="text-[9px] text-gray-500 mt-2">Use [NOME] e [PRECO] para preenchimento automático.</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 mt-10 rounded-[20px] text-white font-bold uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3" style={{ backgroundImage: `linear-gradient(to right, ${roseGoldDark}, #8a533d)` }}>
              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : <><Save className="w-5 h-5"/> Salvar Alterações</>}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: MARKETING DIRECIONADO */}
      {isMarketingOpen && selectedCampaign && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <div className="bg-[#0f0f0f] border border-[#C27B5D]/40 rounded-[40px] w-full max-w-2xl p-10 relative shadow-2xl">
            <button onClick={() => setIsMarketingOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
            
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-cinzel text-white uppercase tracking-widest mb-2 font-normal">Disparar Oferta</h2>
              <div className="text-[#C27B5D] font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                <Megaphone className="w-3 h-3"/> {selectedCampaign.nome}
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button onClick={() => setMarketingTarget("todas")} className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase border transition-all ${marketingTarget === 'todas' ? 'bg-[#C27B5D] border-[#C27B5D] text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>Todas Clientes</button>
              <button onClick={() => setMarketingTarget("vips")} className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase border transition-all ${marketingTarget === 'vips' ? 'bg-yellow-600 border-yellow-600 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>Somente VIPs</button>
            </div>

            <div className="max-h-[45vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {clients
                .filter(c => marketingTarget === "todas" ? true : c.totalGasto >= Number(localStorage.getItem("vipLimit") || 500))
                .map(client => (
                  <div key={client.id} className="bg-white/5 border border-white/5 p-5 rounded-[25px] flex items-center justify-between group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4 text-left">
                      <div className="bg-black/50 p-3 rounded-xl">
                        <Users className="w-4 h-4 text-[#C27B5D]"/>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-tight">{client.nome}</p>
                        <p className="text-[9px] text-gray-500 font-bold">Consumo: {client.totalGasto.toFixed(2)}€</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => sendMarketing(client)}
                      className="p-4 bg-green-500/10 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all shadow-md"
                    >
                      <MessageCircle className="w-5 h-5"/>
                    </button>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
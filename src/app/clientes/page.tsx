"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, UserPlus, X, Loader2, Phone, User, Trash2, 
  Star, ShoppingBag, Scissors, Save, MessageCircle, Cake, Edit3, Settings, PieChart, ChevronRight
} from "lucide-react";

export default function Clientes() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configurações Globais (VIP e Mensagens)
  const [vipLimit, setVipLimit] = useState(500);
  const [bdayMsg, setBdayMsg] = useState("Olá [NOME]! ✨ A Silvia Matos Estética passa para desejar um feliz aniversário e um dia maravilhoso!");

  // Estados da Cliente Selecionada
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const roseGoldDark = "#C27B5D";

  useEffect(() => {
    // Carrega preferências da Silvia salvas no navegador
    const savedVip = localStorage.getItem("vipLimit");
    const savedMsg = localStorage.getItem("bdayMsg");
    if (savedVip) setVipLimit(Number(savedVip));
    if (savedMsg) setBdayMsg(savedMsg);
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Busca clientes e as transações financeiras vinculadas
      const { data, error } = await supabase
        .from("clientes")
        .select(`*, financeiro(valor, tipo, descricao, categoria, data_transacao)`)
        .order("nome");

      if (error) throw error;

      if (data) {
        const processed = data.map(c => {
          // Calcula total gasto (apenas receitas)
          const total = c.financeiro
            ?.filter((f: any) => f.tipo === 'receita')
            .reduce((acc: number, cur: any) => acc + (cur.valor || 0), 0) || 0;
          
          // Lógica de aniversário (verifica se o mês coincide)
          const isBdayMonth = c.data_nascimento ? 
            new Date(c.data_nascimento).getUTCMonth() === new Date().getMonth() : false;

          return { ...c, totalGasto: total, isBdayMonth };
        });
        setClients(processed);
      }
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      const payload = {
        nome: formData.get("nome")?.toString(),
        telefone: formData.get("telefone")?.toString(),
        data_nascimento: formData.get("data_nascimento")?.toString() || null,
        observacoes: ""
      };

      if (!payload.nome || !payload.telefone) {
        alert("Nome e Telefone são obrigatórios!");
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from("clientes").insert([payload]);
      if (error) throw error;

      setIsFormOpen(false);
      form.reset();
      await fetchClients();
    } catch (error: any) {
      alert("Erro ao cadastrar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("clientes")
        .update({
          nome: selectedClient.nome,
          telefone: selectedClient.telefone,
          data_nascimento: selectedClient.data_nascimento,
          observacoes: selectedClient.observacoes
        })
        .eq("id", selectedClient.id);

      if (error) throw error;

      setIsDetailsOpen(false);
      await fetchClients();
    } catch (err: any) {
      alert("Erro ao atualizar ficha: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("⚠️ ATENÇÃO: Deseja excluir permanentemente esta cliente do sistema?")) return;
    
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
      
      setIsDetailsOpen(false);
      await fetchClients();
    } catch (err: any) {
      alert("Não foi possível excluir. Verifique se há vínculos ativos.");
    }
  };

  const openDetails = (client: any) => {
    setSelectedClient(client);
    const clientHistory = client.financeiro
      ?.filter((f: any) => f.tipo === 'receita')
      .sort((a: any, b: any) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime());
    setHistory(clientHistory || []);
    setIsDetailsOpen(true);
  };

  const saveSettings = () => {
    localStorage.setItem("vipLimit", vipLimit.toString());
    localStorage.setItem("bdayMsg", bdayMsg);
    setIsSettingsOpen(false);
    fetchClients();
  };

  return (
    <div className="w-full min-h-screen pt-24 md:pt-10 px-4 md:px-8 pb-32 font-lato text-left text-white">
      
      {/* --- HEADER --- */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-left w-full">
          <h1 className="text-4xl font-cinzel text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${roseGoldDark}, #F2D2BD)` }}>Gestão de Clientes</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Prontuário de Luxo & Fidelização</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={() => setIsSettingsOpen(true)} className="flex-1 md:flex-none p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-gray-400 hover:text-[#C27B5D] transition-all">
            <Settings className="w-5 h-5"/>
          </button>
          <button onClick={() => setIsFormOpen(true)} className="bg-[#C27B5D] text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px] flex items-center gap-2 shadow-2xl transition-all hover:scale-105">
            <UserPlus className="w-4 h-4"/> Nova Cliente
          </button>
        </div>
      </div>

      {/* --- BUSCA --- */}
      <div className="w-full max-w-6xl relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
        <input 
          type="text" 
          placeholder="Pesquisar por nome ou telemóvel..." 
          className="w-full bg-black/40 border border-white/5 rounded-[25px] py-5 pl-16 pr-6 text-white outline-none focus:border-[#C27B5D]/50 transition-all backdrop-blur-md"
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      {/* --- LISTA DE CLIENTES --- */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-[#C27B5D] w-10 h-10" /></div>
        ) : (
          clients.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.telefone.includes(search)).map(c => (
            <div key={c.id} onClick={() => openDetails(c)} className="bg-black/40 border border-white/5 p-8 rounded-[40px] hover:bg-white/5 transition-all cursor-pointer group relative shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-[#C27B5D]/10 p-4 rounded-2xl group-hover:bg-[#C27B5D] transition-colors">
                  <User className="text-[#C27B5D] group-hover:text-white w-6 h-6"/>
                </div>
                <div className="flex gap-2">
                  {c.isBdayMonth && <Cake className="w-5 h-5 text-pink-400 animate-pulse" />}
                  {c.totalGasto >= vipLimit && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                </div>
              </div>

              <h2 className="text-xl font-cinzel text-white uppercase tracking-widest truncate">{c.nome}</h2>
              <p className="text-xs text-gray-500 mt-2 font-bold tracking-tight">+351 {c.telefone}</p>

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-left">
                <div>
                  <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-1">Total Consumido</p>
                  <p className="text-lg font-cinzel text-[#C27B5D]">{c.totalGasto.toFixed(2)}€</p>
                </div>
                <div className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-2">Ver Ficha <Edit3 className="w-3 h-3"/></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL DETALHES (CORREÇÃO DE ROLAGEM) --- */}
      {isDetailsOpen && selectedClient && (
        <div className="fixed inset-0 z-[150] flex items-start md:items-center justify-center bg-black/98 backdrop-blur-xl p-0 md:p-4 overflow-y-auto">
          <div className="bg-[#0f0f0f] w-full max-w-5xl h-fit min-h-screen md:min-h-[85vh] flex flex-col md:flex-row relative shadow-2xl md:rounded-[40px] overflow-visible">
            
            {/* Botão Fechar Fixo no Mobile */}
            <button onClick={() => setIsDetailsOpen(false)} className="fixed md:absolute top-6 right-6 z-[250] text-gray-500 bg-black/50 p-3 rounded-full border border-white/10">
              <X className="w-8 h-8"/>
            </button>
            
            {/* LADO ESQUERDO: PRONTUÁRIO */}
            <div className="w-full md:w-1/2 p-6 md:p-12 border-b md:border-b-0 md:border-r border-white/5 flex flex-col text-left pt-24 md:pt-12">
              <h3 className="text-2xl font-cinzel text-white mb-8 uppercase tracking-widest">Prontuário</h3>
              <form onSubmit={handleUpdateClient} className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-[#C27B5D] mb-1 block tracking-widest">Nome Completo</label>
                    <input value={selectedClient.nome} onChange={e => setSelectedClient({...selectedClient, nome: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-5 px-6 text-white outline-none focus:border-[#C27B5D]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase text-[#C27B5D] mb-1 block tracking-widest">Telemóvel</label>
                      <input value={selectedClient.telefone} onChange={e => setSelectedClient({...selectedClient, telefone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-5 px-6 text-white outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase text-[#C27B5D] mb-1 block tracking-widest">Nascimento</label>
                      <input type="date" value={selectedClient.data_nascimento || ""} onChange={e => setSelectedClient({...selectedClient, data_nascimento: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-5 px-6 text-white outline-none text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-[#C27B5D] mb-1 block tracking-widest">Observações Técnicas</label>
                    <textarea value={selectedClient.observacoes || ""} onChange={e => setSelectedClient({...selectedClient, observacoes: e.target.value})} placeholder="Alergias, segredos de beleza, preferências..." className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-300 text-sm outline-none resize-none focus:border-[#C27B5D]" />
                  </div>
                </div>
                
                <div className="mt-auto pt-6 flex flex-col gap-4 pb-10">
                  <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-[#C27B5D] rounded-2xl text-white font-bold uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>} Salvar Alterações na Ficha
                  </button>
                  <button type="button" onClick={() => handleDeleteClient(selectedClient.id)} className="text-red-900 hover:text-red-500 text-[9px] font-bold uppercase flex items-center justify-center gap-2 transition-colors py-2">
                    <Trash2 className="w-3 h-3"/> Excluir Registro Permanente
                  </button>
                </div>
              </form>
            </div>

            {/* LADO DIREITO: HISTÓRICO */}
            <div className="w-full md:w-1/2 p-6 md:p-12 bg-white/[0.01] flex flex-col text-left">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-cinzel text-white uppercase tracking-widest">Consumo</h3>
                <button 
                  onClick={() => {
                    const msg = bdayMsg.replace("[NOME]", selectedClient.nome);
                    window.open(`https://wa.me/351${selectedClient.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="p-4 bg-green-500/10 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all shadow-lg"
                >
                  <MessageCircle className="w-6 h-6"/>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 min-h-[300px]">
                {history.length > 0 ? history.map((h, i) => (
                  <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between text-left">
                    <div className="flex items-center gap-4">
                      {h.categoria === 'produto' ? <ShoppingBag className="w-4 h-4 text-[#C27B5D]"/> : <Scissors className="w-4 h-4 text-white/40"/>}
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-tight">{h.descricao}</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase">{new Date(h.data_transacao).toLocaleDateString('pt-PT')}</p>
                      </div>
                    </div>
                    <span className="font-cinzel text-sm text-[#C27B5D]">{h.valor.toFixed(2)}€</span>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                    <PieChart className="w-12 h-12 mb-4"/>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-center">Sem registros no histórico</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CONFIGURAÇÕES --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <div className="bg-[#0f0f0f] border border-[#C27B5D]/40 rounded-[40px] w-full max-w-lg p-10 relative">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
            <h2 className="text-2xl font-cinzel text-white mb-8 text-center uppercase tracking-widest font-normal">Ajustes do Estúdio</h2>
            
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-2 block tracking-widest">Valor de Corte VIP (€)</label>
                <input type="number" value={vipLimit} onChange={e => setVipLimit(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-[#C27B5D]" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-2 block tracking-widest">Mensagem de Aniversário (WhatsApp)</label>
                <textarea value={bdayMsg} onChange={e => setBdayMsg(e.target.value)} className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-300 text-sm outline-none resize-none focus:border-[#C27B5D]" />
                <p className="text-[9px] text-gray-500 mt-2">Use <span className="text-[#C27B5D] font-bold">[NOME]</span> para preenchimento automático.</p>
              </div>
            </div>

            <button onClick={saveSettings} className="w-full py-5 mt-10 rounded-[20px] text-white font-bold uppercase text-[10px] tracking-widest shadow-xl" style={{ backgroundImage: `linear-gradient(to right, ${roseGoldDark}, #8a533d)` }}>
              Salvar Ajustes
            </button>
          </div>
        </div>
      )}

      {/* --- NOVO CADASTRO --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left">
          <form onSubmit={handleCreateClient} className="bg-[#0f0f0f] border border-[#C27B5D]/40 rounded-[40px] w-full max-w-md p-10 relative shadow-2xl">
            <button type="button" onClick={() => setIsFormOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
            <h2 className="text-3xl font-cinzel text-white mb-8 text-center uppercase tracking-widest">Nova Cliente</h2>
            <div className="space-y-6 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-1 block tracking-widest">Nome Completo</label>
                <input required name="nome" placeholder="NOME..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white outline-none focus:border-[#C27B5D]" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-1 block tracking-widest">Telemóvel (+351)</label>
                <input required name="telefone" placeholder="TELEMÓVEL..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-1 block tracking-widest">Nascimento</label>
                <input type="date" name="data_nascimento" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white outline-none text-xs" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-5 mt-10 rounded-[20px] text-white font-bold uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95" style={{ backgroundImage: `linear-gradient(to right, ${roseGoldDark}, #8a533d)` }}>
              {isSubmitting ? "Cadastrando..." : "Cadastrar Cliente"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
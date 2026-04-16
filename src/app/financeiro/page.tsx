"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, X, Loader2, Calendar, ShoppingBag, Scissors, 
  Trash2, ArrowUpCircle, ArrowDownCircle, PieChart, Award, Edit2, Save
} from "lucide-react";

export default function Financeiro() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [formData, setFormData] = useState({
    id: null as string | null,
    descricao: "",
    valor: "",
    custo: "",
    tipo: "receita", 
    categoria: "servico",
    data_transacao: new Date().toISOString().split('T')[0]
  });

  const roseGoldDark = "#C27B5D";

  useEffect(() => { fetchFinanceData(); }, [dateRange]);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      // AJUSTE: O dia de início começa às 00:00:00 e o dia de fim vai até 23:59:59
      const start = `${dateRange.from}T00:00:00.000Z`;
      const end = `${dateRange.to}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from("financeiro")
        .select(`*, clientes(nome)`)
        .gte("data_transacao", start)
        .lte("data_transacao", end)
        .order("data_transacao", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Erro na busca:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      custo: formData.tipo === 'receita' ? (parseFloat(formData.custo) || 0) : 0,
      tipo: formData.tipo,
      categoria: formData.categoria,
      data_transacao: new Date(formData.data_transacao).toISOString()
    };

    try {
      if (formData.id) {
        // LÓGICA DE ATUALIZAÇÃO (EDITAR)
        const { error } = await supabase
          .from("financeiro")
          .update(payload)
          .eq("id", formData.id);
        if (error) throw error;
      } else {
        // LÓGICA DE INSERÇÃO (NOVO)
        const { error } = await supabase
          .from("financeiro")
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      await fetchFinanceData(); // Força a atualização da lista
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar. Verifique a conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este lançamento permanentemente?")) return;
    const { error } = await supabase.from("financeiro").delete().eq("id", id);
    if (!error) fetchFinanceData();
  };

  const resetForm = () => {
    setFormData({ id: null, descricao: "", valor: "", custo: "", tipo: "receita", categoria: "servico", data_transacao: new Date().toISOString().split('T')[0] });
  };

  // CÁLCULOS TOTAIS
  const totalReceitas = transactions.filter(t => t.tipo === "receita").reduce((acc, cur) => acc + cur.valor, 0);
  const totalCustosInternos = transactions.filter(t => t.tipo === "receita").reduce((acc, cur) => acc + (cur.custo || 0), 0);
  const totalDespesasPuras = transactions.filter(t => t.tipo === "despesa").reduce((acc, cur) => acc + cur.valor, 0);
  
  const lucroLíquido = totalReceitas - totalCustosInternos - totalDespesasPuras;

  // RANKING REFINADO
  const statsMap = transactions
    .filter(t => t.tipo === "receita")
    .reduce((acc: any, cur: any) => {
      if (!acc[cur.descricao]) acc[cur.descricao] = { count: 0, total: 0 };
      acc[cur.descricao].count += 1;
      acc[cur.descricao].total += cur.valor;
      return acc;
    }, {});
  const rankingSorted = Object.entries(statsMap).sort(([, a]: any, [, b]: any) => b.count - a.count);

  return (
    <div className="w-full min-h-screen flex flex-col items-center pt-10 px-4 md:px-8 pb-32 font-lato text-left">
      
      {/* HEADER & FILTRO */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div className="font-cinzel">
          <h1 className="text-4xl font-normal text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${roseGoldDark}, #F2D2BD)` }}>Painel Financeiro</h1>
          <div className="flex items-center gap-4 mt-6 bg-white/5 p-3 rounded-2xl border border-white/5">
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent text-white text-[10px] outline-none uppercase font-bold" />
            <span className="text-gray-700">|</span>
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent text-white text-[10px] outline-none uppercase font-bold" />
          </div>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-[#C27B5D] text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-2xl">
          <Plus className="w-4 h-4" /> Novo Lançamento
        </button>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* DASHBOARD */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-cinzel">
            <div className="bg-black/40 border border-white/5 p-6 rounded-[30px]">
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-2"><ArrowUpCircle className="text-green-500 w-3 h-3"/> Ganhos Brutos</p>
              <h2 className="text-2xl text-white">{totalReceitas.toFixed(2)}€</h2>
            </div>
            <div className="bg-black/40 border border-white/5 p-6 rounded-[30px]">
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-2"><ArrowDownCircle className="text-red-500 w-3 h-3"/> Gastos Totais</p>
              <h2 className="text-2xl text-white">{(totalDespesasPuras + totalCustosInternos).toFixed(2)}€</h2>
            </div>
            <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-[#C27B5D]/30 p-6 rounded-[30px] shadow-xl">
              <p className="text-[9px] text-[#C27B5D] font-bold uppercase tracking-widest mb-2">Lucro Real</p>
              <h2 className="text-2xl text-white">{lucroLíquido.toFixed(2)}€</h2>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-cinzel text-white uppercase text-xs tracking-[0.3em] mb-6">Fluxo de Caixa</h3>
            {loading ? <Loader2 className="animate-spin text-[#C27B5D] mx-auto py-10" /> : transactions.map((t) => (
              <div key={t.id} className="bg-black/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${t.tipo === 'receita' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {t.categoria === 'produto' ? <ShoppingBag className="w-4 h-4"/> : <Scissors className="w-4 h-4"/>}
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white uppercase">{t.descricao}</h4>
                    <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-tight">
                       {t.tipo === 'receita' && t.custo > 0 && <span className="text-[#C27B5D]">Custo: {t.custo}€ | </span>} 
                       {new Date(t.data_transacao).toLocaleDateString('pt-PT')} • {t.clientes?.nome || 'Avulso'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <span className={`font-cinzel font-bold text-lg ${t.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.tipo === 'receita' ? '+' : '-'}{t.valor.toFixed(2)}€
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setFormData({ id: t.id, descricao: t.descricao, valor: t.valor.toString(), custo: t.custo?.toString() || "", tipo: t.tipo, categoria: t.categoria, data_transacao: new Date(t.data_transacao).toISOString().split('T')[0] }); setIsModalOpen(true); }} className="p-2 text-gray-500 hover:text-white"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RANKING */}
        <div className="lg:col-span-4 bg-black/40 border border-white/5 p-8 rounded-[40px] sticky top-10 backdrop-blur-md">
          <h3 className="font-cinzel text-white text-xs uppercase tracking-widest mb-10 flex items-center gap-3"><Award className="text-[#C27B5D]"/> Top Procura</h3>
          <div className="space-y-6">
            {rankingSorted.map(([name, stats]: any, index) => (
              <div key={name} className="flex flex-col gap-2">
                <div className="flex justify-between items-end text-[10px] font-bold">
                  <span className="text-white uppercase truncate max-w-[140px]">{index+1}. {name}</span>
                  <span className="text-[#C27B5D]">{stats.count}x</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#C27B5D] h-full" style={{ width: `${(stats.count / transactions.filter(t=>t.tipo==='receita').length)*100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL AJUSTADO (ADAPTATIVO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-left font-lato">
          <form onSubmit={handleSave} className="bg-[#0f0f0f] border border-[#C27B5D]/40 rounded-[40px] w-full max-w-lg p-10 relative">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
            <h2 className="text-3xl font-cinzel text-white mb-8 text-center uppercase tracking-widest">
              {formData.id ? 'Ajustar Registro' : 'Novo Lançamento'}
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-1 bg-white/5 rounded-2xl">
                <button type="button" onClick={() => setFormData({...formData, tipo: 'receita'})} className={`py-3 rounded-xl text-[10px] font-bold uppercase ${formData.tipo === 'receita' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-gray-500'}`}>Receita</button>
                <button type="button" onClick={() => setFormData({...formData, tipo: 'despesa'})} className={`py-3 rounded-xl text-[10px] font-bold uppercase ${formData.tipo === 'despesa' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-500'}`}>Despesa</button>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-1 block">Descrição</label>
                <input required type="text" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none focus:border-[#C27B5D]/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-1 block">
                    {formData.tipo === 'receita' ? 'Valor Venda (€)' : 'Valor Saída (€)'}
                  </label>
                  <input required type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none font-cinzel" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#C27B5D] mb-1 block">Data</label>
                  <input required type="date" value={formData.data_transacao} onChange={(e) => setFormData({...formData, data_transacao: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none text-xs" />
                </div>
              </div>

              {/* CUSTO AGORA É EDITÁVEL NO AJUSTE TAMBÉM */}
              {formData.tipo === 'receita' && (
                <div className="pt-4 border-t border-white/10">
                  <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block tracking-widest">Custo de Material (€)</label>
                  <input type="number" step="0.01" value={formData.custo} onChange={(e) => setFormData({...formData, custo: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none font-cinzel" />
                  
                  {formData.valor && (
                    <div className="mt-4 p-4 bg-[#C27B5D]/5 rounded-2xl flex justify-between">
                       <span className="text-[9px] font-bold uppercase text-gray-400">Margem:</span>
                       <span className="text-sm font-cinzel text-green-400 font-bold">
                          {(parseFloat(formData.valor) - (parseFloat(formData.custo) || 0)).toFixed(2)}€
                       </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 mt-10 rounded-[20px] text-white font-bold uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all hover:brightness-110" style={{ backgroundImage: `linear-gradient(to right, ${roseGoldDark}, #8a533d)` }}>
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>} 
              {formData.id ? 'Salvar Ajustes' : 'Confirmar Lançamento'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
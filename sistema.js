// sistema.js - Sistema integrado de Gestão Financeira com Google Sheets

class SistemaGestaoFinanceira {
    constructor() {
        this.lancamentos = [];
        this.planoContas = [];
        this.categorias = [];
        this.configuracoes = {};
        this.estatisticas = {};
        this.API_URL = 'https://script.google.com/macros/s/AKfycbxr08ByzmqoStCnflMxDylfBOrHfTesA1SaLAyj-TbZTaobkvbd6_5KpcHl00yLVMXrug/exec'; // Cole a URL do seu Apps Script
        this.syncStatus = 'offline';
        this.lastSync = null;
        this.fluxoCaixaChart = null;
        this.categoriasChart = null;
        this.evolucaoMensalChart = null;
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
        
        this.init();
    }
    
    async init() {
        // Tenta carregar do cache primeiro
        this.carregarDoCache();
        
        // Inicializa dados padrão se não existirem
        this.inicializarDadosPadrao();
        
        // Depois tenta sincronizar com a nuvem
        await this.sincronizar();
        
        this.inicializarGraficos();
        this.atualizarUI();
    }
    
    // ============ SINCRONIZAÇÃO COM GOOGLE SHEETS ============
    
    async sincronizar() {
        this.atualizarStatus('sincronizando');
        
        try {
            // 1. Buscar todos os dados da nuvem
            const cloudData = await this.buscarDaNuvem();
            
            // 2. Mesclar dados locais com nuvem
            await this.mesclarDados(cloudData);
            
            // 3. Salvar no cache local
            this.salvarNoCache();
            
            // 4. Atualizar estatísticas
            this.estatisticas = await this.buscarEstatisticas();
            
            this.atualizarStatus('online');
            this.lastSync = new Date();
            this.atualizarUltimaSincronizacao();
            
            // Atualizar interface
            this.atualizarDashboard();
            
            return { success: true, message: 'Sincronização completa!' };
            
        } catch (error) {
            console.error('Erro na sincronização:', error);
            this.atualizarStatus('offline');
            
            // Calcular estatísticas localmente
            this.estatisticas = this.calcularEstatisticasLocais();
            
            return { 
                success: false, 
                message: 'Modo offline. Dados carregados do cache.',
                error: error.message 
            };
        }
    }
    
    async buscarDaNuvem() {
        const url = `${this.API_URL}?action=get_all`;
        const response = await fetch(url, {
            mode: 'no-cors'
        });
        
        // Com no-cors, não podemos ler a resposta, então vamos assumir que falhou
        // e usar dados locais
        throw new Error('Modo no-cors não permite leitura de resposta');
        
        // Nota: Para realmente usar no-cors, precisamos de uma abordagem diferente
        // como usar JSONP ou configurar CORS no servidor
    }
    
    async enviarParaNuvem(dados) {
        const response = await fetch(this.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'sync_all',
                registros: dados
            })
        });
        
        // Com no-cors, não podemos verificar a resposta
        // Assumimos que foi enviado com sucesso
        return { success: true, message: 'Dados enviados (modo no-cors)' };
    }
    
    async buscarEstatisticas() {
        try {
            const url = `${this.API_URL}?action=get_estatisticas`;
            const response = await fetch(url, {
                mode: 'no-cors'
            });
            
            // Com no-cors, não podemos ler a resposta
            throw new Error('Modo no-cors não permite leitura de resposta');
            
        } catch (error) {
            console.warn('Não foi possível buscar estatísticas:', error);
        }
        
        // Fallback: calcular localmente
        return this.calcularEstatisticasLocais();
    }
    
    // ============ MÉTODOS DE DADOS ============
    
    async mesclarDados(cloudData) {
        // Mescla categorias
        this.categorias = this.mesclarArrays(
            this.categorias,
            cloudData.categorias || [],
            'id'
        );
        
        // Mescla plano de contas
        this.planoContas = this.mesclarArrays(
            this.planoContas,
            cloudData.plano_contas || [],
            'id'
        );
        
        // Mescla lançamentos (mantém os mais recentes)
        this.lancamentos = this.mesclarLancamentos(
            this.lancamentos,
            cloudData.lancamentos || []
        );
        
        // Configurações (prioridade para nuvem)
        this.configuracoes = this.arrayParaObjeto(cloudData.configuracoes || []);
    }
    
    mesclarArrays(local, cloud, chaveId) {
        const merged = [...cloud];
        const cloudIds = new Set(cloud.map(item => item[chaveId]));
        
        local.forEach(item => {
            if (!cloudIds.has(item[chaveId])) {
                merged.push(item);
            }
        });
        
        // Ordenar por ID
        return merged.sort((a, b) => a[chaveId] - b[chaveId]);
    }
    
    mesclarLancamentos(local, cloud) {
        const mergedMap = new Map();
        
        // Adiciona todos da nuvem
        cloud.forEach(lanc => {
            mergedMap.set(lanc.id, lanc);
        });
        
        // Adiciona locais (sobrescreve se for mais recente)
        local.forEach(lanc => {
            const existente = mergedMap.get(lanc.id);
            if (!existente || new Date(lanc.atualizado_em) > new Date(existente.atualizado_em)) {
                mergedMap.set(lanc.id, lanc);
            }
        });
        
        // Converter para array e ordenar por data (mais recente primeiro)
        return Array.from(mergedMap.values())
            .sort((a, b) => new Date(b.data) - new Date(a.data));
    }
    
    // ============ CRUD OPERAÇÕES COM SINCRONIZAÇÃO ============
    
    async adicionarLancamento(dados) {
        const novoId = await this.gerarNovoId('lancamentos');
        const agora = new Date().toISOString();
        
        const novoLancamento = {
            id: novoId,
            ...dados,
            valor: parseFloat(dados.valor),
            categoria_id: parseInt(dados.categoriaId),
            criado_em: agora,
            atualizado_em: agora,
            sincronizado: 'N' // Não sincronizado ainda
        };
        
        // Adiciona localmente
        this.lancamentos.unshift(novoLancamento);
        
        // Tenta enviar para nuvem (modo no-cors)
        try {
            await fetch(this.API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'novo_lancamento',
                    registro: novoLancamento
                })
            });
            
            novoLancamento.sincronizado = 'S';
            this.atualizarStatus('online');
        } catch (error) {
            console.warn('Lançamento salvo localmente (modo no-cors)', error);
        }
        
        this.salvarNoCache();
        this.atualizarDashboard();
        
        return novoLancamento;
    }
    
    async editarLancamento(id) {
        const lancamento = this.lancamentos.find(l => l.id === id);
        if (!lancamento) return;
        
        document.getElementById('data').value = lancamento.data;
        document.getElementById('tipo').value = lancamento.tipo;
        document.getElementById('descricao').value = lancamento.descricao;
        document.getElementById('categoria').value = lancamento.categoria_id || lancamento.categoriaId;
        document.getElementById('valor').value = lancamento.valor;
        document.getElementById('observacao').value = lancamento.observacao || '';
        
        document.getElementById('lancamentoForm').dataset.editId = id;
        this.abrirModalLancamento();
    }
    
    async salvarEdicaoLancamento(dados, id) {
        const index = this.lancamentos.findIndex(l => l.id === id);
        if (index === -1) return false;
        
        const agora = new Date().toISOString();
        const lancamentoAtualizado = {
            ...this.lancamentos[index],
            ...dados,
            valor: parseFloat(dados.valor),
            categoria_id: parseInt(dados.categoriaId),
            atualizado_em: agora,
            sincronizado: 'N'
        };
        
        this.lancamentos[index] = lancamentoAtualizado;
        
        // Tenta enviar para nuvem (modo no-cors)
        try {
            await fetch(this.API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'upsert',
                    tabela: 'lancamentos',
                    registro: lancamentoAtualizado
                })
            });
            
            lancamentoAtualizado.sincronizado = 'S';
            this.atualizarStatus('online');
        } catch (error) {
            console.warn('Alteração salva localmente (modo no-cors)', error);
        }
        
        this.salvarNoCache();
        this.atualizarDashboard();
        
        return true;
    }
    
    async excluirLancamento(id) {
        const index = this.lancamentos.findIndex(l => l.id === id);
        if (index === -1) return false;
        
        // Remove localmente
        this.lancamentos.splice(index, 1);
        
        // Tenta excluir da nuvem (modo no-cors)
        try {
            await fetch(this.API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'delete',
                    tabela: 'lancamentos',
                    registro: { id: id }
                })
            });
        } catch (error) {
            console.warn('Exclusão salva apenas localmente (modo no-cors)', error);
        }
        
        this.salvarNoCache();
        this.atualizarDashboard();
        
        return true;
    }
    
    async adicionarCategoria(dados) {
        const novoId = await this.gerarNovoId('categorias');
        const agora = new Date().toISOString();
        
        const novaCategoria = {
            id: novoId,
            ...dados,
            criado_em: agora,
            atualizado_em: agora
        };
        
        this.categorias.push(novaCategoria);
        
        // Sincroniza (modo no-cors)
        await this.sincronizarCategoria(novaCategoria);
        
        this.salvarNoCache();
        this.carregarCategorias();
        
        return novaCategoria;
    }
    
    async sincronizarCategoria(categoria) {
        try {
            await fetch(this.API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'upsert',
                    tabela: 'categorias',
                    registro: categoria
                })
            });
        } catch (error) {
            console.warn('Categoria salva localmente (modo no-cors)', error);
        }
    }
    
    // ============ CACHE LOCAL ============
    
    carregarDoCache() {
        try {
            this.lancamentos = JSON.parse(localStorage.getItem('lancamentos_cache')) || [];
            this.categorias = JSON.parse(localStorage.getItem('categorias_cache')) || [];
            this.planoContas = JSON.parse(localStorage.getItem('plano_contas_cache')) || [];
            this.configuracoes = JSON.parse(localStorage.getItem('configuracoes_cache')) || {};
            this.lastSync = localStorage.getItem('ultima_sincronizacao');
        } catch (error) {
            console.warn('Erro ao carregar cache:', error);
        }
    }
    
    salvarNoCache() {
        try {
            localStorage.setItem('lancamentos_cache', JSON.stringify(this.lancamentos));
            localStorage.setItem('categorias_cache', JSON.stringify(this.categorias));
            localStorage.setItem('plano_contas_cache', JSON.stringify(this.planoContas));
            localStorage.setItem('configuracoes_cache', JSON.stringify(this.configuracoes));
            localStorage.setItem('ultima_sincronizacao', this.lastSync || '');
        } catch (error) {
            console.warn('Erro ao salvar cache:', error);
        }
    }
    
    salvarDados() {
        this.salvarNoCache();
    }
    
    // ============ DADOS PADRÃO ============
    
    inicializarDadosPadrao() {
        // Apenas categorias e plano de contas padrão se não existirem
        this.inicializarCategoriasPadrao();
        this.inicializarPlanoContasPadrao();
        this.gerarIdsUnicos();
        this.salvarDados();
    }
    
    inicializarCategoriasPadrao() {
        if (this.categorias.length === 0) {
            this.categorias = [
                { id: 1, nome: "Vendas", tipo: "receita", cor: "#10b981", icone: "fas fa-shopping-cart", descricao: "Receitas de vendas de produtos" },
                { id: 2, nome: "Serviços", tipo: "receita", cor: "#3b82f6", icone: "fas fa-briefcase", descricao: "Receitas de prestação de serviços" },
                { id: 3, nome: "Salários", tipo: "despesa", cor: "#ef4444", icone: "fas fa-money-bill", descricao: "Pagamento de salários" },
                { id: 4, nome: "Aluguel", tipo: "despesa", cor: "#f59e0b", icone: "fas fa-home", descricao: "Pagamento de aluguel" },
                { id: 5, nome: "Fornecedores", tipo: "despesa", cor: "#8b5cf6", icone: "fas fa-truck", descricao: "Pagamento a fornecedores" },
                { id: 6, nome: "Marketing", tipo: "despesa", cor: "#ec4899", icone: "fas fa-bullhorn", descricao: "Despesas com marketing" },
                { id: 7, nome: "Investimentos", tipo: "receita", cor: "#06b6d4", icone: "fas fa-chart-line", descricao: "Rendimentos de investimentos" },
                { id: 8, nome: "Impostos", tipo: "despesa", cor: "#64748b", icone: "fas fa-file-invoice-dollar", descricao: "Pagamento de impostos" }
            ];
        }
    }
    
    inicializarPlanoContasPadrao() {
        if (this.planoContas.length === 0) {
            this.planoContas = [
                { id: 1, codigo: "1", nome: "Ativo", tipo: "ativo", pai: null, nivel: 0, saldo: 0 },
                { id: 2, codigo: "1.1", nome: "Ativo Circulante", tipo: "ativo", pai: 1, nivel: 1, saldo: 0 },
                { id: 3, codigo: "1.1.1", nome: "Caixa", tipo: "ativo", pai: 2, nivel: 2, saldo: 0 },
                { id: 4, codigo: "1.1.2", nome: "Bancos", tipo: "ativo", pai: 2, nivel: 2, saldo: 0 },
                { id: 5, codigo: "2", nome: "Passivo", tipo: "passivo", pai: null, nivel: 0, saldo: 0 },
                { id: 6, codigo: "3", nome: "Receitas", tipo: "receita", pai: null, nivel: 0, saldo: 0 },
                { id: 7, codigo: "3.1", nome: "Receitas Operacionais", tipo: "receita", pai: 6, nivel: 1, saldo: 0 },
                { id: 8, codigo: "3.1.1", nome: "Vendas", tipo: "receita", pai: 7, nivel: 2, saldo: 0 },
                { id: 9, codigo: "4", nome: "Despesas", tipo: "despesa", pai: null, nivel: 0, saldo: 0 },
                { id: 10, codigo: "4.1", nome: "Despesas Operacionais", tipo: "despesa", pai: 9, nivel: 1, saldo: 0 },
                { id: 11, codigo: "5", nome: "Patrimônio Líquido", tipo: "patrimonio", pai: null, nivel: 0, saldo: 0 }
            ];
        }
    }
    
    gerarIdsUnicos() {
        // Gerar IDs para categorias
        let maxCatId = Math.max(...this.categorias.map(c => c.id), 0);
        this.categorias.forEach(c => {
            if (!c.id) c.id = ++maxCatId;
        });
        
        // Gerar IDs para plano de contas
        let maxContaId = Math.max(...this.planoContas.map(p => p.id), 0);
        this.planoContas.forEach(p => {
            if (!p.id) p.id = ++maxContaId;
        });
        
        // Gerar IDs para lançamentos
        let maxLancId = Math.max(...this.lancamentos.map(l => l.id), 0);
        this.lancamentos.forEach(l => {
            if (!l.id) l.id = ++maxLancId;
        });
    }
    
    // ============ UTILITÁRIOS ============
    
    async gerarNovoId(tabela) {
        let maxId = 0;
        
        switch(tabela) {
            case 'lancamentos':
                maxId = Math.max(...this.lancamentos.map(l => l.id), 0);
                break;
            case 'categorias':
                maxId = Math.max(...this.categorias.map(c => c.id), 0);
                break;
            case 'plano_contas':
                maxId = Math.max(...this.planoContas.map(p => p.id), 0);
                break;
        }
        
        return maxId + 1;
    }
    
    arrayParaObjeto(array) {
        const obj = {};
        array.forEach(item => {
            obj[item.chave] = item.valor;
        });
        return obj;
    }
    
    calcularEstatisticasLocais() {
        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        
        let receitasMes = 0;
        let despesasMes = 0;
        let receitasTotal = 0;
        let despesasTotal = 0;
        
        this.lancamentos.forEach(lancamento => {
            const valor = parseFloat(lancamento.valor) || 0;
            const dataLanc = new Date(lancamento.data);
            
            if (lancamento.tipo === 'receita') {
                receitasTotal += valor;
                if (dataLanc.getMonth() === mesAtual && dataLanc.getFullYear() === anoAtual) {
                    receitasMes += valor;
                }
            } else if (lancamento.tipo === 'despesa') {
                despesasTotal += valor;
                if (dataLanc.getMonth() === mesAtual && dataLanc.getFullYear() === anoAtual) {
                    despesasMes += valor;
                }
            }
        });
        
        return {
            receitas_mes: receitasMes,
            despesas_mes: despesasMes,
            receitas_total: receitasTotal,
            despesas_total: despesasTotal,
            saldo_mes: receitasMes - despesasMes,
            saldo_total: receitasTotal - despesasTotal,
            total_lancamentos: this.lancamentos.length,
            ultima_sincronizacao: this.lastSync || 'Nunca'
        };
    }
    
    // ============ UI ============
    
    atualizarStatus(status) {
        this.syncStatus = status;
        
        const statusElement = document.getElementById('syncStatus');
        const syncBtn = document.getElementById('syncBtn');
        
        if (statusElement) {
            statusElement.className = 'sync-status';
            
            switch(status) {
                case 'online':
                    statusElement.classList.add('sync-online');
                    statusElement.textContent = 'Online';
                    if (syncBtn) syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar';
                    break;
                case 'offline':
                    statusElement.classList.add('sync-offline');
                    statusElement.textContent = 'Offline';
                    if (syncBtn) syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Tentar Novamente';
                    break;
                case 'sincronizando':
                    statusElement.classList.add('sync-warning');
                    statusElement.textContent = 'Sincronizando...';
                    if (syncBtn) syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando';
                    break;
            }
        }
        
        this.atualizarUltimaSincronizacao();
    }
    
    atualizarUltimaSincronizacao() {
        const lastSyncElement = document.getElementById('lastSync');
        if (lastSyncElement) {
            if (this.lastSync) {
                const data = new Date(this.lastSync);
                lastSyncElement.textContent = `Última sincronização: ${data.toLocaleString('pt-BR')}`;
            } else {
                lastSyncElement.textContent = 'Última sincronização: Nunca';
            }
        }
    }
    
    atualizarUI() {
        this.atualizarDashboard();
        this.atualizarStatus(this.syncStatus);
        this.atualizarUltimaSincronizacao();
    }
    
    // ============ DASHBOARD ============
    
    atualizarDashboard() {
        this.atualizarResumo();
        this.carregarLancamentosRecentes();
        this.carregarCategoriasPopulares();
        this.atualizarGraficoFluxoCaixa();
        
        // Atualiza os valores do dashboard
        const estatisticas = this.calcularEstatisticasLocais();
        
        const receitasTotalEl = document.getElementById('receitasTotal');
        const despesasTotalEl = document.getElementById('despesasTotal');
        const saldoAtualEl = document.getElementById('saldoAtual');
        const totalTransacoesEl = document.getElementById('totalTransacoes');
        
        if (receitasTotalEl) receitasTotalEl.textContent = this.formatarMoeda(estatisticas.receitas_mes);
        if (despesasTotalEl) despesasTotalEl.textContent = this.formatarMoeda(estatisticas.despesas_mes);
        if (saldoAtualEl) saldoAtualEl.textContent = this.formatarMoeda(estatisticas.saldo_mes);
        if (totalTransacoesEl) totalTransacoesEl.textContent = estatisticas.total_lancamentos;
    }
    
    atualizarResumo() {
        const estatisticas = this.calcularEstatisticasLocais();
        
        document.getElementById('receitasTotal').textContent = this.formatarMoeda(estatisticas.receitas_mes);
        document.getElementById('despesasTotal').textContent = this.formatarMoeda(estatisticas.despesas_mes);
        document.getElementById('saldoAtual').textContent = this.formatarMoeda(estatisticas.saldo_mes);
        document.getElementById('totalTransacoes').textContent = estatisticas.total_lancamentos;
    }
    
    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }
    
    // ============ LANÇAMENTOS RECENTES ============
    
    carregarLancamentosRecentes() {
        const tbody = document.getElementById('lancamentosBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const lancamentosOrdenados = this.ordenarPor(this.lancamentos, 'data', 'desc');
        
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const lancamentosPagina = lancamentosOrdenados.slice(inicio, fim);
        
        const totalPaginas = Math.ceil(this.lancamentos.length / this.itensPorPagina);
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
            pageInfo.textContent = `Página ${this.paginaAtual} de ${totalPaginas}`;
        }
        
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        if (prevPage) prevPage.disabled = this.paginaAtual <= 1;
        if (nextPage) nextPage.disabled = this.paginaAtual >= totalPaginas;
        
        lancamentosPagina.forEach(lancamento => {
            const categoria = this.categorias.find(c => c.id === (lancamento.categoria_id || lancamento.categoriaId)) || { nome: 'Não categorizado' };
            const tipoClass = lancamento.tipo === 'receita' ? 'badge-success' : 'badge-danger';
            const tipoTexto = lancamento.tipo === 'receita' ? 'Receita' : 'Despesa';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatarData(lancamento.data)}</td>
                <td>${lancamento.descricao}</td>
                <td>${categoria.nome}</td>
                <td><span class="badge ${tipoClass}">${tipoTexto}</span></td>
                <td>${this.formatarMoeda(lancamento.valor)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="sistema.editarLancamento(${lancamento.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="sistema.excluirLancamento(${lancamento.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // ============ CATEGORIAS POPULARES ============
    
    carregarCategoriasPopulares() {
        const tbody = document.getElementById('categoriasPopularesBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const contagemCategorias = {};
        this.lancamentos.forEach(lancamento => {
            const categoriaId = lancamento.categoria_id || lancamento.categoriaId;
            contagemCategorias[categoriaId] = (contagemCategorias[categoriaId] || 0) + 1;
        });
        
        const categoriasOrdenadas = Object.entries(contagemCategorias)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        categoriasOrdenadas.forEach(([categoriaId, quantidade]) => {
            const categoria = this.categorias.find(c => c.id === parseInt(categoriaId));
            if (categoria) {
                const total = this.lancamentos
                    .filter(l => (l.categoria_id || l.categoriaId) === parseInt(categoriaId))
                    .reduce((sum, l) => sum + l.valor, 0);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${categoria.nome}</td>
                    <td>${quantidade}</td>
                    <td>${this.formatarMoeda(total)}</td>
                `;
                tbody.appendChild(row);
            }
        });
    }
    
    // ============ FLUXO DE CAIXA ============
    
    carregarFluxoCaixa() {
        const tbody = document.getElementById('todosLancamentosBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        let lancamentosFiltrados = [...this.lancamentos];
        
        const dataInicio = document.getElementById('dataInicio')?.value;
        const dataFim = document.getElementById('dataFim')?.value;
        const categoriaId = document.getElementById('categoriaFilter')?.value;
        
        if (dataInicio) {
            lancamentosFiltrados = lancamentosFiltrados.filter(l => 
                new Date(l.data) >= new Date(dataInicio)
            );
        }
        
        if (dataFim) {
            lancamentosFiltrados = lancamentosFiltrados.filter(l => 
                new Date(l.data) <= new Date(dataFim)
            );
        }
        
        if (categoriaId) {
            lancamentosFiltrados = lancamentosFiltrados.filter(l => 
                (l.categoria_id || l.categoriaId) === parseInt(categoriaId)
            );
        }
        
        lancamentosFiltrados = this.ordenarPor(lancamentosFiltrados, 'data', 'desc');
        
        const paginaFluxo = parseInt(localStorage.getItem('paginaFluxo') || '1');
        const inicio = (paginaFluxo - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const lancamentosPagina = lancamentosFiltrados.slice(inicio, fim);
        
        const totalPaginas = Math.ceil(lancamentosFiltrados.length / this.itensPorPagina);
        const pageInfoFluxo = document.getElementById('pageInfoFluxo');
        if (pageInfoFluxo) {
            pageInfoFluxo.textContent = `Página ${paginaFluxo} de ${totalPaginas}`;
        }
        
        const prevPageFluxo = document.getElementById('prevPageFluxo');
        const nextPageFluxo = document.getElementById('nextPageFluxo');
        if (prevPageFluxo) prevPageFluxo.disabled = paginaFluxo <= 1;
        if (nextPageFluxo) nextPageFluxo.disabled = paginaFluxo >= totalPaginas;
        
        lancamentosPagina.forEach(lancamento => {
            const categoria = this.categorias.find(c => c.id === (lancamento.categoria_id || lancamento.categoriaId)) || { nome: 'Não categorizado' };
            const tipoClass = lancamento.tipo === 'receita' ? 'badge-success' : 'badge-danger';
            const tipoTexto = lancamento.tipo === 'receita' ? 'Receita' : 'Despesa';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatarData(lancamento.data)}</td>
                <td>${lancamento.descricao}</td>
                <td>${categoria.nome}</td>
                <td><span class="badge ${tipoClass}">${tipoTexto}</span></td>
                <td>${this.formatarMoeda(lancamento.valor)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="sistema.editarLancamento(${lancamento.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="sistema.excluirLancamento(${lancamento.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        this.carregarFiltroCategorias();
    }
    
    carregarFiltroCategorias() {
        const select = document.getElementById('categoriaFilter');
        if (!select) return;
        
        select.innerHTML = '<option value="">Todas</option>';
        this.categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            select.appendChild(option);
        });
    }
    
    // ============ PLANO DE CONTAS ============
    
    carregarPlanoContas() {
        const container = document.getElementById('planoContasTree');
        if (!container) return;
        
        container.innerHTML = '';
        
        const planoOrdenado = this.ordenarPlanoContas();
        this.calcularSaldosPlanoContas();
        
        planoOrdenado.forEach(conta => {
            const nivel = conta.nivel || this.calcularNivelConta(conta);
            const tipoBadge = this.getBadgeTipoConta(conta.tipo);
            const tipoTexto = this.getTextoTipoConta(conta.tipo);
            
            const item = document.createElement('div');
            item.className = `tree-item level-${nivel}`;
            item.innerHTML = `
                <div class="tree-codigo">${conta.codigo}</div>
                <div class="tree-nome">${conta.nome}</div>
                <div class="tree-tipo">
                    <span class="badge ${tipoBadge}">${tipoTexto}</span>
                </div>
                <div class="tree-saldo">${this.formatarMoeda(conta.saldo || 0)}</div>
                <div class="tree-actions">
                    <button class="action-btn add" onclick="sistema.adicionarSubConta(${conta.id})">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="action-btn edit" onclick="sistema.editarConta(${conta.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="sistema.excluirConta(${conta.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(item);
        });
    }
    
    ordenarPlanoContas() {
        return [...this.planoContas].sort((a, b) => {
            const partesA = a.codigo.split('.').map(Number);
            const partesB = b.codigo.split('.').map(Number);
            
            for (let i = 0; i < Math.max(partesA.length, partesB.length); i++) {
                const parteA = partesA[i] || 0;
                const parteB = partesB[i] || 0;
                
                if (parteA !== parteB) {
                    return parteA - parteB;
                }
            }
            
            return 0;
        });
    }
    
    calcularNivelConta(conta) {
        if (!conta.pai) return 0;
        const pai = this.planoContas.find(c => c.id === conta.pai);
        if (!pai) return 0;
        return this.calcularNivelConta(pai) + 1;
    }
    
    getBadgeTipoConta(tipo) {
        const tipos = {
            'ativo': 'badge-info',
            'passivo': 'badge-warning',
            'receita': 'badge-success',
            'despesa': 'badge-danger',
            'patrimonio': 'badge-primary'
        };
        return tipos[tipo] || 'badge-secondary';
    }
    
    getTextoTipoConta(tipo) {
        const textos = {
            'ativo': 'Ativo',
            'passivo': 'Passivo',
            'receita': 'Receita',
            'despesa': 'Despesa',
            'patrimonio': 'Patrimônio'
        };
        return textos[tipo] || tipo;
    }
    
    calcularSaldosPlanoContas() {
        this.planoContas.forEach(conta => conta.saldo = 0);
        
        this.lancamentos.forEach(lancamento => {
            const categoria = this.categorias.find(c => c.id === (lancamento.categoria_id || lancamento.categoriaId));
            if (categoria) {
                const contaCorrespondente = this.encontrarContaPorCategoria(categoria, lancamento.tipo);
                if (contaCorrespondente) {
                    if (lancamento.tipo === 'receita') {
                        contaCorrespondente.saldo += lancamento.valor;
                    } else {
                        contaCorrespondente.saldo += lancamento.valor;
                    }
                    this.atualizarSaldoContaPai(contaCorrespondente, lancamento);
                }
            }
        });
    }
    
    encontrarContaPorCategoria(categoria, tipo) {
        let conta = this.planoContas.find(c => 
            c.nome.toLowerCase().includes(categoria.nome.toLowerCase()) && 
            c.tipo === tipo
        );
        
        if (!conta) {
            conta = this.planoContas.find(c => 
                c.tipo === tipo && 
                c.nivel === 0
            );
        }
        
        return conta;
    }
    
    atualizarSaldoContaPai(conta, lancamento) {
        if (!conta.pai) return;
        const contaPai = this.planoContas.find(c => c.id === conta.pai);
        if (contaPai) {
            if (lancamento.tipo === 'receita') {
                contaPai.saldo += lancamento.valor;
            } else {
                contaPai.saldo += lancamento.valor;
            }
            this.atualizarSaldoContaPai(contaPai, lancamento);
        }
    }
    
    // ============ CATEGORIAS ============
    
    carregarCategorias() {
        const tbody = document.getElementById('categoriasBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const tipoFiltro = document.getElementById('tipoCategoriaFilter')?.value;
        let categoriasFiltradas = [...this.categorias];
        
        if (tipoFiltro) {
            categoriasFiltradas = categoriasFiltradas.filter(c => c.tipo === tipoFiltro);
        }
        
        categoriasFiltradas.forEach(categoria => {
            const totalLancamentos = this.lancamentos.filter(l => 
                (l.categoria_id || l.categoriaId) === categoria.id).length;
            const tipoClass = categoria.tipo === 'receita' ? 'badge-success' : 'badge-danger';
            const tipoTexto = categoria.tipo === 'receita' ? 'Receita' : 'Despesa';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="${categoria.icone || 'fas fa-tag'}" style="color: ${categoria.cor || '#0066ff'}"></i>
                        ${categoria.nome}
                    </div>
                </td>
                <td><span class="badge ${tipoClass}">${tipoTexto}</span></td>
                <td>
                    <div style="width: 30px; height: 30px; background: ${categoria.cor || '#0066ff'}; border-radius: 4px;"></div>
                </td>
                <td>${totalLancamentos}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="sistema.editarCategoria(${categoria.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="sistema.excluirCategoria(${categoria.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // ============ RELATÓRIOS ============
    
    carregarRelatorios() {
        this.carregarGraficoCategorias();
        this.carregarGraficoEvolucaoMensal();
        this.carregarResumoFinanceiro();
    }
    
    carregarGraficoCategorias() {
        if (!this.categoriasChart) return;
        
        const dadosPorCategoria = {};
        this.lancamentos.forEach(lancamento => {
            const categoria = this.categorias.find(c => c.id === (lancamento.categoria_id || lancamento.categoriaId));
            if (categoria) {
                if (!dadosPorCategoria[categoria.id]) {
                    dadosPorCategoria[categoria.id] = {
                        nome: categoria.nome,
                        cor: categoria.cor,
                        total: 0
                    };
                }
                dadosPorCategoria[categoria.id].total += lancamento.valor;
            }
        });
        
        const labels = [];
        const dados = [];
        const cores = [];
        
        Object.values(dadosPorCategoria).forEach(item => {
            if (item.total > 0) {
                labels.push(item.nome);
                dados.push(item.total);
                cores.push(item.cor || '#0066ff');
            }
        });
        
        this.categoriasChart.data.labels = labels;
        this.categoriasChart.data.datasets[0].data = dados;
        this.categoriasChart.data.datasets[0].backgroundColor = cores;
        this.categoriasChart.update();
    }
    
    carregarGraficoEvolucaoMensal() {
        if (!this.evolucaoMensalChart) return;
        
        const dadosPorMes = {};
        this.lancamentos.forEach(lancamento => {
            const data = new Date(lancamento.data);
            const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
            
            if (!dadosPorMes[mesAno]) {
                dadosPorMes[mesAno] = {
                    receitas: 0,
                    despesas: 0
                };
            }
            
            if (lancamento.tipo === 'receita') {
                dadosPorMes[mesAno].receitas += lancamento.valor;
            } else {
                dadosPorMes[mesAno].despesas += lancamento.valor;
            }
        });
        
        const meses = Object.keys(dadosPorMes).sort((a, b) => {
            const [mesA, anoA] = a.split('/').map(Number);
            const [mesB, anoB] = b.split('/').map(Number);
            return anoA - anoB || mesA - mesB;
        });
        
        const ultimosMeses = meses.slice(-12);
        
        const receitas = ultimosMeses.map(mes => dadosPorMes[mes].receitas);
        const despesas = ultimosMeses.map(mes => dadosPorMes[mes].despesas);
        
        this.evolucaoMensalChart.data.labels = ultimosMeses;
        this.evolucaoMensalChart.data.datasets[0].data = receitas;
        this.evolucaoMensalChart.data.datasets[1].data = despesas;
        this.evolucaoMensalChart.update();
    }
    
    carregarResumoFinanceiro() {
        const tbody = document.getElementById('resumoFinanceiroBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const dadosPorMes = {};
        this.lancamentos.forEach(lancamento => {
            const data = new Date(lancamento.data);
            const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
            const nomeMes = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            
            if (!dadosPorMes[mesAno]) {
                dadosPorMes[mesAno] = {
                    nome: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
                    receitas: 0,
                    despesas: 0
                };
            }
            
            if (lancamento.tipo === 'receita') {
                dadosPorMes[mesAno].receitas += lancamento.valor;
            } else {
                dadosPorMes[mesAno].despesas += lancamento.valor;
            }
        });
        
        const meses = Object.keys(dadosPorMes).sort((a, b) => {
            const [mesA, anoA] = a.split('/').map(Number);
            const [mesB, anoB] = b.split('/').map(Number);
            return anoB - anoA || mesB - mesA;
        });
        
        const ultimosMeses = meses.slice(0, 6);
        
        ultimosMeses.forEach(mes => {
            const dados = dadosPorMes[mes];
            const saldo = dados.receitas - dados.despesas;
            const margem = dados.receitas > 0 ? ((saldo / dados.receitas) * 100).toFixed(1) : 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dados.nome}</td>
                <td>${this.formatarMoeda(dados.receitas)}</td>
                <td>${this.formatarMoeda(dados.despesas)}</td>
                <td class="${saldo >= 0 ? 'text-success' : 'text-danger'}">
                    ${this.formatarMoeda(saldo)}
                </td>
                <td class="${margem >= 0 ? 'text-success' : 'text-danger'}">
                    ${margem}%
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // ============ GRÁFICOS ============
    
    inicializarGraficos() {
        this.inicializarGraficoFluxoCaixa();
        this.inicializarGraficoCategorias();
        this.inicializarGraficoEvolucaoMensal();
    }
    
    inicializarGraficoFluxoCaixa() {
        const ctx = document.getElementById('fluxoCaixaChart')?.getContext('2d');
        if (!ctx) return;
        
        this.fluxoCaixaChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Receitas',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Despesas',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.formatarMoeda(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }
                }
            }
        });
        
        this.atualizarGraficoFluxoCaixa();
    }
    
    inicializarGraficoCategorias() {
        const ctx = document.getElementById('categoriasChart')?.getContext('2d');
        if (!ctx) return;
        
        this.categoriasChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    }
    
    inicializarGraficoEvolucaoMensal() {
        const ctx = document.getElementById('evolucaoMensalChart')?.getContext('2d');
        if (!ctx) return;
        
        this.evolucaoMensalChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Receitas',
                        data: [],
                        backgroundColor: '#10b981',
                        borderWidth: 0
                    },
                    {
                        label: 'Despesas',
                        data: [],
                        backgroundColor: '#ef4444',
                        borderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }
                }
            }
        });
    }
    
    atualizarGraficoFluxoCaixa() {
        if (!this.fluxoCaixaChart) return;
        
        const dias = parseInt(document.getElementById('periodoFilter')?.value || '30');
        const dados = this.prepararDadosGrafico(dias);
        const tipo = document.getElementById('tipoFilter')?.value || 'todos';
        
        if (tipo !== 'todos') {
            if (tipo === 'receita') {
                dados.despesas = dados.despesas.map(() => 0);
            } else {
                dados.receitas = dados.receitas.map(() => 0);
            }
        }
        
        this.fluxoCaixaChart.data.labels = dados.labels;
        this.fluxoCaixaChart.data.datasets[0].data = dados.receitas;
        this.fluxoCaixaChart.data.datasets[1].data = dados.despesas;
        this.fluxoCaixaChart.update();
    }
    
    prepararDadosGrafico(dias) {
        const hoje = new Date();
        const labels = [];
        const receitas = [];
        const despesas = [];
        
        for (let i = dias - 1; i >= 0; i--) {
            const data = new Date();
            data.setDate(hoje.getDate() - i);
            labels.push(this.formatarData(data));
            receitas.push(0);
            despesas.push(0);
        }
        
        this.lancamentos.forEach(lancamento => {
            const dataLancamento = new Date(lancamento.data);
            const diffDias = Math.floor((hoje - dataLancamento) / (1000 * 60 * 60 * 24));
            
            if (diffDias >= 0 && diffDias < dias) {
                const index = dias - diffDias - 1;
                if (lancamento.tipo === 'receita') {
                    receitas[index] += lancamento.valor;
                } else {
                    despesas[index] += lancamento.valor;
                }
            }
        });
        
        return { labels, receitas, despesas };
    }
    
    // ============ CONTAS ============
    
    adicionarConta(dados) {
        const novoId = this.planoContas.length > 0 ? 
            Math.max(...this.planoContas.map(c => c.id)) + 1 : 1;
        
        let codigo = dados.codigo;
        if (!codigo) {
            codigo = this.gerarCodigoConta(dados);
        }
        
        const novaConta = {
            id: novoId,
            codigo: codigo,
            nome: dados.nome,
            tipo: dados.tipo,
            pai: dados.contaPai || null,
            nivel: dados.contaPai ? 
                this.calcularNivelConta(this.planoContas.find(c => c.id === dados.contaPai)) + 1 : 0,
            descricao: dados.descricao || '',
            saldo: 0
        };
        
        this.planoContas.push(novaConta);
        this.salvarDados();
        this.carregarPlanoContas();
    }
    
    editarConta(id) {
        const conta = this.planoContas.find(c => c.id === id);
        if (!conta) return;
        
        document.getElementById('contaPai').value = conta.pai || '';
        document.getElementById('tipoConta').value = conta.tipo;
        document.getElementById('codigoConta').value = conta.codigo;
        document.getElementById('nomeConta').value = conta.nome;
        document.getElementById('descricaoConta').value = conta.descricao || '';
        
        document.getElementById('contaForm').dataset.editId = id;
        document.getElementById('contaModalTitle').textContent = 'Editar Conta';
        
        this.abrirModalConta();
    }
    
    excluirConta(id) {
        const conta = this.planoContas.find(c => c.id === id);
        if (!conta) return;
        
        const temSubContas = this.planoContas.some(c => c.pai === id);
        if (temSubContas) {
            alert('Não é possível excluir uma conta que possui subcontas!');
            return;
        }
        
        if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
        
        this.planoContas = this.planoContas.filter(c => c.id !== id);
        this.salvarDados();
        this.carregarPlanoContas();
    }
    
    adicionarSubConta(contaPaiId) {
        const contaPai = this.planoContas.find(c => c.id === contaPaiId);
        if (!contaPai) return;
        
        document.getElementById('contaModalTitle').textContent = 'Nova Subconta';
        document.getElementById('contaPai').value = contaPaiId;
        document.getElementById('tipoConta').value = contaPai.tipo;
        document.getElementById('tipoConta').disabled = true;
        
        const subContas = this.planoContas.filter(c => c.pai === contaPaiId);
        const ultimoCodigo = subContas.length > 0 ? 
            Math.max(...subContas.map(c => parseInt(c.codigo.split('.').pop()))) : 0;
        const novoCodigo = contaPai.codigo + '.' + (ultimoCodigo + 1).toString().padStart(3, '0');
        
        document.getElementById('codigoConta').value = novoCodigo;
        document.getElementById('codigoConta').readOnly = true;
        
        this.abrirModalConta();
    }
    
    gerarCodigoConta(dados) {
        if (dados.contaPai) {
            const contaPai = this.planoContas.find(c => c.id === dados.contaPai);
            const subContas = this.planoContas.filter(c => c.pai === dados.contaPai);
            const ultimoCodigo = subContas.length > 0 ? 
                Math.max(...subContas.map(c => parseInt(c.codigo.split('.').pop()))) : 0;
            return contaPai.codigo + '.' + (ultimoCodigo + 1).toString().padStart(3, '0');
        } else {
            const contasPrincipais = this.planoContas.filter(c => !c.pai);
            const tipos = ['ativo', 'passivo', 'receita', 'despesa', 'patrimonio'];
            const indiceTipo = tipos.indexOf(dados.tipo);
            const contasMesmoTipo = contasPrincipais.filter(c => c.tipo === dados.tipo);
            const numero = contasMesmoTipo.length + 1;
            
            return (indiceTipo + 1) + '.' + numero.toString().padStart(2, '0');
        }
    }
    
    // ============ CATEGORIAS ============
    
    editarCategoria(id) {
        const categoria = this.categorias.find(c => c.id === id);
        if (!categoria) return;
        
        document.getElementById('nomeCategoria').value = categoria.nome;
        document.getElementById('tipoCategoria').value = categoria.tipo;
        document.getElementById('corCategoria').value = categoria.cor || '#0066ff';
        document.getElementById('iconeCategoria').value = categoria.icone || 'fas fa-shopping-cart';
        document.getElementById('descricaoCategoria').value = categoria.descricao || '';
        
        document.getElementById('categoriaForm').dataset.editId = id;
        document.getElementById('categoriaModalTitle').textContent = 'Editar Categoria';
        
        this.abrirModalCategoria();
    }
    
    excluirCategoria(id) {
        const categoria = this.categorias.find(c => c.id === id);
        if (!categoria) return;
        
        const temLancamentos = this.lancamentos.some(l => 
            (l.categoria_id || l.categoriaId) === id
        );
        if (temLancamentos) {
            alert('Não é possível excluir uma categoria que possui lançamentos associados!');
            return;
        }
        
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
        
        this.categorias = this.categorias.filter(c => c.id !== id);
        this.salvarDados();
        this.carregarCategorias();
    }
    
    // ============ MODAIS ============
    
    abrirModalLancamento() {
        const select = document.getElementById('categoria');
        if (select) {
            select.innerHTML = '<option value="">Selecione uma categoria</option>';
            this.categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nome;
                option.style.color = categoria.cor;
                select.appendChild(option);
            });
        }
        
        const dataInput = document.getElementById('data');
        if (dataInput) {
            dataInput.valueAsDate = new Date();
        }
        
        this.abrirModal(document.getElementById('lancamentoModal'));
    }
    
    abrirModalConta() {
        const select = document.getElementById('contaPai');
        if (select) {
            select.innerHTML = '<option value="">Nenhuma (Conta Principal)</option>';
            this.planoContas.forEach(conta => {
                const nivel = this.calcularNivelConta(conta);
                const prefixo = '— '.repeat(nivel);
                const option = document.createElement('option');
                option.value = conta.id;
                option.textContent = `${prefixo} ${conta.codigo} - ${conta.nome}`;
                select.appendChild(option);
            });
        }
        
        this.abrirModal(document.getElementById('contaModal'));
    }
    
    abrirModalCategoria() {
        this.abrirModal(document.getElementById('categoriaModal'));
    }
    
    abrirModal(modal) {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    fecharModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            const forms = [document.getElementById('lancamentoForm'), 
                          document.getElementById('contaForm'), 
                          document.getElementById('categoriaForm')];
            
            forms.forEach(form => {
                if (form) {
                    form.reset();
                    delete form.dataset.editId;
                }
            });
            
            const tipoContaInput = document.getElementById('tipoConta');
            if (tipoContaInput) tipoContaInput.disabled = false;
            
            const codigoContaInput = document.getElementById('codigoConta');
            if (codigoContaInput) codigoContaInput.readOnly = false;
            
            const dataInput = document.getElementById('data');
            if (dataInput) dataInput.valueAsDate = new Date();
        }
    }
    
    // ============ EXPORTAÇÃO ============
    
    exportarDados() {
        const dados = {
            lancamentos: this.lancamentos,
            categorias: this.categorias,
            planoContas: this.planoContas,
            exportadoEm: new Date().toISOString()
        };
        
        const json = JSON.stringify(dados, null, 2);
        this.exportarParaArquivo(json, `backup-financeiro-${this.formatarDataParaInput(new Date())}.json`, 'application/json');
        alert('Backup exportado com sucesso!');
    }
    
    exportarPlanoContas() {
        const dados = this.planoContas.map(conta => ({
            Código: conta.codigo,
            Nome: conta.nome,
            Tipo: conta.tipo,
            'Conta Pai': conta.pai ? this.planoContas.find(c => c.id === conta.pai)?.codigo : '',
            Descrição: conta.descricao || '',
            Saldo: this.formatarMoeda(conta.saldo || 0)
        }));
        
        const csv = this.converterParaCSV(dados);
        this.exportarParaArquivo(csv, `plano-contas-${this.formatarDataParaInput(new Date())}.csv`, 'text/csv');
        alert('Plano de contas exportado em CSV!');
    }
    
    // ============ UTILITÁRIOS DE FORMATAÇÃO ============
    
    formatarData(data) {
        return new Date(data).toLocaleDateString('pt-BR');
    }
    
    formatarDataParaInput(data) {
        const d = new Date(data);
        return d.toISOString().split('T')[0];
    }
    
    ordenarPor(array, campo, ordem = 'asc') {
        return [...array].sort((a, b) => {
            let aVal = a[campo];
            let bVal = b[campo];
            
            if (campo === 'data') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }
            
            if (ordem === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }
    
    converterParaCSV(objArray) {
        const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
        let str = '';
        
        // Cabeçalho
        const headers = Object.keys(array[0]);
        str += headers.join(',') + '\r\n';
        
        // Linhas
        for (let i = 0; i < array.length; i++) {
            let line = '';
            for (let index in array[i]) {
                if (line !== '') line += ',';
                line += array[i][index];
            }
            str += line + '\r\n';
        }
        
        return str;
    }
    
    exportarParaArquivo(data, filename, type) {
        const file = new Blob([data], { type: type });
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(file, filename);
        } else {
            const a = document.createElement('a');
            const url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }
    
    // ============ DADOS DE EXEMPLO (OPCIONAL) ============
    
    adicionarDadosExemplo() {
        if (this.lancamentos.length > 0) return;
        
        const hoje = new Date();
        const exemplos = [
            {
                data: this.formatarDataParaInput(hoje),
                tipo: 'receita',
                descricao: 'Venda de produtos eletrônicos',
                categoriaId: 1,
                valor: 2500.00,
                observacao: 'Venda para cliente regular'
            },
            {
                data: this.formatarDataParaInput(new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000)),
                tipo: 'receita',
                descricao: 'Serviço de consultoria',
                categoriaId: 2,
                valor: 1800.00,
                observacao: 'Projeto concluído'
            },
            {
                data: this.formatarDataParaInput(new Date(hoje.getTime() - 5 * 24 * 60 * 60 * 1000)),
                tipo: 'despesa',
                descricao: 'Pagamento de salários',
                categoriaId: 3,
                valor: 4200.00
            },
            {
                data: this.formatarDataParaInput(new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)),
                tipo: 'despesa',
                descricao: 'Aluguel do escritório',
                categoriaId: 4,
                valor: 1500.00
            },
            {
                data: this.formatarDataParaInput(new Date(hoje.getTime() - 10 * 24 * 60 * 60 * 1000)),
                tipo: 'receita',
                descricao: 'Venda online',
                categoriaId: 1,
                valor: 980.50
            }
        ];
        
        exemplos.forEach((exemplo) => {
            const novoId = this.lancamentos.length > 0 ? 
                Math.max(...this.lancamentos.map(l => l.id)) + 1 : 1;
            
            this.lancamentos.push({
                id: novoId,
                ...exemplo,
                valor: parseFloat(exemplo.valor),
                categoria_id: parseInt(exemplo.categoriaId),
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString(),
                sincronizado: 'N'
            });
        });
        
        this.salvarDados();
        this.atualizarDashboard();
    }
    
    // ============ LIMPAR DADOS ============
    
    limparLancamentos() {
        this.lancamentos = [];
        this.salvarDados();
        this.atualizarDashboard();
    }
}

// Exportar a classe para uso global
window.SistemaGestaoFinanceira = SistemaGestaoFinanceira;
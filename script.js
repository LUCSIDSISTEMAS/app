// script.js - Inicialização do sistema e eventos

let sistema;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar sistema
    sistema = new SistemaGestaoFinanceira();
    
	
    // Botão Configurar API
    const configAPIBtn = document.getElementById('configAPIBtn');
    if (configAPIBtn) {
        configAPIBtn.addEventListener('click', () => {
            sistema.abrirConfiguracaoAPI();
        });
    }
	
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            const result = await sistema.sincronizar();
            if (result.success) {
                alert('Sincronização completa!');
            } else {
                alert(`Modo offline: ${result.message}`);
            }
        });
    }	
    // Inicializar elementos DOM
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const navItems = document.querySelectorAll('.nav-item');
    const pageContainers = document.querySelectorAll('.page-container');
    
    // Elementos dos modais
    const lancamentoModal = document.getElementById('lancamentoModal');
    const contaModal = document.getElementById('contaModal');
    const categoriaModal = document.getElementById('categoriaModal');
    
    // Botões de abrir modais
    const novoLancamentoBtn = document.getElementById('novoLancamentoBtn');
    const novoLancamentoFluxoBtn = document.getElementById('novoLancamentoFluxoBtn');
    const novaContaBtn = document.getElementById('novaContaBtn');
    const novaCategoriaBtn = document.getElementById('novaCategoriaBtn');
    
    // Botões de fechar modais
    const closeLancamentoModal = document.getElementById('closeLancamentoModal');
    const closeContaModal = document.getElementById('closeContaModal');
    const closeCategoriaModal = document.getElementById('closeCategoriaModal');
    
    // Botões de cancelar
    const cancelLancamento = document.getElementById('cancelLancamento');
    const cancelConta = document.getElementById('cancelConta');
    const cancelCategoria = document.getElementById('cancelCategoria');
    
    // Formulários
    const lancamentoForm = document.getElementById('lancamentoForm');
    const contaForm = document.getElementById('contaForm');
    const categoriaForm = document.getElementById('categoriaForm');
    
    // Paginação
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const prevPageFluxo = document.getElementById('prevPageFluxo');
    const nextPageFluxo = document.getElementById('nextPageFluxo');
    
    // Filtros
    const aplicarFiltroBtn = document.getElementById('aplicarFiltroBtn');
    const periodoFilter = document.getElementById('periodoFilter');
    const tipoFilter = document.getElementById('tipoFilter');
    const tipoCategoriaFilter = document.getElementById('tipoCategoriaFilter');
    
    // Exportação
    const exportBtn = document.getElementById('exportBtn');
    const exportPlanoBtn = document.getElementById('exportPlanoBtn');
    
    // Botões adicionais
    const verTodosBtn = document.getElementById('verTodosBtn');
    const limparDadosBtn = document.getElementById('limparDadosBtn');
    const exemploBtn = document.getElementById('exemploBtn');
    
    // ============ EVENTOS DE NAVEGAÇÃO ============
    
    // Menu mobile
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Navegação entre páginas
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            navegarParaPagina(pageId);
            
            // Atualizar menu ativo
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Fechar menu mobile se aberto
            if (window.innerWidth <= 992 && sidebar) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    function navegarParaPagina(pageId) {
        // Esconder todas as páginas
        pageContainers.forEach(page => page.classList.remove('active'));
        
        // Mostrar página solicitada
        const pagina = document.getElementById(pageId);
        if (pagina) {
            pagina.classList.add('active');
            
            // Carregar dados específicos da página
            switch(pageId) {
                case 'dashboard':
                    sistema.atualizarDashboard();
                    break;
                case 'fluxo-caixa':
                    sistema.carregarFluxoCaixa();
                    break;
                case 'plano-contas':
                    sistema.carregarPlanoContas();
                    break;
                case 'categorias':
                    sistema.carregarCategorias();
                    break;
                case 'relatorios':
                    sistema.carregarRelatorios();
                    break;
            }
        }
    }
    
    // ============ EVENTOS DE MODAIS ============
    
    // Abrir modais
    if (novoLancamentoBtn) {
        novoLancamentoBtn.addEventListener('click', () => sistema.abrirModalLancamento());
    }
    
    if (novoLancamentoFluxoBtn) {
        novoLancamentoFluxoBtn.addEventListener('click', () => sistema.abrirModalLancamento());
    }
    
    if (novaContaBtn) {
        novaContaBtn.addEventListener('click', () => sistema.abrirModalConta());
    }
    
    if (novaCategoriaBtn) {
        novaCategoriaBtn.addEventListener('click', () => sistema.abrirModalCategoria());
    }
    
    // Fechar modais
    if (closeLancamentoModal) {
        closeLancamentoModal.addEventListener('click', () => sistema.fecharModal(lancamentoModal));
    }
    
    if (closeContaModal) {
        closeContaModal.addEventListener('click', () => sistema.fecharModal(contaModal));
    }
    
    if (closeCategoriaModal) {
        closeCategoriaModal.addEventListener('click', () => sistema.fecharModal(categoriaModal));
    }
    
    if (cancelLancamento) {
        cancelLancamento.addEventListener('click', () => sistema.fecharModal(lancamentoModal));
    }
    
    if (cancelConta) {
        cancelConta.addEventListener('click', () => sistema.fecharModal(contaModal));
    }
    
    if (cancelCategoria) {
        cancelCategoria.addEventListener('click', () => sistema.fecharModal(categoriaModal));
    }
    
    // Fechar modal ao clicar fora
    [lancamentoModal, contaModal, categoriaModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    sistema.fecharModal(modal);
                }
            });
        }
    });
    
    // ============ EVENTOS DE FORMULÁRIOS ============
    
    if (lancamentoForm) {
        lancamentoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const dados = {
                data: document.getElementById('data').value,
                tipo: document.getElementById('tipo').value,
                descricao: document.getElementById('descricao').value,
                categoriaId: document.getElementById('categoria').value,
                valor: document.getElementById('valor').value,
                observacao: document.getElementById('observacao').value
            };
            
            // Validar dados
            if (!dados.data || !dados.tipo || !dados.descricao || !dados.categoriaId || !dados.valor) {
                alert('Preencha todos os campos obrigatórios!');
                return;
            }
            
            const lancamentoId = lancamentoForm.dataset.editId;
            
            if (lancamentoId) {
                // Editar lançamento existente
                const index = sistema.lancamentos.findIndex(l => l.id === parseInt(lancamentoId));
                if (index !== -1) {
                    sistema.lancamentos[index] = {
                        id: parseInt(lancamentoId),
                        ...dados,
                        valor: parseFloat(dados.valor),
                        categoriaId: parseInt(dados.categoriaId)
                    };
                    sistema.salvarDados();
                    sistema.atualizarDashboard();
                    sistema.fecharModal(lancamentoModal);
                }
            } else {
                // Novo lançamento
                sistema.adicionarLancamento(dados);
                sistema.fecharModal(lancamentoModal);
            }
        });
    }
    
    if (contaForm) {
        contaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const dados = {
                contaPai: document.getElementById('contaPai').value ? 
                    parseInt(document.getElementById('contaPai').value) : null,
                tipo: document.getElementById('tipoConta').value,
                codigo: document.getElementById('codigoConta').value,
                nome: document.getElementById('nomeConta').value,
                descricao: document.getElementById('descricaoConta').value
            };
            
            if (!dados.tipo || !dados.nome) {
                alert('Preencha todos os campos obrigatórios!');
                return;
            }
            
            const contaId = contaForm.dataset.editId;
            
            if (contaId) {
                // Editar conta existente
                const index = sistema.planoContas.findIndex(c => c.id === parseInt(contaId));
                if (index !== -1) {
                    sistema.planoContas[index] = {
                        ...sistema.planoContas[index],
                        ...dados,
                        nivel: dados.contaPai ? 
                            sistema.calcularNivelConta(sistema.planoContas.find(c => c.id === dados.contaPai)) + 1 : 0
                    };
                    sistema.salvarDados();
                    sistema.carregarPlanoContas();
                    sistema.fecharModal(contaModal);
                }
            } else {
                // Nova conta
                sistema.adicionarConta(dados);
                sistema.fecharModal(contaModal);
            }
        });
    }
    
    if (categoriaForm) {
        categoriaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const dados = {
                nome: document.getElementById('nomeCategoria').value,
                tipo: document.getElementById('tipoCategoria').value,
                cor: document.getElementById('corCategoria').value,
                icone: document.getElementById('iconeCategoria').value,
                descricao: document.getElementById('descricaoCategoria').value
            };
            
            if (!dados.nome || !dados.tipo) {
                alert('Preencha todos os campos obrigatórios!');
                return;
            }
            
            const categoriaId = categoriaForm.dataset.editId;
            
            if (categoriaId) {
                // Editar categoria existente
                const index = sistema.categorias.findIndex(c => c.id === parseInt(categoriaId));
                if (index !== -1) {
                    sistema.categorias[index] = {
                        ...sistema.categorias[index],
                        ...dados
                    };
                    sistema.salvarDados();
                    sistema.carregarCategorias();
                    sistema.fecharModal(categoriaModal);
                }
            } else {
                // Nova categoria
                sistema.adicionarCategoria(dados);
                sistema.fecharModal(categoriaModal);
            }
        });
    }
    
    // ============ EVENTOS DE PAGINAÇÃO ============
    
    if (prevPage) {
        prevPage.addEventListener('click', () => {
            if (sistema.paginaAtual > 1) {
                sistema.paginaAtual--;
                sistema.carregarLancamentosRecentes();
            }
        });
    }
    
    if (nextPage) {
        nextPage.addEventListener('click', () => {
            const totalPaginas = Math.ceil(sistema.lancamentos.length / sistema.itensPorPagina);
            if (sistema.paginaAtual < totalPaginas) {
                sistema.paginaAtual++;
                sistema.carregarLancamentosRecentes();
            }
        });
    }
    
    if (prevPageFluxo) {
        prevPageFluxo.addEventListener('click', () => {
            let paginaFluxo = parseInt(localStorage.getItem('paginaFluxo') || '1');
            if (paginaFluxo > 1) {
                paginaFluxo--;
                localStorage.setItem('paginaFluxo', paginaFluxo.toString());
                sistema.carregarFluxoCaixa();
            }
        });
    }
    
    if (nextPageFluxo) {
        nextPageFluxo.addEventListener('click', () => {
            let paginaFluxo = parseInt(localStorage.getItem('paginaFluxo') || '1');
            const lancamentosFiltrados = sistema.filtrarLancamentos();
            const totalPaginas = Math.ceil(lancamentosFiltrados.length / sistema.itensPorPagina);
            
            if (paginaFluxo < totalPaginas) {
                paginaFluxo++;
                localStorage.setItem('paginaFluxo', paginaFluxo.toString());
                sistema.carregarFluxoCaixa();
            }
        });
    }
    
    // ============ EVENTOS DE FILTROS ============
    
    if (aplicarFiltroBtn) {
        aplicarFiltroBtn.addEventListener('click', () => {
            sistema.carregarFluxoCaixa();
        });
    }
    
    if (periodoFilter) {
        periodoFilter.addEventListener('change', () => {
            sistema.atualizarGraficoFluxoCaixa();
        });
    }
    
    if (tipoFilter) {
        tipoFilter.addEventListener('change', () => {
            sistema.atualizarGraficoFluxoCaixa();
        });
    }
    
    if (tipoCategoriaFilter) {
        tipoCategoriaFilter.addEventListener('change', () => {
            sistema.carregarCategorias();
        });
    }
    
    // ============ EVENTOS DE EXPORTAÇÃO ============
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            sistema.exportarDados();
        });
    }
    
    if (exportPlanoBtn) {
        exportPlanoBtn.addEventListener('click', () => {
            sistema.exportarPlanoContas();
        });
    }
    
    // ============ EVENTOS DIVERSOS ============
    
    if (verTodosBtn) {
        verTodosBtn.addEventListener('click', () => {
            navegarParaPagina('fluxo-caixa');
        });
    }
    
    // ============ BOTÕES ADICIONAIS ============
    
    // Botão para limpar lançamentos
    if (limparDadosBtn) {
        limparDadosBtn.addEventListener('click', () => {
            if (confirm('ATENÇÃO: Isso irá apagar TODOS os lançamentos. As categorias e plano de contas serão mantidos. Deseja continuar?')) {
                sistema.limparLancamentos();
                alert('Todos os lançamentos foram removidos! O sistema está zerado.');
            }
        });
    }
    
    // Botão para carregar dados de exemplo (opcional)
    if (exemploBtn) {
        exemploBtn.addEventListener('click', () => {
            if (confirm('Deseja carregar dados de exemplo? Esta ação adicionará lançamentos fictícios para demonstração.')) {
                sistema.adicionarDadosExemplo();
                alert('Dados de exemplo carregados com sucesso!');
            }
        });
    }
    
    // Expor sistema para uso global
    window.sistema = sistema;
    
    // Carregar dashboard inicial
    sistema.atualizarDashboard();
});
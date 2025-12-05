// utils.js - Funções utilitárias

// Formatadores
const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
};

const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
};

const formatarDataParaInput = (data) => {
    return data.toISOString().split('T')[0];
};

// Validações
const validarEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
};

// Manipulação de dados
const converterParaCSV = (dados) => {
    if (dados.length === 0) return '';
    
    const cabecalhos = Object.keys(dados[0]);
    const linhas = dados.map(objeto => 
        cabecalhos.map(cabecalho => {
            const valor = objeto[cabecalho];
            return typeof valor === 'string' && valor.includes(',') ? `"${valor}"` : valor;
        }).join(',')
    );
    return [cabecalhos.join(','), ...linhas].join('\n');
};

const exportarParaArquivo = (conteudo, nomeArquivo, tipoMime) => {
    const blob = new Blob([conteudo], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    
    URL.revokeObjectURL(url);
};

// Data/Hora
const obterDataAtual = () => {
    const agora = new Date();
    return {
        data: formatarDataParaInput(agora),
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: agora.getTime()
    };
};

const calcularDiferencaDias = (dataInicio, dataFim) => {
    const diff = new Date(dataFim) - new Date(dataInicio);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Local Storage
const salvarNoLocalStorage = (chave, dados) => {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
        return true;
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
        return false;
    }
};

const carregarDoLocalStorage = (chave, padrao = null) => {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : padrao;
    } catch (error) {
        console.error('Erro ao carregar do localStorage:', error);
        return padrao;
    }
};

// Arrays e Objetos
const ordenarPor = (array, chave, ordem = 'asc') => {
    return [...array].sort((a, b) => {
        const valorA = a[chave];
        const valorB = b[chave];
        
        if (valorA < valorB) return ordem === 'asc' ? -1 : 1;
        if (valorA > valorB) return ordem === 'asc' ? 1 : -1;
        return 0;
    });
};

const filtrarPorPeriodo = (array, dataInicio, dataFim, chaveData = 'data') => {
    return array.filter(item => {
        const dataItem = new Date(item[chaveData]);
        const inicio = dataInicio ? new Date(dataInicio) : null;
        const fim = dataFim ? new Date(dataFim) : null;
        
        if (inicio && dataItem < inicio) return false;
        if (fim && dataItem > fim) return false;
        return true;
    });
};

// Números
const calcularPercentual = (valor, total) => {
    if (total === 0) return 0;
    return ((valor / total) * 100).toFixed(2);
};

const formatarNumero = (numero, casasDecimais = 2) => {
    return parseFloat(numero).toFixed(casasDecimais).replace('.', ',');
};

// Strings
const capitalizarTexto = (texto) => {
    return texto.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
};

const truncarTexto = (texto, limite) => {
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
};

// Exportar todas as funções
window.Utils = {
    formatarMoeda,
    formatarData,
    formatarDataParaInput,
    validarEmail,
    validarCPF,
    converterParaCSV,
    exportarParaArquivo,
    obterDataAtual,
    calcularDiferencaDias,
    salvarNoLocalStorage,
    carregarDoLocalStorage,
    ordenarPor,
    filtrarPorPeriodo,
    calcularPercentual,
    formatarNumero,
    capitalizarTexto,
    truncarTexto
};
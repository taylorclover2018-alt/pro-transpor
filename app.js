// ============================================
// SISTEMA DE TRANSPORTE PRO - VERSÃO PREMIUM
// ============================================

// Variáveis Globais
let graficoComparativo = null;
let graficoDistribuicao = null;
let historicoRateios = [];
let veiculosCadastrados = [];

// ============================================
// INICIALIZAÇÃO
//============================================

document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados salvos (se existirem)
    carregarHistorico();
    carregarVeiculos();
    
    // Inicializar data atual
    atualizarDataAtual();
    
    // Inicializar datepicker
    if (document.querySelector('.datepicker')) {
        flatpickr('.datepicker', {
            locale: 'pt',
            dateFormat: 'd/m/Y',
            defaultDate: null // Sem data padrão
        });
    }
    
    // Inicializar dashboards
    atualizarDashboard();
    
    // Inicializar tabela de recentes
    atualizarTabelaRecente();
    
    // Inicializar listeners
    inicializarListeners();
    
    // Atualizar contadores de alunos
    atualizarContadoresAlunos();
});

function inicializarListeners() {
    // Theme toggle
    document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
    
    // Menu toggle (mobile)
    document.querySelector('.menu-toggle').addEventListener('click', toggleSidebar);
    
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            mudarPagina(page);
        });
    });
    
    // Inputs de alunos
    document.querySelectorAll('.aluno-input').forEach(input => {
        input.addEventListener('input', atualizarContadoresAlunos);
    });
    
    // Chart period
    document.getElementById('chartPeriod')?.addEventListener('change', function() {
        atualizarGraficos();
    });
}

// ============================================
// FUNÇÕES DE TEMA E INTERFACE
// ============================================

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const icon = document.querySelector('.theme-toggle i');
    if (document.body.classList.contains('dark-theme')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

function mudarPagina(pagina) {
    // Atualizar active na navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pagina) {
            item.classList.add('active');
        }
    });
    
    // Atualizar página visível
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pagina}-page`).classList.add('active');
    
    // Atualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'rateio': 'Rateio',
        'historico': 'Histórico',
        'veiculos': 'Veículos',
        'relatorios': 'Relatórios',
        'configuracoes': 'Configurações'
    };
    document.getElementById('page-title').textContent = titles[pagina];
    
    // Atualizar conteúdo específico da página
    if (pagina === 'dashboard') {
        atualizarDashboard();
    } else if (pagina === 'historico') {
        atualizarTabelaHistorico();
    } else if (pagina === 'veiculos') {
        atualizarGridVeiculos();
    }
}

function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = mensagem;
    
    if (tipo === 'success') {
        icon.className = 'fas fa-check-circle';
        toast.style.background = 'linear-gradient(135deg, #06d6a0 0%, #05b588 100%)';
    } else if (tipo === 'error') {
        icon.className = 'fas fa-exclamation-circle';
        toast.style.background = 'linear-gradient(135deg, #ef476f 0%, #d43f63 100%)';
    } else if (tipo === 'warning') {
        icon.className = 'fas fa-exclamation-triangle';
        toast.style.background = 'linear-gradient(135deg, #ffd166 0%, #ffb347 100%)';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function atualizarDataAtual() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('pt-BR', options);
    document.getElementById('currentDate').textContent = today;
}

// ============================================
// FUNÇÕES DE VEÍCULOS
// ============================================

function gerarVeiculos(rota, qtd) {
    let container = document.getElementById("veiculos" + rota);
    container.innerHTML = "";
    
    if (qtd === 0 || qtd === null || qtd === '') {
        container.innerHTML = '<p class="empty-message small">Nenhum veículo adicionado</p>';
        document.getElementById(`totalVeiculos${rota}`).textContent = '0';
        return;
    }
    
    for (let i = 0; i < qtd; i++) {
        let veiculoDiv = document.createElement('div');
        veiculoDiv.className = 'veiculo-card';
        veiculoDiv.style.animation = 'fadeIn 0.3s ease';
        veiculoDiv.style.animationDelay = `${i * 0.1}s`;
        
        veiculoDiv.innerHTML = `
            <h4><i class="fas fa-bus"></i> Veículo ${i + 1}</h4>
            <div class="input-group">
                <label><i class="fas fa-tag"></i> Nome:</label>
                <input type="text" placeholder="Ex: Ônibus A">
            </div>
            <div class="input-group">
                <label><i class="fas fa-dollar-sign"></i> Diária (R$):</label>
                <input type="number" step="0.01" min="0" placeholder="0,00">
            </div>
            <div class="input-group">
                <label><i class="fas fa-calendar-alt"></i> Nº Diárias:</label>
                <input type="number" min="0" placeholder="0">
            </div>
        `;
        
        container.appendChild(veiculoDiv);
    }
    
    // Atualizar contador de veículos
    document.getElementById(`totalVeiculos${rota}`).textContent = qtd;
}

function calcularTotalRota(rota) {
    let container = document.getElementById("veiculos" + rota);
    let veiculos = container.querySelectorAll(".veiculo-card");
    let total = 0;
    
    veiculos.forEach(veiculo => {
        let inputs = veiculo.querySelectorAll("input");
        if (inputs.length >= 3) {
            let diaria = parseFloat(inputs[1].value) || 0;
            let qtd = parseFloat(inputs[2].value) || 0;
            total += diaria * qtd;
        }
    });
    
    return total;
}

// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

function calcular() {
    // Verificar se há veículos
    let veiculos0 = document.querySelectorAll('#veiculos0 .veiculo-card').length;
    let veiculos1 = document.querySelectorAll('#veiculos1 .veiculo-card').length;
    
    if (veiculos0 === 0 && veiculos1 === 0) {
        mostrarToast('Adicione pelo menos um veículo para calcular', 'warning');
        return;
    }
    
    // Cálculos principais
    let bruto0 = calcularTotalRota(0);
    let bruto1 = calcularTotalRota(1);
    let brutoGeral = bruto0 + bruto1;

    let auxTotal = parseFloat(document.getElementById("auxilioTotal").value) || 0;

    let passagens0 = parseFloat(document.getElementById("passagens0").value) || 0;
    let passagens1 = parseFloat(document.getElementById("passagens1").value) || 0;

    // Rateio do auxílio
    let aux0 = brutoGeral > 0 ? (bruto0 / brutoGeral) * auxTotal : 0;
    let aux1 = brutoGeral > 0 ? (bruto1 / brutoGeral) * auxTotal : 0;

    let rateio0 = bruto0 - aux0 - passagens0;
    let rateio1 = bruto1 - aux1 - passagens1;

    let integral0 = parseInt(document.getElementById("integral0").value) || 0;
    let desc0 = parseInt(document.getElementById("desc0").value) || 0;

    let integral1 = parseInt(document.getElementById("integral1").value) || 0;
    let desc1 = parseInt(document.getElementById("desc1").value) || 0;

    let peso0 = integral0 + (desc0 * 0.5);
    let peso1 = integral1 + (desc1 * 0.5);

    let valorInt0 = peso0 > 0 ? rateio0 / peso0 : 0;
    let valorDesc0 = valorInt0 / 2;

    let valorInt1 = peso1 > 0 ? rateio1 / peso1 : 0;
    let valorDesc1 = valorInt1 / 2;

    // Atualizar tabela de resultado
    let tbody = document.querySelector("#tabelaResultado tbody");
    tbody.innerHTML = `
        <tr>
            <td><i class="fas fa-map-pin" style="color: #4361ee;"></i> 7 Lagoas</td>
            <td>R$ ${bruto0.toFixed(2)}</td>
            <td>R$ ${aux0.toFixed(2)}</td>
            <td>R$ ${passagens0.toFixed(2)}</td>
            <td class="destaque">R$ ${rateio0.toFixed(2)}</td>
            <td>R$ ${valorInt0.toFixed(2)}</td>
            <td>R$ ${valorDesc0.toFixed(2)}</td>
        </tr>
        <tr>
            <td><i class="fas fa-map-pin" style="color: #06d6a0;"></i> Curvelo</td>
            <td>R$ ${bruto1.toFixed(2)}</td>
            <td>R$ ${aux1.toFixed(2)}</td>
            <td>R$ ${passagens1.toFixed(2)}</td>
            <td class="destaque">R$ ${rateio1.toFixed(2)}</td>
            <td>R$ ${valorInt1.toFixed(2)}</td>
            <td>R$ ${valorDesc1.toFixed(2)}</td>
        </tr>
    `;

    // Mostrar preview do resultado
    document.getElementById('resultadoPreview').style.display = 'block';

    return {
        rotas: [
            { nome: '7 Lagoas', bruto: bruto0, auxilio: aux0, passagens: passagens0, rateio: rateio0, integral: valorInt0, meia: valorDesc0 },
            { nome: 'Curvelo', bruto: bruto1, auxilio: aux1, passagens: passagens1, rateio: rateio1, integral: valorInt1, meia: valorDesc1 }
        ],
        totalGeral: bruto

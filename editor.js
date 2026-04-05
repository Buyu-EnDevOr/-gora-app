// ==========================================
// 1. LÓGICA DO RIBBON E DROPDOWNS
// ==========================================
document.querySelectorAll('.tab-btn').forEach(btn => { 
    btn.addEventListener('click', function() { 
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); 
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active')); 
        this.classList.add('active'); 
        document.getElementById(this.getAttribute('data-target')).classList.add('active'); 
    }); 
});

document.addEventListener('click', function(event) { 
    const isDropdownBtn = event.target.closest('.dropdown-toggle'); 
    const isInsideMenu = event.target.closest('.dropdown-menu'); 
    
    if (isDropdownBtn) { 
        const container = isDropdownBtn.closest('.dropdown-container'); 
        const menu = container.querySelector('.dropdown-menu'); 
        
        document.querySelectorAll('.dropdown-menu').forEach(m => { 
            if(m !== menu) m.classList.remove('show'); 
        }); 
        
        if(menu.classList.contains('show')) { 
            menu.classList.remove('show'); 
        } else { 
            menu.classList.add('show'); 
            if(menu.style.display === 'flex') menu.style.display = 'flex'; 
        } 
    } else if (!isInsideMenu) { 
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
    } 
});

window.alertaVIP = function() { 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
    document.getElementById('modal-alerta').style.display = 'flex'; 
}

const btnTema = document.getElementById('btn-tema-quadro'); 
let isDark = localStorage.getItem('tema-agora') === 'escuro'; 
if(isDark) document.body.classList.add('dark-mode');

btnTema.addEventListener('click', () => { 
    isDark = !isDark; 
    if(isDark) { 
        document.body.classList.add('dark-mode'); 
        localStorage.setItem('tema-agora', 'escuro'); 
    } else { 
        document.body.classList.remove('dark-mode'); 
        localStorage.setItem('tema-agora', 'claro'); 
    } 
});

// Botão de Miniaturas (Gaveta)
const btnToggleMapa = document.getElementById('btn-toggle-mapa');
if (btnToggleMapa) {
    btnToggleMapa.addEventListener('click', () => {
        document.getElementById('gaveta-mapa').classList.toggle('fechada');
    });
}

// ==========================================
// 2. CONFIGURAÇÃO QUILL E FORMAS AVANÇADAS
// ==========================================
const Parchment = Quill.import('parchment'); 
const Font = Quill.import('formats/font'); 
Font.whitelist = ['roboto', 'open-sans', 'lato', 'montserrat', 'oswald', 'merriweather', 'nunito', 'poppins', 'dancing']; 
Quill.register(Font, true); 

const Size = Quill.import('attributors/style/size'); 
Size.whitelist = ['10px', '12px', '16px', '20px', '24px', '32px']; 
Quill.register(Size, true); 

const LineHeightStyle = new Parchment.Attributor.Style('lineHeight', 'line-height', { 
    scope: Parchment.Scope.BLOCK, 
    whitelist: ['1.0', '1.15', '1.5', '2.0', '2.5', '3.0'] 
}); 
Quill.register(LineHeightStyle, true);

const BlockEmbed = Quill.import('blots/block/embed');

class QuebraDePaginaBlot extends BlockEmbed { 
    static create(value) { 
        const node = super.create(); 
        node.setAttribute('contenteditable', 'false'); 
        return node; 
    } 
} 
QuebraDePaginaBlot.blotName = 'quebra-pagina'; 
QuebraDePaginaBlot.tagName = 'hr'; 
QuebraDePaginaBlot.className = 'quebra-de-pagina'; 
Quill.register(QuebraDePaginaBlot);

class TabelaBlot extends BlockEmbed { 
    static create(value) { 
        const node = super.create(); 
        if (value === true) {
            node.innerHTML = '<table class="tabela-agora" style="width: 100%; border-collapse: collapse; table-layout: fixed;"><tbody><tr><td><br></td><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td><td><br></td></tr></tbody></table>'; 
        } else {
            node.innerHTML = value;
        }
        node.setAttribute('contenteditable', 'true'); 
        return node; 
    } 
    static value(node) { return node.innerHTML; }
} 
TabelaBlot.blotName = 'tabela-basica'; 
TabelaBlot.tagName = 'div'; 
TabelaBlot.className = 'tabela-wrapper'; 
Quill.register(TabelaBlot);

class FormaBlot extends BlockEmbed { 
    static create(value) { 
        const node = super.create(); 
        node.setAttribute('contenteditable', 'false'); 
        
        if (typeof value === 'string' && value.includes('<div')) {
            node.innerHTML = value;
            return node;
        }
        
        if (value === 'retangulo') node.innerHTML = '<div class="forma-agora" style="width:150px; height:80px; border:2px solid #000;"><div contenteditable="true" style="width:100%; height:100%; padding:5px; word-break:break-word; white-space:pre-wrap; overflow:hidden;"></div></div>'; 
        if (value === 'circulo') node.innerHTML = '<div class="forma-agora" style="width:100px; height:100px; border-radius:50%; border:2px solid #000; text-align:center;"><div contenteditable="true" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; word-break:break-word; white-space:pre-wrap; overflow:hidden;"></div></div>'; 
        if (value === 'seta') node.innerHTML = '<div class="forma-agora" style="font-size:60px; color:#000; margin-top:-10px; border:none; resize:none;">➔</div>'; 
        
        if (value === 'piramide') {
            node.innerHTML = `
            <div class="forma-agora piramide-agora" style="display:flex; flex-direction:column; align-items:center; width:250px; height:200px; clip-path: polygon(50% 0%, 0% 100%, 100% 100%); background-color: #8e44ad; resize:both; overflow:hidden; padding-top:20px;">
                <div class="piramide-nivel" contenteditable="true" style="width: 30%; flex:1; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; border-bottom:2px solid black; color:white; font-weight:bold; word-break:break-word; white-space:pre-wrap; text-align:center;">Nível 1</div>
                <div class="piramide-nivel" contenteditable="true" style="width: 60%; flex:1; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; border-bottom:2px solid black; color:white; font-weight:bold; word-break:break-word; white-space:pre-wrap; text-align:center;">Nível 2</div>
                <div class="piramide-nivel" contenteditable="true" style="width: 90%; flex:1; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; color:white; font-weight:bold; word-break:break-word; white-space:pre-wrap; text-align:center;">Nível 3</div>
            </div>`;
        }
        
        if (value === 'grafico-barras') {
            node.innerHTML = `
            <div class="forma-agora" style="display:flex; align-items:flex-end; justify-content:space-around; gap:10px; height:150px; width:300px; border-left:3px solid #000; border-bottom:3px solid #000; padding:10px; background:transparent;">
                <div contenteditable="true" style="background:#3498db; flex:1; height:40%; text-align:center; color:white; font-size:12px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; word-break:break-word; white-space:pre-wrap; overflow:hidden;">40%</div>
                <div contenteditable="true" style="background:#e74c3c; flex:1; height:70%; text-align:center; color:white; font-size:12px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; word-break:break-word; white-space:pre-wrap; overflow:hidden;">70%</div>
                <div contenteditable="true" style="background:#2ecc71; flex:1; height:100%; text-align:center; color:white; font-size:12px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; word-break:break-word; white-space:pre-wrap; overflow:hidden;">100%</div>
            </div>`;
        }

        return node; 
    } 
    static value(node) { return node.innerHTML; }
} 
FormaBlot.blotName = 'forma-visual'; 
FormaBlot.tagName = 'span'; 
Quill.register(FormaBlot);

window.quill = new Quill('#editor-container', { 
    theme: 'snow', 
    placeholder: 'A tela está em branco...', 
    modules: { 
        toolbar: false, 
        history: { delay: 1000, maxStack: 500, userOnly: true }
    } 
}); 
document.querySelector('.ql-editor').setAttribute('spellcheck', 'true');

// ==========================================
// 3. FERRAMENTAS DO EDITOR E INSERÇÃO
// ==========================================
window.aplicarFormato = function(formato, valor = null) { 
    if(window.meuCargo === 'leitor') return; 

    // Lida com Recuo (Indentação) matematicamente
    if (formato === 'indent') {
        const formatoAtual = quill.getFormat()[formato] || 0;
        if (valor === '+1') {
            quill.format('indent', formatoAtual + 1);
        } else if (valor === '-1') {
            quill.format('indent', formatoAtual - 1 < 0 ? 0 : formatoAtual - 1);
        }
        return;
    }

    const formatoAtual = quill.getFormat()[formato]; 
    if(valor === null) { quill.format(formato, !formatoAtual); } 
    else if (valor === false) { quill.removeFormat(quill.getSelection().index, quill.getSelection().length); } 
    else { quill.format(formato, formatoAtual === valor ? false : valor); } 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

window.inserirTexto = function(texto) { 
    if(window.meuCargo === 'leitor') return; 
    const range = quill.getSelection(true); 
    quill.insertText(range.index, texto, Quill.sources.USER); 
    quill.setSelection(range.index + texto.length, Quill.sources.SILENT); 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
};

window.limparFormatacao = function() { 
    if(window.meuCargo === 'leitor') return; 
    const range = quill.getSelection(); 
    if(range) quill.removeFormat(range.index, range.length); 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

window.colarTextoPuro = async function() { 
    try { 
        const text = await navigator.clipboard.readText(); 
        const range = quill.getSelection(true); 
        quill.insertText(range.index, text, Quill.sources.USER); 
    } catch (err) { 
        alert("Bloqueado pelo navegador. Use Ctrl+Shift+V."); 
    } 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

window.inserirQuebraDePagina = function() { 
    if(window.meuCargo === 'leitor') return; 
    const range = quill.getSelection(true); 
    if (range) { 
        quill.insertEmbed(range.index, 'quebra-pagina', true, Quill.sources.USER); 
        quill.setSelection(range.index + 1, Quill.sources.SILENT); 
        if(window.salvarNaNuvemManual) window.salvarNaNuvemManual(); 
    } 
}

window.inserirTabelaBasica = function() { 
    if(window.meuCargo === 'leitor') return; 
    const range = quill.getSelection(true); 
    if (range) { 
        quill.insertEmbed(range.index, 'tabela-basica', true, Quill.sources.USER); 
        quill.setSelection(range.index + 1, Quill.sources.SILENT); 
        if(window.salvarNaNuvemManual) window.salvarNaNuvemManual(); 
    } 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

window.inserirFormaVisivel = function(tipoForma) { 
    if(window.meuCargo === 'leitor') return; 
    const range = quill.getSelection(true); 
    if (range) { 
        quill.insertEmbed(range.index, 'forma-visual', tipoForma, Quill.sources.USER); 
        quill.setSelection(range.index + 1, Quill.sources.SILENT); 
        if(window.salvarNaNuvemManual) window.salvarNaNuvemManual(); 
    } 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

// ==========================================
// 4. MENUS DE CONTEXTO (TABELAS E PIRÂMIDES)
// ==========================================
let celulaAtivaTabela = null;
let nivelAtivoPiramide = null;

const menuContextoTabela = document.getElementById('menu-contexto-tabela');
const menuContextoPiramide = document.getElementById('menu-contexto-piramide');

document.addEventListener('contextmenu', function(e) {
    const td = e.target.closest('td');
    const nivelPiramide = e.target.closest('.piramide-nivel');
    
    if (td) {
        e.preventDefault(); 
        celulaAtivaTabela = td;
        menuContextoTabela.style.left = e.clientX + 'px';
        menuContextoTabela.style.top = e.clientY + 'px';
        menuContextoTabela.style.display = 'block';
        if(menuContextoPiramide) menuContextoPiramide.style.display = 'none';
    } 
    else if (nivelPiramide) {
        e.preventDefault(); 
        nivelAtivoPiramide = nivelPiramide;
        if(menuContextoPiramide) {
            menuContextoPiramide.style.left = e.clientX + 'px';
            menuContextoPiramide.style.top = e.clientY + 'px';
            menuContextoPiramide.style.display = 'block';
        }
        menuContextoTabela.style.display = 'none';
    } 
    else {
        menuContextoTabela.style.display = 'none';
        if(menuContextoPiramide) menuContextoPiramide.style.display = 'none';
    }
});

window.modificarTabela = function(acao) {
    if(window.meuCargo === 'leitor' || !celulaAtivaTabela) return;

    const trAtiva = celulaAtivaTabela.parentElement;
    const tbodyAtivo = trAtiva.parentElement;
    const tabelaAtiva = tbodyAtivo.parentElement;
    const indexColuna = Array.from(trAtiva.children).indexOf(celulaAtivaTabela);

    if (acao === 'add-linha') {
        const novaLinha = document.createElement('tr');
        const numColunas = trAtiva.children.length;
        for(let i=0; i<numColunas; i++) { novaLinha.innerHTML += '<td><br></td>'; }
        if (trAtiva.nextSibling) { tbodyAtivo.insertBefore(novaLinha, trAtiva.nextSibling); } 
        else { tbodyAtivo.appendChild(novaLinha); }
    } 
    else if (acao === 'add-coluna') {
        Array.from(tbodyAtivo.children).forEach(tr => {
            const novaCelula = document.createElement('td');
            novaCelula.innerHTML = '<br>';
            if (tr.children[indexColuna].nextSibling) { tr.insertBefore(novaCelula, tr.children[indexColuna].nextSibling); } 
            else { tr.appendChild(novaCelula); }
        });
    }
    else if (acao === 'del-linha') {
        if(tbodyAtivo.children.length > 1) { trAtiva.remove(); } 
        else { tabelaAtiva.closest('.tabela-wrapper').remove(); }
    }
    else if (acao === 'del-coluna') {
        if(trAtiva.children.length > 1) {
            Array.from(tbodyAtivo.children).forEach(tr => { tr.children[indexColuna].remove(); });
        } else { tabelaAtiva.closest('.tabela-wrapper').remove(); }
    }
    else if (acao === 'del-tabela') {
        tabelaAtiva.closest('.tabela-wrapper').remove();
    }

    menuContextoTabela.style.display = 'none';
    if(window.salvarNaNuvemManual) window.salvarNaNuvemManual();
}

window.modificarPiramide = function(acao) {
    if(window.meuCargo === 'leitor' || !nivelAtivoPiramide) return;
    
    const piramide = nivelAtivoPiramide.parentElement;
    
    if(acao === 'add') {
        const novoNivel = document.createElement('div');
        novoNivel.className = 'piramide-nivel';
        novoNivel.setAttribute('contenteditable', 'true');
        novoNivel.innerHTML = 'Novo Nível';
        piramide.appendChild(novoNivel);
    } 
    else if(acao === 'rem') {
        if(piramide.children.length > 1) {
            nivelAtivoPiramide.remove();
        } else {
            piramide.closest('.forma-agora').remove();
            if(menuContextoPiramide) menuContextoPiramide.style.display = 'none';
            if(window.salvarNaNuvemManual) window.salvarNaNuvemManual();
            return;
        }
    }
    
    const totalNiveis = piramide.children.length;
    Array.from(piramide.children).forEach((child, index) => {
        const larguraIdeal = ((index + 1) / totalNiveis) * 90;
        child.style.cssText = `width: ${larguraIdeal}%; flex:1; display:flex; align-items:flex-end; justify-content:center; padding-bottom:5px; color:white; font-weight:bold; word-break:break-word; white-space:pre-wrap; text-align:center;`;
        
        if(index !== totalNiveis - 1) {
            child.style.borderBottom = '2px solid black';
        } else {
            child.style.borderBottom = 'none';
        }
    });

    if(menuContextoPiramide) menuContextoPiramide.style.display = 'none';
    if(window.salvarNaNuvemManual) window.salvarNaNuvemManual();
}

let formaSelecionadaAtiva = null;
document.addEventListener('click', function(e) {
    const clicouNaForma = e.target.closest('.forma-agora');

    if(clicouNaForma) { 
        formaSelecionadaAtiva = clicouNaForma; 
        document.querySelectorAll('.forma-agora').forEach(f => f.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'); 
        formaSelecionadaAtiva.style.boxShadow = '0 0 10px #8e44ad'; 
    } 
    else if (!e.target.closest('.dropdown-container') && !e.target.closest('.fundo-modal') && !e.target.closest('.menu-contexto')) { 
        if(formaSelecionadaAtiva) { 
            formaSelecionadaAtiva.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; 
            formaSelecionadaAtiva = null; 
        } 
    }

    if (!e.target.closest('.menu-contexto')) {
        menuContextoTabela.style.display = 'none';
        if(menuContextoPiramide) menuContextoPiramide.style.display = 'none';
    }
});

window.pintarForma = function(cor) { 
    if(formaSelecionadaAtiva) { 
        if(formaSelecionadaAtiva.classList.contains('piramide-agora')) {
            formaSelecionadaAtiva.style.backgroundColor = cor;
        } else {
            formaSelecionadaAtiva.style.backgroundColor = cor; 
            if(cor === 'transparent') { formaSelecionadaAtiva.style.borderColor = '#000'; } 
            else { formaSelecionadaAtiva.style.borderColor = 'rgba(0,0,0,0.5)'; } 
        }
        if(window.salvarNaNuvemManual) window.salvarNaNuvemManual(); 
    } else { 
        alert("Por favor, clique em uma forma geométrica ou pirâmide no texto primeiro para selecioná-la."); 
    } 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

// ==========================================
// 5. LAYOUT, REVISÃO E DESIGN
// ==========================================
window.mudarCorPagina = function(corHex) { 
    document.querySelector('.ql-editor').style.backgroundColor = corHex; 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

window.mudarBorda = function(tipo) { 
    const editor = document.querySelector('.ql-editor'); 
    editor.style.border = 'none'; 
    if(tipo === 'simples') editor.style.border = '1px solid #000'; 
    if(tipo === 'dupla') editor.style.border = '3px double #000'; 
    if(tipo === 'tracejada') editor.style.border = '1px dashed #000'; 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

window.mudarMargem = function(tipo) { 
    const editor = document.querySelector('.ql-editor'); 
    if(tipo === 'normal') editor.style.padding = '3cm 2cm 2cm 3cm'; 
    if(tipo === 'estreita') editor.style.padding = '1.27cm'; 
    if(tipo === 'larga') editor.style.padding = '3cm 4cm 2cm 4cm'; 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
};

window.mudarOrientacao = function(tipo) { 
    const container = document.getElementById('editor-container'); 
    if(tipo === 'paisagem') container.classList.add('orientacao-paisagem'); 
    else container.classList.remove('orientacao-paisagem'); 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
};

window.mudarLayout = function(tipo) { 
    if(tipo === 'web') document.body.classList.add('layout-web'); 
    else document.body.classList.remove('layout-web'); 
};

window.toggleRegua = function() { 
    document.getElementById('regua-h').classList.toggle('reguas-ocultas'); 
    document.getElementById('regua-v').classList.toggle('reguas-ocultas'); 
}

window.toggleOrtografia = function() { 
    const editor = document.querySelector('.ql-editor'); 
    const isSpellcheck = editor.getAttribute('spellcheck') === 'true'; 
    editor.setAttribute('spellcheck', !isSpellcheck); 
    alert("Corretor Ortográfico " + (!isSpellcheck ? "ATIVADO" : "DESATIVADO")); 
};


let rastreando = false;
window.toggleRastrear = function() { 
    rastreando = !rastreando; 
    const btn = document.getElementById('btn-rastrear'); 
    if(rastreando) { 
        btn.classList.add('active'); 
        alert("Modo Revisão ATIVADO. Novas digitações ficarão em vermelho e sublinhadas."); 
        quill.format('color', 'red'); 
        quill.format('underline', true); 
    } else { 
        btn.classList.remove('active'); 
        alert("Modo Revisão DESATIVADO."); 
        quill.format('color', false); 
        quill.format('underline', false); 
    } 
}

// ==========================================
// 6. MODAIS ÁGORA PRO E TRADUTOR VIP
// ==========================================
let savedRange = null;

window.fecharTodosModais = function() { 
    document.querySelectorAll('.fundo-modal').forEach(m => m.style.display = 'none'); 
    document.querySelectorAll('.painel-opcoes').forEach(p => p.style.display = 'none'); 
    document.querySelectorAll('.cartao-modelo').forEach(c => c.classList.remove('ativo')); 
}

// ---- MÁGICA DO TRADUTOR VIP ----
let textoTraduzidoCache = "";

window.abrirModalTraducaoVIP = function() {
    if(window.meuCargo === 'leitor') return;
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    
    savedRange = quill.getSelection(true);
    if (!savedRange || savedRange.length === 0) {
        alert("Por favor, selecione um trecho de texto no documento antes de abrir o tradutor!");
        return;
    }
    
    const textoSelecionado = quill.getText(savedRange.index, savedRange.length);
    document.getElementById('vip-texto-origem').value = textoSelecionado;
    document.getElementById('vip-resultado-box').innerHTML = '<em style="color: #94a3b8;">O resultado aparecerá aqui...</em>';
    document.getElementById('btn-aplicar-vip').style.display = 'none';
    document.getElementById('btn-executar-vip').innerHTML = 'Traduzir Agora';
    
    document.getElementById('modal-traducao-vip').style.display = 'flex';
}

window.executarTraducaoVIP = async function() {
    const texto = document.getElementById('vip-texto-origem').value;
    const origem = document.getElementById('vip-lang-origem').value;
    const destino = document.getElementById('vip-lang-destino').value;
    const btn = document.getElementById('btn-executar-vip');
    const box = document.getElementById('vip-resultado-box');

    if (!texto) return;

    btn.innerHTML = '<span class="material-symbols-outlined spin-anim" style="font-size: 16px;">sync</span> Traduzindo...';
    box.innerHTML = '<div style="display:flex; align-items:center; gap:5px; color:#8e44ad;"><span class="material-symbols-outlined spin-anim">autorenew</span> Conectando ao Ágora AI...</div>';

    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=${origem}|${destino}`);
        const data = await response.json();
        
        if (data.responseData && data.responseData.translatedText) {
            textoTraduzidoCache = data.responseData.translatedText;
            box.innerHTML = textoTraduzidoCache;
            document.getElementById('btn-aplicar-vip').style.display = 'block';
            btn.innerHTML = 'Traduzir Novamente';
        } else {
            box.innerHTML = '<span style="color:#e74c3c;">Erro ao traduzir. Tente novamente mais tarde.</span>';
            btn.innerHTML = 'Traduzir Agora';
        }
    } catch (error) {
        box.innerHTML = '<span style="color:#e74c3c;">Erro de conexão com a API de tradução.</span>';
        btn.innerHTML = 'Traduzir Agora';
    }
}

window.aplicarTraducaoVIP = function() {
    if (savedRange && textoTraduzidoCache) {
        quill.deleteText(savedRange.index, savedRange.length, Quill.sources.USER);
        quill.insertText(savedRange.index, textoTraduzidoCache, Quill.sources.USER);
        
        document.getElementById('modal-traducao-vip').style.display = 'none';
        if(window.salvarNaNuvemManual) window.salvarNaNuvemManual();
    }
}

window.traduzirDocumento = function() { 
    const texto = encodeURIComponent(quill.getText().substring(0, 1500)); 
    window.open(`https://translate.google.com/?sl=auto&tl=en&text=${texto}&op=translate`, '_blank'); 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

// ---------------------------------

window.abrirModalLink = function() { 
    if(window.meuCargo === 'leitor') return; 
    savedRange = quill.getSelection(true); 
    document.getElementById('input-url-link').value = ''; 
    document.getElementById('modal-inserir-link').style.display = 'flex'; 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

window.confirmarInserirLink = function() { 
    const url = document.getElementById('input-url-link').value; 
    if (url && savedRange) { 
        quill.insertText(savedRange.index, url, 'link', url); 
        quill.setSelection(savedRange.index + url.length, Quill.sources.SILENT); 
        if(window.salvarNaNuvemManual) window.salvarNaNuvemManual(); 
    } 
    document.getElementById('modal-inserir-link').style.display = 'none'; 
}

window.abrirModalVideo = function() { 
    if(window.meuCargo === 'leitor') return; 
    savedRange = quill.getSelection(true); 
    document.getElementById('input-url-video').value = ''; 
    document.getElementById('modal-inserir-video').style.display = 'flex'; 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

window.confirmarInserirVideo = function() { 
    const url = document.getElementById('input-url-video').value; 
    if (url && savedRange) { 
        quill.insertEmbed(savedRange.index, 'video', url); 
        quill.insertText(savedRange.index + 1, '\nFonte: ', 'bold', true); 
        quill.insertText(savedRange.index + 8, url, 'link', url); 
        if(window.salvarNaNuvemManual) window.salvarNaNuvemManual(); 
    } 
    document.getElementById('modal-inserir-video').style.display = 'none'; 
}

window.abrirModalMarcaDagua = function() { 
    if(window.meuCargo === 'leitor') return; 
    document.getElementById('input-texto-marcadagua').value = ''; 
    document.getElementById('modal-inserir-marcadagua').style.display = 'flex'; 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
}

window.confirmarInserirMarcaDagua = function() { 
    const texto = document.getElementById('input-texto-marcadagua').value; 
    const editor = document.querySelector('.ql-editor'); 
    if(!texto || texto.trim() === '') { 
        editor.style.backgroundImage = 'none'; 
    } else { 
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40" font-family="Arial" font-weight="bold" fill="rgba(150,150,150,0.15)" transform="rotate(-45 200 200)">${texto}</text></svg>`; 
        const b64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg))); 
        editor.style.backgroundImage = `url('${b64}')`; 
        editor.style.backgroundRepeat = 'repeat'; 
    } 
    document.getElementById('modal-inserir-marcadagua').style.display = 'none'; 
}

window.abrirModalContagem = function() { 
    const texto = quill.getText().trim(); 
    const numCaracteres = texto.length; 
    const numPalavras = texto.split(/\s+/).filter(word => word.length > 0).length; 
    document.getElementById('stat-palavras').innerText = numPalavras; 
    document.getElementById('stat-caracteres').innerText = numCaracteres; 
    document.getElementById('modal-contagem').style.display = 'flex'; 
}

window.abrirModalLocalizar = function() { 
    document.getElementById('modal-localizar').style.display = 'flex'; 
}

window.executarSubstituicao = function() { 
    const busca = document.getElementById('input-busca').value; 
    const substituto = document.getElementById('input-substituto').value; 
    if(!busca) return; 
    
    const textoInteiro = quill.getText(); 
    let qtd = 0; 
    let startIndex = 0; 
    let index; 
    
    while ((index = textoInteiro.indexOf(busca, startIndex)) > -1) { 
        quill.deleteText(index, busca.length, Quill.sources.USER); 
        quill.insertText(index, substituto, Quill.sources.USER); 
        startIndex = index + substituto.length; 
        qtd++; 
    } 
    alert(`${qtd} substituição(ões) realizada(s).`); 
    document.getElementById('modal-localizar').style.display = 'none'; 
    if(window.salvarNaNuvemManual) window.salvarNaNuvemManual(); 
}

window.abrirModalMalaDireta = function() { 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
    document.getElementById('modal-maladireta').style.display = 'flex'; 
}

window.executarMalaDireta = function() { 
    const tag = document.getElementById('input-tag').value.trim(); 
    const valor = document.getElementById('input-valor').value; 
    if(!tag) return; 
    
    const tagCompleta = `{{${tag}}}`; 
    const textoInteiro = quill.getText(); 
    let qtd = 0; 
    let startIndex = 0; 
    let index; 
    
    while ((index = textoInteiro.indexOf(tagCompleta, startIndex)) > -1) { 
        quill.deleteText(index, tagCompleta.length, Quill.sources.USER); 
        quill.insertText(index, valor, Quill.sources.USER); 
        startIndex = index + valor.length; 
        qtd++; 
    } 
    alert(`Mala Direta aplicada: ${qtd} campo(s) preenchido(s).`); 
    document.getElementById('modal-maladireta').style.display = 'none'; 
    if(window.salvarNaNuvemManual) window.salvarNaNuvemManual(); 
}

// Assinatura
const canvas = document.getElementById('quadro-assinatura'); 
const ctx = canvas.getContext('2d'); 
let desenhando = false;

window.abrirModalAssinatura = function() { 
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show')); 
    document.getElementById('modal-assinatura').style.display = 'flex'; 
    window.limparAssinatura(); 
}

window.limparAssinatura = function() { 
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
}

canvas.addEventListener('mousedown', (e) => { 
    desenhando = true; 
    ctx.beginPath(); 
    ctx.moveTo(e.offsetX, e.offsetY); 
});

canvas.addEventListener('mousemove', (e) => { 
    if(desenhando) { 
        ctx.lineWidth = 2; 
        ctx.lineCap = "round"; 
        ctx.lineTo(e.offsetX, e.offsetY); 
        ctx.stroke(); 
    } 
});

canvas.addEventListener('mouseup', () => { desenhando = false; }); 
canvas.addEventListener('mouseleave', () => { desenhando = false; });

window.inserirAssinatura = function() { 
    const base64 = canvas.toDataURL('image/png'); 
    const range = quill.getSelection(true) || {index: quill.getLength()}; 
    quill.insertEmbed(range.index, 'image', base64, Quill.sources.USER); 
    quill.setSelection(range.index + 1, Quill.sources.SILENT); 
    document.getElementById('modal-assinatura').style.display = 'none'; 
    if(window.salvarNaNuvemManual) window.salvarNaNuvemManual(); 
}

// ==========================================
// 7. GERAÇÃO DOS QUADRINHOS DE PÁGINAS E SCROLL
// ==========================================
window.atualizarMiniaturasPaginas = function() { 
    const lista = document.getElementById('lista-miniaturas'); 
    const quebras = document.querySelectorAll('.quebra-de-pagina'); 
    const totalPaginas = quebras.length + 1; 
    let html = ''; 
    for(let i = 1; i <= totalPaginas; i++) { 
        html += `<div class="miniatura-pagina" onclick="rolarParaPagina(${i})">
                    <div class="miniatura-folha">
                        <span style="font-size: 10px; color: #cbd5e1; font-weight: bold;">Pág ${i}</span>
                    </div>
                    <span class="miniatura-numero">${i}</span>
                 </div>`; 
    } 
    lista.innerHTML = html; 
}

window.rolarParaPagina = function(numeroPagina) {
    const scrollContainer = document.querySelector('.container-editor-scroll');
    if (numeroPagina === 1) { 
        scrollContainer.scrollTo({ top: 0, behavior: 'auto' }); 
    } else {
        const quebras = document.querySelectorAll('.quebra-de-pagina'); 
        const quebraAlvo = quebras[numeroPagina - 2]; 
        if (quebraAlvo) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const alvoRect = quebraAlvo.getBoundingClientRect();
            const posicaoExata = (alvoRect.top - containerRect.top) + scrollContainer.scrollTop - 50; 
            scrollContainer.scrollTo({ top: posicaoExata, behavior: 'auto' });
        }
    }
    if(window.innerWidth <= 768) {
        document.getElementById('gaveta-mapa').classList.add('fechada');
    }
}

// ==========================================
// 8. GERADOR ACADÊMICO E MOLDES RÁPIDOS
// ==========================================
window.abrirPainelGenerico = function(elementoCard, idPaisnel) { 
    document.querySelectorAll('.painel-opcoes').forEach(p => p.style.display = 'none'); 
    document.querySelectorAll('.cartao-modelo').forEach(c => c.classList.remove('ativo')); 
    elementoCard.classList.add('ativo'); 
    document.getElementById(idPaisnel).style.display = 'flex'; 
}

window.aplicarTemplateDireto = async function(tipo) { 
    if(window.meuCargo === "leitor") return; 
    const t = { 
        'resumo': `<h2 style="text-align: center;">RESUMO ABNT</h2><p>O resumo deve conter de 150 a 500 palavras, redigido em parágrafo único...</p><p><br></p><p><b>Palavras-chave:</b> Palavra 1. Palavra 2.</p>`, 
        'resenha': `<h2 style="text-align: center;">RESENHA CRÍTICA</h2><p><b>Referência da Obra:</b> SOBRENOME, Nome. Título do Livro. Cidade: Editora, Ano.</p><br><h3>1. ANÁLISE CRÍTICA</h3><p>Digite sua análise aqui...</p>`, 
        'relatorio': `<h2 style="text-align: center;">RELATÓRIO TÉCNICO DE ATIVIDADES</h2><br><h3>1. INTRODUÇÃO</h3><p>Contexto do relatório...</p><h3>2. MÉTODOS</h3><p>Como foi feito...</p>`,
        'envelope': `<div style="border: 2px solid #000; padding: 40px; width: 600px; margin: 0 auto; border-radius: 8px;"><h3>DESTINATÁRIO:</h3><p>Nome: {{NOME_DESTINATARIO}}</p><p>Endereço: {{ENDERECO_DESTINATARIO}}</p><br><br><h4>REMETENTE:</h4><p>{{NOME_REMETENTE}}</p></div><p><br></p>`,
        'etiqueta': `<table style="width:100%; border-collapse: collapse;"><tr><td style="border: 1px dashed #ccc; padding: 20px; text-align: center;"><b>{{NOME}}</b><br>{{ENDERECO}}</td><td style="border: 1px dashed #ccc; padding: 20px; text-align: center;"><b>{{NOME}}</b><br>{{ENDERECO}}</td></tr></table><p><br></p>`
    }; 
    if(confirm("Substituir o texto por este molde?")) { 
        window.isAtualizandoPelaNuvem = true; 
        quill.clipboard.dangerouslyPasteHTML(t[tipo] || "<h2>Molde</h2>"); 
        if(window.salvarNaNuvemManual) await window.salvarNaNuvemManual(); 
        window.fecharTodosModais(); 
        window.atualizarMiniaturasPaginas(); 
        setTimeout(() => window.isAtualizandoPelaNuvem = false, 500); 
    } 
}

window.gerarDocumentoComplexo = async function(tipo) {
    if(window.meuCargo === "leitor") return; 
    if(!confirm("Isto apagará o texto atual para gerar as múltiplas páginas nas normas. Continuar?")) return;
    
    let htmlDoc = ""; 
    const qp = `<hr class="quebra-de-pagina" contenteditable="false">`;
    
    if(tipo === 'tcc') {
        if(document.getElementById('tcc-capa').checked) { 
            htmlDoc += `<h2 class="ql-align-center">NOME DA UNIVERSIDADE / INSTITUIÇÃO<br>NOME DA FACULDADE OU DEPARTAMENTO<br>NOME DO CURSO</h2><p><br></p><p><br></p><p><br></p><h2 class="ql-align-center">NOME COMPLETO DO ALUNO</h2><p><br></p><p><br></p><p><br></p><p><br></p><h1 class="ql-align-center">TÍTULO DO TRABALHO: SUBTÍTULO (SE HOUVER)</h1><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><h3 class="ql-align-center">CIDADE - UF<br>ANO DE ENTREGA</h3>${qp}`; 
            htmlDoc += `<h2 class="ql-align-center">NOME COMPLETO DO ALUNO</h2><p><br></p><p><br></p><p><br></p><p><br></p><h1 class="ql-align-center">TÍTULO DO TRABALHO: SUBTÍTULO (SE HOUVER)</h1><p><br></p><p><br></p><p class="ql-align-right" style="margin-left: 40%; font-size: 10pt; line-height: 1.0;">Trabalho de Conclusão de Curso apresentado ao curso de [Nome do Curso] da [Nome da Instituição], como requisito parcial para a obtenção do título de Bacharel / Licenciado em [Área de Formação].<br><br>Orientador(a): Prof. / Profa. [Titulação e Nome do Orientador].</p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><h3 class="ql-align-center">CIDADE - UF<br>ANO DE ENTREGA</h3>${qp}`; 
        }
        if(document.getElementById('tcc-resumo').checked) { 
            htmlDoc += `<h2 class="ql-align-center">RESUMO</h2><p><br></p><p class="ql-align-justify">O resumo deve conter de 150 a 500 palavras, redigido em parágrafo único e sem recuo. Apresente o problema de pesquisa, os objetivos gerais, a metodologia empregada e as principais conclusions obtidas pela monografia.</p><p><br></p><p><strong>Palavras-chave: </strong> Palavra 1. Palavra 2. Palavra 3. Palavra 4.</p>${qp}`; 
        }
        if(document.getElementById('tcc-desenv').checked) { 
            htmlDoc += `<h1>1 INTRODUÇÃO</h1><p class="ql-align-justify" style="text-indent: 1.25cm;">A introdução é o cartão de visita do seu TCC. Apresente o tema de forma clara, delimitando o problema de pesquisa (a pergunta que o seu trabalho quer responder). Em seguida, escreva a justificativa: por que esta pesquisa é importante para a sociedade ou para o meio acadêmico? Finalize o capítulo listando o Objetivo Geral e os Objetivos Específicos.</p><p><br></p>${qp}`; 
            htmlDoc += `<h1>2 FUNDAMENTAÇÃO TEÓRICA</h1><p class="ql-align-justify" style="text-indent: 1.25cm;">Este é o embasamento do seu trabalho. Quais autores, livros e artigos sustentam a sua pesquisa? Lembre-se das regras de citação. Citações curtas (até 3 linhas) ficam dentro do parágrafo, com aspas. Citações longas exigem um tratamento especial:</p><p class="ql-align-justify" style="margin-left: 4cm; font-size: 10pt; line-height: 1.0;">Recuo de 4cm da margem esquerda, tamanho 10 e espaçamento simples. O objetivo do Desenvolvimento é situar o leitor no contexto pesquisado, relacionando os teóricos com a dúvida que você está investigando (AUTOR, Ano, p. 10).</p><p><br></p>${qp}`; 
            htmlDoc += `<h1>3 METODOLOGIA</h1><p class="ql-align-justify" style="text-indent: 1.25cm;">Como você fez a pesquisa? Foi uma pesquisa bibliográfica, estudo de caso, ou pesquisa de campo? Descreva a natureza do estudo (qualitativa ou quantitativa), quem foram os participantes (se houver), e como os dados foram coletados e analisados.</p><p><br></p>${qp}`; 
            htmlDoc += `<h1>4 CONCLUSÃO</h1><p class="ql-align-justify" style="text-indent: 1.25cm;">Momento de fechar o trabalho. Responda claramente à pergunta problema formulada na introdução. Verifique se os objetivos propostos foram alcançados. Seja honesto e aponte as limitações da sua pesquisa, sugerindo novos caminhos para estudantes que quiserem continuar o seu estudo no futuro.</p>${qp}`; 
            htmlDoc += `<h2 class="ql-align-center">REFERÊNCIAS</h2><p><br></p><p>SOBRENOME, Nome do Autor. <strong>Título do Livro em Negrito</strong>: subtítulo sem negrito. Edição. Cidade: Editora, Ano.</p><p><br></p><p>SOBRENOME, Nome. Título do artigo científico. <strong>Nome da Revista em Negrito</strong>, Cidade, v. X, n. Y, p. inicial-final, Mês. Ano.</p>`; 
        }
    } else if(tipo === 'artigo') {
        htmlDoc += `<h1 class="ql-align-center">TÍTULO DO ARTIGO CIENTÍFICO: SUBTÍTULO SE HOUVER DEVE ESTAR SEPARADO POR DOIS PONTOS E CENTRALIZADO</h1><p class="ql-align-center" style="font-style: italic;">Title of the article in English (optional)</p><p><br></p><p class="ql-align-right" style="font-size: 10pt;">Nomes dos Autores 1<br>Nomes dos Autores 2<br>Nomes dos Autores 3</p><p><br></p><p><br></p><h2 class="ql-align-center">RESUMO</h2><p class="ql-align-justify" style="font-size: 10pt; line-height: 1.0;">Texto, com uma quantidade predeterminada de palavras, onde se expõe o objetivo do artigo, a metodologia utilizada para solucionar o problema e os resultados alcançados. não deve ultrapassar 250 palavras, constituído de uma sequência de frases concisas e objetivas em parágrafo único.</p><p><br></p><p style="font-size: 10pt;"><strong>Palavras-chave: </strong> São palavras características do tema que servem para indexar o artigo, até 5 palavras separadas por ponto final.</p><p><br></p><h2 class="ql-align-center">ABSTRACT</h2><p class="ql-align-justify" style="font-size: 10pt; line-height: 1.0;">Uma tradução ao Inglês do resumo feito acima.</p><p><br></p><p style="font-size: 10pt;"><strong>Keywords: </strong> Tradução das palavras-chave.</p>${qp}`; 
        htmlDoc += `<h1>1. INTRODUÇÃO</h1><p class="ql-align-justify" style="text-indent: 1.25cm;">Parte inicial do artigo, deve conter a delimitação do assunto e os objetivos da pesquisa. Segundo a NBR 14724, o texto deve ser digitado no anverso da folha, utilizando-se papel formato A4, fonte tamanho 12 e espaçamento 1,5. O objetivo da Introdução é situar o leitor no contexto do tema pesquisado, oferecendo uma visão global do estudo realizado, esclarecendo as delimitações e as justificativas para em seguida apontar as questões de pesquisa. Em suma: apresenta e delimita a dúvida investigada (o quê), os objetivos (para que serviu o estudo) e a metodologia utilizada (como).</p><p><br></p>${qp}`; 
        if(document.getElementById('art-20pag').checked) { 
            htmlDoc += `<h1>2. DESENVOLVIMENTO E FUNDAMENTAÇÃO</h1><p class="ql-align-justify" style="text-indent: 1.25cm;">Parte mais importante do artigo, deve conter a exposição do assunto tratado. Nesta parte, o autor deve fazer uma exposição e uma discussão das teorias que foram utilizadas para entender e esclarecer o problema, apresentando-as e relacionando-as com a dúvida investigada. As citações curtas (até três linhas) diretas são incluídas no texto destacadas entre "aspas", precedidas ou sucedidas da indicação de autoria (CHIAVENATO, 2000, p. 310).</p><p><br></p>${qp}`; 
            for(let i=3; i<=15; i++) { 
                htmlDoc += `<h2>2.${i-1} Subtítulo de Desenvolvimento</h2><p class="ql-align-justify" style="text-indent: 1.25cm;">Página destinada ao desenvolvimento dos argumentos explicativos ou demonstrativos da pesquisa.</p><p><br></p>${qp}`; 
            } 
        } else { 
            htmlDoc += `<h1>2. DESENVOLVIMENTO</h1><p class="ql-align-justify" style="text-indent: 1.25cm;">Parte mais importante do artigo. O corpo do artigo pode ser dividido em itens necessários. É importante expor os argumentos onde o autor demonstra ter conhecimento da literatura básica.</p><p class="ql-align-justify" style="margin-left: 4cm; font-size: 10pt; line-height: 1.0;">As citações longas (mais de três linhas) devem ser transcritas em bloco separado do texto, com recuo esquerdo de 4 cm a partir da margem, justificado, com a mesma fonte do texto, em tamanho 10 e espaçamento simples (SOBRENOME, Ano, p. XX).</p><p><br></p>${qp}`; 
        } 
        htmlDoc += `<h1>3. CONSIDERAÇÕES FINAIS</h1><p class="ql-align-justify" style="text-indent: 1.25cm;">Parte em que se apresenta as conclusões correspondentes aos objetivos e hipóteses propostos. Após a análise e discussões dos resultados, são apresentadas as conclusões e as descobertas do texto, evidenciando com clareza as deduções extraídas. A conclusão é um fechamento do trabalho estudado, respondendo às hipóteses enunciadas na Introdução, onde não se permite que nesta seção sejam incluídos dados novos.</p>${qp}`; 
        htmlDoc += `<h1 class="ql-align-center">REFERÊNCIAS</h1><p>Todo documento utilizado e citado no trabalho deve constar na lista de referências.</p><p><br></p><p>SOBRENOME, Nome. Título do livro: subtítulo (se houver). Número da edição. Local/Cidade: Editora, Ano.</p><p><br></p><p>SOBRENOME DO AUTOR, Nome. Título do texto. In.: Nome da revista ou site em que o texto se encontra. Data da Publicação. Disponível em: &lt;website visitado&gt;. Acesso em: dia, mês abreviado, ano.</p>`;
    } else if(tipo === 'pesquisa') {
        htmlDoc += `<h2 class="ql-align-center">PROJETO DE PESQUISA ACADÊMICA</h2><p><br></p><h1>1. TEMA E PROBLEMA DE PESQUISA</h1><p class="ql-align-justify" style="text-indent: 1.25cm;"><strong>Tema:</strong> A grande área de estudo onde seu projeto se encaixa.</p><p class="ql-align-justify" style="text-indent: 1.25cm;"><strong>Problema:</strong> Qual a dúvida exata que seu trabalho quer resolver? Formule na estrutura de uma pergunta clara e objetiva.</p><p><br></p>${qp}`; 
        htmlDoc += `<h1>2. JUSTIFICATIVA E HIPÓTESE</h1><p class="ql-align-justify" style="text-indent: 1.25cm;">Venda o seu projeto. Explique para a banca examinadora o porquê desta pesquisa precisar ser feita. Que lacuna ela preenche? Apresente também a <strong>Hipótese</strong>: qual a resposta provisória que você acredita que irá confirmar ao fim da pesquisa?</p><p><br></p>${qp}`; 
        htmlDoc += `<h1>3. OBJETIVOS</h1><p class="ql-align-justify" style="text-indent: 1.25cm;"><strong>Objetivo Geral:</strong> (Use verbos no infinitivo: Analisar, Compreender, Desenvolver...).</p><p class="ql-align-justify" style="text-indent: 1.25cm;"><strong>Objetivos Específicos:</strong><br>- Levantar dados teóricos sobre X;<br>- Aplicar questionário com Y;<br>- Comparar os resultados de X e Y.</p><p><br></p>${qp}`; 
        htmlDoc += `<h1>4. METODOLOGIA E CRONOGRAMA DE EXECUÇÃO</h1><p class="ql-align-justify" style="text-indent: 1.25cm;">Defina o roteiro. Onde a pesquisa será feita? Haverá coleta de dados de campo? Apresente também as etapas em formato de cronograma (Ex: Mês 1 - Revisão Teórica; Mês 2 - Aplicação de Entrevistas; Mês 3 - Análise de Dados; Mês 4 - Entrega do Texto Final).</p>`;
    }
    
    window.isAtualizandoPelaNuvem = true; 
    quill.clipboard.dangerouslyPasteHTML(htmlDoc); 
    if(window.salvarNaNuvemManual) await window.salvarNaNuvemManual(); 
    window.atualizarMiniaturasPaginas(); 
    window.fecharTodosModais(); 
    setTimeout(() => window.isAtualizandoPelaNuvem = false, 500);
}
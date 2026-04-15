import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, updateDoc, collection, addDoc, query, orderBy, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DROPDOWNS DO TOPO
document.querySelectorAll('.dropdown-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = btn.parentElement;
        document.querySelectorAll('.dropdown').forEach(d => { if (d !== parent) d.classList.remove('aberto'); });
        parent.classList.toggle('aberto');
    });
});
document.getElementById('menu-estilo').querySelector('.dropdown-content').addEventListener('click', (e) => { e.stopPropagation(); });
document.addEventListener('click', () => { document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('aberto')); });

const firebaseConfig = { apiKey: "AIzaSyCrO7jKe3ja8XJWeNTfTpv4wwEWwzzcYzo", authDomain: "agora-ea1be.firebaseapp.com", projectId: "agora-ea1be", storageBucket: "agora-ea1be.firebasestorage.app", messagingSenderId: "801313514193", appId: "1:801313514193:web:99621b133ed4ca80e89bf0" };
const app = initializeApp(firebaseConfig); const db = getFirestore(app); const auth = getAuth(app);

if(localStorage.getItem('tema-agora') === 'escuro') document.body.classList.add('dark-mode');

const idProjeto = new URLSearchParams(window.location.search).get('id');
let meuNome = "Anônimo", meuEmail = "", minhaFoto = "", meuCargo = "leitor";
let arrayDeSlides = [], indiceSlideAtivo = 0;
let historyStack = [], historyIndex = -1, isHistoryAction = false, isAtualizandoPelaNuvem = false, primeiraCarga = true;
let precisaAtualizarThumb = false;
let bloqueioSincronizacao = false; 

const containerCanvas = document.getElementById('container-canvas');
const canvas = new fabric.Canvas('canvas-slide', { backgroundColor: 'white', selection: true, preserveObjectStacking: true, width: containerCanvas.clientWidth, height: containerCanvas.clientHeight });
fabric.Object.prototype.set({ transparentCorners: false, cornerColor: '#ffffff', cornerStrokeColor: '#8e44ad', borderColor: '#8e44ad', cornerSize: 12, padding: 8, cornerStyle: 'circle', borderDashArray: [4, 4] });
canvas.hoverCursor = 'pointer';

window.addEventListener('resize', () => { canvas.setWidth(containerCanvas.clientWidth); canvas.setHeight(containerCanvas.clientHeight); canvas.renderAll(); });

// ==========================================
// NOVO: SISTEMA DE OPACIDADE E CORES RGBA
// ==========================================
function hexToRgba(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Injeta o Slider de Opacidade no Menu de Estilos via JS
window.addEventListener('DOMContentLoaded', () => {
    const menuEstilos = document.getElementById('menu-estilo').querySelector('.dropdown-content');
    const divisor = document.createElement('div');
    divisor.className = 'dropdown-divisor';
    
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'estilo-linha';
    sliderContainer.innerHTML = `
        <span style="display:flex; align-items:center; gap:5px;"><span class="material-symbols-outlined" style="font-size:16px;">opacity</span> Opacidade (Vidro)</span>
        <input type="range" id="opacidade-forma" min="0.1" max="1" step="0.1" value="1" style="width: 80px; accent-color: #8e44ad;">
    `;
    
    // Insere o slider logo abaixo das cores de preenchimento e borda
    menuEstilos.insertBefore(sliderContainer, menuEstilos.children[2]);
    menuEstilos.insertBefore(divisor, menuEstilos.children[3]);

    document.getElementById('opacidade-forma').addEventListener('input', (e) => {
        const obj = canvas.getActiveObject();
        if(obj) {
            const hexCor = document.getElementById('cor-preenchimento').value;
            obj.set('fill', hexToRgba(hexCor, e.target.value));
            canvas.renderAll();
            salvarNoFirebase();
        }
    });
});

// ==========================================
// NOVO: MENU DE CONTEXTO (BOTÃO DIREITO) & VIP
// ==========================================
const ctxMenu = document.createElement('div');
ctxMenu.id = 'context-menu-agora';
ctxMenu.style.cssText = 'position:fixed; display:none; background:white; border:1px solid #e2e8f0; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); border-radius:8px; z-index:9999; min-width:180px; flex-direction:column; overflow:hidden; font-family:Arial; font-size:14px;';
document.body.appendChild(ctxMenu);

document.getElementById('container-canvas').addEventListener('contextmenu', e => {
    e.preventDefault(); // Bloqueia o menu feio do Chrome
});

canvas.on('mouse:down', function(opt) {
    if (opt.button === 3) { // 3 = Botão Direito
        if(meuCargo === "leitor") return;
        
        const target = opt.target;
        if(target) { canvas.setActiveObject(target); } // Seleciona o objeto que foi clicado

        // Monta os botões. O botão VIP só aparece se for um texto!
        ctxMenu.innerHTML = `
            ${target ? `<div class="ctx-item" onclick="document.getElementById('btn-copy').click();" style="padding:12px 15px; cursor:pointer; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; gap:10px; color:#2c3e50;"><span class="material-symbols-outlined" style="font-size:18px;">content_copy</span> Copiar</div>` : ''}
            <div class="ctx-item" onclick="document.getElementById('btn-paste').click();" style="padding:12px 15px; cursor:pointer; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; gap:10px; color:#2c3e50;"><span class="material-symbols-outlined" style="font-size:18px;">content_paste</span> Colar</div>
            ${target && target.type === 'i-text' ? `<div class="ctx-item" onclick="traduzirTextoVIP()" style="padding:12px 15px; cursor:pointer; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; gap:10px; color:#8e44ad; font-weight:bold; background:#fbf5ff;"><span class="material-symbols-outlined" style="font-size:18px;">g_translate</span> Traduzir IA (VIP)</div>` : ''}
            ${target ? `<div class="ctx-item" onclick="document.getElementById('ferramenta-excluir').click();" style="padding:12px 15px; cursor:pointer; display:flex; align-items:center; gap:10px; color:#e74c3c;"><span class="material-symbols-outlined" style="font-size:18px;">delete</span> Excluir Seleção</div>` : ''}
        `;
        
        ctxMenu.style.left = opt.e.clientX + 'px';
        ctxMenu.style.top = opt.e.clientY + 'px';
        ctxMenu.style.display = 'flex';
        
        // Efeito visual no hover (Feito no JS para não sujar seu CSS)
        ctxMenu.querySelectorAll('.ctx-item').forEach(item => {
            const bgOriginal = item.style.backgroundColor;
            item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f1f5f9');
            item.addEventListener('mouseleave', () => item.style.backgroundColor = bgOriginal || 'transparent');
        });
    } else {
        ctxMenu.style.display = 'none'; // Some se clicar com botão normal
    }
});

document.addEventListener('click', (e) => { if(!ctxMenu.contains(e.target)) ctxMenu.style.display = 'none'; });

// LIGAÇÃO VIP: Esta é a função que você deve chamar/modificar para abrir a tela de IA do grupo
window.traduzirTextoVIP = function() {
    const obj = canvas.getActiveObject();
    if(obj && obj.type === 'i-text') {
        const textoOriginal = obj.text;
        
        // LÓGICA TEMPORÁRIA: Substitua isso pela chamada do modal de IA que vocês já criaram
        const idioma = prompt(`👑 TRADUTOR VIP ATIVADO 👑\n\nTexto: "${textoOriginal.substring(0, 30)}..."\n\nPara qual idioma a IA deve traduzir?`);
        
        if(idioma) {
            alert(`Conectando à IA... Preparando para traduzir para ${idioma}.\n(Integre o código da sua outra tela de IA aqui!)`);
            // Exemplo de como aplicar a tradução no texto:
            // obj.set('text', textoTraduzidoDaSuaIA);
            // canvas.renderAll();
            // salvarNoFirebase();
        }
    }
    ctxMenu.style.display = 'none';
}


// ==========================================
// CONTROLE DAS GAVETAS LATERAIS
// ==========================================
const caixaModelos = document.getElementById('caixa-modelos');
const caixaElementos = document.getElementById('caixa-elementos');
const caixaChat = document.getElementById('caixa-do-chat'); 
const caixaArquivos = document.getElementById('caixa-arquivos');

function fecharTodasAsGavetasEsquerdas() {
    if(caixaModelos) caixaModelos.classList.remove('aberto');
    if(caixaElementos) caixaElementos.classList.remove('aberto');
}

if(document.getElementById('btn-toggle-modelos')) {
    document.getElementById('btn-toggle-modelos').addEventListener('click', () => {
        const estavaAberto = caixaModelos.classList.contains('aberto');
        fecharTodasAsGavetasEsquerdas();
        if(!estavaAberto) caixaModelos.classList.add('aberto');
        caixaChat.classList.remove('aberto'); caixaArquivos.classList.remove('aberto');
    });
    document.getElementById('btn-fechar-modelos').addEventListener('click', () => { caixaModelos.classList.remove('aberto'); });
}

if(document.getElementById('btn-toggle-elementos')) {
    document.getElementById('btn-toggle-elementos').addEventListener('click', () => {
        const estavaAberto = caixaElementos.classList.contains('aberto');
        fecharTodasAsGavetasEsquerdas();
        if(!estavaAberto) {
            caixaElementos.classList.add('aberto');
            carregarElementosBuscados(""); 
        }
        caixaChat.classList.remove('aberto'); caixaArquivos.classList.remove('aberto');
    });
    document.getElementById('btn-fechar-elementos').addEventListener('click', () => { caixaElementos.classList.remove('aberto'); });
}

document.getElementById('btn-reabrir-chat').addEventListener('click', () => { caixaChat.classList.add('aberto'); caixaArquivos.classList.remove('aberto'); fecharTodasAsGavetasEsquerdas(); });
document.getElementById('btn-minimizar-chat').addEventListener('click', () => { caixaChat.classList.remove('aberto'); });

document.getElementById('btn-abrir-arquivos').addEventListener('click', () => { caixaArquivos.classList.add('aberto'); caixaChat.classList.remove('aberto'); fecharTodasAsGavetasEsquerdas(); });
document.getElementById('btn-minimizar-arquivos').addEventListener('click', () => { caixaArquivos.classList.remove('aberto'); });

document.getElementById('btn-abrir-equipe').addEventListener('click', () => { document.getElementById('modal-equipe').style.display = 'flex'; });
document.getElementById('btn-sair-esc').addEventListener('click', () => { window.location.href = "dashboard.html"; });

// ==========================================
// ABA: ELEMENTOS (ARSENAL GEOMÉTRICO E BUSCA)
// ==========================================
window.carregarElementosBuscados = function(termo = "") {
    const grid = document.getElementById('grid-elementos-conteudo');
    if(!grid) return;
    grid.innerHTML = '';
    const termoLower = termo.toLowerCase();
    
    // Mostra as Formas Geométricas se a busca for vazia ou se pesquisar por "forma", "quadrado", etc.
    if(termo === "" || "forma quadrado circulo triangulo estrela linha seta poligono losango hexagono".includes(termoLower)) {
        grid.innerHTML += `
            <div class="separador-modelos"><span>Formas Principais</span></div>
            <div class="grid-modelos-canva" style="grid-template-columns: repeat(3, 1fr);">
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('rect')" title="Retângulo / Quadrado"><span class="material-symbols-outlined" style="font-size:30px; color:#2c3e50;">square</span></div>
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('circle')" title="Círculo / Elipse"><span class="material-symbols-outlined" style="font-size:30px; color:#2c3e50;">circle</span></div>
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('triangle')" title="Triângulo"><span class="material-symbols-outlined" style="font-size:30px; color:#2c3e50;">change_history</span></div>
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('star')" title="Estrela (Destaque)"><span class="material-symbols-outlined" style="font-size:30px; color:#2c3e50;">star</span></div>
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('linha')" title="Linha de Divisão"><span class="material-symbols-outlined" style="font-size:30px; color:#2c3e50;">horizontal_rule</span></div>
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('seta')" title="Seta de Fluxo"><span class="material-symbols-outlined" style="font-size:30px; color:#2c3e50;">arrow_right_alt</span></div>
            </div>
            
            <div class="separador-modelos"><span>Geometria Avançada</span></div>
            <div class="grid-modelos-canva" style="grid-template-columns: repeat(3, 1fr);">
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('pentagon')" title="Pentágono"><span class="material-symbols-outlined" style="font-size:30px; color:#2c3e50;">pentagon</span></div>
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('hexagon')" title="Hexágono"><span class="material-symbols-outlined" style="font-size:30px; color:#2c3e50;">hexagon</span></div>
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('diamond')" title="Losango"><span class="material-symbols-outlined" style="font-size:30px; color:#2c3e50;">diamond</span></div>
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('parallelogram')" title="Paralelogramo"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2c3e50" stroke-width="2"><polygon points="6 4 22 4 18 20 2 20"></polygon></svg></div>
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('plus')" title="Sinal de Mais"><span class="material-symbols-outlined" style="font-size:30px; color:#2c3e50;">add</span></div>
                <div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc;" onclick="inserirFormaNoSlide('minus')" title="Sinal de Menos"><span class="material-symbols-outlined" style="font-size:30px; color:#2c3e50;">remove</span></div>
            </div>
        `;
    }

    const bancoEmojis = [
        {tags: "ideia lampada cerebro", emoji: '💡'}, {tags: "livro estudo leitura", emoji: '📚'}, 
        {tags: "computador pc tecnologia", emoji: '💻'}, {tags: "grafico dados chart", emoji: '📈'}, 
        {tags: "alvo foco meta", emoji: '🎯'}, {tags: "fogo quente sucesso", emoji: '🔥'}, 
        {tags: "estrela destaque brilho", emoji: '🌟'}, {tags: "coracao amor", emoji: '❤️'}, 
        {tags: "like joinha aprovado", emoji: '👍'}, {tags: "check certo ok", emoji: '✅'}, 
        {tags: "aviso atencao erro", emoji: '⚠️'}, {tags: "foguete espaco startup", emoji: '🚀'}, 
        {tags: "planeta terra globo", emoji: '🌍'}, {tags: "atomo ciencia fisica", emoji: '⚛️'}, 
        {tags: "dna quimica biologia", emoji: '🧬'}, {tags: "festa celebracao", emoji: '🎉'}, 
        {tags: "trofeu premio vitoria", emoji: '🏆'}, {tags: "dinheiro moeda", emoji: '💰'}
    ];

    const emojisFiltrados = bancoEmojis.filter(e => termo === "" || e.tags.includes(termoLower));
    
    if(emojisFiltrados.length > 0) {
        let htmlStickers = `<div class="separador-modelos"><span>Stickers & Ícones</span></div><div class="grid-modelos-canva" style="grid-template-columns: repeat(4, 1fr);">`;
        emojisFiltrados.forEach(item => {
            htmlStickers += `<div class="modelo-item-canva" style="aspect-ratio:1; display:flex; justify-content:center; align-items:center; background:#f8fafc; font-size:30px; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" onclick="inserirTextoNoSlide('${item.emoji}')">${item.emoji}</div>`;
        });
        htmlStickers += `</div>`;
        grid.innerHTML += htmlStickers;
    }

    // Busca Dinâmica de Fotos
    let photoTerm = termo === "" ? "abstract,texture,clean" : termo.replace(/\s+/g, ',');
    let htmlFotos = `<div class="separador-modelos"><span>Fotografias em Alta</span></div><div class="grid-modelos-canva">`;
    for(let i=1; i<=6; i++) {
        let imgUrlMiniatura = `https://loremflickr.com/400/400/${encodeURIComponent(photoTerm)}?random=${i}`;
        let imgUrlAlta = `https://loremflickr.com/1000/1000/${encodeURIComponent(photoTerm)}?random=${i}`;
        
        htmlFotos += `
            <div class="modelo-item-canva" style="aspect-ratio:1; position:relative; overflow:hidden;" onclick="inserirImagemExternaNoSlide('${imgUrlAlta}')">
                <img src="${imgUrlMiniatura}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">
            </div>`;
    }
    htmlFotos += `</div>`;
    grid.innerHTML += htmlFotos;
}

window.inserirFormaNoSlide = function(tipo) {
    if(meuCargo === "leitor") return;
    desativarLapis();
    
    // Captura as cores exatas do painel de controle
    const hexFundo = document.getElementById('cor-preenchimento').value;
    const sliderOpacidade = document.getElementById('opacidade-forma');
    const opacity = sliderOpacidade ? sliderOpacidade.value : 1;
    const fill = hexToRgba(hexFundo, opacity); // MÁGICA DO VIDRO ESCURO AQUI
    
    const stroke = document.getElementById('cor-borda').value;
    let obj; 

    // Formas Primitivas
    if(tipo === 'rect') obj = new fabric.Rect({ left: 150, top: 150, fill: fill, stroke: stroke, strokeWidth: 3, width: 100, height: 100, rx: 5, ry: 5 });
    if(tipo === 'circle') obj = new fabric.Circle({ left: 150, top: 150, fill: fill, stroke: stroke, strokeWidth: 3, radius: 50 });
    if(tipo === 'triangle') obj = new fabric.Triangle({ left: 150, top: 150, fill: fill, stroke: stroke, strokeWidth: 3, width: 100, height: 100 });
    if(tipo === 'linha') obj = new fabric.Line([50, 50, 250, 50], { left: 150, top: 150, stroke: stroke, strokeWidth: 5 });
    if(tipo === 'seta') obj = new fabric.Path('M 0 0 L 150 0 M 150 0 L 135 -10 M 150 0 L 135 10', { left: 150, top: 150, fill: 'transparent', stroke: stroke, strokeWidth: 5 });

    // Geometria Avançada (Desenhada em Vetor Poligonal para não perder qualidade)
    if(tipo === 'star') {
        const starPoints = [{x: 50, y: 0}, {x: 63, y: 38}, {x: 100, y: 38}, {x: 69, y: 59}, {x: 82, y: 100}, {x: 50, y: 75}, {x: 18, y: 100}, {x: 31, y: 59}, {x: 0, y: 38}, {x: 37, y: 38}];
        obj = new fabric.Polygon(starPoints, { left: 150, top: 150, fill: fill, stroke: stroke, strokeWidth: 3, scaleX: 1.5, scaleY: 1.5 });
    }
    if(tipo === 'hexagon') {
        const hexPoints = [{x: 50, y: 0}, {x: 100, y: 25}, {x: 100, y: 75}, {x: 50, y: 100}, {x: 0, y: 75}, {x: 0, y: 25}];
        obj = new fabric.Polygon(hexPoints, { left: 150, top: 150, fill: fill, stroke: stroke, strokeWidth: 3 });
    }
    if(tipo === 'pentagon') {
        const pentPoints = [{x: 50, y: 0}, {x: 100, y: 38}, {x: 81, y: 100}, {x: 19, y: 100}, {x: 0, y: 38}];
        obj = new fabric.Polygon(pentPoints, { left: 150, top: 150, fill: fill, stroke: stroke, strokeWidth: 3 });
    }
    if(tipo === 'diamond') {
        const diaPoints = [{x: 50, y: 0}, {x: 100, y: 50}, {x: 50, y: 100}, {x: 0, y: 50}];
        obj = new fabric.Polygon(diaPoints, { left: 150, top: 150, fill: fill, stroke: stroke, strokeWidth: 3 });
    }
    if(tipo === 'parallelogram') {
        const paraPoints = [{x: 25, y: 0}, {x: 125, y: 0}, {x: 100, y: 100}, {x: 0, y: 100}];
        obj = new fabric.Polygon(paraPoints, { left: 150, top: 150, fill: fill, stroke: stroke, strokeWidth: 3 });
    }
    if(tipo === 'plus') {
        const plusPoints = [{x:35, y:0}, {x:65, y:0}, {x:65, y:35}, {x:100, y:35}, {x:100, y:65}, {x:65, y:65}, {x:65, y:100}, {x:35, y:100}, {x:35, y:65}, {x:0, y:65}, {x:0, y:35}, {x:35, y:35}];
        obj = new fabric.Polygon(plusPoints, { left: 150, top: 150, fill: fill, stroke: stroke, strokeWidth: 3 });
    }
    if(tipo === 'minus') {
        obj = new fabric.Rect({ left: 150, top: 150, fill: fill, stroke: stroke, strokeWidth: 3, width: 100, height: 30, rx: 5, ry: 5 });
    }

    if(obj) {
        canvas.add(obj); 
        canvas.setActiveObject(obj); 
        salvarNoFirebase();
    }
};

window.inserirTextoNoSlide = function(texto) {
    if(meuCargo === "leitor") return;
    desativarLapis();
    const obj = new fabric.IText(texto, { left: 150, top: 150, fontFamily: 'Arial', fill: document.getElementById('cor-borda').value });
    canvas.add(obj); canvas.setActiveObject(obj); salvarNoFirebase();
};

window.inserirImagemExternaNoSlide = function(url) {
    if(meuCargo === "leitor") return;
    desativarLapis();
    
    const grid = document.getElementById('grid-elementos-conteudo');
    const backupHtml = grid.innerHTML;
    grid.innerHTML = `<div style="text-align:center; padding:40px; color:#8e44ad;"><span class="material-symbols-outlined spin-anim" style="font-size: 30px;">sync</span><br><br>Baixando imagem em alta resolução...</div>`;

    fabric.Image.fromURL(url, function(img) { 
        if(img) {
            img.scaleToWidth(300); 
            img.set({ left: 100, top: 100 }); 
            canvas.add(img); 
            canvas.setActiveObject(img); 
            salvarNoFirebase(); 
        }
        grid.innerHTML = backupHtml; // Devolve a gaveta ao normal
    }, { crossOrigin: 'anonymous' });
};

if(document.getElementById('input-busca-elementos')) {
    let timeoutBusca = null;
    document.getElementById('input-busca-elementos').addEventListener('input', (e) => {
        clearTimeout(timeoutBusca);
        timeoutBusca = setTimeout(() => { carregarElementosBuscados(e.target.value.trim()); }, 600); 
    });
}

// ==========================================
// ABA: MODELOS E TEMPLATES
// ==========================================
const modeloMockJSON = '{"version":"5.3.0","objects":[{"type":"rect","left":0,"top":0,"width":1920,"height":1080,"fill":"#2c3e50"},{"type":"i-text","left":100,"top":200,"fill":"#ffffff","text":"APRESENTAÇÃO DE\\nHISTÓRIA","fontSize":80,"fontWeight":"bold"},{"type":"i-text","left":100,"top":400,"fill":"#f1c40f","text":"Substitua com seus dados","fontSize":30}],"background":"#2c3e50"}';
let modelosComunidadeDisponiveis = []; 
let modeloSelecionadoParaAplicar = null;

function gerarGrelhasModelos() {
    const gridIA = document.getElementById('grid-ia-modelos');
    if(!gridIA) return;
    const modelosIA = [
        { img: "https://placehold.co/400x225/8e44ad/FFF?text=TCC", titulo: "TCC Clean" },
        { img: "https://placehold.co/400x225/3498db/FFF?text=Apresentação", titulo: "Corporativo" },
        { img: "https://placehold.co/400x225/e74c3c/FFF?text=História", titulo: "História" },
        { img: "https://placehold.co/400x225/2ecc71/FFF?text=Biologia", titulo: "Natureza" },
        { img: "https://placehold.co/400x225/f1c40f/333?text=Design", titulo: "Criativo" },
        { img: "https://placehold.co/400x225/34495e/FFF?text=Business", titulo: "Negócios" }
    ];

    let htmlIA = '';
    modelosIA.forEach(m => {
        htmlIA += `<div class="modelo-item-canva" onclick="abrirPreviewMockup('${m.titulo}', '${m.img}')"><img src="${m.img}"><div class="play-icon"><span class="material-symbols-outlined" style="font-size:14px;">auto_awesome</span></div></div>`;
    });
    gridIA.innerHTML = htmlIA;

    onSnapshot(collection(db, "comunidade"), (snapshot) => {
        const gridComunidade = document.getElementById('grid-comunidade-modelos');
        if(!gridComunidade) return;
        gridComunidade.innerHTML = '';
        modelosComunidadeDisponiveis = [];

        snapshot.forEach(docSnap => {
            const pub = { id: docSnap.id, ...docSnap.data() };
            modelosComunidadeDisponiveis.push(pub);
            const fotoThumb = pub.thumbnail || `https://placehold.co/400x225/8e44ad/FFF?text=${encodeURIComponent(pub.titulo.substring(0, 10))}`;
            const div = document.createElement('div');
            div.className = 'modelo-item-canva';
            div.innerHTML = `<img src="${fotoThumb}"><div class="pro-icon"><span class="material-symbols-outlined" style="font-size:12px;">public</span></div>`;
            div.onclick = () => abrirPreviewReal(pub.id);
            gridComunidade.appendChild(div);
        });
        
        if(modelosComunidadeDisponiveis.length === 0) {
            gridComunidade.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #94a3b8; font-size: 13px;">Nenhum modelo publicado.</p>`;
        }
    });
}

window.abrirPreviewMockup = function(titulo, imgUrl) {
    document.getElementById('titulo-preview-modelo').innerText = titulo;
    document.getElementById('img-preview-modelo').src = imgUrl;
    modeloSelecionadoParaAplicar = modeloMockJSON;
    document.getElementById('modal-preview-modelo').style.display = 'flex';
}

window.abrirPreviewReal = function(idPub) {
    const pub = modelosComunidadeDisponiveis.find(m => m.id === idPub);
    if(pub) {
        document.getElementById('titulo-preview-modelo').innerText = pub.titulo;
        document.getElementById('img-preview-modelo').src = pub.thumbnail || `https://placehold.co/800x450/8e44ad/FFF?text=${encodeURIComponent(pub.titulo)}`;
        modeloSelecionadoParaAplicar = pub.dadosGraficos || pub.conteudo_html || modeloMockJSON; 
        document.getElementById('modal-preview-modelo').style.display = 'flex';
    }
}

if(document.getElementById('btn-aplicar-modelo-real')) {
    document.getElementById('btn-aplicar-modelo-real').addEventListener('click', () => {
        if(meuCargo === "leitor") return alert("Leitores não podem editar o arquivo.");
        if(!modeloSelecionadoParaAplicar) return;

        const apagarTudo = confirm("Como deseja aplicar este modelo?\n\n[OK] = APAGAR TUDO e substituir pelo modelo\n[Cancelar] = MANTER tudo e adicionar os elementos do modelo");

        bloqueioSincronizacao = true; 
        isAtualizandoPelaNuvem = true; 
        
        if (apagarTudo) {
            canvas.loadFromJSON(modeloSelecionadoParaAplicar, () => {
                canvas.renderAll(); 
                
                const canvasData = canvas.toJSON(['crossOrigin']);
                canvasData.objects = canvasData.objects.filter(o => !o.isGuide);
                arrayDeSlides[indiceSlideAtivo].dadosGraficos = JSON.stringify(canvasData);
                
                updateDoc(doc(db, "projetos", idProjeto), { slides: arrayDeSlides }).then(() => {
                    setTimeout(() => { bloqueioSincronizacao = false; isAtualizandoPelaNuvem = false; }, 500);
                });
                
                document.getElementById('modal-preview-modelo').style.display = 'none';
                if(caixaModelos) caixaModelos.classList.remove('aberto');
            });
        } else {
            const dadosModelo = JSON.parse(modeloSelecionadoParaAplicar);
            fabric.util.enlivenObjects(dadosModelo.objects, function(objetosMesclados) {
                objetosMesclados.forEach(function(obj) { canvas.add(obj); });
                
                if(dadosModelo.background && !canvas.backgroundImage) { canvas.backgroundColor = dadosModelo.background; }
                
                canvas.renderAll();
                const canvasData = canvas.toJSON(['crossOrigin']);
                canvasData.objects = canvasData.objects.filter(o => !o.isGuide);
                arrayDeSlides[indiceSlideAtivo].dadosGraficos = JSON.stringify(canvasData);
                
                updateDoc(doc(db, "projetos", idProjeto), { slides: arrayDeSlides }).then(() => {
                    setTimeout(() => { bloqueioSincronizacao = false; isAtualizandoPelaNuvem = false; }, 500);
                });
                
                document.getElementById('modal-preview-modelo').style.display = 'none';
                if(caixaModelos) caixaModelos.classList.remove('aberto');
            });
        }
    });
}

setTimeout(() => gerarGrelhasModelos(), 500);

// ==========================================
// CÉREBRO DA IA GERADORA DE SLIDES
// ==========================================
const btnGerarIA = document.querySelector('.btn-ia-gerar');
const inputIA = document.querySelector('#input-ia-modelos');
const gridIA = document.getElementById('grid-ia-modelos');

if(btnGerarIA && inputIA) {
    const novoBtnGerarIA = btnGerarIA.cloneNode(true);
    btnGerarIA.parentNode.replaceChild(novoBtnGerarIA, btnGerarIA);

    novoBtnGerarIA.addEventListener('click', () => {
        if(meuCargo === "leitor") return alert("Leitores não podem usar a IA neste documento.");
        
        const prompt = inputIA.value.trim();
        if(!prompt) return alert("Por favor, descreva o design ideal na caixa de texto!");
        
        novoBtnGerarIA.innerHTML = '<span class="material-symbols-outlined spin-anim">sync</span> Criando Ideias...';
        novoBtnGerarIA.disabled = true;
        
        gerarMosaicoComPollinations(prompt, novoBtnGerarIA);
    });
}

function gerarMosaicoComPollinations(promptTexto, botaoInterface) {
    const estilosIA = [
        { nome: "Moderno", sufixo: ", flat vector design, clean presentation background, beautiful UI, abstract minimal, no text" },
        { nome: "Aquarela", sufixo: ", soft watercolor painting, elegant presentation background, light pastel colors, no text" },
        { nome: "Corporativo", sufixo: ", modern geometric shapes, corporate presentation background, highly detailed, no text" },
        { nome: "Cinemático", sufixo: ", realistic, soft lighting, depth of field, premium presentation background, clean, no text" }
    ];

    if(gridIA) {
        gridIA.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #8e44ad; font-weight: bold; font-size: 13px; margin-bottom: 5px;">Selecione seu estilo favorito:</div>`;
    }

    let imagensCarregadas = 0;
    const termoBuscaSeguro = promptTexto.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, ',');

    estilosIA.forEach((estilo, index) => {
        const promptOtimizado = encodeURIComponent(promptTexto + estilo.sufixo);
        const semente = Math.floor(Math.random() * 9999) + index;
        
        const urlIA_Miniatura = `https://image.pollinations.ai/prompt/${promptOtimizado}?width=400&height=225&nologo=true&seed=${semente}`;
        const urlIA_AltaRes = `https://image.pollinations.ai/prompt/${promptOtimizado}?width=1920&height=1080&nologo=true&seed=${semente}`;

        const urlBusca_Miniatura = `https://loremflickr.com/400/225/${termoBuscaSeguro}?random=${semente}`;
        const urlBusca_AltaRes = `https://loremflickr.com/1920/1080/${termoBuscaSeguro}?random=${semente}`;

        const divCard = document.createElement('div');
        divCard.className = 'modelo-item-canva';
        divCard.style.position = 'relative';
        
        divCard.innerHTML = `
            <img src="" style="opacity: 0; transition: opacity 0.5s; width: 100%; height: 100%; object-fit: cover;">
            <div class="tag-estilo" style="position: absolute; top: 5px; left: 5px; background: rgba(142,68,173,0.8); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${estilo.nome}</div>
            <div class="loader-ia" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"><span class="material-symbols-outlined spin-anim" style="color: #8e44ad;">sync</span></div>
        `;
        
        if(gridIA) gridIA.appendChild(divCard);

        const imgElement = divCard.querySelector('img');
        const imgTeste = new Image();

        imgTeste.onload = () => {
            imgElement.src = urlIA_Miniatura;
            imgElement.style.opacity = '1';
            divCard.querySelector('.loader-ia').style.display = 'none';
            divCard.onclick = () => aplicarIACompletaNoSlide(promptTexto, urlIA_AltaRes);
            
            imagensCarregadas++;
            verificarConclusaoMosaico(imagensCarregadas, botaoInterface);
        };

        imgTeste.onerror = () => {
            console.warn("A IA foi bloqueada pela rede. Carregando imagem contextual alternativa.");
            imgElement.src = urlBusca_Miniatura;
            imgElement.onload = () => {
                imgElement.style.opacity = '1';
                divCard.querySelector('.loader-ia').style.display = 'none';
            };
            
            divCard.querySelector('.tag-estilo').innerText = estilo.nome + " (Foto)";
            divCard.querySelector('.tag-estilo').style.background = "#3498db"; 
            divCard.onclick = () => aplicarIACompletaNoSlide(promptTexto, urlBusca_AltaRes);
            
            imagensCarregadas++;
            verificarConclusaoMosaico(imagensCarregadas, botaoInterface);
        }
        
        imgTeste.src = urlIA_Miniatura;
    });
}

function verificarConclusaoMosaico(contagem, btn) {
    if(contagem === 4) {
        btn.innerHTML = '<span class="material-symbols-outlined" style="color:#f1c40f;">auto_awesome</span> Gerar Novamente';
        btn.disabled = false;
    }
}

function aplicarIACompletaNoSlide(promptOriginal, imageUrl) {
    const apagarTudo = confirm("Como deseja aplicar este design gerado?\n\n[OK] = APAGAR TUDO atual e usar como base do slide\n[Cancelar] = MANTER tudo e apenas inserir por trás do seu texto");

    bloqueioSincronizacao = true; 
    const sNuvem = document.getElementById('status-nuvem');
    if(sNuvem) sNuvem.innerText = "⏳ Montando Slide...";

    fabric.Image.fromURL(imageUrl, function(img) {
        if (!img) {
            alert("Erro ao aplicar a imagem final. A rede interrompeu a conexão.");
            bloqueioSincronizacao = false;
            if(sNuvem) sNuvem.innerText = "⚠️ Erro";
            return;
        }

        if (apagarTudo) {
            canvas.clear();
            canvas.backgroundColor = isQuadroEscuro ? '#1e1e1e' : '#ffffff';
        }

        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        img.set({ originX: 'center', originY: 'center', left: canvas.width / 2, top: canvas.height / 2, scaleX: scale, scaleY: scale });

        canvas.setBackgroundImage(img, () => {
            
            if (apagarTudo) {
                const tituloCaps = promptOriginal.toUpperCase();
                
                const fundoTexto = new fabric.Rect({
                    left: canvas.width / 2, top: canvas.height / 2,
                    originX: 'center', originY: 'center',
                    width: 800, height: 400,
                    fill: 'rgba(0, 0, 0, 0.6)', 
                    rx: 15, ry: 15
                });

                const textoTitulo = new fabric.IText(tituloCaps, {
                    left: canvas.width / 2, top: canvas.height / 2 - 100,
                    originX: 'center', originY: 'center',
                    fontFamily: 'Arial', fill: '#ffffff',
                    fontSize: 55, fontWeight: 'bold', textAlign: 'center'
                });

                const textoTopicos = new fabric.IText("• Digite aqui o seu primeiro tópico principal\n\n• Segundo ponto chave da apresentação\n\n• Conclusão ou dados relevantes", {
                    left: canvas.width / 2, top: canvas.height / 2 + 50,
                    originX: 'center', originY: 'center',
                    fontFamily: 'Arial', fill: '#ecf0f1',
                    fontSize: 24, lineHeight: 1.5, textAlign: 'left'
                });

                canvas.add(fundoTexto, textoTitulo, textoTopicos);
            }
            
            canvas.renderAll();
            salvarNoFirebase(); 
            precisaAtualizarThumb = true; 
            
            setTimeout(() => { bloqueioSincronizacao = false; }, 500); 
        });

        if(document.getElementById('caixa-modelos')) document.getElementById('caixa-modelos').classList.remove('aberto');
        
    }, { crossOrigin: 'anonymous' }); 
}

// ==========================================
// COPIAR, COLAR E FERRAMENTAS DE DESENHO
// ==========================================
let _clipboard = null;
function Copy() { if(!canvas.getActiveObject()) return; canvas.getActiveObject().clone(function(cloned) { _clipboard = cloned; }); document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('aberto')); }
function Paste() {
    if (!_clipboard) return;
    _clipboard.clone(function(clonedObj) {
        canvas.discardActiveObject(); clonedObj.set({ left: clonedObj.left + 15, top: clonedObj.top + 15, evented: true });
        if (clonedObj.type === 'activeSelection') { clonedObj.canvas = canvas; clonedObj.forEachObject(function(obj) { canvas.add(obj); }); clonedObj.setCoords(); } else { canvas.add(clonedObj); }
        _clipboard.top += 15; _clipboard.left += 15; canvas.setActiveObject(clonedObj); canvas.requestRenderAll(); salvarNoFirebase();
    });
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('aberto'));
}
document.getElementById('btn-copy').addEventListener('click', Copy); document.getElementById('btn-paste').addEventListener('click', Paste);

const trazerFrente = () => { const obj = canvas.getActiveObject(); if(obj) { canvas.bringToFront(obj); salvarNoFirebase(); }};
const enviarTras = () => { const obj = canvas.getActiveObject(); if(obj) { canvas.sendToBack(obj); salvarNoFirebase(); }};
document.getElementById('btn-trazer-frente').addEventListener('click', trazerFrente); document.getElementById('btn-enviar-tras').addEventListener('click', enviarTras);

// UPLOADS
document.getElementById('btn-fazer-upload').addEventListener('click', () => { 
    if(!idProjeto) return alert("Erro: ID não encontrado."); if(meuCargo === 'leitor') return alert("Leitores não podem enviar arquivos.");
    document.getElementById('input-upload-real').click(); 
});
document.getElementById('input-upload-real').addEventListener('change', function(e) {
    const file = e.target.files[0]; if (!file) return;
    const btnUpload = document.getElementById('btn-fazer-upload'); btnUpload.innerHTML = '<span class="material-symbols-outlined spin-anim">sync</span> A Carregar...';
    const reader = new FileReader();
    reader.onload = function(f) {
        const img = new Image();
        img.onload = async function() {
            const cvs = document.createElement('canvas'); const MAX_WIDTH = 800; let width = img.width; let height = img.height;
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            cvs.width = width; cvs.height = height; const ctx = cvs.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
            const base64Comprimido = cvs.toDataURL('image/jpeg', 0.7); 
            try { await addDoc(collection(db, "projetos", idProjeto, "galeria"), { url: base64Comprimido, hora: Date.now() }); btnUpload.innerHTML = '<span class="material-symbols-outlined">cloud_upload</span> Enviar Imagem'; } catch (error) { alert("Erro ao salvar imagem."); btnUpload.innerHTML = '<span class="material-symbols-outlined">cloud_upload</span> Enviar Imagem'; }
        }; img.src = f.target.result;
    }; reader.readAsDataURL(file); this.value = ''; 
});

// EXPORTADOR
document.getElementById('btn-exportar-modal').addEventListener('click', () => { document.getElementById('modal-exportar').style.display = 'flex'; });
document.getElementById('btn-baixar-png').addEventListener('click', () => { canvas.discardActiveObject(); canvas.renderAll(); const dataURL = canvas.toDataURL({ format: 'png', multiplier: 2 }); const link = document.createElement('a'); link.download = `Slide_${indiceSlideAtivo + 1}.png`; link.href = dataURL; document.body.appendChild(link); link.click(); document.body.removeChild(link); document.getElementById('modal-exportar').style.display = 'none'; });
document.getElementById('btn-baixar-pdf').addEventListener('click', async () => {
    const btnPdf = document.getElementById('btn-baixar-pdf'); const textoOriginal = btnPdf.innerHTML; btnPdf.innerHTML = "<div><strong>A Gerar PDF... Aguarde!</strong></div>";
    const pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] }); const slideQueEuEstava = indiceSlideAtivo;
    for(let i = 0; i < arrayDeSlides.length; i++) {
        if (i > 0) pdf.addPage([canvas.width, canvas.height], 'landscape'); 
        const jsonSlide = arrayDeSlides[i].dadosGraficos || '{"version":"5.3.0","objects":[],"background":"white"}';
        await new Promise((resolve) => { canvas.loadFromJSON(jsonSlide, () => { canvas.renderAll(); const imgData = canvas.toDataURL({ format: 'jpeg', quality: 1.0 }); pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height); resolve(); }); });
    }
    pdf.save(`Apresentacao_Agora.pdf`); trocarSlide(slideQueEuEstava); btnPdf.innerHTML = textoOriginal; document.getElementById('modal-exportar').style.display = 'none';
});

// GESTÃO DE SLIDES E FIREBASE LOGIC
const dockLista = document.getElementById('lista-de-miniaturas');
dockLista.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-excluir-slide')) { e.stopPropagation(); excluirSlide(parseInt(e.target.getAttribute('data-idx'))); return; }
    if (e.target.classList.contains('miniatura')) { trocarSlide(parseInt(e.target.getAttribute('data-idx'))); }
});

function desenharMiniaturas() {
    let htmlHTML = '';
    arrayDeSlides.forEach((slide, idx) => {
        let btnX = (meuCargo === "admin" || meuCargo === "editor") ? `<button class="btn-excluir-slide" data-idx="${idx}">X</button>` : "";
        let bgImage = slide.thumbnail ? `background-image: url(${slide.thumbnail});` : '';
        htmlHTML += `<div class="miniatura-container">${btnX}<div class="miniatura ${(idx === indiceSlideAtivo) ? 'ativa' : ''}" data-idx="${idx}" style="${bgImage}">Slide ${idx + 1}</div></div>`;
    });
    dockLista.innerHTML = htmlHTML;
}

window.tirarFotoDoSlide = function() {
    if(!arrayDeSlides[indiceSlideAtivo]) return;
    const fotoData = canvas.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.2 });
    arrayDeSlides[indiceSlideAtivo].thumbnail = fotoData;
    const thumbDiv = document.querySelector(`.miniatura[data-idx="${indiceSlideAtivo}"]`);
    if(thumbDiv) thumbDiv.style.backgroundImage = `url(${fotoData})`;
}

setInterval(() => {
    if (precisaAtualizarThumb && meuCargo !== "leitor" && !isAtualizandoPelaNuvem) {
        tirarFotoDoSlide(); updateDoc(doc(db, "projetos", idProjeto), { slides: arrayDeSlides }); precisaAtualizarThumb = false;
    }
}, 10000);

document.getElementById('btn-adicionar-slide').addEventListener('click', () => {
    if(meuCargo !== "leitor") { 
        tirarFotoDoSlide(); 
        const canvasData = canvas.toJSON(['crossOrigin']);
        canvasData.objects = canvasData.objects.filter(o => !o.isGuide);
        arrayDeSlides[indiceSlideAtivo].dadosGraficos = JSON.stringify(canvasData); 
    }
    arrayDeSlides.push({ id: Date.now().toString(), dadosGraficos: '{"version":"5.3.0","objects":[],"background":"white"}', thumbnail: '' });
    indiceSlideAtivo = arrayDeSlides.length - 1; updateDoc(doc(db, "projetos", idProjeto), { slides: arrayDeSlides }); carregarSlide(); desenharMiniaturas(); 
});

function trocarSlide(idx) { 
    if(meuCargo !== "leitor") { 
        tirarFotoDoSlide(); 
        const canvasData = canvas.toJSON(['crossOrigin']);
        canvasData.objects = canvasData.objects.filter(o => !o.isGuide);
        arrayDeSlides[indiceSlideAtivo].dadosGraficos = JSON.stringify(canvasData); 
    }
    indiceSlideAtivo = idx; updateDoc(doc(db, "projetos", idProjeto), { slides: arrayDeSlides }); carregarSlide(); desenharMiniaturas(); 
}

function excluirSlide(idx) {
    if(arrayDeSlides.length <= 1) { alert("Mínimo de 1 slide!"); return; }
    if(confirm("Apagar slide?")) { arrayDeSlides.splice(idx, 1); if(indiceSlideAtivo >= arrayDeSlides.length) indiceSlideAtivo = arrayDeSlides.length - 1; updateDoc(doc(db, "projetos", idProjeto), { slides: arrayDeSlides }); carregarSlide(); desenharMiniaturas(); }
}

function carregarSlide() { 
    if(!arrayDeSlides[indiceSlideAtivo]) return;
    isAtualizandoPelaNuvem = true; const dados = arrayDeSlides[indiceSlideAtivo].dadosGraficos || '{"version":"5.3.0","objects":[],"background":"white"}';
    historyStack = [dados]; historyIndex = 0; canvas.setViewportTransform([1,0,0,1,0,0]); canvas.setZoom(1);
    canvas.loadFromJSON(dados, () => { canvas.renderAll(); isAtualizandoPelaNuvem = false; }); 
}

window.isQuadroEscuro = false;
document.getElementById('btn-tema-quadro').addEventListener('click', () => { isQuadroEscuro = !isQuadroEscuro; canvas.backgroundColor = isQuadroEscuro ? '#1e1e1e' : '#ffffff'; document.getElementById('cor-borda').value = isQuadroEscuro ? '#ffffff' : '#2c3e50'; canvas.renderAll(); salvarNoFirebase(); document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('aberto')); });

window.salvarNoFirebase = function() {
    if(bloqueioSincronizacao || isAtualizandoPelaNuvem || meuCargo === "leitor" || isHistoryAction) return; 
    
    const sNuvem = document.getElementById('status-nuvem');
    if(sNuvem) sNuvem.innerText = "⏳ A Salvar...";
    
    const canvasData = canvas.toJSON(['crossOrigin']);
    canvasData.objects = canvasData.objects.filter(o => !o.isGuide);
    const json = JSON.stringify(canvasData);
    
    if(historyStack[historyIndex] !== json) { historyStack = historyStack.slice(0, historyIndex + 1); historyStack.push(json); historyIndex++; }
    arrayDeSlides[indiceSlideAtivo].dadosGraficos = json; precisaAtualizarThumb = true;
    updateDoc(doc(db, "projetos", idProjeto), { slides: arrayDeSlides }).then(() => { if(sNuvem) sNuvem.innerText = "☁️ Salvo"; }).catch(err => { if(sNuvem) sNuvem.innerText = "⚠️ Erro"; });
}

canvas.on('object:modified', salvarNoFirebase); 
canvas.on('object:added', (e) => { if(!bloqueioSincronizacao && !isAtualizandoPelaNuvem && !isHistoryAction && !e.target.isGuide) salvarNoFirebase(); }); 
canvas.on('object:removed', (e) => { if(!bloqueioSincronizacao && !isAtualizandoPelaNuvem && !isHistoryAction && !e.target.isGuide) salvarNoFirebase(); }); 
canvas.on('text:changed', salvarNoFirebase);

window.desativarLapis = () => { canvas.isDrawingMode = false; document.getElementById('ferramenta-desenho').classList.remove('ativo'); document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('aberto')); };

document.getElementById('ferramenta-texto').addEventListener('click', () => { desativarLapis(); const t = new fabric.IText('Texto', { left: 100, top: 100, fontFamily: 'Arial', fill: document.getElementById('cor-borda').value }); canvas.add(t); canvas.setActiveObject(t); });
document.getElementById('ferramenta-quadrado').addEventListener('click', () => { desativarLapis(); const r = new fabric.Rect({ left: 150, top: 150, fill: 'transparent', stroke: document.getElementById('cor-borda').value, strokeWidth: 3, width: 100, height: 100, rx: 5, ry: 5 }); canvas.add(r); canvas.setActiveObject(r); });
document.getElementById('ferramenta-circulo').addEventListener('click', () => { desativarLapis(); const c = new fabric.Circle({ left: 200, top: 150, fill: 'transparent', stroke: document.getElementById('cor-borda').value, strokeWidth: 3, radius: 50 }); canvas.add(c); canvas.setActiveObject(c); });
document.getElementById('ferramenta-triangulo').addEventListener('click', () => { desativarLapis(); const tr = new fabric.Triangle({ left: 250, top: 150, fill: 'transparent', stroke: document.getElementById('cor-borda').value, strokeWidth: 3, width: 100, height: 100 }); canvas.add(tr); canvas.setActiveObject(tr); });
document.getElementById('ferramenta-linha').addEventListener('click', () => { desativarLapis(); const l = new fabric.Line([50, 50, 200, 50], { left: 150, top: 150, stroke: document.getElementById('cor-borda').value, strokeWidth: 4 }); canvas.add(l); canvas.setActiveObject(l); });
document.getElementById('ferramenta-linha-pontilhada').addEventListener('click', () => { desativarLapis(); const l = new fabric.Line([50, 50, 200, 50], { left: 150, top: 150, stroke: document.getElementById('cor-borda').value, strokeWidth: 4, strokeDashArray: [10, 10] }); canvas.add(l); canvas.setActiveObject(l); });
document.getElementById('ferramenta-seta').addEventListener('click', () => { desativarLapis(); const seta = new fabric.Path('M 0 0 L 150 0 M 150 0 L 135 -10 M 150 0 L 135 10', { left: 150, top: 150, fill: 'transparent', stroke: document.getElementById('cor-borda').value, strokeWidth: 4 }); canvas.add(seta); canvas.setActiveObject(seta); });

document.getElementById('ferramenta-desenho').addEventListener('click', () => { canvas.isDrawingMode = !canvas.isDrawingMode; document.getElementById('ferramenta-desenho').classList.toggle('ativo', canvas.isDrawingMode); canvas.freeDrawingBrush.color = document.getElementById('cor-borda').value; canvas.freeDrawingBrush.width = 4; });
document.getElementById('btn-inserir-imagem').addEventListener('click', () => { desativarLapis(); document.getElementById('input-imagem-pc').click(); });
document.getElementById('input-imagem-pc').addEventListener('change', function(e) { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = function(f) { fabric.Image.fromURL(f.target.result, function(img) { img.scaleToWidth(300); img.set({ left: 100, top: 100 }); canvas.add(img); canvas.setActiveObject(img); salvarNoFirebase(); }); }; reader.readAsDataURL(file); } this.value = ''; });

document.getElementById('ferramenta-excluir').addEventListener('click', () => { const ativos = canvas.getActiveObjects(); if (ativos.length) { ativos.forEach(obj => canvas.remove(obj)); canvas.discardActiveObject(); salvarNoFirebase(); document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('aberto')); } });
document.getElementById('ferramenta-limpar-tudo').addEventListener('click', () => { if(confirm("Apagar todos os itens do slide?")){ canvas.clear(); canvas.backgroundColor = isQuadroEscuro ? '#1e1e1e' : '#ffffff'; salvarNoFirebase(); document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('aberto')); } });

document.getElementById('cor-preenchimento').addEventListener('change', (e) => { 
    const obj = canvas.getActiveObject(); 
    // Garante que se mudar a cor, mantém a opacidade escolhida no slider
    const opacidade = document.getElementById('opacidade-forma') ? document.getElementById('opacidade-forma').value : 1;
    const corRGBA = hexToRgba(e.target.value, opacidade);
    
    if(obj) { obj.set('fill', corRGBA); } else { canvas.backgroundColor = corRGBA; isQuadroEscuro = false; } 
    canvas.renderAll(); salvarNoFirebase(); 
});
document.getElementById('cor-borda').addEventListener('change', (e) => { const obj = canvas.getActiveObject(); if(obj) { obj.set('stroke', e.target.value); if(obj.type === 'i-text') obj.set('fill', e.target.value); } if(canvas.isDrawingMode) canvas.freeDrawingBrush.color = e.target.value; canvas.renderAll(); salvarNoFirebase(); });
document.getElementById('sel-fonte').addEventListener('change', (e) => { const obj = canvas.getActiveObject(); if(obj && obj.type === 'i-text') { obj.set('fontFamily', e.target.value); canvas.renderAll(); salvarNoFirebase(); } });
function formatarTexto(chave, vAtivo, vInativo) { const obj = canvas.getActiveObject(); if(obj && obj.type === 'i-text') { obj.set(chave, obj.get(chave) === vAtivo ? vInativo : vAtivo); canvas.renderAll(); salvarNoFirebase(); } }
document.getElementById('btn-bold').addEventListener('click', () => formatarTexto('fontWeight', 'bold', 'normal')); document.getElementById('btn-italic').addEventListener('click', () => formatarTexto('fontStyle', 'italic', 'normal')); document.getElementById('btn-align-left').addEventListener('click', () => { const obj = canvas.getActiveObject(); if(obj && obj.type === 'i-text') { obj.set('textAlign', 'left'); canvas.renderAll(); salvarNoFirebase(); } }); document.getElementById('btn-align-center').addEventListener('click', () => { const obj = canvas.getActiveObject(); if(obj && obj.type === 'i-text') { obj.set('textAlign', 'center'); canvas.renderAll(); salvarNoFirebase(); } });

document.getElementById('btn-undo').addEventListener('click', () => { if(historyIndex > 0) { historyIndex--; isHistoryAction = true; canvas.loadFromJSON(historyStack[historyIndex], () => { canvas.renderAll(); isHistoryAction = false; arrayDeSlides[indiceSlideAtivo].dadosGraficos = historyStack[historyIndex]; updateDoc(doc(db, "projetos", idProjeto), { slides: arrayDeSlides }); document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('aberto')); }); } });
document.getElementById('btn-redo').addEventListener('click', () => { if(historyIndex < historyStack.length - 1) { historyIndex++; isHistoryAction = true; canvas.loadFromJSON(historyStack[historyIndex], () => { canvas.renderAll(); isHistoryAction = false; arrayDeSlides[indiceSlideAtivo].dadosGraficos = historyStack[historyIndex]; updateDoc(doc(db, "projetos", idProjeto), { slides: arrayDeSlides }); document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('aberto')); }); } });

window.addEventListener('keydown', (e) => {
    if (meuCargo === "leitor") return; 
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); document.getElementById('btn-undo').click(); } 
    if (e.ctrlKey && e.key === 'y') { e.preventDefault(); document.getElementById('btn-redo').click(); } 
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); Copy(); } 
    if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) { e.preventDefault(); Paste(); } 
    if (e.key === 'Delete' || e.key === 'Backspace') { if(e.target.tagName !== 'INPUT' && !canvas.getActiveObject()?.isEditing) { document.getElementById('ferramenta-excluir').click(); } } 
});

onAuthStateChanged(auth, (user) => { if (user) { meuEmail = user.email; meuNome = user.displayName || user.email.split('@')[0]; minhaFoto = user.photoURL || `https://ui-avatars.com/api/?name=${meuNome}&background=ecf0f1&color=8e44ad`; iniciarSala(); } else { window.location.href = "index.html"; } });

function iniciarSala() {
    const linkMágico = `${window.location.origin}/convite.html?id=${idProjeto}`; 
    const inputLinkGerado = document.getElementById('link-gerado'); if (inputLinkGerado) inputLinkGerado.value = linkMágico;
    if(document.getElementById('btn-copiar-link')) {
        document.getElementById('btn-copiar-link').addEventListener('click', () => { navigator.clipboard.writeText(linkMágico); document.getElementById('btn-copiar-link').innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">check</span> Copiado!'; setTimeout(() => document.getElementById('btn-copiar-link').innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">content_copy</span> Copiar Link', 2000); });
    }

    onSnapshot(doc(db, "projetos", idProjeto), (snap) => {
        if(!snap.exists()) return;
        const dados = snap.data(); 
        if(document.getElementById('titulo-projeto-topo')) document.getElementById('titulo-projeto-topo').innerText = dados.nome;
        
        const donoProjeto = dados.dono || ""; if (meuEmail === donoProjeto) { meuCargo = "admin"; } else { meuCargo = dados.permissoes?.[meuEmail] || "leitor"; }
        
        if (meuCargo === "admin" || meuCargo === "editor") { canvas.selection = true; canvas.forEachObject(o => { o.selectable = true; o.evented = true; }); if(document.querySelector('.area-menus')) document.querySelector('.area-menus').style.display = 'flex'; } 
        else { canvas.selection = false; canvas.forEachObject(o => { o.selectable = false; o.evented = false; }); if(document.querySelector('.area-menus')) document.querySelector('.area-menus').style.display = 'none'; }
        
        if(meuCargo !== "admin") { if(document.getElementById('btn-abrir-equipe')) document.getElementById('btn-abrir-equipe').style.display = 'none'; } else { if(document.getElementById('btn-abrir-equipe')) document.getElementById('btn-abrir-equipe').style.display = 'flex'; }

        const areaMembros = document.getElementById('lista-membros'); 
        if(areaMembros) {
            areaMembros.innerHTML = '';
            if(dados.usuarios) { dados.usuarios.forEach(u => { const c = dados.permissoes?.[u] || "membro"; areaMembros.innerHTML += `<div class="membro-item"><span style="color:#2c3e50;">${u}</span> <strong style="color:#8e44ad;">${c.toUpperCase()}</strong></div>`; }); }
        }

        onSnapshot(query(collection(db, "projetos", idProjeto, "galeria"), orderBy("hora", "desc")), (snapGaleria) => {
            const grid = document.getElementById('grid-de-arquivos'); 
            if(!grid) return;
            grid.innerHTML = '';
            snapGaleria.forEach(docSnap => {
                const urlBase64 = docSnap.data().url; const div = document.createElement('div'); div.className = 'item-arquivo';
                div.innerHTML = `<img src="${urlBase64}"><div class="icone-add-tela">+ Add Tela</div>`;
                div.onclick = () => { fabric.Image.fromURL(urlBase64, function(img) { img.scaleToWidth(250); img.set({ left: 100, top: 100 }); canvas.add(img); canvas.setActiveObject(img); salvarNoFirebase(); }); };
                grid.appendChild(div);
            });
        });

        const cloudSlides = dados.slides || [{ id: "s1", dadosGraficos: '{"version":"5.3.0","objects":[],"background":"white"}' }];
        if (primeiraCarga) { primeiraCarga = false; arrayDeSlides = cloudSlides; if (indiceSlideAtivo >= arrayDeSlides.length) indiceSlideAtivo = 0; desenharMiniaturas(); carregarSlide(); } 
        else { if(!canvas.getActiveObject() && !canvas.isDrawingMode) { let mudouNaNuvem = false; if (cloudSlides.length !== arrayDeSlides.length) { mudouNaNuvem = true; } else if (cloudSlides[indiceSlideAtivo] && arrayDeSlides[indiceSlideAtivo]) { if (cloudSlides[indiceSlideAtivo].dadosGraficos !== arrayDeSlides[indiceSlideAtivo].dadosGraficos) { mudouNaNuvem = true; } else if (cloudSlides[indiceSlideAtivo].thumbnail !== arrayDeSlides[indiceSlideAtivo].thumbnail) { mudouNaNuvem = true; } } if (mudouNaNuvem) { arrayDeSlides = cloudSlides; if (indiceSlideAtivo >= arrayDeSlides.length) indiceSlideAtivo = arrayDeSlides.length - 1; desenharMiniaturas(); carregarSlide(); } } }
        
        if(document.getElementById('status-nuvem')) document.getElementById('status-nuvem').innerText = "☁️ Salvo";
    });

    onSnapshot(query(collection(db, "projetos", idProjeto, "mensagens"), orderBy("hora", "asc")), (snap) => {
        const area = document.getElementById('chat-mensagens'); 
        if(!area) return;
        area.innerHTML = '';
        snap.forEach(d => { const m = d.data(); const isMinha = m.autorEmail === meuEmail; const fotoExibicao = m.autorFoto || `https://ui-avatars.com/api/?name=${m.autorNome}&background=ecf0f1&color=8e44ad`; area.innerHTML += `<div class="mensagem-linha ${isMinha ? 'minha' : ''}"><img src="${fotoExibicao}" class="foto-perfil-chat"><div class="area-texto-chat"><span class="nome-user">${isMinha ? 'Você' : m.autorNome}</span><div class="msg ${isMinha ? 'msg-minha' : 'msg-outro'}">${m.texto}</div></div></div>`; }); 
        area.scrollTop = area.scrollHeight;
    });
}

if(document.getElementById('btn-add-membro')) {
    document.getElementById('btn-add-membro').addEventListener('click', async () => { const e = document.getElementById('email-convidado').value.trim(); const c = document.getElementById('cargo-convidado').value; if(e) { await updateDoc(doc(db, "projetos", idProjeto), { usuarios: arrayUnion(e), [`permissoes.${e}`]: c }); document.getElementById('email-convidado').value = ""; } });
}
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, updateDoc, collection, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// ==========================================
// 1. CONFIGURAÇÃO FIREBASE
// ==========================================
const firebaseConfig = { 
    apiKey: "AIzaSyCrO7jKe3ja8XJWeNTfTpv4wwEWwzzcYzo", 
    authDomain: "agora-ea1be.firebaseapp.com", 
    projectId: "agora-ea1be", 
    storageBucket: "agora-ea1be.firebasestorage.app", 
    messagingSenderId: "801313514193", 
    appId: "1:801313514193:web:99621b133ed4ca80e89bf0" 
};

const app = initializeApp(firebaseConfig); 
const db = getFirestore(app); 
const auth = getAuth(app); 
const storage = getStorage(app);
const idProjeto = new URLSearchParams(window.location.search).get('id');

// Variáveis Globais de Estado Compartilhadas
window.meuNome = "Anônimo";
window.meuEmail = "";
window.minhaFoto = "";
window.meuCargo = "leitor";
window.isAtualizandoPelaNuvem = false;

let carregamentoInicial = true;
let timeoutSalvar; 
let permissoesAtuais = {};
let donoProjeto = "";

// ==========================================
// 2. AUTENTICAÇÃO E INICIALIZAÇÃO DA SALA
// ==========================================
onAuthStateChanged(auth, (user) => { 
    if (user) { 
        window.meuEmail = user.email; 
        window.meuNome = user.displayName || user.email.split('@')[0]; 
        window.minhaFoto = user.photoURL || `https://ui-avatars.com/api/?name=${window.meuNome}&background=ecf0f1&color=8e44ad`; 
        iniciarSala(); 
        carregarChat(); 
    } 
});

function iniciarSala() {
    document.getElementById('link-gerado').value = window.location.href;
    
    onSnapshot(doc(db, "projetos", idProjeto), (snap) => {
        if (!snap.exists()) return; 
        const dados = snap.data(); 
        document.getElementById('titulo-projeto-topo').innerText = dados.nome;
        
        donoProjeto = dados.dono || ""; 
        permissoesAtuais = dados.permissoes || {}; 
        
        // CORREÇÃO: Garante que o dono do projeto seja sempre Admin
        if (window.meuEmail === donoProjeto) {
            window.meuCargo = "admin";
        } else {
            window.meuCargo = permissoesAtuais[window.meuEmail] || "leitor"; 
        }
        
        // Bloqueia ou libera o editor baseado no cargo
        if (window.meuCargo === "leitor") {
            if(window.quill) window.quill.disable(); 
        } else {
            if(window.quill) window.quill.enable(); 
        }
        
        renderizarEquipe();
        
        if (carregamentoInicial && dados.conteudo) { 
            window.isAtualizandoPelaNuvem = true; 
            if(window.quill) window.quill.clipboard.dangerouslyPasteHTML(dados.conteudo); 
            if(window.atualizarMiniaturasPaginas) window.atualizarMiniaturasPaginas(); 
            carregamentoInicial = false; 
            setTimeout(() => window.isAtualizandoPelaNuvem = false, 500); 
        } 
        else if (!carregamentoInicial && dados.conteudo && window.quill && !window.quill.hasFocus()) { 
            window.isAtualizandoPelaNuvem = true; 
            window.quill.clipboard.dangerouslyPasteHTML(dados.conteudo); 
            if(window.atualizarMiniaturasPaginas) window.atualizarMiniaturasPaginas(); 
            setTimeout(() => window.isAtualizandoPelaNuvem = false, 500); 
        }
    });
    
    // Escuta as mudanças que o usuário faz no editor de texto
    if(window.quill) {
        window.quill.on('text-change', function(delta, oldDelta, source) { 
            if(window.atualizarMiniaturasPaginas) window.atualizarMiniaturasPaginas(); 
            if (source == 'user' && !window.isAtualizandoPelaNuvem && window.meuCargo !== "leitor") { 
                document.getElementById('status-nuvem').innerText = "⏳ A Salvar..."; 
                clearTimeout(timeoutSalvar); 
                timeoutSalvar = setTimeout(window.salvarNaNuvemManual, 1000); 
            } 
        });
    }
}

window.salvarNaNuvemManual = async function() { 
    if(!window.quill || !idProjeto) return;
    await updateDoc(doc(db, "projetos", idProjeto), { conteudo: window.quill.root.innerHTML }); 
    document.getElementById('status-nuvem').innerText = "☁️ Salvo"; 
}

// ==========================================
// 3. GESTÃO DE EQUIPE
// ==========================================
function renderizarEquipe() { 
    const lista = document.getElementById('lista-membros'); 
    lista.innerHTML = ''; 
    for (const [email, cargo] of Object.entries(permissoesAtuais)) { 
        const isMe = email === window.meuEmail; 
        const isAdmin = window.meuCargo === 'admin' || window.meuEmail === donoProjeto; 
        let btnRemover = ''; 
        
        if (isAdmin && email !== donoProjeto && !isMe) { 
            btnRemover = `<button onclick="removerMembro('${email}')" style="background:none; border:none; color:#e74c3c; cursor:pointer;"><span class="material-symbols-outlined" style="font-size:18px;">person_remove</span></button>`; 
        } 
        
        let badgeCargo = cargo === 'admin' ? '👑 Admin' : (cargo === 'editor' ? '✏️ Editor' : '👁️ Leitor'); 
        if (email === donoProjeto) badgeCargo = '🌟 Criador'; 
        
        lista.innerHTML += `
            <div class="membro-item">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-weight:bold; font-size:13px;">${email} ${isMe ? '(Você)' : ''}</span>
                    <span style="font-size:11px; color:#7f8c8d;">${badgeCargo}</span>
                </div>
                <div>${btnRemover}</div>
            </div>`; 
    } 
}

document.getElementById('btn-add-membro').addEventListener('click', async () => { 
    const email = document.getElementById('email-convidado').value.trim().toLowerCase(); 
    const cargo = document.getElementById('cargo-convidado').value; 
    if (!email || !email.includes('@')) return alert('E-mail inválido.'); 
    if (window.meuCargo !== 'admin' && window.meuEmail !== donoProjeto) return alert('Apenas admins podem convidar.'); 
    
    try { 
        document.getElementById('btn-add-membro').innerText = "..."; 
        await updateDoc(doc(db, "projetos", idProjeto), { [`permissoes.${email}`]: cargo }); 
        document.getElementById('email-convidado').value = ''; 
        document.getElementById('btn-add-membro').innerText = "Convidar"; 
    } catch (error) { 
        alert("Erro ao convidar."); 
        document.getElementById('btn-add-membro').innerText = "Convidar"; 
    } 
});

window.removerMembro = async function(emailRemover) { 
    if(confirm(`Remover ${emailRemover}?`)) { 
        const novasPermissoes = { ...permissoesAtuais }; 
        delete novasPermissoes[emailRemover]; 
        await updateDoc(doc(db, "projetos", idProjeto), { permissoes: novasPermissoes }); 
    } 
}

window.copiarLinkProjeto = function() { 
    const input = document.getElementById('link-gerado'); 
    input.select(); 
    document.execCommand('copy'); 
    alert('Link copiado para a área de transferência!'); 
}

// ==========================================
// 4. CHAT EM TEMPO REAL
// ==========================================
const inputChat = document.getElementById('input-chat'); 
const btnEnviarMsg = document.getElementById('btn-enviar-msg'); 
const painelMensagens = document.getElementById('chat-mensagens');

function rolarChatParaFim() { 
    painelMensagens.scrollTop = painelMensagens.scrollHeight; 
}

async function enviarMensagem() { 
    const texto = inputChat.value.trim(); 
    if (!texto || !idProjeto || window.meuNome === "Anônimo") return; 
    inputChat.value = ""; 
    try { 
        await addDoc(collection(db, "projetos", idProjeto, "mensagens"), { 
            texto: texto, 
            autor: window.meuNome, 
            email: window.meuEmail, 
            foto: window.minhaFoto, 
            timestamp: new Date().getTime() 
        }); 
    } catch (erro) { 
        console.error("Erro ao enviar mensagem", erro); 
    } 
}

if(btnEnviarMsg) {
    btnEnviarMsg.addEventListener('click', enviarMensagem); 
}

if(inputChat) {
    inputChat.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') enviarMensagem(); 
    });
}

function carregarChat() { 
    if (!idProjeto) return; 
    const q = query(collection(db, "projetos", idProjeto, "mensagens"), orderBy("timestamp", "asc")); 
    onSnapshot(q, (snapshot) => { 
        painelMensagens.innerHTML = ""; 
        snapshot.forEach((docSnap) => { 
            const msg = docSnap.data(); 
            const ehMinha = msg.email === window.meuEmail; 
            painelMensagens.innerHTML += `
                <div class="mensagem-linha ${ehMinha ? 'minha' : ''}">
                    <img src="${msg.foto}" class="foto-perfil-chat">
                    <div style="display: flex; flex-direction: column; max-width: 80%;">
                        <span class="nome-user">${msg.autor}</span>
                        <div class="msg ${ehMinha ? 'msg-minha' : 'msg-outro'}">${msg.texto}</div>
                    </div>
                </div>`; 
        }); 
        rolarChatParaFim(); 
    }); 
}

// ==========================================
// 5. UPLOAD DE IMAGENS (FIREBASE STORAGE)
// ==========================================
const btnUpload = document.getElementById('btn-upload-imagem');
const inputFirebase = document.getElementById('input-imagem-firebase');

if(btnUpload && inputFirebase) {
    btnUpload.addEventListener('click', () => inputFirebase.click());
    
    inputFirebase.addEventListener('change', async function(e) { 
        const file = e.target.files[0]; 
        if (!file || window.meuCargo === 'leitor') return; 
        
        btnUpload.innerHTML = "⏳ Enviando..."; 
        const storageRef = ref(storage, `projetos/${idProjeto}/imagens/${Date.now()}_${file.name}`); 
        
        try { 
            await uploadBytes(storageRef, file); 
            const url = await getDownloadURL(storageRef); 
            window.quill.insertEmbed(window.quill.getSelection(true).index, 'image', url); 
            btnUpload.innerHTML = '<span class="material-symbols-outlined">image</span><span>Imagem</span>'; 
        } catch (error) { 
            alert("Erro ao enviar a imagem para a nuvem."); 
            btnUpload.innerHTML = '<span class="material-symbols-outlined">image</span><span>Imagem</span>';
        } 
        this.value = ''; 
    });
}

// ==========================================
// 6. VIDEOCHAMADA (JITSI MEET) E GAVETAS DA UI
// ==========================================
let apiJitsi = null;

document.getElementById('btn-iniciar-chamada').addEventListener('click', () => { 
    const containerVideo = document.getElementById('container-video'); 
    containerVideo.classList.remove('escondido'); 
    containerVideo.classList.remove('minimizado'); 
    
    if (!apiJitsi) { 
        const domain = 'meet.jit.si'; 
        const options = { 
            roomName: 'ProjetoAgora_' + (idProjeto || 'ReuniaoGeral'), 
            width: '100%', 
            height: '100%', 
            parentNode: document.querySelector('#jitsi-iframe'), 
            userInfo: { displayName: window.meuNome } 
        }; 
        apiJitsi = new JitsiMeetExternalAPI(domain, options); 
    } 
});

document.getElementById('btn-fechar-video').addEventListener('click', () => { 
    document.getElementById('container-video').classList.add('escondido'); 
    if (apiJitsi) { 
        apiJitsi.dispose(); 
        apiJitsi = null; 
    } 
});

document.getElementById('btn-minimizar-video').addEventListener('click', () => { 
    document.getElementById('container-video').classList.toggle('minimizado'); 
});

document.getElementById('btn-abrir-equipe').addEventListener('click', () => { 
    document.getElementById('modal-equipe').style.display = 'flex'; 
});

const caixaChat = document.getElementById('caixa-do-chat'); 
document.getElementById('btn-reabrir-chat').addEventListener('click', () => { 
    caixaChat.classList.add('aberto'); 
}); 

document.getElementById('btn-minimizar-chat').addEventListener('click', () => { 
    caixaChat.classList.remove('aberto'); 
});
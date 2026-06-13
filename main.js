import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "./firebase.js";

const form = document.getElementById('linkForm');
const linksGrid = document.getElementById('linksGrid');
const submitBtn = document.getElementById('submitBtn');

// Referência à coleção "notebooklm_links" no Firestore
const linksCollection = collection(db, "notebooklm_links");

// Array local para manter o estado atual
let links = [];

// Função para buscar os dados do Firebase
async function fetchLinks() {
  try {
    // Busca ordenando pela data de criação (se você quiser ordenar depois)
    // Para simplificar, vamos apenas buscar a coleção toda
    const q = query(linksCollection);
    const querySnapshot = await getDocs(q);
    
    links = [];
    querySnapshot.forEach((doc) => {
      // Pega o ID gerado pelo Firebase e os dados
      links.push({ id: doc.id, ...doc.data() });
    });
    
    renderLinks();
  } catch (error) {
    console.error("Erro ao buscar links: ", error);
    linksGrid.innerHTML = `<p class="empty-state">Erro ao carregar os dados.</p>`;
  }
}

// Função para renderizar os links na tela
function renderLinks() {
  linksGrid.innerHTML = ''; 

  if (links.length === 0) {
    linksGrid.innerHTML = `<p class="empty-state">Nenhum link adicionado ainda. Comece a garimpar seus materiais!</p>`;
    return;
  }

  links.forEach(link => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="card-header">
          <span class="badge">${link.subject}</span>
          <button class="delete-btn" data-id="${link.id}" title="Remover link">✕</button>
        </div>
        <h3>${link.title}</h3>
        <p class="date">Adicionado em ${link.dateAdded}</p>
      </div>
      <a href="${link.url}" target="_blank" rel="noopener noreferrer">Acessar NotebookLM ↗</a>
    `;
    linksGrid.appendChild(card);
  });

  // Adiciona os eventos de click para os botões de deletar
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const idToDelete = e.target.getAttribute('data-id');
      await deleteLink(idToDelete);
    });
  });
}

// Função para adicionar um novo link no Firebase
form.addEventListener('submit', async function(e) {
  e.preventDefault(); 
  submitBtn.disabled = true;
  submitBtn.innerText = 'Adicionando...';

  const titleInput = document.getElementById('title');
  const urlInput = document.getElementById('url');
  const subjectInput = document.getElementById('subject');

  const newLinkData = {
    title: titleInput.value,
    url: urlInput.value,
    subject: subjectInput.value,
    dateAdded: new Date().toLocaleDateString('pt-BR'),
    timestamp: new Date() // Útil para ordenação futura no Firebase
  };

  try {
    // Salva no Firebase
    const docRef = await addDoc(linksCollection, newLinkData);
    
    // Atualiza a lista local e a interface
    links.unshift({ id: docRef.id, ...newLinkData });
    
    // Limpa o formulário
    titleInput.value = '';
    urlInput.value = '';
    subjectInput.value = '';
    
    renderLinks();
  } catch (error) {
    console.error("Erro ao adicionar documento: ", error);
    alert("Erro ao adicionar link.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Adicionar';
  }
});

// Função para deletar um link do Firebase
async function deleteLink(id) {
  try {
    // Remove do Firebase
    await deleteDoc(doc(db, "notebooklm_links", id));
    
    // Remove localmente e atualiza a tela
    links = links.filter(link => link.id !== id);
    renderLinks();
  } catch (error) {
    console.error("Erro ao deletar documento: ", error);
    alert("Erro ao remover link.");
  }
}

// Carrega os dados ao iniciar
fetchLinks();
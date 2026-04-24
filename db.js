// ═══════════════════════════════════════════════════════
// Startweb — Banco de Dados Firebase Firestore
// Conferência de Materiais · Ebenezer
// ═══════════════════════════════════════════════════════

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDrWqT-sqwdNsQM_Mh0-LfQ4Fn8S49CBm0",
  authDomain: "ebenezer-conferencia.firebaseapp.com",
  projectId: "ebenezer-conferencia",
  storageBucket: "ebenezer-conferencia.firebasestorage.app",
  messagingSenderId: "27323021582",
  appId: "1:27323021582:web:83e8a778a705de6f057f5f"
};

let _db = null;

function getDB() {
  if (_db) return _db;
  if (typeof firebase === 'undefined') throw new Error('Firebase SDK não carregado!');
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  _db = firebase.firestore();
  return _db;
}

window.DB = {};

// ─── SALVAR CONFERÊNCIA ───
DB.salvarConferencia = async function (dados) {
  try {
    const db = getDB();
    const docRef = await db.collection('conferencias').add({
      ...dados,
      dataConferencia: firebase.firestore.FieldValue.serverTimestamp(),
      criadoEm: new Date().toISOString()
    });
    return { sucesso: true, id: docRef.id };
  } catch (err) {
    console.error('Erro ao salvar:', err);
    return { sucesso: false, erro: err.message };
  }
};

// ─── LISTAR CONFERÊNCIAS (filtros server + client side) ───
DB.listarConferencias = async function (filtros = {}) {
  try {
    const db = getDB();
    let query = db.collection('conferencias').orderBy('dataConferencia', 'desc').limit(500);

    if (filtros.dataInicio) {
      query = query.where('dataConferencia', '>=',
        firebase.firestore.Timestamp.fromDate(new Date(filtros.dataInicio + 'T00:00:00')));
    }
    if (filtros.dataFim) {
      query = query.where('dataConferencia', '<=',
        firebase.firestore.Timestamp.fromDate(new Date(filtros.dataFim + 'T23:59:59')));
    }

    const snapshot = await query.get();
    let docs = snapshot.docs.map(doc => {
      const d = doc.data();
      if (d.dataConferencia && d.dataConferencia.toDate) {
        d.dataConferencia = d.dataConferencia.toDate();
      }
      return { id: doc.id, ...d };
    });

    // Filtros client-side
    if (filtros.ordemCompra && filtros.ordemCompra.trim()) {
      const t = filtros.ordemCompra.trim().toLowerCase();
      docs = docs.filter(d =>
        d.ordemCompra?.toLowerCase().includes(t) ||
        (d.todasOrdens || []).some(o => o.toLowerCase().includes(t))
      );
    }
    if (filtros.loja) {
      docs = docs.filter(d => (d.lojas || []).includes(filtros.loja));
    }
    if (filtros.status) {
      docs = docs.filter(d => d.statusGeral === filtros.status);
    }

    return docs;
  } catch (err) {
    console.error('Erro ao listar:', err);
    return [];
  }
};

// ─── EXCLUIR CONFERÊNCIA ───
DB.excluirConferencia = async function (id) {
  try {
    const db = getDB();
    await db.collection('conferencias').doc(id).delete();
    return { sucesso: true };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
};

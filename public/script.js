const form = document.querySelector('#taskForm');
const lista = document.querySelector('#taskList');
const mensagem = document.querySelector('#formMessage');
const statusFilter = document.querySelector('#statusFilter');
const categoryFilter = document.querySelector('#categoryFilter');
const campos = {
    titulo: document.querySelector('#titulo'),
    descricao: document.querySelector('#descricao'),
    data: document.querySelector('#data'),
    horario: document.querySelector('#horario'),
    categoria: document.querySelector('#categoria'),
    prioridade: document.querySelector('#prioridade')
};

let tarefas = [];

function escapar(valor) {
    return String(valor).replace(/[&<>'"]/g, caractere => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
    }[caractere]));
}

async function carregar() {
    const resposta = await fetch('/tarefas');
    if (!resposta.ok) throw new Error('Não foi possível carregar as tarefas.');
    tarefas = await resposta.json();
    mostrar();
}

function mostrar() {
    const status = statusFilter ? statusFilter.value : 'todas';
    const categoria = categoryFilter ? categoryFilter.value : 'todas';
    const filtradas = tarefas
        .filter(tarefa => (status === 'todas' || (status === 'concluidas' ? tarefa.concluida : !tarefa.concluida)) && (categoria === 'todas' || tarefa.categoria === categoria))
        .sort((a, b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`));

    lista.innerHTML = filtradas.length ? filtradas.map(tarefa => `
        <div class="task-card ${tarefa.concluida ? 'is-done' : ''}">
            <div class="task-content">
                <h3>${escapar(tarefa.titulo)}</h3>
                <p>${escapar(tarefa.descricao || '')}</p>
                <p>${escapar(tarefa.data)}${tarefa.horario ? ` - ${escapar(tarefa.horario)}` : ''}</p>
                <p>${escapar(tarefa.categoria)} - ${escapar(tarefa.prioridade)}</p>
                <strong>${tarefa.concluida ? 'Concluída' : 'Pendente'}</strong>
            </div>
            <div class="task-actions">
                <button type="button" class="icon-button" data-acao="concluir" data-id="${tarefa.id}">${tarefa.concluida ? 'Reabrir' : 'Concluir'}</button>
                <button type="button" class="icon-button danger" data-acao="excluir" data-id="${tarefa.id}">Excluir</button>
            </div>
        </div>
    `).join('') : '<div class="empty-state">Nenhuma tarefa cadastrada.</div>';

    const contador = document.querySelector('#taskCount');
    if (contador) contador.textContent = filtradas.length;
}

form.addEventListener('submit', async evento => {
    evento.preventDefault();
    mensagem.textContent = 'Salvando...';
    mensagem.className = 'form-message';

    const tarefa = Object.fromEntries(Object.entries(campos).map(([nome, campo]) => [nome, campo.value]));

    try {
        const resposta = await fetch('/tarefas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tarefa)
        });
        const resultado = await resposta.json();
        if (!resposta.ok) throw new Error(resultado.erro || 'Não foi possível cadastrar a tarefa.');

        form.reset();
        mensagem.textContent = 'Tarefa cadastrada com sucesso!';
        mensagem.className = 'form-message success';
        await carregar();
    } catch (erro) {
        mensagem.textContent = erro.message;
        mensagem.className = 'form-message error';
    }
});

lista.addEventListener('click', async evento => {
    const botao = evento.target.closest('button[data-id]');
    if (!botao) return;

    const id = botao.dataset.id;
    const metodo = botao.dataset.acao === 'excluir' ? 'DELETE' : 'PUT';
    const tarefa = tarefas.find(item => String(item.id) === id);
    const opcoes = { method: metodo };
    if (metodo === 'PUT') {
        opcoes.headers = { 'Content-Type': 'application/json' };
        opcoes.body = JSON.stringify({ concluida: !tarefa.concluida });
    }

    const resposta = await fetch(`/tarefas/${id}`, opcoes);
    if (!resposta.ok) alert('Não foi possível atualizar a tarefa.');
    await carregar();
});

statusFilter?.addEventListener('change', mostrar);
categoryFilter?.addEventListener('change', mostrar);
carregar().catch(erro => { lista.innerHTML = `<div class="empty-state">${escapar(erro.message)}</div>`; });

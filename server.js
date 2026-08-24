const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ARQUIVO_TAREFAS = path.join(__dirname, 'tarefas.json');
const CATEGORIAS = ['Estudo', 'Trabalho', 'Pessoal', 'Evento', 'Outro'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta'];

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

function lerTarefas() {
    try {
        const tarefas = JSON.parse(fs.readFileSync(ARQUIVO_TAREFAS, 'utf8') || '[]');
        return Array.isArray(tarefas) ? tarefas : [];
    } catch (erro) {
        return [];
    }
}

function salvarTarefas(tarefas) {
    fs.writeFileSync(ARQUIVO_TAREFAS, JSON.stringify(tarefas, null, 2));
}

app.get('/tarefas', (req, res) => res.json(lerTarefas()));

app.post('/tarefas', (req, res) => {
    const { titulo, descricao = '', data, horario = '', categoria, prioridade } = req.body;
    if (!titulo || !titulo.trim() || !data || !categoria || !prioridade) {
        return res.status(400).json({ erro: 'Título, data, categoria e prioridade são obrigatórios.' });
    }
    if (!CATEGORIAS.includes(categoria) || !PRIORIDADES.includes(prioridade)) {
        return res.status(400).json({ erro: 'Categoria ou prioridade inválida.' });
    }
    const tarefas = lerTarefas();
    const id = tarefas.reduce((maior, tarefa) => Math.max(maior, Number(tarefa.id) || 0), 0) + 1;
    const novaTarefa = { id, titulo: titulo.trim(), descricao: String(descricao).trim(), data, horario, categoria, prioridade, concluida: false };
    tarefas.push(novaTarefa);
    salvarTarefas(tarefas);
    res.status(201).json(novaTarefa);
});

app.put('/tarefas/:id', (req, res) => {
    const tarefas = lerTarefas();
    const tarefa = tarefas.find(item => item.id === Number(req.params.id));
    if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    tarefa.concluida = typeof req.body.concluida === 'boolean' ? req.body.concluida : !tarefa.concluida;
    salvarTarefas(tarefas);
    res.json(tarefa);
});

app.delete('/tarefas/:id', (req, res) => {
    const tarefas = lerTarefas();
    const restantes = tarefas.filter(tarefa => tarefa.id !== Number(req.params.id));
    if (restantes.length === tarefas.length) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    salvarTarefas(restantes);
    res.json({ mensagem: 'Tarefa excluída.' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
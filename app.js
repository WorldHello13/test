const express = require('express');
const bodyParser = require('body-parser');
const neo4j = require('neo4j-driver');
const path = require('path');
const app = express();
const port = 3000;

// Neo4j 연결
const driver = neo4j.driver('bolt+s://18c363b9.databases.neo4j.io:7687', neo4j.auth.basic('neo4j', 'G-nOZZdbqIVLjHPrdRwk5Xk72vqO8_JmKYn-YwHqxOs'));
const session = driver.session();

// 미들웨어 설정
app.use(bodyParser.json());
app.use(express.static('public'));

// 메시지 목록 API
app.get('/messages', async (req, res) => {
    try {
        const result = await session.run('MATCH (m:Message) RETURN m ORDER BY m.createdAt DESC');
        const messages = result.records.map(record => record.get('m').properties);
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error loading messages' });
    }
});

// 메시지 추가 API
app.post('/messages', async (req, res) => {
    const { text } = req.body;
    try {
        const result = await session.run(
            'CREATE (m:Message {id: apoc.create.uuid(), text: $text, createdAt: timestamp()}) RETURN m',
            { text }
        );
        const message = result.records[0].get('m').properties;
        res.json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding message' });
    }
});

// 메시지 삭제 API
app.delete('/messages/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await session.run('MATCH (m:Message {id: $id}) DELETE m', { id });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting message' });
    }
});

// HTML 파일 서빙
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 실행
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

import axios from 'axios';

const PROXY_URL = "http://localhost:3002/api";

async function test() {
    // Teste 1: Sem header (Proxy deve injetar)
    try {
        console.log("Testando PROXY fetchInstances (sem header)...");
        const res = await axios.get(`${PROXY_URL}/instance/fetchInstances`);
        console.log("Sucesso (sem header):", res.status);
    } catch (err) {
        console.error("Erro (sem header):", err.response ? err.response.status : err.message);
    }

    // Teste 2: Com header explícito
    try {
        console.log("Testando PROXY fetchInstances (com header)...");
        const res = await axios.get(`${PROXY_URL}/instance/fetchInstances`, {
            headers: { 'apikey': 'your-api-key-here' }
        });
        console.log("Sucesso (com header):", res.status, res.data);
    } catch (err) {
        console.error("Erro (com header):", err.response ? err.response.status : err.message, err.response ? err.response.data : '');
    }
}

test();

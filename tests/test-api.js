import axios from 'axios';

const API_URL = "http://localhost:8085/v1";
const API_KEY = "your-api-key-here";

async function test() {
    try {
        console.log("Testando fetchInstances...");
        const res = await axios.get(`${API_URL}/instance/fetchInstances`, {
            headers: { 'apikey': API_KEY }
        });
        console.log("Sucesso:", res.status, res.data);
    } catch (err) {
        console.error("Erro:", err.response ? err.response.status : err.message, err.response ? err.response.data : '');
    }
}

test();

import axios from 'axios';

const sessionId = "77494829152:hTj99fSVfqUvpi:11:AYje-thva16RsWhVDRyz6rXAV60jqfJjW1OupKmexA";
// ID obtido no teste anterior para socialmediapesssoal
const targetId = "77494829152";
// Username para testar resolução
const targetUsername = "socialmediapesssoal";

async function testEndpoint(target) {
    console.log(`\n--- Testando Investigação para: ${target} ---`);
    try {
        const res = await axios.post('http://localhost:3002/api/instagram/investigate', {
            target: target,
            sessionId
        });

        if (res.data.success) {
            console.log("✅ Sucesso!");
            // console.log(JSON.stringify(res.data.data, null, 2));
            console.log("Nome:", res.data.data.full_name);
            console.log("Email:", res.data.data.public_email);
            console.log("Telefone:", res.data.data.public_phone_number);
        } else {
            console.log("❌ Falha na API:", res.data.error);
        }
    } catch (e) {
        console.error("❌ Erro HTTP:", e.message);
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Dados:", e.response.data);
        }
    }
}

async function run() {
    // 1. Testar com ID (caminho direto Mobile API)
    await testEndpoint(targetId);

    // 2. Testar com Username (caminho Web Profile Info - propenso a falhar)
    // await testEndpoint(targetUsername);
}

run();

import axios from 'axios';

const sessionId = "77494829152:hTj99fSVfqUvpi:11:AYje-thva16RsWhVDRyz6rXAV60jqfJjW1OupKmexA";
const targets = ["socialmediapesssoal", "francisco_de_queiroz"];

async function run() {
    for (const target of targets) {
        console.log(`\n--- Investigando: ${target} ---`);
        try {
            const res = await axios.post('http://localhost:3002/api/instagram/investigate', {
                target,
                sessionId
            });
            console.log(JSON.stringify(res.data, null, 2));
        } catch (e) {
            console.error("Erro:", e.message);
            if (e.response) console.error(e.response.data);
        }
    }
}

run();

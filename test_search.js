import axios from 'axios';

// Extraído do seu dump (decodificado)
const sessionId = "77494829152:hTj99fSVfqUvpi:11:AYje-thva16RsWhVDRyz6rXAV60jqfJjW1OupKmexA";
const queries = ["francisco_de_queiroz", "socialmediapesssoal"];

async function run() {
    console.log("🔍 Buscando IDs válidos para:", queries.join(", "));

    for (const query of queries) {
        try {
            const res = await axios.post('http://localhost:3002/api/instagram/search', {
                query,
                sessionId
            });

            if (res.data.success) {
                const bestMatch = res.data.data[0]; // Pega o primeiro resultado
                if (bestMatch) {
                    console.log(`\n✅ Encontrado: ${query}`);
                    console.log(`   ID: ${bestMatch.id}`);
                    console.log(`   User: ${bestMatch.username}`);
                    console.log(`   Nome: ${bestMatch.full_name}`);
                } else {
                    console.log(`\n❌ Nenhum resultado para: ${query}`);
                }
            } else {
                console.log(`Erro API: ${res.data.error}`);
            }
        } catch (e) {
            console.error("Erro na requisição:", e.message);
        }
    }
}

run();

import axios from 'axios';


const text = `📱 *Canais de Contato*

📞 *Contato e Suporte*
CANAL
link canal https://whatsapp.com/channel/0029Vb7MgPz5kg767iWItk42

[**Saiba Mais!!!!**]
https://wa.me/558894227586

📧 *Email*
- *Principal*: contato@automacoescomerciais.com.br
- *Suporte Técnico*: Para dúvidas sobre implementação, bugs e melhorias
- *Consultoria*: Para projetos personalizados e integrações complexas
- *Tempo de resposta*: 24-48 horas

💬 *Telegram*
- *Grupo de Suporte*: https://t.me/+9cdym9gvPQ9iOWNh
- Comunidade ativa de desenvolvedores
- Suporte em tempo real

📱 *WhatsApp*
- *Número*: +55 88 92156-7214
- *Horário*: Segunda a Sexta, 8h às 18h (GMT-3)

🛠️ *Tipos de Suporte*

🆓 *Suporte Gratuito*
- Issues no GitHub
- Documentação
- Grupo Telegram

💼 *Suporte Premium*
- Consultoria personalizada
- Desenvolvimento customizado
- Suporte prioritário (2h)
`;

const number = "5588921567214";
const instance = "minha-instancia";
const apiKey = "your-api-key-here";
const url = `http://144.91.118.78:8085/message/sendText/${instance}`;

console.log(`Enviando mensagem para ${number}...`);

axios.post(url, {
    number: number,
    options: {
        delay: 1200,
        presence: "composing",
        linkPreview: true
    },
    textMessage: {
        text: text
    }
}, {
    headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
    }
})
    .then(res => {
        console.log("✅ Mensagem enviada com sucesso!");
        console.log("Response:", res.data);
    })
    .catch(err => {
        console.error("❌ Erro ao enviar:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        }
    });

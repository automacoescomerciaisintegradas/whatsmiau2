// public/js/whatsapp_signup.js
/*
  Script responsável por iniciar o fluxo de cadastro incorporado (Embedded Signup)
  do WhatsApp Business usando o SDK do Facebook (FB.login) e registrar o callback
  que recebe o código de autorização.

  Requisitos:
  - O SDK do Facebook já deve estar carregado na página (https://connect.facebook.net/…/sdk.js)
  - Substitua <CONFIGURATION_ID> pelo ID da sua configuração do WhatsApp Business.
  - Ajuste os objetos de "extras.setup" conforme a sua necessidade (dados da empresa,
    telefone pré‑verificado, etc.).
  - O backend deverá ter endpoints que:
      • GET /api/whatsapp/prefill – devolve o JSON de pré‑preenchimento.
      • POST /api/whatsapp/exchange-code – troca o "code" por access token.
*/

/**
 * Obtém o JSON de pré‑preenchimento do backend e devolve em Base64.
 * O backend deve seguir a estrutura descrita em docs/whatsapp_pre_fill.md.
 * @returns {Promise<string>} Base64 do JSON ou string vazia em caso de erro.
 */
async function fetchPrefillData() {
  try {
    const response = await fetch('/api/whatsapp/prefill', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('Erro ao obter dados de pré‑preenchimento');
    const data = await response.json();
    const jsonString = JSON.stringify(data);
    // Codifica em Base64 (UTF‑8)
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    return base64;
  } catch (err) {
    console.error(err);
    return '';
  }
}

/**
 * Lança o fluxo de cadastro WhatsApp via Facebook Login.
 * Se houver data de pré‑fill, a URL será construída com o parâmetro
 * `prefill_data` para que o formulário já chegue preenchido.
 */
export const launchWhatsAppSignup = async () => {
  if (typeof FB === 'undefined') {
    console.error('Facebook SDK não está carregado.');
    return;
  }

  // Busca o JSON de pré‑preenchimento e monta a URL
  const prefillBase64 = await fetchPrefillData();
  const signupUrl = prefillBase64
    ? `https://wa.me/<CONFIGURATION_ID>?prefill_data=${prefillBase64}`
    : `https://wa.me/<CONFIGURATION_ID>`;

  // Armazena a URL para redirecionamento posterior no callback
  window.__whatsappSignupUrl = signupUrl;

  FB.login(fbLoginCallback, {
    config_id: '<CONFIGURATION_ID>', // <--- Substitua pelo seu configuration ID
    response_type: 'code',
    override_default_response_type: true,
    extras: {
      setup: {
        business: {},
        preVerifiedPhone: {},
        phone: {},
        whatsAppBusinessAccount: {}
      },
      featureType: '',
      sessionInfoVersion: '3'
    }
  });
};

/**
 * Callback executado após o usuário concluir (ou cancelar) o login.
 * @param {{status: string, authResponse?: {code?: string}}} response
 */
function fbLoginCallback(response) {
  if (response.status === 'connected' && response.authResponse && response.authResponse.code) {
    const authCode = response.authResponse.code;
    console.log('Código de autorização recebido:', authCode);
    // Troca o código por token no backend
    fetch('/api/whatsapp/exchange-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: authCode })
    })
      .then(res => {
        if (!res.ok) throw new Error('Falha ao trocar o código');
        return res.json();
      })
      .then(data => {
        console.log('Token recebido do backend:', data);
        // Redireciona para página de cadastro já preenchida, se houver pre‑fill
        if (window.__whatsappSignupUrl) {
          window.location.href = window.__whatsappSignupUrl;
        }
      })
      .catch(err => {
        console.error('Erro ao trocar o código por token:', err);
      });
  } else if (response.status === 'not_authorized') {
    console.warn('Usuário cancelou ou não autorizou o login.');
  } else {
    console.error('Falha inesperada no login do Facebook:', response);
  }
}

/*
  Exemplo de uso na página HTML:
  <button id="signupBtn">Cadastrar WhatsApp</button>
  <script type="module">
    import { launchWhatsAppSignup } from '/js/whatsapp_signup.js';
    document.getElementById('signupBtn').addEventListener('click', launchWhatsAppSignup);
  </script>
*/

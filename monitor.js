const https = require('https');
const fs = require('fs');
const path = require('path');

// Configurações Z-API
const ZAPI_CONFIG = {
  ID_INSTANCIA: process.env.ZAPI_ID_INSTANCIA || "3E9893E36A001149A03B8E4D13D7057E",
  TOKEN_INSTANCIA: process.env.ZAPI_TOKEN_INSTANCIA || "7FB1A1995B5F735F8C95F969",
  CLIENT_TOKEN: process.env.ZAPI_CLIENT_TOKEN || "F669b94414efc4dc5b3c8ad4157621de4S",
  GRUPO_PHONE: process.env.ZAPI_GRUPO_PHONE || "120363432066743565-group"
};

// Histórico de tickets já notificados
const HISTORY_FILE = path.join(__dirname, 'notified_tickets.json');

function loadNotifiedTickets() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Erro ao ler historico:', err.message);
  }
  return [];
}

function saveNotifiedTicket(ticketId) {
  const list = loadNotifiedTickets();
  if (!list.includes(ticketId)) {
    list.push(ticketId);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(list, null, 2));
  }
}

// Envio para WhatsApp via Z-API
async function sendToWhatsApp(messageText) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      phone: ZAPI_CONFIG.GRUPO_PHONE,
      message: messageText
    });

    const options = {
      hostname: 'api.z-api.io',
      path: `/instances/${ZAPI_CONFIG.ID_INSTANCIA}/token/${ZAPI_CONFIG.TOKEN_INSTANCIA}/send-text`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_CONFIG.CLIENT_TOKEN,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[WhatsApp] Status: ${res.statusCode}, Resposta: ${data}`);
        resolve(data);
      });
    });

    req.on('error', err => {
      console.error('[WhatsApp] Erro no envio:', err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

// Consulta AppSheet
async function checkAppSheetTickets() {
  const nowBr = new Date(Date.now() - 3 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${nowBr} BRT] Iniciando verificação de tickets no AppSheet...`);

  const cookie = process.env.APPSHEET_COOKIE || `.JEENEEATH-3P=FB278CBEFC3FE7A41BACB9B6C66707DC0FB822E838A8728297DEF310AE172414421CE33232BC26EEEACDDB11FD328847974D9E21DC507F061D4208B2295BE5549A80A0B6F6234AF7526221CA88061B7877DB0B1B7E89EB19A5A1D2375635E599F3CEDA41E42EAA90D92ABC04AB00A47DA62D99EED773082796174DD9365E8F8608B047C3A3C4196DDD3A47DF9A3A393B116A20E206BF2A9E9BB0627F65B31B6218ABAB55C22533F9E3E6606C39FD47AEA7052E1DA9E3278619FB779EB51C6C8C37C60BA59395A182609327CBC084C11CB6B8AAAFC5B517CAD134FB6EF658FCBBB5FD1CDCB6469C007717AE6B13A8B1DD4964DBE08046E20DA333CA8A227DD15E72C73F98AB06423B33431B1D58CB683EF2A605BCAE5D9EEC3A8BED6158EEFC673C9B5D94F6E7D47B08060E8401B45C9E7FCBC0D4AEA9AFBDA9C63136EE75F9106BFD6B751E0AAE27AD75F14D1EEE146E; _ga=GA1.1.1710168588.1770388800; _ga_7FHZ311STN=GS2.1.s1781704360$o1$g1$t1781704375$j45$l0$h0; __stripe_mid=8b747808-ecf9-4df3-a71d-81574b4b79d7a9a2b9; .JEENEEATH=F4A0280B036F02905392DBD9E4AB38878E254A625F89DB3D2886F08E5C9CCE60751BF00E1607476395D1CAB8EDB83AAA6A1E83DEFA02AAD881BAC907D4D4CD97652ACA33E5AED4A017AF63599AB93E6AEC081DC7CEF3F0589F8A7B7C10ECDC9FC98CAC0271EA841757EA464CE5EAC2C53EBA99C93682E07702E129311F6DD0DAC7D8DB081CDDBDCD57082B06767A44566160599D5F9BF54473B5EBBF4480F3085931E077876594874F41A1A97D58A880F6C9135D30742BA171C609FB91D3C91EE72AA6A9D7704B11C8E53141F901539D34C797BD93B127DD3009133C98297B72DEB3317D5DA5AC50C0250A487C0C9DED3E4E8E0D3B125AD14B7B8605F1CE6FE5D87AFB286FCCEA08BC3235E84FAF8CC1; JeeneeUserInfo={%22UserInfo%22:{%22Id%22:792834707%2C%22Name%22:%22%22%2C%22AuthUserId%22:%22117210578088319173380%22%2C%22AuthUserEmail%22:%22gabriel.santos@ajborges.com%22%2C%22AuthSource%22:%22google%22%2C%22UserRole%22:%22User%22}%2C%22Metadata%22:{%22Path%22:%22/%22%2C%22Domain%22:%22appsheet.com%22%2C%22Expires%22:%222026-11-24T01:13:42.901Z%22%2C%22Secure%22:true%2C%22SupportAccess%22:false}}; _ga_6EP004WL14=GS2.1.s1793064813$o2$g1$t1793064813$j60$l0$h0`;

  const payload = JSON.stringify({
    "settings": "{\"_RowNumber\":\"0\",\"_EMAIL\":\"\",\"_NAME\":\"\",\"_LOCATION\":\"\",\"Options Heading\":\"\",\"Option 1\":\"\",\"Option 2\":\"\",\"Country Option\":\"\",\"Language Option\":\"\",\"Option 5\":\"\",\"Option 6\":\"\",\"Option 7\":\"\",\"Option 8\":\"\",\"Option 9\":\"\",\"_THISUSER\":\"onlyvalue\"}",
    "getAllTables": true,
    "syncsOnConsent": true,
    "syncUI": "Blocking",
    "initiatedBy": "ManualSync",
    "isPreview": false,
    "apiLevel": 2,
    "supportsJsonDataSets": true,
    "tzOffset": 180,
    "locale": "pt-BR",
    "perTableParams": {
      "_Per User Settings": { "time": "2026-10-27T01:13:32.7236216Z", "etag": "3C96348FBF148AE2A69719F73B629686" },
      "Base Principal": { "time": "2026-10-27T01:13:32.7243063Z", "etag": "13466BE7AFAD9C4752571521C5004479" },
      "Ocorrências": { "time": "2026-10-27T01:13:32.7251353Z", "etag": "8E3A72AEE01F938FBF3D881FC4D13E9E" },
      "Menu": { "time": "2026-10-27T01:13:32.7253262Z", "etag": "B9872CF868EA946940E6109BD2D7F741" },
      "Multas": { "time": "2026-10-27T01:13:32.8911577Z", "etag": "08380D15847CA5778A83DFE3BA5C9725" }
    },
    "lastSyncTime": "2026-10-27T01:13:41.4608928Z",
    "appStartTime": "2026-10-27T01:38:34.690Z",
    "dataStamp": "2026-10-27T01:13:41.4608928Z",
    "clientId": "5c01b04f-83ef-4459-9ff7-4cc5b475f7ab",
    "build": "aaaaaaaaaaaaaaaaaaaa-1792989559495-6b30d9a5",
    "hasValidPlan": true,
    "userConsentedScopes": "data_input,device_identity,device_io,profile,usage",
    "localVersion": "1.001248",
    "isBackgroundSync": true,
    "syncToken": process.env.APPSHEET_SYNC_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6Ijk5YTk0OWM5LTE3ZGUtNDIzMS05YTVlLWQ0MDU0M2E2ZDIwYSIsImFwcFZlcnNpb24iOiIxLjAwMTI0OCIsInVzZXJJZCI6Ijc5MjgzNDcwNyIsImlhdCI6MTc5MzA2MzYxMiwiZXhwIjoxODAwODM5NjEyLCJpc3MiOiJodHRwczovL3d3dy5hcHBzaGVldC5jb20iLCJhdWQiOiJodHRwczovL3d3dy5hcHBzaGVldC5jb20ifQ.sAqzSAwYQzEIpcfUuhhYzIDi4p0sy5oNPOcu8LfKu_g"
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.appsheet.com',
      path: '/api/template/99a949c9-17de-4231-9a5e-d40543a6d20a/',
      method: 'POST',
      headers: {
        'accept': '*/*',
        'content-type': 'application/json',
        'cookie': cookie,
        'origin': 'https://www.appsheet.com',
        'referer': 'https://www.appsheet.com/start/99a949c9-17de-4231-9a5e-d40543a6d20a?platform=desktop',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'x-requested-with': 'XMLHttpRequest',
        'content-length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', async () => {
        try {
          const full = Buffer.concat(chunks).toString('utf-8');
          const data = JSON.parse(full);
          const notified = loadNotifiedTickets();

          // Encontrar DataSet da tabela Ticket
          let ticketDS = null;
          for (const [k, v] of Object.entries(data.NestedDataSets || {})) {
            if (v.Name === 'Ticket') {
              ticketDS = JSON.parse(v.DataSet);
              break;
            }
          }

          if (!ticketDS) {
            console.log('Tabela Ticket não encontrada no retorno.');
            return resolve();
          }

          const cols = ticketDS.columns;
          const ltIdx = cols.indexOf('LT');
          const rowNumIdx = cols.indexOf('_RowNumber');
          const motIdx = cols.indexOf('Motivo da Chamada');
          const dtIdx = cols.indexOf('Horário de abertura');
          const agenciaIdx = cols.indexOf('Agência');
          const driverIdx = cols.indexOf('Motorista');
          const placaIdx = cols.indexOf('Placa');
          const origIdx = cols.indexOf('Origem');
          const destIdx = cols.indexOf('Destino');
          const statusIdx = cols.indexOf('Status');
          const descIdx = cols.indexOf('Descrição');

          console.log(`Tickets no AppSheet: ${ticketDS.data.length} | Tickets no histórico de enviados: ${notified.length}`);

          let novos = 0;
          for (const row of ticketDS.data) {
            const status = (row[statusIdx] || '').trim();
            const rowNumber = row[rowNumIdx];
            const lt = (row[ltIdx] || 'S/N').trim();
            const abertura = (row[dtIdx] || '').trim();
            const ticketId = `${rowNumber}_${lt}_${abertura}`;

            // Notifica se NÃO estiver CONCLUÍDO e ainda não tiver sido avisado
            if (status !== 'CONCLUÍDO' && !notified.includes(ticketId)) {
              novos++;
              console.log(`[NOVO TICKET DETECTADO] LT: ${lt} | Motivo: ${row[motIdx]} | Status: ${status}`);

              const msg = 
`🚨 *NOVO ACIONAMENTO / TICKET DE DESCARGA* 🚨

📌 *LT:* ${lt}
🏢 *Agência:* ${row[agenciaIdx] || 'Não informado'}
⚠️ *Motivo:* ${row[motIdx] || 'Solicitação de Descarga'}
📅 *Horário de Abertura:* ${abertura || 'Não informado'}

👤 *Motorista:* ${row[driverIdx] || 'Não informado'}
🚛 *Placa:* ${row[placaIdx] || 'Não informada'}
📍 *Rota:* ${row[origIdx] || ''} ➔ ${row[destIdx] || ''}
⚡ *Status:* ${status || 'ABERTO'}
📝 *Descrição:* ${row[descIdx] || ''}`;

              await sendToWhatsApp(msg);
              saveNotifiedTicket(ticketId);
              console.log(`✅ Ticket ${ticketId} enviado para o grupo de WhatsApp com sucesso!`);
            }
          }

          if (novos === 0) {
            console.log('Nenhum ticket aberto pendente de notificação no momento.');
          }

          resolve();
        } catch (err) {
          console.error('Erro ao processar resposta do AppSheet:', err.message);
          resolve();
        }
      });
    });

    req.on('error', err => {
      console.error('Erro na requisição ao AppSheet:', err.message);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

// Execução
checkAppSheetTickets().catch(console.error);

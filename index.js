const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = 'massimobot'; // Este es tu token de verificación
const PAGE_ACCESS_TOKEN = 'EAALpELnYP5gBO7ikjtwBhcIBfVnZA78LpLOfRJuEw30fZBXfSjbWfU4q8v9naoNZBsetnpKCCZBNBbKf76kv92rkVriWA6kZBmd6SSv872tZAFQfqtoQBHxrHYZCZCZB5HZCJpgogabxj4KeLObMiX7ao4XZCvOWqXs5RhGqpD1Ui7I6BDuHGffZCNo5W0yFLqFiohYHm0aV552G'; // ← Reemplaza con el token de tu página
const OPENAI_API_KEY = '	
sk-...ugsA'; // ← Reemplaza con tu clave de OpenAI

app.use(bodyParser.json());

// Verificación del Webhook (Facebook la usa al conectar el bot)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Manejo de mensajes entrantes
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging[0];
      const senderId = webhookEvent.sender.id;

      if (webhookEvent.message && webhookEvent.message.text) {
        const userMessage = webhookEvent.message.text;

        try {
          // Enviar mensaje a OpenAI
          const openAIResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: userMessage }],
            },
            {
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const reply = openAIResponse.data.choices[0].message.content;
          await enviarMensajeAMessenger(senderId, reply);
        } catch (error) {
          console.error('❌ Error al contactar OpenAI:', error.response?.data || error.message);
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Enviar mensaje a Messenger
async function enviarMensajeAMessenger(senderId, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: senderId },
        message: { text: text },
      }
    );
  } catch (error) {
    console.error('❌ Error al enviar a Messenger:', error.response?.data || error.message);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { url, nome, cognome, email, telefono } = req.body;

    if (!url || !url.includes('airbnb')) {
        return res.status(400).json({ error: 'Inserisci un link Airbnb valido.' });
    }

    try {
        // Scrape the Airbnb listing page
        const pageResponse = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
                'Accept': 'text/html,application/xhtml+xml'
            }
        });

        if (!pageResponse.ok) {
            return res.status(400).json({ error: 'Non riesco ad accedere all\'annuncio. Verifica che il link sia corretto e pubblico.' });
        }

        const html = await pageResponse.text();

        // Extract useful text content (title, description, meta)
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
        const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
        const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);

        // Extract text from body, strip tags
        let bodyText = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 8000); // Limit context

        const listingContext = [
            titleMatch ? `Titolo: ${titleMatch[1]}` : '',
            ogTitleMatch ? `OG Title: ${ogTitleMatch[1]}` : '',
            metaDescMatch ? `Meta Description: ${metaDescMatch[1]}` : '',
            ogDescMatch ? `OG Description: ${ogDescMatch[1]}` : '',
            `\nContenuto pagina (estratto):\n${bodyText}`
        ].filter(Boolean).join('\n');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Sei un esperto di property management e affitti brevi in Italia, specializzato in ottimizzazione annunci Airbnb. Analizza l'annuncio fornito e dai un audit dettagliato ma pratico. Rispondi SEMPRE in italiano. Usa un tono professionale ma accessibile.

Struttura la risposta esattamente così (usa questi titoli con ##):

## Punteggio Generale
Dai un voto da 1 a 10 e una riga di commento.

## Titolo dell'Annuncio
Analizza il titolo: è accattivante? Contiene parole chiave? Suggerisci una versione migliorata.

## Descrizione
Valuta: è completa? Vende l'esperienza o solo l'immobile? Mancano informazioni importanti?

## Foto (se menzionate)
Commenta sulla qualità percepita dalle descrizioni/contesto disponibile.

## Pricing e Posizionamento
Commenta sul posizionamento di prezzo se ci sono indizi nel testo.

## 3 Miglioramenti Immediati
Lista numerata dei 3 cambiamenti più impattanti che il proprietario può fare subito.

## Potenziale Inespresso
Stima di quanto potrebbe migliorare la performance con le ottimizzazioni suggerite (in termini percentuali di occupazione o revenue).

Se non riesci a estrarre abbastanza informazioni dall'HTML, fai comunque un'analisi basata su quello che hai e segnala quali aspetti non hai potuto valutare.`
                },
                {
                    role: 'user',
                    content: `Analizza questo annuncio Airbnb:\n\nURL: ${url}\n\n${listingContext}`
                }
            ],
            max_tokens: 1500,
            temperature: 0.7
        });

        const analysis = completion.choices[0].message.content;

        // Send lead data to Make.com webhook (fire and forget)
        if (nome && email) {
            fetch('https://hook.eu1.make.com/nvj5cnh7fpg78yn9hcmfd93kvzjk3jfz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    cognome: cognome || '',
                    email,
                    telefono: telefono || '',
                    airbnb_url: url,
                    tipo_form: 'analisi_annuncio_ai'
                })
            }).catch(() => {});
        }

        return res.status(200).json({ analysis });

    } catch (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({ error: 'Errore durante l\'analisi. Riprova tra qualche secondo.' });
    }
}

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

        // Extract images from HTML
        const imageUrls = new Set();

        // OG images
        const ogImages = html.matchAll(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/gi);
        for (const m of ogImages) imageUrls.add(m[1]);

        // Twitter images
        const twitterImages = html.matchAll(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/gi);
        for (const m of twitterImages) imageUrls.add(m[1]);

        // Airbnb image URLs from muscache CDN (common pattern in their HTML/JSON)
        const muscacheImages = html.matchAll(/https:\/\/a0\.muscache\.com\/im\/pictures\/[^"'\s,)}]+/g);
        for (const m of muscacheImages) {
            const imgUrl = m[0].replace(/\\u002F/g, '/');
            if (!imgUrl.includes('error_pages')) imageUrls.add(imgUrl);
        }

        // Also try other Airbnb CDN patterns
        const cdnImages = html.matchAll(/https:\/\/a0\.muscache\.com\/[^"'\s,)}]*\.(?:jpg|jpeg|png|webp)[^"'\s,)}]*/gi);
        for (const m of cdnImages) {
            if (!m[0].includes('error_pages')) imageUrls.add(m[0]);
        }

        const images = [...imageUrls].slice(0, 5); // Max 5 images for analysis

        // Extract price info
        let priceInfo = '';
        // Try JSON-LD
        const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
        for (const m of jsonLdMatches) {
            try {
                const data = JSON.parse(m[1]);
                if (data['@type'] === 'Product' || data['@type'] === 'LodgingBusiness' || data['@type'] === 'Hotel') {
                    if (data.offers) {
                        priceInfo = `Prezzo: ${data.offers.price || data.offers.lowPrice || ''} ${data.offers.priceCurrency || 'EUR'}`;
                    }
                }
                if (data.priceRange) {
                    priceInfo = `Range prezzo: ${data.priceRange}`;
                }
            } catch (e) { /* skip invalid JSON */ }
        }

        // Try to find price in text patterns
        if (!priceInfo) {
            const pricePatterns = [
                /(\d{2,4})\s*€\s*(?:a |per )?notte/i,
                /€\s*(\d{2,4})\s*(?:a |per )?notte/i,
                /prezzo[^€]*€\s*(\d{2,4})/i,
                /(\d{2,4})\s*EUR/i,
            ];
            for (const pattern of pricePatterns) {
                const match = html.match(pattern);
                if (match) {
                    priceInfo = `Prezzo trovato nel testo: €${match[1]} a notte`;
                    break;
                }
            }
        }

        // Extract text from body, strip tags
        let bodyText = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 8000);

        const listingContext = [
            titleMatch ? `Titolo: ${titleMatch[1]}` : '',
            ogTitleMatch ? `OG Title: ${ogTitleMatch[1]}` : '',
            metaDescMatch ? `Meta Description: ${metaDescMatch[1]}` : '',
            ogDescMatch ? `OG Description: ${ogDescMatch[1]}` : '',
            priceInfo || '',
            images.length > 0 ? `\nNumero foto trovate: ${imageUrls.size}` : '',
            `\nContenuto pagina (estratto):\n${bodyText}`
        ].filter(Boolean).join('\n');

        // Build messages with vision if we have images
        const userContent = [];

        userContent.push({
            type: 'text',
            text: `Analizza questo annuncio Airbnb:\n\nURL: ${url}\n\n${listingContext}`
        });

        // Add images for GPT-4o vision analysis
        for (const imgUrl of images) {
            userContent.push({
                type: 'image_url',
                image_url: { url: imgUrl, detail: 'low' }
            });
        }

        const hasImages = images.length > 0;
        const hasPrice = !!priceInfo;

        const systemPrompt = `Sei un esperto di property management e affitti brevi in Italia, specializzato in ottimizzazione annunci Airbnb. Analizza l'annuncio fornito e dai un audit dettagliato ma pratico. Rispondi SEMPRE in italiano. Usa un tono professionale ma accessibile.

${hasImages ? 'Ti vengono fornite le foto dell\'annuncio: analizzale attentamente per qualità, composizione, luminosità, staging e appeal visivo.' : ''}

Struttura la risposta esattamente così (usa questi titoli con ##):

## Punteggio Generale
Dai un voto da 1 a 10 e una riga di commento.

## Titolo dell'Annuncio
Analizza il titolo: è accattivante? Contiene parole chiave? Suggerisci una versione migliorata.

## Descrizione
Valuta: è completa? Vende l'esperienza o solo l'immobile? Mancano informazioni importanti?

## Analisi Fotografica
${hasImages ? 'Analizza le foto fornite: qualità dell\'immagine, luminosità, composizione, home staging, ordine. Cosa funziona e cosa migliorare. Sii specifico su ogni foto.' : 'Non è stato possibile recuperare le foto dall\'annuncio. Consiglia comunque le best practice fotografiche per annunci Airbnb nella zona.'}

## Pricing e Posizionamento
${hasPrice ? 'Analizza il prezzo trovato rispetto al mercato e al tipo di proprietà.' : 'Non è stato possibile estrarre il prezzo dall\'annuncio. Fornisci indicazioni generali su come posizionarsi nel mercato locale basandoti sulle caratteristiche della proprietà.'}

## 3 Miglioramenti Immediati
Lista numerata dei 3 cambiamenti più impattanti che il proprietario può fare subito.

## Potenziale Inespresso
Stima di quanto potrebbe migliorare la performance con le ottimizzazioni suggerite (in termini percentuali di occupazione o revenue).

IMPORTANTE: Non dire mai "non ho potuto analizzare" o "non sono disponibili informazioni". Dai sempre consigli concreti e utili basati su quello che vedi. Se hai le foto, analizzale nel dettaglio. Se non le hai, dai consigli pratici specifici per il tipo di proprietà.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
            ],
            max_tokens: 2000,
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

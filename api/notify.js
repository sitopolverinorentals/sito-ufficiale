import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { nome, cognome, email, telefono, zona, airbnb_url, tipo_form } = req.body;

    if (!nome || !email) {
        return res.status(400).json({ error: 'Dati mancanti.' });
    }

    const isAnalisiAnnuncio = tipo_form === 'analisi_annuncio';

    const subject = isAnalisiAnnuncio
        ? `🔍 Nuovo lead Analisi Annuncio — ${nome} ${cognome || ''}`
        : `📊 Nuovo lead Analisi Rendita — ${nome} ${cognome || ''}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                ${isAnalisiAnnuncio ? '🔍 Analisi Annuncio AI' : '📊 Analisi Rendita Gratuita'}
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Nome</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${nome} ${cognome || ''}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Email</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Telefono</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;"><a href="tel:${telefono || ''}">${telefono || 'Non fornito'}</a></td>
                </tr>
                ${zona ? `<tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Zona</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${zona}</td>
                </tr>` : ''}
                ${airbnb_url ? `<tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Link Airbnb</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;"><a href="${airbnb_url}">${airbnb_url}</a></td>
                </tr>` : ''}
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Fonte</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${isAnalisiAnnuncio ? 'Landing Analisi Annuncio AI' : 'Landing Analisi Rendita'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; font-weight: bold; color: #333;">Data</td>
                    <td style="padding: 10px; color: #555;">${new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</td>
                </tr>
            </table>
        </div>
    `;

    try {
        await resend.emails.send({
            from: 'Polverino Rentals <onboarding@resend.dev>',
            to: 'pasquipolverino@gmail.com',
            subject,
            html: htmlContent,
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Resend error:', error);
        return res.status(500).json({ error: 'Errore invio email.' });
    }
}

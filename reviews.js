// Recensioni condivise tra tutte le pagine
const reviews = [
    {
        name: "Marco R.",
        location: "Appartamento 75mq, Centro Storico Firenze",
        detail: "Cliente da 8 mesi",
        text: "Prima gestivo tutto da solo e il mio appartamento rendeva circa 15.000€ l'anno. Dopo 6 mesi con Polverino Rentals siamo arrivati a 22.000€, e io non devo più fare assolutamente nulla. Avrei dovuto farlo anni fa!",
        rating: 5
    },
    {
        name: "Silvia M.",
        location: "Villa 150mq, Versilia",
        detail: "Cliente da 1 anno",
        text: "Finalmente posso godermi le vacanze senza pensare alle prenotazioni. Il servizio è impeccabile, i pagamenti arrivano puntuali e la comunicazione è sempre chiara. Non tornerei mai a gestire da solo.",
        rating: 5
    },
    {
        name: "Andrea T.",
        location: "Bilocale 55mq, Bologna Centro",
        detail: "Cliente da 5 mesi",
        text: "Quando ho ereditato l'appartamento dei miei genitori non sapevo da dove iniziare. Polverino Rentals si è occupato di tutto: dalle foto ai mobili, dalla promozione alla gestione. Ora è una fonte di reddito stabile e affidabile.",
        rating: 5
    },
    {
        name: "Francesca L.",
        location: "Attico 120mq, Milano Porta Romana",
        detail: "Cliente da 2 anni",
        text: "Professionalità al top. Ogni mese ricevo un report dettagliato con tutte le entrate e le uscite. La mia proprietà è sempre in ordine perfetto e gli ospiti lasciano recensioni eccellenti. Servizio che vale ogni centesimo.",
        rating: 5
    },
    {
        name: "Roberto P.",
        location: "Casa Vacanze 90mq, Cinque Terre",
        detail: "Cliente da 10 mesi",
        text: "Ho provato altre agenzie prima, ma nessuna è paragonabile a Polverino Rentals. La differenza sta nell'attenzione ai dettagli e nella disponibilità. Quando ho bisogno di qualcosa, rispondono sempre in pochi minuti.",
        rating: 5
    },
    {
        name: "Davide S.",
        location: "Trilocale 85mq, Firenze San Lorenzo",
        detail: "Cliente da 6 mesi",
        text: "Avevo paura di affidare il mio immobile a terzi, ma è stata la decisione migliore che potessi prendere. La proprietà rende il doppio e io ho recuperato il mio tempo libero. Consigliatissimo!",
        rating: 5
    }
];

// Funzione per generare le stelle
function generateStars(rating) {
    return '⭐'.repeat(rating);
}

// Funzione per renderizzare le recensioni (per homepage con quote mark)
function renderReviewsWithQuote(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const reviewsHTML = reviews.map(review => `
        <div class="review-card">
            <div class="quote-mark">"</div>
            <div class="review-stars">★★★★★</div>
            <p class="review-text">${review.text}</p>
            <div class="review-author">${review.name}</div>
            <div class="review-role">${review.location} • ${review.detail}</div>
        </div>
    `).join('');

    container.innerHTML = reviewsHTML;
}

// Funzione per renderizzare le recensioni (versione semplice per thank-you page)
function renderReviews(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const reviewsHTML = reviews.slice(0, 3).map(review => `
        <div class="review-card">
            <div class="review-stars">${generateStars(review.rating)}</div>
            <p class="review-text">"${review.text}"</p>
            <div class="review-author">
                <strong>${review.name}</strong>
                <span>${review.location}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = reviewsHTML;
}

// Funzione per renderizzare il carousel mobile (homepage)
function renderMobileCarousel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const reviewsHTML = reviews.map((review, index) => `
        <div class="review-card-wrapper ${index === 0 ? 'active' : ''}">
            <div class="review-card">
                <div class="quote-mark">"</div>
                <div class="review-stars">★★★★★</div>
                <p class="review-text">${review.text}</p>
                <div class="review-author">${review.name}</div>
                <div class="review-role">${review.location} • ${review.detail}</div>
            </div>
        </div>
    `).join('');

    container.innerHTML = reviewsHTML;
}

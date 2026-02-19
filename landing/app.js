/* ============================================
   Polverino Rentals – Landing Page JS
   Vanilla JS: validation, gating, FAQ, scroll
   ============================================ */

(function () {
    'use strict';

    /* ---------- Smooth scroll ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                var offset = document.querySelector('.navbar').offsetHeight + 20;
                var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    /* ---------- FAQ Accordion ---------- */
    document.querySelectorAll('.faq-question').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var item = this.parentElement;
            var isOpen = item.classList.contains('open');
            // Close all
            document.querySelectorAll('.faq-item').forEach(function (i) {
                i.classList.remove('open');
                i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });
            // Toggle current
            if (!isOpen) {
                item.classList.add('open');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });

    /* ---------- Lead gating ---------- */
    var form = document.getElementById('leadForm');
    var submitBtn = document.getElementById('submitBtn');
    var gateOwner = document.getElementById('gateOwner');
    var gateTiming = document.getElementById('gateTiming');

    function checkGating() {
        var ownerNo = document.querySelector('input[name="proprietario"][value="no"]');
        var timingSelect = document.getElementById('tempistica');
        var blocked = false;

        // Check proprietario
        if (ownerNo && ownerNo.checked) {
            gateOwner.classList.add('visible');
            blocked = true;
        } else {
            gateOwner.classList.remove('visible');
        }

        // Check tempistica
        if (timingSelect && timingSelect.value === 'solo_informativo') {
            gateTiming.classList.add('visible');
            blocked = true;
        } else {
            gateTiming.classList.remove('visible');
        }

        submitBtn.disabled = blocked;
        return !blocked;
    }

    // Bind gating listeners
    document.querySelectorAll('input[name="proprietario"]').forEach(function (radio) {
        radio.addEventListener('change', checkGating);
    });

    var tempistica = document.getElementById('tempistica');
    if (tempistica) {
        tempistica.addEventListener('change', checkGating);
    }

    /* ---------- Validation ---------- */
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePhone(phone) {
        var digits = phone.replace(/\D/g, '');
        return digits.length >= 8;
    }

    function clearErrors() {
        form.querySelectorAll('.form-group').forEach(function (g) {
            g.classList.remove('error');
        });
    }

    function showError(fieldId, message) {
        var field = document.getElementById(fieldId);
        if (!field) return;
        var group = field.closest('.form-group');
        if (group) {
            group.classList.add('error');
            var errEl = group.querySelector('.error-text');
            if (errEl) errEl.textContent = message;
        }
    }

    /* ---------- Form submit ---------- */
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            clearErrors();

            if (!checkGating()) return;

            var valid = true;

            // Nome
            var nome = document.getElementById('nome').value.trim();
            if (!nome) { showError('nome', 'Inserisci nome e cognome'); valid = false; }

            // Telefono
            var tel = document.getElementById('telefono').value.trim();
            if (!validatePhone(tel)) { showError('telefono', 'Inserisci un numero valido (min 8 cifre)'); valid = false; }

            // Email
            var email = document.getElementById('email').value.trim();
            if (!validateEmail(email)) { showError('email', 'Inserisci un\'email valida'); valid = false; }

            // Proprietario
            var propSi = document.querySelector('input[name="proprietario"][value="si"]');
            if (!propSi || !propSi.checked) {
                var propNo = document.querySelector('input[name="proprietario"][value="no"]');
                if (!propNo || !propNo.checked) {
                    showError('propSi', 'Seleziona una risposta');
                    valid = false;
                }
            }

            // Comune
            var comune = document.getElementById('comune').value.trim();
            if (!comune) { showError('comune', 'Inserisci il comune/zona'); valid = false; }

            // Tipologia
            var tipologia = document.getElementById('tipologia').value;
            if (!tipologia) { showError('tipologia', 'Seleziona la tipologia'); valid = false; }

            // Stato immobile
            var stato = document.getElementById('stato').value;
            if (!stato) { showError('stato', 'Seleziona lo stato'); valid = false; }

            // Reddito
            var reddito = document.getElementById('reddito').value;
            if (!reddito) { showError('reddito', 'Seleziona il reddito stimato'); valid = false; }

            // Tempistica
            var temp = document.getElementById('tempistica').value;
            if (!temp) { showError('tempistica', 'Seleziona la tempistica'); valid = false; }

            // Disponibilita
            var dispo = document.getElementById('disponibilita').value;
            if (!dispo) { showError('disponibilita', 'Seleziona la disponibilità'); valid = false; }

            // Privacy
            var privacy = document.getElementById('privacy');
            if (!privacy.checked) {
                var pg = privacy.closest('.checkbox-group');
                if (pg) pg.style.outline = '2px solid ' + getComputedStyle(document.documentElement).getPropertyValue('--danger');
                valid = false;
            }

            if (!valid) return;

            // Collect data
            var data = {
                nome: nome,
                telefono: tel,
                email: email,
                proprietario: document.querySelector('input[name="proprietario"]:checked').value,
                comune: comune,
                tipologia: tipologia,
                stato: stato,
                reddito: reddito,
                tempistica: temp,
                disponibilita: dispo,
                tipo_form: 'landing_qualificazione'
            };

            console.log('Lead qualificato:', data);

            // Invia al webhook
            fetch('https://hook.eu1.make.com/nvj5cnh7fpg78yn9hcmfd93kvzjk3jfz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(function (err) {
                console.error('Errore invio:', err);
            });

            // Show modal
            document.getElementById('successModal').classList.add('active');
            form.reset();
            submitBtn.disabled = false;
            gateOwner.classList.remove('visible');
            gateTiming.classList.remove('visible');
        });
    }

    /* ---------- Modal close ---------- */
    var modal = document.getElementById('successModal');
    if (modal) {
        modal.querySelector('.modal-close').addEventListener('click', function () {
            modal.classList.remove('active');
        });
        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

})();

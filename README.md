# sito-upgoldacquisizioni

Questo repository contiene un sito statico (index.html + immagini). Qui trovi le istruzioni per mettere il progetto su GitHub e deployarlo con Vercel.

Prerequisiti (opzionali ma consigliati):
- git
- GitHub account
- (opzionale) GitHub CLI `gh`
- (opzionale) Vercel account e CLI `vercel` (npm i -g vercel)

1) Preparare il repo locale

Dal terminale (shell: zsh) nella cartella del progetto esegui:

```bash
# inizializza (se non già fatto)
git init
# aggiungi tutto e fai il primo commit
git add .
git commit -m "Initial commit"
```

2) Creare il repository GitHub e pushare (due opzioni)

Opzione A — con GitHub CLI (consigliata se hai gh configurato):

```bash
# crea repository pubblico e collega remote
gh repo create NOME_REPO --public --source=. --remote=origin --push
```

Opzione B — manuale via web:
- Vai su https://github.com/new e crea un nuovo repository.
- Copia l'URL remoto (es: git@github.com:tuo-utente/tuo-repo.git) e poi esegui:

```bash
git remote add origin <URL_REMOTO>
git branch -M main
git push -u origin main
```

3) Deploy su Vercel

Opzione A — con interfaccia web (più semplice):
- Accedi a https://vercel.com, scegli "Import Project" -> GitHub -> seleziona il repository -> Deploy.

Opzione B — con Vercel CLI:

```bash
# collega il progetto al tuo account/organizzazione e fai deploy
vercel
# per deploy in produzione
vercel --prod
```

Note su `vercel.json`:
- Questo repository contiene `vercel.json` configurato per servire `index.html` e le immagini come sito statico.

Se vuoi che io crei il repository GitHub per te (se mi dai il nome desiderato) o proceda con altre modifiche, dimmi come preferisci procedere.

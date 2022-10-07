# Reactive Weather

Refaktoriere deine [Wetter-App](../../js/02_weather/) zu einer React-App. Dabei ist prinzipiell egal auf welche Weise du deinen Workspace verwaltest und erstellst. Wir empfehlen dir mit dem [typescript react-template von vite](https://vitejs.dev/guide/#scaffolding-your-first-vite-project) zu beginnen.

## Challenge

Neben des `Umzugs` der Wetter App in React ist es zudem Teil der Aufgabe, einen `useFetch` hook zu schreiben, welcher folgende Anforderungen erfüllt:

- Dem Hook kann eine `url: string` und `options: RequestInit` übergeben werden.
- Der Hook gibt die Daten der Response oder den übermittelten Fehler (wenn es sie gibt) und Statusinformationen zurück (loading, success, error).
- Bonus: Der Hook cached die Response von Anfragen auf eine beliebige Url
- Bonus: Verhindere, dass der state innerhalb des Hooks geupdated wird, nachdem eine Komponente unmounted wird

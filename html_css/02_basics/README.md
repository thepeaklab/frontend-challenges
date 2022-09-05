# Basics

## Boilerplate

```html
<!DOCTYPE html> 
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hello-World News</title>
    </head>
    <body>
        hello world
    </body>
</html>
```

Hier siehst du eine erweiterte Version des Boilerplate-Codes der vorherigen Challenge. Neben neuen Abschnitts Tags wie `head`, `meta` und `title` kannst du hier das [`doctype`](https://www.w3schools.com/TAgs/tag_doctype.asp) Tag finden. Mit diesem besonderen Tag ohne schließendem Element kannst du dem Browser mitteilen welchen Dokumenten-Typ du verwendest. Für ältere Versionen von HTML (bspw. HTML 4.01: `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">`) war die Deklaration etwas komplexer, doch seit HTML 5 musst du dir nur merken jede HTML-Datei mit `<!DOCTYPE html>` zu beginnen.

Im Abschnitt des ([`head`](https://www.w3schools.com/TAgs/tag_head.asp)), welcher immer zwischen `html`und `body` stehen muss, kannst du die Metadaten der Website definieren. Hier im Beispiel sind die aus unserer Sicht minmalen Angaben bereits ergänzt.
Mit dem meta Tag charset utf-8 setzen wir die Character Dekodierung auf den am verbreitesten Standard.
Das meta Tag `name=viewport` gibt uns die Möglichkeit die Dokumenten-Breite mit den Geräte-Breite gleichzusetzten. Dies ist ein Abweichen vom Browser-Standardverhalten welches mobile Endgeräte noch nicht bedenkt und bei kleiner Anzeige ein breiteres Dokument mit horizontalem Scrollen bereitstellt.

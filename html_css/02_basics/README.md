# Basics

## Doctype & Head

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
Mit dem meta Tag charset utf-8 setzen wir die Character Dekodierung auf den verbreitesten Standard.
Das meta Tag `name=viewport` gibt uns die Möglichkeit die Dokumenten-Breite mit den Geräte-Breite gleichzusetzten. Dies ist ein Abweichen vom Browser-Standardverhalten welches mobile Endgeräte noch nicht bedenkt und bei kleiner Anzeige ein breiteres Dokument mit horizontalem Scrollen bereitstellt.

### Challenge 1

Ergänze den [] Doctype sowie den [] Head in deiner `Hello-World` Webseite aus der vorherigen Challenge. (Falls du erst mit dieser Challenge einsteigst haben wir dir [hier](index.html) eine Lösung für dich vorbereitet)

## Style/CSS

### CSS Basics

Um Anpassungen an der Standartdarstellung vorzunehmen kannst du HTML-Tags mit CSS-Styles/Rules versehen. [CSS steht für Cascading-Style-Sheet](https://developer.mozilla.org/en-US/docs/Glossary/CSS) -  Hierzu kannst du das _Style-Sheet_ auf unterschiedliche Weisen dem Browser zur Verfügung stellen. Die für uns hier unkomplizierteste ist das Öffnen eines Style-Tags im `head`.

```html
<style>
    /* style goes here */
</style>
```

Innerhalb des Style-Tags kannst du nun CSS-Rules definieren. Eine CSS-Rule besteht aus einem Selector und einer Declaration (welche wiederum aus einer Property und einer zugewiesenen Value besteht). Der Selector kann ein Tag-Typ selbst sein, wie z.B. `p`, `h1`, `section`... Allerdings empfehlen wir dir allen Tags die du mit Styles versehen willst einen Klassennamen Attribut `class=""` zu verleihen.

```html
<div class="content">
    ...
</div>
```

Denn Attribute können ebenfalls als Selector genutzt werden und entkoppeln deine Styles vom Tag-Typ der sich unter Umständen später noch einmal ändern kann. Klassennamen werden mit einem vorangehenden `.` versehen, ID's mit einer `#` und belibige andere Attribute wie z.B. `data-attr="test"` sind ebenfalls möglich `[data-attr="test"]`. Dem Selector folgen innerhalb `{}` dann die Declarations (min. eine). [Style Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference#index) einer Declaration gibt es zahlreiche. Wie ihre spezifische `Value` angegeben wird solltest du zu Begin nachschlagen. Die `width` beispielsweise kann in `px`, `em`, `rem`, `vh` und `%` angegeben werden, akzeptiert jedoch auch spezifische angaben wie `max-content` usw. hier gilt es ein Rabbithole an Möglichkeiten zu erkunden.

```css
.content {
    max-width: 480px;
}
```

#### Challenge 2

Informiere dich über mögliche Declarations und Style das [hier](index.html) vorbereitete Markup. ⚠️ Versuche ohne das Markup zu verändern die Styles aus dem folgenden Bild zu erreichen.

![Webseite](website-styled.png "Hello-World Webseite")

### Positioning

#### Challenge 3

Für diese Challenge musst du das Markup verändern. Füge einen Header mit Logo und Navigation hinzu. Zentriere den Inhalt des Headers und achte auf das Scrollverhalten im Beispiel.

![Webseite](website-styled-scrolling.gif "Hello-World Webseite")

### Media Queries

```css
@media screen and (min-width: 768px) {
    /* desktop styles */
}
```

#### Challenge 4

Verändere dein Stylesheet, Ziel ist es mit der oben erläuterten Media Query alle Desktop spezifischen Declarations zur Ausnahmeregelung für große Bildschirmgrößen zu machen.

![Webseite](website-mobile.gif "Hello-World Webseite")

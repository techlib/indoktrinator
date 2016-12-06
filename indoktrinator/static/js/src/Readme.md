#Lokalizace webu

Použitý package:

`react-intl`

Všechny texty na webu by se měly zapisovat pomocí:

1. FormattedMessage
2. FormattedHtmlMessage
3. FormattedRelative
4. ...

Dokumentace https://github.com/AlexJozwicki/react-intl-es6 a https://github.com/yahoo/react-intl/.

Example:

```
import {FormattedMessage} from 'react-intl';

<FormattedMessage
	id="app.menu.brand.name"
	description="Brand name"
	defaultMessage="Indoktrinator"
/>
```

Konvence:

buttons:

	app.buttons.<action>

items:

    app.menu.<name>.title	[device, devices, playlist, playlists.. ]
	app.menu.<name>.link
    ...

popups:

	app.popups.<action>
...


##Změna přiložených messages

1. Vytvořit prázdné ( { } ) json soubory `cz.json` a `en-US.json` ve složce `dist/lang`.
2. Pomocí příkazu `npm run generate-lang-files` vygenerovat všechny překlady z projektu do souborů roztříděných podle struktury projektu
3. Pomocí příkazu z npm `npm run export-messages` vygenerování jazykových souborů pro vyjmenované lokalizace (en, cz, ..) z předgenerovaných souborů z kroku 2.

Možné problémy:

1. Při provádění bodu 2. doplňit stage-0 -> 1 do souboru `.babelrc`
2. Při provádění bodu 2. smazat načítání souborů pomocí `json-loaderu` v komponentě `App.jsx`
3. Při provádění bodu 2. ignorovat `node-modules`

#Formáty pro zobrazování údajů

##DateTime

```
import {datetimeToString} from '../util/datetime';

{datetimeToString('2013-02-08T09:30:26Z', 'en-US')}

// Result: February 8, 2013 10:30 AM

```

##Date

```
import {dateToString} from '../util/datetime';

{dateToString('2013-02-08')}

// Result: 2013-02-08

```

##Duration

```
import {secondsToString} from '../util/datetime';

{secondsToString(553535)}

// Result: 53:45:35
```

##WeekDay

```
import {intDayToString, stringDayToInt} from '../util/datetime';

{intDayToString(0, 'en-US')}

// Result: Monday

{stringDayToInt("Monday, 'en-US')}

// Result: 0

```

##WeekDays

```
import {getWeekDays} from '../util/datetime';

{getWeekDays('en-US)}

// Result ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
```

#Formulářové komponenty

##Použitý select (day, device, playlist picker} - DEPRECATED

Doc: https://github.com/quri/react-bootstrap-datetimepicker

Example:

```
handleChange() {
    ...
},

<BootstrapSelect
    onChange={..}
    value={..} >
    <WeekDayOptions />
</BootstrapSelect>

var WeekDayOptions = react.createClass({

    render: function() {

        var days = {getWeekDays('en-US')},
            options = function(day) {
            return <option>{day}</option>;
        };

        return <select>{days.map(options)}</select>;
    }
};
```

##Navrhovaný select (klip)

Použitá komponenta [react-select](http://jedwatson.github.io/react-select/)

Filtrování video/image řešit pomocí radio buttonů (viz. první example). Filtrování podle klíče komponenta podporuje.

##DateTimeField (Time, DateTime)

```
<DateTimeField
    onChange={...}
    format='{...}'
    inputFormat='YYYY-MM-DDThh:mm:ss'
    dateTime={...}
/>

<DateTimeField
    onChange={...}
    format='{...}'
    inputFormat='hh:mm:ss'
    dateTime={...}
/>
```


##Drag and drop grid (Zobrazení programu, jeho segmentů, playlistů, mimořádných vstupů, klipů)

Navrhovan8 komponenta [react-drag-and-drop](https://strml.github.io/react-grid-layout/examples/0-showcase.html):

Umožnuje:

1. měnit délku playlistu
2. pozici playlistu
3. zamknout již přehrané / přehrávané playlisty nebo případně nevytvořené uživatelem

Navrhované řešení:

1. na dané stránce programu umožnit měnit jeho název a zobrazit naplánované playlisty a mimořádné vstupy na daný týden (možnost elementy posouvat, mazat, editovat, přidávat z připravených)
2. při kliknutí na daný element typu segment přesměrování na detail playlistu

Detail playlistu:

1. zobrazení klipů které má a které klipy může mít (umožnit drag and drop přesouvání) - zobrazení ve dvou sloupcích pomocí komponenty [react-dnd](http://gaearon.github.io/react-dnd/docs-drag-source.html):

Detail mimořádného vstupu:

1. zobrazení nastavených hodnot včetně použitého playlistu

#Procházení

V menu zobrazit i položku pro mimořádné vstupy - list (řazeno podle začátku spuštění), edit

#Akce u komponent

```
handleAction(e) {
    ...
};
```


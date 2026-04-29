/** Seed Turtle for the item schema Oxigraph store when localStorage is empty. */
export const exampleDataTurtle = `
    PREFIX : <http://www.example.org/>
    PREFIX ex: <http://www.example.org/example/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    # ═══════════════════════════════════════════════════════════════════════════
    # Tags — kurze deutschsprachige Schlagwörter
    # ═══════════════════════════════════════════════════════════════════════════

    ex:tag-gebraucht a :Tag ;
      :name "Gebraucht" ;
      :description "Geprüfte Occasionen mit Probegarantie." ;
      :image "/items/student-violin.jpg" .

    ex:tag-neu a :Tag ;
      :name "Neuware" ;
      :description "Unbenutzt, originalverpackt oder Vorführmodell." ;
      :image "/items/blister-pack.jpg" .

    ex:tag-profi a :Tag ;
      :name "Profi" ;
      :description "Für Bühne, Studio oder Unterricht auf hohem Niveau." ;
      :image "/items/orchestra-concert-hall.jpg" .

    ex:tag-einsteiger a :Tag ;
      :name "Einsteiger" ;
      :description "Ideal für den Unterrichtsbeginn." ;
      :image "/items/youth-orchestra.jpg" .

    ex:tag-akustik a :Tag ;
      :name "Akustik" ;
      :description "Akustische Instrumente ohne eingebaute Elektronik." ;
      :image "/items/acoustic-guitar.jpg" .

    ex:tag-digital a :Tag ;
      :name "Digital" ;
      :description "Mit Tonerzeugung oder Effekten digital." ;
      :image "/items/digital-piano-clavinova.jpg" .

    ex:tag-hamburg a :Tag ;
      :name "Abholung Hamburg" ;
      :description "Abholung in unserer Filiale möglich." ;
      :image "/items/hamburg-skyline.jpg" .

    ex:tag-versand-frei a :Tag ;
      :name "Versandkostenfrei" ;
      :description "Innerhalb DE ab 49 € Bestellwert." ;
      :image "/items/cardboard-box.jpg" .

    # ═══════════════════════════════════════════════════════════════════════════
    # Kategorien — Hierarchie unter „Instrumente und Instrumentenbedarf“
    #   Instrumente und Instrumentenbedarf
    #   ├── Streichinstrumente → Violinen & Bratschen
    #   ├── Blasinstrumente → Holzblasinstrumente
    #   ├── Tasteninstrumente
    #   ├── Schlagwerk & Becken
    #   └── Zubehör → Saiten & Pflege · Notenpulte & Ständer
    # ═══════════════════════════════════════════════════════════════════════════

    ex:cat-instrumente-root a :Category ;
      :name "Instrumente und Instrumentenbedarf" ;
      :description
        "Alles von der ersten Geige bis zum Notenpult — für Orchester, Band und Daheim." ;
      :image "/items/orchestra-1917.jpg" ;
      :basePrice "0"^^xsd:integer .

    ex:cat-streichinstrumente a :Category ;
      :name "Streichinstrumente" ;
      :description "Geigenfamilie, Kontrabass und historische Streicher." ;
      :image "/items/violin-vl100.jpg" ;
      :basePrice "0"^^xsd:integer ;
      :parentCategory ex:cat-instrumente-root .

    ex:cat-violinen-bratschen a :Category ;
      :name "Violinen & Bratschen" ;
      :description "4/4 und fraktionierte Größen, auch für kleine Hände." ;
      :image "/items/violin-alexander-met.jpg" ;
      :basePrice "19900"^^xsd:integer ;
      :parentCategory ex:cat-streichinstrumente .

    ex:cat-blasinstrumente a :Category ;
      :name "Blasinstrumente" ;
      :description "Blech, Holz und Mundharmonika — vom Einsteiger bis zur Profi-Klasse." ;
      :image "/items/wind-instruments-museum.jpg" ;
      :basePrice "0"^^xsd:integer ;
      :parentCategory ex:cat-instrumente-root .

    ex:cat-holzblas a :Category ;
      :name "Holzblasinstrumente" ;
      :description "Klarinetten, Oboen, Fagotte und Saxophone." ;
      :image "/items/clarinet-001.jpg" ;
      :basePrice "8900"^^xsd:integer ;
      :parentCategory ex:cat-blasinstrumente .

    ex:cat-tasteninstrumente a :Category ;
      :name "Tasteninstrumente" ;
      :description "Klavier, E-Piano, Keyboard und Orgel." ;
      :image "/items/yamaha-p125.jpg" ;
      :basePrice "0"^^xsd:integer ;
      :parentCategory ex:cat-instrumente-root .

    ex:cat-schlagwerk a :Category ;
      :name "Schlagwerk & Becken" ;
      :description "Becken, Sticks, Practice Pads und kleines Percussion." ;
      :image "/items/crash-zildjian-14.jpg" ;
      :basePrice "1200"^^xsd:integer ;
      :parentCategory ex:cat-instrumente-root .

    ex:cat-zubehoer a :Category ;
      :name "Zubehör & Pflege" ;
      :description "Saiten, Kolofonium, Kabel, Taschen und Pflegemittel." ;
      :image "/items/violin-cord-rosin-grains.jpg" ;
      :basePrice "0"^^xsd:integer ;
      :parentCategory ex:cat-instrumente-root .

    ex:cat-saiten-pflege a :Category ;
      :name "Saiten & Bogenpflege" ;
      :description "Saitensätze, Kolofonium, Kolofonium-Ersatz und Bogenhaare." ;
      :image "/items/violin-strings-closeup.jpg" ;
      :basePrice "450"^^xsd:integer ;
      :parentCategory ex:cat-zubehoer .

    ex:cat-notenpulte a :Category ;
      :name "Notenpulte & Ständer" ;
      :description "Orchesterpulte, Mikrofonständer, Laptop-Racks." ;
      :image "/items/music-stand-metal.jpg" ;
      :basePrice "1990"^^xsd:integer ;
      :parentCategory ex:cat-zubehoer .

    # ═══════════════════════════════════════════════════════════════════════════
    # Artikel — Beispiele mit Bezug zu Instrumenten & Zubehör
    # ═══════════════════════════════════════════════════════════════════════════

    ex:item-violine-mudenthaler-4-4 a :Item ;
      :name "Violine 4/4 „Mudenthaler“" ;
      :description
        "Handgearbeitete Decke aus Fichte, Boden aus Ahorn — warme, singende Obertöne. " ;
      :condition "Sehr gut — minimale Spielspuren, frisch besaitet." ;
      :basePrice "184900"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :category ex:cat-violinen-bratschen ;
      :photos (
        "/items/violin-vl100.jpg"
        "/items/violin-alexander-met.jpg"
      ) ;
      :tags (
        ex:tag-gebraucht
        ex:tag-profi
        ex:tag-akustik
        ex:tag-hamburg
      ) .

    ex:item-klarinette-buffet-e12 a :Item ;
      :name "Klarinette in B, Buffet Crampon E12" ;
      :description
        "Grenadillholz, deutsche Mechanik — der Klassiker für den Übergang in die Oberstufe." ;
      :condition "Neu — nur für Probesessions ausgepackt." ;
      :basePrice "129900"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :category ex:cat-holzblas ;
      :photos ( "/items/clarinet-001.jpg" ) ;
      :tags (
        ex:tag-neu
        ex:tag-einsteiger
        ex:tag-akustik
        ex:tag-versand-frei
      ) .

    ex:item-epiano-yamaha-p45 a :Item ;
      :name "Digitalpiano Yamaha P-45" ;
      :description
        "88 gewichtete Tasten, eingebaute Lautsprecher — kompakt für Wohnung und Proberaum." ;
      :condition "Neu" ;
      :basePrice "51900"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :category ex:cat-tasteninstrumente ;
      :photos (
        <http://www.example.org/example/media/p45-frontal.webp>
        <http://www.example.org/example/media/p45-anschluesse.webp>
      ) ;
      :tags (
        ex:tag-neu
        ex:tag-einsteiger
        ex:tag-digital
        ex:tag-versand-frei
      ) .

    ex:item-becken-zildjian-a-crash-16 a :Item ;
      :name "Crash-Becken 16″, Zildjian A Custom" ;
      :description
        "Hell, durchsetzungsfähig — für Rock und Pop mit viel Headroom." ;
      :condition "Gebraucht — leichte Oxidation am Rand, kein Riss." ;
      :basePrice "18900"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :category ex:cat-schlagwerk ;
      :photos ( "/items/crash-zildjian-14.jpg" ) ;
      :tags (
        ex:tag-gebraucht
        ex:tag-profi
        ex:tag-hamburg
      ) .

    ex:item-saitensatz-pirastro-oliv a :Item ;
      :name "Saitensatz Violine Pirastro Oliv" ;
      :description "Geschnittene Schafdarmseiten — rund, barock inspiriert." ;
      :condition "Neu, ungeöffnet" ;
      :basePrice "7800"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :parent ex:item-violine-mudenthaler-4-4 ;
      :category ex:cat-saiten-pflege ;
      :photos ( "/items/violin-strings-closeup.jpg" ) ;
      :tags (
        ex:tag-neu
        ex:tag-profi
        ex:tag-akustik
      ) .

    ex:item-kolofonium-andrea a :Item ;
      :name "Kolofonium Andrea Solo" ;
      :description
        "Weiche Packung, weniger Staub — ideal für kühle Proberäume." ;
      :condition "Neu" ;
      :basePrice "2490"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :category ex:cat-saiten-pflege ;
      :photos ( "/items/violin-rosin.jpg" ) ;
      :tags (
        ex:tag-neu
        ex:tag-einsteiger
        ex:tag-akustik
      ) .

    ex:item-notenpult-konig-meyer-10065 a :Item ;
      :name "Notenpult schwarz, König & Meyer 10065" ;
      :description
        "Orchesterpult mit breiter Ablage — stabil, klappbar, mit Tragetasche." ;
      :condition "Neu" ;
      :basePrice "7900"^^xsd:integer ;
      :isAvailable "false"^^xsd:boolean ;
      :category ex:cat-notenpulte ;
      :photos ( "/items/music-stand-metal.jpg" ) ;
      :tags (
        ex:tag-neu
        ex:tag-versand-frei
      ) .

`;

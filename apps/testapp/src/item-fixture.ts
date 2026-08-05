import { publicAssetUrl } from "./publicAssetUrl";
import { assignSkolemIris } from "@graviola/json-schema-utils";

/** Seed Turtle for the item schema Oxigraph store when localStorage is empty. */
const rawItemFixtureTurtle = `
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
    # Artikel — repeated properties (not RDF lists) for multi-valued literals/links
    # ═══════════════════════════════════════════════════════════════════════════

    ex:item-violine-mudenthaler-4-4 a :Item ;
      :name "Violine 4/4 „Mudenthaler“" ;
      :description
        "Handgearbeitete Decke aus Fichte, Boden aus Ahorn — warme, singende Obertöne. " ;
      :condition "Sehr gut — minimale Spielspuren, frisch besaitet." ;
      :basePrice "184900"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :category ex:cat-violinen-bratschen ;
      :photos "/items/violin-vl100.jpg" ;
      :photos "/items/violin-alexander-met.jpg" ;
      :yearCodes "2020"^^xsd:integer ;
      :yearCodes "2024"^^xsd:integer ;
      :tags ex:tag-gebraucht ;
      :tags ex:tag-profi ;
      :tags ex:tag-akustik ;
      :tags ex:tag-hamburg .

    ex:item-klarinette-buffet-e12 a :Item ;
      :name "Klarinette in B, Buffet Crampon E12" ;
      :description
        "Grenadillholz, deutsche Mechanik — der Klassiker für den Übergang in die Oberstufe." ;
      :condition "Neu — nur für Probesessions ausgepackt." ;
      :basePrice "129900"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :category ex:cat-holzblas ;
      :photos "/items/clarinet-001.jpg" ;
      :yearCodes "2023"^^xsd:integer ;
      :tags ex:tag-neu ;
      :tags ex:tag-einsteiger ;
      :tags ex:tag-akustik ;
      :tags ex:tag-versand-frei .

    ex:item-epiano-yamaha-p45 a :Item ;
      :name "Digitalpiano Yamaha P-45" ;
      :description
        "88 gewichtete Tasten, eingebaute Lautsprecher — kompakt für Wohnung und Proberaum." ;
      :condition "Neu" ;
      :basePrice "51900"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :category ex:cat-tasteninstrumente ;
      :photos "/items/yamaha-p125.jpg" ;
      :photos "/items/digital-piano-clavinova.jpg" ;
      :yearCodes "2024"^^xsd:integer ;
      :tags ex:tag-neu ;
      :tags ex:tag-einsteiger ;
      :tags ex:tag-digital ;
      :tags ex:tag-versand-frei .

    ex:item-becken-zildjian-a-crash-16 a :Item ;
      :name "Crash-Becken 16″, Zildjian A Custom" ;
      :description
        "Hell, durchsetzungsfähig — für Rock und Pop mit viel Headroom." ;
      :condition "Gebraucht — leichte Oxidation am Rand, kein Riss." ;
      :basePrice "18900"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :category ex:cat-schlagwerk ;
      :photos "/items/crash-zildjian-14.jpg" ;
      :yearCodes "2019"^^xsd:integer ;
      :tags ex:tag-gebraucht ;
      :tags ex:tag-profi ;
      :tags ex:tag-hamburg .

    ex:item-saitensatz-pirastro-oliv a :Item ;
      :name "Saitensatz Violine Pirastro Oliv" ;
      :description "Geschnittene Schafdarmseiten — rund, barock inspiriert." ;
      :condition "Neu, ungeöffnet" ;
      :basePrice "7800"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :parent ex:item-violine-mudenthaler-4-4 ;
      :category ex:cat-saiten-pflege ;
      :photos "/items/violin-strings-closeup.jpg" ;
      :yearCodes "2025"^^xsd:integer ;
      :tags ex:tag-neu ;
      :tags ex:tag-profi ;
      :tags ex:tag-akustik .

    ex:item-kolofonium-andrea a :Item ;
      :name "Kolofonium Andrea Solo" ;
      :description
        "Weiche Packung, weniger Staub — ideal für kühle Proberäume." ;
      :condition "Neu" ;
      :basePrice "2490"^^xsd:integer ;
      :isAvailable "true"^^xsd:boolean ;
      :category ex:cat-saiten-pflege ;
      :photos "/items/violin-rosin.jpg" ;
      :yearCodes "2022"^^xsd:integer ;
      :tags ex:tag-neu ;
      :tags ex:tag-einsteiger ;
      :tags ex:tag-akustik .

    ex:item-notenpult-konig-meyer-10065 a :Item ;
      :name "Notenpult schwarz, König & Meyer 10065" ;
      :description
        "Orchesterpult mit breiter Ablage — stabil, klappbar, mit Tragetasche." ;
      :condition "Neu" ;
      :basePrice "7900"^^xsd:integer ;
      :isAvailable "false"^^xsd:boolean ;
      :category ex:cat-notenpulte ;
      :photos "/items/music-stand-metal.jpg" ;
      :yearCodes "2021"^^xsd:integer ;
      :tags ex:tag-neu ;
      :tags ex:tag-versand-frei .

`;

type MediaMember = {
  url: string;
  author: string;
  encryption: string;
  copyright: { year: number; notes: string[] };
};

function asset(path: string): string {
  return publicAssetUrl(path.replace(/^\//, ""));
}

function turtleEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Emit media as skolem-IRI nodes (same scheme Prisma uses for child rows).
 * Singular copyright stays a blank node (underscore-flattened in Prisma);
 * notes are repeated literals on that blank node.
 */
function mediaTurtle(itemLocalName: string, members: MediaMember[]): string {
  const rootIri = `http://www.example.org/example/${itemLocalName}`;
  const assigned = assignSkolemIris(rootIri, "media", members);
  const blocks: string[] = [];

  for (const { member, iri } of assigned) {
    const noteTriples = member.copyright.notes
      .map((n) => `\n        :notes "${turtleEscape(n)}" ;`)
      .join("");
    blocks.push(`ex:${itemLocalName} :media <${iri}> .

    <${iri}> :url "${turtleEscape(member.url)}" ;
      :author "${turtleEscape(member.author)}" ;
      :encryption "${turtleEscape(member.encryption)}" ;
      :copyright [
        :year "${member.copyright.year}"^^xsd:integer ;${noteTriples}
      ] .`);
  }
  return blocks.join("\n\n    ");
}

const mediaFixtureTurtle = `
    ${mediaTurtle("item-violine-mudenthaler-4-4", [
      {
        url: asset("items/violin-vl100.jpg"),
        author: "Atelier Mudenthaler",
        encryption: "none",
        copyright: {
          year: 2020,
          notes: ["studio photo", "no commercial reuse"],
        },
      },
      {
        url: asset("items/violin-alexander-met.jpg"),
        author: "Museum photo",
        encryption: "none",
        copyright: {
          year: 2018,
          notes: ["public domain candidate"],
        },
      },
    ])}

    ${mediaTurtle("item-epiano-yamaha-p45", [
      {
        url: asset("items/yamaha-p125.jpg"),
        author: "Yamaha",
        encryption: "none",
        copyright: {
          year: 2024,
          notes: ["product shot"],
        },
      },
    ])}
`;

/** Rewrite `/items/...` paths so they work when the app is deployed under a subpath. */
const baseTurtle = rawItemFixtureTurtle.replace(
  /"(\/items\/[^"]+)"/g,
  (_, path: string) => `"${publicAssetUrl(path.replace(/^\//, ""))}"`,
);

export const exampleDataTurtle = `${baseTurtle}\n${mediaFixtureTurtle}\n`;

export const exampleDataTurtle = `
    PREFIX : <http://www.example.org/>
    PREFIX ex: <http://www.example.org/example/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    # --- Zertifizierungen (named certification nodes) ---

    ex:cert-marcus-9606-mag
      :type "EN ISO 9606-1 MAG" ;
      :number "ZERT-DE-2024-7721" ;
      :validUntil "2028-06-30"^^xsd:date .

    ex:cert-marcus-9606-wig
      :type "EN ISO 9606-1 WIG" ;
      :number "ZERT-DE-2024-7722" ;
      :validUntil "2027-12-15"^^xsd:date .

    ex:cert-sven-9712-ut2
      :type "EN ISO 9712 UT Stufe 2" ;
      :number "NDT-UT-2019-044" ;
      :validUntil "2026-09-01"^^xsd:date .

    # --- Qualitätsprüfungen (named QualityCheck nodes) ---

    ex:qc-88291-a-vt a :QualityCheck ;
      :type "Sichtprüfung" ;
      :result "Bestanden" ;
      :inspector ex:person-julia-wolf ;
      :date "2025-11-19"^^xsd:date ;
      :notes "Nahtbild einwandfrei, Anlauffarben gleichmäßig." .

    ex:qc-88291-a-ut a :QualityCheck ;
      :type "Ultraschallprüfung" ;
      :result "Bestanden" ;
      :inspector ex:person-sven-naumann ;
      :date "2025-11-20"^^xsd:date ;
      :notes "Prüfbereich 100 %, Echoamplituden unter Bewertungsgrenze." .

    ex:qc-88291-b-rt a :QualityCheck ;
      :type "Durchstrahlungsprüfung" ;
      :result "Mit Einschränkungen" ;
      :inspector ex:person-sven-naumann ;
      :date "2025-11-23"^^xsd:date ;
      :notes "Linearer Dichteunterschied 2 mm Länge, Nachprüfung UT geplant." .

    ex:qc-88291-b-hydro a :QualityCheck ;
      :type "Druckprüfung" ;
      :result "Bestanden" ;
      :inspector ex:person-julia-wolf ;
      :date "2025-11-24"^^xsd:date ;
      :notes "Prüfdruck 1,5 × MAWP, keine sichtbaren Undichtigkeiten." .

    # --- Dokumentation (named Documentation nodes) ---

    ex:doc-da12-wps-wig a :Documentation ;
      :type "Schweißanweisung" ;
      :file "wps/WPS-DA12-WIG-S355-v3.pdf" ;
      :date "2025-10-01"^^xsd:date .

    ex:doc-88291-a-ut-report a :Documentation ;
      :type "Prüfbericht" ;
      :file "qc/UT-SN-88291-A-2025-11-20.pdf" ;
      :date "2025-11-20"^^xsd:date .

    ex:doc-88291-b-repair a :Documentation ;
      :type "Reparaturbericht" ;
      :file "rep/REP-SN-88291-B-porosity.pdf" ;
      :date "2025-11-23"^^xsd:date .

    ex:doc-s355-heat-cert a :Documentation ;
      :type "Zertifikat" ;
      :file "cert/MAT-S355J2N-heat-44821.pdf" ;
      :date "2025-09-12"^^xsd:date .

    # --- Mitarbeiter (Person) ---

    ex:person-anna-berg a :Person ;
      :firstName "Anna" ;
      :lastName "Berg" ;
      :employeeId "EMP-2044" ;
      :qualification "Schweißfachingenieur" .

    ex:person-marcus-klein a :Person ;
      :firstName "Marcus" ;
      :lastName "Klein" ;
      :employeeId "EMP-3182" ;
      :qualification "Schweißer" ;
      :certification (
        ex:cert-marcus-9606-mag
        ex:cert-marcus-9606-wig
      ) .

    ex:person-sven-naumann a :Person ;
      :firstName "Sven" ;
      :lastName "Naumann" ;
      :employeeId "EMP-4101" ;
      :qualification "Prüfer" ;
      :certification ( ex:cert-sven-9712-ut2 ) .

    ex:person-julia-wolf a :Person ;
      :firstName "Julia" ;
      :lastName "Wolf" ;
      :employeeId "EMP-5022" ;
      :qualification "Meister" .

    # --- Schweißvorlage (WeldingTemplate) ---

    ex:template-pressure-vessel-da12 a :WeldingTemplate ;
      :name "Druckbehälter Rührwerk DA-12" ;
      :drawingNumber "DWG-2025-PT-0891" ;
      :material "S355J2+N" ;
      :thickness "12"^^xsd:decimal ;
      :weldingProcess "WIG" ;
      :designer ex:person-anna-berg ;
      :weldedComponents (
        ex:component-serial-88291-a
        ex:component-serial-88291-b
      ) .

    # --- Geschweißte Bauteile (WeldedComponent) ---

    ex:component-serial-88291-a a :WeldedComponent ;
      :weldingTemplate ex:template-pressure-vessel-da12 ;
      :uniqueNumber "SN-2025-88291-A" ;
      :partId "PT-DA12-H001" ;
      :weldingDate "2025-11-18"^^xsd:date ;
      :welder ex:person-marcus-klein ;
      :qualityChecks (
        ex:qc-88291-a-vt
        ex:qc-88291-a-ut
      ) ;
      :defects () ;
      :documentation (
        ex:doc-da12-wps-wig
        ex:doc-88291-a-ut-report
      ) .

    ex:component-serial-88291-b a :WeldedComponent ;
      :weldingTemplate ex:template-pressure-vessel-da12 ;
      :uniqueNumber "SN-2025-88291-B" ;
      :partId "PT-DA12-H002" ;
      :material "S355J2+N" ;
      :weldingProcess "MIG/MAG" ;
      :weldingDate "2025-11-22"^^xsd:date ;
      :welder ex:person-marcus-klein ;
      :qualityChecks (
        ex:qc-88291-b-rt
        ex:qc-88291-b-hydro
      ) ;
      :defects (
        [
          a :Defect ;
          :type "Poren" ;
          :location "Root-Lage, Uhr 3–4" ;
          :severity "Mittel" ;
          :status "Behoben" ;
          :repairMethod "Nachschweißen WIG, erneute Sichtprüfung" ;
          :repairDate "2025-11-23"^^xsd:date
        ]
      ) ;
      :documentation (
        ex:doc-88291-b-repair
        ex:doc-s355-heat-cert
      ) .

`;

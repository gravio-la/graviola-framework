/**
 * TBBT (The Big Bang Theory) sample dataset for testing
 *
 * This is a small excerpt from the full tbbt-ld dataset
 * with Schema.org properties
 */

export const tbbtTriples = `
# Leonard Hofstadter
<http://localhost:8080/data/person/leonard-hofstadter> a <http://schema.org/Person> .
<http://localhost:8080/data/person/leonard-hofstadter> <http://schema.org/givenName> "Leonard" .
<http://localhost:8080/data/person/leonard-hofstadter> <http://schema.org/familyName> "Hofstadter" .
<http://localhost:8080/data/person/leonard-hofstadter> <http://schema.org/email> "leonard@caltech.edu" .
<http://localhost:8080/data/person/leonard-hofstadter> <http://schema.org/jobTitle> "Experimental Physicist" .
<http://localhost:8080/data/person/leonard-hofstadter> <http://schema.org/knows> <http://localhost:8080/data/person/sheldon-cooper> .
<http://localhost:8080/data/person/leonard-hofstadter> <http://schema.org/knows> <http://localhost:8080/data/person/penny> .
<http://localhost:8080/data/person/leonard-hofstadter> <http://schema.org/knows> <http://localhost:8080/data/person/howard-wolowitz> .
<http://localhost:8080/data/person/leonard-hofstadter> <http://schema.org/knows> <http://localhost:8080/data/person/raj-koothrappali> .
<http://localhost:8080/data/person/leonard-hofstadter> <http://schema.org/colleague> <http://localhost:8080/data/person/sheldon-cooper> .
<http://localhost:8080/data/person/leonard-hofstadter> <http://schema.org/worksFor> <http://localhost:8080/data/organization/caltech> .

# Sheldon Cooper
<http://localhost:8080/data/person/sheldon-cooper> a <http://schema.org/Person> .
<http://localhost:8080/data/person/sheldon-cooper> <http://schema.org/givenName> "Sheldon" .
<http://localhost:8080/data/person/sheldon-cooper> <http://schema.org/familyName> "Cooper" .
<http://localhost:8080/data/person/sheldon-cooper> <http://schema.org/email> "sheldon@caltech.edu" .
<http://localhost:8080/data/person/sheldon-cooper> <http://schema.org/jobTitle> "Theoretical Physicist" .
<http://localhost:8080/data/person/sheldon-cooper> <http://schema.org/knows> <http://localhost:8080/data/person/leonard-hofstadter> .
<http://localhost:8080/data/person/sheldon-cooper> <http://schema.org/knows> <http://localhost:8080/data/person/penny> .
<http://localhost:8080/data/person/sheldon-cooper> <http://schema.org/knows> <http://localhost:8080/data/person/amy-farrah-fowler> .
<http://localhost:8080/data/person/sheldon-cooper> <http://schema.org/colleague> <http://localhost:8080/data/person/leonard-hofstadter> .
<http://localhost:8080/data/person/sheldon-cooper> <http://schema.org/colleague> <http://localhost:8080/data/person/amy-farrah-fowler> .
<http://localhost:8080/data/person/sheldon-cooper> <http://schema.org/worksFor> <http://localhost:8080/data/organization/caltech> .

# Penny
<http://localhost:8080/data/person/penny> a <http://schema.org/Person> .
<http://localhost:8080/data/person/penny> <http://schema.org/givenName> "Penny" .
<http://localhost:8080/data/person/penny> <http://schema.org/email> "penny@cheesecakefactory.com" .
<http://localhost:8080/data/person/penny> <http://schema.org/jobTitle> "Waitress" .
<http://localhost:8080/data/person/penny> <http://schema.org/knows> <http://localhost:8080/data/person/leonard-hofstadter> .
<http://localhost:8080/data/person/penny> <http://schema.org/knows> <http://localhost:8080/data/person/sheldon-cooper> .

# Howard Wolowitz
<http://localhost:8080/data/person/howard-wolowitz> a <http://schema.org/Person> .
<http://localhost:8080/data/person/howard-wolowitz> <http://schema.org/givenName> "Howard" .
<http://localhost:8080/data/person/howard-wolowitz> <http://schema.org/familyName> "Wolowitz" .
<http://localhost:8080/data/person/howard-wolowitz> <http://schema.org/email> "howard@caltech.edu" .
<http://localhost:8080/data/person/howard-wolowitz> <http://schema.org/jobTitle> "Aerospace Engineer" .
<http://localhost:8080/data/person/howard-wolowitz> <http://schema.org/knows> <http://localhost:8080/data/person/leonard-hofstadter> .
<http://localhost:8080/data/person/howard-wolowitz> <http://schema.org/knows> <http://localhost:8080/data/person/raj-koothrappali> .
<http://localhost:8080/data/person/howard-wolowitz> <http://schema.org/worksFor> <http://localhost:8080/data/organization/caltech> .

# Raj Koothrappali
<http://localhost:8080/data/person/raj-koothrappali> a <http://schema.org/Person> .
<http://localhost:8080/data/person/raj-koothrappali> <http://schema.org/givenName> "Rajesh" .
<http://localhost:8080/data/person/raj-koothrappali> <http://schema.org/familyName> "Koothrappali" .
<http://localhost:8080/data/person/raj-koothrappali> <http://schema.org/email> "raj@caltech.edu" .
<http://localhost:8080/data/person/raj-koothrappali> <http://schema.org/jobTitle> "Astrophysicist" .
<http://localhost:8080/data/person/raj-koothrappali> <http://schema.org/knows> <http://localhost:8080/data/person/leonard-hofstadter> .
<http://localhost:8080/data/person/raj-koothrappali> <http://schema.org/knows> <http://localhost:8080/data/person/howard-wolowitz> .
<http://localhost:8080/data/person/raj-koothrappali> <http://schema.org/worksFor> <http://localhost:8080/data/organization/caltech> .

# Amy Farrah Fowler
<http://localhost:8080/data/person/amy-farrah-fowler> a <http://schema.org/Person> .
<http://localhost:8080/data/person/amy-farrah-fowler> <http://schema.org/givenName> "Amy" .
<http://localhost:8080/data/person/amy-farrah-fowler> <http://schema.org/familyName> "Farrah Fowler" .
<http://localhost:8080/data/person/amy-farrah-fowler> <http://schema.org/email> "amy@university.edu" .
<http://localhost:8080/data/person/amy-farrah-fowler> <http://schema.org/jobTitle> "Neurobiologist" .
<http://localhost:8080/data/person/amy-farrah-fowler> <http://schema.org/knows> <http://localhost:8080/data/person/sheldon-cooper> .
<http://localhost:8080/data/person/amy-farrah-fowler> <http://schema.org/colleague> <http://localhost:8080/data/person/sheldon-cooper> .

# Caltech
<http://localhost:8080/data/organization/caltech> a <http://schema.org/Organization> .
<http://localhost:8080/data/organization/caltech> <http://schema.org/name> "California Institute of Technology" .
<http://localhost:8080/data/organization/caltech> <http://schema.org/url> "https://www.caltech.edu" .
`;

export const schemaPrefixes = {
  "": "http://localhost:8080/data/",
  schema: "http://schema.org/",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
};

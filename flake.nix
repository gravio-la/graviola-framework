{
  description = "Flake for dev shell each default system";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        lib = nixpkgs.lib;
        # Monorepo (package.json engines / CI) expects Bun ≥ 1.3.10 — fail fast if nixpkgs lags.
        bunMin = "1.3.10";
      in
      assert lib.assertMsg (lib.versionAtLeast pkgs.bun.version bunMin)
        "graviola-crud-framework: nixpkgs bun must be ≥ ${bunMin} (got ${pkgs.bun.version}). Try: nix flake update nixpkgs";
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_latest
            prisma-engines
            #jetbrains.idea-ultimate
            #apache-jena
            #librdf_raptor2
            bun
            openssl
            tree
          ];
          LD_LIBRARY_PATH = "${pkgs.stdenv.cc.cc.lib}/lib";
          # Prisma CLI has no official linux-nixos engine zip; use nixpkgs engines + skip checksum fetch.
          PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = "1";
          PRISMA_QUERY_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/query-engine";
          PRISMA_QUERY_ENGINE_LIBRARY = "${pkgs.prisma}/lib/libquery_engine.node";
          PRISMA_SCHEMA_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/schema-engine";
          CYPRESS_RUN_BINARY = "${pkgs.cypress}/bin/Cypress";
          shellHook = ''
            echo "bun $(bun --version) (flake requires ≥ ${bunMin})"
          '';
        };
        # Use nix-provided bun (from nixpkgs unstable) for install and compilation:
        #   nix run .#bun -- install
        #   nix run .#bun -- run build
        #   nix run .#unstable -- install   (same as #bun)
        apps = {
          default = { type = "app"; program = "${pkgs.bun}/bin/bun"; };
          bun = { type = "app"; program = "${pkgs.bun}/bin/bun"; };
        };
      }
    );
}

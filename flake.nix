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
        catalogToPrismaPkg = pkgs.writeShellApplication {
          name = "catalogToPrisma";
          runtimeInputs = [ pkgs.jq ];
          text = ''
            t=$(mktemp)
            jq --arg v "$1" '.workspaces.catalogs.prisma.prisma = $v | .workspaces.catalogs.prisma["@prisma/client"] = $v' package.json >"$t"
            mv "$t" package.json
          '';
        };
        mkDevShell = { prismaPkg, prismaEnginesPkg, catalogPrismaHint }: pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_latest
            prismaPkg
            prismaEnginesPkg
            jq
            catalogToPrismaPkg
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
          PRISMA_QUERY_ENGINE_BINARY = "${prismaEnginesPkg}/bin/query-engine";
          PRISMA_QUERY_ENGINE_LIBRARY = "${prismaPkg}/lib/libquery_engine.node";
          PRISMA_SCHEMA_ENGINE_BINARY = "${prismaEnginesPkg}/bin/schema-engine";
          CYPRESS_RUN_BINARY = "${pkgs.cypress}/bin/Cypress";
          shellHook = ''
            echo "bun $(bun --version) (flake requires ≥ ${bunMin})"
            echo "Prisma catalog: \`cd\` to repo root, then \`catalogToPrisma ${catalogPrismaHint}\` and \`bun install\` (matches this shell's Prisma engines)."
          '';
        };
      in
      assert lib.assertMsg (lib.versionAtLeast pkgs.bun.version bunMin)
        "graviola-crud-framework: nixpkgs bun must be ≥ ${bunMin} (got ${pkgs.bun.version}). Try: nix flake update nixpkgs";
      {
        # nix develop — Prisma 7 engines (nixpkgs 25.11 / unstable expose prisma_7 / prisma-engines_7)
        devShells.default = mkDevShell {
          prismaPkg = pkgs.prisma_7;
          prismaEnginesPkg = pkgs."prisma-engines_7";
          catalogPrismaHint = "7.6.0";
        };

        # nix develop .#prisma6
        devShells.prisma6 = mkDevShell {
          prismaPkg = pkgs.prisma_6;
          prismaEnginesPkg = pkgs."prisma-engines_6";
          catalogPrismaHint = "6.19.1";
        };

        # Use nix-provided bun (from nixpkgs unstable) for install and compilation:
        #   nix run .#bun -- install
        #   nix run .#bun -- run build
        apps = {
          default = { type = "app"; program = "${pkgs.bun}/bin/bun"; };
          bun = { type = "app"; program = "${pkgs.bun}/bin/bun"; };
        };
      }
    );
}

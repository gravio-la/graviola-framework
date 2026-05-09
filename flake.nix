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
        bunCfg = import ./bun.nix { inherit pkgs lib; };
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
            bunCfg.bun
            act
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
            echo "bun $(bun --version) (flake requires ≥ ${bunCfg.bunMin}; see bun.nix)"
            echo "Prisma catalog: \`cd\` to repo root, then \`catalogToPrisma ${catalogPrismaHint}\` and \`bun install\` (matches this shell's Prisma engines)."
            alias pages-preview='bash ./preview-pages.sh'
            echo "Pages preview: run \`pages-preview\` (or \`pages-preview /graviola-framework 4173\`)."
          '';
        };
      in
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
          default = bunCfg.mkBunApp bunCfg.bun;
          bun = bunCfg.mkBunApp bunCfg.bun;
        };
      }
    );
}

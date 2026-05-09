# Bun toolchain for this flake — keep overrides here so `flake.nix` stays small.
#
# We use `bun-binary-package.nix`: same approach as nixpkgs unstable (official zip → unpack → patchelf),
# but the zip is the GitHub **`canary`** rolling release so we track main (includes publish readme fix
# after https://github.com/oven-sh/bun/pull/30257). Stable `pkgs.bun` may lag that change.
#
# When canary zips rotate, update fixed-output hashes in `bun-binary-package.nix` (see file header).

{ pkgs, lib }:

let
  bunMin = "1.3.10";
  bun = pkgs.callPackage ./bun-binary-package.nix { };
in

{
  inherit bun bunMin;

  mkBunApp = bunPkg: {
    type = "app";
    program = "${bunPkg}/bin/bun";
  };
}

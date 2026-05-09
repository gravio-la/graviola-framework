# Same packaging model as nixpkgs `pkgs/by-name/bu/bun/package.nix` (prebuilt zip, patchelf on Linux),
# but artifacts come from the rolling GitHub release tag `canary` (tip of main).
#
# When `canary` assets change, this flake will fail fixed-output checks. Refresh hashes:
#   nix-prefetch-url https://github.com/oven-sh/bun/releases/download/canary/bun-linux-x64.zip
#   nix hash convert --hash-algo sha256 --to sri --from nix32 <nix32-output>
# Repeat for bun-linux-aarch64.zip, bun-darwin-aarch64.zip, bun-darwin-x64-baseline.zip.

{
  lib,
  stdenvNoCC,
  fetchurl,
  autoPatchelfHook,
  unzip,
  installShellFiles,
  makeWrapper,
  openssl,
  cctools,
  darwin,
  rcodesign,
}:

stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "bun";
  version = "canary";

  src =
    finalAttrs.passthru.sources.${stdenvNoCC.hostPlatform.system}
      or (throw "Unsupported system: ${stdenvNoCC.hostPlatform.system}");

  sourceRoot = {
    aarch64-darwin = "bun-darwin-aarch64";
    x86_64-darwin = "bun-darwin-x64-baseline";
  }.${stdenvNoCC.hostPlatform.system} or null;

  strictDeps = true;

  nativeBuildInputs = [
    unzip
    installShellFiles
    makeWrapper
  ] ++ lib.optionals stdenvNoCC.hostPlatform.isLinux [ autoPatchelfHook ];

  buildInputs = [ openssl ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    install -Dm 755 ./bun $out/bin/bun
    ln -s $out/bin/bun $out/bin/bunx

    runHook postInstall
  '';

  postPhases = [ "postPatchelf" ];

  postPatchelf =
    lib.optionalString stdenvNoCC.hostPlatform.isDarwin ''
      '${lib.getExe' cctools "${cctools.targetPrefix}install_name_tool"}' $out/bin/bun \
        -change /usr/lib/libicucore.A.dylib '${lib.getLib darwin.ICU}/lib/libicucore.A.dylib'
      '${lib.getExe rcodesign}' sign --code-signature-flags linker-signed $out/bin/bun
    ''
    + lib.optionalString (
      stdenvNoCC.buildPlatform.canExecute stdenvNoCC.hostPlatform
      && !(stdenvNoCC.hostPlatform.isDarwin && stdenvNoCC.hostPlatform.isx86_64)
    ) ''
      installShellCompletion --cmd bun \
        --bash <(SHELL="bash" $out/bin/bun completions) \
        --zsh <(SHELL="zsh" $out/bin/bun completions) \
        --fish <(SHELL="fish" $out/bin/bun completions)
    '';

  passthru = {
    sources = {
      "aarch64-darwin" = fetchurl {
        url = "https://github.com/oven-sh/bun/releases/download/canary/bun-darwin-aarch64.zip";
        hash = "sha256-Ddgejo0Xz7XssLoKGXbK9TIjbfeRKLzIGyiqn4a8n54=";
      };
      "aarch64-linux" = fetchurl {
        url = "https://github.com/oven-sh/bun/releases/download/canary/bun-linux-aarch64.zip";
        hash = "sha256-C0L92XFw6k2OkBv8nm2QTSr3t9luNgw2McKqez15fsE=";
      };
      "x86_64-darwin" = fetchurl {
        url = "https://github.com/oven-sh/bun/releases/download/canary/bun-darwin-x64-baseline.zip";
        hash = "sha256-yScvX5uhuUPWVz6yAwchiqdaFty/em4rc17p4xLxg1s=";
      };
      "x86_64-linux" = fetchurl {
        url = "https://github.com/oven-sh/bun/releases/download/canary/bun-linux-x64.zip";
        hash = "sha256-cFleOtfb5ZA0HLrFxWbu0j3YI2BhDc2EXJR53VgLstE=";
      };
    };
  };

  meta = {
    homepage = "https://bun.sh";
    changelog = "https://github.com/oven-sh/bun/releases/tag/canary";
    description = "Bun (GitHub canary channel — matches nixpkgs zip packaging)";
    sourceProvenance = with lib.sourceTypes; [ binaryNativeCode ];
    license = with lib.licenses; [
      mit
      lgpl21Only
    ];
    mainProgram = "bun";
    platforms = builtins.attrNames finalAttrs.passthru.sources;
    broken = stdenvNoCC.hostPlatform.isMusl;
    hydraPlatforms = lib.lists.remove "x86_64-darwin" lib.platforms.all;
  };
})

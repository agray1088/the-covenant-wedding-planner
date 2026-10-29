; Custom NSIS hooks for The Covenant Wedding Planner.
; Force Start Menu + Desktop shortcuts to the *installed* binary under $INSTDIR,
; never leave rename-only / keepShortcuts leftovers pointing at an old or
; build-tree path (e.g. desktop\dist\win-arm64-unpacked).

!macro deleteStalePlannerShortcuts
  ; Friendly shortcut name (current nsis.shortcutName)
  Delete "$DESKTOP\${SHORTCUT_NAME}.lnk"
  Delete "$SMPROGRAMS\${SHORTCUT_NAME}.lnk"
  ; Space-free exe / productFilename label (older or alternate .lnk names)
  Delete "$DESKTOP\${PRODUCT_FILENAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_FILENAME}.lnk"
  ; Legacy spaced productName exe label (pre-executableName fix)
  Delete "$DESKTOP\The Covenant Wedding Planner.lnk"
  Delete "$SMPROGRAMS\The Covenant Wedding Planner.lnk"
  ClearErrors
!macroend

!macro createPlannerShortcuts
  ; $appExe is set in installSection.nsh to "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  ; which is "$INSTDIR\CovenantWeddingPlanner.exe" for this app.
  DetailPrint "Creating shortcuts -> $appExe"
  !insertmacro createMenuDirectory
  CreateShortCut "$newStartMenuLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
  ClearErrors
  WinShell::SetLnkAUMI "$newStartMenuLink" "${APP_ID}"

  ${ifNot} ${isNoDesktopShortcut}
    CreateShortCut "$newDesktopLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
    ClearErrors
    WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
  ${endif}

  System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
!macroend

!macro customInstall
  ; Runs after electron-builder's default addStartMenuLink / addDesktopLink.
  ; Those can skip CreateShortCut when KeepShortcuts=true (rename-only path),
  ; which leaves .lnk targets stale across exe/path renames. Always retarget.
  ${If} ${FileExists} "$appExe"
    !insertmacro deleteStalePlannerShortcuts
    !insertmacro createPlannerShortcuts
    ; Re-point launch target used by "Run" after finish
    ${if} ${FileExists} "$newStartMenuLink"
      StrCpy $launchLink "$newStartMenuLink"
    ${else}
      StrCpy $launchLink "$appExe"
    ${endif}
  ${Else}
    MessageBox MB_OK|MB_ICONEXCLAMATION \
      "Install warning: expected executable was not found:$\r$\n$appExe$\r$\n$\r$\nShortcuts were not created. Check the install folder or use the portable build."
  ${EndIf}
!macroend

!macro customUnInstall
  !insertmacro deleteStalePlannerShortcuts
  ; Also clear links using the vars electron-builder computed for this uninstall
  Delete "$oldDesktopLink"
  Delete "$oldStartMenuLink"
  Delete "$newDesktopLink"
  Delete "$newStartMenuLink"
  ClearErrors
  System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
!macroend

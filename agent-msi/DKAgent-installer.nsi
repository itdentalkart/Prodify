!define APP_NAME "DK Productivity Agent"
!define APP_VERSION "1.0.0"
!define SERVICE_NAME "DKAgent"
!define SERVER_URL "http://192.168.11.90:3000"

Name "${APP_NAME}"
OutFile "DKAgent-Setup.exe"
InstallDir "$PROGRAMFILES64\DKAgent"
RequestExecutionLevel admin
SetCompressor /SOLID lzma

!include "MUI2.nsh"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File "../server/downloads/DKAgent.exe"

  CreateDirectory "$APPDATA\DKAgent"

  FileOpen $0 "$APPDATA\DKAgent\config.json" w
  FileWrite $0 '{$\n'
  FileWrite $0 '  "ServerUrl": "${SERVER_URL}",$\n'
  FileWrite $0 '  "DeviceId": "",$\n'
  FileWrite $0 '  "AgentToken": "",$\n'
  FileWrite $0 '  "AgentVersion": "${APP_VERSION}",$\n'
  FileWrite $0 '  "ScreenshotIntervalSec": 300,$\n'
  FileWrite $0 '  "HeartbeatIntervalSec": 60,$\n'
  FileWrite $0 '  "IdleThresholdSec": 300,$\n'
  FileWrite $0 '  "WorkingHours": "09:00-18:00",$\n'
  FileWrite $0 '  "EnrollToken": ""$\n'
  FileWrite $0 '}'
  FileClose $0

  ExecWait 'sc.exe create "${SERVICE_NAME}" binPath= "$INSTDIR\DKAgent.exe" start= auto DisplayName= "${APP_NAME}"'
  ExecWait 'sc.exe description "${SERVICE_NAME}" "DK Productivity monitoring agent"'
  ExecWait 'sc.exe start "${SERVICE_NAME}"'

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DKAgent" "DisplayName" "${APP_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DKAgent" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DKAgent" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DKAgent" "Publisher" "DK Suite"
SectionEnd

Section "Uninstall"
  ExecWait 'sc.exe stop "${SERVICE_NAME}"'
  ExecWait 'sc.exe delete "${SERVICE_NAME}"'
  Delete "$INSTDIR\DKAgent.exe"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  RMDir /r "$APPDATA\DKAgent"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DKAgent"
SectionEnd

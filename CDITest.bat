echo Test of CrystalDiskInfo


:: BatchGotAdmin 
:------------------------------------- 
REM --> Check for permissions 
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

REM --> If error flag set, we do not have admin. 
if '%errorlevel%' NEQ '0' ( 
echo Requesting administrative privileges... 
goto UACPrompt 
) else ( goto gotAdmin ) 

:UACPrompt 
echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs" 
echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs" 

"%temp%\getadmin.vbs" 
exit /B 

:gotAdmin 
if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" ) 
pushd "%CD%" 
CD /D "%~dp0" 

:-------------------------------------- 

cd C:\Program Files (x86)\CrystalDiskInfo

set fileName=CDI_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt 

DiskInfoX64.exe /CopyExit

ren DiskInfoX64.txt %filename%

move %filename% C:\Users\John\Desktop\HotSwapTest\


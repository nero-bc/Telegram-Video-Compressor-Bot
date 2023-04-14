@echo off
setlocal enabledelayedexpansion

REM Set the input and output folder paths
set "input_folder=input"
set "output_folder=output"

REM Set the path to the HandBrakeCLI executable
set "handbrake_path=HandBrakeCLI.exe"

REM Set HandBrakeCLI arguments
set "handbrake_args=--preset-import-file "custom.json" --preset "The 1" --quality 35.0 --json"

REM Create the output folder if it doesn't exist
if not exist "!output_folder!" mkdir "!output_folder!"

REM Loop through all files in the input folder and process them with HandBrakeCLI
for %%f in ("!input_folder!\*") do (
    set "input_file=%%~ff"
    set "output_file=!output_folder!\%%~nf.mp4"
    echo Processing: !input_file!
    "!handbrake_path!" -i "!input_file!" -o "!output_file!" !handbrake_args!
)

echo All files processed. Exiting.
endlocal

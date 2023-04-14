# Telegram Video Compressor Bot

A simple Telegram bot that provides video compression functionality using the HandBrake CLI.

## Approach

The bot listens for videos sent in the chat, downloads them, runs the Batch file to compress the input, then returns the compressed video output in the same chat. In turn, the Batch script uses a custom NVEnc preset, optimally balanced between output quality and file size. Preset is also included in the repo and can be directly imported in the HandBrake GUI too. All video input and output is stored only temporarily, solely for the purpose of compression and is immediately deleted from local storage once the task is handled successfully, maintaining a low hard drive profile.

## Usage

Clone the repo, enter bot token, and let 'er rip. That's it!

## Limitations

Telegram limits the maximum file size a bot can download to 20mbs. Videos larger than that will be rejected. If you want to compress larger files just use the Batch script locally. Main functionality is there, the bot is just a simple interface you can use quickly on the go, while browsing.

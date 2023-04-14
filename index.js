require('dotenv').config();
const express = require('express');
const app = express();
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {
  polling: true,
});
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

bot.on('video', (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.video.file_id;
  const fileNm = msg.video.file_name;
  const fileSize = msg.video.file_size;

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

  if (fileSize > MAX_FILE_SIZE) {
    bot.stopPolling()
    bot.sendMessage(chatId, 'Telegram file size limit exceeded. Input must be less than 20MB...');
    return bot.startPolling()
  }

  const findLatestFile = (dirPath, callback) => {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        return callback(err);
      }

      let latestFile;
      let latestTime = 0;

      files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const fileStat = fs.statSync(filePath);
        const modifiedTime = fileStat.mtime.getTime();

        if (modifiedTime > latestTime) {
          latestTime = modifiedTime;
          latestFile = filePath;
        }
      });

      callback(null, latestFile);
    });
  };

  async function handleVideo(chatId, fileId, fileNm) {

    bot.sendMessage(chatId, 'Task acknowledged. Downloading video...')
    const inputFilePath = path.join(__dirname, 'input', `temp_${fileId}.mp4`);
    await bot.downloadFile(fileId, path.dirname(inputFilePath), { file_name: path.basename(inputFilePath) });

    // Rename the downloaded file
     findLatestFile(path.join(__dirname, 'input'), async (err, latestFile) => {
       if (err) {
         console.error(`Error finding latest file: ${err}`);
         return;
       }

       const renamedFilePath = path.join(__dirname, 'input', fileNm);
       fs.renameSync(latestFile, renamedFilePath);

       // Calculate the input file size
       const inputFileSize = fs.statSync(renamedFilePath).size;
       bot.sendMessage(chatId, `Download complete. Input file size is ${(inputFileSize / (1024 * 1024)).toFixed(2)} MB...`);

       // Start the compression process
       const startTime = Date.now()
       const startUTC = new Date(startTime).toLocaleTimeString('en-GB', { timeZone: 'UTC' })
       bot.sendMessage(chatId, `Initiating video compression at ${startUTC} UTC...`);
       const batchFilePath = path.join(__dirname, 'lazy-vid-compressor.bat');
       exec(`"${batchFilePath}"`, async (error, stdout, stderr) => {
         if (error) {
           console.error(`exec error: ${error}`);
           return;
         }

         // Calculate the time spent on compression
         const endTime = Date.now()
         const endUTC = new Date(endTime).toLocaleTimeString('en-GB', { timeZone: 'UTC' })
         const compressionTime = (endTime - startTime) / 1000;
         bot.sendMessage(chatId, `Compression complete at ${endUTC} UTC in ${compressionTime.toFixed(0)} seconds...`);

         // Calculate the output file size
         const outputFilePath = path.join(__dirname, 'output', fileNm);
         const outputFileSize = fs.statSync(outputFilePath).size;

         // Calculate the size difference and percentage difference
         const sizeDifference = inputFileSize - outputFileSize;
         const percentageDifference = (sizeDifference / inputFileSize) * 100;
         bot.sendMessage(chatId, `Output file size is ${(outputFileSize / (1024 * 1024)).toFixed(2)} MB for a difference of ${(sizeDifference / (1024 * 1024)).toFixed(2)} MB (${percentageDifference.toFixed(2)}%...)`);

         // Send the output video
         const fileStream = fs.createReadStream(outputFilePath);
         bot.sendMessage(chatId, `Returning compressed video transmission...`);
         await bot.sendVideo(chatId, fileStream);
         bot.sendMessage(chatId, `Video transmission complete. Task handled successfully...`);

         // Delete input and output video files
         fs.unlink(renamedFilePath, (err) => {
           if (err) console.error(`Error deleting input file: ${err}`);
         });
         fs.unlink(outputFilePath, (err) => {
           if (err) console.error(`Error deleting output file: ${err}`);
         });
       });
     });
   }

  handleVideo(chatId, fileId, fileNm);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

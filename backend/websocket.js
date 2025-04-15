const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process")

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("read-files", async (folderPath) => {
    try {
      if (!folderPath || typeof folderPath !== "string") {
        throw new Error("Invalid folder path");
      }
  
      const entries = await fs.readdir(folderPath);
      const detailedEntries = [];
  
      for (const entry of entries) {
        const entryPath = path.join(folderPath, entry);
        const stats = await fs.stat(entryPath);
  
        detailedEntries.push({
          name: entry,
          isDirectory: stats.isDirectory(),
        });
      }
  
      socket.emit("files", detailedEntries);
    } catch (err) {
      console.error("Error reading files:", err);
      socket.emit("error", err.message);
    }
  });
  
  socket.on("open-file", async (Dir, Name) => {
      file = await fs.readFile(Dir + "/" + Name, 'utf8')
      socket.emit("file", file)
  })

  socket.on("save-file", async (content, path) => {
    fs.writeFile(path, content)
  })

  socket.on("create-file", async (createDir, Name) => {
    try {
      if (!createDir || typeof createDir !== "string") {
        throw new Error("Invalid folder path");
      }

      const files = await fs.readdir(createDir);

      for (const file of files) {
        if (file == Name) {
          console.error('file already exists')
          return 0
        }
      }

      fs.writeFile(createDir + "/" + Name, "")
      socket.emit("file-created")
    } catch(err) {
      console.error("error creating file:", err);
      socket.emit("error", err.message)
    }
  })

  socket.on("create-folder", async (createDir, Name) => {
    try {
      if (!createDir || typeof createDir !== "string") {
        throw new Error("Invalid folder path");
      }

      const files = await fs.readdir(createDir);

      for (const file of files) {
        if (file == Name) {
          console.error('file already exists')
          return 0
        }
      }

      await fs.mkdir(createDir + "/" + Name)
      socket.emit("file-created")
    } catch(err) {
      console.error("error creating file:", err);
      socket.emit("error", err.message)
    }
  })

  socket.on("delete-file", async (Dir, Name) => {
    try{
      filePath = path.join(Dir, Name)
      if(!filePath || typeof filePath !== "string") {
        throw new Error("invalid file")
      }

      const files = await fs.readdir(Dir)

      if(files.includes(Name)) {
        await fs.unlink(filePath)
        socket.emit("file-deleted")
      } else {
        throw new Error("no such file exists")
      }

    } catch(err) {
      console.error("error deleting file:", err);
      socket.emit("error", err.message)
    }
  })

  socket.on("delete-folder", async (Dir, Name) => {
    try{
      filePath = path.join(Dir, Name)
      if(!filePath || typeof filePath !== "string") {
        throw new Error("invalid file")
      }

      const files = await fs.readdir(Dir)

      if(files.includes(Name)) {
        await fs.rmdir(filePath)
        socket.emit("file-deleted")
      } else {
        throw new Error("no such file exists")
      }

    } catch(err) {
      console.error("error deleting file:", err);
      socket.emit("error", err.message)
    }
  })

  socket.on("run-powershell", (command) => {
    exec(`powershell.exe -command "${command}"`, (error, stdout, stderr) => {
      if (error) {
        socket.emit("ps-output", `Error: ${error.message}`)
        return
      }
      if (stderr) {
        socket.emit("ps-output", `stderr: ${stderr}`)
        return
      }
      socket.emit("ps-output", ["", stdout])
    })
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5050, () => console.log("Server running on port 5050"));
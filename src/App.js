import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://dnx817df-5050.uks1.devtunnels.ms/"); // Replace with your WebSocket server URL

export default function App() {
  const [Name, setName] = useState("");
  const [files, setFiles] = useState([]);
  const [openFile, setOpenFile] = useState(""); // Renamed to setOpenFile for clarity
  const [openFilePath, setFilePath] = useState("");
  const [currentPath, setCurrentPath] = useState("E:/Code");
  const [stdOut, setStdOut] = useState("")
  const [command, setCommand] = useState("")
  const [showPowershell, setShowPowershell] = useState(false);
  const [currentPowershellPath, setPowershellPath] = useState("E:/code")

  const fileContainerRef = useRef(null);
  const powershellRef = useRef(null);

  const handleCreateFile = () => {
    if (!currentPath || !Name) {
      alert("Please provide both folder path and file name.");
      return;
    }
    socket.emit("create-file", currentPath, Name);
  };

  const handleCreateFolder = () => {
    if (!currentPath || !Name) {
      alert("Please provide both folder path and folder name.");
      return;
    }
    socket.emit("create-folder", currentPath, Name);
  };

  const handleReadFiles = () => {
    if (!currentPath) {
      alert("Please provide a folder path.");
      return;
    }
    console.log(currentPath);
    socket.emit("read-files", currentPath);
  };

  const handleReadFile = (file) => {
    if (!currentPath || !file) {
      alert("Please provide both folder path and file name.");
      return;
    }
    setFilePath(`${currentPath}/${file}`);
    socket.emit("open-file", currentPath, file);
  };

  const handleSaveFile = () => {
    if (!openFile) {
      alert("No file to save");
      return;
    }
    socket.emit("save-file", openFile, openFilePath);
  };

  const handleCloseFile = () => {
    if (!openFilePath) {
      alert("No file to close");
      return;
    }
    setOpenFile(""); // Corrected to setOpenFile
    setFilePath(""); // Clear the file path as well
  };

  const handleDeleteFile = (file) => {
    if (!currentPath || !file) {
      alert("Please provide both folder path and file name.");
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete "${file}"?`);
    if (confirmDelete) {
      socket.emit("delete-file", currentPath, file);
    }
    if(`${currentPath}/${file}` == openFilePath) {
      handleCloseFile()
    }
  };

  const handleDeleteFolder = (folder) => {
    if (!currentPath || !folder) {
      alert("Please provide both folder path and folder name.");
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete "${folder}"?`);
    if (confirmDelete) {
      socket.emit("delete-folder", currentPath, folder);
    }
  };

  const handleNavigate = (newPath) => {
    if (newPath.slice(0, 7) !== "E:/Code") {
      newPath = "E:/Code";
    }
    setCurrentPath(newPath); // Schedule path update
  };

  const handleNavigateBack = () => {
    let pathSegments = currentPath.split("/");

    // Prevent navigating beyond the root directory
    if (pathSegments.length <= 1) return;

    // Remove the last segment to go back
    let newPath = pathSegments.slice(0, -1).join("/");

    // Handle cases where the path should not be empty
    if (newPath === "") {
      newPath = pathSegments[0]; // Keep root (e.g., "E:" on Windows)
    }

    handleNavigate(newPath);
  };

  const handleRenderPowershell = () => {
    setShowPowershell(true);
  };

  const handleClosePowershell = () => {
    setShowPowershell(false);
  };

  const handleRunPowershell = () => {
    if (!command.trim()) return;
  
    let newPath = currentPowershellPath;
    let fullCommand = command.trim();
  
    if (command.startsWith("cd ")) {
      let cdPath = command.slice(3).trim();
  
      if (cdPath === "..") {
        // Move up one directory
        newPath = newPath.split("/").slice(0, -1).join("/") || "E:/code";
      } else if (cdPath.startsWith("/") || cdPath.includes(":")) {
        // Absolute path (e.g., "C:\\Users")
        newPath = cdPath;
      } else {
        // Relative path
        newPath = `${newPath}/${cdPath}`;
      }
  
      setPowershellPath(newPath);
      setStdOut((prev) => prev + `\n${newPath}> `);
      return; // Do not execute if it's only changing directories
    }
  
    fullCommand = `cd "${newPath}"; ${fullCommand}`;
  
    if (socket.connected) {
      setStdOut((prev) => prev + `\n${newPath}> ${command}`);
      socket.emit("run-powershell", fullCommand);
    } else {
      alert("WebSocket is not connected.");
    }
  
    setCommand(""); // Clear input field
  };
  
  
  

  useEffect(() => {
    console.log("Updated Path:", currentPath); // This will now log the correct updated path

    const handleFileCreated = (data) => {
      console.log("File created:", data);
      handleReadFiles();
    };

    const handleFileDeleted = (data) => {
      console.log("File deleted:", data);
      handleReadFiles();
    };

    const handleFiles = (data) => {
      setFiles(data);
    };

    const handleFile = (data) => {
      setOpenFile(data); // Corrected to setOpenFile
    };

    const handleError = (err) => {
      alert(`Error: ${err}`);
    };

    const handlePsOut = (data) => {
      setStdOut((prev) => prev + "\n" + data + "\n")
    }

    socket.on("file-created", handleFileCreated);
    socket.on("file-deleted", handleFileDeleted);
    socket.on("files", handleFiles);
    socket.on("file", handleFile);
    socket.on("error", handleError);
    socket.on("ps-output", handlePsOut)

    // Read directory immediately on launch
    handleReadFiles();

    return () => {
      socket.off("file-created", handleFileCreated);
      socket.off("file-deleted", handleFileDeleted);
      socket.off("files", handleFiles);
      socket.off("error", handleError);
      socket.off("ps-output", handlePsOut)
    };
  }, [currentPath]); // Run once on mount

  return (
    <div>
    {!showPowershell ? (
    <div ref={fileContainerRef} id={"Files"}>
      <h1>File Manager</h1>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={Name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
          />
        </label>
      </div>
      <button onClick={handleCreateFile} id={"create"}>Create File</button>
      <button onClick={handleCreateFolder} id={"create"}>Create Folder</button>

      <div id="filesContainer">
        <h2>Files in Directory:</h2>
        <ul>
          <li>
            📁
            <button onClick={() => handleNavigateBack()}>/..</button>
          </li>
          {files.map((file, index) => (
            <li key={index}>
              {file.isDirectory ? "📁" : "📄"} {file.name}
              {file.isDirectory ? (
                <>
                  <button onClick={() => handleNavigate(`${currentPath}/${file.name}`)}>Open</button>
                  <button onClick={() => handleDeleteFolder(file.name)}>Delete</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleReadFile(file.name)}>Edit</button>
                  <button onClick={() => handleDeleteFile(file.name)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      {openFilePath.length > 0 && (
        <>
          <div id="currentFile">
            <h2>Current file:</h2>
            <button onClick={() => handleSaveFile()}>Save</button>
            <button onClick={() => handleCloseFile()}>Close</button>
            <textarea value={openFile} onChange={(e) => setOpenFile(e.target.value)} id="openFile"></textarea>
          </div>
        </>
      )}
      <button onClick={() => handleRenderPowershell()}>Open powershell</button>
    </div>
    ) : (
    <div ref={powershellRef} id={"powershell"}>
      <button onClick={() => handleClosePowershell()}>Close</button>
      <textarea value={stdOut} id="StdOut"></textarea>
      <input type="text" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Enter a command"></input>
      <button onClick={() => handleRunPowershell(command)}>Submit</button>
    </div>
    )}
    </div>
  );
}

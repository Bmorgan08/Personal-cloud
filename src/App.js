import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://x647wbx8-5050.uks1.devtunnels.ms/");

export default function App() {
  const [Name, setName] = useState("");
  const [files, setFiles] = useState([]);
  const [openFile, setOpenFile] = useState("");
  const [openFilePath, setFilePath] = useState("");
  const [currentPath, setCurrentPath] = useState("E:/Code");
  const [stdOut, setStdOut] = useState("")
  const [command, setCommand] = useState("")
  const [showPowershell, setShowPowershell] = useState(false);
  const [currentPowershellPath, setPowershellPath] = useState("E:/code")

  const fileContainerRef = useRef(null);
  const powershellRef = useRef(null);
  const stdOutRef = useRef(null)

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
    setOpenFile("");
    setFilePath("");
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
    setCurrentPath(newPath);
  };

  const handleNavigateBack = () => {
    let pathSegments = currentPath.split("/");

    if (pathSegments.length <= 1) return;

    let newPath = pathSegments.slice(0, -1).join("/");

    if (newPath === "") {
      newPath = pathSegments[0];
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
        newPath = newPath.split("/").slice(0, -1).join("/") || "E:/code";
      } else if (cdPath.startsWith("/") || cdPath.includes(":")) {
        newPath = cdPath;
      } else {
        newPath = `${newPath}/${cdPath}`;
      }
  
      setPowershellPath(newPath);
      setStdOut((prev) => prev + `\n${newPath}> `);
      setCommand("")
      return;
    }
  
    fullCommand = `cd "${newPath}"; ${fullCommand}`;
  
    if (socket.connected) {
      setStdOut((prev) => prev + `\n${newPath}> ${command}`);
      socket.emit("run-powershell", fullCommand);
    } else {
      alert("WebSocket is not connected.");
    }
  
    setCommand("");
    return
  };
  
  const handleRestartBackend = () => {
    socket.emit("run-powershell", "cd E:/code/cloud/backend; ./restartBackendServer.ps1")
    setTimeout(() => {
      window.location.reload()
    }, 2000);
  }
  

  useEffect(() => {

    if (stdOutRef.current) {
      stdOutRef.current.scrollTop = stdOutRef.current.scrollHeight;
    }

    const handleFileCreated = (data) => {
      handleReadFiles();
    };

    const handleFileDeleted = (data) => {
      handleReadFiles();
    };

    const handleFiles = (data) => {
      setFiles(data);
    };

    const handleFile = (data) => {
      setOpenFile(data);
    };

    const handleError = (err) => {
      alert(`Error: ${err}`);
    };

    const handlePsOut = (data) => {
      if(data.slice(0, 3) === ", \n") {
        data = data.slice(3)
      }
      setStdOut((prev) => prev + "\n" + data[1] + "\n")
    }

    socket.on("file-created", handleFileCreated);
    socket.on("file-deleted", handleFileDeleted);
    socket.on("files", handleFiles);
    socket.on("file", handleFile);
    socket.on("error", handleError);
    socket.on("ps-output", handlePsOut)

    handleReadFiles();

    return () => {
      socket.off("file-created", handleFileCreated);
      socket.off("file-deleted", handleFileDeleted);
      socket.off("files", handleFiles);
      socket.off("error", handleError);
      socket.off("ps-output", handlePsOut)
    };
  }, [currentPath, stdOut]);

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
            <textarea spellcheck="false" value={openFile} onChange={(e) => setOpenFile(e.target.value)} id="openFile"></textarea>
          </div>
        </>
      )}
      <button onClick={() => handleRenderPowershell()}>Open powershell</button>
      <button onClickCapture={() => handleRestartBackend()}>Restart backend</button>
    </div>
    ) : (
    <div ref={powershellRef} id={"powershell"}>
      <button onClick={() => handleClosePowershell()}>Close</button>
      <textarea spellcheck="false" ref={stdOutRef} value={stdOut} id="StdOut"></textarea>
      <input type="text" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Enter a command"></input>
      <button onClick={async () => {await handleRunPowershell(command); setCommand("")}}>Submit</button>
    </div>
    )}
    </div>
  );
}

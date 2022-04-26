import express from "express";
import fs from "fs/promises";
import { Dirent } from "fs";
import os from "os";

const path = os.tmpdir() + "/back/";

export const displayItems = (
  res: express.Response,
  status: number,
  path: string = os.tmpdir() + "/back/"
) => {
  getArrayOfDirents(path)
    .then((dirents: Dirent[]) => {
      return Promise.all(LoopToCreateDatas(dirents, path));
    })
    .then((itemsArray: object[]) => {
      res.append("Content-Type", "application/json");
      res.status(status).send(itemsArray);
    });
};

export const addNewFolder = (
  name: string,
  res: express.Response,
  pathEnd: string = ""
) => {
  const validFolderName = new RegExp("^[a-zA-Z]+$", "gm");
  if (validFolderName.test(name)) {
    createFolder(path + pathEnd + name, res);
  } else {
    res
      .status(400)
      .send("Le dossier contient des caractères non-alphanumériques");
  }
};

export const addFile = (
  file: any,
  res: express.Response,
  pathEnd: string = ""
) => {
  fs.writeFile(path + pathEnd + file["name"], file["data"])
    .then(() => {
      displayItems(res, 201, path);
    })
    .catch(() => res.status(400).send("Aucun fichier présent dans la requête"));
};

export const deleteItem = (
  deleteElement: string,
  res: express.Response,
  pathEnd: string = ""
) => {
  fs.rm(path + pathEnd + deleteElement, { recursive: true })
    .then(() => {
      displayItems(res, 200, path + pathEnd);
    })
    .catch((e) => console.log("erreur:", e));
};

export const displayAccordingToItemType = (
  pathEnd: string,
  req: express.Request,
  res: express.Response
) => {
  fs.lstat(path + pathEnd).then((stats) => {
    if (stats.isDirectory()) {
      displayItems(res, 201, path + pathEnd);
    } else if (stats.isFile()) {
      getFile(path + pathEnd, req, res);
    } else {
      res.status(400).send("error");
    }
  });
};

export const isFolder = (pathEnd: string) => {
  return fs.lstat(path + pathEnd).then((fullPath) => {
    return fullPath.isDirectory();
  });
};

function getArrayOfDirents(path: string) {
  return fs
    .readdir(path, { withFileTypes: true })
    .then((dirents: Dirent[]) => dirents);
}

function LoopToCreateDatas(dirents: Dirent[], path: string) {
  return dirents.map((dirent) => populateJSON(dirent, path));
}

function populateJSON(dirent: Dirent, path: string) {
  if (dirent.isDirectory()) {
    return {
      name: dirent.name,
      isFolder: true,
    };
  } else {
    return getSize(dirent, path).then((size: number) => {
      return {
        name: dirent.name,
        isFolder: false,
        size: size,
      };
    });
  }
}

function getSize(dirent: Dirent, path: string) {
  return fs.lstat(path + dirent.name).then((stat) => stat.size);
}

function createFolder(pathFolder: string, res: express.Response) {
  fs.mkdir(pathFolder)
    .then(() => {
      displayItems(res, 201, pathFolder);
    })
    .catch((error) => {
      if (error.code == "EEXIST") {
        return res.status(400).send("Le dossier existe déjà");
      }
    });
}

function getFile(path: string, req: express.Request, res: express.Response) {
  fs.readFile(path, "utf8").then((fileContent) => {
    res.append("Content-Type", "application/octet-stream");
    res.status(200).send(fileContent);
  });
}

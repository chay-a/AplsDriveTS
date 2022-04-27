import express from "express";
import bb from "express-busboy";
import {
  displayItems,
  addNewFolder,
  addFile,
  deleteItem,
  displayAccordingToItemType,
  isFolder,
} from "./functions";

declare module 'express-serve-static-core' {
  interface Request {
    files?: object
  }
}


export const start = () => {
  const app: express.Application = express();
  const port: number = 3000;
  const options: bb.ExpressBusboyOptions = {
    headers: {
      "content-type": "multipart/form-data",
    },
    upload: true,
    allowedPath: /./,
  };
  bb.extend(app, options);

  app.use(express.static("frontend"));

  app
    .route("/api/drive")
    .get(function (req: express.Request, res: express.Response) {
      displayItems(res, 200);
    })
    .post(function (req: express.Request, res: express.Response) {
      const name: string = req.query.name as string;
      addNewFolder(name, res);
    })
    .put(function (req: express.Request, res: express.Response) {
      const files: any = req.files;
      if (!files) {
        res.status(400).send("something went wrong");
      } else {
        addFile(files.file,res);
      }
    });

  app.delete(
    "/api/drive/:name",
    (req: express.Request, res: express.Response) => {
      deleteItem(req.params.name, res);
    }
  );

  app
    .route("/api/drive/*")
    .get(function (req: express.Request, res: express.Response) {
      displayAccordingToItemType(req.params["0"], req, res);
    })
    .post(function (req: express.Request, res: express.Response) {
      const query: any = req.query;
      isFolder(req.params["0"])
        .then((isFolder) => {
          if (isFolder) {
            addNewFolder(query.name, res, req.params["0"]);
          } else {
            throw new Error("erreurrrrr");
          }
        })
        .catch(() => res.status(404).send("Le dossier n'existe pas"));
    })
    .put(function (req: express.Request, res: express.Response) {
      const files: any = req.files;
      if (req.params["0"]) {
        addFile(files.file, res, req.params["0"] + "/");
      } else {
        res.status(404).send("Le dossier n'existe pas");
      }
    });

  app.delete(
    "/api/drive/*/:name",
    (req: express.Request, res: express.Response) => {
      isFolder(req.params["0"] + "/")
        .then((isFolder) => {
          if (isFolder) {
            const pathItem = "/" + req.params.name;
            deleteItem(pathItem, res, req.params["0"]);
          } else {
            throw new Error("erreurrrrr");
          }
        })
        .catch((error) => res.status(404).send("erreur ERREUR"));
    }
  );

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

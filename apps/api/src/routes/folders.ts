import { Hono } from "hono";
import { FoldersController } from "../controllers/folders.controller";

const folders = new Hono();

folders.get("/", FoldersController.getAll);
folders.get("/trash", FoldersController.getTrashed);
folders.post("/", FoldersController.create);
folders.get("/type/:type", FoldersController.getByType);
folders.get("/:id", FoldersController.getById);
folders.patch("/:id", FoldersController.update);
folders.delete("/:id", FoldersController.softDelete);
folders.patch("/:id/restore", FoldersController.restore);
folders.patch("/:id/pin", FoldersController.togglePin);
folders.delete("/:id/permanent", FoldersController.permanentDelete);

export default folders;
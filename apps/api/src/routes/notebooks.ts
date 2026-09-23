import { Hono } from "hono";
import { NotebooksController } from "../controllers/notebooks.controller";

const notebooks = new Hono();

// Static routes before dynamic /:id
notebooks.get("/trash", NotebooksController.getTrashed);

notebooks.get("/", NotebooksController.getAll);
notebooks.post("/", NotebooksController.create);
notebooks.get("/:id", NotebooksController.getById);
notebooks.patch("/:id", NotebooksController.update);
notebooks.delete("/:id", NotebooksController.softDelete);
notebooks.patch("/:id/restore", NotebooksController.restore);
notebooks.patch("/:id/pin", NotebooksController.togglePin);

export default notebooks;

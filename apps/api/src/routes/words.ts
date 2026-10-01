import { Hono } from "hono";
import { WordsController } from "../controllers/words.controller";

const words = new Hono();

words.get("/", WordsController.getAll);
words.post("/", WordsController.create);

words.get("/:id", WordsController.getById);
words.patch("/:id", WordsController.update);
words.delete("/:id", WordsController.remove);

words.patch("/:id/mastered", WordsController.toggleMastered);

export default words;

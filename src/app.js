import express, { Router } from "express";
import cookieParser from "cookie-parser";
import UsersRouter from "./routes/users.routers.js";
import PostsRouter from "./routes/posts.router.js";
import CommentsRouter from "./routes/comments.router.js";
import logMiddleware from "./middlewares/log.middleware.js";
import errorHandlingMiddleware from "./middlewares/error-handling.middleware.js";

const app = express();
const PORT = 3018;

app.use(logMiddleware);
app.use(express.json());
app.use(cookieParser());

app.use("/api", [UsersRouter, PostsRouter, CommentsRouter]);
app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});

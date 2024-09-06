import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 댓글 작성 API 구현
router.post(
  "/posts/:postId/comments",
  authMiddleware,
  async (req, res, next) => {
    const { postId } = req.params;
    const { content } = req.body;
    const { userId } = req.user;

    const post = await prisma.posts.findFirst({ where: { postId: +postId } });
    if (!post)
      return res.status(404).json({ message: "게시글이 존재하지 않습니다." });

    const comment = await prisma.comments.create({
      data: {
        postId: +postId,
        userId: +userId,
        content: content,
      },
    });

    return res.status(201).json({ data: comment });
  }
);

// 댓글 조회 API
router.get("/posts/:postId/comments", async (req, res, next) => {
  const { postId } = req.params;

  const post = await prisma.posts.findFirst({
    where: {
      postId: +postId,
    },
  });
  if (!post)
    return res.status(404).json({ message: "게시글이 존재하지 않습니다." });

  const comments = await prisma.comments.findMany({
    where: {
      postId: +postId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json({ data: comments });
});

export default router;

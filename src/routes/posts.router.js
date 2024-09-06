import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

//게시글 작성 API 구현
router.post("/posts", authMiddleware, async (req, res, next) => {
  // 로그인된 사용자인지 검증
  const { title, content } = req.body;
  const { userId } = req.user;

  const post = await prisma.posts.create({
    data: {
      userId: +userId,
      title: title,
      content: content,
    },
  });

  return res.status(201).json({ data: post });
});

export default router;

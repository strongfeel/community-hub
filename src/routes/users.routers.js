import express from "express";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

// 회원가입 API 구현 완료
router.post("/sign-up", async (req, res, next) => {
  const { email, password, name, age, gender, profileImage } = req.body;

  const isExistUser = await prisma.users.findFirst({
    where: { email },
  });

  if (isExistUser) {
    return res.status(409).json({ message: "이미 존재하는 이메일 입니다." });
  }

  const user = await prisma.users.create({
    data: {
      email,
      password,
    },
  });

  const userInfo = await prisma.userInfos.create({
    data: {
      userId: user.userId,
      name,
      age,
      gender,
      profileImage,
    },
  });

  return res.status(201).json({ message: "회원가입이 완료되었습니다!" });
});

export default router;

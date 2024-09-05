import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

// 회원가입 API 구현
router.post("/sign-up", async (req, res, next) => {
  const { email, password, name, age, gender, profileImage } = req.body;

  const isExistUser = await prisma.users.findFirst({
    where: { email },
  });

  if (isExistUser) {
    return res.status(409).json({ message: "이미 존재하는 이메일 입니다." });
  }

  const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 암호화 작업
  const user = await prisma.users.create({
    data: {
      email,
      password: hashedPassword,
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

// 로그인 API 구현
router.post("/sign-in", async (req, res, next) => {
  const { email, password } = req.body;

  const user = await prisma.users.findFirst({
    where: { email },
  });

  if (!user)
    return res.status(401).json({ message: "존재하지 않은 이메일입니다." });
  if (!(await bcrypt.compare(password, user.password)))
    // 비밀번호 확인 작업
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

  // 유저아이디 정보를 할당하고 custom-secret-key 방식으로 사용
  const token = jwt.sign({ userId: user.userId }, "custom-secret-key");

  // 쿠키할당
  res.cookie("authorization", `Bearer ${token}`);

  return res.status(200).json({ message: "로그인에 성공하였습니다." });
});

export default router;

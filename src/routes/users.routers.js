import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";
import { Prisma } from "@prisma/client";

const router = express.Router();

// 회원가입 API 구현
router.post("/sign-up", async (req, res, next) => {
  try {
    const { email, password, name, age, gender, profileImage } = req.body;

    const isExistUser = await prisma.users.findFirst({
      where: { email },
    });

    if (isExistUser) {
      return res.status(409).json({ message: "이미 존재하는 이메일 입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 암호화 작업

    // 트렌젝션 부분: User, UserInfo 합치기
    const [user, userInfo] = await prisma.$transaction(
      async (tx) => {
        const user = await tx.users.create({
          data: {
            email,
            password: hashedPassword,
          },
        });

        const userInfo = await tx.userInfos.create({
          data: {
            userId: user.userId,
            name,
            age,
            gender,
            profileImage,
          },
        });

        return [user, userInfo];
      },
      {
        // 격리수준 설정
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    return res.status(201).json({ message: "회원가입이 완료되었습니다!" });
  } catch (err) {
    next(err);
  }
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

// 사용자 정보 조회 API 구현
router.get("/users", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const user = await prisma.users.findFirst({
    where: { userId: +userId },
    select: {
      userId: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      userInfos: {
        select: {
          name: true,
          age: true,
          gender: true,
          profileImage: true,
        },
      },
    },
  });

  return res.status(200).json({ data: user });
});

//사용자 정보 변경 API
router.patch("/users/", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const updatedData = req.body;

    const userInfo = await prisma.userInfos.findFirst({
      where: { userId: +userId },
    });
    if (!userInfo)
      return res
        .status(404)
        .json({ message: "사용자 정보가 존재하지 않습니다." });

    await prisma.$transaction(
      async (tx) => {
        // 트랜잭션 내부에서 사용자 정보를 수정합니다.
        await tx.userInfos.update({
          data: {
            ...updatedData,
          },
          where: {
            userId: userInfo.userId,
          },
        });

        // 변경된 필드만 UseHistories 테이블에 저장합니다.
        for (let key in updatedData) {
          if (userInfo[key] !== updatedData[key]) {
            await tx.userHistories.create({
              data: {
                userId: userInfo.userId,
                changedField: key,
                oldValue: String(userInfo[key]),
                newValue: String(updatedData[key]),
              },
            });
          }
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    return res
      .status(200)
      .json({ message: "사용자 정보 변경에 성공하였습니다." });
  } catch (err) {
    next(err);
  }
});

export default router;

/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "user_id" SERIAL NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");

-- CreateTable
CREATE TABLE "books" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "borrower" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrowers" (
    "id" SERIAL NOT NULL,
    "book_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "borrowers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "books_title_key" ON "books"("title");

-- CreateIndex
CREATE INDEX "status" ON "books"("status");

-- CreateIndex
CREATE INDEX "borrower" ON "books"("borrower");

-- CreateIndex
CREATE INDEX "book_id" ON "borrowers"("book_id");

-- CreateIndex
CREATE INDEX "user_id" ON "borrowers"("user_id");

-- CreateIndex
CREATE INDEX "role" ON "users"("role");

-- CreateIndex
CREATE INDEX "username" ON "users"("username");

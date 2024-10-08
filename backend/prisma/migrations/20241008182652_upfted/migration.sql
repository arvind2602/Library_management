/*
  Warnings:

  - You are about to drop the `Borrower` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Borrower" DROP CONSTRAINT "Borrower_book_id_fkey";

-- DropForeignKey
ALTER TABLE "Borrower" DROP CONSTRAINT "Borrower_user_id_fkey";

-- DropTable
DROP TABLE "Borrower";

-- CreateTable
CREATE TABLE "borrower" (
    "id" SERIAL NOT NULL,
    "book_id" INTEGER NOT NULL,
    "taken" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returned" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "borrower_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "borrower" ADD CONSTRAINT "borrower_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrower" ADD CONSTRAINT "borrower_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

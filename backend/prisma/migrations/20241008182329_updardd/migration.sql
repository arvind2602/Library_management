/*
  Warnings:

  - You are about to drop the column `bookId` on the `Borrower` table. All the data in the column will be lost.
  - Added the required column `book_id` to the `Borrower` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Borrower" DROP CONSTRAINT "Borrower_bookId_fkey";

-- AlterTable
ALTER TABLE "Borrower" DROP COLUMN "bookId",
ADD COLUMN     "book_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Borrower" ADD CONSTRAINT "Borrower_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

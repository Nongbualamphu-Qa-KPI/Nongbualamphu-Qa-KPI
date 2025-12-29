import { prisma } from "./prisma";
import type { QARecord as PrismaQARecord } from "@prisma/client";

// Define the shape that the frontend expects
export type QARecord = {
  id: string;
  departmentId: string;
  departmentName: string;
  fiscalYear: string;
  month: string;
  data: Record<string, string>;
  updatedAt: string;
};

// Helper to convert Prisma result to our frontend type
function mapToQARecord(r: PrismaQARecord): QARecord {
  return {
    id: r.id,
    departmentId: r.departmentId,
    departmentName: r.departmentName,
    fiscalYear: r.fiscalYear.toString(),
    month: r.month,
    data: (r.data as Record<string, string>) || {},
    updatedAt: r.updatedAt.toISOString(),
  };
}

// Save or update a record
export async function saveRecord(
  departmentId: string,
  departmentName: string,
  fiscalYear: string,
  month: string,
  data: Record<string, string>
): Promise<QARecord> {
  const yearInt = parseInt(fiscalYear, 10);

  // Upsert using the unique compound index
  const result = await prisma.qARecord.upsert({
    where: {
      qa_unique_index: {
        departmentId,
        fiscalYear: yearInt,
        month,
      },
    },
    update: {
      departmentName,
      data,
    },
    create: {
      departmentId,
      departmentName,
      fiscalYear: yearInt,
      month,
      data,
    },
  });

  return mapToQARecord(result);
}

// Get record by period
export async function getRecordByPeriod(
  departmentId: string,
  fiscalYear: string,
  month: string
): Promise<QARecord | null> {
  const result = await prisma.qARecord.findUnique({
    where: {
      qa_unique_index: {
        departmentId,
        fiscalYear: parseInt(fiscalYear, 10),
        month,
      },
    },
  });

  return result ? mapToQARecord(result) : null;
}

// Get records by year
export async function getRecordsByYear(
  departmentId: string,
  fiscalYear: string
): Promise<QARecord[]> {
  const results = await prisma.qARecord.findMany({
    where: {
      departmentId,
      fiscalYear: parseInt(fiscalYear, 10),
    },
    orderBy: {
      month: "asc",
      // Note: Thai months sorting might need specific logic if 'asc' isn't chronological, 
      // but usually the frontend handles display order or we rely on insertion/mapped order.
    },
  });

  return results.map(mapToQARecord);
}

// Delete a record
export async function deleteRecord(
  departmentId: string,
  fiscalYear: string,
  month: string
): Promise<boolean> {
  try {
    await prisma.qARecord.delete({
      where: {
        qa_unique_index: {
          departmentId,
          fiscalYear: parseInt(fiscalYear, 10),
          month,
        },
      },
    });
    return true;
  } catch (error) {
    // Record not found or other error
    return false;
  }
}

// Get all records
export async function getAllRecords(): Promise<QARecord[]> {
  const results = await prisma.qARecord.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });
  return results.map(mapToQARecord);
}

// Get records by department
export async function getRecordsByDepartment(departmentId: string): Promise<QARecord[]> {
  const results = await prisma.qARecord.findMany({
    where: {
      departmentId,
    },
    orderBy: {
      fiscalYear: "desc",
    },
  });
  return results.map(mapToQARecord);
}
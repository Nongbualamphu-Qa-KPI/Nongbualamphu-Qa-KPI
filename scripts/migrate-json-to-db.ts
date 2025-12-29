
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const dataPath = path.join(process.cwd(), "data", "qa-data.json");

    if (!fs.existsSync(dataPath)) {
        console.log("No data file found at", dataPath);
        return;
    }

    console.log("Reading data from", dataPath);
    const content = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(content);

    const records = data.records || [];
    console.log(`Found ${records.length} records to migrate.`);

    for (const r of records) {
        try {
            const yearInt = parseInt(r.fiscalYear, 10);

            await prisma.qARecord.upsert({
                where: {
                    qa_unique_index: {
                        departmentId: r.departmentId,
                        fiscalYear: yearInt,
                        month: r.month,
                    },
                },
                update: {
                    departmentName: r.departmentName,
                    data: r.data,
                    updatedAt: new Date(r.updatedAt),
                },
                create: {
                    departmentId: r.departmentId,
                    departmentName: r.departmentName,
                    fiscalYear: yearInt,
                    month: r.month,
                    data: r.data,
                    createdAt: new Date(r.updatedAt), // Use updated as created for migration
                    updatedAt: new Date(r.updatedAt),
                },
            });
            process.stdout.write(".");
        } catch (e) {
            console.error(`\nFailed to migrate record ${r.departmentId} ${r.fiscalYear} ${r.month}:`, e);
        }
    }

    console.log("\nMigration completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

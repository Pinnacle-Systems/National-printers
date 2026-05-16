import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const modules = await prisma.approvalRuleModule.findMany();
  console.log('Modules:', modules);
  
  const configs = await prisma.approvalConfig.findMany({
    include: {
      Module: true
    }
  });
  console.log('Configs:', configs.map(c => ({ id: c.id, module: c.Module.name, active: c.active, branchId: c.branchId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
